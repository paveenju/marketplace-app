using Marketplace.Data;
using Marketplace.Data.Db;

var builder = WebApplication.CreateBuilder(args);

// ---- Services ----------------------------------------------------------

const string CorsPolicy = "AllowAngularDev";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Marketplace API",
        Version = "v1",
        Description = "Simple Products & Categories REST API backing the Angular marketplace front-end."
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddMarketplaceData(connectionString);

// Allow the Angular dev server (ng serve, default port 4200) to call this API directly.
// In production, nginx proxies /api to this service instead, so CORS isn't even hit.
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ---- Apply the SQL scripts in Db/Scripts before serving traffic ----
DatabaseMigrator.Run(connectionString);

// ---- Middleware pipeline ------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseHttpsRedirection();
app.MapControllers();

// Simple liveness endpoint - useful for Docker/Kubernetes health checks.
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
