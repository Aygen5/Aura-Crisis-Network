using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;

namespace Aura.Application.Common.Interfaces;

public interface ICitizenReportRepository
{
    Task<CitizenReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CitizenReport>> GetReportsByStatusAsync(ReportStatus status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CitizenReport>> GetNearbyReportsAsync(GeoPoint location, double radiusInMeters, CancellationToken cancellationToken = default);
    Task AddAsync(CitizenReport entity, CancellationToken cancellationToken = default);
    void Update(CitizenReport entity);
}
