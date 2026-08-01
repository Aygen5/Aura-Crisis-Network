using Aura.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.BackgroundJobs;

public class KandilliBackgroundWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<KandilliBackgroundWorker> _logger;
    private readonly TimeSpan _period = TimeSpan.FromSeconds(60);

    public KandilliBackgroundWorker(
        IServiceProvider serviceProvider,
        ILogger<KandilliBackgroundWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_period);

        await ProcessLatestEarthquakesAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await ProcessLatestEarthquakesAsync(stoppingToken);
        }
    }

    private async Task ProcessLatestEarthquakesAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var ingestionService = scope.ServiceProvider.GetRequiredService<IKandilliIngestionService>();
            var eventRepository = scope.ServiceProvider.GetRequiredService<IEventRepository>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var notificationService = scope.ServiceProvider.GetService<ICrisisNotificationService>();

            var liveEvents = await ingestionService.FetchLatestEarthquakesAsync(cancellationToken);
            if (liveEvents.Count == 0) return;

            var existingEvents = await eventRepository.GetActiveEventsAsync(cancellationToken);

            var newEvents = new List<Domain.Entities.Event>();
            foreach (var liveEvent in liveEvents)
            {
                bool exists = existingEvents.Any(e =>
                    e.Source == liveEvent.Source &&
                    e.Metric == liveEvent.Metric &&
                    Math.Abs((e.DetectedAt - liveEvent.DetectedAt).TotalSeconds) < 10 &&
                    Math.Abs(e.Location.Latitude - liveEvent.Location.Latitude) < 0.001 &&
                    Math.Abs(e.Location.Longitude - liveEvent.Location.Longitude) < 0.001);

                if (!exists)
                {
                    await eventRepository.AddAsync(liveEvent, cancellationToken);
                    newEvents.Add(liveEvent);
                }
            }

            if (newEvents.Count > 0)
            {
                await unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Kandilli ingestion processed {Count} new earthquake events.", newEvents.Count);

                if (notificationService != null)
                {
                    foreach (var newEv in newEvents)
                    {
                        await notificationService.NotifyEventCreatedAsync(newEv, cancellationToken);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during Kandilli earthquake ingestion execution.");
        }
    }
}
