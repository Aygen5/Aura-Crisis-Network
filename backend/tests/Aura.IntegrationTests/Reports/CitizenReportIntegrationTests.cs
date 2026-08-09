using System.Net;
using System.Net.Http.Json;
using Aura.Application.DTOs;
using Aura.Domain.Enums;
using Aura.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Aura.IntegrationTests.Reports;

[Collection("IntegrationTests")]
public class CitizenReportIntegrationTests
{
    private readonly AuraWebApplicationFactory _factory;

    public CitizenReportIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateReport_WhenCalledByCitizen_ShouldPersistInPostgresDatabaseAndReturnCreated()
    {
        var client = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");

        var request = new
        {
            Title = "Entegrasyon Su Baskını",
            Type = "Flood",
            District = "Kadikoy",
            ReporterName = "Test Vatandaş",
            ReporterPhone = "5551112233",
            Latitude = 40.9901,
            Longitude = 29.0291,
            Summary = "Cadde taştı, araçlar mahsur kaldı."
        };

        var response = await client.PostAsJsonAsync("/api/v1/reports", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdReport = await response.Content.ReadFromJsonAsync<CitizenReportDto>(AuraWebApplicationFactory.JsonOptions);
        createdReport.Should().NotBeNull();
        createdReport!.Title.Should().Be("Entegrasyon Su Baskını");
        createdReport.District.Should().Be("Kadikoy");

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
        var dbReport = await dbContext.CitizenReports.FirstOrDefaultAsync(r => r.Id == createdReport.Id);

        dbReport.Should().NotBeNull();
        dbReport!.Title.Should().Be("Entegrasyon Su Baskını");
        dbReport.Location.Latitude.Should().Be(40.9901);
        dbReport.Location.Longitude.Should().Be(29.0291);
    }

    [Fact]
    public async Task GetReports_DataIsolation_CitizenShouldOnlySeeOwnReports()
    {
        var citizen1Client = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");
        var citizen2Client = await _factory.CreateAuthenticatedClientAsync("citizen2.test@aura.gov.tr", "Citizen123!");

        var reportRequest1 = new
        {
            Title = "Citizen 1 Özel İhbar",
            Type = "Earthquake",
            District = "Maltepe",
            ReporterName = "Citizen One",
            ReporterPhone = "555111",
            Latitude = 40.92,
            Longitude = 29.13,
            Summary = "Sarsıntı hissedildi"
        };
        var createResponse = await citizen1Client.PostAsJsonAsync("/api/v1/reports", reportRequest1);
        createResponse.EnsureSuccessStatusCode();

        var citizen1ListResponse = await citizen1Client.GetAsync("/api/v1/reports?status=Pending");
        citizen1ListResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var citizen1Reports = await citizen1ListResponse.Content.ReadFromJsonAsync<List<CitizenReportDto>>(AuraWebApplicationFactory.JsonOptions);
        citizen1Reports.Should().Contain(r => r.Title == "Citizen 1 Özel İhbar");

        var citizen2ListResponse = await citizen2Client.GetAsync("/api/v1/reports?status=Pending");
        citizen2ListResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var citizen2Reports = await citizen2ListResponse.Content.ReadFromJsonAsync<List<CitizenReportDto>>(AuraWebApplicationFactory.JsonOptions);
        citizen2Reports.Should().NotContain(r => r.Title == "Citizen 1 Özel İhbar");
    }

    [Fact]
    public async Task GetReports_WhenCalledByOperator_ShouldReturnAllPendingReportsAcrossUsers()
    {
        var citizenClient = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");
        var operatorClient = await _factory.CreateAuthenticatedClientAsync("operator.test@aura.gov.tr", "Operator123!");

        var reportRequest = new
        {
            Title = "Operatör Tarafından Görünmeli",
            Type = "Wildfire",
            District = "Sariyer",
            ReporterName = "Citizen Test",
            ReporterPhone = "555",
            Latitude = 41.15,
            Longitude = 29.05,
            Summary = "Ormanda duman var"
        };
        await citizenClient.PostAsJsonAsync("/api/v1/reports", reportRequest);

        var operatorResponse = await operatorClient.GetAsync("/api/v1/reports?status=Pending");
        operatorResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var operatorReports = await operatorResponse.Content.ReadFromJsonAsync<List<CitizenReportDto>>(AuraWebApplicationFactory.JsonOptions);
        operatorReports.Should().Contain(r => r.Title == "Operatör Tarafından Görünmeli");
    }
}
