# Aura Crisis Network — Ürün Geliştirme Yol Haritası & Backend Mimari Planı

> **Mimari:** Clean Architecture (.NET 10 / C#) + PostgreSQL / PostGIS  
> **Ön Yüz:** React + TanStack Router & Query + SignalR  
> **Veri Yaklaşımı:** ❌ Sıfır Mock Data (Gerçek Kandilli/AFAD/Meteoroloji API & PostGIS Veritabanı)  

---

## 🏗️ 1. Katman Oluşturma Sırası (Domain-First Clean Architecture)

Proje backend tarafında katmanlı, bağımlılıkların içeri doğru yönlendiği **Clean Architecture (Clean Mimari)** prensiplerine göre yapılandırılmıştır:

1. **Solution** (.NET 10 Solution & Proje Şablonları)
2. **Docker + PostgreSQL** (PostgreSQL 16 + PostGIS 3.4 Docker Altyapısı)
3. **Domain** (`Aura.Domain`: Varlıklar, Value Object'ler, Enum'lar, Domain Etkinlikleri)
4. **Application** (`Aura.Application`: CQRS, MediatR, DTO'lar, Repository Arayüzleri, Servis Kontratları)
5. **Infrastructure** (`Aura.Infrastructure`: EF Core DbContext, PostGIS Mapping, Live Ingestion Workers, SignalR Hub)
6. **WebApi** (`Aura.WebApi`: Controllers, Middleware, Swagger, Endpoints)
7. **Frontend Integration** (React + TanStack Query & SignalR Client)

---

## 🗺️ 2. Ürün Geliştirme Adımları (Aşamalı Yol Haritası)

### 🟢 FAZ 1: Backend Altyapısı ve PostGIS Veritabanı Kurulumu *(TAMAMLANDI)*
* **Adım 1.1:** `.NET 10 Clean Architecture` çözümünün (`AuraCrisisNetwork.slnx`) ve 4 projenin oluşturulması (`Aura.Domain`, `Aura.Application`, `Aura.Infrastructure`, `Aura.WebApi`). *(TAMAMLANDI)*
* **Adım 1.2:** PostgreSQL + PostGIS Docker altyapısının (`docker-compose.yml` ve `init-postgis.sql`) kurulması. *(TAMAMLANDI)*
* **Adım 1.3:** `Aura.Domain` Katmanının İnşası (Varlıklar: `Event`, `CitizenReport`, `DistrictRisk`, `Operator`, Value Objects: `GeoPoint`, Enums, Domain Events). *(TAMAMLANDI)*
* **Adım 1.4:** `Aura.Application` Katmanının İnşası (Repository Arayüzleri, DTO'lar, CQRS MediatR Komut/Sorguları, Servis Kontratları). *(TAMAMLANDI)*
* **Adım 1.5:** `Aura.Infrastructure` Katmanının İnşası (EF Core Npgsql + NetTopologySuite, PostGIS `Point` Mapping, `AuraDbContext`, EF Core Migrations). *(TAMAMLANDI)*
* **Adım 1.6:** `Aura.WebApi` Katmanı ve Docker PostGIS Veritabanı Canlı Bağlantısının Kurulması & Doğrulanması. *(TAMAMLANDI)*

---

### 🟢 FAZ 2: Canlı Veri Akışları ve Ingestion Servisleri (Sıfır Sahte Veri) *(TAMAMLANDI)*
* **Adım 2.1 (Kandilli / AFAD Deprem Servisi):** 
  - Kandilli Rasathanesi ve AFAD'ın canlı son depremler akışını (JSON/XML) 60 saniyede bir sorgulayan `BackgroundService` (`IHostedService`) yazılması ve Composite Idempotency kontrolünün eklenmesi. *(TAMAMLANDI)*
* **Adım 2.2 (Meteoroloji & Hava Durumu Servisi):**
  - Open-Meteo açık API'sinden ilçeler için saatlik yağış miktarı (`mm/h`) ve rüzgar hızı (`km/h`) çekilmesi, canlı Sel, Yangın ve Heyelan risk skorlarının güncellenmesi. *(TAMAMLANDI)*
* **Adım 2.3 (SignalR Real-Time Push Hub):**
  - `CrisisHub` (`/hubs/crisis`) ve `CrisisNotificationService` ile canlı WebSocket push bildirim altyapısının kurulması. *(TAMAMLANDI)*

---

### 🟢 FAZ 3: API Endpoint'leri ve MediatR CQRS Altyapısı *(TAMAMLANDI)*
* **Adım 3.1 (CQRS Event & Report Handlers):**
  - `GetActiveEventsQuery`, `GetEventsByBoundingBoxQuery`, `GetReportsByStatusQuery`, `CreateCitizenReportCommand`, `VerifyCitizenReportCommand` handler'larının yazılması. *(TAMAMLANDI)*
* **Adım 3.2 (REST API Endpoints & Controllers):**
  - `EventsController`, `CitizenReportsController`, `RiskController`, `AnalyticsController` yazılması. *(TAMAMLANDI)*
* **Adım 3.3 (Risk, Analytics & Route Alignment):**
  - `GET /api/v1/risk/analysis`, `GET /api/v1/analytics/summary`, `GET /api/v1/events/{id}`, `POST /api/v1/events/{id}/escalate`, `PATCH /api/v1/reports/{id}/status` rotalarının standartlaştırılması. *(TAMAMLANDI)*

---

### 🟢 FAZ 4: Frontend Temizliği ve Gerçek API Entegrasyonu
* **Adım 4.1 (Lovable ve Sahte Veri Temizliği & SignalR Entegrasyonu):**
  - Sahte veri içeren `src/lib/aura-data.ts` dosyasının projeden tamamen kaldırılması.
  - Backend API ile iletişim kuracak Axios/Fetch istemcisinin (`src/lib/api-client.ts`) ve `@microsoft/signalr` istemcisinin (`src/lib/signalr-client.ts`) yazılması.
  - Harita ve canlı akış bileşenlerinin (`MapCanvas.tsx`, `AppShell.tsx`, `reports.tsx`, `analytics.tsx`) canlı API verisine bağlanması.

---

### 🟢 FAZ 5: Uçtan Uca Doğrulama ve Performans Optimizasyonu
* **Adım 5.1 (Uçtan Uca Doğrulama):**
  - Gerçek Kandilli verisi geldiğinde -> .NET Service veritabanına yazar -> SignalR tetiklenir -> React haritasında pini yanıp söner akışının doğrulanması.
* **Adım 5.2 (Performans & GİS İndeksleme):**
  - PostGIS `GIST` coğrafi indekslerinin ve veritabanı sorgu performansının doğrulanması.

---

### 🟢 FAZ 6: Kurumsal Kalite, Testler, Güvenlik ve DevOps (Production Readiness)
* **Adım 6.1 (Unit Tests):**
  - `Aura.Domain` (Value Objects, Entity iş mantıkları) ve `Aura.Application` (CQRS Handlers) birim testlerinin yazılması.
* **Adım 6.2 (Integration Tests):**
  - `Aura.Infrastructure` (PostgreSQL / EF Core Repositories) ve `Aura.WebApi` (Controller Endpoints & SignalR Hub) entegrasyon testlerinin yazılması.
* **Adım 6.3 (End-to-End Tests):**
  - Kandilli -> Database -> SignalR -> React uçtan uca akış testleri.
* **Adım 6.4 (GitHub Actions CI/CD Pipeline):**
  - Restore, Build, Test, Code Coverage iş akışının kurulması.
* **Adım 6.5 (Docker Production Setup):**
  - Multi-stage production `Dockerfile` ve `docker-compose.prod.yml` yapılandırması.
* **Adım 6.6 (Structured Logging):**
  - Serilog entegrasyonu ve yapılandırılmış log izleme.
* **Adım 6.7 (Monitoring & Metrics):**
  - Health Checks, Prometheus / OpenTelemetry metriklerinin yapılandırılması.
* **Adım 6.8 (Security & Resilience):**
  - Rate Limiting (Kötüye kullanımı engelleme), Global Exception Handling Middleware ve FluentValidation doğrulamaları.
* **Adım 6.9 (Kurumsal Dokümantasyon & Swagger):**
  - OpenAPI / Swagger dokümantasyonu, Mimari Sıralama Şeması (Sequence Diagram) ve GitHub Portföyü için `README.md` hazırlanması.

---

## 📊 Özet Faz Zaman Tablosu

| Faz | Açıklama | Beklenen Çıktı |
| :--- | :--- | :--- |
| **Faz 1** | .NET 10 Clean Architecture & PostGIS DB Setup | Derlenebilir .NET 10 Clean Architecture ve PostgreSQL veritabanı |
| **Faz 2** | Live Ingestion (Kandilli/AFAD/Weather) | Gerçek canlı deprem ve hava verisi çeken arka plan servisi & SignalR |
| **Faz 3** | Controllers, MediatR CQRS & SignalR Hub | Tamamlanmış REST API ve v1 rotaları |
| **Faz 4** | Frontend Refactoring & Direct Integration | Sahte veriden temizlenmiş, canlı API ile çalışan React uygulaması |
| **Faz 5** | Uçtan Uca Doğrulama & Performans | Üretim seviyesinde doğrulama |
| **Faz 6** | Testing, CI/CD, Security & DevOps | GitHub Portföyü için Enterprise Production-Ready Standart |

---
*Bu yol haritası sahte (mock) veri kullanmadan doğrudan canlı backend ve veritabanı entegrasyonu sağlayacak şekilde tasarlanmıştır.*
