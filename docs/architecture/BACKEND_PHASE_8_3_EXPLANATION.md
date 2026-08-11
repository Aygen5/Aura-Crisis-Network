# 🚓 FAZ 8.3: Saha Ekipleri, Canlı Araç Takibi (`/hubs/vehicles`) & PostGIS KNN Raporu

> **Konu:** EmergencyUnit Rich Domain Model, PostGIS KNN (`<->` / `ST_Distance`) Nearest Neighbor Queries, Dedicated Vehicle Telemetry SignalR Hub  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Neden Bu Mimari Seçildi?

Saha ekiplerinin (AFAD Arama Kurtarma, UMKE Ambulansları, İtfaiye Arazözleri, Polis Devriyeleri) canlı takibi ve kriz ihbarlarına anında görevlendirilmesi iki temel zorluk barındırır:

1. **Yüksek Frekanslı Telemetri Sorumluluk Ayrımı (Single Responsibility Principle):**
   - Saha araçları 5 saniyede bir GPS koordinatı fırlatır. Bu yüksek frekanslı telemetri trafiğinin genel sistem bildirimleriyle (`CrisisHub`) aynı kanalda yürütülmesi tıkanmaya neden olur.
   - Bu nedenle `/hubs/vehicles` adında **özel bir SignalR Hub'ı (`VehicleTrackingHub`)** oluşturulmuştur.

2. **PostGIS KNN (k-Nearest Neighbor) Performansı:**
   - 112 ihbarı geldiğinde verilen koordinata en yakın kullanılabilir ekibi bulmak için klasik matematik formülleri (Haversine formülü) yerine veritabanı seviyesinde PostGIS `<->` k-Nearest Neighbor operatörü çalıştırılır.
   - GIST indeksi sayesinde veritabanı tam tablo taraması yapmadan milisaniyeler içinde en yakın 5 ekibi mesafe sıralamasıyla döner.

---

## 🏛️ 2. Katmanlar ve Oluşturulan Dosyaların Görevleri

```
┌────────────────────────────────────────────────────────────────────────┐
│   SignalR Telemetri & PostGIS KNN İstek Akışı                          │
│                                                                        │
│   Saha Aracı GPS Cihazı                                               │
│   └─> SendGpsTelemetry(unitId, lat, lng, speed, heading)               │
│            │                                                           │
│            ▼                                                           │
│   1. WebApi Hub: VehicleTrackingHub (/hubs/vehicles)                   │
│            │ (UpdateUnitGpsLocationCommand via MediatR)                │
│            ▼                                                           │
│   2. Application: UpdateUnitGpsLocationCommandHandler                  │
│            │ (IEmergencyUnitRepository)                                │
│            ▼                                                           │
│   3. Domain Entity: EmergencyUnit.UpdateGpsLocation()                  │
│            │                                                           │
│            ▼                                                           │
│   4. Broadcast: Clients.All.SendAsync("VehiclePositionUpdated", dto)   │
└────────────────────────────────────────────────────────────────────────┘
```

### 📦 1. `Aura.Domain` Katmanı
- **`UnitType.cs`:** `SearchAndRescue`, `Ambulance`, `FireEngine`, `PolicePatrol` enum'ları.
- **`UnitStatus.cs`:** `Available`, `Dispatched`, `OnScene`, `Maintenance` enum'ları.
- **`EmergencyUnit.cs`:** Zengin domain varlığı (`DispatchToEvent`, `ArriveOnScene`, `CompleteMission`, `UpdateGpsLocation`).

### ⚙️ 2. `Aura.Application` Katmanı
- **`IEmergencyUnitRepository.cs`:** PostGIS KNN ve GPS telemetri kontratları.
- **`EmergencyUnitDto.cs`:** Mesafe (`DistanceKmFromTarget`) bilgisi içeren DTO.
- **`CreateEmergencyUnitCommand.cs`:** Saha ekibi oluşturan komut.
- **`UpdateUnitGpsLocationCommand.cs`:** GPS telemetrisini güncelleyen komut.
- **`DispatchUnitCommand.cs`:** Ekibi olaya görevlendiren komut (`Available -> Dispatched`).
- **`GetNearestEmergencyUnitsQuery.cs`:** PostGIS KNN en yakın ekip sorgusu.
- **`GetAllEmergencyUnitsQuery.cs`:** Tüm saha ekiplerini listeleyen sorgu.

### 🔌 3. `Aura.Infrastructure` Katmanı
- **`EmergencyUnitConfiguration.cs`:** EF Core `geometry(Point, 4326)` ve GIST indeksi yapılandırması.
- **`EmergencyUnitRepository.cs`:** PostGIS `<->` uzamsal mesafe sıralaması yapan repository.

### 🌐 4. `Aura.WebApi` Katmanı
- **`VehicleTrackingHub.cs`:** Adanmış `/hubs/vehicles` SignalR canlı GPS yayın hub'ı.
- **`EmergencyUnitsController.cs`:** `POST /api/v1/emergency-units`, `GET /api/v1/emergency-units/nearest`, `POST /api/v1/emergency-units/{id}/location`, `POST /api/v1/emergency-units/{id}/dispatch` REST uç noktaları.

---

## ⚡ 3. Derleme ve Migration Sonuçları

- **`dotnet build AuraCrisisNetwork.slnx`:** `0 Error(s), 2 Warning(s)` (**Başarıyla Derlendi**)
- **EF Core Migration:** `AddEmergencyUnitVehicleTracking` fırlatıldı.
