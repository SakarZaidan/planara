namespace Planara.Services;

public interface IFurnitureMatcher
{
    Task<List<object>> GetMatchesAsync(List<string> tokens, string? category, CancellationToken ct = default);
    Task<CatalogResult> GetCatalogAsync(string? category, string? style, string? search, int limit, int offset, CancellationToken ct = default);
}

public record CatalogResult(List<object> Items, int TotalCount);
