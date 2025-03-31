using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Auth_jwt.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChartDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChartDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChartData>>> GetChartData()
        {
            try
            {
                var chartData = await _context.ChartData
                    .Select(c => new
                    {
                        dayOfWeek = c.DayOfWeek,
                        value1 = c.Value
                    })
                    .ToListAsync();

                if (chartData == null || !chartData.Any())
                {
                    return NotFound("No chart data found.");
                }

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> PostChartData([FromBody] ChartDataRequestDto request)
        {
            if (request.DaysOfWeek.Count == 0 || request.Values.Count == 0 || request.DaysOfWeek.Count != request.Values.Count)
            {
                return BadRequest("Days and values must have the same count and not be empty.");
            }

            var existingData = await _context.ChartData.ToListAsync();

            foreach (var (day, value) in request.DaysOfWeek.Zip(request.Values, Tuple.Create))
            {
                if (existingData.Any(x => x.DayOfWeek == day))
                {
                    return BadRequest($"Data for {day} already exists.");
                }
            }

            for (int i = 0; i < request.DaysOfWeek.Count; i++)
            {
                var newData = new ChartData
                {
                    DayOfWeek = request.DaysOfWeek[i],
                    Value = request.Values[i]
                };
                _context.ChartData.Add(newData);
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(PostChartData), new { message = "Chart data added successfully." });
        }
    }
}
