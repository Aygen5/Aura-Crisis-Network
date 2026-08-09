using Aura.Application.Common.Interfaces;
using Aura.Application.Reports.Commands.CreateCitizenReport;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aura.UnitTests.Application.Reports;

public class CreateCitizenReportCommandHandlerTests
{
    private readonly Mock<ICitizenReportRepository> _reportRepoMock = new();
    private readonly Mock<INotificationRepository> _notificationRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ICrisisNotificationService> _notificationServiceMock = new();

    private readonly CreateCitizenReportCommandHandler _handler;

    public CreateCitizenReportCommandHandlerTests()
    {
        _handler = new CreateCitizenReportCommandHandler(
            _reportRepoMock.Object,
            _notificationRepoMock.Object,
            _unitOfWorkMock.Object,
            _notificationServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_WhenRequestIsValid_ShouldSaveReportAndSystemNotificationAndNotifyBroadcast()
    {
        var command = new CreateCitizenReportCommand(
            Title: "Sel Baskını",
            Type: DisasterType.Flood,
            District: "Besiktas",
            ReporterName: "Ali Vural",
            ReporterPhone: "5551112233",
            Latitude: 41.0422,
            Longitude: 29.0083,
            Summary: "Dere taştı",
            ReporterUserId: "user-citizen-1"
        );

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.Title.Should().Be("Sel Baskını");
        result.District.Should().Be("Besiktas");
        result.Status.Should().Be(ReportStatus.Pending);
        result.CorroborationCount.Should().Be(1);

        _reportRepoMock.Verify(r => r.AddAsync(It.Is<CitizenReport>(cr =>
            cr.Title == command.Title && cr.ReporterUserId == command.ReporterUserId
        ), It.IsAny<CancellationToken>()), Times.Once);

        _notificationRepoMock.Verify(n => n.AddAsync(It.Is<Notification>(notif =>
            notif.RecipientUserId == "Operator" && notif.Title.Contains("Besiktas")
        ), It.IsAny<CancellationToken>()), Times.Once);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);

        _notificationServiceMock.Verify(s => s.NotifyReportCreatedAsync(
            It.Is<CitizenReport>(cr => cr.Title == command.Title),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenLatitudeIsInvalid_ShouldThrowArgumentOutOfRangeExceptionBeforePersistence()
    {
        var command = new CreateCitizenReportCommand(
            Title: "Geçersiz Konum",
            Type: DisasterType.Earthquake,
            District: "Kadikoy",
            ReporterName: "Test",
            ReporterPhone: "555",
            Latitude: 120.0,
            Longitude: 29.0,
            Summary: "Geçersiz koordinat"
        );

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
                 .WithParameterName("latitude");

        _reportRepoMock.Verify(r => r.AddAsync(It.IsAny<CitizenReport>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenTitleIsEmpty_ShouldThrowArgumentException()
    {
        var command = new CreateCitizenReportCommand(
            Title: "",
            Type: DisasterType.Flood,
            District: "Kadikoy",
            ReporterName: "Test",
            ReporterPhone: "555",
            Latitude: 41.0,
            Longitude: 29.0,
            Summary: "Boş başlık"
        );

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
                 .WithParameterName("title");
    }
}
