using Aura.Application.Common.Interfaces;
using Aura.Application.RiskZones.DTOs;
using MediatR;

namespace Aura.Application.RiskZones.Queries;

public record CalculateBufferAnalysisQuery(double Latitude, double Longitude, double RadiusMeters) : IRequest<BufferAnalysisResultDto>;

public record BufferAnalysisResultDto(
    double CenterLatitude,
    double CenterLongitude,
    double RadiusMeters,
    int ImpactedRiskZoneCount,
    IReadOnlyList<RiskZoneDto> ImpactedZones);

public class CalculateBufferAnalysisQueryHandler : IRequestHandler<CalculateBufferAnalysisQuery, BufferAnalysisResultDto>
{
    private readonly IRiskZoneRepository _repository;

    public CalculateBufferAnalysisQueryHandler(IRiskZoneRepository repository)
    {
        _repository = repository;
    }

    public async Task<BufferAnalysisResultDto> Handle(CalculateBufferAnalysisQuery request, CancellationToken cancellationToken)
    {
        var zones = await _repository.GetZonesWithinBufferAsync(
            request.Latitude,
            request.Longitude,
            request.RadiusMeters,
            cancellationToken);

        var dtos = zones.Select(z => z.ToDto()).ToList();

        return new BufferAnalysisResultDto(
            request.Latitude,
            request.Longitude,
            request.RadiusMeters,
            dtos.Count,
            dtos
        );
    }
}
