namespace Auth_jwt.Dtos
{
	public class ForumPostDto
	{
		public string UserId { get; set; }
		public string Content { get; set; }
		public IFormFile? File { get; set; } // Nullable, optional file
	}
}