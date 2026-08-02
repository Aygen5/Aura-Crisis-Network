using Aura.Application.Common.Interfaces;
using Aura.Domain.Enums;
using MediatR;

namespace Aura.Application.Reports.Commands.UpdateReportStatus;

public record UpdateReportStatusCommand(Guid ReportId, ReportStatus Status) : IRequest<bool>;

public class UpdateReportStatusCommandHandler : IRequestHandler<UpdateReportStatusCommand, bool>
{
    private readonly ICitizenReportRepository _citizenReportRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICrisisNotificationService _notificationService;

    public UpdateReportStatusCommandHandler(
        ICitizenReportRepository citizenReportRepository,
        IUnitOfWork unitOfWork,
        ICrisisNotificationService notificationService)
    {
        _citizenReportRepository = citizenReportRepository;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(UpdateReportStatusCommand request, CancellationToken cancellationToken)
    {
        var report = await _citizenReportRepository.GetByIdAsync(request.ReportId, cancellationToken);
        if (report == null) return false;

        if (request.Status == ReportStatus.Verified)
        {
            report.Verify();
        }
        else if (request.Status == ReportStatus.Rejected)
        {
            report.Reject();
        }

        _citizenReportRepository.Update(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyReportStatusChangedAsync(report, cancellationToken);

        return true;
    }
}
