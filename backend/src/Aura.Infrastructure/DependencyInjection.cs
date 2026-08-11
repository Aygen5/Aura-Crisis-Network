using Aura.Application.Common.Interfaces;
using Aura.Infrastructure.BackgroundJobs;
using Aura.Infrastructure.Identity;
using Aura.Infrastructure.Jobs;
using Aura.Infrastructure.Notifications;
using Aura.Infrastructure.Notifications.Channels;
using Aura.Infrastructure.Persistence;
using Aura.Infrastructure.Persistence.Interceptors;
using Aura.Infrastructure.Persistence.Repositories;
using Aura.Infrastructure.Services;
using Aura.Infrastructure.Telemetry;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aura.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
                               ?? configuration["DATABASE_URL"]
                               ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        if (!string.IsNullOrWhiteSpace(connectionString) && connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(connectionString);
                var userInfo = uri.UserInfo.Split(':');
                var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');

                connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            }
            catch
            {
                // Fallback to original string if Uri parsing fails
            }
        }

        if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Contains("aura_password_2026!"))
        {
            connectionString = "Host=127.0.0.1;Port=5432;Database=aura_db;Username=aura_user;Password=aura_dev_local_password_only;";
        }

        services.AddScoped<AuditSaveChangesInterceptor>();

        services.AddDbContext<AuraDbContext>((sp, options) =>
        {
            var auditInterceptor = sp.GetRequiredService<AuditSaveChangesInterceptor>();
            options.UseNpgsql(connectionString, npgsqlOptions =>
                npgsqlOptions.UseNetTopologySuite())
                .AddInterceptors(auditInterceptor)
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        services.AddAuraTelemetryAndHealth(configuration, connectionString);

        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = "AuraCrisis:";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AuraDbContext>()
        .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();
        services.AddScoped<ITokenProvider, JwtTokenProvider>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<ICitizenReportRepository, CitizenReportRepository>();
        services.AddScoped<IDistrictRiskRepository, DistrictRiskRepository>();
        services.AddScoped<IOperatorRepository, OperatorRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IOutboxRepository, OutboxRepository>();
        services.AddScoped<IRiskZoneRepository, RiskZoneRepository>();
        services.AddScoped<IGisTileRepository, GisTileRepository>();
        services.AddScoped<IEmergencyUnitRepository, EmergencyUnitRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();

        services.AddScoped<INotificationChannel, SignalRNotificationChannel>();
        services.AddScoped<INotificationChannel, EmailNotificationChannel>();
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();

        services.AddHttpClient<IKandilliIngestionService, KandilliIngestionService>();
        services.AddHostedService<KandilliBackgroundWorker>();

        services.AddHttpClient<IMeteorologyService, MeteorologyService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent", "AuraCrisisNetwork/1.0 (Emergency Management Platform)");
        });
        services.AddHostedService<MeteorologyBackgroundWorker>();

        services.AddHostedService<NotificationOutboxProcessorJob>();

        return services;
    }

    public static IServiceCollection AddCrisisNotificationService<THub>(this IServiceCollection services)
        where THub : Microsoft.AspNetCore.SignalR.Hub
    {
        services.AddScoped<ICrisisNotificationService, CrisisNotificationService<THub>>();
        return services;
    }
}
