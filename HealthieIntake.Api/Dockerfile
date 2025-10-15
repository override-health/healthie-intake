FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["HealthieIntake.Api.csproj", "."]
RUN dotnet restore "./HealthieIntake.Api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "HealthieIntake.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HealthieIntake.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HealthieIntake.Api.dll"]
