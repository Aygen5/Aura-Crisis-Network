using Aura.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.BackgroundJobs;

public class MeteorologyBackgroundWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MeteorologyBackgroundWorker> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(30);
    private readonly TimeSpan _initialDelay = TimeSpan.FromSeconds(15);

    public MeteorologyBackgroundWorker(
        IServiceProvider serviceProvider,
        ILogger<MeteorologyBackgroundWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(_initialDelay, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        using var timer = new PeriodicTimer(_period);

        await UpdateMeteorologyRisksAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await UpdateMeteorologyRisksAsync(stoppingToken);
        }
    }

    private async Task UpdateMeteorologyRisksAsync(CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested) return;

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var meteorologyService = scope.ServiceProvider.GetRequiredService<IMeteorologyService>();

            await meteorologyService.FetchAndUpdateDistrictWeatherRisksAsync(cancellationToken);
            _logger.LogInformation("Meteorology background worker updated district weather risk scores.");
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Meteorology background worker execution cancelled gracefully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during meteorology risk update execution.");
        }
    }
}
