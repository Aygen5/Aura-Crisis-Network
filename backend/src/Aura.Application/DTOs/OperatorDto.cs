namespace Aura.Application.DTOs;

public record OperatorDto(
    Guid Id,
    string FullName,
    string BadgeNumber,
    string Email,
    string Organization,
    bool IsOnShift
);
