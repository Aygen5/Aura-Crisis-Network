using System.Text;
using Aura.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace Aura.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mp3", ".pdf"
    };

    private const long MaxFileSizeBytes = 50 * 1024 * 1024;

    public LocalFileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        if (fileStream == null || fileStream.Length == 0)
        {
            throw new ArgumentException("File stream is empty.");
        }

        if (fileStream.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("File size exceeds 50MB limit.");
        }

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException($"File extension '{extension}' is not allowed.");
        }

        await ValidateMagicBytesAsync(fileStream, extension, cancellationToken);

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var now = DateTime.UtcNow;
        var relativeFolder = Path.Combine("uploads", "reports", now.Year.ToString(), now.Month.ToString("D2"));
        var targetFolder = Path.Combine(webRoot, relativeFolder);

        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(targetFolder, uniqueFileName);

        fileStream.Position = 0;
        using var destinationStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await fileStream.CopyToAsync(destinationStream, cancellationToken);

        var relativeUrl = $"/{relativeFolder.Replace('\\', '/')}/{uniqueFileName}";
        return relativeUrl;
    }

    public Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrl)) return Task.CompletedTask;

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var relativePath = fileUrl.TrimStart('/');
        var fullPath = Path.Combine(webRoot, relativePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private static async Task ValidateMagicBytesAsync(Stream stream, string extension, CancellationToken cancellationToken)
    {
        stream.Position = 0;
        var header = new byte[8];
        var bytesRead = await stream.ReadAsync(header, 0, header.Length, cancellationToken);
        stream.Position = 0;

        if (bytesRead < 4)
        {
            throw new InvalidOperationException("Invalid file header.");
        }

        var ext = extension.ToLowerInvariant();

        if (ext is ".jpg" or ".jpeg")
        {
            if (header[0] != 0xFF || header[1] != 0xD8 || header[2] != 0xFF)
            {
                throw new InvalidOperationException("File header does not match JPEG format.");
            }
        }
        else if (ext == ".png")
        {
            if (header[0] != 0x89 || header[1] != 0x50 || header[2] != 0x4E || header[3] != 0x47)
            {
                throw new InvalidOperationException("File header does not match PNG format.");
            }
        }
        else if (ext == ".pdf")
        {
            if (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46)
            {
                throw new InvalidOperationException("File header does not match PDF format.");
            }
        }
    }
}
