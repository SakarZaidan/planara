using Planara.DTOs;

namespace Planara.Services;

public record ProjectRecord(string Id, string? StyleCategory, List<string>? StyleSeeds);
public record RoomRecord(string Id, string Name, string Type, RoomDimensionsDto? Dimensions);

public interface ISupabaseService
{
    Task<string> CreateProjectAsync(string userId, string prompt, ArchitecturalKernelDto kernel, CancellationToken ct = default);
    Task<List<string>> CreateRoomsAsync(string projectId, List<RoomDto> rooms, CancellationToken ct = default);
    Task UpdateBlueprintUrlAsync(string projectId, string url, CancellationToken ct = default);
    Task UpdateProjectStatusAsync(string projectId, string status, CancellationToken ct = default);
    Task<(ProjectRecord? project, RoomRecord? room)> GetProjectAndRoomAsync(string projectId, string roomId, string userId, CancellationToken ct = default);
    Task<string> CreateRenderAsync(string roomId, string imageUrl, List<string> insights, int score, CancellationToken ct = default);
    Task<object> GetOverviewAsync(string userId, CancellationToken ct = default);
    Task<object> GetLibraryAsync(string userId, int page, CancellationToken ct = default);
    Task DeleteProjectAsync(string projectId, string userId, CancellationToken ct = default);
    Task<object?> GetProfileAsync(string userId, CancellationToken ct = default);
    Task UpdateProfileAsync(string userId, string? displayName, string? bio, bool deepNeural, bool autoInsight, CancellationToken ct = default);
    Task UpsertProfileAsync(string userId, CancellationToken ct = default);
}
