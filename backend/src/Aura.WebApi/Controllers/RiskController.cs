using Aura.Application.DistrictRisks.Queries.GetAllDistrictRisks;
using Aura.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[Route("api/v1/risk")]
public class RiskController : BaseApiController
{
    [HttpGet("analysis")]
    public async Task<ActionResult<IReadOnlyList<DistrictRiskDto>>> GetRiskAnalysis(CancellationToken cancellationToken)
    {
        var query = new GetAllDistrictRisksQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
