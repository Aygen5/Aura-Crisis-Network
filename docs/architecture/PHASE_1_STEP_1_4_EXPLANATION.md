# FAZ 1 - Adım 1.4: `Aura.Application` Katmanı Mimari Öğretici Notları

> **Konu:** Repository Interfaces, IUnitOfWork, Application Service Contracts ve DTOs  
> **Katman:** `Aura.Application`  
> **Bağımlılık Düzeyi:** Sadece `Aura.Domain` projesine bağımlı (Sıfır ORM / Sıfır HTTP / Sıfır Altyapı Bağımlılığı)  

---

## 📚 1. Neler Eklendi?

Bu adımda kriz yönetim platformunun iş mantığı ve soyutlama katmanı olan `Aura.Application` projesine şu yapılar eklendi:

1. **Repository Arayüzleri (Interfaces)**:
   - `IEventRepository`: Afet olaylarının veritabanı sorgulama ve ekleme soyutlaması.
   - `ICitizenReportRepository`: İhbarların duruma ve konuma göre sorgulama soyutlaması (`GetNearbyReportsAsync`).
   - `IDistrictRiskRepository`: İlçe risk skorları sorgulama soyutlaması.
   - `IOperatorRepository`: Sistem operatörlerinin sorgulama soyutlaması.

2. **Unit of Work Kontratı (`IUnitOfWork`)**:
   - Birden fazla repository işlemini tek bir veritabanı işleminde (Transaction) tutarlı kaydetmek için `SaveChangesAsync` arayüzü.

3. **Application Servis Kontratları (Service Contracts)**:
   - `IKandilliIngestionService`: Kandilli Rasathanesi canlı verilerini çeken arka plan servis kontratı.
   - `IMeteorologyService`: Hava durumu ve yağış/rüzgar verilerini güncelleyen servis kontratı.
   - `ICrisisNotificationService`: WebSocket (SignalR) üzerinden canlı harita uyarıları basan servis kontratı.

4. **Data Transfer Objects (DTOs)**:
   - `EventDto`, `CitizenReportDto`, `DistrictRiskDto`, `OperatorDto` (C# `record` türünde immutable veri taşıma nesneleri).

5. **Temizlik**:
   - Şablon ile gelen `Class1.cs` silindi.

---

## 🎯 2. Hangi Mimari Kararı Neden Aldık? (Teknik Gerekçeleri)

### A. Repository & Unit of Work Ayrımı (DIP & Test Edilebilirlik)
* **Mimari Karar:** Veritabanı erişim metotları (`AddAsync`, `GetByIdAsync`) doğrudan EF Core `DbContext` üzerinden değil, `Aura.Application` katmanında soyutlanan arayüzler (Interfaces) üzerinden tanımlandı.
* **Teknik Gerekçe:** **Dependency Inversion Principle (DIP)** uyarınca üst seviye iş kuralları (Application), alt seviye veritabanı detaylarına (EF Core) bağımlı olmamalıdır. Bu sayede gelecekte veritabanı teknolojisi değişse bile `Application` katmanındaki iş mantığı hiç bozulmaz.

### B. DTO (Data Transfer Object) Kullanımı (Domain Leaking Önleme)
* **Mimari Karar:** `Aura.Domain` entity sınıfları (`Event`, `CitizenReport`) dış dünyaya veya API katmanına doğrudan sunulmadı; DTO `record` yapıları oluşturuldu.
* **Teknik Gerekçe:** **Domain Model Leaking (Domain Sızıntısı) ve Over-posting güvenlik riskini engellemek.** DTO'lar sadece okuma amaçlı veri taşır, iş mantığı barındırmaz.

### C. Async ve CancellationToken Standartı
* **Mimari Karar:** Tüm repository ve servis metotlarına `CancellationToken cancellationToken = default` parametresi eklendi.
* **Teknik Gerekçe:** Yüksek trafikli kriz anında, istemci (browser) isteği iptal ettiğinde sunucuda çalışan veritabanı sorgusunu anında sonlandırarak sistem kaynaklarını (CPU/RAM/DB Connection Pool) korumak.

---

## 🏛️ 3. Application Katmanının Sistem İçerisindeki Görevi

`Aura.Application` katmanı, Clean Architecture yapısında **Use Cases (Kullanım Senaryoları)** katmanıdır.
- **Sorumluluğu:** Sistemin NE yapacağını soyut arayüzlerle tanımlamak, DTO'lar ile veri taşımak ve CQRS komut/sorgularını işlemek.
- **Sınırı:** Veritabanının PostgreSQL mi yoksa başka bir şey mi olduğunu, canlı uyarının SignalR ile mi yoksa MQTT ile mi gönderileceğini **bilmez.**

---

## 🔄 4. Bir Sonraki Katman (`Aura.Infrastructure`) Bunu Nasıl Kullanacak?

Bir sonraki adımda yazılacak olan **`Aura.Infrastructure`** katmanı:
1. `Aura.Application` katmanına bağımlı olacak.
2. `IEventRepository`, `ICitizenReportRepository` vb. arayüzleri **EF Core Npgsql** ve **PostGIS** kullanarak `EventRepository : IEventRepository` şeklinde implemente edecektir.
3. `IUnitOfWork` arayüzünü `AuraDbContext.SaveChangesAsync` ile bağlayacaktır.
4. `IKandilliIngestionService` arayüzünü HTTP / RSS Parser background worker olarak yazacaktır.
5. `ICrisisNotificationService` arayüzünü **SignalR `CrisisHub`** ile canlı WebSocket yayını yapacak şekilde dolduracaktır.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
