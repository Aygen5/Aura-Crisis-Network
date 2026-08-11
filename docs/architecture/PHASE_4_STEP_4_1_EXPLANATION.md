# FAZ 4 - Adım 4.1: React Frontend API Client & SignalR WebSocket Entegrasyonu Mimari Öğretici Notları

> **Konu:** Live REST API Client, SignalR WebSocket Push Integration & Zero Mock Data Architecture  
> **Katman:** Frontend (`React`, `TanStack Router`, `@microsoft/signalr`) & Backend Integration (`Aura.WebApi`)  
> **Bağımlılık Düzeyi:** `Aura.WebApi` REST Endpoints (`/api/v1/...`) ve SignalR CrisisHub (`/hubs/crisis`)  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **`@microsoft/signalr` Paketi Eklendi:**
   - Frontend projesine `@microsoft/signalr` npm paketi kurularak .NET 10 SignalR Hub ile gerçek zamanlı çift yönlü WebSocket iletişimi sağlandı.

2. **Sahte Veri (`aura-data.ts`) Tamamen Temizlendi:**
   - Statik veriler içeren `src/lib/aura-data.ts` dosyası projeden tamamen silindi.
   - `MapCanvas.tsx`, `AppShell.tsx`, `index.tsx`, `reports.tsx`, `risk.tsx`, `analytics.tsx`, `event.$id.tsx` ve `DisasterIcon.tsx` dosyalarındaki tüm sahte veri bağımlılıkları temizlendi.

3. **Tip Güvenli API İstemcisi (`src/lib/api-client.ts`):**
   - Backend `EventDto`, `CitizenReportDto`, `DistrictRiskDto` ve `AnalyticsSummaryDto` kontratlarıyla birebir aynı olan TypeScript arayüzleri yazıldı.
   - `fetchActiveEvents`, `fetchEventsByBoundingBox`, `fetchEventById`, `escalateEvent`, `fetchReportsByStatus`, `createCitizenReport`, `updateReportStatus`, `fetchRiskAnalysis` ve `fetchAnalyticsSummary` fonksiyonları tanımlandı.

4. **SignalR Dinleyici İstemcisi (`src/lib/signalr-client.ts`):**
   - `http://localhost:5000/hubs/crisis` bağlantısını yöneten `HubConnectionBuilder` istemcisi yazıldı.
   - Kandilli'den yeni deprem verisi düştüğünde veya ihbar durumu değiştiğinde `ReceiveEventCreated` ve `ReceiveReportStatusChanged` sinyallerini dinleyen callback metodları oluşturuldu.

5. **React Bileşenlerinin Canlı Veriye Bağlanması:**
   - Komuta Merkezi (`index.tsx`): Sayfa açıldığında canlı olayları ve analitik özetini çeker, SignalR uyarısı geldiğinde haritadaki pinleri ve canlı bildirim panelini anında günceller.
   - İhbar Yönetimi (`reports.tsx`): Bekleyen ihbarları canlı çeker; operatör "Onayla" veya "Reddet" butonuna bastığında backend `PATCH /api/v1/reports/{id}/status` servisini çağırır.
   - Risk Analizi (`risk.tsx`): PostgreSQL veritabanımızdaki ilçe bazlı sismik, sel ve yangın skorlarını gösterir.
   - Afet Detayı (`event.$id.tsx`): `fetchEventById` ile canlı detay çeker ve "Seviyeyi Yükselt (Escalate)" butonu canlı backend komutunu tetikler.

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Mock Data'dan Gerçek API'ye Geçiş Neden Zorunluydu?
Sıfır Sahte Veri ilkesi uyarınca, gerçek bir afet kriz yönetim platformunun mock verilerle test edilmesi veya sunulması kabul edilemez. Frontend'in PostgreSQL/PostGIS veritabanındaki 100% gerçek Kandilli ve Meteoroloji verileriyle çalışması kriz anında güvenilirlik sağlar.

### B. REST API + SignalR WebSocket Hibrit Mimarisi
- **REST API (`api-client.ts`):** İlk sayfa yüklendiğinde mevcut olayların ve istatistiklerin çekilmesi (Initial State Loading) için kullanıldı.
- **SignalR WebSocket (`signalr-client.ts`):** Sayfa açıkken arka planda 60 saniyede bir Kandilli'den yeni deprem düştüğünde istemcinin tekrar polling yapmasına gerek kalmadan canlı push bildirimi alması için kullanıldı.

### C. Clean Architecture Uyumu
Frontend katmanı, backend katmanından tamamen bağımsız bir sunum katmanıdır. Backend'in DTO sözleşmeleriyle tam uyumlu çalışan tip tanımları sayesinde katmanlar arası bağımlılık ihlali engellenmiş ve sürdürülebilirlik üst seviyeye çıkarılmıştır.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
