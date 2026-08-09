using Aura.Application.Common.Interfaces;
using Aura.Application.Reports.Queries.GetReportsByStatus;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aura.UnitTests.Application.Reports;

public class GetReportsByStatusQueryHandlerTests
{
    private readonly Mock<ICitizenReportRepository> _reportRepoMock = new();
    private readonly GetReportsByStatusQueryHandler _handler;

    public GetReportsByStatusQueryHandlerTests()
    {
        _handler = new GetReportsByStatusQueryHandler(_reportRepoMock.Object);
    }

    [Fact]
    public async Task Handle_WhenExecutedByCitizen_ShouldFilterByCurrentUserId()
    {
        var citizenUserId = "user-citizen-99";
        var query = new GetReportsByStatusQuery(
            Status: ReportStatus.Pending,
            CurrentUserId: citizenUserId,
            IsOperatorOrAdmin: false
        );

        var report1 = new CitizenReport("İhbar 1", DisasterType.Flood, "Kadikoy", "Ali", "555", new GeoPoint(41.0, 29.0), "Sel", citizenUserId);
        _reportRepoMock.Setup(r => r.GetReportsByStatusAsync(ReportStatus.Pending, citizenUserId, false, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(new List<CitizenReport> { report1 });

        var result = await _handler.Handle(query, CancellationToken.None);

        result.Should().HaveCount(1);
        result.First().Title.Should().Be("İhbar 1");
        result.First().ReporterUserId.Should().Be(citizenUserId);

        _reportRepoMock.Verify(r => r.GetReportsByStatusAsync(ReportStatus.Pending, citizenUserId, false, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenExecutedByOperator_ShouldPassIsOperatorOrAdminTrue()
    {
        var operatorUserId = "user-operator-1";
        var query = new GetReportsByStatusQuery(
            Status: ReportStatus.Pending,
            CurrentUserId: operatorUserId,
            IsOperatorOrAdmin: true
        );

        var report1 = new CitizenReport("İhbar 1", DisasterType.Flood, "Kadikoy", "Ali", "555", new GeoPoint(41.0, 29.0), "Sel", "user-citizen-1");
        var report2 = new CitizenReport("İhbar 2", DisasterType.Wildfire, "Besiktas", "Veli", "555", new GeoPoint(41.04, 29.0), "Yangın", "user-citizen-2");

        _reportRepoMock.Setup(r => r.GetReportsByStatusAsync(ReportStatus.Pending, operatorUserId, true, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(new List<CitizenReport> { report1, report2 });

        var result = await _handler.Handle(query, CancellationToken.None);

        result.Should().HaveCount(2);
        _reportRepoMock.Verify(r => r.GetReportsByStatusAsync(ReportStatus.Pending, operatorUserId, true, It.IsAny<CancellationToken>()), Times.Once);
    }
}
