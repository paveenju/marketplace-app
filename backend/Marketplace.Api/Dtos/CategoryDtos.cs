namespace Marketplace.Api.Dtos;

// Records give us concise, immutable DTOs (C# 9+, still idiomatic in .NET 10).
public record CategoryDto(int Id, string Name, string? Description, int ProductCount);

public record CategoryCreateDto(string Name, string? Description);

public record CategoryUpdateDto(string Name, string? Description);
