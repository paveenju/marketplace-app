using Marketplace.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.Api.Data;

// Static, deterministic seed data applied via EF Core's HasData so it ships as part
// of a migration and is reproducible on every environment (local, CI, staging, prod).
public static class SeedData
{
    private static readonly DateTime SeedDate = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Electronics", Description = "Gadgets, devices and accessories" },
            new Category { Id = 2, Name = "Books", Description = "Fiction, non-fiction and technical books" },
            new Category { Id = 3, Name = "Home & Garden", Description = "Furniture, decor and outdoor items" }
        );

        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Id = 1, Name = "Wireless Mouse", Description = "Ergonomic 2.4GHz wireless mouse",
                Price = 24.99m, Stock = 120, CategoryId = 1, CreatedAt = SeedDate
            },
            new Product
            {
                Id = 2, Name = "Mechanical Keyboard", Description = "Hot-swappable mechanical keyboard",
                Price = 89.90m, Stock = 45, CategoryId = 1, CreatedAt = SeedDate
            },
            new Product
            {
                Id = 3, Name = "Clean Code", Description = "A Handbook of Agile Software Craftsmanship",
                Price = 34.50m, Stock = 60, CategoryId = 2, CreatedAt = SeedDate
            },
            new Product
            {
                Id = 4, Name = "Indoor Plant Pot", Description = "Ceramic pot, 20cm diameter",
                Price = 14.00m, Stock = 200, CategoryId = 3, CreatedAt = SeedDate
            }
        );
    }
}
