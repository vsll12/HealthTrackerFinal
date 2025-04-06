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

		[HttpGet("{userId}/{friendId}")]
		public async Task<IActionResult> GetMessages(string userId, string friendId, int page = 1, int pageSize = 50)
		{
			var messages = await _context.Messages
				.Where(m => (m.SenderId == userId && m.ReceiverId == friendId) ||
							(m.SenderId == friendId && m.ReceiverId == userId))
				.OrderBy(m => m.Timestamp)
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.Select(m => new
				{
					m.Id, // Add this
					m.SenderId,
					m.ReceiverId,
					Content = m.Content,
					m.Timestamp,
					m.Status
				})
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
