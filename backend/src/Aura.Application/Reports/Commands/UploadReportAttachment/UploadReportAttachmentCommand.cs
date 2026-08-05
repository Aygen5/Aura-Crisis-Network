using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.Reports.Commands.UploadReportAttachment;

public record UploadReportAttachmentCommand(
    Guid ReportId,
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileSizeBytes
) : IRequest<ReportAttachmentDto?>;

public class UploadReportAttachmentCommandHandler : IRequestHandler<UploadReportAttachmentCommand, ReportAttachmentDto?>
{
    private readonly ICitizenReportRepository _citizenReportRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;

    public UploadReportAttachmentCommandHandler(
        ICitizenReportRepository citizenReportRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork)
    {
        _citizenReportRepository = citizenReportRepository;
        _fileStorageService = fileStorageService;
        _unitOfWork = unitOfWork;
    }

    public async Task<ReportAttachmentDto?> Handle(UploadReportAttachmentCommand request, CancellationToken cancellationToken)
    {
        var report = await _citizenReportRepository.GetByIdAsync(request.ReportId, cancellationToken);
        if (report == null) return null;

        var fileUrl = await _fileStorageService.SaveFileAsync(
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken
        );

        report.AddAttachment(request.FileName, fileUrl, request.ContentType, request.FileSizeBytes);
        _citizenReportRepository.Update(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var attachment = report.Attachments.Last();

        return new ReportAttachmentDto(
            attachment.Id,
            attachment.CitizenReportId,
            attachment.FileName,
            attachment.FileUrl,
            attachment.ContentType,
            attachment.FileSizeBytes,
            attachment.UploadedAt
        );
    }
}
