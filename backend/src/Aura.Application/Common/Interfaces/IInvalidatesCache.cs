namespace Aura.Application.Common.Interfaces;

public interface IInvalidatesCache
{
    string[] CacheKeysToInvalidate { get; }
}
