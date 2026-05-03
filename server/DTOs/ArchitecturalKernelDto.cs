using System.Text.Json.Serialization;

namespace Planara.DTOs;

public class RoomDimensionsDto
{
    [JsonPropertyName("width")]
    public double Width { get; set; }

    [JsonPropertyName("length")]
    public double Length { get; set; }

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = "m";
}

public class RoomCoordinatesDto
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }
}

public class RoomDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "other";

    [JsonPropertyName("dimensions")]
    public RoomDimensionsDto Dimensions { get; set; } = new();

    [JsonPropertyName("coordinates")]
    public RoomCoordinatesDto Coordinates { get; set; } = new();

    [JsonPropertyName("connections")]
    public List<string> Connections { get; set; } = new();
}

public class ArchitecturalKernelDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("style_category")]
    public string StyleCategory { get; set; } = string.Empty;

    [JsonPropertyName("style_seeds")]
    public List<string> StyleSeeds { get; set; } = new();

    [JsonPropertyName("rooms")]
    public List<RoomDto> Rooms { get; set; } = new();

    [JsonPropertyName("total_area_sqm")]
    public double TotalAreaSqm { get; set; }

    [JsonPropertyName("floor_count")]
    public int FloorCount { get; set; } = 1;
}

public class SynthesisRequestDto
{
    [JsonPropertyName("prompt")]
    public string Prompt { get; set; } = string.Empty;

    [JsonPropertyName("settings")]
    public SynthesisSettingsDto? Settings { get; set; }
}

public class SynthesisSettingsDto
{
    [JsonPropertyName("deep_neural_rendering")]
    public bool DeepNeuralRendering { get; set; } = true;

    [JsonPropertyName("style_intensity")]
    public double StyleIntensity { get; set; } = 0.8;
}

// Inline snapshot sent by the client so the server can render without a DB lookup,
// which fails when the Supabase write was non-fatal during initialization.
public class InlineRoomData
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "other";

    [JsonPropertyName("dimensions")]
    public RoomDimensionsDto Dimensions { get; set; } = new();
}

public class InlineKernelData
{
    [JsonPropertyName("style_category")]
    public string StyleCategory { get; set; } = string.Empty;

    [JsonPropertyName("style_seeds")]
    public List<string> StyleSeeds { get; set; } = new();

    [JsonPropertyName("room")]
    public InlineRoomData Room { get; set; } = new();
}

public class RenderRoomRequestDto
{
    [JsonPropertyName("kernel_id")]
    public string KernelId { get; set; } = string.Empty;

    [JsonPropertyName("room_id")]
    public string RoomId { get; set; } = string.Empty;

    [JsonPropertyName("perspective")]
    public string Perspective { get; set; } = "eye-level";

    [JsonPropertyName("inline_kernel")]
    public InlineKernelData? InlineKernel { get; set; }
}

public class SynthesisResponseDto
{
    [JsonPropertyName("kernel_id")]
    public string KernelId { get; set; } = string.Empty;

    [JsonPropertyName("project_id")]
    public string ProjectId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "synthesized";

    [JsonPropertyName("blueprint_url")]
    public string? BlueprintUrl { get; set; }

    [JsonPropertyName("style_tokens")]
    public List<string> StyleTokens { get; set; } = new();

    [JsonPropertyName("spatial_kernel")]
    public ArchitecturalKernelDto SpatialKernel { get; set; } = new();
}

public class RenderResponseDto
{
    [JsonPropertyName("render_id")]
    public string RenderId { get; set; } = string.Empty;

    [JsonPropertyName("render_url")]
    public string RenderUrl { get; set; } = string.Empty;

    [JsonPropertyName("architectural_observations")]
    public List<string> ArchitecturalObservations { get; set; } = new();

    [JsonPropertyName("consistency_integrity_score")]
    public int ConsistencyIntegrityScore { get; set; }
}

public class ApiErrorDto
{
    [JsonPropertyName("error")]
    public ApiErrorDetailDto Error { get; set; } = new();
}

public class ApiErrorDetailDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("trace_id")]
    public string TraceId { get; set; } = Guid.NewGuid().ToString("N")[..12];
}
