using Auth_jwt.Data;
using Microsoft.EntityFrameworkCore;

public class LeaderboardService
{
	private readonly ApplicationDbContext _context;

	public LeaderboardService(ApplicationDbContext context)
	{
		_context = context;
	}

	public async Task<List<ApplicationUser>> GetTopUsersBySteps()
	{
		return await _context.Users
			.OrderByDescending(u => u.StepRecords.Sum(s => s.Steps))
			.Take(10)
			.ToListAsync();
	}
}