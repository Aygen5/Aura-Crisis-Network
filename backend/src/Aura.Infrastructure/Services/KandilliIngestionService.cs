using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;

namespace Aura.Infrastructure.Services;

public class KandilliIngestionService : IKandilliIngestionService
{
    private readonly HttpClient _httpClient;

    public KandilliIngestionService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
    }

    public async Task<IReadOnlyList<Event>> FetchLatestEarthquakesAsync(CancellationToken cancellationToken = default)
    {
        var events = new List<Event>();

        try
        {
            var response = await _httpClient.GetAsync("https://api.orhanaydogdu.com.tr/deprem/kandilli/live", cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
                using var jsonDoc = JsonDocument.Parse(jsonContent);

                if (jsonDoc.RootElement.TryGetProperty("result", out var resultArray) && resultArray.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in resultArray.EnumerateArray())
                    {
                        var parsedEvent = ParseJsonEarthquake(item);
                        if (parsedEvent != null)
                        {
                            events.Add(parsedEvent);
                        }
                    }
                }
            }
        }
        catch
        {
        }

        if (events.Count == 0)
        {
            try
            {
                var rawHtml = await _httpClient.GetStringAsync("http://www.koeri.boun.edu.tr/scripts/lst0.asp", cancellationToken);
                var parsedFromHtml = ParseRawHtmlLst0(rawHtml);
                events.AddRange(parsedFromHtml);
            }
            catch
            {
            }
        }

        return events;
    }

    private static Event? ParseJsonEarthquake(JsonElement item)
    {
        try
        {
            var title = item.GetProperty("title").GetString() ?? string.Empty;

            double latitude = 0;
            double longitude = 0;

            if (item.TryGetProperty("geojson", out var geoJson) &&
                geoJson.TryGetProperty("coordinates", out var coords) &&
                coords.ValueKind == JsonValueKind.Array &&
                coords.GetArrayLength() >= 2)
            {
                longitude = coords[0].GetDouble();
                latitude = coords[1].GetDouble();
            }

            double magnitude = 0;
            if (item.TryGetProperty("mag", out var magProp))
            {
                magnitude = magProp.GetDouble();
            }

            double depth = 0;
            if (item.TryGetProperty("depth", out var depthProp))
            {
                depth = depthProp.GetDouble();
            }

            var dateStr = item.GetProperty("date").GetString() ?? string.Empty;
            if (!DateTimeOffset.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var detectedAt))
            {
                detectedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                detectedAt = detectedAt.ToUniversalTime();
            }

            var district = ExtractDistrict(title);
            var severity = CalculateSeverityFromMagnitude(magnitude);

            return new Event(
                title: $"Deprem: {title} ({magnitude:F1} ML)",
                type: DisasterType.Earthquake,
                severity: severity,
                location: new GeoPoint(latitude, longitude),
                locationName: title,
                district: district,
                source: "Kandilli",
                metric: magnitude.ToString("F1", CultureInfo.InvariantCulture),
                metricLabel: "Büyüklük (ML)",
                summary: $"{title} bölgesinde {magnitude:F1} büyüklüğünde, {depth:F1} km derinlikte sismik hareketlilik tespit edildi.",
                detectedAt: detectedAt
            );
        }
        catch
        {
            return null;
        }
    }

    private static List<Event> ParseRawHtmlLst0(string rawHtml)
    {
        var list = new List<Event>();
        var preMatch = Regex.Match(rawHtml, @"<pre>(.*?)</pre>", RegexOptions.Singleline | RegexOptions.IgnoreCase);

        if (!preMatch.Success) return list;

        var lines = preMatch.Groups[1].Value.Split('\n');
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("----------") || line.StartsWith("Tarih"))
            {
                continue;
            }

            var parts = Regex.Split(line.Trim(), @"\s+");
            if (parts.Length < 9) continue;

            if (!DateTimeOffset.TryParse($"{parts[0]} {parts[1]}", out var detectedAt))
            {
                continue;
            }
            detectedAt = detectedAt.ToUniversalTime();

            if (!double.TryParse(parts[2], NumberStyles.Any, CultureInfo.InvariantCulture, out var lat) ||
                !double.TryParse(parts[3], NumberStyles.Any, CultureInfo.InvariantCulture, out var lng) ||
                !double.TryParse(parts[6], NumberStyles.Any, CultureInfo.InvariantCulture, out var mag))
            {
                continue;
            }

            var locationName = string.Join(" ", parts.Skip(8));
            var district = ExtractDistrict(locationName);
            var severity = CalculateSeverityFromMagnitude(mag);

            list.Add(new Event(
                title: $"Deprem: {locationName} ({mag:F1} ML)",
                type: DisasterType.Earthquake,
                severity: severity,
                location: new GeoPoint(lat, lng),
                locationName: locationName,
                district: district,
                source: "Kandilli",
                metric: mag.ToString("F1", CultureInfo.InvariantCulture),
                metricLabel: "Büyüklük (ML)",
                summary: $"{locationName} bölgesinde {mag:F1} büyüklüğünde deprem algılandı.",
                detectedAt: detectedAt
            ));
        }

        return list;
    }

    private static string ExtractDistrict(string locationName)
    {
        var match = Regex.Match(locationName, @"\((.*?)\)");
        if (match.Success)
        {
            return match.Groups[1].Value.Trim();
        }

        var parts = locationName.Split('-');
        return parts.Length > 0 ? parts[0].Trim() : locationName.Trim();
    }

    private static int CalculateSeverityFromMagnitude(double magnitude)
    {
        if (magnitude < 3.0) return 20;
        if (magnitude < 4.0) return 40;
        if (magnitude < 5.0) return 60;
        if (magnitude < 6.0) return 80;
        return 100;
    }
}
