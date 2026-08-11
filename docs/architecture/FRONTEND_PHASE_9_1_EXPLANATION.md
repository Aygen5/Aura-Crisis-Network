# ⚡ FRONTEND PHASE 9.1: TanStack Query Cache Strategy & Redis Integration Raporu

> **Konu:** Centralized `QUERY_KEYS` & `QUERY_CACHE_TTL`, Optimistic Updates with Rollback (`useDispatchUnit`), Selective SignalR Cache Invalidation & Backend Redis Sync  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Modüller ve Entegrasyon Özeti

1. **`frontend/src/constants/query-keys.ts` & `index.ts`:**
   - Backend Redis önbellek anahtarları ve TTL süreleri ile birebir eşleşen merkezi `QUERY_KEYS` ve `QUERY_CACHE_TTL` yapısı kuruldu:
     - `EVENTS_ACTIVE`: `120000` (2 dk, backend `events:active` ile senkron)
     - `ANALYTICS_SUMMARY`: `300000` (5 dk, backend `analytics:summary` ile senkron)
     - `EMERGENCY_UNITS_ALL`: `15000` (15 sn, backend `emergency-units:all` ile senkron)
     - `RISK_ZONES`: `1800000` (30 dk)
     - `GIS_CLUSTERS`: `30000` (30 sn)

2. **Optimistic Update & Automatic Rollback (`useEmergencyUnitsQuery.ts`):**
   - `useDispatchUnit()` mutasyonunda `onMutate` ile kullanıcı araç atama butonuna tıkladığı an UI sunucuyu beklemeden `Status = Dispatched` ve `AssignedEventId` güncellenir.
   - Ağ hatası veya sunucu istisnası durumunda `onError` mekanizması devreye girerek önbelleği eski durumuna (`previousUnits`) otomatik geri sarar (Rollback).

3. **Hedeflenmiş SignalR Invalidation (`SignalRProvider.tsx`):**
   - Canlı WebSocket duyuruları geldiğinde tüm sayfayı yeniden çekmek (Full Refetch) yerine yalnızca `QUERY_KEYS.events.active()`, `QUERY_KEYS.analytics.summary()` ve `QUERY_KEYS.emergencyUnits.all` önbellekleri hedeflenerek silinir.
   - Araç GPS telemetri akışında (`VehiclePositionUpdated`) frontend tüm listeyi sıfırdan çekmez, gelen pozisyonu `queryClient.setQueryData` ile mevcut önbellek dizisine anında enjekte eder.

---

## ⚡ 2. Derleme ve Test Sonuçları

- **`cd frontend && npm run build`:** `Built successfully in 466ms / 556ms. 0 Error(s)`
