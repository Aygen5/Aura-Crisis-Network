using Aura.Domain.Common;

namespace Aura.Domain.Entities;

public class Operator : BaseEntity
{
    public string FullName { get; private set; }
    public string BadgeNumber { get; private set; }
    public string Email { get; private set; }
    public string Organization { get; private set; }
    public bool IsOnShift { get; private set; }

    #pragma warning disable CS8618
    private Operator() { }
    #pragma warning restore CS8618

    public Operator(
        string fullName,
        string badgeNumber,
        string email,
        string organization)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("Full name cannot be empty.", nameof(fullName));
        if (string.IsNullOrWhiteSpace(badgeNumber)) throw new ArgumentException("Badge number cannot be empty.", nameof(badgeNumber));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email cannot be empty.", nameof(email));

        FullName = fullName;
        BadgeNumber = badgeNumber;
        Email = email;
        Organization = organization ?? "AFAD";
        IsOnShift = false;
    }

    public void StartShift()
    {
        if (IsOnShift) return;
        IsOnShift = true;
        MarkUpdated();
    }

    public void EndShift()
    {
        if (!IsOnShift) return;
        IsOnShift = false;
        MarkUpdated();
    }
}
