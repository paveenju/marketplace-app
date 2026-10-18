using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Marketplace.Data;

public static class ServiceCollectionExtensions
{
    // Registers the data access layer. Keeps the choice of provider (Npgsql) an
    // implementation detail of this project rather than something the API knows.
    public static IServiceCollection AddMarketplaceData(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<MarketplaceDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
