using Aura.Application.EmergencyUnits.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Aura.WebApi.Hubs;

[Authorize(Roles = "Admin,Operator,FieldUnit")]
public class VehicleTrackingHub : Hub
{
    private readonly ISender _sender;

    public VehicleTrackingHub(ISender sender)
    {
        _sender = sender;
    }

    [Authorize(Roles = "Admin,Operator,FieldUnit")]
    public async Task SendGpsTelemetry(
        Guid unitId,
        double latitude,
        double longitude,
        double speedKmh,
        double headingDegrees)
    {
        var user = Context.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            throw new HubException("Unauthorized: Authentication required.");
        }

        if (!user.IsInRole("Admin") && !user.IsInRole("Operator") && !user.IsInRole("FieldUnit"))
        {
            throw new HubException("Forbidden: Access denied. Only authorized operators or field units can transmit vehicle telemetry.");
        }

        if (latitude is < -90.0 or > 90.0 || longitude is < -180.0 or > 180.0)
        {
            throw new HubException("Invalid coordinates: Latitude must be between -90 and 90, Longitude between -180 and 180.");
        }

        var updatedDto = await _sender.Send(new UpdateUnitGpsLocationCommand(
            unitId,
            latitude,
            longitude,
            speedKmh,
            headingDegrees));

        await Clients.All.SendAsync("VehiclePositionUpdated", updatedDto);
    }
}
