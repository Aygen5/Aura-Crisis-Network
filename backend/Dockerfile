FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY AuraCrisisNetwork.slnx ./
COPY src/Aura.Domain/Aura.Domain.csproj src/Aura.Domain/
COPY src/Aura.Application/Aura.Application.csproj src/Aura.Application/
COPY src/Aura.Infrastructure/Aura.Infrastructure.csproj src/Aura.Infrastructure/
COPY src/Aura.WebApi/Aura.WebApi.csproj src/Aura.WebApi/
COPY tests/Aura.UnitTests/Aura.UnitTests.csproj tests/Aura.UnitTests/
COPY tests/Aura.IntegrationTests/Aura.IntegrationTests.csproj tests/Aura.IntegrationTests/

RUN dotnet restore AuraCrisisNetwork.slnx

COPY . .
RUN dotnet publish src/Aura.WebApi/Aura.WebApi.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080


ENTRYPOINT ["dotnet", "Aura.WebApi.dll"]
