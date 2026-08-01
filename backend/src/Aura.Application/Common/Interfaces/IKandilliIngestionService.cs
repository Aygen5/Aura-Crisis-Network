using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface IKandilliIngestionService
{
    Task<IReadOnlyList<Event>> FetchLatestEarthquakesAsync(CancellationToken cancellationToken = default);
}
