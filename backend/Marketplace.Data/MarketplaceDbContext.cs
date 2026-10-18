using Marketplace.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.Data;

public class MarketplaceDbContext(DbContextOptions<MarketplaceDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();

    // The schema is created by the SQL scripts in Db/Scripts. The configuration
    // below does not generate anything - it describes the existing tables to EF
    // so queries translate correctly. Any change to a script must be mirrored here.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");

            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Name).HasColumnName("name");
            entity.Property(c => c.Description).HasColumnName("description");

            entity.HasIndex(c => c.Name).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");

            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.Name).HasColumnName("name");
            entity.Property(p => p.Description).HasColumnName("description");
            entity.Property(p => p.Price).HasColumnName("price").HasPrecision(10, 2);
            entity.Property(p => p.Stock).HasColumnName("stock");
            entity.Property(p => p.ImageUrl).HasColumnName("image_url");
            entity.Property(p => p.CreatedAt).HasColumnName("created_at");
            entity.Property(p => p.CategoryId).HasColumnName("category_id");

            entity.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict); // don't allow deleting a category that still has products
        });
    }
}
