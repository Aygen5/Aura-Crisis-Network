using System.Security.Claims;
using System.Text.Json;
using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Aura.Infrastructure.Persistence.Interceptors;

public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ICurrentUserService _currentUserService;

    private static readonly HashSet<string> SensitiveFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "PasswordHash",
        "RefreshToken",
        "SecurityStamp",
        "AccessToken",
        "ConcurrencyStamp",
        "Password"
    };

    public AuditSaveChangesInterceptor(
        IHttpContextAccessor httpContextAccessor,
        ICurrentUserService currentUserService)
    {
        _httpContextAccessor = httpContextAccessor;
        _currentUserService = currentUserService;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context == null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        var httpContext = _httpContextAccessor.HttpContext;
        var userIdStr = _currentUserService.UserId ?? httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = Guid.TryParse(userIdStr, out var parsedGuid) ? parsedGuid : null;
        var userEmail = _currentUserService.Email ?? httpContext?.User?.FindFirstValue(ClaimTypes.Email) ?? httpContext?.User?.Identity?.Name;
        var ipAddress = GetClientIpAddress(httpContext);

        var auditEntries = new List<AuditLog>();

        foreach (var entry in eventData.Context.ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State is EntityState.Detached or EntityState.Unchanged)
            {
                continue;
            }

            var entityName = entry.Entity.GetType().Name;
            var primaryKey = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "Unknown";

            var oldValues = new Dictionary<string, object?>();
            var newValues = new Dictionary<string, object?>();
            var changedColumns = new List<string>();

            foreach (var property in entry.Properties)
            {
                var propertyName = property.Metadata.Name;
                if (SensitiveFields.Contains(propertyName))
                {
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        newValues[propertyName] = property.CurrentValue;
                        changedColumns.Add(propertyName);
                        break;

                    case EntityState.Deleted:
                        oldValues[propertyName] = property.OriginalValue;
                        changedColumns.Add(propertyName);
                        break;

                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            var original = property.OriginalValue;
                            var current = property.CurrentValue;
                            if (!Equals(original, current))
                            {
                                oldValues[propertyName] = original;
                                newValues[propertyName] = current;
                                changedColumns.Add(propertyName);
                            }
                        }
                        break;
                }
            }

            if (changedColumns.Count == 0 && entry.State == EntityState.Modified)
            {
                continue;
            }

            var action = entry.State.ToString();
            var oldJson = oldValues.Count > 0 ? JsonSerializer.Serialize(oldValues) : null;
            var newJson = newValues.Count > 0 ? JsonSerializer.Serialize(newValues) : null;
            var colsJson = changedColumns.Count > 0 ? JsonSerializer.Serialize(changedColumns) : null;

            var auditLog = new AuditLog(
                userId,
                userEmail,
                ipAddress,
                entityName,
                action,
                primaryKey,
                oldJson,
                newJson,
                colsJson
            );

            auditEntries.Add(auditLog);
        }

        if (auditEntries.Count > 0)
        {
            eventData.Context.Set<AuditLog>().AddRange(auditEntries);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static string? GetClientIpAddress(HttpContext? httpContext)
    {
        if (httpContext == null) return null;

        var forwardedHeader = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedHeader))
        {
            var firstIp = forwardedHeader.Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(firstIp)) return firstIp;
        }

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }
}
