using Aura.Application.Common.Interfaces;
using Aura.Infrastructure.BackgroundJobs;
using Aura.Infrastructure.Identity;
using Aura.Infrastructure.Jobs;
using Aura.Infrastructure.Notifications;
using Aura.Infrastructure.Notifications.Channels;
using Aura.Infrastructure.Persistence;
using Aura.Infrastructure.Persistence.Repositories;
using Aura.Infrastructure.Services;
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
            ?? "Host=localhost;Port=5432;Database=aura_db;Username=aura_user;Password=aura_password_2026!";

        services.AddDbContext<AuraDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
                npgsqlOptions.UseNetTopologySuite()));

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

        services.AddScoped<INotificationChannel, SignalRNotificationChannel>();
        services.AddScoped<INotificationChannel, EmailNotificationChannel>();
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();

        services.AddHttpClient<IKandilliIngestionService, KandilliIngestionService>();
        services.AddHostedService<KandilliBackgroundWorker>();

        services.AddHttpClient<IMeteorologyService, MeteorologyService>();
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
