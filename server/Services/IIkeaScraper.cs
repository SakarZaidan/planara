namespace Planara.Services;

public interface IIkeaScraper
{
    Task<int> ScrapeAndUpsertAsync(CancellationToken ct = default);
    Task<int> SeedAsync(CancellationToken ct = default);
}
