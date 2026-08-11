# 📢 FAZ 7.2: Multi-Channel Notification Altyapısı & Transactional Outbox Pattern Eğitici Raporu

> **Konu:** C# Clean Architecture, Multi-Channel Notification Dispatcher, Transactional Outbox Pattern & Background Outbox Worker  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Neden Bu Mimari Seçildi? (Production Derinlemesine Bakış)

Acil kriz yönetim sistemlerinde (Aura Crisis Network) deprem, sel veya yangın gibi kritik olaylar algılandığında binlerce operatör ve vatandaşa bildirim gönderilmesi gerekir.

* **Sorunsal:** HTTP API isteği içinde doğrudan e-posta veya push notification servisine (FCM, Twilio vb.) istek atmak, dış sunucu yavaşladığında veya çöktüğünde HTTP yanıtının gecikmesine veya veritabanı kaydı başarılı olsa bile bildirimin kaybolmasına yol açar.
* **Çözüm (Transactional Outbox Pattern):** Bildirim mesajı veritabanındaki ana işlemle aynı veritabanı transaction'ında `OutboxMessages` tablosuna yazılır. Arka planda çalışan `NotificationOutboxProcessorJob` (BackgroundService) bu mesajları güvenli şekilde çeker ve SignalR, E-Posta vb. kanallara dağıtır.

---

## 🏛️ 2. Katmanlar ve Oluşturulan Dosyaların Görevleri

### 📦 1. `Aura.Domain` Katmanı (İş Kuralları & Entity'ler)
- **`NotificationType.cs` & `NotificationChannelType.cs`:** Bildirim türlerini ve kanallarını belirten enum'lar.
- **`Notification.cs`:** Kullanıcıya atanan in-app bildirimin veritabanı karşılığı (`IsRead`, `ReadAt`, `PayloadJson`).
- **`OutboxMessage.cs`:** Outbox kuyruğundaki mesajın veritabanı karşılığı (`ProcessedAt`, `RetryCount`, `Error`).

### ⚙️ 2. `Aura.Application` Katmanı (Kullanım Senaryoları & Kontratlar)
- **`INotificationChannel.cs`:** Strateji Deseni (Strategy Pattern) için kanal kontratı.
- **`INotificationDispatcher.cs`:** Tüm kanalları tek noktadan koordine eden orkestratör kontratı.
- **`INotificationRepository.cs` & `IOutboxRepository.cs`:** Veri erişim kontratları.
- **`SendNotificationCommand.cs`:** Bildirimi ve Outbox mesajını aynı DbContext transaction'ında kaydeden CQRS komutu.
- **`GetUserNotificationsQuery.cs` & `MarkNotificationAsReadCommand.cs`:** Kullanıcı bildirim sorgusu ve okundu komutu.

### 🔌 3. `Aura.Infrastructure` Katmanı (Dış Dünya Entegrasyonları & Worker)
- **`OutboxMessageConfiguration.cs` & `NotificationConfiguration.cs`:** EF Core tablo ve indeks yapılandırmaları.
- **`SignalRNotificationChannel.cs` & `EmailNotificationChannel.cs`:** Somut bildirim kanalı uygulamaları.
- **`NotificationDispatcher.cs`:** `IEnumerable<INotificationChannel>` enjekte alarak bildirimi tüm kanallara asenkron ileten sınıf.
- **`NotificationOutboxProcessorJob.cs`:** Her 5 saniyede bir `OutboxMessages` tablosunu tarayıp iletimi sağlayan `BackgroundService`.

### 🌐 4. `Aura.WebApi` Katmanı (HTTP Uç Noktaları)
- **`NotificationsController.cs`:** `GET /api/v1/notifications`, `POST /api/v1/notifications` ve `PATCH /api/v1/notifications/{id}/read` REST API uç noktaları.

---

## ⚡ 3. Derleme ve Migration Doğrulaması

- **`dotnet build AuraCrisisNetwork.slnx`:** `0 Error(s), 2 Warning(s)` (**Başarıyla Derlendi**)
- **EF Core Migration:** `AddNotificationsAndOutbox` oluşturuldu.
