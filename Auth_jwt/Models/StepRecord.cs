using Auth_jwt.Data;

namespace Auth_jwt.Models
{
	public class StepRecord
	{
		public int Id { get; set; }
		public string UserId { get; set; }
		public int Steps { get; set; }
		public DateTime Date { get; set; } = DateTime.UtcNow;

		public ApplicationUser User { get; set; }
	}
}
