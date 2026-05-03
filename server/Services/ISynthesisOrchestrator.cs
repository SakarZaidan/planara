using Planara.DTOs;

namespace Planara.Services;

public interface ISynthesisOrchestrator
{
    Task<SynthesisResponseDto> InitializeAsync(string prompt, string userId, CancellationToken ct = default);
    Task<RenderResponseDto> RenderRoomAsync(string projectId, string roomId, string userId, InlineKernelData? inlineKernel = null, CancellationToken ct = default);
}
