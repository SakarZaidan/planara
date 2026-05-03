using System.Net.Http.Headers;
using System.Text.Json.Nodes;

namespace Planara.Services;

public class FurnitureMatcher : IFurnitureMatcher
{
    private readonly HttpClient _http;
    private readonly string _url;
    private readonly string _serviceKey;

    public FurnitureMatcher(HttpClient http, IConfiguration config)
    {
        _http = http;
        _url = config["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url not configured");
        _serviceKey = config["Supabase:ServiceKey"] ?? throw new InvalidOperationException("Supabase:ServiceKey not configured");
    }

    public async Task<List<object>> GetMatchesAsync(List<string> tokens, string? category, CancellationToken ct = default)
    {
        var tokenFilter = string.Join(",", tokens.Select(t => $"\"{t}\""));
        var query = $"ikea_catalog?style_tags=cs.{{{tokenFilter}}}&select=id,sku,name,series,price_kwd,category,description,product_url,image_url,style_tags&limit=10";
        if (!string.IsNullOrWhiteSpace(category))
            query += $"&category=ilike.*{Uri.EscapeDataString(category)}*";

        var req = new HttpRequestMessage(HttpMethod.Get, $"{_url}/rest/v1/{query}");
        req.Headers.Add("apikey", _serviceKey);
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");

        var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode) return new List<object>();

        var body = await res.Content.ReadAsStringAsync(ct);
        var arr = JsonNode.Parse(body) as JsonArray;
        if (arr == null) return new List<object>();

        return arr.Select(item =>
        {
            if (item == null) return (object)new { };
            var itemTags = item["style_tags"]?.AsArray().Select(t => t?.GetValue<string>() ?? "").ToList() ?? new List<string>();
            var matchScore = Math.Round((double)tokens.Count(t => itemTags.Contains(t, StringComparer.OrdinalIgnoreCase)) / Math.Max(tokens.Count, 1), 2);
            return (object)new
            {
                id = item["id"]?.GetValue<string>() ?? "",
                sku = item["sku"]?.GetValue<string>() ?? "",
                name = item["name"]?.GetValue<string>() ?? "",
                series = item["series"]?.GetValue<string>() ?? "",
                price_kwd = item["price_kwd"]?.GetValue<decimal>() ?? 0,
                category = item["category"]?.GetValue<string>() ?? "",
                description = item["description"]?.GetValue<string>() ?? "",
                product_url = item["product_url"]?.GetValue<string>() ?? "",
                image_url = item["image_url"]?.GetValue<string>() ?? "",
                match_score = matchScore
            };
        }).ToList();
    }
}
