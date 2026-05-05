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

    public async Task<CatalogResult> GetCatalogAsync(string? category, string? style, string? search, int limit, int offset, CancellationToken ct = default)
    {
        var filters = new List<string> { "select=id,sku,name,series,price_kwd,category,description,product_url,image_url,style_tags" };

        if (!string.IsNullOrWhiteSpace(category))
            filters.Add($"category=ilike.*{Uri.EscapeDataString(category)}*");

        if (!string.IsNullOrWhiteSpace(search))
            filters.Add($"name=ilike.*{Uri.EscapeDataString(search)}*");

        if (!string.IsNullOrWhiteSpace(style))
            filters.Add($"style_tags=cs.{{\"{Uri.EscapeDataString(style)}\"}}");

        filters.Add($"limit={limit}");
        filters.Add($"offset={offset}");
        filters.Add("order=name.asc");

        var query = "ikea_catalog?" + string.Join("&", filters);

        var req = new HttpRequestMessage(HttpMethod.Get, $"{_url}/rest/v1/{query}");
        req.Headers.Add("apikey", _serviceKey);
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        req.Headers.Add("Prefer", "count=exact");

        var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode) return new CatalogResult(new List<object>(), 0);

        var body = await res.Content.ReadAsStringAsync(ct);
        var arr = JsonNode.Parse(body) as JsonArray;
        if (arr == null) return new CatalogResult(new List<object>(), 0);

        // Parse Content-Range header for total count: e.g. "0-19/150"
        var totalCount = 0;
        if (res.Headers.TryGetValues("Content-Range", out var rangeVals))
        {
            var range = rangeVals.FirstOrDefault() ?? "";
            var slash = range.IndexOf('/');
            if (slash >= 0) int.TryParse(range[(slash + 1)..], out totalCount);
        }

        var items = arr.Select(item =>
        {
            if (item == null) return (object)new { };
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
                style_tags = item["style_tags"]?.AsArray().Select(t => t?.GetValue<string>() ?? "").ToArray() ?? Array.Empty<string>(),
            };
        }).ToList();

        return new CatalogResult(items, totalCount > 0 ? totalCount : items.Count);
    }
}
