namespace Planara.Services;

public interface IGeminiClient
{
    Task<string> GenerateTextAsync(string systemPrompt, string userContent, bool jsonMode = true, CancellationToken ct = default);
    Task<byte[]> GenerateImageAsync(string systemPrompt, string userContent, string size = "1536x1024", CancellationToken ct = default);
}
