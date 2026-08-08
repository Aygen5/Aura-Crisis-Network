using Aura.Domain.Common;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;

namespace Aura.Domain.Entities;

public class CitizenReport : BaseEntity
{
    private readonly List<ReportAttachment> _attachments = new();

    public string Title { get; private set; }
    public DisasterType Type { get; private set; }
    public string District { get; private set; }
    public string ReporterName { get; private set; }
    public string ReporterPhone { get; private set; }
    public GeoPoint Location { get; private set; }
    public ReportStatus Status { get; private set; }
    public int CorroborationCount { get; private set; }
    public string Summary { get; private set; }
    public string? ReporterUserId { get; private set; }

    public IReadOnlyCollection<ReportAttachment> Attachments => _attachments.AsReadOnly();

    #pragma warning disable CS8618
    private CitizenReport() { }
    #pragma warning restore CS8618

    public CitizenReport(
        string title,
        DisasterType type,
        string district,
        string reporterName,
        string reporterPhone,
        GeoPoint location,
        string summary,
        string? reporterUserId = null)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title cannot be empty.", nameof(title));
        if (string.IsNullOrWhiteSpace(district)) throw new ArgumentException("District cannot be empty.", nameof(district));

        Title = title;
        Type = type;
        District = district;
        ReporterName = reporterName ?? "Anonymous";
        ReporterPhone = reporterPhone ?? string.Empty;
        Location = location;
        Status = ReportStatus.Pending;
        CorroborationCount = 1;
        Summary = summary ?? string.Empty;
        ReporterUserId = reporterUserId;
    }

    public void Verify()
    {
        if (Status == ReportStatus.Verified) return;
        Status = ReportStatus.Verified;
        MarkUpdated();
    }

    public void Reject()
    {
        if (Status == ReportStatus.Rejected) return;
        Status = ReportStatus.Rejected;
        MarkUpdated();
    }

    public void IncrementCorroboration()
    {
        CorroborationCount++;
        MarkUpdated();
    }

    public void AddAttachment(string fileName, string fileUrl, string contentType, long fileSizeBytes)
    {
        var attachment = new ReportAttachment(Id, fileName, fileUrl, contentType, fileSizeBytes);
        _attachments.Add(attachment);
        MarkUpdated();
    }
}
