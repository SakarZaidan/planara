namespace Planara.Services;

public interface IStorageService
{
    Task<string> UploadAsync(string bucket, string path, byte[] data, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string bucket, string path, CancellationToken ct = default);
}
