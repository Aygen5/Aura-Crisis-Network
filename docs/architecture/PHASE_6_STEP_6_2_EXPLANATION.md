# FAZ 6.2: Güvenlik ve RBAC Yetkilendirme Doğrulaması Mimari Öğretici Notları

> **Konu:** Role-Based Authorization Policies, Claim Verification & Security Infrastructure Validation  
> **Katman:** `Aura.WebApi`  
> **Bağımlılık Düzeyi:** `[Authorize(Roles = "...")]`, `[AllowAnonymous]`, JwtBearer Principal Verification  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **Role tabanlı Yetki Politikalarının Uygulanması (`RBAC Policies`):**
   - Halka açık olması gereken uç noktalar (`GET /api/v1/events`, `POST /api/v1/reports`) `[AllowAnonymous]` ile işaretlendi.
   - Sadece yetkili saha ekiplerinin ve yöneticilerin tetikleyebileceği kritik eylemler (`POST /api/v1/events/{id}/escalate`, `PATCH /api/v1/reports/{id}/status`) `[Authorize(Roles = "Operator,Admin")]` politikası ile korumaya alındı.

2. **Güvenlik Doğrulama Adımları (Security Verification Matrix):**
   - Kullanıcı Kaydı (`Register`): `Citizen` ve `Operator` rolleriyle kullanıcı oluşturma doğrulaması.
   - Giriş (`Login`): Doğru kullanıcıya 15 dakikalık JWT Access Token ve 7 günlük Refresh Token üretiminin doğrulanması.
   - Token Yenileme (`Refresh Token`): Süresi dolmak üzere olan token'ın Refresh Token rotasyonu ile güvenle yenilenmesi.
   - Yetkisiz Erişim Reddi (401/403): `Citizen` rolündeki kullanıcının `EscalateEvent` servisine attığı isteğin 403 Forbidden ile reddedildiğinin mimari garantisi.

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Yetki Politikalarının Kontrat Düzeyinde Ayrıştırılması
Halkın canlı haritadaki deprem verilerini görmesi veya ihbar bildirmesi engellenmemelidir (`AllowAnonymous`). Ancak kriz seviyesini yükseltmek veya bir ihbarı onaylayıp/reddetmek doğrudan operasyonel risk taşıdığı için `Operator` ve `Admin` yetkilerine kısıtlanmıştır (`[Authorize(Roles = "Operator,Admin")]`).

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
