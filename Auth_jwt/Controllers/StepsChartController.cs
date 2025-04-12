using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Auth_jwt.Controllers
{
	[Authorize]
	[Route("api/[controller]")]
	[ApiController]
	public class StepsChartController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly ILogger<StepsChartController> _logger;

		public StepsChartController(
			ApplicationDbContext context,
			UserManager<ApplicationUser> userManager,
			ILogger<StepsChartController> logger)
		{
			_context = context;
			_userManager = userManager;
			_logger = logger;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<StepData>>> GetWeeklySteps()
		{
			try
			{
				var userId = GetCurrentUserId();
				if (string.IsNullOrEmpty(userId))
				{
					_logger.LogWarning("User ID not found in token.");
					return Unauthorized("Kullanıcı kimliği bulunamadı.");
				}

				var startOfWeek = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
				var endOfWeek = startOfWeek.AddDays(7).AddSeconds(-1);

				var weeklySteps = await _context.StepData
					.Where(s => s.UserId == userId && s.Date >= startOfWeek && s.Date <= endOfWeek)
					.OrderBy(s => s.Date)
					.Select(s => new
					{
						s.Id,
						s.UserId,
						s.Date,
						DayOfWeek = s.DayOfWeek, // Consistent with frontend
						s.Steps,
						s.CreatedAt,
						s.UpdatedAt
					})
					.ToListAsync();

				if (weeklySteps.Count == 0)
				{
					var emptySteps = Enumerable.Range(0, 7)
						.Select(i => new StepData
						{
							UserId = userId,
							Date = startOfWeek.AddDays(i),
							DayOfWeek = startOfWeek.AddDays(i).DayOfWeek.ToString(),
							Steps = 0,
							CreatedAt = DateTime.UtcNow,
							UpdatedAt = DateTime.UtcNow
						})
						.ToList();

					_context.StepData.AddRange(emptySteps);
					await _context.SaveChangesAsync();

					return Ok(emptySteps);
				}

				return Ok(weeklySteps);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Haftalık adım verisi alınırken hata oluştu.");
				return StatusCode(500, "Haftalık adım verileri alınamadı: " + ex.Message);
			}
		}

		[HttpPost]
		public async Task<ActionResult<StepData>> AddSteps([FromBody] StepDataDto stepDataDto)
		{
			try
			{
				if (stepDataDto == null || stepDataDto.Steps < 0)
				{
					return BadRequest("Adım sayısı geçersiz veya negatif olamaz.");
				}

				var userId = GetCurrentUserId();
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized("Kullanıcı kimliği bulunamadı.");
				}

				var today = DateTime.Today;
				var existingEntry = await _context.StepData
					.FirstOrDefaultAsync(s => s.UserId == userId && s.Date.Date == today);

				if (existingEntry != null)
				{
					existingEntry.Steps = stepDataDto.Steps;
					existingEntry.UpdatedAt = DateTime.UtcNow;
					_context.StepData.Update(existingEntry);
				}
				else
				{
					var newStepData = new StepData
					{
						UserId = userId,
						Date = today,
						DayOfWeek = today.DayOfWeek.ToString(),
						Steps = stepDataDto.Steps,
						CreatedAt = DateTime.UtcNow,
						UpdatedAt = DateTime.UtcNow
					};
					_context.StepData.Add(newStepData);
				}

				await _context.SaveChangesAsync();
				return existingEntry != null
					? Ok(existingEntry)
					: CreatedAtAction(nameof(GetWeeklySteps), new { id = existingEntry?.Id }, existingEntry);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Adım verisi eklenirken hata oluştu.");
				return StatusCode(500, "Adım verisi kaydedilemedi: " + ex.Message);
			}
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateSteps(int id, [FromBody] StepDataDto stepDataDto)
		{
			try
			{
				if (stepDataDto == null || stepDataDto.Steps < 0)
				{
					return BadRequest("Adım sayısı geçersiz veya negatif olamaz.");
				}

				var userId = GetCurrentUserId();
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized("Kullanıcı kimliği bulunamadı.");
				}

				var stepData = await _context.StepData
					.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

				if (stepData == null)
				{
					return NotFound("Adım verisi bulunamadı.");
				}

				stepData.Steps = stepDataDto.Steps;
				stepData.UpdatedAt = DateTime.UtcNow;
				_context.StepData.Update(stepData);
				await _context.SaveChangesAsync();

				return NoContent();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Adım verisi güncellenirken hata oluştu.");
				return StatusCode(500, "Adım verisi güncellenemedi: " + ex.Message);
			}
		}

		private string GetCurrentUserId()
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			return userId; // Return null if not found, handle in caller
		}
	}
}