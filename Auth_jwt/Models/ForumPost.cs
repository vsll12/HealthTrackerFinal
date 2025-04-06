using Auth_jwt.Data;

namespace Auth_jwt.Models
{
	public class ForumPost
	{
		public int Id { get; set; }
		public string UserId { get; set; }
		public string Content { get; set; }
		public string FileUrl { get; set; } // Nullable string
		public DateTime Timestamp { get; set; }

		public ApplicationUser User { get; set; }
	}
}