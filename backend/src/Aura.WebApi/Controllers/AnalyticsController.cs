using Aura.Application.Analytics.Queries.GetAnalyticsSummary;
using Aura.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[Route("api/v1/analytics")]
public class AnalyticsController : BaseApiController
{
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetAnalyticsSummary(CancellationToken cancellationToken)
    {
        var query = new GetAnalyticsSummaryQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
