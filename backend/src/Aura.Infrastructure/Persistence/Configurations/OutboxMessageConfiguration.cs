using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aura.Infrastructure.Persistence.Configurations;

public class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Type)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(o => o.PayloadJson)
            .IsRequired();

        builder.Property(o => o.Error)
            .HasMaxLength(4000);

        builder.HasIndex(o => new { o.ProcessedAt, o.CreatedAt });
    }
}
