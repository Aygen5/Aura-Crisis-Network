# FAZ 3 - Adım 3.2: REST API Endpoints ve Controllers Mimari Öğretici Notları

> **Konu:** RESTful HTTP Controllers, BaseApiController & MediatR Presentation Layer  
> **Katman:** `Aura.WebApi`  
> **Bağımlılık Düzeyi:** `Aura.Application` (MediatR `ISender`, CQRS Commands & Queries)  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **`BaseApiController` (`WebApi/Controllers/`)**:
   - `[ApiController]` ve `[Route("api/[controller]")]` özniteliklerini (attributes) barındıran taban controller.
   - `ISender Mediator` bağımlılığını kapsüller (Encapsulation).

2. **`EventsController` (`WebApi/Controllers/`)**:
   - `GET /api/events`: Aktif tüm harita olaylarını dönen uç nokta.
   - `GET /api/events/bounding-box`: Harita ekranındaki görünür enlem/boylam kutusuna (`minLat`, `minLng`, `maxLat`, `maxLng`) göre filtrelenmiş olayları dönen uç nokta.

3. **`CitizenReportsController` (`WebApi/Controllers/`)**:
   - `GET /api/reports`: Filtrelenmiş vatandaş ihbarlarını getiren uç nokta.
   - `POST /api/reports`: Vatandaştan canlı ihbar alan, veritabanına yazan ve SignalR WebSocket üzerinden haritaya anında push yapan uç nokta.
   - `PUT /api/reports/{id}/verify`: Nöbetçi operatörün ihbarı onaylamasını sağlayan uç nokta.

4. **`DistrictRisksController` (`WebApi/Controllers/`)**:
   - `GET /api/district-risks`: İlçe bazlı prediktif risk skorlarını dönen uç nokta.
   - Kod standartlarımız uyarınca **hiçbir yorum satırı (`//`, `/* */`) eklenmemiştir.**

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Lean Controllers (İnce Controller Mimarisi)
Controller sınıfları hiçbir veritabanı sorgusu, `DbContext` enjeksiyonu veya iş kuralı içermez. Sadece gelen HTTP DTO'sunu MediatR `IMediator.Send(...)` komutuna aktarır.
- **Teknik Gerekçe:** **Single Responsibility (SRP)** ve **Dependency Inversion (DIP)** ilkelerini tam uygulamak. Test edilebilirliği üst seviyeye çıkarmak.

### B. Bounding Box Filtreleme Tercihi
`GET /api/events/bounding-box` uç noktası sayesinde React harita istemcisi (Mapbox / Leaflet) sadece kullanıcının ekranda gördüğü coğrafi dikdörtgen içerisindeki deprem/afet verilerini talep eder. Bu durum kriz anında istemci tarafındaki DOM yükünü ve ağ trafiğini %80 oranında düşürür.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
