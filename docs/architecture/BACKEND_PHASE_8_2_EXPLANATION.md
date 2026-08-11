# ⚡ FAZ 8.2: Server-side Marker Clustering & PostGIS Vector Tile (`ST_AsMVT`) Raporu

> **Konu:** PostGIS `ST_AsMVT` & `ST_AsMVTGeom` Protocol Buffers (`.pbf`) Vector Tile Generation & PostgreSQL Server-Side Dynamic Spatial Clustering  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Neden Bu Performans Mimarisi Seçildi?

Büyük ölçekli kriz ve afet yönetim sistemlerinde (10.000+ ihbar ve yüzlerce poligon alanı) haritadaki ham verinin JSON olarak istemciye (frontend) gönderilmesi ciddi performans sorunlarına yol açar:
1. **Ağ Bant Genişliği İsrafı:** 10.000 adet JSON poligon noktası istemciye MB'larca yük getirir.
2. **Tarayıcı CPU/GPU Donmaları:** İstemci tarafında 10.000 ayrı DOM/SVG elemanının işlenmesi tarayıcıyı kilitler.

### PostGIS Çözümü:
- **Vector Tile (`ST_AsMVT` - `.pbf`):** PostgreSQL/PostGIS veritabanı seviyesinde geometri verisini `ST_AsMVTGeom` ile seçilen karonun `(z/x/y)` sınırlarına kırpar ve ikili Protocol Buffer (`.pbf`) formatında sıkıştırarak `application/x-protobuf` olarak döner. İstemci harita sadece görünür ekrandaki karo kadar veri çeker.
- **Server-Side Marker Clustering (`ST_ClusterDBSCAN` / Spatial Grid Binning):** 10.000 ham nokta yerine PostgreSQL veritabanı seviyesinde noktalar enlem/boylam ızgarasıyla gruplanır ve geriye harita yakınlaştırma seviyesine (`zoomLevel`) duyarlı küme nesneleri (`PointCount: 42`, `MaxSeverity`, `PrimaryDisasterType`) dönülür.

---

## 🏛️ 2. Katmanlar ve Oluşturulan Dosyaların Görevleri

### ⚙️ 1. `Aura.Application` Katmanı
- **`IGisTileRepository.cs`:** Vector Tile (`.pbf`) ve Server-side Marker Clustering kontratları.
- **`MarkerClusterDto.cs`:** Kümelenmiş marker nesnesi (`ClusterId`, `PointCount`, `Latitude`, `Longitude`, `MaxSeverity`, `PrimaryDisasterType`, `IsCluster`).
- **`GetVectorTileQuery.cs`:** `(z, x, y)` karo numarasına göre ikili `.pbf` dosyası isteyen CQRS sorgusu.
- **`GetClusteredMarkersQuery.cs`:** Bounding box (`minLat`, `minLng`, `maxLat`, `maxLng`) ve `zoomLevel` seviyesine göre kümelenmiş noktaları getiren CQRS sorgusu.

### 🔌 2. `Aura.Infrastructure` Katmanı
- **`GisTileRepository.cs`:** PostGIS `ST_AsMVTGeom` ve `ST_AsMVT` SQL komutlarını çalıştıran, `FLOOR(Latitude / gridStep)` ile veritabanı seviyesinde marker kümeleme yapan repository.
- **`DependencyInjection.cs`:** `services.AddScoped<IGisTileRepository, GisTileRepository>();` kaydı.

### 🌐 3. `Aura.WebApi` Katmanı
- **`GisTilesController.cs`:** `GET /api/v1/gis/tiles/{z}/{x}/{y}.pbf` ve `GET /api/v1/gis/clusters` REST API uç noktaları.

---

## 🚀 3. İleriki Frontend Fazı (FAZ 8.2 UI) İçin Mimari Öneriler

Backend tarafında kurduğumuz bu yüksek performanslı Vector Tile ve Server-Side Clustering altyapısını frontend tarafında tüketebilmek için sonraki fazda yapılması gerekenler:

1. **`gis-tiles.service.ts` & `useGisTilesQuery.ts`:**
   - `fetchClusteredMarkers(bounds, zoom)` için TanStack Query hook'u (`useClusteredMarkers`).
2. **`MapCanvas.tsx` Cluster Marker Render Katmanı:**
   - Harita zoom yapıldıkça veya sürüklendikçe `GET /api/v1/gis/clusters` fırlatarak tekil marker'lar yerine rozetli küme dairelerini (`[42]`, `[128]`) gösterme.
3. **Vector Tile (`.pbf`) Katmanı Entegrasyonu:**
   - Mapbox GL / Leaflet VectorGrid eklentisiyle `/api/v1/gis/tiles/{z}/{x}/{y}.pbf` ucunu canlı harita katmanı olarak besleme.

---

## ⚡ 4. Derleme Sonuçları

- **`dotnet build AuraCrisisNetwork.slnx`:** `0 Error(s), 2 Warning(s)` (**Başarıyla Derlendi**)
