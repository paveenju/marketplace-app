using Marketplace.Data;
using Marketplace.Api.Dtos;
using Marketplace.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(MarketplaceDbContext db) : ControllerBase
{
    // GET api/categories
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var categories = await db.Categories
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Products.Count))
            .ToListAsync();

        return Ok(categories);
    }

    // GET api/categories/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await db.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Products.Count))
            .FirstOrDefaultAsync();

        return category is null ? NotFound() : Ok(category);
    }

    // POST api/categories
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryCreateDto dto)
    {
        var category = new Category { Name = dto.Name, Description = dto.Description };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var result = new CategoryDto(category.Id, category.Name, category.Description, 0);
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, result);
    }

    // PUT api/categories/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoryUpdateDto dto)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        category.Name = dto.Name;
        category.Description = dto.Description;
        await db.SaveChangesAsync();

        return NoContent();
    }

    // DELETE api/categories/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await db.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null) return NotFound();

        if (category.Products.Count > 0)
        {
            return Conflict(new { message = "Cannot delete a category that still has products." });
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
