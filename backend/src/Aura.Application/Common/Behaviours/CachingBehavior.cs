using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Aura.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;

namespace Aura.Application.Common.Behaviours;

public class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IDistributedCache _cache;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> KeyLocks = new();
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    public CachingBehavior(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableRequest cacheableRequest)
        {
            return await next();
        }

        var cacheKey = cacheableRequest.CacheKey;
        var cachedData = await _cache.GetAsync(cacheKey, cancellationToken);
        if (cachedData != null && cachedData.Length > 0)
        {
            var json = Encoding.UTF8.GetString(cachedData);
            var deserialized = JsonSerializer.Deserialize<TResponse>(json, JsonOptions);
            if (deserialized != null)
            {
                return deserialized;
            }
        }

        var keyLock = KeyLocks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await keyLock.WaitAsync(cancellationToken);

        try
        {
            cachedData = await _cache.GetAsync(cacheKey, cancellationToken);
            if (cachedData != null && cachedData.Length > 0)
            {
                var json = Encoding.UTF8.GetString(cachedData);
                var deserialized = JsonSerializer.Deserialize<TResponse>(json, JsonOptions);
                if (deserialized != null)
                {
                    return deserialized;
                }
            }

            var response = await next();

            if (response != null)
            {
                var responseJson = JsonSerializer.Serialize(response, JsonOptions);
                var responseBytes = Encoding.UTF8.GetBytes(responseJson);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = cacheableRequest.Expiration ?? TimeSpan.FromMinutes(5)
                };

                await _cache.SetAsync(cacheKey, responseBytes, options, cancellationToken);
            }

            return response;
        }
        finally
        {
            keyLock.Release();
        }
    }
}
