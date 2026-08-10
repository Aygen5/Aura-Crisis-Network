using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using Aura.Domain.Entities;
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
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public UploadReportAttachmentCommandHandler(
        ICitizenReportRepository citizenReportRepository,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _citizenReportRepository = citizenReportRepository;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<ReportAttachmentDto?> Handle(UploadReportAttachmentCommand request, CancellationToken cancellationToken)
    {
        var report = await _citizenReportRepository.GetByIdAsync(request.ReportId, cancellationToken);
        if (report == null) return null;

        var currentUserId = _currentUserService.UserId;

        if (string.IsNullOrWhiteSpace(currentUserId) || report.ReporterUserId != currentUserId)
        {
            return null;
        }

        var fileUrl = await _fileStorageService.SaveFileAsync(
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken
        );

        var attachment = new ReportAttachment(request.ReportId, request.FileName, fileUrl, request.ContentType, request.FileSizeBytes);
        await _citizenReportRepository.AddAttachmentAsync(attachment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
