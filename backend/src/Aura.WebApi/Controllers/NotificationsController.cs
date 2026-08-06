using Aura.Application.Common.Interfaces;
using Aura.Application.Notifications.Commands;
using Aura.Application.Notifications.DTOs;
using Aura.Application.Notifications.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly ICurrentUserService _currentUserService;

    public NotificationsController(ISender sender, ICurrentUserService currentUserService)
    {
        _sender = sender;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetMyNotifications(
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId ?? "System";
        var result = await _sender.Send(new GetUserNotificationsQuery(userId, limit), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Operator")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<ActionResult<Guid>> SendNotification(
        [FromBody] SendNotificationCommand command,
        CancellationToken cancellationToken = default)
    {
        var notificationId = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetMyNotifications), new { id = notificationId }, notificationId);
    }

    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var success = await _sender.Send(new MarkNotificationAsReadCommand(id), cancellationToken);
        if (!success) return NotFound();

        return NoContent();
    }
}
