namespace Planara.Services;

public interface IFurnitureMatcher
{
    Task<List<object>> GetMatchesAsync(List<string> tokens, string? category, CancellationToken ct = default);
}
