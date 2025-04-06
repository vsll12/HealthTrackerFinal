using Auth_jwt.Data;
using System.ComponentModel.DataAnnotations;

namespace Auth_jwt.Models
{
	public class Message
	{
		public int Id { get; set; }

		[Required]
		public string SenderId { get; set; }

		[Required]
		public string ReceiverId { get; set; }

		[Required]
		public string Content { get; set; } = string.Empty;

		public DateTime Timestamp { get; set; } = DateTime.UtcNow;

		public string Status { get; set; } = "sent"; 

		public ApplicationUser Sender { get; set; }
		public ApplicationUser Receiver { get; set; }
	}
}