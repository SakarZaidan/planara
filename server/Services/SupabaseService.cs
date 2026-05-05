using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Planara.DTOs;

namespace Planara.Services;

public class SupabaseService : ISupabaseService
{
    private readonly HttpClient _http;
    private readonly string _url;
    private readonly string _serviceKey;
    private static readonly JsonSerializerOptions _opts = new() { PropertyNameCaseInsensitive = true };

    public SupabaseService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _url = config["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url not configured");
        _serviceKey = config["Supabase:ServiceKey"] ?? throw new InvalidOperationException("Supabase:ServiceKey not configured");
    }

    private HttpRequestMessage MakeRequest(HttpMethod method, string path, object? body = null)
    {
        var req = new HttpRequestMessage(method, $"{_url}/rest/v1/{path}");
        req.Headers.Add("apikey", _serviceKey);
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        req.Headers.Add("Prefer", "return=representation");
        if (body != null)
        {
            var json = JsonSerializer.Serialize(body);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }
        return req;
    }

    private async Task<JsonNode?> SendAsync(HttpRequestMessage req, CancellationToken ct)
    {
        var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Supabase error {res.StatusCode}: {body}");
        return JsonNode.Parse(body);
    }

    public async Task UpsertProfileAsync(string userId, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{_url}/rest/v1/profiles");
        req.Headers.Add("apikey", _serviceKey);
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        req.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");
        req.Content = new StringContent(JsonSerializer.Serialize(new { id = userId }), Encoding.UTF8, "application/json");
        var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Profile upsert failed {res.StatusCode}: {err}");
        }
    }

    public async Task<string> CreateProjectAsync(string userId, string prompt, ArchitecturalKernelDto kernel, CancellationToken ct = default)
    {
        var req = MakeRequest(HttpMethod.Post, "projects", new
        {
            user_id = userId,
            title = kernel.Title,
            original_prompt = prompt,
            kernel_data = kernel,
            style_category = kernel.StyleCategory,
            style_seeds = kernel.StyleSeeds,
            status = "synthesizing"
        });
        var res = await SendAsync(req, ct);
        return res?[0]?["id"]?.GetValue<string>() ?? Guid.NewGuid().ToString();
    }

    public async Task<List<string>> CreateRoomsAsync(string projectId, List<RoomDto> rooms, CancellationToken ct = default)
    {
        var rows = rooms.Select(r => new
        {
            project_id = projectId,
            name = r.Name,
            type = r.Type,
            dimensions_json = r.Dimensions,
            spatial_coordinates = r.Coordinates
        }).ToList();
        var req = MakeRequest(HttpMethod.Post, "rooms", rows);
        var res = await SendAsync(req, ct);
        if (res is JsonArray arr)
            return arr.Select(r => r?["id"]?.GetValue<string>() ?? Guid.NewGuid().ToString()).ToList();
        return rooms.Select(_ => Guid.NewGuid().ToString()).ToList();
    }

    public async Task UpdateBlueprintUrlAsync(string projectId, string url, CancellationToken ct = default)
    {
        var req = MakeRequest(new HttpMethod("PATCH"), $"projects?id=eq.{projectId}", new { blueprint_url = url });
        await _http.SendAsync(req, ct);
    }

    public async Task UpdateProjectStatusAsync(string projectId, string status, CancellationToken ct = default)
    {
        var req = MakeRequest(new HttpMethod("PATCH"), $"projects?id=eq.{projectId}", new { status });
        await _http.SendAsync(req, ct);
    }

    public async Task<(ProjectRecord? project, RoomRecord? room)> GetProjectAndRoomAsync(
        string projectId, string roomId, string userId, CancellationToken ct = default)
    {
        var projReq = MakeRequest(HttpMethod.Get, $"projects?id=eq.{projectId}&user_id=eq.{userId}&select=id,style_category,style_seeds");
        var projRes = await SendAsync(projReq, ct);
        if (projRes is not JsonArray projArr || projArr.Count == 0) return (null, null);
        var p = projArr[0]!;
        var project = new ProjectRecord(
            p["id"]!.GetValue<string>(),
            p["style_category"]?.GetValue<string>(),
            p["style_seeds"]?.AsArray().Select(s => s!.GetValue<string>()).ToList()
        );

        var roomReq = MakeRequest(HttpMethod.Get, $"rooms?id=eq.{roomId}&project_id=eq.{projectId}&select=id,name,type,dimensions_json");
        var roomRes = await SendAsync(roomReq, ct);
        if (roomRes is not JsonArray roomArr || roomArr.Count == 0) return (project, null);
        var r = roomArr[0]!;
        RoomDimensionsDto? dims = null;
        if (r["dimensions_json"] != null)
            dims = JsonSerializer.Deserialize<RoomDimensionsDto>(r["dimensions_json"]!.ToJsonString(), _opts);
        var room = new RoomRecord(
            r["id"]!.GetValue<string>(),
            r["name"]?.GetValue<string>() ?? "",
            r["type"]?.GetValue<string>() ?? "other",
            dims
        );
        return (project, room);
    }

    public async Task<string> CreateRenderAsync(string roomId, string imageUrl, List<string> insights, int score, CancellationToken ct = default)
    {
        var req = MakeRequest(HttpMethod.Post, "renders", new
        {
            room_id = roomId,
            image_url = imageUrl,
            architectural_insights = insights,
            consistency_integrity_score = score
        });
        var res = await SendAsync(req, ct);
        return res?[0]?["id"]?.GetValue<string>() ?? Guid.NewGuid().ToString();
    }

    public async Task<object> GetOverviewAsync(string userId, CancellationToken ct = default)
    {
        // Fetch all user projects for accurate counts + recent list
        var projReq = MakeRequest(HttpMethod.Get,
            $"projects?user_id=eq.{userId}&select=id,title,style_category,status,created_at,blueprint_url&order=created_at.desc");
        JsonArray allProjects = new();
        try
        {
            if (await SendAsync(projReq, ct) is JsonArray arr) allProjects = arr;
        }
        catch { /* return zeros rather than 500 */ }

        var total = allProjects.Count;
        var blueprintCount = allProjects
            .Count(p => !string.IsNullOrEmpty(p?["blueprint_url"]?.GetValue<string>()));

        var recent = allProjects.Take(5).Select(p => new
        {
            id = p!["id"]?.GetValue<string>() ?? "",
            title = p["title"]?.GetValue<string>() ?? "",
            style_category = p["style_category"]?.GetValue<string>() ?? "",
            status = p["status"]?.GetValue<string>() ?? "queued",
            created_at = p["created_at"]?.GetValue<string>() ?? ""
        }).ToList<object>();

        // Count renders for this user's rooms (user → projects → rooms → renders)
        int renderTotal = 0;
        if (total > 0)
        {
            try
            {
                var projectIds = string.Join(",",
                    allProjects.Select(p => p?["id"]?.GetValue<string>()).Where(id => id != null));

                var roomsReq = MakeRequest(HttpMethod.Get, $"rooms?project_id=in.({projectIds})&select=id");
                if (await SendAsync(roomsReq, ct) is JsonArray roomArr && roomArr.Count > 0)
                {
                    var roomIds = string.Join(",",
                        roomArr.Select(r => r?["id"]?.GetValue<string>()).Where(id => id != null));

                    var renderReq = new HttpRequestMessage(HttpMethod.Get,
                        $"{_url}/rest/v1/renders?room_id=in.({roomIds})&select=id");
                    renderReq.Headers.Add("apikey", _serviceKey);
                    renderReq.Headers.Add("Authorization", $"Bearer {_serviceKey}");
                    renderReq.Headers.Add("Prefer", "count=exact");
                    var renderRes = await _http.SendAsync(renderReq, ct);
                    if (renderRes.Headers.TryGetValues("Content-Range", out var rcr))
                        int.TryParse(rcr.First().Split('/').LastOrDefault(), out renderTotal);
                }
            }
            catch { /* non-fatal */ }
        }

        var synthesisRate = total > 0 ? $"{blueprintCount * 100 / total}%" : "—";

        return new
        {
            kernels_created = total,
            blueprints_generated = blueprintCount,
            renders_synthesized = renderTotal,
            synthesis_rate = synthesisRate,
            recent_syntheses = recent
        };
    }

    public async Task<object> GetLibraryAsync(string userId, int page, CancellationToken ct = default)
    {
        var offset = page * 20;
        var req = MakeRequest(HttpMethod.Get,
            $"projects?user_id=eq.{userId}&select=id,title,style_category,style_seeds,created_at,status,blueprint_url&order=created_at.desc&limit=20&offset={offset}");
        var res = await SendAsync(req, ct);
        var items = res is JsonArray arr ? arr.Select(p => new
        {
            id = p!["id"]?.GetValue<string>() ?? "",
            title = p["title"]?.GetValue<string>() ?? "",
            style_category = p["style_category"]?.GetValue<string>() ?? "",
            style_seeds = p["style_seeds"]?.AsArray().Select(s => s?.GetValue<string>() ?? "").ToList() ?? new(),
            created_at = p["created_at"]?.GetValue<string>() ?? "",
            status = p["status"]?.GetValue<string>() ?? "",
            // Convert old signed URLs to public permanent URLs
            thumbnail = ToPublicUrl(p["blueprint_url"]?.GetValue<string>())
        }).ToList<object>() : new List<object>();

        return new { items, total_count = items.Count };
    }

    // Converts an expired signed URL to a permanent public URL.
    // Old format: https://[host]/storage/v1/object/sign/[bucket]/[path]?token=...
    // New format: https://[host]/storage/v1/object/public/[bucket]/[path]
    private static string? ToPublicUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return null;
        if (url.Contains("/object/public/")) return url; // already public
        var match = System.Text.RegularExpressions.Regex.Match(url, @"(https?://[^/]+)/storage/v1/object/sign/(.+?)(\?|$)");
        if (match.Success)
            return $"{match.Groups[1].Value}/storage/v1/object/public/{match.Groups[2].Value}";
        return url;
    }

    public async Task DeleteProjectAsync(string projectId, string userId, CancellationToken ct = default)
    {
        var req = MakeRequest(HttpMethod.Delete, $"projects?id=eq.{projectId}&user_id=eq.{userId}");
        await _http.SendAsync(req, ct);
    }

    public async Task<object?> GetProfileAsync(string userId, CancellationToken ct = default)
    {
        var req = MakeRequest(HttpMethod.Get, $"profiles?id=eq.{userId}&select=*");
        var res = await SendAsync(req, ct);
        return res is JsonArray arr && arr.Count > 0 ? arr[0] : null;
    }

    public async Task UpdateProfileAsync(string userId, string? displayName, string? bio, bool deepNeural, bool autoInsight, CancellationToken ct = default)
    {
        var req = MakeRequest(new HttpMethod("PATCH"), $"profiles?id=eq.{userId}", new
        {
            display_name = displayName,
            bio_design_philosophy = bio,
            settings = new { deep_neural_rendering = deepNeural, auto_insight_generation = autoInsight }
        });
        await _http.SendAsync(req, ct);
    }
}
