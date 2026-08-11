# ⚡ FAZ 9.1: MediatR Caching Pipeline Behavior & Redis Raporu

> **Konu:** MediatR Pipeline `CachingBehavior` & `CacheInvalidationBehavior`, Cache Stampede Protection (`SemaphoreSlim`), Centralized Naming Convention, Dynamic TTL & Redis/Memory Fallback  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Neden Bu Mimari Seçildi?

Büyük ölçekli kriz ve afet sistemlerinde (10.000+ ihbar ve canlı komuta ekranı) en kritik gereksinim, Handler kodlarını kirletmeden veritabanı yükünü düşürmektir:

1. **Clean Architecture & CQRS Uyumu (Handler Bağımsızlığı):**
   - Önbellek mantığı (Redis oku/yaz/sil) CQRS sorgu ve komut işleyicilerinin (`QueryHandler` / `CommandHandler`) içine yazılmaz.
   - Sorgular yalnızca `ICacheableRequest` arayüzünü, komutlar ise `IInvalidatesCache` arayüzünü uygular. MediatR pipeline şeffaf bir ara katman olarak önbellekleme yapar.

2. **Cache Stampede Önleme (`SemaphoreSlim` Kilitleme):**
   - Aynı anda 100 eşzamanlı istek aynı önbellek anahtarında (`events:active`) cache miss yaşadığında veritabanının kilitlenmesini önlemek için anahtar bazlı `SemaphoreSlim` kilitleme uygulanmıştır.
   - Sadece ilk 1 istek veritabanına gider, kalan 99 istek kilit açılana kadar bekler ve oluşan önbelleği okur.

---

## 🏛️ 2. MediatR Pipeline İcra Sırası (Execution Order)

```
 İSTEK AKIŞI (Request Lifecycle):
 1. MediatR Send(request)
       │
       ▼
 2. LoggingBehavior (Tüm istekleri yapılandırılmış loglar)
       │
       ▼
 3. ValidationBehavior (FluentValidation kurallarını denetler)
       │
       ▼
 4. CachingBehavior (ICacheableRequest kontrolü, Redis/Memory oku/yaz + Stampede Lock)
       │
       ▼
 5. QueryHandler / CommandHandler (Veritabanı / PostGIS İşlemi)
       │
       ▼
 6. CacheInvalidationBehavior (IInvalidatesCache kontrolü, bayatlayan anahtarları siler)
```

---

## 🔑 3. Merkezi Naming Convention & Dinamik TTL Tablosu

| Sorgu / Komut | Önbellek Anahtarı (Cache Key) | Süre (TTL) | Gerekçe |
| :--- | :--- | :--- | :--- |
| `GetActiveEventsQuery` | `events:active` | 2 Dakika | Canlı afet listesi sık değişir, 2 dk TTL uygundur. |
| `GetAnalyticsSummaryQuery` | `analytics:summary` | 5 Dakika | Özet istatistikler 5 dk önbelleklenebilir. |
| `GetAllEmergencyUnitsQuery` | `emergency-units:all` | 15 Saniye | Saha araçları hareket halindedir, kısa TTL verilir. |
| `DispatchUnitCommand` | *Invalidates:* `events:active`, `emergency-units:all` | Instant Invalidation | Ekip görevlendirildiğinde önbellekler anında silinir. |

---

## ⚡ 4. Derleme Sonuçları

- **`dotnet build AuraCrisisNetwork.slnx`:** `0 Error(s), 2 Warning(s)` (**Başarıyla Derlendi**)
