using System.Net;
using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Aura.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace Aura.UnitTests.Infrastructure;

public class MeteorologyServiceTests
{
    private readonly Mock<IDistrictRiskRepository> _districtRiskRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<MeteorologyService>> _loggerMock = new();

    [Fact]
    public async Task FetchAndUpdateDistrictWeatherRisksAsync_WhenApiReturns429_ShouldHaltFurtherRequestsAndPreserveExistingData()
    {
        // Arrange
        var existingDistrict = new DistrictRisk("Kadıköy", 75, 50, 50, 50);
        _districtRiskRepoMock
            .Setup(r => r.GetAllDistrictRisksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DistrictRisk> { existingDistrict });

        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        int requestCount = 0;

        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() =>
            {
                requestCount++;
                var response = new HttpResponseMessage((HttpStatusCode)429)
                {
                    Content = new StringContent("{\"reason\":\"Rate limit exceeded\"}")
                };
                response.Headers.RetryAfter = new System.Net.Http.Headers.RetryConditionHeaderValue(TimeSpan.FromSeconds(30));
                return response;
            });

        var httpClient = new HttpClient(handlerMock.Object);
        var service = new MeteorologyService(httpClient, _districtRiskRepoMock.Object, _unitOfWorkMock.Object, _loggerMock.Object);

        // Act
        await service.FetchAndUpdateDistrictWeatherRisksAsync(CancellationToken.None);

        // Assert
        // Should circuit-break on the first 429 response and not send all 14 requests
        requestCount.Should().Be(1);
        
        // Existing risk scores should remain unchanged (Graceful degradation: no corruption to 10/15/10)
        existingDistrict.FloodRisk.Should().Be(50);
        existingDistrict.WildfireRisk.Should().Be(50);
        existingDistrict.LandslideRisk.Should().Be(50);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task FetchAndUpdateDistrictWeatherRisksAsync_WhenApiReturnsSuccess_ShouldUpdateRiskScoresAndSave()
    {
        // Arrange
        var existingDistrict = new DistrictRisk("Kadıköy", 75, 10, 10, 10);
        _districtRiskRepoMock
            .Setup(r => r.GetAllDistrictRisksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DistrictRisk> { existingDistrict });

        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"current\":{\"precipitation\":30.5,\"wind_speed_10m\":45.0}}")
            });

        var httpClient = new HttpClient(handlerMock.Object);
        var service = new MeteorologyService(httpClient, _districtRiskRepoMock.Object, _unitOfWorkMock.Object, _loggerMock.Object);

        // Act
        await service.FetchAndUpdateDistrictWeatherRisksAsync(CancellationToken.None);

        // Assert
        existingDistrict.FloodRisk.Should().Be(85); // 30.5mm precipitation -> 85
        existingDistrict.WildfireRisk.Should().Be(70); // 45km/h wind -> 70
        existingDistrict.LandslideRisk.Should().Be(80); // 30.5mm precipitation -> 80

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
