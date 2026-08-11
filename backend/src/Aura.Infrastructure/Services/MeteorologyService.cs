using System.Globalization;
using System.Net;
using System.Text.Json;
using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.Services;

public class MeteorologyService : IMeteorologyService
{
    private readonly HttpClient _httpClient;
    private readonly IDistrictRiskRepository _districtRiskRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MeteorologyService> _logger;

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
        IUnitOfWork unitOfWork,
        ILogger<MeteorologyService> logger)
    {
        _httpClient = httpClient;
        _districtRiskRepository = districtRiskRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task FetchAndUpdateDistrictWeatherRisksAsync(CancellationToken cancellationToken = default)
    {
        var existingRisksList = await _districtRiskRepository.GetAllDistrictRisksAsync(cancellationToken);
        var existingDict = existingRisksList.ToDictionary(r => r.DistrictName, StringComparer.OrdinalIgnoreCase);

        bool updatedAny = false;
        int districtIndex = 0;

        foreach (var (districtName, (lat, lng, initialSeismic)) in DistrictCoordinates)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            if (districtIndex > 0)
            {
                try
                {
                    await Task.Delay(250, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
            districtIndex++;

            try
            {
                var url = $"https://api.open-meteo.com/v1/forecast?latitude={lat.ToString(CultureInfo.InvariantCulture)}&longitude={lng.ToString(CultureInfo.InvariantCulture)}&current=precipitation,rain,wind_speed_10m,wind_gusts_10m";
                using var response = await _httpClient.GetAsync(url, cancellationToken);

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    var retryAfterSeconds = response.Headers.RetryAfter?.Delta?.TotalSeconds ?? 60;
                    _logger.LogWarning("Open-Meteo API returned 429 Too Many Requests for district {District}. Halting weather update cycle for remaining districts. Estimated retry after ~{RetryAfter}s.", districtName, retryAfterSeconds);
                    break;
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Open-Meteo API returned HTTP status {StatusCode} for district {District}. Preserving existing database risk records.", response.StatusCode, districtName);
                    continue;
                }

                var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
                using var jsonDoc = JsonDocument.Parse(jsonContent);

                double precipitation = 0;
                double windSpeed = 0;
                bool parsed = false;

                if (jsonDoc.RootElement.TryGetProperty("current", out var currentObj))
                {
                    if (currentObj.TryGetProperty("precipitation", out var precProp))
                    {
                        precipitation = precProp.GetDouble();
                        parsed = true;
                    }
                    if (currentObj.TryGetProperty("wind_speed_10m", out var windProp))
                    {
                        windSpeed = windProp.GetDouble();
                        parsed = true;
                    }
                }

                if (!parsed)
                {
                    _logger.LogWarning("Open-Meteo API response for {District} lacked expected weather fields. Skipping update for this district.", districtName);
                    continue;
                }

                int floodRisk = CalculateFloodRisk(precipitation);
                int wildfireRisk = CalculateWildfireRisk(windSpeed);
                int landslideRisk = CalculateLandslideRisk(precipitation);

                if (existingDict.TryGetValue(districtName, out var existingRisk))
                {
                    existingRisk.UpdateRiskScores(existingRisk.SeismicRisk, floodRisk, landslideRisk, wildfireRisk);
                }
                else
                {
                    var newRisk = new DistrictRisk(districtName, initialSeismic, floodRisk, landslideRisk, wildfireRisk);
                    await _districtRiskRepository.AddAsync(newRisk, cancellationToken);
                    existingDict[districtName] = newRisk;
                }

                updatedAny = true;
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Meteorology update operation cancelled for district {District}.", districtName);
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch or parse Open-Meteo weather data for district {District}. Preserving existing database risk values.", districtName);
            }
        }

        if (updatedAny && !cancellationToken.IsCancellationRequested)
        {
            try
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("23505") == true || ex.InnerException?.Message.Contains("IX_DistrictRisks_DistrictName") == true)
            {
                // Ignore concurrent duplicate inserts if executed in parallel
            }
            catch (OperationCanceledException)
            {
                // Graceful cancellation shutdown
            }
        }
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

