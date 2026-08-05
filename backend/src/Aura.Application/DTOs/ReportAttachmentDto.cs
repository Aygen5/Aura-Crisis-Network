namespace Aura.Application.DTOs;

public record ReportAttachmentDto(
    Guid Id,
    Guid CitizenReportId,
    string FileName,
    string FileUrl,
    string ContentType,
    long FileSizeBytes,
    DateTime UploadedAt
);
