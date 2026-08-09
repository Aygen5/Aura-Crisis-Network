using Xunit;

namespace Aura.IntegrationTests;

[CollectionDefinition("IntegrationTests")]
public class IntegrationTestCollection : ICollectionFixture<AuraWebApplicationFactory>
{
}
