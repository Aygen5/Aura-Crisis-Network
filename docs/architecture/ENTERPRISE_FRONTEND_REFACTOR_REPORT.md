# 🏛️ Enterprise Frontend Architecture Refactor Report
**Aura Crisis Network — Professional React Architecture Transformation**

> **Konu:** Proje Klasör Taşınması (`/frontend`), Modüler Servis Katmanı, Tip Kütüphanesi, Konfigürasyon Dosyaları & TanStack Query Provider Yapılandırması  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari referansı için tutulmaktadır.  

---

## 1. 📂 Yapılan Klasör Taşımaları ve Nedenleri

| Eski Konum | Yeni Konum | Mimari Neden & Avantajlar |
| :--- | :--- | :--- |
| `c:/Projects/Aura-Crisis-Network-main/src/` | `c:/Projects/Aura-Crisis-Network-main/frontend/src/` | Frontend ve Backend tamamen ayrıştırıldı (Clean Separation of Concerns). CI/CD ve Docker build bağımsızlığı sağlandı. |
| `c:/Projects/Aura-Crisis-Network-main/package.json` | `c:/Projects/Aura-Crisis-Network-main/frontend/package.json` | Node bağımlılıkları sadece frontend klasöründe izole edildi. |
| `c:/Projects/Aura-Crisis-Network-main/vite.config.ts` | `c:/Projects/Aura-Crisis-Network-main/frontend/vite.config.ts` | Vite derleme konfigürasyonu frontend seviyesinde tutulmaktadır. |

---

## 2. 🧱 Yeni Oluşturulan Modüler Klasörler

1. **`frontend/src/types/` (Centralized TypeScript Types Library):**
   - `auth.types.ts`, `event.types.ts`, `report.types.ts`, `risk.types.ts`, `analytics.types.ts`, `common.types.ts`.
   - **Gerekçe:** REST DTO'ları ve domain arabirimleri monolithic `api-client.ts` içerisinden çıkarılarak tip güvenli merkezi kütüphaneye taşındı.

2. **`frontend/src/config/` (Centralized App Configuration):**
   - `api.config.ts`, `routes.config.ts`, `map.config.ts`, `permissions.config.ts`.
   - **Gerekçe:** Kod içerisindeki URL'ler, rota metinleri ve harita koordinat sabitleri merkezi konfigürasyonda toplandı.

3. **`frontend/src/services/` (Modular Domain Services):**
   - `auth.service.ts`, `events.service.ts`, `reports.service.ts`, `risk.service.ts`, `analytics.service.ts`.
   - **Gerekçe:** Tek bir `api-client.ts` dosyası yerine her domain nesnesi için Single Responsibility prensibine uygun servis sınıfları oluşturuldu.

4. **`frontend/src/lib/http-client.ts` (Core HTTP Engine):**
   - **Gerekçe:** Sadece `fetch` wrapper'ını, JWT Bearer Token inject işlemlerini ve HTTP hata yönetimini barındıran temel HTTP istemcisi.

5. **`frontend/src/providers/` (Centralized React Providers):**
   - `AuthProvider.tsx`, `SignalRProvider.tsx`, `QueryProvider.tsx`.
   - **Gerekçe:** Global oturum, WebSocket bağlantısı ve TanStack Query mantığı uygulama seviyesinde sarmalandı.

6. **`frontend/src/queries/` (TanStack Query Custom Hooks):**
   - `useEventsQuery.ts`, `useReportsQuery.ts`, `useAnalyticsQuery.ts`, `useRiskQuery.ts`.
   - **Gerekçe:** API verilerinin önbelleklenmesi (caching), stale-while-revalidate ve otomatik refetch altyapısı kuruldu.

7. **`frontend/src/constants/` & `frontend/src/utils/`:**
   - `roles.ts`, `disaster-meta.ts`, `formatters.ts`.
   - **Gerekçe:** Tekrarlanan utility ve sabit değerler merkezi hale getirildi.

---

## ⚡ 3. Derleme & Doğrulama Sonuçları

* **`cd frontend && npm install`:** `added 434 packages in 17s` (**0 Vulnerabilities**)
* **`cd frontend && npm run build`:** `Built successfully in 413ms / 543ms. 0 Error(s)`
* **Git Status & Push:** `121 files changed, 628 insertions(+), 246 deletions(-)`
* **Remote State:** `To https://github.com/Aygen5/Aura-Crisis-Network.git (main -> main)`
