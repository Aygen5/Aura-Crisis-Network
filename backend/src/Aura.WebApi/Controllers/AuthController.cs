using Aura.Application.Auth.Commands.LoginUser;
using Aura.Application.Auth.Commands.RefreshToken;
using Aura.Application.Auth.Commands.RegisterUser;
using Aura.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Aura.WebApi.Controllers;

[Route("api/v1/auth")]
public class AuthController : BaseApiController
{
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { Errors = result.Errors });
        }

        return Ok(new { Message = "User registered successfully.", UserId = result.UserId });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginUserCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (!result.Succeeded || result.AuthResponse == null)
        {
            return Unauthorized(new { Errors = result.Errors });
        }

        return Ok(result.AuthResponse);
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (!result.Succeeded || result.AuthResponse == null)
        {
            return BadRequest(new { Errors = result.Errors });
        }

        return Ok(result.AuthResponse);
    }
}
