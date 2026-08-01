# FAZ 1 - Adım 1.5: `Aura.Infrastructure` Katmanı Mimari Öğretici Notları

> **Konu:** EF Core PostGIS Persistence, DbContext, Configurations, Repositories ve EF Migrations  
> **Katman:** `Aura.Infrastructure`  
> **Bağımlılık Düzeyi:** `Aura.Application` ve `Aura.Domain` katmanlarına bağımlı (Sorumluluğu: Veritabanı Kalıcılığı)  

---

## 📚 1. Neler Yapıldı?

Bu adımda kriz yönetim platformunun veritabanı altyapısı ve kalıcılık (persistence) katmanı olan `Aura.Infrastructure` projesi inşa edildi:

1. **PostgreSQL & PostGIS NuGet Paketleri eklendi**:
   - `Npgsql.EntityFrameworkCore.PostgreSQL`: .NET 10 uyumlu EF Core PostgreSQL veritabanı sağlayıcısı.
   - `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`: PostGIS mekansal coğrafi veri tiplerini (`Point`, `SRID 4326`) .NET ortamına haritalayan paket.
   - `Microsoft.EntityFrameworkCore.Design`: EF Core migration komutlarının çalışması için araç paketi.

2. **`AuraDbContext` Kuruldu**:
   - `DbSet<Event>`, `DbSet<CitizenReport>`, `DbSet<DistrictRisk>`, `DbSet<Operator>` tanımlandı.
   - `OnModelCreating` üzerinde PostGIS eklentisi (`postgis`) aktifleştirildi.
   - Tüm `BaseEntity` türevleri için otomatik **Soft Delete Global Query Filter** (`e => !e.IsDeleted`) uygulandı.
   - `SaveChangesAsync` metodu override edilerek güncellenen varlıklarda `UpdatedAt` otomatik güncellendi ve silinen varlıklarda `SoftDelete()` mantıksal silme tetiklendi.

3. **Fluent API Entity Configurations Yazıldı**:
   - `EventConfiguration`, `CitizenReportConfiguration`: `GeoPoint` nesnesini NetTopologySuite `Point(longitude, latitude) { SRID = 4326 }` PostGIS tipine çift yönlü dönüştürdü ve PostGIS **GIST mekansal indeksleri** (`HasMethod("GIST")`) eklendi. Enum'lar string olarak eşlendi.
   - `DistrictRiskConfiguration`, `OperatorConfiguration`: Benzersiz indeksler (`BadgeNumber`, `Email`, `DistrictName`) tanımlandı.

4. **Repository & Unit of Work Implementasyonları**:
   - `EventRepository`, `CitizenReportRepository`, `DistrictRiskRepository`, `OperatorRepository` ve `UnitOfWork` sınıfları `Aura.Application` katmanında tanımlanan arayüzleri EF Core ve PostGIS kullanarak implemente etti.

5. **EF Core Migration Üretildi**:
   - `InitialPostGisMigration` oluşturuldu ve `Migrations/` klasörüne eklendi.

6. **Bağımlılık Enjeksiyonu (`DependencyInjection.cs`)**:
   - `AddInfrastructure` extension metodu ile `AuraDbContext`, Npgsql PostGIS desteği ve repository'ler DI konteynerine kaydedildi.

---

## 🎯 2. Mimari Kararlar ve Teknik Gerekçeleri

### A. PostGIS & NetTopologySuite Eşlemesi (GIST Index)
* **Mimari Karar:** `GeoPoint` Value Object'i veritabanında düz `double latitude, double longitude` iki ayrı kolon olarak değil, PostgreSQL PostGIS `geometry(Point, 4326)` veri tipi olarak saklandı.
* **Teknik Gerekçe:** Kriz anında yüz binlerce afet veya ihbar verisi arasından belirli bir ilçe veya yarıçap (`ST_DWithin`) içerisindeki olayları milisaniyeler seviyesinde sorgulayabilmek için PostGIS `GIST` mekansal indeksleme şarttır.

### B. Global Query Filter ile Soft Delete Güvencesi
* **Mimari Karar:** `OnModelCreating` içerisinde `typeof(BaseEntity).IsAssignableFrom(entityType.ClrType)` kontrolü ile tüm sorgulara otomatik `WHERE is_deleted = false` filtresi eklendi.
* **Teknik Gerekçe:** Yazılımcının herhangi bir LINQ sorgusunda `IsDeleted == false` yazmayı unutması sonucu silinmiş verilerin kriz ekranına sızmasını kesin olarak engellemek.

### C. Automatic Audit Interception (`SaveChangesAsync`)
* **Mimari Karar:** `SaveChangesAsync` içerisinde `ChangeTracker` dinlenerek `Modified` durumundaki varlıkların `UpdatedAt` zaman damgası merkezi olarak güncellendi, `Deleted` durumundaki varlıklar ise `SoftDelete()` metoduna yönlendirildi.
* **Teknik Gerekçe:** Denetim (audit) izlerinin insani hatalardan bağımsız olarak veritabanı seviyesinde %100 doğrulukla tutulmasını sağlamak.

---

## 🏛️ 3. Infrastructure Katmanının Sistem İçerisindeki Görevi

Clean Architecture yapısında `Aura.Infrastructure` katmanı bir **Altyapı ve Detay (Implementation)** katmanıdır.
- **Sorumluluğu:** `Aura.Application` tarafından tanımlanan arayüzleri (`IEventRepository`, `IUnitOfWork`) veritabanı teknolojisine (PostgreSQL / EF Core) bağlamak.
- **Sınırı:** İş kuralları koymaz, Domain mantığını değiştirmez. Sadece verinin saklanması ve çekilmesi sorumluluğunu üstlenir.

---

## 🔄 4. Bir Sonraki Katman (`Aura.WebApi`) Bunu Nasıl Kullanacak?

Bir sonraki adımda yazılacak olan **`Aura.WebApi`** katmanı:
1. `Program.cs` içerisinde `builder.Services.AddInfrastructure(builder.Configuration)` çağrısı yaparak PostgreSQL veritabanını ve repository'leri IoC konteynerine kaydocaktır.
2. HTTP Controller'ları veya MediatR Handlers, kendilerine enjekte edilen `IEventRepository` veya `IUnitOfWork` üzerinden veritabanına erişecek; arkaplanda EF Core ve PostGIS'in çalıştığından habersiz kalacaktır.
3. Uygulama başlatılırken `dbContext.Database.MigrateAsync()` çağrısı ile PostgreSQL Docker konteynerine migration'ları otomatik uygulayacaktır.

---
*Bu doküman mimari kararları ve katman sorumluluklarını anlamak amacıyla hazırlanmış eğitim notudur.*
