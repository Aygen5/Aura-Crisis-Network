using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface IDistrictRiskRepository
{
    Task<DistrictRisk?> GetByDistrictNameAsync(string districtName, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DistrictRisk>> GetAllDistrictRisksAsync(CancellationToken cancellationToken = default);
    Task AddAsync(DistrictRisk entity, CancellationToken cancellationToken = default);
    void Update(DistrictRisk entity);
}
