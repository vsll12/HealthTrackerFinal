using Auth_jwt.Data;

public class DailyResetService : BackgroundService
{
	private readonly IServiceProvider _services;
	private readonly ILogger<DailyResetService> _logger;

	public DailyResetService(IServiceProvider services, ILogger<DailyResetService> logger)
	{
		_services = services;
		_logger = logger;
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		while (!stoppingToken.IsCancellationRequested)
		{
			var now = DateTime.Now;
			var nextRun = now.Date.AddDays(1).AddMinutes(1);

			var delay = nextRun - now;
			_logger.LogInformation($"Next reset scheduled for: {nextRun}");

			await Task.Delay(delay, stoppingToken);

			if (!stoppingToken.IsCancellationRequested)
			{
				await ResetDailyIntakes();
			}
		}
	}

	private async Task ResetDailyIntakes()
	{
		using var scope = _services.CreateScope();
		var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

		_logger.LogInformation("Daily reset executed at: {time}", DateTime.Now);
	}
}