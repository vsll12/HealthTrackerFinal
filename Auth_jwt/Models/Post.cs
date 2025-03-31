using Auth_jwt.Data;

namespace Auth_jwt.Models
{
	public class Post
	{
		public int Id { get; set; }
		public string UserId { get; set; }  
		public string Content { get; set; } = string.Empty;
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		public ApplicationUser User { get; set; }
	}
}
