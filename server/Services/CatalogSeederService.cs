namespace Planara.Services;

public class CatalogSeederService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CatalogSeederService> _logger;

    public CatalogSeederService(IServiceScopeFactory scopeFactory, ILogger<CatalogSeederService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(3000, stoppingToken);
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var scraper = scope.ServiceProvider.GetRequiredService<IIkeaScraper>();
            var count = await scraper.SeedAsync(stoppingToken);
            _logger.LogInformation("Furniture catalog seeded: {Count} items upserted", count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog seed on startup failed (non-fatal)");
        }
    }
}
