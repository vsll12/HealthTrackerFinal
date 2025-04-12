using Auth_jwt.Data;
using Auth_jwt.Models.WaterIntake;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Auth_jwt.Controllers
{
	[Authorize]
	[Route("api/[controller]")]
	[ApiController]
	public class WaterIntakeController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private const int DailyGoal = 2000;

		public WaterIntakeController(ApplicationDbContext context)
		{
			_context = context;
		}

		[HttpPost]
		public async Task<IActionResult> AddWaterIntake([FromBody] int amountInMilliliters)
		{
			var userId = GetUserId();
			var today = DateTime.Today;

			var existingEntry = await _context.WaterIntakes
				.FirstOrDefaultAsync(w => w.UserId == userId && w.Date == today);

			if (existingEntry != null)
			{
				existingEntry.AmountInMilliliters += amountInMilliliters;
			}
			else
			{
				var newEntry = new WaterIntake
				{
					UserId = userId,
					Date = today,
					AmountInMilliliters = amountInMilliliters
				};
				_context.WaterIntakes.Add(newEntry);
			}

			await _context.SaveChangesAsync();
			return Ok();
		}

		[HttpGet("today")]
		public async Task<ActionResult<DailySummary>> GetTodayIntake()
		{
			var userId = GetUserId();
			var today = DateTime.Today;

			var intake = await _context.WaterIntakes
				.FirstOrDefaultAsync(w => w.UserId == userId && w.Date == today);

			var total = intake?.AmountInMilliliters ?? 0;

			return new DailySummary
			{
				Date = today,
				TotalIntake = total,
				Goal = DailyGoal,
				GoalAchieved = total >= DailyGoal
			};
		}

		[HttpGet("weekly")]
		public async Task<ActionResult<WeeklyReport>> GetWeeklyReport()
		{
			var userId = GetUserId();
			var today = DateTime.Today;
			var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
			var endOfWeek = startOfWeek.AddDays(6);

			var weeklyData = await _context.WaterIntakes
				.Where(w => w.UserId == userId && w.Date >= startOfWeek && w.Date <= endOfWeek)
				.ToListAsync();

			var dailySummaries = new List<DailySummary>();
			for (var day = startOfWeek; day <= endOfWeek; day = day.AddDays(1))
			{
				var dayIntake = weeklyData.FirstOrDefault(w => w.Date == day)?.AmountInMilliliters ?? 0;

				dailySummaries.Add(new DailySummary
				{
					Date = day,
					TotalIntake = dayIntake,
					Goal = DailyGoal,
					GoalAchieved = dayIntake >= DailyGoal
				});
			}

			var weeklyTotal = dailySummaries.Sum(d => d.TotalIntake);
			var weeklyAverage = weeklyTotal / 7.0;

			return new WeeklyReport
			{
				StartDate = startOfWeek,
				EndDate = endOfWeek,
				DailySummaries = dailySummaries,
				WeeklyTotal = weeklyTotal,
				WeeklyAverage = weeklyAverage
			};
		}

		private string GetUserId()
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (userId == null)
			{
				throw new Exception("User ID not found");
			}
			return userId;
		}
	}
}
