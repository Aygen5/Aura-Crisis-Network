using Aura.Application.Common.Interfaces;
using Aura.Application.Reports.Commands.UpdateReportStatus;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aura.UnitTests.Application.Reports;

public class UpdateReportStatusCommandHandlerTests
{
    private readonly Mock<ICitizenReportRepository> _reportRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ICrisisNotificationService> _notificationServiceMock = new();

    private readonly UpdateReportStatusCommandHandler _handler;

    public UpdateReportStatusCommandHandlerTests()
    {
        _handler = new UpdateReportStatusCommandHandler(
            _reportRepoMock.Object,
            _unitOfWorkMock.Object,
            _notificationServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_WhenReportExistsAndStatusIsVerified_ShouldUpdateStatusToVerifiedAndNotify()
    {
        var reportId = Guid.NewGuid();
        var existingReport = new CitizenReport(
            "Yangın", DisasterType.Wildfire, "Beykoz", "Caner", "555",
            new GeoPoint(41.1, 29.1), "Orman yangını"
        );

        _reportRepoMock.Setup(r => r.GetByIdAsync(reportId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(existingReport);

        var command = new UpdateReportStatusCommand(reportId, ReportStatus.Verified);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        existingReport.Status.Should().Be(ReportStatus.Verified);

        _reportRepoMock.Verify(r => r.Update(existingReport), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _notificationServiceMock.Verify(s => s.NotifyReportStatusChangedAsync(existingReport, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenReportExistsAndStatusIsRejected_ShouldUpdateStatusToRejectedAndNotify()
    {
        var reportId = Guid.NewGuid();
        var existingReport = new CitizenReport(
            "Asılsız İhbar", DisasterType.Flood, "Zeytinburnu", "Veli", "555",
            new GeoPoint(41.0, 28.9), "Yanlış alarm"
        );

        _reportRepoMock.Setup(r => r.GetByIdAsync(reportId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(existingReport);

        var command = new UpdateReportStatusCommand(reportId, ReportStatus.Rejected);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        existingReport.Status.Should().Be(ReportStatus.Rejected);

        _reportRepoMock.Verify(r => r.Update(existingReport), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenReportDoesNotExist_ShouldReturnFalseWithoutSavingOrNotifying()
    {
        var reportId = Guid.NewGuid();

        _reportRepoMock.Setup(r => r.GetByIdAsync(reportId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync((CitizenReport?)null);

        var command = new UpdateReportStatusCommand(reportId, ReportStatus.Verified);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeFalse();

        _reportRepoMock.Verify(r => r.Update(It.IsAny<CitizenReport>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _notificationServiceMock.Verify(s => s.NotifyReportStatusChangedAsync(It.IsAny<CitizenReport>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
