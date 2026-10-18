# Build context is backend/ (not backend/Marketplace.Api), because the API
# project references ../Marketplace.Data and must be able to see it.

# ---- Build stage --------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy just the project files first so restore is cached independently of source.
COPY Marketplace.Api/Marketplace.Api.csproj Marketplace.Api/
COPY Marketplace.Data/Marketplace.Data.csproj Marketplace.Data/
RUN dotnet restore Marketplace.Api/Marketplace.Api.csproj

COPY . .
RUN dotnet publish Marketplace.Api/Marketplace.Api.csproj -c Release -o /app/publish --no-restore

# ---- Runtime stage --------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Run as a non-root user for a slightly hardened production image.
# The base image already ships an "app" user; APP_UID is its uid (1654).
USER $APP_UID

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Marketplace.Api.dll"]
