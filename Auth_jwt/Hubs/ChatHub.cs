using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Auth_jwt.Hubs
{
	public class ChatHub : Hub
	{
		private static readonly ConcurrentDictionary<string, string> _userConnections = new();

		public override async Task OnConnectedAsync()
		{
			string userId = Context.UserIdentifier;
			if (!string.IsNullOrEmpty(userId))
			{
				_userConnections[userId] = Context.ConnectionId;
			}
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			string userId = Context.UserIdentifier;
			if (!string.IsNullOrEmpty(userId))
			{
				_userConnections.TryRemove(userId, out _);
			}
			await base.OnDisconnectedAsync(exception);
		}

		public async Task SendMessage(string senderId, string receiverId, string message)
		{
			var timestamp = DateTime.UtcNow;
			if (_userConnections.TryGetValue(receiverId, out var receiverConnectionId))
			{
				await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", senderId, message, timestamp);
			}
			await Clients.Caller.SendAsync("ReceiveMessage", senderId, message, timestamp);
		}

		public async Task JoinChat(string userId, string friendId)
		{
			string groupName = GetGroupName(userId, friendId);
			await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
		}

		public async Task LeaveChat(string userId, string friendId)
		{
			string groupName = GetGroupName(userId, friendId);
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
		}

		private static string GetGroupName(string user1, string user2)
		{
			return string.Compare(user1, user2, StringComparison.Ordinal) < 0
				? $"{user1}_{user2}"
				: $"{user2}_{user1}";
		}
	}
}