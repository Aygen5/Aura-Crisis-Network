using Aura.Application.Common.Interfaces;
using MediatR;

namespace Aura.Application.Reports.Commands.VerifyCitizenReport;

public record VerifyCitizenReportCommand(Guid ReportId) : IRequest<bool>;

public class VerifyCitizenReportCommandHandler : IRequestHandler<VerifyCitizenReportCommand, bool>
{
    private readonly ICitizenReportRepository _citizenReportRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICrisisNotificationService _notificationService;

    public VerifyCitizenReportCommandHandler(
        ICitizenReportRepository citizenReportRepository,
        IUnitOfWork unitOfWork,
        ICrisisNotificationService notificationService)
    {
        _citizenReportRepository = citizenReportRepository;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(VerifyCitizenReportCommand request, CancellationToken cancellationToken)
    {
        var report = await _citizenReportRepository.GetByIdAsync(request.ReportId, cancellationToken);
        if (report == null) return false;

        report.Verify();
        _citizenReportRepository.Update(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyReportStatusChangedAsync(report, cancellationToken);
        return true;
    }
}
