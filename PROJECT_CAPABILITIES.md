# Aura Crisis Network — Sistem Yetenekleri, Kullanım Senaryoları ve Gelecek Vizyonu Raporu

> **Tarih:** 31 Temmuz 2026  
> **Proje:** Aura Crisis Network (Emergency Response & Crisis Command Center)  
> **Kapsam:** Tasarım, Mimari ve Kod Analizine Göre Şu An Yapılabilenler ve Tamamlandığında Yapılabilecekler  

---

## 🧭 Executive Summary (Özet)

**Aura Crisis Network**, afete müdahale merkezleri (AFAD, 112 Acil, İtfaiye, Emniyet, Belediyeler ve Kızılay) için tasarlanmış **Gerçek Zamanlı Kriz Yönetimi, Erken Uyarı ve Saha Koordinasyon Platformudur**.

Bu doküman, projenin mevcut ön yüz kodları ([src/routes](file:///c:/Projects/Aura-Crisis-Network-main/src/routes), [src/components/aura](file:///c:/Projects/Aura-Crisis-Network-main/src/components/aura), [src/lib/aura-data.ts](file:///c:/Projects/Aura-Crisis-Network-main/src/lib/aura-data.ts)) ve mimarisine dayanarak:
1. **Şu an prototip üzerinde nelerin test edilebildiğini**,
2. **Backend ve canlı veri akışları eklendiğinde projenin neleri başaracağını**,
3. **Gerçek bir kriz anında uygulamanın uçtan uca nasıl çalışacağını** detaylıca açıklamaktadır.

---

## 📑 BÖLÜM 1: Projenin Şu Anki Haliyle Yapılabilenler (Mevcut Frontend Prototipleri)

Mevcut kod altyapısı incelendiğinde, uygulamanın kullanıcıya sunduğu tüm görselleştirme, etkileşim ve arayüz yetenekleri şunlardır:

```
                                  [ AURA CRISMIT COMMAND CENTER ]
                                                 │
 ┌──────────────────────┬────────────────────────┼────────────────────────┬──────────────────────┐
 ▼                      ▼                        ▼                        ▼                      ▼
[Komuta Merkezi]   [Olay Detayı]          [Rapor Merkezi]         [Risk Analizi]         [Analytics]
 - İnteraktif Harita - Etki Yarıçapı       - İhbar Tablosu         - Sismik Skor          - Afet Dağılımı
 - Canlı Akış        - Saha Ekipleri       - Sekmeli Triage        - Hava Tahmini         - 24 İlçe Grid
 - Replay Oynatıcı   - Kronolojik Akış     - Arama & Filtre        - Heyelan Tahmini      - Müdahale Süresi
 - Katman Kontrolü   - Eskalasyon Butonu   - CSV Aktarımı          - Sel Tahmini          - Zaman Trendi
```

### 1. Komuta Merkezi (`/` - `index.tsx`) Üzerinde Yapılabilenler
* **Canlı Afet Haritası Etkileşimi:** Türkiye ve Marmara bölgesini kapsayan özel vektörel haritada deprem, sel, orman yangını, heyelan, medikal acil durum ve vatandaş ihbarlarını canlı simüle edilmiş pinler olarak görüntüleme.
* **Afet Katmanı (Layer) Filtreleme:** Harita üzerindeki Isı Haritası (Heatmap), Risk Bölgeleri (Risk Areas), Depremler, Seller, Yangınlar, Vatandaş Raporları ve Trafik katmanlarını tek tıkla açıp kapatabilme.
* **Canlı Olay Akışı (Live Feed):** Sol panelde anlık düşen afetlerin başlık, ilçe, zaman (`3m ago`), şiddet metriği (`M 4.6`) ve kaynak (`Kandilli`, `AFAD`) bilgilerini listeleme; listeden olaya tıklandığında haritada odağa alma.
* **Geçmişe Dönük Olay Replay (Zaman Makinesi):** 24 Saat, 72 Saat ve 7 Günlük geçmiş olay akışını **1x, 2x, 5x** hız ayarları ile zaman çizgisinde sararak krizin yayılımını simüle etme.
* **Sistem Sağlığı ve Servis Gecikme Takibi:** AFAD API (42 ms), Kandilli API (61 ms), Meteoroloji API (88 ms) ve SignalR canlı bağlantı gecikme sürelerini anlık izleme.
* **Canlı Bildirim Merkezi (Notification Center):** Ekrana düşen simüle edilmiş acil durum bildirimlerini (Örn: *"Kartepe yangınına 2 hava birimi sevk edildi"*, *"Başakşehir'de 90 saniyede 4 ihbar çöküşü"*) izleme.

### 2. Olay Detay Sayfası (`/event/$id` - `event.$id.tsx`) Üzerinde Yapılabilenler
* **Olay Derinlemesine İncelemesi:** Belirli bir afetin (Örn: `EQ-8842` Silivri Depremi) şiddet indeksini (`78/100`), etki yarıçapını (`18 km`), tahmini etkilenen nüfusu (`412,000`), koordinatlarını ve derinliğini inceleme.
* **Kriz Eskalasyonu (Escalate):** Komuta merkezindeki duty officer'ın olayı üst düzey alarm seviyesine çıkarma buton etkileşimi.
* **Olay Zaman Akışı (Timeline Log):** Algılama -> Şiddet Sınıflandırması -> İlçe Ekiplerine Haber Verilmesi -> Saha Doğrulaması adımlarını adım adım görme.

### 3. Rapor & İhbar Merkezi (`/reports` - `reports.tsx`) Üzerinde Yapılabilenler
* **Vatandaş & Saha İhbar Yönetimi:** Bekleyen (`Pending`), Doğrulanan (`Verified`) ve Reddedilen (`Rejected`) ihbarları tek tabloda inceleme.
* **Anlık Arama ve Filtreleme:** Arama çubuğu üzerinden ilçe (`Bağcılar`, `Şişli`), raporlayan birim veya başlığa göre anında filtreleme.
* **İhbar İnceleme & CSV Dışa Aktarma:** İhbar detayına girme ve verileri CSV olarak indirme aksiyonları.

### 4. Risk Analizi Ekranı (`/risk` - `risk.tsx`) Üzerinde Yapılabilenler
* **Çoklu Afet Risk Skorlama:** Sismik (%74), Sel (%58), Heyelan (%41) ve Orman Yangını (%66) risk indekslerini ve risk nedenlerini takip etme.
* **Tahmin Grafikleri:**
  * **Saatlik Hava & Rüzgar Analizi:** Yağış miktarı (`mm/h`) ve rüzgar hızı (`km/h`) değişimi (AreaChart).
  * **İlçe Bazlı Heyelan Riski:** Beykoz (%71), Sarıyer (%58), Çatalca (%44) vb. ilçelerin yamaç kayma risk analizi (BarChart).
  * **Sel Tahmini vs. Baz Çizgisi:** Gelecek 10 güne dönük su seviyesi yükselme eğrisi (LineChart).

### 5. Operasyonel Analiz Ekranı (`/analytics` - `analytics.tsx`) Üzerinde Yapılabilenler
* **Afet Hacim Trendleri:** Günlük, haftalık ve aylık afet sayılarını türlerine göre yığılmış alan grafiğinde inceleme.
* **İlçe Risk Matrisi (24 District Grid):** İstanbul'daki 24 ilçenin kriz ve risk yoğunluğunu renkli kare matris üzerinden hızlıca okuma.
* **Ortalama Müdahale Süreleri:** Çağrı alımından sahaya varış süresine kadar geçen sürenin haftalık değişimi (8.4 dakikadan 5.1 dakikaya düşüş trendi).

---

## 🚀 BÖLÜM 2: Proje Tamamlandığında Neler Yapabiliyor Olacağız? (Gelecek Vizyonu)

Projeye **React + Backend API + Canlı Veri Akışları (WebSockets/SignalR) + PostgreSQL/PostGIS Coğrafi Veritabanı** eklendiğinde, sistem Türkiye'nin en gelişmiş acil durum koordinasyon yazılımına dönüşecektir. 

Sistem tamamlandığında şu yeteneklere sahip olacaktır:

```
[Otomatik Deprem / Meteoroloji Verisi Ingest]
                     │
                     ▼
  [AURA ENGINE: Risk & Severite Skoru Hesabı]
                     │
                     ▼
  [Canlı Harita Üzerine WebSocket Push] ──────► [Saha Ekiplerine Otomatik Görev Ataması]
                     │                                         │
                     ▼                                         ▼
   [Vatandaş İhbarlarıyla Çapraz Doğrulama] ◄──── [Ambulans / İtfaiye Canlı GPS Takibi]
```

### 1. Otomatik Deprem ve Afet Erken İkazı
* **Otomatik API Entegrasyonu:** Kandilli Rasathanesi ve AFAD deprem sensörlerinden gelen veriler saniyeler içinde arka planda işlenecektir.
* **Şiddet & Yüzey İvme Haritası:** Deprem gerçekleştiği anda fay hattına yakın ilçelerin tahmini sarsıntı ivmesi haritada ısı haritası olarak belirecektir.

### 2. Vatandaş İhbar Çöküşü (Cluster) Tespiti ve Triage
* **Mobil Uygulama & SMS Ingest:** Vatandaşların mobil uygulamadan veya 112 çağrı merkezinden gönderdiği fotoğraf ve konum içeren ihbarlar sisteme düşecektir.
* **Yapay Zeka (AI) Doğrulaması & Çöküş Algılama:** Belirli bir 400 metrelik yarıçapta 5'ten fazla gaz kokusu veya bina hasarı ihbarı geldiğinde sistem otomatik olarak *"Doğrulanmış Kriz Bölgesi"* alarmı üretecektir.

### 3. Saha Ekipleri ve Araç Canlı GPS Takibi
* **Gerçek Zamanlı Araç Takibi:** Ambulanslar, itfaiye araçları, AFAD arama-kurtarma timleri ve helikopterlerin canlı GPS konumları harita katmanında (Traffic & Unit Layer) hareketli olarak görünecektir.
* **En Yakın Ekip Yönlendirme:** İhbar onaylandığında sisteme en yakın uygun arama kurtarma ekibi taranacak ve otomatik rotalama yapılabilecektir.

### 4. Kriz Anı "Zaman Makinesi" ve Post-Mortem Analiz
* **Tatbikat & Olay Sonrası İnceleme (Replay):** Gerçekleşmiş bir afetten sonra (Örn: Maraş depremi veya İstanbul seli), krizin ilk 24 saatinde hangi ekiplerin nereden nereye sevk edildiği, hangi saatte hangi kararların alındığı saniye saniye geriye sarılarak analiz edilebilecektir.

### 5. Kurumlar Arası Ortak Komuta (Multi-Agency Interoperability)
* AFAD, 112 Acil Sağlık, İtfaiye Daire Başkanlığı, Emniyet ve Kızılay yetkilileri tek bir ortak ekranda aynı canlı veriyi görerek koordine olabilecektir.

---

## 🎬 BÖLÜM 3: Operasyonel Senaryolar (Kullanıcı Hikayeleri)

### Senaryo 1: Marmara Denizi Silivri Açıklarında M 6.2 Deprem Anı
1. **0. Saniye (Deprem Anı):** Kandilli sensör verisi Aura Backend'e ulaşır.
2. **2. Saniye:** Aura Komuta Merkezi ekranında kırmızı yanıp sönen `EQ-9001` pini belirir. Sesli ikaz duyulur (*"Critical Alert: M 6.2 Earthquake Silivri"*).
3. **10. Saniye:** Harita üzerinde otomatik etki yarıçapı çemberi (35 km) çizilir. Etkilenen tahmini nüfus (1.2 milyon) ve sismik risk skorları güncellenir.
4. **45. Saniye:** Silivri, Avcılar ve Beylikdüzü'nden vatandaş mobil uygulamalarından gelen yıkım ihbarları kümelenir.
5. **2. Dakika:** Nöbetçi Operatör tek tıkla *"Escalate"* butonuna basarak kriz moduna geçer; 11 arama kurtarma birliğine mobil bildirim gönderir.

### Senaryo 2: Başakşehir Aşırı Yağış ve Kent Seli İhbarı
1. Meteoroloji radar verisi `62 mm/h` anlık yağış bildirir.
2. Risk Analizi ekranında Başakşehir ve Esenyurt sel riski %88'e yükselir (Sarı/Kırmızı uyarı).
3. Su basan 3 alt geçidin konumları haritada kapatılmış yol olarak işaretlenir.
4. Rapor Merkezi'ne gelen vatandaş fotoğraflı ihbarları operatör tarafından *"Verified"* olarak onaylanır ve belediye vidanjör ekiplerine atanır.

---

## 💡 BÖLÜM 4: Şimdiki Hali vs. Tamamlanmış Hali Karşılaştırma Tablosu

| Özellik / Yetenek | Şu Anki Prototip Hali | Tamamlanmış Sistem Hali |
| :--- | :--- | :--- |
| **Harita Görselleştirme** | Vektörel SVG Türkiye haritası ve simüle edilmiş konumlar | Mapbox GL / OpenLayers ile dinamik, yakınlaştırılabilir sokak detaylı coğrafi harita |
| **Olay Akışı Verisi** | `src/lib/aura-data.ts` içindeki statik veriler | PostgreSQL / PostGIS veritabanından gelen canlı REST API verileri |
| **Bildirimler & Uyarılar** | React `useState` ile simüle edilen zamanlayıcılar | WebSocket / SignalR sunucusu üzerinden gerçek zamanlı anlık push bildirimleri |
| **Afet İhbarları** | Sabit 8 adet demo ihbar tablosu | Vatandaş mobil uygulaması & 112 entegrasyonu ile canlı veri akışı |
| **Kimlik Doğrulama** | Demo form (her şifre geçerli) | JWT, OAuth2, Rol Tabanlı Yetkilendirme (RBAC) ve YubiKey 2FA |
| **Grafik Verileri** | Sabit istatistik dizileri | Veritabanından tarih aralığına göre dinamik hesaplanan Recharts grafikleri |
| **Geriye Sarma (Replay)** | Frontend state progress simülasyonu | Veritabanı zaman damgası (Timestamp) sorguları ile tarihsel replay |

---

## 🏁 Sonuç

Aura Crisis Network, şu anki haliyle bile **son derece olgun, estetik ve mimari açıdan kusursuz tasarlanmış bir Kriz Komuta Merkezi ön yüzüdür**. 

Tamamlandığında; afete müdahale sürelerini yarı yarıya indirecek, kurumlar arası koordinasyon kopukluğunu ortadan kaldıracak ve canlı veri akışlarıyla hayat kurtaracak ulusal seviyede bir platform olacaktır.

---
*Bu doküman projenin mevcut yeteneklerini ve gelecek vizyonunu tam olarak özetlemektedir.*
