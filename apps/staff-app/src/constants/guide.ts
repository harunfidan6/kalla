export type GuideBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'callout'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

export interface GuideSection {
  title: string;
  blocks: GuideBlock[];
}

export const GUIDE_CONTENT: GuideSection[] = [
  {
    title: 'Bölüm 1: Çekirdek Teorisi, Su Kimyası ve Kalibrasyon',
    blocks: [
      { type: 'heading', text: '1. SCA Su Kalitesi ve Ekstraksiyon Kimyası' },
      {
        type: 'paragraph',
        text: "Nitelikli kahve demlemenin %98'i sudur. Specialty Coffee Association (SCA) standartlarına göre demleme suyunun ideal parametreleri şöyledir:",
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'TDS (Toplam Çözünmüş Katı Madde): 150 mg/L (120 - 200 mg/L tolerans)',
          'pH Derecesi: 7.0 (6.5 - 7.5 arası kabul edilir)',
          'Sıcaklık: 90.5°C - 96°C (Källa Espresso standart kalibrasyon ısısı: 93.5°C)',
        ],
      },
      {
        type: 'paragraph',
        text: 'TDS değeri çok düşük olan su (distile/saf su) kahvedeki aromaları çözemez (under-extract); çok yüksek olan su ise doymuş olduğundan kahvenin asitlik ve tatlılık dengesini bardağa aktaramaz.',
      },
      { type: 'heading', text: '2. Espresso Dial-In (Tarif Kalibrasyonu)' },
      {
        type: 'paragraph',
        text: 'Öğütücü kalibrasyonunda TDS oranını ve Ekstraksiyon Verimini (Extraction Yield) ideal sınırda (%18 - %22) tutmak için 4 değişkeni yönetmelisiniz:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Doz (In): Sepete giren kahve gramajı. 18.5g standarttır. Doz arttıkça akış direnci artar.',
          'Çıktı (Out): Bardağa süzülen sıvı kahve. 38g standarttır.',
          'Öğütme Derecesi: Kahve parçacıklarının boyutu. İnceldikçe suyun temas yüzeyi ve akış direnci artar.',
          'Zaman (Time): Akış süresi. 26-30 saniye dışına çıkarsa tat profili bozulur.',
        ],
      },
      {
        type: 'paragraph',
        text: "Örnek Durum: Kahve çok acı ve yanık tat veriyorsa, ekstraksiyon verimi %22'yi aşmıştır (Over-extracted). Öğütme ayarını 1 klik kalınlaştırıp akış süresini 32 saniyeden 28 saniyeye çekerek dengeyi bulun.",
      },
    ],
  },
  {
    title: 'Bölüm 2: Kusursuz Espresso ve Puck Prep (Channeling Önleme)',
    blocks: [
      { type: 'heading', text: '1. Channeling (Kanallanma) Nedir?' },
      {
        type: 'paragraph',
        text: 'Su, kahve yatağından (puck) geçerken her zaman en az direnç gösteren yolu bulmaya çalışır. Eğer kahve yatağı homojen sıkışmamışsa veya içinde topaklanmalar varsa, su bu zayıf noktalardan yüksek tazyikle fışkırarak tüneller açar. Buna Channeling denir.',
      },
      {
        type: 'paragraph',
        text: 'Channeling Belirtileri: Dip çıplak portafiltreden (bottomless) kahve akarken sağa sola fışkırmalar, akışın düzensiz dalgalanması, kahvenin ekşi ve acı tatların karmaşasından oluşması.',
      },
      { type: 'heading', text: '2. WDT ve Puck Screen Kullanım Standartları' },
      {
        type: 'list',
        ordered: false,
        items: [
          'WDT (Weiss Distribution Technique): Öğütücüden portafiltreye dökülen kahvede statik elektrikten dolayı topaklanmalar oluşur. 0.3mm - 0.4mm kalınlığındaki WDT iğnelerini sepete dikey daldırarak dairesel hareketlerle en alttan en üste doğru karıştırın. Bu işlem yoğunluk farklarını tamamen sıfırlar.',
          'Distribütör (Leveler): Sadece yüzeydeki kahveyi düzleştirmek içindir, tamp yerine geçmez.',
          'Tamping: Portafiltreyi tezgaha paralel tutun. Vücut ağırlığınızı kullanarak dik ve bükmeden basın. Sıkıştırdıktan sonra portafiltreyi kenarlara vurmayın; bu, kahve diskinin kenarlardan çatlamasına ve channeling oluşmasına sebep olur.',
          'Puck Screen (Metal Dağıtıcı Süzgeç): Tamp edilmiş kahvenin üzerine düzgünce yerleştirin. Grup başlığındaki duş süzgecinden gelen su jetini tüm yüzeye eşit dağıtır ve grup başlığının temiz kalmasını sağlar.',
        ],
      },
    ],
  },
  {
    title: 'Bölüm 3: Süt Tekstüre Etme ve Protein Kimyası',
    blocks: [
      { type: 'heading', text: '1. Köpük Kararlılığı: Kazein ve Peynir Altı Suyu (Whey) Proteinleri' },
      {
        type: 'paragraph',
        text: 'Sütün köpürmesi ve bu köpüğün stabil kalması tamamen sütün kimyasal yapısındaki proteinlerin termal tepkimesiyle ilgilidir:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Kazein (Casein) Miselleri: Sütteki ana protein grubudur. Hava kabarcıklarının etrafını sararak onların birleşip sönmesini (coalescence) engeller.',
          '60°C sıcaklığa ulaşıldığında Whey (Peynir Altı Suyu) Proteinleri (Örn: Beta-Laktoglobulin) çözülmeye (denatürasyon) başlar. Unfolding adı verilen bu süreçte, proteinlerin hidrofobik uçları havaya, hidrofilik uçları sütün sıvı fazına tutunarak hava-sıvı arayüzünde koruyucu bir duvar örer. Bu sayede pürüzsüz microfoam oluşur.',
        ],
      },
      { type: 'heading', text: '2. Sıcaklık ve Yağların Rolü' },
      {
        type: 'paragraph',
        text: 'Sütün en tatlı olduğu sıcaklık 60°C - 65°C aralığıdır. Bu sıcaklıkta süt şekerleri (laktoz) çözünür ve dil tarafından daha yoğun algılanır.',
      },
      {
        type: 'callout',
        text: 'Sıcaklık Uyarısı (> 70°C): Süt 70°C sıcaklığı aşarsa proteinler geri dönüşümsüz olarak pıhtılaşır (coagulation). Sülfür bileşikleri açığa çıkarak pişmiş yumurta kokusu verir, köpük çöker ve laktoz yanarak sütün doğal tatlılığı kaybolur.',
      },
    ],
  },
  {
    title: 'Bölüm 4: Makine Sağlığı ve Koruyucu Bakım Yönergeleri',
    blocks: [
      { type: 'heading', text: '1. Kireçlenme ve Su Filtrasyon Kontrolü' },
      {
        type: 'paragraph',
        text: 'Espresso makinelerinin en büyük düşmanı sudaki kalsiyum ve magnezyum minerallerinin kazan (boiler) duvarlarında birikerek kireç oluşturmasıdır. Her sabah su yumuşatma sisteminin (reverse osmosis / filtre) çıkış TDS değerini ölçün. 150 TDS üzeri değerler kireçlenme riskidir.',
      },
      { type: 'heading', text: '2. Kimyasal Temizlik Adımları (Kapanış Protokolü)' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Grup süzgeçlerini fırça yardımıyla sıcak su akıtarak temizleyin.',
          'Kör filtre takılmış portafiltreye 1 ölçek (3g) espresso temizleme deterjanı koyup gruba kilitleyin.',
          'Temizleme programını (10 saniye çalıştır, 10 saniye bekle - 5 döngü) başlatın. Deterjan basınçla ters yöne giderek solenoid valfi temizler.',
          'Portafiltreyi çıkarıp durulayın, kör filtreyle deterjansız 5 döngü daha ters yıkama (backflush) yaparak kalıntıları arındırın.',
          'Buhar çubuklarını her akşam söküp özel süt temizleme sıvısı (Blue Labeled) içeren sıcak suda 15 dakika bekleterek süt taşlarını eritin.',
        ],
      },
    ],
  },
  {
    title: 'Bölüm 5: Döküş Fiziği ve İleri Latte Art',
    blocks: [
      { type: 'heading', text: "1. Latte Art'ta Döküş Fiziğinin Üç Bileşeni" },
      { type: 'paragraph', text: 'Latte art yapmak sadece el becerisi değil, fiziksel değişkenleri kontrol etmektir:' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Yükseklik (Height): Sütü bardağın 10-15 cm yukarısından döktüğünüzde yerçekimi hızıyla sütün momentumu artar. Süt, kahve kremasının (crema) altına batarak kahverengi zemini temiz tutar. Bardağa yaklaştırdığınızda ise momentum düşer ve süt köpüğü yüzeyde kalarak beyaz desenler çizer.',
          'Akış Hızı (Flow Rate): Döküş hızı çok yavaş olursa sadece sıvı süt akar, köpük potun içinde kalır. Çok hızlı dökerseniz krema tabakası yırtılır ve desen dağılır. Dengeli ve sabit bir debiyle dökülmelidir.',
          'Açı (Tilt): Bardağı 45 derece eğik tutarak başlayın. Döküş ilerledikçe dökülen süt hacmiyle birlikte bardağı yavaşça doğrultun. Bu, döküş yüzey alanını maksimumda tutarak desene alan açar.',
        ],
      },
      { type: 'heading', text: '2. Rosetta ve Kuğu (Swan) Çizim Dinamikleri' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Rosetta (Rüzgar Gülü): Süt potunu bardağa iyice yaklaştırın. Potu sağa sola ritmik ve hızlı sallayarak (zigzag) beyaz dalgalar oluşturun. Bardağın dolmasına yakın potu yukarı kaldırıp ince bir şeritle ortadan keserek yaprakları şekillendirin.',
          'Kuğu (Swan): Bardağın arkasında kuğu gövdesi için lale veya rozet tabanı dökün. Potu yukarı kaldırıp kenardan boyun çizgisini çekin, en tepede kuğunun kafasını (kalp hareketiyle) ve gagayı oluşturup geriye doğru gövdeyi çizerek bitirin.',
        ],
      },
    ],
  },
  {
    title: 'Bölüm 6: İmza İçeceklerde Katman ve Moleküler Sunum Standartları',
    blocks: [
      { type: 'heading', text: '1. Özgül Ağırlık ve Sıcaklık Katmanlaması' },
      {
        type: 'paragraph',
        text: 'Midnight Sun Latte, Aurora Cold Brew gibi katmanlı imza içeceklerde katmanların birbirine karışmadan kalması fiziksel kurallara bağlıdır:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Alt Katman (Ağır Faz): Yoğun şeker ve sos içeren şuruplar (20 Brix üzeri) her zaman dipte durur. Bunlar espressoyla karıştırılsa bile sütün altında kalır.',
          'Orta Katman (Akışkan Süt): Buz küpleri bardağın içinde tırnak görevi görerek üstten dökülen sıvının momentumunu kırar ve süzülmesini yavaşlatır.',
          'Üst Katman (Hafif Faz / Kahve): Kahvenin özgül ağırlığı süte göre daha düşüktür. Taze çekilmiş espresso veya cold brew, buzların üzerine bar kaşığı yardımıyla döküldüğünde en üstte asılı kalır.',
        ],
      },
      { type: 'heading', text: '2. Moleküler Dokunuşlar' },
      {
        type: 'paragraph',
        text: 'Smoky Roastery gibi içeceklerde meşe talaşı dumanı fanlı cloche (tütsü fanusu) içinde içeceğe verilir. Dumanın soğuk kahve kreması ve yağ asitleri tarafından emilmesi için fanus masada müşteri önünde açılmalıdır. Linen Amber Brew üzerindeki şeker kabuğu ise ince esmer şeker tabakasının pürmüz aleviyle karamelize edilerek sert bir cam tabaka oluşturmasıyla hazırlanır.',
      },
    ],
  },
  {
    title: 'Bölüm 7: Alerjen Yönetimi, Çapraz Bulaşma ve Sağlık Standartları',
    blocks: [
      { type: 'heading', text: '1. Alerjen ve Gluten Güvenliği' },
      {
        type: 'paragraph',
        text: 'Özellikle çölyak hastaları ve laktoz/kuruyemiş alerjisi olan bireyler için çapraz bulaşma hayati risk taşır. Källa Barista Alanı kuralları:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Pot (Pitcher) Renk Kodları: Klasik sütler için çelik renkli potlar, Yulaf ve Badem sütleri için bakır/siyah renkli potlar kullanılır.',
          'Alerjen Temizliği: Yulaf veya fındık sütü köpürtüldükten sonra buhar çubuğu beziyle silinir, 3 saniye buhar verilerek temizlenir. Farklı süt türleri için asla aynı bez kullanılmaz.',
          'Pastane Dolabı Kontrolü: Vegan veya glutensiz kurabiyeler alınırken mutlaka ayrı (yeşil maşa) kullanılır. Dolap içinde glutensiz ürünler en üst rafa yerleştirilir; böylece alt raflardaki un kırıntılarının üzerlerine dökülmesi önlenir.',
        ],
      },
    ],
  },
  {
    title: 'Bölüm 8: Barista İş Akışı, Hız ve Çoklu Sipariş Yönetimi',
    blocks: [
      { type: 'heading', text: '1. Eşzamanlı Hazırlama (Multi-Steaming & Shot Pulling)' },
      { type: 'paragraph', text: 'Yoğun saatlerde bar hızını korumak için baristanın saniyeleri yönetmesi gerekir:' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Sıralama (Sequencing): Espresso akarken (28 saniye boş zaman) barista boş durmamalıdır. Espresso tuşuna bastığı anda süt potunu doldurmalı, bardağı hazırlamalı ve sütü köpürtmeye başlamalıdır.',
          'Süt Paylaşımı: Aynı süt türüne sahip iki adet Flat White siparişi varsa, tek bir büyük potta (600ml) süt köpürtülüp iki bardağa hızlıca paylaştırılmalıdır. Sütün bekleyip ayrışmaması için döküş serice tamamlanmalıdır.',
          'Sipariş Yönetimi: Önce espresso bazlı sıcak içecekler, ardından soğuk içecekler, en son ise paket pastane ürünleri hazırlanarak tepsiye yerleştirilir. Bu sayede kahvelerin köpüğü sönmeden masaya ulaşır.',
        ],
      },
    ],
  },
];
