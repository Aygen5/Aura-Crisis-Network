using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Aura.UnitTests.Domain;

public class CitizenReportTests
{
    [Fact]
    public void Constructor_WhenParametersAreValid_ShouldInitializeReportAsPendingWithSingleCorroboration()
    {
        var location = new GeoPoint(41.0082, 28.9784);

        var report = new CitizenReport(
            title: "Yangın İhbarı",
            type: DisasterType.Wildfire,
            district: "Kadikoy",
            reporterName: "Ahmet Yilmaz",
            reporterPhone: "5551234567",
            location: location,
            summary: "Dumanlar yükseliyor",
            reporterUserId: "user-123"
        );

        report.Title.Should().Be("Yangın İhbarı");
        report.Type.Should().Be(DisasterType.Wildfire);
        report.District.Should().Be("Kadikoy");
        report.ReporterName.Should().Be("Ahmet Yilmaz");
        report.ReporterPhone.Should().Be("5551234567");
        report.Location.Should().Be(location);
        report.Status.Should().Be(ReportStatus.Pending);
        report.CorroborationCount.Should().Be(1);
        report.Summary.Should().Be("Dumanlar yükseliyor");
        report.ReporterUserId.Should().Be("user-123");
        report.Attachments.Should().BeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WhenTitleIsEmpty_ShouldThrowArgumentException(string? invalidTitle)
    {
        var location = new GeoPoint(41.0082, 28.9784);

        var act = () => new CitizenReport(
            title: invalidTitle!,
            type: DisasterType.Flood,
            district: "Kadikoy",
            reporterName: "Ahmet",
            reporterPhone: "555",
            location: location,
            summary: "Sel baskını"
        );

        act.Should().Throw<ArgumentException>()
           .WithParameterName("title");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WhenDistrictIsEmpty_ShouldThrowArgumentException(string? invalidDistrict)
    {
        var location = new GeoPoint(41.0082, 28.9784);

        var act = () => new CitizenReport(
            title: "Deprem İhbarı",
            type: DisasterType.Earthquake,
            district: invalidDistrict!,
            reporterName: "Ahmet",
            reporterPhone: "555",
            location: location,
            summary: "Sarsıntı hissedildi"
        );

        act.Should().Throw<ArgumentException>()
           .WithParameterName("district");
    }

    [Fact]
    public void Verify_WhenStatusIsPending_ShouldSetStatusToVerified()
    {
        var report = CreateTestReport();

        report.Verify();

        report.Status.Should().Be(ReportStatus.Verified);
        report.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void Reject_WhenStatusIsPending_ShouldSetStatusToRejected()
    {
        var report = CreateTestReport();

        report.Reject();

        report.Status.Should().Be(ReportStatus.Rejected);
        report.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void IncrementCorroboration_ShouldIncreaseCountByOne()
    {
        var report = CreateTestReport();
        var initialCount = report.CorroborationCount;

        report.IncrementCorroboration();

        report.CorroborationCount.Should().Be(initialCount + 1);
        report.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void AddAttachment_ShouldAddAttachmentToCollection()
    {
        var report = CreateTestReport();

        report.AddAttachment("damage.jpg", "https://storage.aura.gov.tr/damage.jpg", "image/jpeg", 2048576);

        report.Attachments.Should().HaveCount(1);
        var attachment = report.Attachments.First();
        attachment.FileName.Should().Be("damage.jpg");
        attachment.FileUrl.Should().Be("https://storage.aura.gov.tr/damage.jpg");
        attachment.ContentType.Should().Be("image/jpeg");
        attachment.FileSizeBytes.Should().Be(2048576);
    }

    private static CitizenReport CreateTestReport()
    {
        return new CitizenReport(
            title: "Su Baskını",
            type: DisasterType.Flood,
            district: "Uskudar",
            reporterName: "Mehmet Demir",
            reporterPhone: "5559876543",
            location: new GeoPoint(41.025, 29.015),
            summary: "Cadde su altında kaldı"
        );
    }
}
