using Aura.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Aura.WebApi.DbSeeder;

public static class DbSeeder
{
    public static async Task SeedRolesAndUsersAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        string[] roleNames = { "Operator", "Citizen" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new ApplicationRole(roleName));
            }
        }

        if (await userManager.FindByEmailAsync("operator@aura.com") == null)
        {
            var opUser = new ApplicationUser
            {
                UserName = "operator@aura.com",
                Email = "operator@aura.com",
                FullName = "Demo Operator",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(opUser, "Aura2026!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(opUser, "Operator");
                Console.WriteLine(">>> DEMO OPERATÖR BAŞARIYLA OLUŞTURULDU!");
            }
            else
            {
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($">>> OPERATÖR OLUŞTURULAMADI: {error.Description}");
                }
            }
        }

        if (await userManager.FindByEmailAsync("citizen@aura.com") == null)
        {
            var citUser = new ApplicationUser
            {
                UserName = "citizen@aura.com",
                Email = "citizen@aura.com",
                FullName = "Demo Citizen",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(citUser, "Aura2026!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(citUser, "Citizen");
                Console.WriteLine(">>> DEMO VATANDAŞ BAŞARIYLA OLUŞTURULDU!");
            }
            else
            {
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($">>> VATANDAŞ OLUŞTURULAMADI: {error.Description}");
                }
            }
        }
    }
}