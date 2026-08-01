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

### 🟢 FAZ 1: Backend Altyapısı ve PostGIS Veritabanı Kurulumu
* **Adım 1.1:** `.NET 10 Clean Architecture` çözümünün (`AuraCrisisNetwork.slnx`) ve 4 projenin oluşturulması (`Aura.Domain`, `Aura.Application`, `Aura.Infrastructure`, `Aura.WebApi`). *(TAMAMLANDI)*
* **Adım 1.2:** PostgreSQL + PostGIS Docker altyapısının (`docker-compose.yml` ve `init-postgis.sql`) kurulması. *(TAMAMLANDI)*
* **Adım 1.3:** `Aura.Domain` Katmanının İnşası (Varlıklar: `Event`, `CitizenReport`, `DistrictRisk`, `Operator`, Value Objects: `GeoPoint`, Enums, Domain Events).
* **Adım 1.4:** `Aura.Application` Katmanının İnşası (Repository Arayüzleri, DTO'lar, CQRS MediatR Komut/Sorguları, Servis Kontratları).
* **Adım 1.5:** `Aura.Infrastructure` Katmanının İnşası (EF Core Npgsql + NetTopologySuite, PostGIS `Point` Mapping, `AuraDbContext`, EF Core Migrations).
* **Adım 1.6:** `Aura.WebApi` Katmanı ve Docker PostGIS Veritabanı Canlı Bağlantısının Kurulması & Doğrulanması.

---

### 🟢 FAZ 2: Canlı Veri Akışları ve Ingestion Servisleri (Sıfır Sahte Veri)
* **Adım 2.1 (Kandilli / AFAD Deprem Servisi):** 
  - Kandilli Rasathanesi ve AFAD'ın canlı son depremler akışını (JSON/XML) 60 saniyede bir sorgulayan `BackgroundService` (`IHostedService`) yazılması.
  - Gelen gerçek deprem verilerinin büyüklük (`magnitude`), derinlik (`depth`), koordinat (`Point`) ve ilçe eşleşmesi yapılarak doğrudan `Events` tablosuna kaydedilmesi.
* **Adım 2.2 (Meteoroloji & Hava Durumu Servisi):**
  - Open-Meteo veya Meteoroloji Genel Müdürlüğü açık API'sinden İstanbul ve Marmara ilçeleri için saatlik yağış miktarı (`mm/h`) ve rüzgar hızı (`km/h`) çekilmesi.
  - Yağış ve rüzgar verisinden gerçek zamanlı Sel ve Yangın risk indeksinin hesaplanması.
* **Adım 2.3 (Gerçek İhbar Veritabanı):**
  - Vatandaş ve saha birimlerinin göndereceği ihbarlar için `CitizenReports` tablosunun hazırlanması.

---

### 🟢 FAZ 3: API Endpoint'leri ve SignalR Canlı Bağlantı Hub'ı
* **Adım 3.1 (CQRS Event Endpoints):**
  - `GET /api/v1/events`: Filtreli (afet türü, tarih, koordinat yarıçapı) canlı olayları getirme.
  - `GET /api/v1/events/{id}`: Tekil olay detayı, etkilenen tahmini nüfus ve etki yarıçapı analizi.
  - `POST /api/v1/events/{id}/escalate`: Kriz seviyesini yükseltme.
* **Adım 3.2 (Report Endpoints):**
  - `GET /api/v1/reports`: İhbar listesi (durum sekmelerine göre: Pending, Verified, Rejected).
  - `POST /api/v1/reports`: Yeni vatandaş/saha ihbarı oluşturma.
  - `PATCH /api/v1/reports/{id}/status`: Operatörün ihbarı onaylaması veya reddetmesi.
* **Adım 3.3 (Risk & Analytics Endpoints):**
  - `GET /api/v1/risk/analysis`: Gerçek meteoroloji ve deprem verilerinden hesaplanan ilçe bazlı sismik, sel ve yangın risk skorları.
  - `GET /api/v1/analytics/summary`: Afet dağılımları ve müdahale süreleri istatistikleri.
* **Adım 3.4 (SignalR Real-Time Hub):**
  - `CrisisHub` (`/hubs/crisis`) geliştirilmesi.
  - Arka planda Kandilli'den yeni deprem düştüğünde veya yeni ihbar geldiğinde bağlı tüm ön yüz istemcilerine `ReceiveEvent` ve `ReceiveReport` sinyallerinin fırlatılması.

---

### 🟢 FAZ 4: Frontend Temizliği ve Gerçek API Entegrasyonu
* **Adım 4.1 (Lovable ve Sahte Veri Temizliği):**
  - Sahte veri içeren `src/lib/aura-data.ts` dosyasının projeden tamamen kaldırılması.
* **Adım 4.2 (API Client & TanStack Query):**
  - Backend API ile iletişim kuracak Axios/Fetch istemcisinin (`src/lib/api-client.ts`) yazılması.
  - TanStack Query hook'larının oluşturulması (`useEvents`, `useEventDetail`, `useReports`, `useRiskAnalysis`, `useAnalytics`).
* **Adım 4.3 (SignalR İstemcisi):**
  - Ön yüze `@microsoft/signalr` paketinin eklenmesi.
  - Harita ve canlı akış bileşenlerinin (`index.tsx`, `MapCanvas.tsx`) SignalR event'lerini dinleyerek anında güncellenmesi.

---

### 🟢 FAZ 5: Doğrulama ve Üretim Kalitesi (Production Readiness)
* **Adım 5.1 (Uçtan Uca Doğrulama):**
  - Gerçek Kandilli verisi geldiğinde -> .NET Service veritabanına yazar -> SignalR tetiklenir -> React haritasında pini yanıp söner akışının doğrulanması.
* **Adım 5.2 (Performans & GİS İndeksleme):**
  - PostGIS `GIST` coğrafi indekslerinin eklenmesi.
  - Redis önbellekleme (Analytics ve Risk skorları için).

---

## 📊 Özet Faz Zaman Tablosu

| Faz | Açıklama | Beklenen Çıktı |
| :--- | :--- | :--- |
| **Faz 1** | .NET 10 Clean Architecture & PostGIS DB Setup | Derlenebilir .NET 10 Clean Architecture ve PostgreSQL veritabanı |
| **Faz 2** | Live Ingestion (Kandilli/AFAD/Weather) | Gerçek canlı deprem ve hava verisi çeken arka plan servisi |
| **Faz 3** | Controllers, MediatR CQRS & SignalR Hub | Tamamlanmış REST API ve canlı WebSocket Hub'ı |
| **Faz 4** | Frontend Refactoring & Direct Integration | Sahte veriden temizlenmiş, canlı API ile çalışan React uygulaması |
| **Faz 5** | Test, Optimizasyon & Dokümantasyon | Üretim seviyesinde (Production-ready) Kriz Yönetim Platformu |

---
*Bu yol haritası sahte (mock) veri kullanmadan doğrudan canlı backend ve veritabanı entegrasyonu sağlayacak şekilde tasarlanmıştır.*
