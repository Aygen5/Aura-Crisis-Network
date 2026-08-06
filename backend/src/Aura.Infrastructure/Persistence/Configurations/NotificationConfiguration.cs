using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aura.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.RecipientUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Message)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(n => n.Type)
            .IsRequired();

        builder.Property(n => n.IsRead)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(n => new { n.RecipientUserId, n.IsRead, n.CreatedAt });
    }
}
