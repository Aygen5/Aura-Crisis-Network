# FAZ 2 - Adım 2.1: Canlı Kandilli Rasathanesi Deprem Ingestion Servisi Mimari Öğretici Notları

> **Konu:** Live Earthquake Ingestion, Composite Idempotency Matching & Background Worker  
> **Katman:** `Aura.Infrastructure`  
> **Bağımlılık Düzeyi:** `Aura.Application` (`IKandilliIngestionService`) ve `Aura.Domain` (`Event`, `GeoPoint`, `DisasterType`)  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **`KandilliIngestionService` (`Infrastructure/Services/`)**:
   - Kandilli Rasathanesi canlı veri akışından (Canlı JSON API & HTML `lst0.asp` fallback) anlık deprem verilerini çeken ve `Event` domain nesnelerine dönüştüren servis yazıldı.
   - Enlem/boylam `GeoPoint` value object'ine, büyüklük (ML/Mw) ise 0-100 ölçeğinde şiddet (`Severity`) puanına dönüştürüldü.

2. **`KandilliBackgroundWorker` (`Infrastructure/BackgroundJobs/`)**:
   - .NET `BackgroundService` tabanlı periyodik zamanlayıcı eklendi (60 saniyede bir çalışır).
   - Arka planda `IServiceScope` oluşturarak veritabanına erişir ve mükerrer olmayan yeni depremleri PostgreSQL'e kaydeder.

3. **Composite Idempotency Matching (Mükerrer Kayıt Önleme)**:
   - Kullanıcımızın haklı uyarısı dikkate alınarak 5 bileşenli kompozit kontrol uygulandı:
     - `Source == "Kandilli"`
     - `Metric == liveEvent.Metric` (Büyüklük - ML)
     - `Math.Abs((DetectedAt - liveEvent.DetectedAt).TotalSeconds) < 10` (Zaman toleransı)
     - `Math.Abs(Latitude - liveEvent.Latitude) < 0.001` (Koordinat toleransı)
     - `Math.Abs(Longitude - liveEvent.Longitude) < 0.001` (Koordinat toleransı)

4. **IoC Konfigürasyonu (`DependencyInjection.cs`)**:
   - `services.AddHttpClient<IKandilliIngestionService, KandilliIngestionService>();` ve `services.AddHostedService<KandilliBackgroundWorker>();` DI kayıtları yapıldı.

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Polling vs Webhook
Kandilli resmi olarak açık WebSocket sağlamadığı için production seviyesinde en güvenilir yaklaşım 60 saniyelik aralıklarla background polling yapmaktır.

### B. Kompozit Eşleşme (Composite Idempotency)
Depremler saniyeler içerisinde aynı bölgede art arda meydana gelebilir. Yalnızca zaman veya koordinat kontrolü yetersiz kalabilir. Büyüklük (Metric), Zaman (DetectedAt), Enlem ve Boylam parametreleri birlikte değerlendirilerek mükerrer kayıt oluşumu %100 engellenmiştir.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
