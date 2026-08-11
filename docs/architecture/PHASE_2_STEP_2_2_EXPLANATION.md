# FAZ 2 - Adım 2.2: Canlı Hava Durumu ve Meteoroloji Risk Servisi Mimari Öğretici Notları

> **Konu:** Live Weather Risk Ingestion, Open-Meteo Integration & District Risk Background Worker  
> **Katman:** `Aura.Infrastructure`  
> **Bağımlılık Düzeyi:** `Aura.Application` (`IMeteorologyService`, `IDistrictRiskRepository`) ve `Aura.Domain` (`DistrictRisk`)  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **`MeteorologyService` (`Infrastructure/Services/`)**:
   - Türkiye genelindeki kilit ilçelerin (İstanbul, Ankara, İzmir, Bursa, Antalya vb.) canlı meteorolojik yağış ve rüzgar verilerini Open-Meteo canlı API'sinden çeken servis yazıldı.
   - Anlık milimetre cinsinden yağış verisinden `FloodRisk` (Sel riski) ve `LandslideRisk` (Heyelan riski), rüzgar hızından ise `WildfireRisk` (Yangın riski) skorları (0-100) dinamik hesaplandı.
   - `DistrictRisk` domain varlığının `UpdateRiskScores(...)` metodu tetiklenerek veritabanında saklandı.
   - Kod standartlarımız uyarınca **hiçbir yorum satırı (`//`, `/* */`) eklenmemiştir.**

2. **`MeteorologyBackgroundWorker` (`Infrastructure/BackgroundJobs/`)**:
   - .NET `BackgroundService` tabanlı periyodik arka plan işçisi eklendi (30 dakikada bir çalışır).
   - Arka planda `IServiceScope` oluşturarak ilçe risk puanlarını günceller.

3. **IoC Konfigürasyonu (`DependencyInjection.cs`)**:
   - `services.AddHttpClient<IMeteorologyService, MeteorologyService>();` ve `services.AddHostedService<MeteorologyBackgroundWorker>();` DI kayıtları yapıldı.

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Dinamik Yağış/Rüzgar Risk Skorlaması
Sel, yangın ve heyelan riskleri sabit (static) sayılar olarak veritabanında tutulamaz. Canlı hava koşullarında aşırı yağış başladığında sel ve heyelan riski otomatik yükselmeli; şiddetli rüzgarlarda yangın yayılım riski artmalıdır.

### B. Bağımsız Background Service Mimarisi
Single Responsibility prensibi uyarınca Deprem Ingestion servisi ile Meteoroloji Risk servisi iki ayrı `BackgroundService` olarak çalışır. Meteoroloji API'sindeki olası aksaklıklar deprem servisini veya genel sistemi etkilemez.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
