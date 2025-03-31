using Auth_jwt.Data;

namespace Auth_jwt.Models
{
	public class Message
	{
		public int Id { get; set; }
		public string SenderId { get; set; }
		public string ReceiverId { get; set; }
		public string Content { get; set; } = string.Empty;
		public DateTime Timestamp { get; set; } = DateTime.UtcNow;

		public ApplicationUser Sender { get; set; }
		public ApplicationUser Receiver { get; set; }

	}
}
