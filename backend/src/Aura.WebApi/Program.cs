using Aura.Application;
using Aura.Infrastructure;
using Aura.Infrastructure.Persistence;
using Aura.WebApi.Hubs;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCrisisNotificationService<CrisisHub>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("CorsPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapHub<CrisisHub>("/hubs/crisis");

app.MapGet("/health", async (AuraDbContext dbContext) =>
{
    var canConnect = await dbContext.Database.CanConnectAsync();
    return canConnect
        ? Results.Ok(new { Status = "Healthy", Database = "Connected", Timestamp = DateTimeOffset.UtcNow })
        : Results.Problem("Database connection failed", statusCode: 503);
});

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.Run();
