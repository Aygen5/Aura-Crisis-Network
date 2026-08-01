using System.Globalization;
using System.Text.Json;
using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;

namespace Aura.Infrastructure.Services;

public class MeteorologyService : IMeteorologyService
{
    private readonly HttpClient _httpClient;
    private readonly IDistrictRiskRepository _districtRiskRepository;
    private readonly IUnitOfWork _unitOfWork;

    private static readonly Dictionary<string, (double Lat, double Lng, int InitialSeismicRisk)> DistrictCoordinates = new()
    {
        { "Kadıköy", (40.9901, 29.0292, 75) },
        { "Beşiktaş", (41.0422, 29.0067, 65) },
        { "Üsküdar", (41.0267, 29.0153, 70) },
        { "Fatih", (41.0186, 28.9501, 85) },
        { "Bakırköy", (40.9781, 28.8724, 90) },
        { "Avcılar", (40.9801, 28.7180, 95) },
        { "Beylikdüzü", (40.9904, 28.6476, 85) },
        { "Pendik", (40.8753, 29.2341, 70) },
        { "Silivri", (41.0742, 28.2464, 80) },
        { "Maltepe", (40.9250, 29.1311, 75) },
        { "İzmir - Karşıyaka", (38.4622, 27.1147, 85) },
        { "Ankara - Çankaya", (39.9117, 32.8544, 30) },
        { "Bursa - Nilüfer", (40.2155, 28.9783, 80) },
        { "Antalya - Muratpaşa", (36.8869, 30.7042, 45) }
    };

    public MeteorologyService(
        HttpClient httpClient,
        IDistrictRiskRepository districtRiskRepository,
        IUnitOfWork unitOfWork)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
        _districtRiskRepository = districtRiskRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task FetchAndUpdateDistrictWeatherRisksAsync(CancellationToken cancellationToken = default)
    {
        foreach (var (districtName, (lat, lng, initialSeismic)) in DistrictCoordinates)
        {
            try
            {
                var url = $"https://api.open-meteo.com/v1/forecast?latitude={lat.ToString(CultureInfo.InvariantCulture)}&longitude={lng.ToString(CultureInfo.InvariantCulture)}&current=precipitation,rain,wind_speed_10m,wind_gusts_10m";
                var response = await _httpClient.GetAsync(url, cancellationToken);

                double precipitation = 0;
                double windSpeed = 0;

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    using var jsonDoc = JsonDocument.Parse(jsonContent);

                    if (jsonDoc.RootElement.TryGetProperty("current", out var currentObj))
                    {
                        if (currentObj.TryGetProperty("precipitation", out var precProp))
                        {
                            precipitation = precProp.GetDouble();
                        }
                        if (currentObj.TryGetProperty("wind_speed_10m", out var windProp))
                        {
                            windSpeed = windProp.GetDouble();
                        }
                    }
                }

                int floodRisk = CalculateFloodRisk(precipitation);
                int wildfireRisk = CalculateWildfireRisk(windSpeed);
                int landslideRisk = CalculateLandslideRisk(precipitation);

                var existingRisk = await _districtRiskRepository.GetByDistrictNameAsync(districtName, cancellationToken);
                if (existingRisk != null)
                {
                    existingRisk.UpdateRiskScores(existingRisk.SeismicRisk, floodRisk, landslideRisk, wildfireRisk);
                    _districtRiskRepository.Update(existingRisk);
                }
                else
                {
                    var newRisk = new DistrictRisk(districtName, initialSeismic, floodRisk, landslideRisk, wildfireRisk);
                    await _districtRiskRepository.AddAsync(newRisk, cancellationToken);
                }
            }
            catch
            {
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static int CalculateFloodRisk(double precipitationMm)
    {
        if (precipitationMm < 2.0) return 10;
        if (precipitationMm < 10.0) return 35;
        if (precipitationMm < 25.0) return 65;
        if (precipitationMm < 50.0) return 85;
        return 100;
    }

    private static int CalculateWildfireRisk(double windSpeedKmh)
    {
        if (windSpeedKmh < 15.0) return 15;
        if (windSpeedKmh < 30.0) return 40;
        if (windSpeedKmh < 50.0) return 70;
        return 90;
    }

    private static int CalculateLandslideRisk(double precipitationMm)
    {
        if (precipitationMm < 5.0) return 10;
        if (precipitationMm < 20.0) return 45;
        return 80;
    }
}
