namespace Aura.Application.Common.Interfaces;

public interface IMeteorologyService
{
    Task FetchAndUpdateDistrictWeatherRisksAsync(CancellationToken cancellationToken = default);
}
