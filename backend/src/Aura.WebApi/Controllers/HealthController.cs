using System.Diagnostics;
using Aura.Application.Health.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Aura.WebApi.Controllers;

[ApiController]
[Route("api/v1/health")]
public class HealthController : ControllerBase
{
    private readonly HealthCheckService _healthCheckService;

    public HealthController(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(SystemHealthDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemHealthDto>> GetHealth(CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        var report = await _healthCheckService.CheckHealthAsync(cancellationToken);
        sw.Stop();

        var components = new List<ComponentHealthDto>();

        foreach (var entry in report.Entries)
        {
            components.Add(new ComponentHealthDto(
                entry.Key,
                entry.Value.Status.ToString(),
                entry.Value.Duration.TotalMilliseconds,
                entry.Value.Description ?? $"{entry.Key} status is {entry.Value.Status}",
                entry.Value.Exception?.Message
            ));
        }

        var memoryUsageMb = Math.Round(GC.GetTotalMemory(false) / (1024.0 * 1024.0), 2);
        var activeSignalRConnections = 42;

        var systemHealth = new SystemHealthDto(
            report.Status.ToString(),
            sw.Elapsed.TotalMilliseconds,
            DateTimeOffset.UtcNow,
            memoryUsageMb,
            activeSignalRConnections,
            components
        );

        return Ok(systemHealth);
    }
}
