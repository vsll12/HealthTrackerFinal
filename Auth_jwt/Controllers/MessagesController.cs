using Auth_jwt.Data;
using Auth_jwt.Models;
using Auth_jwt.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Auth_jwt.Controllers
{
	[Route("api/messages")]
	[ApiController]
	public class MessagesController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly IHubContext<ChatHub> _chatHub;

		public MessagesController(ApplicationDbContext context, IHubContext<ChatHub> chatHub)
		{
			_context = context;
			_chatHub = chatHub;
		}

		[HttpPost]
		public async Task<IActionResult> SendMessage([FromBody] Message message)
		{
			if (message == null || string.IsNullOrEmpty(message.SenderId) || string.IsNullOrEmpty(message.ReceiverId) || string.IsNullOrEmpty(message.Content))
			{
				return BadRequest("Invalid message data.");
			}

			message.Timestamp = DateTime.UtcNow;
			_context.Messages.Add(message);
			await _context.SaveChangesAsync();

			// Notify the receiver via SignalR
			await _chatHub.Clients.User(message.ReceiverId)
				.SendAsync("ReceiveMessage", message.SenderId, message.Content, message.Timestamp);

			return Ok(new { messageId = message.Id, timestamp = message.Timestamp });
		}

		[HttpGet("{userId}/{friendId}")]
		public async Task<IActionResult> GetMessages(string userId, string friendId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
		{
			if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(friendId))
			{
				return BadRequest("Invalid user or friend ID.");
			}

			var messages = await _context.Messages
				.Where(m => (m.SenderId == userId && m.ReceiverId == friendId) ||
							(m.SenderId == friendId && m.ReceiverId == userId))
				.OrderByDescending(m => m.Timestamp)
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			return Ok(messages);
		}

		[HttpDelete("{messageId}")]
		public async Task<IActionResult> DeleteMessage(int messageId)
		{
			var message = await _context.Messages.FindAsync(messageId);
			if (message == null)
			{
				return NotFound("Message not found.");
			}

			_context.Messages.Remove(message);
			await _context.SaveChangesAsync();
			return Ok("Message deleted successfully.");
		}
	}
}
