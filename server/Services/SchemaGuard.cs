using System.Text.Json;
using System.Text.RegularExpressions;
using Planara.DTOs;

namespace Planara.Services;

public class SchemaGuard : ISchemaGuard
{
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    public ArchitecturalKernelDto? ParseKernel(string json)
    {
        var clean = Regex.Replace(json.Trim(), @"^```json?\s*", "", RegexOptions.Multiline);
        clean = Regex.Replace(clean, @"```\s*$", "", RegexOptions.Multiline).Trim();

        // If the model wrapped the JSON in extra prose, extract the first { ... } block
        var firstBrace = clean.IndexOf('{');
        var lastBrace = clean.LastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace)
            clean = clean.Substring(firstBrace, lastBrace - firstBrace + 1);

        try
        {
            return JsonSerializer.Deserialize<ArchitecturalKernelDto>(clean, _opts);
        }
        catch
        {
            return null;
        }
    }

    public void Repair(ArchitecturalKernelDto kernel, string fallbackTitle)
    {
        if (string.IsNullOrWhiteSpace(kernel.Title))
            kernel.Title = TruncateTitle(fallbackTitle);
        if (string.IsNullOrWhiteSpace(kernel.StyleCategory))
            kernel.StyleCategory = "Contemporary";
        if (kernel.StyleSeeds == null || kernel.StyleSeeds.Count == 0)
            kernel.StyleSeeds = new List<string> { "Contemporary", "Neutral", "Warm" };
        if (kernel.FloorCount <= 0)
            kernel.FloorCount = 1;

        kernel.Rooms ??= new List<RoomDto>();
        if (kernel.Rooms.Count == 0)
        {
            kernel.Rooms.Add(new RoomDto
            {
                Id = "room_1",
                Name = "Main Room",
                Type = "living_room",
                Dimensions = new RoomDimensionsDto { Width = 5, Length = 6, Unit = "m" },
                Coordinates = new RoomCoordinatesDto(),
                Connections = new List<string>()
            });
        }

        for (int i = 0; i < kernel.Rooms.Count; i++)
        {
            var r = kernel.Rooms[i];
            if (string.IsNullOrWhiteSpace(r.Id)) r.Id = $"room_{i + 1}";
            if (string.IsNullOrWhiteSpace(r.Name)) r.Name = $"Room {i + 1}";
            if (string.IsNullOrWhiteSpace(r.Type)) r.Type = "other";
            r.Dimensions ??= new RoomDimensionsDto { Width = 4, Length = 5, Unit = "m" };
            if (r.Dimensions.Width <= 0) r.Dimensions.Width = 4;
            if (r.Dimensions.Length <= 0) r.Dimensions.Length = 5;
            if (string.IsNullOrWhiteSpace(r.Dimensions.Unit)) r.Dimensions.Unit = "m";
            r.Coordinates ??= new RoomCoordinatesDto();
            r.Connections ??= new List<string>();
        }

        // If the model didn't provide spatial coordinates (or stacked them all at 0,0),
        // pack the rooms into a row-major grid so the blueprint and label overlay are usable.
        if (NeedsAutoLayout(kernel.Rooms))
            AutoLayoutRooms(kernel.Rooms);

        if (kernel.TotalAreaSqm <= 0)
            kernel.TotalAreaSqm = kernel.Rooms.Sum(r => (r.Dimensions?.Width ?? 0) * (r.Dimensions?.Length ?? 0));
    }

    private static bool NeedsAutoLayout(List<RoomDto> rooms)
    {
        if (rooms.Count <= 1) return false;
        var seen = new HashSet<(double, double)>();
        foreach (var r in rooms)
        {
            var key = (r.Coordinates!.X, r.Coordinates.Y);
            if (!seen.Add(key)) return true; // duplicate coord
        }
        return false;
    }

    private static void AutoLayoutRooms(List<RoomDto> rooms)
    {
        // Row-pack: wrap to next row when the row would exceed ~12m wide.
        const double maxRowWidth = 12.0;
        const double gap = 0.0;
        double cursorX = 0, cursorY = 0, rowHeight = 0;
        foreach (var r in rooms)
        {
            var w = r.Dimensions?.Width ?? 4;
            var l = r.Dimensions?.Length ?? 5;
            if (cursorX > 0 && cursorX + w > maxRowWidth)
            {
                cursorX = 0;
                cursorY += rowHeight + gap;
                rowHeight = 0;
            }
            r.Coordinates!.X = cursorX;
            r.Coordinates.Y = cursorY;
            cursorX += w + gap;
            if (l > rowHeight) rowHeight = l;
        }
    }

    public ArchitecturalKernelDto BuildFallbackKernel(string prompt)
    {
        var kernel = new ArchitecturalKernelDto
        {
            Title = TruncateTitle(prompt),
            StyleCategory = "Contemporary",
            StyleSeeds = new List<string> { "Minimalist", "Neutral", "Warm Oak" },
            Rooms = new List<RoomDto>
            {
                new() { Id = "room_1", Name = "Living Room", Type = "living_room",
                    Dimensions = new RoomDimensionsDto { Width = 6, Length = 8, Unit = "m" },
                    Coordinates = new RoomCoordinatesDto { X = 0, Y = 0 },
                    Connections = new List<string> { "room_2" } },
                new() { Id = "room_2", Name = "Kitchen", Type = "kitchen",
                    Dimensions = new RoomDimensionsDto { Width = 4, Length = 5, Unit = "m" },
                    Coordinates = new RoomCoordinatesDto { X = 8, Y = 0 },
                    Connections = new List<string> { "room_1" } },
                new() { Id = "room_3", Name = "Bedroom", Type = "bedroom",
                    Dimensions = new RoomDimensionsDto { Width = 5, Length = 5, Unit = "m" },
                    Coordinates = new RoomCoordinatesDto { X = 0, Y = 10 },
                    Connections = new List<string>() }
            },
            TotalAreaSqm = 93,
            FloorCount = 1
        };
        return kernel;
    }

    private static string TruncateTitle(string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt)) return "Architectural Project";
        var trimmed = prompt.Trim();
        return trimmed.Length > 60 ? trimmed[..60].TrimEnd() + "…" : trimmed;
    }
}
