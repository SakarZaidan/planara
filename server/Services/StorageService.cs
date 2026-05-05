using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Planara.Services;

public class StorageService : IStorageService
{
    private readonly HttpClient _http;
    private readonly string _supabaseUrl;
    private readonly string _serviceKey;

    public StorageService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _supabaseUrl = config["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url not configured");
        _serviceKey = config["Supabase:ServiceKey"] ?? throw new InvalidOperationException("Supabase:ServiceKey not configured");
    }

    public async Task<string> UploadAsync(string bucket, string path, byte[] data, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);

        var url = $"{_supabaseUrl}/storage/v1/object/{bucket}/{path}";
        using var content = new ByteArrayContent(data);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = content;
        request.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        request.Headers.Add("apikey", _serviceKey);
        request.Headers.Add("x-upsert", "true");

        var res = await _http.SendAsync(request, ct);
        if (!res.IsSuccessStatusCode)
        {
            var errBody = await res.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Storage upload failed {res.StatusCode}: {errBody}");
        }

        // Return permanent public URL (bucket is created as public)
        return $"{_supabaseUrl}/storage/v1/object/public/{bucket}/{path}";
    }

    public async Task DeleteAsync(string bucket, string path, CancellationToken ct = default)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/{bucket}/{path}";
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        request.Headers.Add("apikey", _serviceKey);
        await _http.SendAsync(request, ct);
    }

    private async Task EnsureBucketAsync(string bucket, CancellationToken ct)
    {
        using var checkReq = new HttpRequestMessage(HttpMethod.Get, $"{_supabaseUrl}/storage/v1/bucket/{bucket}");
        checkReq.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        checkReq.Headers.Add("apikey", _serviceKey);
        var checkRes = await _http.SendAsync(checkReq, ct);

        if (checkRes.IsSuccessStatusCode)
        {
            // Bucket exists — patch it to public so stored URLs are permanent
            var patchBody = JsonSerializer.Serialize(new { @public = true });
            using var patchContent = new StringContent(patchBody, Encoding.UTF8, "application/json");
            using var patchReq = new HttpRequestMessage(HttpMethod.Put, $"{_supabaseUrl}/storage/v1/bucket/{bucket}");
            patchReq.Content = patchContent;
            patchReq.Headers.Add("Authorization", $"Bearer {_serviceKey}");
            patchReq.Headers.Add("apikey", _serviceKey);
            await _http.SendAsync(patchReq, ct); // best-effort
            return;
        }

        var body = JsonSerializer.Serialize(new { id = bucket, name = bucket, @public = true });
        using var createContent = new StringContent(body, Encoding.UTF8, "application/json");
        using var createReq = new HttpRequestMessage(HttpMethod.Post, $"{_supabaseUrl}/storage/v1/bucket");
        createReq.Content = createContent;
        createReq.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        createReq.Headers.Add("apikey", _serviceKey);
        await _http.SendAsync(createReq, ct);
    }

    private async Task<string> GetSignedUrlAsync(string bucket, string path, CancellationToken ct)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/sign/{bucket}/{path}";
        var body = JsonSerializer.Serialize(new { expiresIn = 900 });
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = content;
        request.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        request.Headers.Add("apikey", _serviceKey);

        var res = await _http.SendAsync(request, ct);
        if (!res.IsSuccessStatusCode) return string.Empty;

        var json = await res.Content.ReadAsStringAsync(ct);
        var node = JsonNode.Parse(json);
        var signedPath = node?["signedURL"]?.GetValue<string>() ?? string.Empty;
        if (string.IsNullOrEmpty(signedPath)) return string.Empty;

        // Supabase returns either a full https:// URL or a root-relative path ("/object/sign/...")
        if (signedPath.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return signedPath;
        return $"{_supabaseUrl}/storage/v1{signedPath}";
    }
}
