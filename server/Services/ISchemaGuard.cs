using Planara.DTOs;

namespace Planara.Services;

public interface ISchemaGuard
{
    ArchitecturalKernelDto? ParseKernel(string json);
    void Repair(ArchitecturalKernelDto kernel, string fallbackTitle);
    ArchitecturalKernelDto BuildFallbackKernel(string prompt);
}
