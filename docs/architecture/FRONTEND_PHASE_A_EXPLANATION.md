# FRONTEND PHASE A: Medya Yükleme, İhbar Oluşturma & Galeri Mimari Öğretici Notları

> **Konu:** React Media Upload Architecture, Drag & Drop FileZone, Lightbox Media Preview, Toast Engine & Backend Synchronization  
> **Bileşenler:** `FileUploadZone.tsx`, `CreateReportModal.tsx`, `ReportDetailModal.tsx`, `AttachmentGallery.tsx`  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Katman Katman Bileşen Sorumlulukları

1. **`FileUploadZone.tsx` (Reusable Upload Component):**
   - Sürükle-Bırak (Drag & Drop) ve dosya seçici alanı.
   - İstemci tarafında MIME doğrulama (`.jpg`, `.png`, `.webp`, `.mp4`, `.mp3`, `.pdf`) ve 50 MB dosya boyutu sınırı denetimi.

2. **`AttachmentGallery.tsx` (Reusable Media Previewer):**
   - Medya türüne göre akıllı kartlar çizer (Fotoğraf önizleme, Video ikonu, Belge indirme).
   - Tıklanan fotoğraflar için tam ekran Lightbox önizleme, videolar için HTML5 video oynatıcı sunar.

3. **`CreateReportModal.tsx` (Incident Reporting Feature Modal):**
   - İhbar başlığı, afet türü, ilçe, koordinat, açıklama ve medya yükleme alanını kapsüller.
   - Önce `createCitizenReport` ile ihbarı oluşturur, ardından her medya için `uploadReportAttachment` çağrısı atarak backend'deki FAZ 7.1 servislerini tetikler.

4. **`ReportDetailModal.tsx` (Incident Inspection & Triage Modal):**
   - İhbar detayını, bildiren iletişim bilgilerini ve ekli medya galerisini gösterir.
   - Nöbetçi operatör için `Verify` / `Reject` eylem butonlarını barındırır.
   - Var olan ihbara ek dosya yükleme imkanı sağlar.

---

## 🔄 2. Medya Yükleme & İhbar Akışı (Request Lifecycle)

1. Kullanıcı `CreateReportModal` açar, form verilerini doldurur ve fotoğraflarını seçer.
2. Form gönderildiğinde önce `POST /api/v1/reports` ile ihbar oluşturulur ve benzersiz `report.id` alınır.
3. Seçilen her dosya için sırayla `POST /api/v1/reports/{id}/attachments` uç noktasına `multipart/form-data` isteği atılır.
4. Backend `LocalFileStorageService` dosyanın Magic Byte başlığını kontrol eder, diske yazar ve DB'ye ekler.
5. Frontend tarafında `sonner` ile başarı Toast bildirimi gösterilir ve liste otomatik yenilenir.
