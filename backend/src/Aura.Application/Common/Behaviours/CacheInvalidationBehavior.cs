using Aura.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;

namespace Aura.Application.Common.Behaviours;

public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IDistributedCache _cache;

    public CacheInvalidationBehavior(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();

        if (request is IInvalidatesCache invalidatesCacheRequest)
        {
            var keys = invalidatesCacheRequest.CacheKeysToInvalidate;
            if (keys != null && keys.Length > 0)
            {
                foreach (var key in keys)
                {
                    await _cache.RemoveAsync(key, cancellationToken);
                }
            }
        }

        return response;
    }
}
