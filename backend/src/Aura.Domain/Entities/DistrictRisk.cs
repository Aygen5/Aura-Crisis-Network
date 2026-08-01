using Aura.Domain.Common;

namespace Aura.Domain.Entities;

public class DistrictRisk : BaseEntity
{
    public string DistrictName { get; private set; }
    public int SeismicRisk { get; private set; } // 0 - 100
    public int FloodRisk { get; private set; }   // 0 - 100
    public int LandslideRisk { get; private set; } // 0 - 100
    public int WildfireRisk { get; private set; } // 0 - 100
    public DateTimeOffset LastCalculatedAt { get; private set; }

    #pragma warning disable CS8618
    private DistrictRisk() { }
    #pragma warning restore CS8618

    public DistrictRisk(
        string districtName,
        int seismicRisk,
        int floodRisk,
        int landslideRisk,
        int wildfireRisk)
    {
        if (string.IsNullOrWhiteSpace(districtName)) throw new ArgumentException("District name cannot be empty.", nameof(districtName));

        DistrictName = districtName;
        UpdateRiskScores(seismicRisk, floodRisk, landslideRisk, wildfireRisk);
    }

    public void UpdateRiskScores(int seismicRisk, int floodRisk, int landslideRisk, int wildfireRisk)
    {
        SeismicRisk = Math.Clamp(seismicRisk, 0, 100);
        FloodRisk = Math.Clamp(floodRisk, 0, 100);
        LandslideRisk = Math.Clamp(landslideRisk, 0, 100);
        WildfireRisk = Math.Clamp(wildfireRisk, 0, 100);
        LastCalculatedAt = DateTimeOffset.UtcNow;
        MarkUpdated();
    }
}
