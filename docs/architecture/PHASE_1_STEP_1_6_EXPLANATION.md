# FAZ 1 - Adım 1.6: `Aura.WebApi` Katmanı ve PostgreSQL Bağlantısı Mimari Öğretici Notları

> **Konu:** WebApi Sunucu Yapılandırması, Connection Strings, Automatic Migration Startup ve Health Check  
> **Katman:** `Aura.WebApi`  
> **Bağımlılık Düzeyi:** `Aura.Infrastructure` ve `Aura.Application` katmanlarını IoC konteynerinde bağlayan sunum katmanı  

---

## 📚 1. Neler Yapıldı?

Bu adımda kriz yönetim platformunun HTTP giriş kapısı ve sunum katmanı olan `Aura.WebApi` projesi yapılandırıldı:

1. **`appsettings.json` Veritabanı Yapılandırması**:
   - PostgreSQL Docker veritabanı bağlantı cümlesi (`ConnectionStrings:DefaultConnection`) eklendi.

2. **IoC Bağımlılık Enjeksiyonu (`Program.cs`)**:
   - `builder.Services.AddInfrastructure(builder.Configuration)` çağrılarak `AuraDbContext`, Npgsql PostGIS desteği ve repository'ler IoC (Inversion of Control) konteynerine bağlandı.

3. **Otomatik Veritabanı Migration Scope'u (`Program.cs`)**:
   - Sunucu başlatıldığında `using (var scope = app.Services.CreateScope())` ile veritabanının son migration durumunda olduğundan emin olmak için `dbContext.Database.MigrateAsync()` çalıştırıldı.

4. **Sağlık Kontrolü Uç Noktası (`/health`)**:
   - `GET /health` HTTP endpoint'i tanımlandı. PostgreSQL ve PostGIS canlı veritabanı bağlantısının anlık yanıt verip vermediğini test eder.

5. **CORS Yapılandırması**:
   - React ön yüzünün (`http://localhost:3000` / `http://localhost:5173`) backend API'ye güvenli erişim sağlaması için CORS politikası eklendi.

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Automatic Migration Startup Scope
* **Mimari Karar:** `Program.cs` içerisinde sunucu ayağa kalkarken `dbContext.Database.MigrateAsync()` çağrısı yerleştirildi.
* **Teknik Gerekçe:** CI/CD veya Docker ortamında sunucu her dağıtıldığında (deploy), PostgreSQL veritabanında eksik tablo veya PostGIS indeksi kalmamasını otomatik garanti etmek.

### B. `/health` Endpoint Tercihi
* **Mimari Karar:** Özel minimal API uç noktası olarak `/health` eklendi.
* **Teknik Gerekçe:** Kubernetes / Docker Swarm veya canlı izleme sistemlerinin backend sunucusunun sadece HTTP yanıtı verip vermediğini değil, PostgreSQL veritabanına erişip erişemediğini doğrulamasına imkan tanımak.

---

## 🏛️ 3. WebApi Katmanının Sistem İçerisindeki Görevi

Clean Architecture yapısında `Aura.WebApi` bir **Presentation (Sunum ve Giriş Kapısı)** katmanıdır.
- **Sorumluluğu:** Dış dünyadan (React web, mobil uygulama, 112 webhook'ları) gelen HTTP isteklerini karşılamak, doğrulamak, `Application` katmanındaki CQRS komut/sorgularına yönlendirmek ve yanıt dönmek.
- **Sınırı:** İş kuralı yazmaz, veritabanı sorguları yazmaz. Sadece bağımlılıkları bağlar ve istekleri yönlendirir.

---

## 🔄 4. Sonraki Fazlarda (FAZ 2 & FAZ 3) Bu Yapı Nasıl Kullanılacak?

1. **FAZ 2 (Canlı Veri Ingestion):**
   - Arka planda çalışacak `KandilliEarthquakeIngestionService` ve `MeteorologyService` background worker'ları `Program.cs` içerisinde `services.AddHostedService<...>()` olarak kaydedilecek.
2. **FAZ 3 (REST API Controllers & SignalR Hub):**
   - `EventsController`, `ReportsController` ve SignalR `CrisisHub` uç noktası (`/hubs/crisis`) bu katmana eklenerek React ön yüzü canlı WebSocket ile beslenecektir.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
