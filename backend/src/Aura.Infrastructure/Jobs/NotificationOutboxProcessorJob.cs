using System.Text.Json;
using Aura.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.Jobs;

public class NotificationOutboxProcessorJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationOutboxProcessorJob> _logger;
    private readonly TimeSpan _period = TimeSpan.FromSeconds(5);

    public NotificationOutboxProcessorJob(
        IServiceProvider serviceProvider,
        ILogger<NotificationOutboxProcessorJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_period);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessOutboxMessagesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing Notification Outbox messages.");
            }
        }
    }

    private async Task ProcessOutboxMessagesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var outboxRepository = scope.ServiceProvider.GetRequiredService<IOutboxRepository>();
        var notificationDispatcher = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var pendingMessages = await outboxRepository.GetPendingMessagesAsync(20, cancellationToken);
        if (pendingMessages.Count == 0) return;

        _logger.LogInformation("Processing {Count} pending outbox notification messages.", pendingMessages.Count);

        foreach (var message in pendingMessages)
        {
            try
            {
                using var document = JsonDocument.Parse(message.PayloadJson);
                var root = document.RootElement;

                var recipientUserId = root.GetProperty("RecipientUserId").GetString() ?? "System";
                var title = root.GetProperty("Title").GetString() ?? "Notification";
                var body = root.GetProperty("Message").GetString() ?? string.Empty;
                var payloadJson = root.TryGetProperty("PayloadJson", out var p) ? p.GetString() : null;

                await notificationDispatcher.DispatchAsync(recipientUserId, title, body, payloadJson, cancellationToken);

                message.MarkProcessed();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process outbox message {Id}", message.Id);
                message.MarkFailed(ex.Message);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
