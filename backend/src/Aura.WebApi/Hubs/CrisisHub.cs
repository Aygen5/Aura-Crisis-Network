using Microsoft.AspNetCore.SignalR;

namespace Aura.WebApi.Hubs;

public class CrisisHub : Hub
{
    public async Task JoinDistrictGroup(string districtName)
    {
        if (!string.IsNullOrWhiteSpace(districtName))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, districtName.ToLowerInvariant());
        }
    }

    public async Task LeaveDistrictGroup(string districtName)
    {
        if (!string.IsNullOrWhiteSpace(districtName))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, districtName.ToLowerInvariant());
        }
    }
}
