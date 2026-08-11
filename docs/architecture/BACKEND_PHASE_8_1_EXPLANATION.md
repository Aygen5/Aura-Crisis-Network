# 🗺️ FAZ 8.1: PostGIS Polygon, Geofencing & Buffer Analiz Altyapısı Raporu

> **Konu:** C# Clean Architecture, NetTopologySuite Geometry, PostGIS GIST Indexing, Point-in-Polygon Geofencing & Buffer Analysis  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Neden Bu Mimari Seçildi? (AFAD / GIS Production Derinlemesine Bakış)

Acil kriz yönetim sistemlerinde (Aura Crisis Network) deprem fay hatları, sel taşkın bölgeleri ve tahliye alanları nokta (`Point`) olarak temsil edilemez. Alanların sınırlarının poligon (`Polygon`) olarak tanımlanması ve uzamsal (spatial) matematikle sorgulanması şarttır.

### Gerçek Hayat AFAD / GIS Kullanım Senaryoları:
1. **Point-in-Polygon Geofencing (`ST_Intersects` / `Contains`):** Saha ihbarı veya 112 çağrısı geldiğinde verilen enlem/boylam koordinatının hangi risk bölgesinin (örneğin "Dere Yatağı Taşkın Alanı" veya "Kuzey Anadolu Fay Çizgisi") sınırları içinde kaldığı milisaniyeler içinde tespit edilir.
2. **Buffer Analizi (`ST_Buffer` / Spatial Proximity):** M6.5 depremin merkez üssü veya patlayan bir kimyasal tesis etrafında 5000 metre dairesel tampon çemberi (`Buffer Zone`) fırlatılarak etki alanı altındaki tüm ilçeler ve risk bölgeleri listelenir.
3. **GIST Spatial Indexing:** PostgreSQL/PostGIS tarafında `RiskZones.Boundary` sütununa GIST indeksi uygulanarak milyonlarca koordinat sorgusunun ms seviyesinde dönmesi sağlanır.

---

## 🏛️ 2. Katmanlar ve Oluşturulan Dosyaların Görevleri

### 📦 1. `Aura.Domain` Katmanı
- **`RiskZoneType.cs`:** `FloodHazardZone`, `SeismicFaultZone`, `LandslideHazardZone`, `EvacuationZone` enum'ları.
- **`RiskZone.cs`:** `BaseEntity` türevi poligon nesnesi (`Name`, `District`, `Type`, `Severity`, `Boundary`).

### ⚙️ 2. `Aura.Application` Katmanı
- **`IRiskZoneRepository.cs`:** Uzamsal sorgulama kontratları.
- **`RiskZoneDto.cs`:** GeoJSON uyumlu koordinat matrisi içeren DTO.
- **`CreateRiskZoneCommand.cs`:** Noktaları NetTopologySuite `Polygon` nesnesine çeviren CQRS komutu.
- **`GetIntersectingRiskZonesQuery.cs`:** Point-in-Polygon Geofencing sorgusu.
- **`CalculateBufferAnalysisQuery.cs`:** Dinamik buffer yarıçap analizi sorgusu.

### 🔌 3. `Aura.Infrastructure` Katmanı
- **`RiskZoneConfiguration.cs`:** EF Core `geometry(Polygon, 4326)` ve `HasMethod("gist")` uzamsal indeks yapılandırması.
- **`RiskZoneRepository.cs`:** Npgsql + NetTopologySuite uzamsal sorgulama uygulaması.

### 🌐 4. `Aura.WebApi` Katmanı
- **`RiskZonesController.cs`:** `POST /api/v1/risk-zones`, `GET /api/v1/risk-zones/intersects` ve `GET /api/v1/risk-zones/buffer` REST API uç noktaları.

---

## ⚡ 3. Derleme ve Migration Doğrulaması

- **`dotnet build AuraCrisisNetwork.slnx`:** `0 Error(s), 2 Warning(s)` (**Başarıyla Derlendi**)
- **EF Core Migration:** `AddPostGISRiskZonePolygons` oluşturuldu.
