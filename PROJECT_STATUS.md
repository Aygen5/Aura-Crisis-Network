# Aura Crisis Network — Mevcut Proje Durum ve Mimari İnceleme Raporu

> **Tarih:** 31 Temmuz 2026  
> **Proje:** Aura Crisis Network (Emergency Response & Crisis Command Center)  
> **Hazırlayan:** Antigravity AI Pair Programmer  

---

## 1. Genel Bakış & Projenin Mevcut Durumu

**Aura Crisis Network**, afete müdahale ekipleri (AFAD, 112 Acil, İtfaiye, Belediye vb.) ve kriz yönetim merkezleri için tasarlanmış gerçek zamanlı bir **Kriz Komuta ve Acil Durum Koordinasyon Platformu** prototipidir. 

Projenin mevcut tasarımı ve arayüz geliştirmesi **Lovable** platformu üzerinde gerçekleştirilmiştir. Mevcut durumda uygulama **tüm ana ekranları, modern UI/UX bileşenleri, veri yapıları ve yönlendirme mantığı ile tamamen fonksiyonel bir Ön Yüz (Frontend Prototype)** seviyesindedir. Statik/mock veriler üzerinden çalışmakta olup tip kontrolünden (`tsc`) hatasız geçmektedir.

---

## 2. Teknolojik Altyapı ve Bağımlılıklar (Tech Stack)

Projede kullanılan teknoloji yığını oldukça modern, performanslı ve genişletilebilir bir mimariye sahiptir:

| Kategori | Kullanılan Teknoloji / Kütüphane | Versiyon / Açıklama |
| :--- | :--- | :--- |
| **Framework & Server** | **TanStack Start + Vite** | SSR destekli modern React framework yapısı |
| **Routing (Yönlendirme)** | **TanStack Router** | Dosya tabanlı (File-based), tip güvenli yönlendirme |
| **State & Data Fetching** | **TanStack React Query** | Asenkron veri yönetimi ve önbellekleme altyapısı (v5) |
| **UI Library & Components**| **React 19 + Radix UI + shadcn/ui** | Erişilebilir, esnek ilkel (primitive) UI bileşenleri |
| **Styling (Stillendirme)** | **Tailwind CSS v4 + tw-animate-css** | OKLCH renk uzayı destekli temalandırma ve animasyonlar |
| **Grafik & Veri Görselleme**| **Recharts** | Risk analizi, hava durumu ve analitik grafikler |
| **İkon Seti** | **Lucide React** | Modern ve tutarlı vektörel ikonlar |
| **Form & Validasyon** | **React Hook Form + Zod** | Form yönetimi ve veri doğrulama altyapısı |

---

## 3. Proje Klasör Mimarisi

```
Aura-Crisis-Network-main/
├── .lovable/                 # Lovable platform yapılandırma klasörü
├── AGENTS.md                 # Lovable Git senkronizasyon kuralı (İleride silinecek)
├── package.json              # Bağımlılıklar ve npm komutları
├── tsconfig.json             # TypeScript yapılandırması (Alias: @/* -> ./src/*)
├── vite.config.ts            # TanStack Start / Vite konfigürasyonu
└── src/
    ├── server.ts             # TanStack Start sunucu giriş noktası
    ├── start.ts              # TanStack Start istemci başlatıcı
    ├── router.tsx            # TanStack Router konfigürasyonu
    ├── routeTree.gen.ts      # TanStack Router otomatik üretilen rota ağacı
    ├── styles.css            # Tailwind CSS v4 tema değişkenleri ve küresel stiller
    ├── hooks/
    │   └── use-mobile.tsx    # Mobil ekran algılama hook'u
    ├── lib/
    │   ├── aura-data.ts      # Tip tanımları (AuraEvent, DisasterType) ve Mock Veriler
    │   ├── geo-turkey.ts     # Türkiye il/deniz vektörel SVG yolları ve koordinatları
    │   ├── utils.ts          # clsx / tailwind-merge yardımcı fonksiyonları
    │   └── error-capture.ts  # Hata yakalama yardımcıları
    ├── components/
    │   ├── aura/             # Aura mimarisine özel ana UI bileşenleri
    │   │   ├── AppShell.tsx  # Ana sayfa düzeni (TopNav, Logo, Header)
    │   │   ├── AuthShell.tsx # Giriş/Kayıt ekranı şablonu
    │   │   ├── MapCanvas.tsx # İnteraktif Türkiye SVG Harita motoru
    │   │   ├── DisasterIcon.tsx # Afet türlerine özel animasyonlu ikonlar
    │   │   └── primitives.tsx# StatCard, AuraBadge, StatusDot bileşenleri
    │   └── ui/               # Radix UI / shadcn altyapılı 46 adet genel UI bileşeni
    └── routes/               # Uygulama Sayfaları (File-Based Routes)
        ├── __root.tsx        # Kök layout, QueryClientProvider, Meta etiketleri
        ├── index.tsx         # / (Command Center - Ana Kriz Ekranı)
        ├── event.$id.tsx     # /event/:id (Olay Detay Sayfası)
        ├── reports.tsx       # /reports (Rapor ve İhbar Merkezi)
        ├── risk.tsx          # /risk (Risk Analiz ve Tahmin Modeli)
        ├── analytics.tsx     # /analytics (Operasyonel Analiz ve İstatistikler)
        ├── settings.tsx      # /settings (Operatör ve Sistem Ayarları)
        ├── login.tsx         # /login (Operatör Giriş Ekranı)
        └── signup.tsx        # /signup (Yeni Operatör Kayıt Ekranı)
```

---

## 4. Mevcut Sayfalar ve Fonksiyonel Özellikler

Uygulamada şu an geliştirilmiş olan 7 temel sayfa/ekran bulunmaktadır:

### 1. Komuta Merkezi (`/` - `src/routes/index.tsx`)
- **Tam Ekran Kriz Haritası (`MapCanvas`)**: Türkiye ve Marmara bölgesine odaklı vektörel SVG tabanlı interaktif harita. Şiddete göre ölçeklenen ve yanıp sönen afet pinleri.
- **Canlı Olay Akışı (Live Feed)**: Sol panelde en son gerçekleşen deprem, sel, yangın, heyelan ve vatandaş ihbarlarının kronolojik listesi.
- **Harita Katman Kontrolleri (Map Layers)**: Isı haritası (Heatmap), Risk Bölgeleri, Depremler, Seller, Yangınlar, Kullanıcı Raporları ve Trafik katmanlarını açma/kapatma düğmeleri.
- **Zaman Çizgisi ve Replay (`Replay Player`)**: 24s / 72s / 7 gün geçmişe dönük olay akışını 1x, 2x, 5x hızlarında oynatma ve geriye sarma simülasyonu.
- **Sistem Sağlığı & Canlı Bildirimler**: Sağ panelde AFAD, Kandilli, Meteoroloji API gecikme süreleri (SignalR simülasyonu) ve anlık düşen bildirim akışı.

### 2. Olay Detay Sayfası (`/event/$id` - `src/routes/event.$id.tsx`)
- **Dinamik Rota Yükleyici (Loader)**: `events` listesinden parametreye (`$id`) göre ilgili afeti çekme (`EQ-8842`, `FL-2213`, `WF-0912` vb.).
- **Olay Metrikleri ve Özeti**: Büyüklük/yağış miktarı/yakılan alan metriği, etki yarıçapı, tahmini etkilenen nüfus, görevlendirilen ekipler.
- **Zaman Akışı (Timeline)**: Algılama, şiddet sınıflandırması, ekip bilgilendirmesi ve saha doğrulaması aşamaları.
- **Yakın Etkinlikler**: Coğrafi olarak yakın konumdaki diğer acil durumların listesi.

### 3. Rapor & İhbar Merkezi (`/reports` - `src/routes/reports.tsx`)
- **İhbar Veri Tablosu**: Saha birimleri ve vatandaşlardan gelen bildirimlerin yönetildiği tablo (Bekleyen, Doğrulanan, Reddedilen).
- **Filtreleme & Arama**: Başlık, ilçe, bildiren personel veya ID'ye göre anlık arama ve durum sekmeleri.
- **CSV Dışa Aktarma**: Rapor verilerini dışa aktarma UI aksiyonu.

### 4. Risk Analiz Ekranı (`/risk` - `src/routes/risk.tsx`)
- **Prediktif Risk Skorları**: Sismik (%74), Sel (%58), Heyelan (%41), Orman Yangını (%66) risk indeksleri.
- **Recharts Grafik Görselleştirmeleri**:
  - Yağış ve Rüzgar Saatlik Analiz Alan Grafiği (AreaChart)
  - İlçelere Göre Heyelan Riski Çubuk Grafiği (BarChart)
  - Sel Tahmini vs. Baz Çizgisi Çizgi Grafiği (LineChart)

### 5. Operasyonel Analiz Ekranı (`/analytics` - `src/routes/analytics.tsx`)
- **Olay Hacim Trendleri**: Günlük/Haftalık/Aylık bazda yığılmış alan grafiği (Stacked AreaChart).
- **Afet Türü Dağılımı**: Pasta Grafik (PieChart) ile afet tiplerinin yüzdesel dağılımı.
- **İlçe Isı Haritası Matrisi (Heatmap Grid)**: İstanbul'un 24 ilçesindeki risk ve olay yoğunluğunu gösteren dinamik renkli matris.
- **Ortalama Müdahale Süreleri**: Haftalık müdahale süresi trendi.

### 6. Ayarlar Ekranı (`/settings` - `src/routes/settings.tsx`)
- Operatör Profili (Elif Karaca - AFAD Görevlisi).
- Görünüm ve Tema Seçenekleri (Command Dark, High Contrast).
- Bildirim Kanalları ve Sesli Uyarı Anahtarları.
- Harita Tercihleri (İlçe etiketleri, arazi kabartması, pin kümeleme).
- Hesap ve 2FA Güvenlik Yönetimi.

### 7. Kimlik Doğrulama Ekranları (`/login`, `/signup` - `src/routes/login.tsx`, `signup.tsx`)
- Operatör giriş formu ve kayıt/yetki talep formu şablonları.

---

## 5. Veri Modeli ve Mock Yapı Analizi (`src/lib/aura-data.ts`)

Şu anki frontend prototype'ı aşağıdaki TypeScript veri yapıları üzerinden beslenmektedir:

```typescript
// Afet Türleri
type DisasterType = "earthquake" | "flood" | "wildfire" | "landslide" | "medical" | "report";

// Afet Olayı Veri Modeli
type AuraEvent = {
  id: string;          // Örn: "EQ-8842"
  type: DisasterType;  // Afet tipi
  title: string;       // Örn: "M 4.6 Earthquake"
  location: string;    // Örn: "Marmara Sea"
  district: string;    // Örn: "Silivri Offshore"
  time: string;        // Örn: "10:12"
  ago: string;         // Örn: "3m"
  metric: string;      // Örn: "4.6"
  metricLabel: string; // Örn: "Magnitude"
  source: string;      // Örn: "Kandilli", "AFAD", "112 Command"
  status: "Active" | "Monitoring" | "Resolved" | "Pending";
  severity: number;    // 0 - 100 arası şiddet skoru
  x: number;           // Harita üzerindeki X koordinat yüzdesi (%)
  y: number;           // Harita üzerindeki Y koordinat yüzdesi (%)
  summary: string;     // Detaylı olay açıklaması
};
```

---

## 6. Backend ve Gerçek React Entegrasyon Yol Haritası

Projeye gerçek bir **Backend API** (Node.js/Express, Python/FastAPI veya C#/.NET) ve **Veritabanı** (PostgreSQL + PostGIS, Redis) eklenirken izlenmesi gereken teknik adımlar:

```
                                  [ Aura Crisis Network ]
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
     [ Frontend İyileştirmeleri ]                                [ Backend & Veritabanı ]
  - TanStack Query API entegrasyonu                            - REST API / GraphQL Endpoints
  - WebSockets / SignalR istemcisi                             - PostgreSQL + PostGIS (Spatial Data)
  - Mapbox / Leaflet Harita Katmanı                            - WebSockets Server (Real-time events)
  - Lovable bağımlılıklarının temizlenmesi                     - Auth Service (JWT / RBAC / 2FA)
```

### Adım 1: Lovable Bağımlılıklarının Temizlenmesi
- `AGENTS.md` dosyası ve `.lovable` klasörü silinecek.
- `package.json` içerisindeki `@lovable.dev/vite-tanstack-config` devDependency'si standart `@tanstack/router-plugin` ve `vite` konfigürasyonuna dönüştürülecek.
- `src/lib/lovable-error-reporting.ts` dosyası standart bir error boundary / Sentry entegrasyonuna çevrilecek.

### Adım 2: Backend API & Veritabanı Mimarisi Kurulumu
1. **Veritabanı Şemaları (PostgreSQL / PostGIS)**:
   - `users` (Operatörler, roller, birimler, 2FA anahtarları).
   - `events` (Afetler, koordinatlar - Point(lat, lng), şiddet, durum, kaynak).
   - `reports` (Vatandaş/saha bildirimleri, medya ekleri, durum).
   - `risk_assessments` (İlçe bazlı risk skorları ve zaman serisi verileri).
2. **Real-time WebSockets / SignalR Servisi**:
   - Kandilli (Rasathane) ve AFAD deprem akışlarını (Webhook/Polling) dinleyen arka plan worker'ı (Background Service).
   - Canlı afet oluştuğunda ön yüze anında push bildirimi gönderen WebSocket kanalı.
3. **RESTful API Uç Noktaları**:
   - `GET /api/v1/events` - Aktif/geçmiş afetleri filtreli getirme.
   - `POST /api/v1/events` - Yeni acil durum oluşturma.
   - `GET /api/v1/reports` - İhbar listesi ve filtreleme.
   - `PATCH /api/v1/reports/:id/status` - İhbar onaylama/reddetme.
   - `GET /api/v1/risk/summary` - Risk tahmin analiz verileri.

### Adım 3: Frontend Data Fetching Entegrasyonu
- Statik `events`, `reports`, `services` array'leri yerine `src/lib/api.ts` istemcisi oluşturulacak.
- `TanStack React Query` (`useQuery`, `useMutation`) kullanılarak backend endpoint'leri ile canlı bağlantı kurulacak.

---

## 7. Özet Değerlendirme

| Alan | Mevcut Durum | Sonraki Adım (Backend + React Entegrasyonu) |
| :--- | :--- | :--- |
| **Arayüz Tasarımı (UI/UX)** | ✅ %100 Tamamlandı (Modern, Koyu Tema, Glassmorphism) | Korunacak, backend verileriyle beslenecek. |
| **Sayfa Yapısı & Rotalar** | ✅ %100 Tamamlandı (7 Ana Ekran, TanStack Router) | Rota bazlı Auth Guard ve Loader'lar eklenecek. |
| **Tip Güvenliği (TypeScript)**| ✅ %100 Temiz (0 tsc hatası) | API DTO modelleri ile senkronize edilecek. |
| **Harita Altyapısı** | ⚠️ SVG Vektör Simülasyonu | Mapbox GL / Leaflet ile gerçek GeoJSON katmanına geçilebilir. |
| **Veri Katmanı** | ⚠️ Mock Data (`aura-data.ts`) | REST / WebSocket API ve PostgreSQL entegrasyonu yapılacak. |
| **Kimlik Doğrulama** | ⚠️ Statik Demo Formu | JWT / OAuth2 ve Role-Based Access Control (RBAC) kurulacak. |

---
*Bu rapor projenin genel yapısını tam olarak özetlemektedir. Backend mimarisi aşamasına geçilmeye hazırdır.*
