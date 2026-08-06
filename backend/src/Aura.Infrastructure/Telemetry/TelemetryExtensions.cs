using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace Aura.Infrastructure.Telemetry;

public static class TelemetryExtensions
{
    public static IServiceCollection AddAuraTelemetryAndHealth(
        this IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        services.AddOpenTelemetry()
            .ConfigureResource(r => r.AddService("AuraCrisisNetwork", serviceVersion: "2.5.0"))
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddPrometheusExporter();
            })
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation(options =>
                    {
                        options.SetDbStatementForText = true;
                    });
            });

        var healthChecks = services.AddHealthChecks()
            .AddNpgSql(
                connectionString,
                name: "PostgreSQL-PostGIS",
                tags: new[] { "db", "sql", "ready" });

        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            healthChecks.AddRedis(
                redisConnectionString,
                name: "Redis-DistributedCache",
                tags: new[] { "cache", "redis", "ready" });
        }

        return services;
    }
}
