namespace Marketplace.Api.Models;

public class Category
{
    public int Id { get; set; }

    public required string Name { get; set; }

    public string? Description { get; set; }

    // Navigation property - one category has many products
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
