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

### 🟢 FAZ 4: Frontend Temizliği ve Gerçek API Entegrasyonu *(TAMAMLANDI)*
* **Adım 4.1 (Lovable ve Sahte Veri Temizliği & SignalR Entegrasyonu):**
  - Sahte veri içeren `src/lib/aura-data.ts` dosyasının projeden tamamen kaldırılması.
  - Backend API ile iletişim kuracak Axios/Fetch istemcisinin (`src/lib/api-client.ts`) ve `@microsoft/signalr` istemcisinin (`src/lib/signalr-client.ts`) yazılması.
  - Harita ve canlı akış bileşenlerinin (`MapCanvas.tsx`, `AppShell.tsx`, `reports.tsx`, `analytics.tsx`) canlı API verisine bağlanması. *(TAMAMLANDI)*

---

### 🟢 FAZ 5: Uçtan Uca Doğrulama ve Performans Optimizasyonu *(TAMAMLANDI)*
* **Adım 5.1 (Uçtan Uca Doğrulama):**
  - Gerçek Kandilli verisi geldiğinde -> .NET Service veritabanına yazar -> SignalR tetiklenir -> React haritasında pini yanıp söner akışının doğrulanması. *(TAMAMLANDI)*
* **Adım 5.2 (Performans & GİS İndeksleme):**
  - PostGIS `GIST` coğrafi indekslerinin ve veritabanı sorgu performansının doğrulanması. *(TAMAMLANDI)*

---

### 🟢 FAZ 6: Kimlik Doğrulama ve Güvenlik Altyapısı (Auth & Security)
* **Adım 6.1 (ASP.NET Core Identity & User Model):**
  - Identity `ApplicationUser` ve `ApplicationRole` entegrasyonu, EF Core DbContext uyarlaması.
* **Adım 6.2 (JWT Access & Refresh Token Engine):**
  - `ITokenProvider` servisi, Refresh Token rotasyonu ve veritabanı persistansı.
* **Adım 6.3 (Role & Claim-Based Authorization):**
  - `Admin`, `Operator`, `Citizen` rolleri için `[Authorize(Roles = "...")]` politikalarının API uç noktalarına uygulanması.
* **Adım 6.4 (React Auth Entegrasyonu):**
  - Login/Register sayfalarının canlı Auth API'sine bağlanması, Token saklama ve HTTP Bearer Interceptor.

---

### 🟢 FAZ 7: Kullanıcı Deneyimi, Medya & Bildirim Altyapısı (Media & Notifications)
* **Adım 7.1 (Fotoğraf / Video / Medya Yükleme Servisi):**
  - `IFileStorageService` ile ihbarlara çoklu medya yükleme, Magic Bytes güvenlik doğrulaması ve CDN/Storage entegrasyonu.
* **Adım 7.2 (Multi-Channel Notification Altyapısı):**
  - SignalR + FCM Push Notification entegrasyonu ve Outbox Pattern ile arkaplanda güvenli bildirim gönderimi.

---

### 🟢 FAZ 8: Gelişmiş GIS, Saha Operasyonları & Canlı Araç Takibi (Advanced GIS & Fleet)
* **Adım 8.1 (PostGIS Polygon & Geofencing):**
  - Kriz ve sel riski poligonlarının haritada çizilmesi, kesişim (Spatial Intersection) ve Buffer analizi.
* **Adım 8.2 (Cluster & Tile Performance):**
  - Server-side Marker Clustering ve Vector Tile (`ST_AsMVT`) performans optimizasyonu.
* **Adım 8.3 (Saha Ekipleri & Canlı Araç Takibi):**
  - `EmergencyUnit` varlığı, 5s canlı GPS takibi için adanmış `/hubs/vehicles` SignalR Hub'ı ve PostGIS En Yakın Ekip (KNN) hesabı.

---

### 🟢 FAZ 9: Production Altyapısı, Performans & Monitoring (Resilience & Telemetry)
* **Adım 9.1 (MediatR Caching & Redis):**
  - Caching Pipeline Behavior, Redis önbellekleme ve otomatik invalidate mekanizması.
* **Adım 9.2 (EF Core Audit Logging Interceptor):**
  - Otomatik kullanıcı IP, eski/yeni değer değişim denetim izi (Audit Trail).
* **Adım 9.3 (Serilog, OpenTelemetry & Prometheus/Grafana):**
  - Yapılandırılmış loglama, metrik toplama ve Health Checks paneli.

---

### 🟢 FAZ 10: Kalite, Kurumsal Testler & Yayınlama (Testing, CI/CD & Deployment)
* **Adım 10.1 (Unit Tests):** `Aura.Domain` ve `Aura.Application` birim testleri (xUnit, Moq, FluentAssertions).
* **Adım 10.2 (Integration & API Tests):** Testcontainers PostgreSQL ile gerçek veritabanı ve WebApplicationFactory API testleri.
* **Adım 10.3 (GitHub Actions CI/CD):** Restore, Build, Test, Docker Build otomasyonu.
* **Adım 10.4 (Production Deployment):** Docker Compose, Nginx Reverse Proxy, Rate Limiting & SSL/HTTPS yayınlama.

---

## 📊 Özet Faz Zaman Tablosu

| Faz | Açıklama | Beklenen Çıktı | Durum |
| :--- | :--- | :--- | :--- |
| **Faz 1** | .NET 10 Clean Architecture & PostGIS Setup | Derlenebilir Clean Architecture & DB | ✅ **Tamamlandı** |
| **Faz 2** | Live Ingestion Workers & SignalR Hub | Canlı Kandilli/AFAD/Weather akışı | ✅ **Tamamlandı** |
| **Faz 3** | REST API & MediatR CQRS | REST API uç noktaları | ✅ **Tamamlandı** |
| **Faz 4** | Frontend Refactoring & Direct API Integration | Canlı API ile çalışan React uygulaması | ✅ **Tamamlandı** |
| **Faz 5** | Uçtan Uca Doğrulama & Performans | Üretim seviyesinde doğrulama | ✅ **Tamamlandı** |
| **Faz 6** | Auth & Security (JWT, Refresh Token, RBAC) | Güvenli Kimlik Doğrulama | ⏳ **Sıradaki Adım** |
| **Faz 7** | Media Storage & Multi-Channel Notifications | Dosya Yükleme & Push Notification | 📅 Planlandı |
| **Faz 8** | Advanced GIS, Geofencing & Fleet Tracking | Canlı Araç Takibi & Poligon Analizi | 📅 Planlandı |
| **Faz 9** | Redis Caching, Audit Logs & Monitoring | Telemetri & Yüksek Performans | 📅 Planlandı |
| **Faz 10** | Testing, CI/CD & Production Deployment | Docker, Nginx & GitHub Actions CI/CD | 📅 Planlandı |

---
*Bu yol haritası sahte (mock) veri kullanmadan doğrudan canlı backend ve veritabanı entegrasyonu sağlayacak şekilde tasarlanmıştır.*
