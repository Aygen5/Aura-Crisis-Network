using Aura.Application.DTOs;
using Aura.Application.Reports.Commands.CreateCitizenReport;
using Aura.Application.Reports.Commands.UpdateReportStatus;
using Aura.Application.Reports.Queries.GetReportsByStatus;
using Aura.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[Route("api/v1/reports")]
public class CitizenReportsController : BaseApiController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CitizenReportDto>>> GetReportsByStatus(
        [FromQuery] ReportStatus status = ReportStatus.Pending,
        CancellationToken cancellationToken = default)
    {
        var query = new GetReportsByStatusQuery(status);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<CitizenReportDto>> CreateReport(
        [FromBody] CreateCitizenReportCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetReportsByStatus), new { status = result.Status }, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> UpdateReportStatus(
        Guid id,
        [FromQuery] ReportStatus status,
        CancellationToken cancellationToken)
    {
        var command = new UpdateReportStatusCommand(id, status);
        var success = await Mediator.Send(command, cancellationToken);

        if (!success)
        {
            return NotFound(new { Message = $"Report with ID {id} was not found." });
        }

        return NoContent();
    }
}
