using Aura.Application.DistrictRisks.Queries.GetAllDistrictRisks;
using Aura.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[Route("api/district-risks")]
public class DistrictRisksController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DistrictRiskDto>>> GetAllDistrictRisks(CancellationToken cancellationToken)
    {
        var query = new GetAllDistrictRisksQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
