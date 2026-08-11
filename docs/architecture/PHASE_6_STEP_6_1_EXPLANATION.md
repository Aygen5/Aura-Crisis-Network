# FAZ 6 - Adım 6.1: ASP.NET Core Identity & JWT Authentication Mimari Öğretici Notları

> **Konu:** Identity Management, JWT Access Token & Refresh Token Rotation Architecture  
> **Katman:** `Aura.Infrastructure`, `Aura.Application`, `Aura.WebApi`  
> **Bağımlılık Düzeyi:** ASP.NET Core Identity (`ApplicationUser`, `ApplicationRole`), JWT Bearer Middleware  
> **Gizlilik Notu:** Bu doküman `.gitignore` ile yerel ortamda gizlenmiş olup GitHub deposuna push edilmez.  

---

## 📚 1. Neler Yapıldı?

1. **Interface Tabanlı Ayrıştırma (`Aura.Application`):**
   - `IIdentityService`, `ITokenProvider` ve `ICurrentUserService` interface'leri oluşturuldu.
   - `AuthResponseDto`, `RegisterUserCommand`, `LoginUserCommand` ve `RefreshTokenCommand` yazıldı.

2. **ASP.NET Core Identity & JWT Altyapısı (`Aura.Infrastructure`):**
   - `ApplicationUser` (`IdentityUser<Guid>`), `ApplicationRole` (`IdentityRole<Guid>`) ve `RefreshToken` varlıkları yazıldı.
   - `AuraDbContext` sınıfı `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>` sınıfından türetildi.
   - `JwtTokenProvider` servisi ile 15 dakikalık Access Token ve 7 günlük güvenli Refresh Token üretim mantığı kuruldu.
   - `IdentityService` ile kullanıcı kaydı, şifre doğrulaması ve Refresh Token rotasyon mekanizması (Token Rotation) kodlandı.
   - EF Core Migration `AddIdentityAndRefreshTokens` başarıyla üretildi.

3. **REST Auth API Endpoints (`Aura.WebApi`):**
   - `AuthController` (`/api/v1/auth`) altında `POST /register`, `POST /login` ve `POST /refresh-token` uç noktaları sunuldu.
   - `Program.cs` içerisinde JwtBearer Authentication ve Authorization middleware hattı kuruldu.
   - Kod standartlarımız uyarınca **hiçbir yorum satırı (`//`, `/* */`) eklenmemiştir.**

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. Identity Neden Yalnızca Infrastructure Katmanında?
Domain ve Application katmanları `Microsoft.AspNetCore.Identity` NuGet paketine **bağımlı olmamalıdır**. Bu kural Clean Architecture ve Dependency Inversion (DIP) ilkelerinin gereğidir. Application katmanı yalnızca `IIdentityService` interface'ini bilir.

### B. Neden JWT (JSON Web Token)?
Stateless (durumsuz) yapısı sayesinde sunucu tarafında HTTP Session belleği tutulmasını engeller. Dağıtık mimarilerde (Microservices / Docker Cluster) yatay ölçeklemeyi (Horizontal Scaling) kolaylaştırır.

### C. Neden Refresh Token ve Token Rotation?
- **Güvenlik Sınırı:** Access Token ömrü kısa tutularak (15 dakika) çalınma riskine karşı etki alanı kısıtlanır.
- **Kesintisiz Deneyim:** Kullanıcının 15 dakikada bir tekrar şifre girmesini önlemek için Refresh Token (7 gün) kullanılır.
- **Token Rotation:** Her `refresh-token` çağrısında eski Refresh Token veritabanında iptal edilir (`IsRevoked = true`) ve yerine yeni bir Refresh Token üretilir. Bu sayede bir Refresh Token ele geçirilirse replay saldırısı anında tespit edilip engellenir.

---

## 🔄 3. Request Lifecycle & Login İç Mimarisi

1. **İstek Kabulü:** İstemci `POST /api/v1/auth/login` uç noktasına e-posta ve şifre gönderir.
2. **MediatR Dispatch:** Controller isteği `LoginUserCommand` komutuna dönüştürüp `IMediator` hattına basar.
3. **Identity Verification:** `LoginUserCommandHandler`, `IIdentityService.LoginAsync` servisini çağırır. `UserManager` veritabanından kullanıcıyı bulur ve `CheckPasswordAsync` ile PBKDF2 hash doğrulaması yapar.
4. **Token Generation:** Doğrulama başarılıysa `JwtTokenProvider`, kullanıcının rollerini ve Claim'lerini barındıran HMAC-SHA256 imzalı JWT Access Token'ı ve güvenli rastgele Refresh Token'ı üretir.
5. **Database Persist:** Refresh Token `RefreshTokens` tablosuna kaydedilir.
6. **HTTP Response:** İstemciye `AuthResponseDto` nesnesi 200 OK yanıtı ile döner.
