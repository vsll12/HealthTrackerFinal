namespace Auth_jwt.Models
{
	public class CalorieData
	{
		public int Id { get; set; }
		public string UserId { get; set; }
		public DateTime Date { get; set; }
		public string DayOfWeek { get; set; }
		public double Calories { get; set; }
		public DateTime CreatedAt { get; set; }
		public DateTime UpdatedAt { get; set; }
	}
}
