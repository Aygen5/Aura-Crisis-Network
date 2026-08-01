# FAZ 1 - Adım 1.3: `Aura.Domain` Katmanı Mimari Öğretici Notları

> **Konu:** Domain Entities, Value Objects, Enums ve Domain Events  
> **Katman:** `Aura.Domain`  
> **Bağımlılık Düzeyi:** Sıfır Dış Bağımlılık (Pure C# / Persistence Ignorant)  

---

## 📚 1. Neler Eklendi?

Bu adımda kriz yönetim platformunun en iç katmanı olan `Aura.Domain` projesine şu temel yapı taşları eklendi:

1. **`BaseEntity` (Abstract Base Class)**:
   - Tüm domain varlıklarının kalıtım aldığı taban sınıf.
   - `Id` (Guid), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset?), `IsDeleted` (bool) ve `DeletedAt` (DateTimeOffset?) ortak alanlarını içerir.
   - `SoftDelete()` ve `MarkUpdated()` metotlarını barındırır.

2. **`GeoPoint` (Immutable Value Object)**:
   - Coğrafi enlem (Latitude) ve boylam (Longitude) koordinatlarını tutan `readonly record struct` yapısı.
   - Yapıcı metodunda `-90 <= latitude <= 90` ve `-180 <= longitude <= 180` sınır doğrulaması yapar.

3. **Domain Enums**:
   - `DisasterType`: Afet türleri (`Earthquake`, `Flood`, `Wildfire`, `Landslide`, `Medical`, `Report`).
   - `EventStatus`: Olay durumları (`Active`, `Monitoring`, `Resolved`).
   - `ReportStatus`: İhbar onay durumları (`Pending`, `Verified`, `Rejected`).

4. **Core Entities (Çekirdek Varlıklar)**:
   - `Event`: Kriz merkezindeki aktif afet olayı (`Escalate()`, `Resolve()`, `UpdateStatus()` metotları ile zengin domain modeli).
   - `CitizenReport`: Vatandaş ve 112 ihbar kaydı (`Verify()`, `Reject()`, `IncrementCorroboration()` metotları ile).
   - `DistrictRisk`: İlçe bazlı prediktif sismik, sel, heyelan ve yangın risk skorları.
   - `Operator`: Nöbetçi operatör varlığı (`StartShift()`, `EndShift()`).

5. **Domain Events**:
   - `IDomainEvent` arayüzü ve `EventCreatedDomainEvent`, `ReportStatusChangedDomainEvent` record yapıları.

---

## 🎯 2. Bunlar Neden Eklendi ve Sistem İçerisinde Hangi Görevi Üstleniyor?

- **Veri Tutarlılığı ve Kapsülleme (Encapsulation):**
  Varlıklar üzerindeki durum değişiklikleri (örneğin bir afeti eskalasyon seviyesine çıkarma veya bir ihbarı onaylama) dışarıdan direkt property atanarak değil, Domain metodları (`event.Escalate()`, `report.Verify()`) aracılığıyla yapılır. Bu sayede iş kuralları ihlal edilemez.
- **Geçerli Koordinat Garantisi:**
  `GeoPoint` Value Object sayesinde sistem içerisinde geçersiz koordinata sahip hiçbir afet veya ihbar oluşturulamaz.
- **Adli Denetim (Audit) ve Soft Delete:**
  `BaseEntity` sayesinde hiçbir acil durum verisi kalıcı olarak silinmez; `SoftDelete()` ile adli izlenebilirlik sağlanır.

---

## 🏛️ 3. Clean Architecture İçerisindeki Yeri Nedir?

```
┌─────────────────────────────────────────────────────────┐
│                       Aura.WebApi                       │
│    ┌───────────────────────────────────────────────┐    │
│    │              Aura.Infrastructure              │    │
│    │    ┌─────────────────────────────────────┐    │    │
│    │    │           Aura.Application          │    │    │
│    │    │    ┌──────────────────────────┐     │    │    │
│    │    │    │       Aura.Domain        │     │    │    │
│    │    │    │  (Entities / Value Obj)  │     │    │    │
│    │    │    └──────────────────────────┘     │    │    │
│    │    └─────────────────────────────────────┘    │    │
│    └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

`Aura.Domain`, Clean Architecture soğanı halkasının **en merkezindeki katmandır**.
- **Persistence Ignorance (Kalıcılık Cehaleti):** Veritabanı teknolojisinden (PostgreSQL, EF Core vb.) tamamen habersizdir.
- **Sıfır Dış Bağımlılık:** `Aura.Domain.csproj` dosyasına hiçbir NuGet paketi eklenmemiştir. Sadece saf C# tip sistemini kullanır.

---

## 🔄 4. Bir Sonraki Katman (`Aura.Application`) Bunu Nasıl Kullanacak?

1. **CQRS Komut ve Sorguları (Commands & Queries):**
   `Aura.Application` katmanı, kullanıcının taleplerini işlerken bu Domain varlıklarını kullanacaktır (Örn: `CreateReportCommand` çalıştığında bir `CitizenReport` varlığı üretecektir).
2. **Repository Arayüzleri (Interfaces):**
   Application katmanı `IEventRepository`, `ICitizenReportRepository` gibi soyut arayüzleri `Event` ve `CitizenReport` domain varlıkları üzerinden tanımlayacaktır.
3. **Servis Kontratları:**
   Arka planda çalışacak Kandilli Ingestion servisi `IKandilliIngestionService`, dönüştürdüğü canlı veriyi `Event` domain varlığı olarak Application katmanına aktaracaktır.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
