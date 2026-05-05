using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Planara.Services;

public class GeminiClient : IGeminiClient
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly ILogger<GeminiClient> _logger;

    private const string TextModel = "gemini-2.0-flash";
    private const string ImageModel = "gemini-2.0-flash-preview-image-generation";

    public GeminiClient(HttpClient http, IConfiguration config, ILogger<GeminiClient> logger)
    {
        _http = http;
        _apiKey = config["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini:ApiKey not configured");
        _baseUrl = config["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta";
        _logger = logger;
    }

    public async Task<string> GenerateTextAsync(string systemPrompt, string userContent, bool jsonMode = true, CancellationToken ct = default)
    {
        object generationConfig = jsonMode
            ? new { temperature = 0.3, responseMimeType = "application/json" }
            : (object)new { temperature = 0.6 };

        var payload = new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[] { new { role = "user", parts = new[] { new { text = userContent } } } },
            generationConfig
        };

        var url = $"{_baseUrl}/models/{TextModel}:generateContent?key={_apiKey}";
        var response = await PostAsync(url, payload, ct);
        var root = JsonNode.Parse(response);

        var finishReason = root?["candidates"]?[0]?["finishReason"]?.GetValue<string>();
        if (finishReason == "SAFETY")
            throw new InvalidOperationException("Gemini blocked response: SAFETY");

        var text = root?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();
        if (string.IsNullOrWhiteSpace(text))
        {
            _logger.LogError("Gemini text response empty. Full response: {Response}", response);
            throw new InvalidOperationException("Gemini returned no text content");
        }
        return text;
    }

    public async Task<byte[]> GenerateImageAsync(string systemPrompt, string userContent, string size = "1536x1024", CancellationToken ct = default)
    {
        var promptText = string.IsNullOrWhiteSpace(systemPrompt)
            ? userContent
            : $"{systemPrompt}\n\n{userContent}";

        var payload = new
        {
            contents = new[] { new { role = "user", parts = new[] { new { text = promptText } } } },
            generationConfig = new { responseModalities = new[] { "IMAGE", "TEXT" } }
        };

        var url = $"{_baseUrl}/models/{ImageModel}:generateContent?key={_apiKey}";
        var response = await PostAsync(url, payload, ct);
        var root = JsonNode.Parse(response);

        var parts = root?["candidates"]?[0]?["content"]?["parts"]?.AsArray();
        if (parts != null)
        {
            foreach (var part in parts)
            {
                var inlineData = part?["inlineData"];
                if (inlineData != null)
                {
                    var b64 = inlineData["data"]?.GetValue<string>();
                    if (!string.IsNullOrWhiteSpace(b64))
                        return Convert.FromBase64String(b64);
                }
            }
        }

        var snippet = response[..Math.Min(500, response.Length)];
        _logger.LogError("Gemini image response missing inlineData. Response: {Response}", snippet);
        throw new InvalidOperationException("Gemini returned no image data");
    }

    private async Task<string> PostAsync(string url, object payload, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(payload);

        for (int attempt = 0; attempt < 3; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(180));

            var res = await _http.SendAsync(request, cts.Token);
            var body = await res.Content.ReadAsStringAsync(ct);

            if (res.IsSuccessStatusCode) return body;

            var errMsg = ExtractError(body);
            var statusCode = (int)res.StatusCode;

            if ((statusCode == 429 || statusCode == 503) && attempt < 2)
            {
                var delay = (attempt + 1) * 8;
                _logger.LogWarning("Gemini {Status}, retrying in {Delay}s (attempt {A}/3)", statusCode, delay, attempt + 1);
                await Task.Delay(TimeSpan.FromSeconds(delay), ct);
                continue;
            }

            _logger.LogError("Gemini API {Status} from {Url}: {Error}", statusCode, url, errMsg);
            throw new HttpRequestException($"Gemini {statusCode}: {errMsg}");
        }

        throw new HttpRequestException("Gemini: max retries exceeded");
    }

    private static string ExtractError(string body)
    {
        try
        {
            var node = JsonNode.Parse(body);
            return node?["error"]?["message"]?.GetValue<string>() ?? body[..Math.Min(200, body.Length)];
        }
        catch
        {
            return body[..Math.Min(200, body.Length)];
        }
    }
}
