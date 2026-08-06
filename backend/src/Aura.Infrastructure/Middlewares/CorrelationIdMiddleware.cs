using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace Aura.Infrastructure.Middlewares;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string CorrelationIdHeader = "X-Correlation-ID";
    private const string AppVersion = "2.5.0-phase9.3";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
            ?? context.Request.Headers["X-Request-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString("N");

        context.Request.Headers[CorrelationIdHeader] = correlationId;
        context.Response.Headers[CorrelationIdHeader] = correlationId;

        var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";
        var userEmail = context.User?.FindFirstValue(ClaimTypes.Email) ?? context.User?.Identity?.Name ?? "Anonymous";
        var clientIp = GetClientIp(context);
        var machineName = Environment.MachineName;
        var envName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("RequestId", context.TraceIdentifier))
        using (LogContext.PushProperty("UserId", userId))
        using (LogContext.PushProperty("UserEmail", userEmail))
        using (LogContext.PushProperty("ClientIp", clientIp))
        using (LogContext.PushProperty("MachineName", machineName))
        using (LogContext.PushProperty("Environment", envName))
        using (LogContext.PushProperty("ApplicationVersion", AppVersion))
        {
            await _next(context);
        }
    }

    private static string GetClientIp(HttpContext context)
    {
        var forwardedHeader = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedHeader))
        {
            var firstIp = forwardedHeader.Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(firstIp)) return firstIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}
