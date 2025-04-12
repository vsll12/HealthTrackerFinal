namespace Auth_jwt.Models.WaterIntake
{
	public class WaterIntake
	{
		public int Id { get; set; }
		public string UserId { get; set; }
		public DateTime Date { get; set; }
		public int AmountInMilliliters { get; set; }
	}
}
