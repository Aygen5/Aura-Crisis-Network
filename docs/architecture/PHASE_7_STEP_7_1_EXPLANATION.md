# FAZ 7 - Adım 7.1: Fotoğraf / Video Medya Yükleme Servisi Mimari Öğretici Notları

> **Konu:** Media & Attachment Storage Architecture, Magic Byte Verification, Interface Segregation & Cloud Migration Strategy  
> **Katman:** `Aura.Domain`, `Aura.Application`, `Aura.Infrastructure`, `Aura.WebApi`  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Katman Katman Yapılanlar ve Sorumluluklar

### A. `Aura.Domain` (Çekirdek Varlıklar)
- `ReportAttachment.cs`: İhbar medyasını temsil eden nesne (`Id`, `CitizenReportId`, `FileName`, `FileUrl`, `ContentType`, `FileSizeBytes`, `UploadedAt`).
- `CitizenReport.cs`: İhbar nesnesine `Attachments` koleksiyonu ve `AddAttachment` kapsülleme metodu eklendi.

### B. `Aura.Application` (Soyut Kontratlar & CQRS)
- `IFileStorageService.cs`: `SaveFileAsync` ve `DeleteFileAsync` metodlarını tanımlar. Storage sağlayıcısının yerel disk mi yoksa AWS S3 mü olduğunu bilmez.
- `ReportAttachmentDto.cs`: Medya verilerini istemciye sunan veri transfer nesnesi.
- `UploadReportAttachmentCommand.cs`: Medya yükleme iş mantığını ve MediatR Handler mekanizmasını yönetir.

### C. `Aura.Infrastructure` (Somut Servis & Veritabanı)
- `LocalFileStorageService.cs`: `IFileStorageService` arayüzünün yerel disk (`wwwroot/uploads/reports/{year}/{month}/`) uyarlaması.
- `ReportAttachmentConfiguration.cs`: EF Core ilişkisel veritabanı eşlemesi (Cascade Delete).
- `AuraDbContext.cs`: `ReportAttachments` `DbSet` tanımı.

### D. `Aura.WebApi` (HTTP REST Uç Noktası)
- `CitizenReportsController.cs`: `POST /api/v1/reports/{id}/attachments` uç noktası.
- `Program.cs`: `app.UseStaticFiles()` ile yüklenen medyalara HTTP üzerinden erişim imkanı.
