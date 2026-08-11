using System.Text;
using System.Text.Json;
using Aura.Application;
using Aura.Infrastructure;
using Aura.Infrastructure.Middlewares;
using Aura.Infrastructure.Persistence;
using Aura.Infrastructure.Services;
using Aura.WebApi.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Metrics;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Aura.WebApi.DbSeeder;
using Microsoft.AspNetCore.Identity;
using Aura.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        "logs/aura-log-.txt",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();


builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddOpenApi();



builder.Services.AddSignalR();


builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddCrisisNotificationService<CrisisHub>();


var secretKey = builder.Configuration["JwtSettings:SecretKey"];

 if (string.IsNullOrWhiteSpace(secretKey) ||
   secretKey.Contains("SuperSecretKeyForAuraCrisisNetworkProductionPlatform2026"))
{
    if (builder.Environment.IsProduction())
    {
        throw new InvalidOperationException(
            "CRITICAL SECURITY FAILURE: 'JwtSettings:SecretKey' is missing or set to a compromised default value in Production environment.");
    }

    secretKey =
        "DevOnly_LocalDevelopment_JwtSecretKey_Must_Be_At_Least_256_Bits_Long!";
}

if (secretKey.Length < 32)
{
    throw new InvalidOperationException(
        "CRITICAL SECURITY FAILURE: 'JwtSettings:SecretKey' must be at least 32 characters (256 bits) long for HMAC-SHA256 signing.");
}

var issuer =
    builder.Configuration["JwtSettings:Issuer"]
    ?? "AuraCrisisNetwork";

var audience =
    builder.Configuration["JwtSettings:Audience"]
    ?? "AuraClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        JwtBearerDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,

            ValidateAudience = true,
            ValidAudience = audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,

            RoleClaimType =
                System.Security.Claims.ClaimTypes.Role,

            NameClaimType =
                System.Security.Claims.ClaimTypes.NameIdentifier
        };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken =
                context.Request.Query["access_token"];

            var path =
                context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();


var allowedOrigins =
    (
        builder.Configuration["CorsSettings:AllowedOrigins"]
        ?? builder.Configuration["AllowedOrigins"]
        ?? (
            builder.Environment.IsProduction()
                ? "https://aura-crisis-network.vercel.app"
                : "http://localhost:5173,http://localhost:3000,http://localhost:5232"
        )
    )
    .Split(
        ',',
        StringSplitOptions.RemoveEmptyEntries |
        StringSplitOptions.TrimEntries)
    .Select(o => o.TrimEnd('/'))
    .Distinct()
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;

            
                if (allowedOrigins.Any(o => o.Equals(origin, StringComparison.OrdinalIgnoreCase) || o == "*"))
                {
                    return true;
                }
                try
                {
                    var uri = new Uri(origin);
                    var host = uri.Host;

                    if (host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase) ||
                        host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                        host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
                catch
                {
                }

                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


var isTesting =
    builder.Environment.IsEnvironment("Testing");

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;



    options.AddPolicy(
        "auth",
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isTesting ? 1000 : 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy(
        "api",
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isTesting ? 10000 : 200,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});



var app = builder.Build();


app.UseExceptionHandler();


app.UseMiddleware<CorrelationIdMiddleware>();


app.MapOpenApi();


app.UseCors("CorsPolicy");

app.UseStaticFiles();

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();



app.MapHub<CrisisHub>("/hubs/crisis");

app.MapHub<VehicleTrackingHub>("/hubs/vehicles");



app.MapPrometheusScrapingEndpoint();



app.MapHealthChecks(
    "/health",
    new HealthCheckOptions
    {
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType =
                "application/json";

            var result =
                JsonSerializer.Serialize(
                    new
                    {
                        Status =
                            report.Status.ToString(),

                        TotalDurationMs =
                            report.TotalDuration
                                .TotalMilliseconds,

                        CheckedAt =
                            DateTimeOffset.UtcNow,

                        Entries =
                            report.Entries.Select(e => new
                            {
                                Component = e.Key,

                                Status =
                                    e.Value.Status
                                        .ToString(),

                                DurationMs =
                                    e.Value.Duration
                                        .TotalMilliseconds,

                                Description =
                                    e.Value.Description
                            })
                    },
                    new JsonSerializerOptions
                    {
                        WriteIndented = true
                    });

            await context.Response.WriteAsync(result);
        }
    });



app.MapHealthChecks(
    "/health/live",
    new HealthCheckOptions
    {
        Predicate = _ => false
    });



app.MapHealthChecks(
    "/health/ready",
    new HealthCheckOptions
    {
        Predicate = check =>
            check.Tags.Contains("ready")
    });



if (!app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var dbContext = services.GetRequiredService<AuraDbContext>();

        await dbContext.Database.MigrateAsync();

        await AuraDbSeeder.SeedAsync(dbContext);

        try
        {
            await DbSeeder.SeedRolesAndUsersAsync(services);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Demo hesaplar oluşturulurken bir hata oluştu: " + ex.Message);
        }
    }
}

app.MapGet("/olustur-demo", async (
    [Microsoft.AspNetCore.Mvc.FromServices] UserManager<ApplicationUser> userManager,
    [Microsoft.AspNetCore.Mvc.FromServices] RoleManager<ApplicationRole> roleManager) =>
{
    if (!await roleManager.RoleExistsAsync("Operator"))
    {
        await roleManager.CreateAsync(new ApplicationRole("Operator"));
    }

    if (!await roleManager.RoleExistsAsync("Citizen"))
    {
        await roleManager.CreateAsync(new ApplicationRole("Citizen"));
    }

    var opEmail = "operator@aura.com";
    var opUser = await userManager.FindByEmailAsync(opEmail);
    var opStatus = "Zaten mevcut.";

    if (opUser == null)
    {
        opUser = new ApplicationUser { UserName = opEmail, Email = opEmail, FullName = "Demo Operator", EmailConfirmed = true };
        var opResult = await userManager.CreateAsync(opUser, "Aura2026!");
        if (opResult.Succeeded)
        {
            await userManager.AddToRoleAsync(opUser, "Operator");
            opStatus = "Başarıyla oluşturuldu.";
        }
        else
        {
            opStatus = "Hata: " + string.Join(", ", opResult.Errors.Select(e => e.Description));
        }
    }

    var citEmail = "citizen@aura.com";
    var citUser = await userManager.FindByEmailAsync(citEmail);
    var citStatus = "Zaten mevcut.";

    if (citUser == null)
    {
        citUser = new ApplicationUser { UserName = citEmail, Email = citEmail, FullName = "Demo Citizen", EmailConfirmed = true };
        var citResult = await userManager.CreateAsync(citUser, "Aura2026!");
        if (citResult.Succeeded)
        {
            await userManager.AddToRoleAsync(citUser, "Citizen");
            citStatus = "Başarıyla oluşturuldu.";
        }
        else
        {
            citStatus = "Hata: " + string.Join(", ", citResult.Errors.Select(e => e.Description));
        }
    }

    return Results.Ok(new
    {
        Message = "Demo hesap kontrolü tamamlandı.",
        OperatorAccount = opStatus,
        CitizenAccount = citStatus
    });
});

app.Run();

public partial class Program { }