using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using Aura.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NetTopologySuite.Geometries;
using Xunit;

namespace Aura.IntegrationTests.Security;

[Collection("IntegrationTests")]
public class IdorSecurityIntegrationTests
{
    private static readonly GeometryFactory GeoFactory = new(new PrecisionModel(), 4326);
    private readonly AuraWebApplicationFactory _factory;

    public IdorSecurityIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task MarkNotificationAsRead_WhenAttemptedByAnotherUser_ShouldReturn404AndNotModifyState()
    {
        Guid notificationId;
        string userAId;

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var userA = await dbContext.Users.FirstAsync(u => u.Email == "citizen.test@aura.gov.tr");
            userAId = userA.Id.ToString();

            var notification = new Notification(userAId, "Private Alert", "Private content for User A", NotificationType.SystemAlert);
            dbContext.Notifications.Add(notification);
            await dbContext.SaveChangesAsync();
            notificationId = notification.Id;
        }

        var userBClient = await _factory.CreateAuthenticatedClientAsync("citizen2.test@aura.gov.tr", "Citizen123!");

        var response = await userBClient.PatchAsync($"/api/v1/notifications/{notificationId}/read", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var dbNotification = await dbContext.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId);
            dbNotification.Should().NotBeNull();
            dbNotification!.IsRead.Should().BeFalse("Notification state must not be modified by another user (IDOR prevention).");
        }
    }

    [Fact]
    public async Task UploadReportAttachment_WhenAttemptedByAnotherCitizen_ShouldReturn404AndNotSaveAttachment()
    {
        Guid reportId;
        string userBId;

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var userB = await dbContext.Users.FirstAsync(u => u.Email == "citizen2.test@aura.gov.tr");
            userBId = userB.Id.ToString();

            var location = new GeoPoint(40.99, 29.02);
            var report = new CitizenReport(
                "User B Flood Report",
                DisasterType.Flood,
                "Kadikoy",
                "User B Name",
                "555-0000",
                location,
                "Water rising rapidly",
                userBId);
            dbContext.CitizenReports.Add(report);
            await dbContext.SaveChangesAsync();
            reportId = report.Id;
        }

        var userAClient = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent("fake-image-bytes"u8.ToArray());
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
        content.Add(fileContent, "file", "malicious_upload.png");

        var response = await userAClient.PostAsync($"/api/v1/reports/{reportId}/attachments", content);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var attachmentsCount = await dbContext.ReportAttachments.CountAsync(a => a.CitizenReportId == reportId);
            attachmentsCount.Should().Be(0, "No attachment should be created for another citizen's report (IDOR prevention).");
        }
    }
}
