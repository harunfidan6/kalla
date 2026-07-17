// Kaynak: C:\Users\asus\Desktop\kalla_assets\yasal_metinler.txt — kallacoffeeco Müşteri
// Hizmetleri Yasal Metinler ve Sözleşmeler Portföyü. Kayıt, ödeme, çerez bannerı ve
// "Yasal Bilgiler" sayfası bu tek kaynaktan besleniyor.

export interface LegalSection {
  key: string;
  title: string;
  body: string;
}

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    key: 'userAgreement',
    title: 'Kullanıcı Sözleşmesi',
    body: `Madde 1 - Taraflar ve Tanımlar
İşbu Kullanıcı Sözleşmesi ("Sözleşme"); Beşiktaş / İstanbul adresinde mukim kallacoffeeco (Bundan böyle "kallacoffeeco" veya "Şirket" olarak anılacaktır) ile kallacoffeeco mobil uygulamasına veya web sitesine ("Uygulama") üye olan veya Uygulamayı misafir olarak kullanan gerçek kişi ("Kullanıcı") arasında akdedilmiştir.

Uygulama: kallacoffeeco'ya ait mobil uygulamaları ve web portalını ifade eder.
Hizmet: Uygulama üzerinden sunulan kahve/yiyecek sipariş arayüzü, cüzdan/puan sadakat sistemleri ve diğer dijital servisleri ifade eder.

Madde 2 - Sözleşmenin Konusu ve Kapsamı
İşbu Sözleşme'nin konusu, Şirket tarafından Uygulama üzerinden sunulacak hizmetlerin şartlarının, tarafların hak ve yükümlülüklerinin, fikri mülkiyet haklarının ve uyuşmazlık çözüm mekanizmalarının belirlenmesidir. Uygulama'nın kullanımı, üyelik işlemleri ve sipariş adımları bu Sözleşme'ye tabidir.

Madde 3 - Tarafların Hak ve Yükümlülükleri
3.1. Üyelik Şartı: Kullanıcı, üye olurken verdiği bilgilerin eksiksiz, güncel ve doğru olduğunu beyan eder. Yanıltıcı bilgi verilmesi nedeniyle kallacoffeeco'nun uğrayacağı tüm maddi ve manevi zararlar Kullanıcı tarafından derhal tazmin edilecektir.
3.2. Hesap Güvenliği: Kullanıcı, üyelik şifresini gizli tutmakla yükümlüdür. Şifrenin üçüncü şahıslar tarafından ele geçirilmesi ve kullanılması neticesinde doğacak tüm risk ve sorumluluk Kullanıcı'ya aittir. Yetkisiz kullanım durumunda Kullanıcı, derhal harun@kalla.com adresi üzerinden Şirket'e bildirimde bulunmalıdır.
3.3. Hukuka Uygun Kullanım: Kullanıcı, Uygulama'yı hiçbir şekilde kamu düzenini bozucu, genel ahlaka aykırı, başkalarını rahatsız ve taciz edici şekilde, yasalara aykırı bir amaç için kullanamaz. Fikir ve Sanat Eserleri Kanunu dahil olmak üzere tüm mevzuat hükümlerine uymayı kabul eder.
3.4. Hizmet Kesintileri: kallacoffeeco, teknik arızalar, altyapı çalışmaları veya mücbir sebepler nedeniyle Hizmet'in geçici olarak kesintiye uğramasından veya aksamasından sorumlu tutulamaz.
3.5. Fiyatlandırma ve Menü Değişikliği: Uygulama'da listelenen tüm ürünlerin fiyatı, stok durumu, içeriği ve hazırlık detayları kallacoffeeco tarafından dilediği an güncellenebilir veya satıştan kaldırılabilir.

Madde 4 - Fikri Mülkiyet Hakları
Uygulama'da sunulan tüm kodlar, tasarımlar, arayüzler, grafikler, metinler, logolar, fotoğraflar, imza kahve reçeteleri ve ticari markalar kallacoffeeco'nun fikri ve sınai mülkiyetindedir. Kullanıcı, Şirket'in yazılı izni olmaksızın bu materyalleri kopyalayamaz, değiştiremez, satamaz, dağıtamaz veya tersine mühendislik işlemlerine tabi tutamaz.

Madde 5 - Sorumluluğun Sınırlandırılması
kallacoffeeco, Uygulama'nın kullanımı veya kullanılamaması nedeniyle meydana gelebilecek kar kaybı, veri kaybı veya dolaylı zararlardan yasal sınırların elverdiği maksimum ölçüde sorumlu değildir.

Madde 6 - Uyuşmazlıkların Çözümü ve Yetkili Mahkeme
İşbu Sözleşme Türkiye Cumhuriyeti kanunlarına tabidir. Sözleşme'nin uygulanmasından doğacak her türlü uyuşmazlığın çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri münhasıran yetkilidir.`,
  },
  {
    key: 'kvkk',
    title: 'KVKK Aydınlatma Metni',
    body: `Veri Sorumlusu: Beşiktaş / İstanbul adresinde yerleşik kallacoffeeco olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizin güvenliğine son derece hassasiyet göstermekteyiz.

1. İŞLENEN KİŞİSEL VERİLERİNİZ VE TOPLAMA YÖNTEMLERİ
Uygulamayı kullandığınızda veya üye olduğunuzda aşağıdaki kişisel verileriniz elektronik formlar, sipariş ekranları ve arka plan analiz araçları vasıtasıyla toplanmaktadır:
- Kimlik Bilgileri: Ad, soyad.
- İletişim Bilgileri: E-posta adresi, telefon numarası, teslimat adresleri.
- Finansal Bilgiler: Ödeme yöntemi tercihleri, cüzdan bakiyesi, satın alınan ürünler (Kredi kartı numaranız PCI-DSS uyumlu harici ödeme geçidinde işlenir, sunucularımızda tutulmaz).
- İşlem Güvenliği Verileri: IP adresi, cihaz bilgileri, Uygulama içi hareket günlükleri (log kayıtları).
- Konum Bilgisi: En yakın şubeyi bulabilmeniz için onay vermeniz halinde konum veriniz.

2. VERİ İŞLEME FAALİYETLERİNİN HUKUKİ SEBEPLERİ VE AMAÇLARI
Kişisel verileriniz KVKK Madde 5/2 uyarınca şu hukuki sebeplere dayanarak işlenir:
- "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması": Siparişlerinizin alınması, ödemelerin tahsil edilmesi, siparişin adresinize teslimi.
- "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi": Fatura düzenlenmesi, vergi beyannamelerinin hazırlanması ve yasal otoritelerin bilgi talepleri.
- "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri": Hileli işlemlerin ve suistimallerin tespiti, hizmet kalitesinin artırılması.
- "Açık Rızanız": Kampanya, indirim ve bültenlerden haberdar edilmeniz (ETK onayı).

3. KİŞİSEL VERİLERİN AKTARILACAĞI ÜÇÜNCÜ KİŞİLER
Verileriniz, sadece yukarıdaki amaçlarla sınırlı olmak üzere; lisanslı ödeme kuruluşu ortağımıza, dağıtım ve kurye hizmeti sağlayan iş ortaklarımıza, hukuki süreçlerin takibi için avukatlarımıza ve denetçilerimize, yasal bildirim zorunluluğu kapsamında adli ve idari makamlara aktarılmaktadır.

4. KVKK MADDE 11 KAPSAMINDAKİ HAKLARINIZ VE BAŞVURU YÖNTEMİ
KVKK Madde 11 kapsamındaki haklarınızı (verilerinizin silinmesi, düzeltilmesi, bilgi edinme, vb.) kullanmak için başvurularınızı Beşiktaş / İstanbul adresimize yazılı olarak veya kayıtlı e-postanız üzerinden harun@kalla.com adresine güvenli elektronik imza yöntemiyle iletebilirsiniz. Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır.`,
  },
  {
    key: 'cookiePolicy',
    title: 'Çerez Politikası',
    body: `kallacoffeeco, Uygulama ve web platformunun stabil çalışması, kullanıcı tercihlerinin hatırlanması (oturum açık kalma süresi, dil seçimi) ve sistem performansının ölçülmesi amacıyla birinci ve üçüncü taraf çerezleri kullanır.

ÇEREZ KATEGORİLERİMİZ:
1. Zorunlu Çerezler: Sepetinizin kaybolmaması, güvenli ödeme ekranlarının yüklenmesi ve kullanıcı oturum doğrulaması için gerekli olan çerezlerdir. Devre dışı bırakılamazlar.
2. Analitik Çerezler: Ziyaretçilerin uygulamayı nasıl kullandığını anlamamızı, hata veren ekranları tespit etmemizi sağlayan anonim istatistik çerezleridir.
3. Reklam ve Profilleme Çerezleri: İlgi alanlarınıza uygun ürün önerileri ve kampanyalar sunabilmemiz için iş ortaklarımız tarafından yerleştirilen çerezlerdir.

ÇEREZ YÖNETİMİ:
Kullanıcılar çerez tercihlerini tarayıcı ayarlarından veya mobil cihaz ayarlarından diledikleri an sınırlandırabilir veya tamamen temizleyebilir. Ancak zorunlu çerezlerin kapatılması durumunda Uygulama'nın sipariş ve sepet özellikleri çalışmayacaktır.`,
  },
  {
    key: 'marketingConsent',
    title: 'Ticari Elektronik İleti Onayı',
    body: `Kullanıcı, işbu onay formunu dijital ortamda işaretleyerek; 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında, kallacoffeeco tarafından kendisine özel hazırlanan indirimler, hediye kahve kuponları, yeni ürün lansmanları, kampanyalar ve anket çalışmaları ile ilgili olarak sistemde kayıtlı e-posta adresine ve telefon numarasına SMS, e-posta ve anlık bildirim (Push Notification) gönderilmesine açık onay verir.

Bu onay, İYS (İleti Yönetim Sistemi) veri tabanına kaydedilecek olup; Kullanıcı, dilediği zaman hiçbir gerekçe göstermeksizin harun@kalla.com adresine e-posta göndererek veya kendisine ulaşan iletilerdeki ücretsiz çıkış (reddetme) hakkını kullanarak ticari ileti alımını durdurabilir.`,
  },
  {
    key: 'accountDeletion',
    title: 'Hesap Silme ve Veri İmhası',
    body: `kallacoffeeco, kullanıcıların kişisel verileri üzerindeki haklarına saygı duyar. Mobil uygulama içerisindeki Profil Ayarları -> "Hesabımı Sil" adımı üzerinden veya harun@kalla.com adresine yapılacak yazılı talep doğrultusunda süreç şöyle işletilir:

1. Kimlik Doğrulama: Hesabın gerçek sahibinin talepte bulunduğundan emin olmak amacıyla iki aşamalı bir onay istenir.
2. Kişisel Verilerin Silinmesi: Kullanıcının adı, soyadı, telefon numarası, e-postası, şifresi, IP logları ve açık adres tanımları veritabanından kalıcı olarak silinir.
3. Mali ve Yasal Verilerin Anonimleştirilmesi: 213 Sayılı Vergi Usul Kanunu uyarınca, kesilen e-faturalar ve yapılan sipariş işlemleri 10 yıl boyunca saklanmak zorundadır. Bu yasal zorunluluk nedeniyle, geçmiş satış verileri silinmez; ancak "Kullanıcı Adı: Anonim Üye" olacak şekilde kimliksizleştirilir (anonimleştirilir). Böylece veriler artık hiçbir gerçek kişiyle ilişkilendirilemez hale getirilir.`,
  },
  {
    key: 'distanceSales',
    title: 'Mesafeli Satış Sözleşmesi',
    body: `MADDE 1 - TARAFLAR
SATICI: kallacoffeeco — Beşiktaş / İstanbul — harun@kalla.com
ALICI: Kayıtlı hesap bilgilerinizden (ad soyad, teslimat adresi, telefon) otomatik çekilir.

MADDE 2 - KONU VE KAPSAM
İşbu Sözleşme, Alıcı'nın Satıcı'ya ait Uygulama üzerinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini kapsar.

MADDE 3 - SÖZLEŞME KONUSU ÜRÜN VE BEDELİ
Sözleşmeye konu gıda ve kahve ürünlerinin cinsi, miktarı, birim fiyatı, kurye/teslimat ücreti ve KDV dahil toplam bedeli Alıcı'nın siparişi onayladığı andaki sepet ve sipariş fişi detaylarında yer aldığı şekildedir.

MADDE 4 - CAYMA HAKKI VE İSTİSNALARI (ÇOK ÖNEMLİ BİLGİLENDİRME)
4.1. 29188 sayılı Mesafeli Sözleşmeler Yönetmeliği'nin "Cayma Hakkının İstisnaları" başlıklı 15. maddesinin 1. fıkrasının (c) bendi uyarınca; "Çabuk bozulabilen veya son kullanma tarihi geçebilecek malların teslimine ilişkin sözleşmelerde" tüketici cayma hakkını kullanamaz.
4.2. Bu kapsamda; Alıcı'nın kallacoffeeco uygulamasından sipariş verdiği taze hazırlanan sıcak/soğuk kahveler, içecekler, pastane ürünleri, taze sandviçler ve gıda maddeleri hızlı tüketim ürünü ve çabuk bozulabilir nitelikte olduğundan, sipariş hazırlanmaya başlandığı andan itibaren ALICI'NIN CAYMA VE SİPARİŞ İPTAL HAKKI BULUNMAMAKTADIR.
4.3. Diğer iade edilemeyen paketli ürünlerin (Örn: Paket çekirdek kahve, termos, kupa) iade edilebilmesi için ambalajının açılmamış, kullanılmamış ve hasar görmemiş olması şarttır. Bu durumlarda cayma hakkı süresi teslimattan itibaren 14 gündür.

MADDE 5 - TESLİMAT KOŞULLARI VE SORUMLULUKLAR
5.1. Satıcı, ürünleri taahhüt ettiği hazırlık süreleri içinde ve gıda güvenliği standartlarına uygun olarak taze şekilde teslim etmekle yükümlüdür.
5.2. Teslimat adrese teslim veya şubeden "Gel Al" şeklinde Alıcı'nın sipariş anında seçtiği yönteme göre gerçekleştirilir.
5.3. Adrese teslim siparişlerde Alıcı'nın belirtilen adreste bulunmaması, zilinin çalışmaması veya kapıyı açmaması gibi durumlarda kurye siparişi şubeye geri götürecek veya güvenliğe bırakacaktır. Bu durumlarda ürünler imha edileceğinden ücret iadesi yapılmaz.
5.4. Alıcı, teslim aldığı esnada siparişte fiziksel bir hasar (kahve dökülmesi, eksik ürün vb.) fark ederse durumu derhal harun@kalla.com adresine veya canlı destek hattına fotoğraflı olarak bildirmelidir. İnceleme sonrası haklı durumlarda ücret iadesi veya yeni ürün gönderimi Satıcı tarafından karşılanacaktır.

MADDE 6 - YÜRÜRLÜK
Alıcı, Uygulama üzerinden sipariş adımlarını tamamlayıp ödemeyi gerçekleştirdiğinde, işbu Mesafeli Satış Sözleşmesi'nin tüm şartlarını peşinen kabul etmiş ve onaylamış sayılır.`,
  },
];

export const COOKIE_BANNER_TEXT =
  "kallacoffeeco olarak, platformumuzun güvenli çalışması, tercihlerinizi hatırlamak ve analiz yapabilmek için yasalara uygun çerezler kullanıyoruz. Detaylar için Çerez Politikamızı inceleyebilirsiniz.";
