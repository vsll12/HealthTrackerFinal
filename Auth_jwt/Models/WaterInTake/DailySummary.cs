namespace Auth_jwt.Models.WaterIntake
{
	public class DailySummary
	{
		public DateTime Date { get; set; }
		public int TotalIntake { get; set; }
		public int Goal { get; set; }
		public bool GoalAchieved { get; set; }
	}
}
