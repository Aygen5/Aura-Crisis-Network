using System.Net;
using System.Net.Http.Json;
using Aura.Application.EmergencyUnits.DTOs;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NetTopologySuite.Geometries;
using Xunit;

namespace Aura.IntegrationTests.EmergencyUnits;

[Collection("IntegrationTests")]
public class EmergencyUnitDispatchIntegrationTests
{
    private static readonly GeometryFactory GeoFactory = new(new PrecisionModel(), 4326);
    private readonly AuraWebApplicationFactory _factory;

    public EmergencyUnitDispatchIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DispatchUnit_WhenCalledByOperatorForAvailableUnit_ShouldUpdateStatusInDatabase()
    {
        var operatorClient = await _factory.CreateAuthenticatedClientAsync("operator.test@aura.gov.tr", "Operator123!");

        Guid unitId;
        Guid eventId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var unit = new EmergencyUnit("INTEG-AMBULANCE", "34-INTEG-01", UnitType.Ambulance, GeoFactory.CreatePoint(new Coordinate(28.97, 41.00)));
            dbContext.EmergencyUnits.Add(unit);
            await dbContext.SaveChangesAsync();
            unitId = unit.Id;
        }

        var response = await operatorClient.PostAsJsonAsync($"/api/v1/emergency-units/{unitId}/dispatch", new { EventId = eventId });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dispatchedDto = await response.Content.ReadFromJsonAsync<EmergencyUnitDto>(AuraWebApplicationFactory.JsonOptions);
        dispatchedDto.Should().NotBeNull();
        dispatchedDto!.Status.Should().Be(UnitStatus.Dispatched);
        dispatchedDto.AssignedEventId.Should().Be(eventId);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var dbUnit = await dbContext.EmergencyUnits.FirstOrDefaultAsync(u => u.Id == unitId);
            dbUnit.Should().NotBeNull();
            dbUnit!.Status.Should().Be(UnitStatus.Dispatched);
            dbUnit.AssignedEventId.Should().Be(eventId);
        }
    }

    [Fact]
    public async Task DispatchUnit_WhenUnitIsInMaintenance_ShouldReturnBadRequestOrInternalError()
    {
        var operatorClient = await _factory.CreateAuthenticatedClientAsync("operator.test@aura.gov.tr", "Operator123!");

        Guid unitId;
        Guid eventId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            var unit = new EmergencyUnit("INTEG-MAINT", "34-BAKIM-01", UnitType.SearchAndRescue, GeoFactory.CreatePoint(new Coordinate(28.97, 41.00)));
            unit.SetMaintenance(true);
            dbContext.EmergencyUnits.Add(unit);
            await dbContext.SaveChangesAsync();
            unitId = unit.Id;
        }

        try
        {
            var response = await operatorClient.PostAsJsonAsync($"/api/v1/emergency-units/{unitId}/dispatch", new { EventId = eventId });
            response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError, HttpStatusCode.UnprocessableEntity);
        }
        catch (InvalidOperationException ex)
        {
            ex.Message.Should().Contain("maintenance");
        }
    }
}
