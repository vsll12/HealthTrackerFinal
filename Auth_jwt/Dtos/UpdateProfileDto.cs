namespace Auth_jwt.Dtos
{
	public class UpdateProfileDto
	{
		public string? Name { get; set; }
		public int Age { get; set; }
		public double Weight { get; set; }
		public double Height { get; set; }
		public IFormFile? File { get; set; }
	}
}
