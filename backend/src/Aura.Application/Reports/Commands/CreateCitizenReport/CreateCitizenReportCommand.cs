using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using MediatR;

namespace Aura.Application.Reports.Commands.CreateCitizenReport;

public record CreateCitizenReportCommand(
    string Title,
    DisasterType Type,
    string District,
    string ReporterName,
    string ReporterPhone,
    double Latitude,
    double Longitude,
    string Summary,
    string? ReporterUserId = null
) : IRequest<CitizenReportDto>;

public class CreateCitizenReportCommandHandler : IRequestHandler<CreateCitizenReportCommand, CitizenReportDto>
{
    private readonly ICitizenReportRepository _citizenReportRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICrisisNotificationService _notificationService;

    public CreateCitizenReportCommandHandler(
        ICitizenReportRepository citizenReportRepository,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ICrisisNotificationService notificationService)
    {
        _citizenReportRepository = citizenReportRepository;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<CitizenReportDto> Handle(CreateCitizenReportCommand request, CancellationToken cancellationToken)
    {
        var location = new GeoPoint(request.Latitude, request.Longitude);

        var report = new CitizenReport(
            request.Title,
            request.Type,
            request.District,
            request.ReporterName,
            request.ReporterPhone,
            location,
            request.Summary,
            request.ReporterUserId
        );

        await _citizenReportRepository.AddAsync(report, cancellationToken);

        var systemNotification = new Notification(
            recipientUserId: "Operator",
            title: $"Yeni Vatandaş İhbarı ({report.District})",
            message: $"{report.ReporterName} tarafından ihbar gönderildi: {report.Title}. Detay: {report.Summary}",
            type: NotificationType.ReportStatusChanged,
            payloadJson: $"{{\"reportId\":\"{report.Id}\",\"district\":\"{report.District}\"}}"
        );
        await _notificationRepository.AddAsync(systemNotification, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyReportCreatedAsync(report, cancellationToken);

        return new CitizenReportDto(
            report.Id,
            report.Title,
            report.Type,
            report.District,
            report.ReporterName,
            report.ReporterPhone,
            report.Location.Latitude,
            report.Location.Longitude,
            report.Status,
            report.CorroborationCount,
            report.Summary,
            report.CreatedAt,
            null,
            report.ReporterUserId
        );
    }
}
