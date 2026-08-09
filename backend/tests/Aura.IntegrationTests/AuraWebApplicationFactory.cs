using System.Net.Http.Headers;
using Aura.Application.Common.Interfaces;
using Aura.Infrastructure.Identity;
using Aura.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace Aura.IntegrationTests;

public class AuraWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public static readonly System.Text.Json.JsonSerializerOptions JsonOptions = new System.Text.Json.JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private const string TestConnectionString = "Host=127.0.0.1;Port=5432;Database=aura_integration_test_db;Username=aura_user;Password=aura_password_2026!;";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:DefaultConnection", TestConnectionString);

        builder.ConfigureServices(services =>
        {
            var hostedServices = services.Where(s => s.ServiceType == typeof(IHostedService)).ToList();
            foreach (var hs in hostedServices)
            {
                if (hs.ImplementationType != null &&
                   (hs.ImplementationType.Name.Contains("Kandilli") ||
                    hs.ImplementationType.Name.Contains("Meteorology") ||
                    hs.ImplementationType.Name.Contains("NotificationOutbox")))
                {
                    services.Remove(hs);
                }
            }
        });

        builder.UseEnvironment("Testing");
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
        
        await dbContext.Database.EnsureCreatedAsync();

        try
        {
            await dbContext.Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS postgis;");
        }
        catch
        {
            // Extension notice safely handled
        }

        await AuraDbSeeder.SeedAsync(dbContext);
        await SeedIntegrationTestUsersAsync(scope.ServiceProvider);
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
    }

    private static async Task SeedIntegrationTestUsersAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        string[] roles = ["Citizen", "Operator", "Admin"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                try
                {
                    await roleManager.CreateAsync(new ApplicationRole { Name = role, NormalizedName = role.ToUpperInvariant() });
                }
                catch
                {
                    // Ignore concurrency duplicate role creation
                }
            }
        }

        await CreateUserIfNotExist(userManager, "citizen.test@aura.gov.tr", "Citizen123!", "Citizen Test User", "Citizen");
        await CreateUserIfNotExist(userManager, "citizen2.test@aura.gov.tr", "Citizen123!", "Citizen Test User 2", "Citizen");
        await CreateUserIfNotExist(userManager, "operator.test@aura.gov.tr", "Operator123!", "Operator Test User", "Operator");
    }

    private static async Task CreateUserIfNotExist(UserManager<ApplicationUser> userManager, string email, string password, string fullName, string role)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
            }
        }
        else
        {
            if (!await userManager.IsInRoleAsync(user, role))
            {
                await userManager.AddToRoleAsync(user, role);
            }
        }
    }

    public async Task<HttpClient> CreateAuthenticatedClientAsync(string email, string password)
    {
        var client = CreateClient();

        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var tokenProvider = scope.ServiceProvider.GetRequiredService<ITokenProvider>();

        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            throw new InvalidOperationException($"Test user with email '{email}' not found.");
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = tokenProvider.GenerateAccessToken(user.Id.ToString(), user.Email!, user.FullName ?? "Test User", roles);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
