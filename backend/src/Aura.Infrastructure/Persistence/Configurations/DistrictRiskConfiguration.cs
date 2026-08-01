using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aura.Infrastructure.Persistence.Configurations;

public class DistrictRiskConfiguration : IEntityTypeConfiguration<DistrictRisk>
{
    public void Configure(EntityTypeBuilder<DistrictRisk> builder)
    {
        builder.ToTable("DistrictRisks");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DistrictName)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(d => d.DistrictName)
            .IsUnique();
    }
}
