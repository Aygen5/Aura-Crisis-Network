using Aura.Application.Common.Interfaces;
using Aura.Application.EmergencyUnits.Commands;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using FluentAssertions;
using Moq;
using NetTopologySuite.Geometries;
using Xunit;

namespace Aura.UnitTests.Application.EmergencyUnits;

public class DispatchUnitCommandHandlerTests
{
    private static readonly GeometryFactory GeoFactory = new(new PrecisionModel(), 4326);

    private readonly Mock<IEmergencyUnitRepository> _repositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private readonly DispatchUnitCommandHandler _handler;

    public DispatchUnitCommandHandlerTests()
    {
        _handler = new DispatchUnitCommandHandler(_repositoryMock.Object, _unitOfWorkMock.Object);
    }

    [Fact]
    public async Task Handle_WhenUnitIsAvailable_ShouldDispatchUnitAndUpdateState()
    {
        var unitId = Guid.NewGuid();
        var eventId = Guid.NewGuid();
        var unit = new EmergencyUnit("AFAD-01", "34-AFAD-01", UnitType.SearchAndRescue, GeoFactory.CreatePoint(new Coordinate(28.97, 41.00)));

        _repositoryMock.Setup(r => r.GetByIdAsync(unitId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(unit);

        var command = new DispatchUnitCommand(unitId, eventId);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.CallSign.Should().Be("AFAD-01");
        result.Status.Should().Be(UnitStatus.Dispatched);

        unit.Status.Should().Be(UnitStatus.Dispatched);
        unit.AssignedEventId.Should().Be(eventId);

        _repositoryMock.Verify(r => r.UpdateAsync(unit, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUnitDoesNotExist_ShouldThrowKeyNotFoundException()
    {
        var unitId = Guid.NewGuid();
        var eventId = Guid.NewGuid();

        _repositoryMock.Setup(r => r.GetByIdAsync(unitId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync((EmergencyUnit?)null);

        var command = new DispatchUnitCommand(unitId, eventId);

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>()
                 .WithMessage($"*{unitId}*");

        _repositoryMock.Verify(r => r.UpdateAsync(It.IsAny<EmergencyUnit>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUnitIsInMaintenance_ShouldThrowInvalidOperationExceptionAndNotSave()
    {
        var unitId = Guid.NewGuid();
        var eventId = Guid.NewGuid();
        var unit = new EmergencyUnit("AFAD-BAKIM", "34-AFAD-99", UnitType.SearchAndRescue, GeoFactory.CreatePoint(new Coordinate(28.97, 41.00)));
        unit.SetMaintenance(true);

        _repositoryMock.Setup(r => r.GetByIdAsync(unitId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(unit);

        var command = new DispatchUnitCommand(unitId, eventId);

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("*maintenance*");

        _repositoryMock.Verify(r => r.UpdateAsync(It.IsAny<EmergencyUnit>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
