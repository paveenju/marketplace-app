namespace Marketplace.Api.Dtos;

public record ProductDto(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    string? ImageUrl,
    DateTime CreatedAt,
    int CategoryId,
    string CategoryName
);

public record ProductCreateDto(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    string? ImageUrl,
    int CategoryId
);

public record ProductUpdateDto(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    string? ImageUrl,
    int CategoryId
);
