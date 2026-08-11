# 🛡️ FAZ 9.2: EF Core Audit Logging Interceptor & Gelişmiş Audit Trail Raporu

> **Konu:** Correlation ID & Request ID Traceability, User-Agent & IP Extraction, Soft Delete & Restored Event Detection, Sensitive Property Masking & Differential JSON  
> **Gizlilik Notu:** Bu doküman `.gitignore` korumalıdır ve yerel mimari öğrenim referansı için tutulmaktadır.  

---

## 1. 🟢 Neden Bu Ek Geliştirmeler Yapıldı?

Kurumsal kriz yönetim platformlarında basit bir audit kaydı yetersizdir. Olayların Serilog / OpenTelemetry loglarıyla uçtan uca eşleştirilmesi ve istemci cihazı bilgisinin tutulması gerekir:

1. **Correlation ID & Request ID İzlenebilirliği:**
   - Her denetim kaydında HTTP isteğinden çekilen `X-Correlation-ID` ve `TraceIdentifier` saklanır. Bu sayede Serilog ve Grafana loglarındaki bir hata kaydı ile veritabanında oluşan audit kaydı saniyeler içinde eşleştirilir.
2. **User-Agent Metadata:**
   - İşlemin hangi tarayıcıdan (`Chrome`, `Edge`, `Firefox`), mobil cihazdan veya arka plan API istemcisinden yapıldığı `UserAgent` alanında tutulur.
3. **SoftDelete & Restored Olay Algılama:**
   - Entity üzerinde `IsDeleted` alanı `false` -> `true` değiştiğinde Eylem `SoftDeleted`, `true` -> `false` değiştiğinde ise Eylem `Restored` olarak işaretlenir.

---

## 🔬 2. Gelişmiş Audit Kaydı JSON Örneği

```json
{
  "id": "e4f8b91a-7c2d-4e9f-8a1b-3c5d7e9f0a2b",
  "userId": "9fe27331-8b98-4620-b063-0263bce40a26",
  "userEmail": "operator.afad@aura.gov.tr",
  "ipAddress": "195.175.24.12",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "correlationId": "corr-8f92a1bc-34de",
  "requestId": "0HN123456789A:00000001",
  "entityName": "CitizenReport",
  "action": "SoftDeleted",
  "entityId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "oldValues": "{\"IsDeleted\": false, \"DeletedAt\": null}",
  "newValues": "{\"IsDeleted\": true, \"DeletedAt\": \"2026-08-06T14:38:00Z\"}",
  "changedColumns": "[\"IsDeleted\", \"DeletedAt\"]",
  "createdAt": "2026-08-06T14:38:00.124Z"
}
```

---

## ⚡ 3. Derleme ve Migration Sonuçları

- **`dotnet build AuraCrisisNetwork.slnx`:** `0 Error(s), 2 Warning(s)` (**Başarıyla Derlendi**)
- **EF Core Migration:** `AddAuditLogMetadataFields` fırlatıldı.
