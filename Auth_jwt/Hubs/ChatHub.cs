using Auth_jwt.Data;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace Auth_jwt.Hubs
{
	[Authorize]
	public class ChatHub : Hub
	{
		private readonly ApplicationDbContext _context;
		private static readonly ConcurrentDictionary<string, string> _userConnections = new();

		public ChatHub(ApplicationDbContext context)
		{
			_context = context;
		}

		public override async Task OnConnectedAsync()
		{
			string userId = Context.UserIdentifier;
			if (!string.IsNullOrEmpty(userId))
			{
				_userConnections[userId] = Context.ConnectionId;
				await Groups.AddToGroupAsync(Context.ConnectionId, "Forum"); // Join forum group
			}
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			string userId = Context.UserIdentifier;
			if (!string.IsNullOrEmpty(userId))
			{
				_userConnections.TryRemove(userId, out _);
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Forum"); // Leave forum group
			}
			await base.OnDisconnectedAsync(exception);
		}

		public async Task SendForumPost(string userId, string content, string fileUrl)
		{
			try
			{
				// Validate that the post has either content or a file
				if (string.IsNullOrEmpty(content) && string.IsNullOrEmpty(fileUrl))
				{
					throw new HubException("Post must have content or a file.");
				}

				// Ensure the userId matches the authenticated user
				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				var post = new ForumPost
				{
					UserId = userId,
					Content = content ?? "",
					FileUrl = fileUrl, // Accept as-is (null or full URL from controller)
					Timestamp = DateTime.UtcNow
				};

				_context.ForumPosts.Add(post);
				await _context.SaveChangesAsync();

				var user = await _context.Users.FindAsync(userId);
				var response = new
				{
					post.Id,
					UserId = post.UserId,
					UserName = user?.UserName ?? "Unknown",
					post.Content,
					FileUrl = post.FileUrl, // Pass as-is, let client/controller handle URL
					Timestamp = post.Timestamp.ToString("o") // Consistent ISO format
				};

				Console.WriteLine($"Broadcasting post: Id={post.Id}, Content={post.Content}, FileUrl={post.FileUrl ?? "null"}");
				await Clients.Group("Forum").SendAsync("ReceiveForumPost", response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in SendForumPost: {ex.Message}");
				throw new HubException($"Failed to send forum post: {ex.Message}");
			}
		}

		// Existing Chat Methods (Corrected for Consistency)
		public async Task SendMessage(string senderId, string receiverId, string message)
		{
			try
			{
				if (string.IsNullOrEmpty(message))
				{
					throw new HubException("Message content cannot be empty.");
				}

				if (senderId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: Sender ID does not match authenticated user.");
				}

				var timestamp = DateTime.UtcNow.ToString("o");
				var dbMessage = new Message
				{
					SenderId = senderId,
					ReceiverId = receiverId,
					Content = message,
					Timestamp = DateTime.Parse(timestamp),
					Status = "sent"
				};

				_context.Messages.Add(dbMessage);
				await _context.SaveChangesAsync();

				var response = new
				{
					SenderId = dbMessage.SenderId,
					Message = dbMessage.Content,
					Timestamp = timestamp,
					Status = dbMessage.Status,
					Id = dbMessage.Id
				};

				if (_userConnections.TryGetValue(receiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", response.SenderId, response.Message, response.Timestamp, "delivered", response.Id);
				}
				await Clients.Caller.SendAsync("ReceiveMessage", response.SenderId, response.Message, response.Timestamp, response.Status, response.Id);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in SendMessage: {ex.Message}");
				throw new HubException($"Failed to send message: {ex.Message}");
			}
		}

		public async Task UpdateMessage(int messageId, string newContent)
		{
			try
			{
				if (string.IsNullOrEmpty(newContent))
				{
					throw new HubException("New content cannot be empty.");
				}

				var message = await _context.Messages.FindAsync(messageId);
				if (message == null || message.SenderId != Context.UserIdentifier)
				{
					throw new HubException("Message not found or you don’t have permission to update it.");
				}

				message.Content = newContent;
				message.Timestamp = DateTime.UtcNow;
				await _context.SaveChangesAsync();

				var timestamp = message.Timestamp.ToString("o");
				if (_userConnections.TryGetValue(message.ReceiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("MessageUpdated", messageId, newContent, timestamp);
				}
				await Clients.Caller.SendAsync("MessageUpdated", messageId, newContent, timestamp);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in UpdateMessage: {ex.Message}");
				throw new HubException($"Failed to update message: {ex.Message}");
			}
		}

		public async Task DeleteMessage(int messageId)
		{
			try
			{
				var message = await _context.Messages.FindAsync(messageId);
				if (message == null || message.SenderId != Context.UserIdentifier)
				{
					throw new HubException("Message not found or you don’t have permission to delete it.");
				}

				_context.Messages.Remove(message);
				await _context.SaveChangesAsync();

				if (_userConnections.TryGetValue(message.ReceiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("MessageDeleted", messageId);
				}
				await Clients.Caller.SendAsync("MessageDeleted", messageId);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in DeleteMessage: {ex.Message}");
				throw new HubException($"Failed to delete message: {ex.Message}");
			}
		}

		public async Task NotifyTyping(string senderId, string receiverId)
		{
			try
			{
				if (senderId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: Sender ID does not match authenticated user.");
				}

				if (_userConnections.TryGetValue(receiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("UserTyping", senderId);
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in NotifyTyping: {ex.Message}");
				throw new HubException($"Failed to notify typing: {ex.Message}");
			}
		}

		public async Task JoinChat(string userId, string friendId)
		{
			try
			{
				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				string groupName = GetGroupName(userId, friendId);
				await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
				Console.WriteLine($"User {userId} joined chat group: {groupName}");
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in JoinChat: {ex.Message}");
				throw new HubException($"Failed to join chat: {ex.Message}");
			}
		}

		public async Task LeaveChat(string userId, string friendId)
		{
			try
			{
				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				string groupName = GetGroupName(userId, friendId);
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
				Console.WriteLine($"User {userId} left chat group: {groupName}");
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in LeaveChat: {ex.Message}");
				throw new HubException($"Failed to leave chat: {ex.Message}");
			}
		}

		private static string GetGroupName(string user1, string user2)
		{
			return string.Compare(user1, user2, StringComparison.Ordinal) < 0
				? $"{user1}_{user2}"
				: $"{user2}_{user1}";
		}
	}
}