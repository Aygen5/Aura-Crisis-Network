# FAZ 3 - Adım 3.1: MediatR CQRS Altyapısı ve Handlers Mimari Öğretici Notları

> **Konu:** MediatR Integration, CQRS Commands & Queries  
> **Katman:** `Aura.Application` ve `Aura.WebApi`  
> **Bağımlılık Düzeyi:** `Aura.Application` (`IEventRepository`, `ICitizenReportRepository`, `IDistrictRiskRepository`, `IUnitOfWork`, `ICrisisNotificationService`)  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **MediatR NuGet Paketi Eklendi**:
   - `Aura.Application` katmanına `MediatR` paketi eklendi.

2. **CQRS Sorguları (Queries) İnşa Edildi (`Application/`):**
   - `GetActiveEventsQuery`: Haritadaki tüm aktif afet olaylarını `IEventRepository` üzerinden çeken sorgu handler'ı.
   - `GetEventsByBoundingBoxQuery`: Kullanıcının ekrandaki görünür enlem/boylam sınırlarına (`MinLat`, `MinLng`, `MaxLat`, `MaxLng`) göre sismik verileri süzüp getiren performanslı sorgu handler'ı.
   - `GetReportsByStatusQuery`: Belirli onay durumundaki (`Pending`, `Verified`, `Rejected`) vatandaş ihbarlarını filtreleyen handler.
   - `GetAllDistrictRisksQuery`: İlçe bazlı risk skorlarını getiren handler.

3. **CQRS Komutları (Commands) İnşa Edildi (`Application/`):**
   - `CreateCitizenReportCommand`: Vatandaştan gelen ihbarı `CitizenReport` varlığı olarak kaydeden ve anında `ICrisisNotificationService` (SignalR WebSocket) üzerinden haritada canlı push tetikleyen komut handler'ı.
   - `VerifyCitizenReportCommand`: Operatörün ihbarı onaylayarak durumunu `Verified` yapan handler.

4. **Dependency Injection Kaydı (`DependencyInjection.cs`)**:
   - `services.AddMediatR(...)` ile tüm CQRS handler'lar otomatik tarandı ve IoC konteynerine kaydoldu.
   - Kod standartlarımız uyarınca **hiçbir yorum satırı (`//`, `/* */`) eklenmemiştir.**

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. CQRS (Command Query Responsibility Segregation) Deseni
Okuma (Query) ve yazma/güncelleme (Command) işlemlerinin birbirinden tamamen ayrılması kararı alındı.
- **Teknik Gerekçe:** Kriz anlarında haritaya binlerce okuma isteği gelirken, aynı anda yeni ihbarlar yazılmaktadır. Okuma ve yazma modellerinin ayrılması, gelecekte okuma performansını artırmak için okuma tarafını önbellek (Redis / Materialized View) ile beslemeyi çok kolaylaştırır.

### B. Controller İnceleşmesi (Fat Controller Önleme)
HTTP Controller sınıfları hiçbir iş kuralı yürütmeyecek; sadece gelen HTTP DTO'sunu bir MediatR komutuna dönüştürüp `_mediator.Send(...)` çağrısı yapacaktır. Böylece **Single Responsibility Principle (SRP)** tam olarak sağlanmış olur.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
