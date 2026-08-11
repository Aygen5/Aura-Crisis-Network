# FAZ 2 - Adım 2.3: SignalR Real-Time Push Bildirim Altyapısı Mimari Öğretici Notları

> **Konu:** Real-Time SignalR WebSocket Push Infrastructure, CrisisHub & Ingestion Integration  
> **Katman:** `Aura.Infrastructure` ve `Aura.WebApi`  
> **Bağımlılık Düzeyi:** `Aura.Application` (`ICrisisNotificationService`) ve `Aura.Domain` (`Event`, `CitizenReport`)  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **`CrisisHub` (`WebApi/Hubs/CrisisHub.cs`)**:
   - React haritasının ve canlı panellerin bağlanacağı `/hubs/crisis` SignalR WebSocket Hub sınıfı oluşturuldu.
   - İlçe bazlı canlı bildirim gruplarına abonelik metotları (`JoinDistrictGroup`, `LeaveDistrictGroup`) eklendi.

2. **`CrisisNotificationService` (`Infrastructure/Services/`)**:
   - `ICrisisNotificationService` arayüzünün generic `IHubContext<THub>` tabanlı implementasyonu yazıldı.
   - Yeni bir afet olayı oluştuğunda (`ReceiveEventCreated`, `ReceiveDistrictEvent`) veya vatandaş ihbarı statüsü değiştiğinde (`ReceiveReportStatusChanged`) tüm canlı WebSocket istemcilerine milisaniyeler seviyesinde push yayını yapar.

3. **Ingestion & SignalR Entegrasyonu (`KandilliBackgroundWorker.cs`)**:
   - `KandilliBackgroundWorker` arka plan servisine `ICrisisNotificationService` enjekte edildi. Kandilli'den yeni bir deprem çekilip veritabanına kaydedildiği anda SignalR üzerinden haritada canlı çember ve alarm tetiklenir.

4. **Program.cs ve DI Yapılandırması**:
   - `builder.Services.AddSignalR()`, `AddCrisisNotificationService<CrisisHub>()` ve `app.MapHub<CrisisHub>("/hubs/crisis")` kayıtları yapıldı.
   - CORS politikasına `AllowCredentials()` eklendi.
   - Kod standartlarımız uyarınca **hiçbir yorum satırı (`//`, `/* */`) eklenmemiştir.**

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. HTTP Polling vs WebSocket SignalR Push
Afet anlarında harita kullanıcılarının ve kriz merkezi operatörlerinin F5 ile sayfayı yenilemesi veya her 5 saniyede bir HTTP Polling yapması sunucuları felç eder. SignalR WebSocket ile tek bir açık bağlantı üzerinden çift yönlü (duplex) anlık push yayını yapılması sunucu yükünü ve yanıt süresini minimuma indirir.

### B. İlçe Bazlı Gruplama (SignalR Groups)
Tüm Türkiye harita verisi yerine spesifik bir ilçeyi takibe alan operatörler (örneğin sadece Kadıköy kriz masası) `JoinDistrictGroup("kadıköy")` metodunu çağırarak yalnızca kendi bölgelerini ilgilendiren afet push yayınlarını alabilirler.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
