using Aura.Application.DTOs;
using Aura.Application.Reports.Commands.CreateCitizenReport;
using Aura.Application.Reports.Commands.VerifyCitizenReport;
using Aura.Application.Reports.Queries.GetReportsByStatus;
using Aura.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[Route("api/reports")]
public class CitizenReportsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CitizenReportDto>>> GetReportsByStatus(
        [FromQuery] ReportStatus status = ReportStatus.Pending,
        CancellationToken cancellationToken = default)
    {
        var query = new GetReportsByStatusQuery(status);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CitizenReportDto>> CreateReport(
        [FromBody] CreateCitizenReportCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetReportsByStatus), new { status = result.Status }, result);
    }

    [HttpPut("{id:guid}/verify")]
    public async Task<IActionResult> VerifyReport(Guid id, CancellationToken cancellationToken)
    {
        var command = new VerifyCitizenReportCommand(id);
        var success = await Mediator.Send(command, cancellationToken);

        if (!success)
        {
            return NotFound(new { Message = $"Report with ID {id} was not found." });
        }

        return NoContent();
    }
}
