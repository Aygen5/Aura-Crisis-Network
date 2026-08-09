using Aura.Application.Common.Interfaces;
using Aura.Application.Events.Commands.EscalateEvent;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aura.UnitTests.Application.Events;

public class EscalateEventCommandHandlerTests
{
    private readonly Mock<IEventRepository> _eventRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ICrisisNotificationService> _notificationServiceMock = new();

    private readonly EscalateEventCommandHandler _handler;

    public EscalateEventCommandHandlerTests()
    {
        _handler = new EscalateEventCommandHandler(
            _eventRepoMock.Object,
            _unitOfWorkMock.Object,
            _notificationServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_WhenEventExists_ShouldEscalateSeverityAndNotifySignalRBroadcast()
    {
        var eventId = Guid.NewGuid();
        var ev = new Event(
            title: "Deprem Dalgası",
            type: DisasterType.Earthquake,
            severity: 70,
            location: new GeoPoint(40.9, 29.0),
            locationName: "Kadikoy",
            district: "Kadikoy",
            source: "Kandilli",
            metric: "5.2",
            metricLabel: "Büyüklük",
            summary: "Artçı sarsıntılar",
            detectedAt: DateTimeOffset.UtcNow
        );

        _eventRepoMock.Setup(r => r.GetByIdAsync(eventId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(ev);

        var command = new EscalateEventCommand(eventId);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        ev.Severity.Should().Be(85);
        ev.EscalatedAt.Should().NotBeNull();

        _eventRepoMock.Verify(r => r.Update(ev), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _notificationServiceMock.Verify(s => s.NotifyEventCreatedAsync(ev, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenEventDoesNotExist_ShouldReturnFalseWithoutSavingOrNotifying()
    {
        var eventId = Guid.NewGuid();

        _eventRepoMock.Setup(r => r.GetByIdAsync(eventId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync((Event?)null);

        var command = new EscalateEventCommand(eventId);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeFalse();

        _eventRepoMock.Verify(r => r.Update(It.IsAny<Event>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _notificationServiceMock.Verify(s => s.NotifyEventCreatedAsync(It.IsAny<Event>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
