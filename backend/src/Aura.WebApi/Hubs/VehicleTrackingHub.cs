using Aura.Application.EmergencyUnits.Commands;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace Aura.WebApi.Hubs;

public class VehicleTrackingHub : Hub
{
    private readonly ISender _sender;

    public VehicleTrackingHub(ISender sender)
    {
        _sender = sender;
    }

    public async Task SendGpsTelemetry(
        Guid unitId,
        double latitude,
        double longitude,
        double speedKmh,
        double headingDegrees)
    {
        var updatedDto = await _sender.Send(new UpdateUnitGpsLocationCommand(
            unitId,
            latitude,
            longitude,
            speedKmh,
            headingDegrees));

        await Clients.All.SendAsync("VehiclePositionUpdated", updatedDto);
    }
}
