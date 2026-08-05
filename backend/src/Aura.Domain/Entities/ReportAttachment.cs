using Aura.Domain.Common;

namespace Aura.Domain.Entities;

public class ReportAttachment : BaseEntity
{
    public Guid CitizenReportId { get; private set; }
    public string FileName { get; private set; }
    public string FileUrl { get; private set; }
    public string ContentType { get; private set; }
    public long FileSizeBytes { get; private set; }
    public DateTime UploadedAt { get; private set; }

    #pragma warning disable CS8618
    private ReportAttachment() { }
    #pragma warning restore CS8618

    public ReportAttachment(
        Guid citizenReportId,
        string fileName,
        string fileUrl,
        string contentType,
        long fileSizeBytes)
    {
        if (citizenReportId == Guid.Empty) throw new ArgumentException("CitizenReportId cannot be empty.", nameof(citizenReportId));
        if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentException("FileName cannot be empty.", nameof(fileName));
        if (string.IsNullOrWhiteSpace(fileUrl)) throw new ArgumentException("FileUrl cannot be empty.", nameof(fileUrl));

        CitizenReportId = citizenReportId;
        FileName = fileName;
        FileUrl = fileUrl;
        ContentType = contentType ?? "application/octet-stream";
        FileSizeBytes = fileSizeBytes;
        UploadedAt = DateTime.UtcNow;
    }
}
