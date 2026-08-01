using Aura.Application.Common.Interfaces;
using Aura.Infrastructure.Persistence;
using Aura.Infrastructure.Persistence.Repositories;
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

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<ICitizenReportRepository, CitizenReportRepository>();
        services.AddScoped<IDistrictRiskRepository, DistrictRiskRepository>();
        services.AddScoped<IOperatorRepository, OperatorRepository>();

        return services;
    }
}
