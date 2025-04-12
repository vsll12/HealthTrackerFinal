using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Auth_jwt.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class CaloriesChartController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly ILogger<CaloriesChartController> _logger;

		public CaloriesChartController(ApplicationDbContext context, ILogger<CaloriesChartController> logger)
		{
			_context = context;
			_logger = logger;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<CalorieData>>> GetWeeklyCalories()
		{
			try
			{
				var userId = GetCurrentUserId();
				var startOfWeek = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
				var endOfWeek = startOfWeek.AddDays(7).AddSeconds(-1);

				var weeklyCalories = await _context.CalorieData
					.Where(s => s.UserId == userId && s.Date >= startOfWeek && s.Date <= endOfWeek)
					.OrderBy(s => s.Date)
					.ToListAsync();

				if (weeklyCalories.Count == 0)
				{
					var emptyCalories = Enumerable.Range(0, 7)
						.Select(i => new CalorieData
						{
							UserId = userId,
							Date = startOfWeek.AddDays(i),
							DayOfWeek = startOfWeek.AddDays(i).DayOfWeek.ToString(),
							Calories = 0,
							CreatedAt = DateTime.UtcNow,
							UpdatedAt = DateTime.UtcNow
						})
						.ToList();

					_context.CalorieData.AddRange(emptyCalories);
					await _context.SaveChangesAsync();

					return Ok(emptyCalories);
				}

				return Ok(weeklyCalories);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Haftalık adım verisi alınırken hata oluştu");
				return StatusCode(500, "Haftalık adım verileri alınırken bir hata oluştu");
			}
		}

		[HttpPost]
		public async Task<ActionResult<CalorieData>> AddCalories(CalorieDataDto calorieDataDto)
		{
			try
			{
				if (calorieDataDto.Calories < 0)
				{
					return BadRequest("Adım sayısı negatif olamaz");
				}

				var userId = GetCurrentUserId();
				var today = DateTime.Today;

				var existingEntry = await _context.CalorieData
					.FirstOrDefaultAsync(s => s.UserId == userId && s.Date.Date == today);

				if (existingEntry != null)
				{
					existingEntry.Calories = calorieDataDto.Calories;
					existingEntry.UpdatedAt = DateTime.UtcNow;

					_context.CalorieData.Update(existingEntry);
					await _context.SaveChangesAsync();

					return Ok(existingEntry);
				}
				else
				{
					var newCalorieData = new CalorieData
					{
						UserId = userId,
						Date = today,
						DayOfWeek = today.DayOfWeek.ToString(),
						Calories = calorieDataDto.Calories,
						CreatedAt = DateTime.UtcNow,
						UpdatedAt = DateTime.UtcNow
					};

					_context.CalorieData.Add(newCalorieData);
					await _context.SaveChangesAsync();

					return CreatedAtAction(nameof(GetWeeklyCalories), new { id = newCalorieData.Id }, newCalorieData);
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Adım verisi eklenirken hata oluştu");
				return StatusCode(500, "Adım verisi kaydedilirken bir hata oluştu");
			}
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateCalories(int id, CalorieDataDto calorieDataDto)
		{
			try
			{
				if (calorieDataDto.Calories < 0)
				{
					return BadRequest("Step count cannot be negative");
				}

				var userId = GetCurrentUserId();

				var calorieData = await _context.CalorieData
					.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

				if (calorieData == null)
				{
					return NotFound();
				}

				calorieData.Calories = calorieDataDto.Calories;
				calorieData.UpdatedAt = DateTime.UtcNow;

				_context.CalorieData.Update(calorieData);
				await _context.SaveChangesAsync();

				return NoContent();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating step data");
				return StatusCode(500, "An error occurred while updating step data");
			}
		}

		private string GetCurrentUserId()
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
