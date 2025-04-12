namespace Auth_jwt.Models.WaterIntake
{
	public class WeeklyReport
	{
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public List<DailySummary> DailySummaries { get; set; }
		public int WeeklyTotal { get; set; }
		public double WeeklyAverage { get; set; }
	}
}
