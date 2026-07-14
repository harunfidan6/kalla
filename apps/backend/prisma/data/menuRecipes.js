const RECIPES = [
  // 1. SICAK KLASİKLER (1 - 15)
  {
    id: 1, name: 'Espresso', category: 'Sıcak Klasikler', prepTime: '1 dk', difficulty: 'Kolay', temp: '93.5°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Bu ölçüler tek shot içindir; çift shot siparişinde kahve ve suyu ikiye katlayın (18.5g kahve / 38ml su, 26-30 saniyede çekilir). Fincanı önceden ısıtın, soğuk fincan kremayı anında söndürür.',
    ingredients: [{ name: 'Källa House Blend Kahve Çekirdeği', amount: 9, unit: 'g' }, { name: 'Sıcak Su', amount: 19, unit: 'ml' }],
    steps: [
      'Portafiltreyi makineden çıkarıp metal sepetin içini kuru mikrofiber bezle silin.',
      'Öğütücüden 9g (çift shot için 18.5g) ince çekilmiş kahveyi sepete doldurun.',
      'Kahve yüzeyini parmağınızla sıyırarak tamamen düz hale getirin.',
      'Tamp aletini sepete yerleştirip 15kg güçle dik olarak sıkıştırın.',
      'Makineden 2 saniye boş su akıtarak grup başlığını temizleyin.',
      'Portafiltreyi takıp kilitledikten sonra 19g (çift shot için 38g) sıvı kahveyi 26-28 saniyede fincana süzün.'
    ]
  },
  {
    id: 3, name: 'Espresso Macchiato', category: 'Sıcak Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Fincana sıvı süt kaçmamalıdır. Sadece kuru süt köpüğü kaşıkla eklenir.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Köpürtülmüş Sıcak Süt Köpüğü', amount: 1, unit: 'kaşık' }],
    steps: [
      'Double shot espresso (38g) hazırlayarak küçük fincana çekin.',
      'Çelik süt potunu yarıya kadar soğuk sütle doldurup buhar çubuğuyla bol köpüklü köpürtün (62°C).',
      'Yemek kaşığı yardımıyla sütün en üstündeki kuru köpüğü alıp espressonun ortasına bırakın.'
    ]
  },
  {
    id: 4, name: 'Americano', category: 'Sıcak Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: '90°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Kremayı korumak için espressoyu suyun üzerine dökün. Suyu kahvenin üstüne dökerseniz krema söner.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Su', amount: 180, unit: 'ml' }],
    steps: [
      'Americano bardağına makineden 180 ml sıcak su doldurun.',
      'Ayrı bir yerde taze double shot espresso (38g) hazırlayın.',
      'Espressoyu sıcak su dolu bardağın tam ortasından yavaşça akıtarak kremayı üstte tutun.'
    ]
  },
  {
    id: 5, name: 'Flat White', category: 'Sıcak Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 60°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Köpük kalınlığı en fazla 0.5 cm olmalıdır. Kadife gibi boya kıvamında köpürtün.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 130, unit: 'ml' }],
    steps: [
      'Double shot espressoyu fincana çekin.',
      'Sütü minimum hava vererek kadifemsi mikroköpük kıvamında (60°C) köpürtün.',
      'Sütü tezgaha vurup kabarcıkları yok edin, kahve kremasını bölmeden yavaşça ortadan döküp desen çizin.'
    ]
  },
  {
    id: 6, name: 'Cortado', category: 'Sıcak Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: '93.5°C / 60°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kahve ve süt oranı birebir olmalıdır. Küçük cam bardak kullanılır.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 40, unit: 'ml' }],
    steps: [
      'Double shot espressoyu (38g) Cortado bardağına hazırlayın.',
      'Çelik potta sütü hafifçe köpürterek 60°C ye ısıtın.',
      'Isınan sütün 40 ml kadarını dairesel hareketlerle kahveye ekleyin.'
    ]
  },
  {
    id: 7, name: 'Cappuccino', category: 'Sıcak Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Köpük kalınlığı 1.5 cm olmalı, en üstte kubbeleşmelidir.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 120, unit: 'ml' }, { name: 'Kakao Tozu', amount: 1, unit: 'tutam' }],
    steps: [
      'Double shot espressoyu Cappuccino fincanına hazırlayın.',
      'Sütü çelik potta buhar çubuğunu yüzeye yakın tutarak bol hava verip yoğun köpüklü (62°C) köpürtün.',
      'Sütü dairesel hareketlerle kahveye dökün, en üstte kalın bir köpük oluşturup kakao serpin.'
    ]
  },
  {
    id: 8, name: 'Café Latte', category: 'Sıcak Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Süt sıcaklığı 65°C değerini aşmamalı, laktoz yanmamalıdır.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 220, unit: 'ml' }],
    steps: [
      'Latte bardağına taze double shot espresso çekin.',
      'Sütü 1 cm köpük yüksekliğinde hafif köpürtüp 62°C ye ısıtın.',
      'Bardağı hafif eğik tutarak sütü kenardan dökün, köpükle sütü bütünleştirin.'
    ]
  },
  {
    id: 9, name: 'Caffè Mocha', category: 'Sıcak Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Bitter çikolata sosu sıcak kahveyle pürüzsüzce karıştırılarak eritilmelidir.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Bitter Çikolata Sosu', amount: 20, unit: 'g' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }],
    steps: [
      'Bardağın dibine 20g bitter çikolata sosu sıkın.',
      'Double shot espressoyu doğrudan üzerine çekin.',
      'Kaşık yardımıyla sos tamamen eriyene kadar karıştırın.',
      'Köpürtülmüş sıcak sütü ekleyip karıştırın, çikolata sosuyla süsleyin.'
    ]
  },
  {
    id: 10, name: 'White Chocolate Mocha', category: 'Sıcak Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Beyaz çikolata tatlıdır, espresso lezzetini örtmemek için ölçüyü aşmayın.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Beyaz Çikolata Sosu', amount: 20, unit: 'g' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }],
    steps: [
      'Bardağın dibine 20g beyaz çikolata sosu sıkın.',
      'Double shot espressoyu üzerine çekip tamamen eriyene kadar kaşıkla çırpın.',
      'Köpürtülmüş sıcak sütü yavaşça ekleyin.'
    ]
  },
  {
    id: 11, name: 'V60 Drip Coffee', category: 'Sıcak Klasikler', prepTime: '4 dk', difficulty: 'Zor', temp: '92-94°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Ön demleme süresi aromaların salınması için en kritik adımdır.',
    ingredients: [{ name: 'V60 Öğütülmüş Çekirdek', amount: 15, unit: 'g' }, { name: 'Sıcak Su', amount: 240, unit: 'ml' }],
    steps: [
      'V60 filtresini sıcak suyla yıkayıp hazneyi boşaltın.',
      '15g kahveyi ekleyip yatağı düzleştirin.',
      '40g su ekleyerek 35 saniye ön demleme yapın.',
      'Suyu dairesel hareketlerle 3 aşamada dökerek tamamlayın.'
    ]
  },
  {
    id: 12, name: 'Chemex Classic', category: 'Sıcak Klasikler', prepTime: '5 dk', difficulty: 'Zor', temp: '93°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Kalın filtre kahvedeki asitliği ve yağları mükemmel süzer.',
    ingredients: [{ name: 'Chemex Öğütülmüş Çekirdek', amount: 30, unit: 'g' }, { name: 'Sıcak Su', amount: 480, unit: 'ml' }],
    steps: [
      'Chemex filtresini yıkayın ve suyu dökün.',
      '30g kahveyi ekleyin.',
      '80g su ile 45 saniye ön demleme yapın.',
      'Geri kalan suyu yavaş spiraller çizerek dökün.'
    ]
  },
  {
    id: 13, name: 'Türk Kahvesi', category: 'Sıcak Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: 'Kısık Ateş', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Kısık ateşte karıştırmadan pişmesi köpük kalitesini artırır. Duble fincan siparişinde kahve ve suyu ikiye katlayın (14g kahve / 130ml su).',
    ingredients: [{ name: 'Geleneksel Türk Kahvesi', amount: 7, unit: 'g' }, { name: 'Su (Oda Sıcaklığı)', amount: 65, unit: 'ml' }],
    steps: [
      'Cezveye kahveyi ve suyu ekleyip karıştırın (duble fincan için 14g kahve, 130ml su kullanın).',
      'Kısık ateşte pişmeye bırakın.',
      'Yükselen köpüğü fincana paylaştırın, kalan kahveyi bir taşım daha kaynatıp dökün.'
    ]
  },
  {
    id: 15, name: 'Filtre Kahve (Batch Brew)', category: 'Sıcak Klasikler', prepTime: '6 dk', difficulty: 'Kolay', temp: '94°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Her demlemeden sonra termal potu sıcak suyla yıkayın.',
    ingredients: [{ name: 'Källa Filtre Kahve Çekirdeği', amount: 60, unit: 'g' }, { name: 'Sıcak Su', amount: 1000, unit: 'ml' }],
    steps: [
      'Filtre kağıdını sepete yerleştirip durulayın.',
      'Öğütülmüş kahveyi sepete yayın.',
      'Makinenin demleme döngüsünü başlatın.'
    ]
  },

  // 2. SOĞUK KLASİKLER (16 - 28)
  {
    id: 16, name: 'Iced Americano', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Espressoyu doğrudan buzun üstüne dökerek şoklayın, asitliği dengelenir.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Su', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 6, unit: 'adet' }],
    steps: [
      'Uzun şeffaf bardağı 6 adet buzla doldurun.',
      'Bardağa 150 ml soğuk su ekleyin.',
      'Double shot espresso (38g) hazırlayıp doğrudan buzların üzerine yavaşça dökün.'
    ]
  },
  {
    id: 17, name: 'Iced Latte', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Katmanlı görüntüyü korumak için espressoyu bardağın kenarından yavaşça süzün.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Süt', amount: 180, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa 5 adet buz ve 180 ml soğuk süt ekleyin.',
      'Double shot espressoyu sütün üzerine yavaşça akıtarak servis yapın.'
    ]
  },
  {
    id: 18, name: 'Iced Flat White', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kahve sütün içine yavaş süzülerek yayılmalıdır.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Süt', amount: 130, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa 5 adet buz ve 130 ml soğuk süt ekleyin.',
      'Double shot espressoyu sütün üzerine dairesel dökün.'
    ]
  },
  {
    id: 19, name: 'Iced Cappuccino', category: 'Soğuk Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Soğuk süt köpüğü yoğun ve parlak olmalıdır.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Süt Köpüğü', amount: 80, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa buz ve double shot espresso ekleyin.',
      'Yağsız soğuk sütü süt köpürtücü mikser ile çırparak yoğun köpük elde edin.',
      'Köpüğü bardağın üzerine yayarak katman oluşturun.'
    ]
  },
  {
    id: 20, name: 'Iced Mocha', category: 'Soğuk Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Çikolata sosu ve espressoyu sıcakken çalkalamak tadı bütünleştirir.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Bitter Çikolata Sosu', amount: 20, unit: 'g' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Çikolata sosunu ve sıcak espressoyu karıştırarak eritin.',
      'Bardağa buzları ve soğuk sütü ekleyin.',
      'Espresso-çikolata karışımını sütün üzerine yavaşça dökün.'
    ]
  },
  {
    id: 21, name: 'Iced White Mocha', category: 'Soğuk Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kremşanti kullanılıyorsa üzerine beyaz çikolata rendesi ekleyin.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Beyaz Çikolata Sosu', amount: 20, unit: 'g' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Beyaz çikolata sosu ve sıcak espressoyu karıştırın.',
      'Buzlu bardağa soğuk süt ekleyin.',
      'Karışımı yavaşça dökün.'
    ]
  },
  {
    id: 22, name: 'Cold Brew (Klasik)', category: 'Soğuk Klasikler', prepTime: '18 sa', difficulty: 'Zor', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: '18 saatten fazla bekletmek kahvede acılığa yol açar.',
    ingredients: [{ name: 'Süzülmüş Cold Brew', amount: 150, unit: 'ml' }, { name: 'Büyük Küre Buz', amount: 1, unit: 'adet' }],
    steps: [
      'Kahveyi ve soğuk suyu bir hazneye koyup karıştırın.',
      'Kapağını kapatıp buzdolabında 18 saat demlenmeye bırakın.',
      'Filtre kağıdından süzün, büyük bir buz küpüyle servis yapın.'
    ]
  },
  {
    id: 23, name: 'Nitro Cold Brew', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Azot gazı bardağın kenarından yavaşça süzülmelidir.',
    ingredients: [{ name: 'Dispenser Cold Brew', amount: 250, unit: 'ml' }, { name: 'Azot Gazı (Nitro)', amount: 1, unit: 'şarj' }],
    steps: [
      'Önceden demlenmiş cold brew kahveyi nitro dispenser tankına koyun.',
      'Azot gazı ile şarj edin.',
      'Bira bardağına dispenser yardımıyla yavaşça doldurun.'
    ]
  },
  {
    id: 24, name: 'Affogato al Caffè', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk / Sıcak', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Dondurmanın erimesini önlemek için espressoyu servis anında dökün.',
    ingredients: [{ name: 'Vanilyalı Dondurma', amount: 1, unit: 'top' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }],
    steps: [
      'Kaseye 1 top vanilyalı dondurma koyun.',
      'Üzerine taze demlenmiş sıcak double shot espressoyu gezdirin.'
    ]
  },
  {
    id: 25, name: 'Iced Turkish Coffee', category: 'Soğuk Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kahveyi süzmeden önce fincana buz eklemeyin, shaker kullanın.',
    ingredients: [{ name: 'Pişmiş Türk Kahvesi', amount: 65, unit: 'ml' }, { name: 'Soğuk Süt', amount: 65, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Türk kahvesini suyla pişirip oda sıcaklığına getirin.',
      'Shaker içine buz, soğuk süt ve pişmiş kahveyi ekleyin.',
      '10 saniye çalkalayıp köpüklü olarak bardağa süzün.'
    ]
  },
  {
    id: 26, name: 'Cold Brew Latte', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Cold brew sütün tatlılığını mükemmel dengeler.',
    ingredients: [{ name: 'Cold Brew Konsantresi', amount: 80, unit: 'ml' }, { name: 'Soğuk Süt', amount: 120, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa buzları yerleştirin.',
      'Soğuk sütü ekleyin.',
      'Üzerine cold brew konsantresini ekleyip yavaşça karıştırın.'
    ]
  },
  {
    id: 27, name: 'Espresso Freddo', category: 'Soğuk Klasikler', prepTime: '2 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Hızlı çalkalamak kremsi bir köpük oluşturur.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 6, unit: 'adet' }],
    steps: [
      'Double shot espressoyu shaker içine alın.',
      'Buz ekleyip 15 saniye sertçe çalkalayın.',
      'Köpüklü karışımı süzerek bardağa dökün.'
    ]
  },
  {
    id: 28, name: 'Freddo Cappuccino', category: 'Soğuk Klasikler', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Süt kremasını yavaşça dökerek katmanları koruyun.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Yağsız Süt Kreması', amount: 80, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Espresso Freddoyu hazırlayıp buzlu bardağa dökün.',
      'Soğuk yağsız sütü mikser yardımıyla krema kıvamına gelene kadar çırpın.',
      'Kremayı kahvenin üzerine yavaşça ekleyin.'
    ]
  },

  // 3. SICAK KARIŞIMLAR (29 - 46)
  {
    id: 29, name: 'Källa Velvet Latte', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Zor', temp: '93.5°C / 60°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Gül esansı miktarını aşmayın, aksi halde parfüm kokusu oluşur. Kadifemsi pembe yüzey elde edin.',
    ingredients: [{ name: 'Ruby/Beyaz Çikolata Sosu', amount: 15, unit: 'g' }, { name: 'Doğal Gül Hidrolatı', amount: 2, unit: 'damla' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Pembe Süt (Pancar Özlü)', amount: 200, unit: 'ml' }, { name: 'Kuru Gül Yaprakları', amount: 4, unit: 'adet' }],
    steps: [
      'Fincanın dibine çikolata sosu ve gül esansını ekleyin.',
      'Double shot espressoyu çekip pürüzsüzce karıştırın.',
      'Sütü köpürtürken içine doğal pancar özü ekleyip pembe süt elde edin.',
      'Kahvenin üzerine döküp gül yapraklarıyla süsleyin.'
    ]
  },
  {
    id: 30, name: 'Fjord Spiced Flat White', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 60°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kakuleyi sepet içindeki kahvenin üzerine serpiştirip tamp edin. Bu işlem aromayı kahvenin içine hapseder.',
    ingredients: [{ name: 'Kakule Tozu', amount: 0.25, unit: 'çay kaşığı' }, { name: 'Organik Akçaağaç Şurubu', amount: 15, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 130, unit: 'ml' }],
    steps: [
      'Kakuleyi sepet içindeki kahvenin üzerine serpiştirip tamp edin.',
      'Fincana akçaağaç şurubunu ekleyin.',
      'Kahveyi şurubun üstüne çekip karıştırın.',
      'Kadifemsi sütü flat white kıvamında ekleyin.'
    ]
  },
  {
    id: 31, name: 'Nordic Forest Mocha', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Bitter çikolata ve yaban mersini aroması kahveyle pürüzsüzce karıştırılmalıdır.',
    ingredients: [{ name: 'Bitter Çikolata Sosu', amount: 15, unit: 'g' }, { name: 'Yaban Mersini Şurubu', amount: 10, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }, { name: 'Krem Şanti', amount: 20, unit: 'g' }, { name: 'Taze Yaban Mersini', amount: 3, unit: 'adet' }],
    steps: [
      'Fincana bitter çikolata sosu ve yaban mersini şurubu ekleyin.',
      'Double shot espressoyu çekip iyice karıştırarak eritin.',
      'Köpürtülmüş sıcak sütü ekleyip karıştırın.',
      'Üzerine krem şanti sıkıp yaban mersini taneleriyle süsleyin.'
    ]
  },
  {
    id: 32, name: 'Linen Amber Brew', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '90°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Esmer şekeri yakarken pürmüzü 10 cm uzaktan dairesel hareketlerle tutun.',
    ingredients: [{ name: 'Tuzlu Karamel Sosu', amount: 15, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }, { name: 'Esmer Şeker (Pürmüzlenecek)', amount: 1, unit: 'tatlı kaşığı' }],
    steps: [
      'Kupaya karamel sosu ve sıcak espressoyu alıp karıştırın.',
      'Sıcak sütü latte kıvamında ekleyin.',
      'Üzerine esmer şeker serpiştirip pürmüzle yakın.'
    ]
  },
  {
    id: 33, name: 'Smoky Roastery Latte', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Tütsü şurubu yoğun bir meşe aroması katar.',
    ingredients: [{ name: 'Tütsü Aromalı Karamel Şurubu', amount: 15, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 200, unit: 'ml' }],
    steps: [
      'Bardağa tütsülü karamel şurubunu koyun.',
      'Double shot espressoyu üzerine akıtıp karıştırın.',
      'Köpürtülmüş sıcak sütü yavaşça ilave edin.'
    ]
  },
  {
    id: 34, name: 'Polar Hazelnut Crunch', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz', 'Kuruyemiş'], tags: ['Glutensiz'],
    proTip: 'Fındık parçalarını en son krem şantinin üzerine serpin.',
    ingredients: [{ name: 'Fındık Pralin Sosu', amount: 20, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }, { name: 'Kavrulmuş Fındık Kırıkları', amount: 1, unit: 'tatlı kaşığı' }],
    steps: [
      'Fındık pralin sosu ve espressoyu fincanda karıştırın.',
      'Köpürtülmüş sıcak sütü ekleyin.',
      'Üzerine krem şanti sıkıp fındık kırıklarını serpin.'
    ]
  },
  {
    id: 35, name: 'Cinnamon Birch Latte', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Tarçın tozu huş şurubunun tatlılığını dengeler.',
    ingredients: [{ name: 'Huş Ağacı Şurubu', amount: 15, unit: 'ml' }, { name: 'Toz Tarçın', amount: 0.5, unit: 'çay kaşığı' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 200, unit: 'ml' }],
    steps: [
      'Huş şurubunu ve tarçını bardağa ekleyin.',
      'Espressoyu üzerine akıtıp karıştırın.',
      'Sıcak sütü dökün.'
    ]
  },
  {
    id: 36, name: 'Salted Honey Cortado', category: 'Sıcak Karışımlar', prepTime: '2 dk', difficulty: 'Kolay', temp: '93.5°C / 60°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Deniz tuzunu en son süt köpüğünün üzerine serpiştirin.',
    ingredients: [{ name: 'Süzme Çiçek Balı', amount: 10, unit: 'ml' }, { name: 'Deniz Tuzu Taneleri', amount: 3, unit: 'adet' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 40, unit: 'ml' }],
    steps: [
      'Cortado bardağına bal ve sıcak espressoyu ekleyip karıştırın.',
      'Sıcak sütü ilave edin.',
      'Üzerine 3 adet deniz tuzu tanesi serpiştirin.'
    ]
  },
  {
    id: 37, name: 'Cloudberry White Cup', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Bulut üzümü sosu İskandinavya esintisi katacaktır.',
    ingredients: [{ name: 'Bulut Üzümü Sosu', amount: 15, unit: 'ml' }, { name: 'Beyaz Çikolata Sosu', amount: 15, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }],
    steps: [
      'Sosları ve espressoyu karıştırın.',
      'Sıcak sütü yavaşça ilave edin.'
    ]
  },
  {
    id: 38, name: 'Gingerbread Roaster', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Zencefilli kurabiye adam süslemesi çocuksu bir neşe katar.',
    ingredients: [{ name: 'Zencefilli Kurabiye Şurubu', amount: 15, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 200, unit: 'ml' }, { name: 'Minik Kurabiye Adam', amount: 1, unit: 'adet' }],
    steps: [
      'Kurabiye şurubunu ve espressoyu fincanda karıştırın.',
      'Sıcak sütü dökün, krem şanti sıkıp minyatür kurabiye ile süsleyin.'
    ]
  },
  {
    id: 39, name: 'Spiced Cardamom Macchiato', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kakule aroması karamel sosuyla harika bir tezat oluşturur.',
    ingredients: [{ name: 'Kakuleli Double Espresso', amount: 1, unit: 'adet' }, { name: 'Karamel Sosu', amount: 15, unit: 'ml' }, { name: 'Sıcak Süt Köpüğü', amount: 120, unit: 'ml' }],
    steps: [
      'Kakuleli espressoyu fincandaki karamel sosunun üzerine çekin.',
      'Sıcak sütü dökün, üzerine karamel çizgileri çekin.'
    ]
  },
  {
    id: 40, name: 'Lavender Fields Latte', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Kurutulmuş lavanta tanelerini en son süt köpüğünün ortasına koyun.',
    ingredients: [{ name: 'Doğal Lavanta Şurubu', amount: 15, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 200, unit: 'ml' }, { name: 'Kurutulmuş Lavanta', amount: 5, unit: 'tane' }],
    steps: [
      'Lavanta şurubunu ve espressoyu karıştırın.',
      'Sıcak sütü ekleyin, üzerine kuru lavanta tanelerini serpin.'
    ]
  },
  {
    id: 41, name: 'Maple Pecan Flat White', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 60°C', allergens: ['Laktoz', 'Kuruyemiş'], tags: ['Glutensiz'],
    proTip: 'Ceviz kırıkları flat white köpüğünde asılı kalmalıdır.',
    ingredients: [{ name: 'Akçaağaç Şurubu', amount: 15, unit: 'ml' }, { name: 'Pikan Cevizi Aroması', amount: 10, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 130, unit: 'ml' }],
    steps: [
      'Şurup, aroma ve espressoyu karıştırın.',
      'Flat white sütünü ilave edin, üzerine ceviz parçaları serpin.'
    ]
  },
  {
    id: 42, name: 'Nordic Winter Spiced Chocolate', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Kolay', temp: '65°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Muskat rendesi kış sıcaklığını en üst seviyeye çıkarır.',
    ingredients: [{ name: 'Kakao Tozu (Belçika Çikolatası)', amount: 25, unit: 'g' }, { name: 'Toz Zencefil & Tarçın & Muskat', amount: 1, unit: 'tutam' }, { name: 'Sıcak Süt', amount: 200, unit: 'ml' }],
    steps: [
      'Çikolata ve kış baharatlarını fincanda karıştırın.',
      'Sıcak sütle köpürterek pürüzsüzce karıştırın, üzerine muskat rendeleyin.'
    ]
  },
  {
    id: 43, name: 'Pistachio Matcha Latte', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Zor', temp: '80°C / 60°C', allergens: ['Laktoz', 'Kuruyemiş'], tags: ['Glutensiz'],
    proTip: 'Fıstık ezmesini Matcha çırpmadan önce sütte eritin.',
    ingredients: [{ name: 'Matcha Tozu', amount: 2, unit: 'g' }, { name: 'Antep Fıstığı Ezmesi', amount: 15, unit: 'g' }, { name: 'Sıcak Süt', amount: 180, unit: 'ml' }],
    steps: [
      'Fıstık ezmesini sıcak sütle karıştırın.',
      'Matcha tozunu 30 ml sıcak suyla köpürtün.',
      'Fıstıklı sıcak sütü Matchanın üzerine dökün.'
    ]
  },
  {
    id: 44, name: 'Orange Blossom Mocha', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Portakal kabuğu rendesi aromayı taze tutar.',
    ingredients: [{ name: 'Portakal Çiçeği Suyu', amount: 5, unit: 'ml' }, { name: 'Bitter Çikolata', amount: 20, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }],
    steps: [
      'Portakal çiçeği suyu, çikolata ve espressoyu karıştırın.',
      'Sıcak süt ekleyip portakal kabuğu rendeleyin.'
    ]
  },
  {
    id: 45, name: 'Red Velvet Mocha', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: '93.5°C / 62°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Red velvet sosu tatlı ve kremamsı bir doku sunar.',
    ingredients: [{ name: 'Red Velvet Şurubu/Sosu', amount: 20, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 150, unit: 'ml' }],
    steps: [
      'Kırmızı sosu ve espressoyu karıştırın.',
      'Sıcak sütü döküp üzerine beyaz çikolata kreması ekleyin.'
    ]
  },
  {
    id: 46, name: 'Chai Latte Macchiato', category: 'Sıcak Karışımlar', prepTime: '3 dk', difficulty: 'Kolay', temp: '65°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Chai baharatları ve süt köpüğü mükemmel kış içeceğidir.',
    ingredients: [{ name: 'Chai Baharatları Tozu', amount: 15, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Sıcak Süt', amount: 180, unit: 'ml' }],
    steps: [
      'Chai tozunu ve espressoyu karıştırın.',
      'Bol sıcak süt köpüğü ekleyip üzerine tarçın serpin.'
    ]
  },

  // 4. SOĞUK KARIŞIMLAR (47 - 64)
  {
    id: 47, name: 'Aurora Cold Brew', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Zor', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Mürver çiçeğinin şeffaf tonunu korumak için toniği yavaş dökün.',
    ingredients: [{ name: 'Mürver Çiçeği Şurubu', amount: 10, unit: 'ml' }, { name: 'Premium Tonik', amount: 120, unit: 'ml' }, { name: 'Cold Brew', amount: 60, unit: 'ml' }, { name: 'Buz Küpü', amount: 6, unit: 'adet' }],
    steps: [
      'Mürver çiçeği şurubunu bardağa ekleyin.',
      'Bardağı tamamen buzla doldurun.',
      'Toniği yavaşça buz üzerinden dökün.',
      'En üstte Cold Brew kahvesini bar kaşığıyla yavaşça akıtın.'
    ]
  },
  {
    id: 48, name: 'Midnight Sun Latte', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Aktif karbon sütü tamamen siyah yapmalıdır.',
    ingredients: [{ name: 'Aktif Karbon Tozu', amount: 1.5, unit: 'g' }, { name: 'Tuzlu Karamel Sosu', amount: 15, unit: 'ml' }, { name: 'Soğuk Süt', amount: 180, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Sütü aktif karbonla shakerda çalkalayıp siyah yapın.',
      'Bardağın kenarlarına karamel sosu gezdirin, buz ekleyin.',
      'Siyah sütü dökün, üzerine yavaşça espressoyu ekleyin.'
    ]
  },
  {
    id: 49, name: 'Polar Berry Shakerato', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Meyve püresi kahveye asidik ve taze bir doku kazandırır.',
    ingredients: [{ name: 'Orman Meyveleri Püresi', amount: 20, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Shaker içine espresso, meyve püresi ve buz ekleyin.',
      '15 saniye sertçe çalkalayın.',
      'Kadeh bardağına süzerek servis edin.'
    ]
  },
  {
    id: 50, name: 'Glacier Mint Mocha', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Nane yağı aromasının ferahlığı espressoyla uyumludur.',
    ingredients: [{ name: 'Doğal Nane Yağı Aroması', amount: 3, unit: 'damla' }, { name: 'Bitter Çikolata Sosu', amount: 20, unit: 'g' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Çikolata, nane ve espressoyu karıştırın.',
      'Buzlu bardağa soğuk süt ekleyip üzerine bu karışımı dökün.'
    ]
  },
  {
    id: 51, name: 'Nordic Summer Frappe', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Hindistan cevizi sütü frappe kıvamını kremsi yapar.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Hindistan Cevizi Sütü', amount: 150, unit: 'ml' }, { name: 'Ananas Şurubu', amount: 15, unit: 'ml' }, { name: 'Kırık Buz', amount: 1, unit: 'bardak' }],
    steps: [
      'Tüm malzemeleri blender haznesine ekleyin.',
      'Karışım pürüzsüz buzlu kıvam alana kadar çekin.',
      'Bardağa döküp ananas dilimiyle süsleyin.'
    ]
  },
  {
    id: 52, name: 'Cold Brew Tonic', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Lime limon dilimi tonik acılığını dengeler.',
    ingredients: [{ name: 'Cold Brew Kahvesi', amount: 80, unit: 'ml' }, { name: 'Premium Tonik', amount: 120, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }, { name: 'Lime Limon Dilimi', amount: 1, unit: 'adet' }],
    steps: [
      'Bardağa buzları ve toniği dökün.',
      'Üzerine yavaşça cold brew ekleyin.',
      'Limon dilimiyle süsleyin.'
    ]
  },
  {
    id: 53, name: 'Salted Caramel Cold Foam', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Deniz tuzu köpüğü çok hafif karamelize hissettirmelidir.',
    ingredients: [{ name: 'Cold Brew Kahvesi', amount: 150, unit: 'ml' }, { name: 'Deniz Tuzlu Karamel Süt Köpüğü', amount: 80, unit: 'ml' }, { name: 'Buz Küpü', amount: 4, unit: 'adet' }],
    steps: [
      'Bardağa buzları ve cold brew kahveyi ekleyin.',
      'Karamel soslu ve hafif tuzlu süt köpüğünü mikserde çırpın.',
      'Köpüğü bardağın üzerine yayın.'
    ]
  },
  {
    id: 54, name: 'Peach Cobbler Iced Latte', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Bisküvi kırıntılarını en son bardağın kenarına ekleyin.',
    ingredients: [{ name: 'Şeftali Püresi', amount: 20, unit: 'g' }, { name: 'Bisküvi Şurubu', amount: 10, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağın dibine şeftali püresi ve şurubu ekleyin.',
      'Buz, süt ve espresso ekleyip hafifçe karıştırın.'
    ]
  },
  {
    id: 55, name: 'Blue Lagoon Iced Latte', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Mavi rengin altta belirgin durması katmanlamayı güzelleştirir.',
    ingredients: [{ name: 'Mavi Curaçao (Alkolsüz)', amount: 15, unit: 'ml' }, { name: 'Vanilya Şurubu', amount: 10, unit: 'ml' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa mavi curaçao ve vanilya ekleyin.',
      'Buz ve soğuk sütü ekleyin.',
      'Espressoyu en son dökün.'
    ]
  },
  {
    id: 56, name: 'Rose Quartz Iced Mocha', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Ruby çikolata sosu içeceğe pembe bir ton verecektir.',
    ingredients: [{ name: 'Ruby Çikolata Sosu', amount: 20, unit: 'g' }, { name: 'Çilek Şurubu', amount: 10, unit: 'ml' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Çikolata ve çilek şurubunu karıştırın.',
      'Buzlu bardağa süt ekleyin.',
      'Espresso karışımını ilave edin.'
    ]
  },
  {
    id: 57, name: 'Nitro Passion Fruit', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Çarkıfelek meyvesi asitliği nitro kremasıyla uyumludur.',
    ingredients: [{ name: 'Çarkıfelek Meyvesi Püresi', amount: 20, unit: 'g' }, { name: 'Nitro Cold Brew', amount: 200, unit: 'ml' }],
    steps: [
      'Bardağa çarkıfelek meyve püresini dökün.',
      'Üzerine nitro cold brew kahveyi dispenser yardımıyla ekleyin.'
    ]
  },
  {
    id: 58, name: 'Coconut Espresso Shake', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Hindistan cevizi dondurması ile pürüzsüz olana dek çekilmelidir.',
    ingredients: [{ name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Hindistan Cevizi Dondurması', amount: 1, unit: 'top' }, { name: 'Soğuk Süt', amount: 100, unit: 'ml' }],
    steps: [
      'Espresso, dondurma ve sütü blenderda çekin.',
      'Bardağa döküp hindistan cevizi rendesi serpin.'
    ]
  },
  {
    id: 59, name: 'Iced Pistachio Matcha', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Zor', temp: 'Soğuk', allergens: ['Laktoz', 'Kuruyemiş'], tags: ['Glutensiz'],
    proTip: 'Fıstık ezmesini sütün içine iyice mikserleyin.',
    ingredients: [{ name: 'Matcha Tozu', amount: 2, unit: 'g' }, { name: 'Antep Fıstığı Ezmesi', amount: 15, unit: 'g' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Fıstık ezmesini sütle karıştırıp buzlu bardağa dökün.',
      'Matchayı çırpıp bu sütün üzerine ekleyin.'
    ]
  },
  {
    id: 60, name: 'Eucalyptus Iced Brew', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Okaliptüs ferahlığı maden suyuyla harika köpürür.',
    ingredients: [{ name: 'Okaliptüs Şurubu', amount: 15, unit: 'ml' }, { name: 'Cold Brew', amount: 80, unit: 'ml' }, { name: 'Maden Suyu', amount: 100, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa okaliptüs şurubu ve buz ekleyin.',
      'Maden suyu ve cold brew ekleyip yavaşça karıştırın.'
    ]
  },
  {
    id: 61, name: 'Smoked Vanilla Iced Brew', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Tütsülenmiş vanilya şurubu asitliği azaltır.',
    ingredients: [{ name: 'Tütsülenmiş Vanilya Şurubu', amount: 15, unit: 'ml' }, { name: 'Cold Brew', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 4, unit: 'adet' }],
    steps: ['Bardağa şurubu, buzları ve cold brew kahveyi ekleyip karıştırın.']
  },
  {
    id: 62, name: 'Watermelon Espresso Tonic', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Karpuz püresinin taze olması tadı doğrudan etkiler.',
    ingredients: [{ name: 'Karpuz Püresi', amount: 20, unit: 'g' }, { name: 'Tonik', amount: 100, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Bardağa karpuz püresi ve buz koyun.',
      'Toniği dökün, en üstüne espressoyu ekleyin.'
    ]
  },
  {
    id: 63, name: 'Tonic Ginger Espresso', category: 'Soğuk Karışımlar', prepTime: '2 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Zencefil acılığı kahve asitliğini keskinleştirir.',
    ingredients: [{ name: 'Zencefil Özütü', amount: 5, unit: 'ml' }, { name: 'Tonik', amount: 120, unit: 'ml' }, { name: 'Double Shot Espresso', amount: 1, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: [
      'Zencefil ve toniği buzlu bardağa ekleyin.',
      'Espressoyu üzerine ekleyip lime limon dilimiyle süsleyin.'
    ]
  },
  {
    id: 64, name: 'Iced Chai Cream Tea', category: 'Soğuk Karışımlar', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Vanilyalı krema katmanı üstte kalın kalmalıdır.',
    ingredients: [{ name: 'Chai Baharatları', amount: 15, unit: 'g' }, { name: 'Soğuk Süt', amount: 150, unit: 'ml' }, { name: 'Vanilyalı Soğuk Krema', amount: 50, unit: 'ml' }],
    steps: [
      'Chai ve sütü buzla çalkalayıp bardağa dökün.',
      'Üzerine soğuk vanilyalı krema dökün.'
    ]
  },

  // 5. BİTKİ ÇAYLARI & DEMLEMELER (65 - 76)
  {
    id: 65, name: 'Källa Blend Siyah Çay', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: '95°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Bergamot aroması taze demlemede korunmalıdır.',
    ingredients: [{ name: 'Siyah Çay / Bergamot Harmanı', amount: 3, unit: 'g' }, { name: 'Sıcak Su', amount: 150, unit: 'ml' }],
    steps: ['Çay yapraklarını süzgeçle sıcak suya koyun.', '5 dakika demlendirip yaprakları çıkarın.']
  },
  {
    id: 66, name: 'Jasmine Green Tea', category: 'Bitki Çayları', prepTime: '4 dk', difficulty: 'Kolay', temp: '85°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Yeşil çayı 85°C sıcak suyla demlendirin.',
    ingredients: [{ name: 'Yaseminli Yeşil Çay Yaprakları', amount: 3, unit: 'g' }, { name: 'Sıcak Su (85°C)', amount: 200, unit: 'ml' }],
    steps: ['Yeşil çayı sıcak suya ekleyin.', '4 dakika demlendirip süzün.']
  },
  {
    id: 67, name: 'Hibiscus Nordic Punch', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: '90°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Tarçın çubuğu sıcak pançta demlenirken durmalıdır.',
    ingredients: [{ name: 'Hibiskus, Elma ve Karanfil', amount: 5, unit: 'g' }, { name: 'Tarçın Çubuğu', amount: 1, unit: 'adet' }, { name: 'Sıcak Su (90°C)', amount: 200, unit: 'ml' }],
    steps: ['Hibiskus karışımını sıcak suda 5 dakika demlendirin.', 'Çay bardağına tarçın çubuğunu yerleştirip çayı süzün.']
  },
  {
    id: 68, name: 'Rooibos Vanilla Infusion', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: '95°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Rooibos kafeinsizdir, akşam sunumları için idealdir.',
    ingredients: [{ name: 'Rooibos ve Vanilya Çubuğu', amount: 4, unit: 'g' }, { name: 'Sıcak Su', amount: 200, unit: 'ml' }],
    steps: ['Rooibos ve vanilya harmanını sıcak suda 5 dakika demlendirip süzün.']
  },
  {
    id: 69, name: 'Linden & Pine Honey', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: '90°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Çam balını çay demlendikten sonra ilave edin.',
    ingredients: [{ name: 'Ihlamur Çiçekleri', amount: 3, unit: 'g' }, { name: 'Çam Balı', amount: 1, unit: 'tatlı kaşığı' }, { name: 'Limon Dilimi', amount: 1, unit: 'adet' }],
    steps: ['Ihlamuru sıcak suda demlendirin.', 'Süzdükten sonra bal ve limon dilimi ilave edip karıştırın.']
  },
  {
    id: 70, name: 'Mint & Ginger Detox', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: '90°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Taze zencefil dilimi boğazı yumuşatır.',
    ingredients: [{ name: 'Taze Nane Yaprakları', amount: 5, unit: 'adet' }, { name: 'Zencefil Dilimi', amount: 2, unit: 'dilim' }, { name: 'Limon Kabukları', amount: 2, unit: 'tane' }, { name: 'Sıcak Su', amount: 200, unit: 'ml' }],
    steps: ['Tüm malzemeleri demliğe yerleştirin.', 'Sıcak su ekleyip 5 dakika bekletin.']
  },
  {
    id: 71, name: 'Iced Hibiscus Berry Tea', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Böğürtlenleri buzlarla birlikte bardağa ekleyin.',
    ingredients: [{ name: 'Hibiskus Çayı', amount: 150, unit: 'ml' }, { name: 'Taze Ahududu/Çilek', amount: 4, unit: 'adet' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: ['Hibiskusu demleyip soğutun.', 'Buz ve meyveleri bardağa koyup üzerine çayı süzün.']
  },
  {
    id: 72, name: 'Iced Matcha Lemonade', category: 'Bitki Çayları', prepTime: '3 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Matcha limonatanın üstünde katman oluşturmalıdır.',
    ingredients: [{ name: 'Matcha Tozu', amount: 1.5, unit: 'g' }, { name: 'Ev Yapımı Limonata', amount: 150, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: ['Matchayı 30 ml sıcak suyla köpürterek hazırlayın.', 'Limonatayı buzlu bardağa dökün.', 'Matchayı yavaşça limonatanın üzerine dökün.']
  },
  {
    id: 73, name: 'Mürver Çiçeği & Elmalı Soğuk Çay', category: 'Bitki Çayları', prepTime: '3 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Mürver çiçeği yeşil çaya tatlı bir aroma katar.',
    ingredients: [{ name: 'Soğuk Yeşil Çay', amount: 150, unit: 'ml' }, { name: 'Mürver Çiçeği Şurubu', amount: 15, unit: 'ml' }, { name: 'Elma Dilimleri', amount: 3, unit: 'adet' }],
    steps: ['Buzlu bardağa şurubu, elma dilimlerini ve yeşil çayı ekleyip karıştırın.']
  },
  {
    id: 74, name: 'Lavender & Lemon Iced Infusion', category: 'Bitki Çayları', prepTime: '4 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Bal limonun asitliğini kırar.',
    ingredients: [{ name: 'Soğuk Lavanta Çayı', amount: 150, unit: 'ml' }, { name: 'Limon Suyu', amount: 20, unit: 'ml' }, { name: 'Bal', amount: 15, unit: 'ml' }, { name: 'Buz Küpü', amount: 5, unit: 'adet' }],
    steps: ['Bal, limon suyu ve lavanta çayını buzla çalkalayıp bardağa süzün.']
  },
  {
    id: 75, name: 'Chai Tea Latte (Sıcak)', category: 'Bitki Çayları', prepTime: '3 dk', difficulty: 'Kolay', temp: '65°C', allergens: ['Laktoz'], tags: ['Glutensiz'],
    proTip: 'Köpüğün üzerine tarçınla desen yapabilirsiniz.',
    ingredients: [{ name: 'Chai Baharatları Tozu', amount: 15, unit: 'g' }, { name: 'Sıcak Süt', amount: 180, unit: 'ml' }],
    steps: ['Chai tozunu fincana ekleyin.', 'Sıcak sütle birlikte köpürterek pürüzsüzce karıştırın.']
  },
  {
    id: 76, name: 'Chamomile Lavender Infusion', category: 'Bitki Çayları', prepTime: '5 dk', difficulty: 'Kolay', temp: '90°C', allergens: [], tags: ['Glutensiz', 'Vegan'],
    proTip: 'Papatyalar uykudan önce sakinleştirici etki sunar.',
    ingredients: [{ name: 'Kurutulmuş Papatya ve Lavanta', amount: 4, unit: 'g' }, { name: 'Sıcak Su', amount: 200, unit: 'ml' }],
    steps: ['Papatya ve lavantayı sıcak suda 5 dakika demlendirip süzün.']
  },

  // 6. PASTANE (77 - 90)
  {
    id: 77, name: 'Kardemummabullar (Kakuleli Çörek)', category: 'Pastane', prepTime: '15 dk', difficulty: 'Zor', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Kakule tohumlarını fırından çıkar çıkar çıkmaz sıcakken üzerine ekleyin. Şurup parlaklık verecektir.',
    ingredients: [{ name: 'Tereyağlı Kakule Çöreği Hamuru', amount: 1, unit: 'adet' }, { name: 'Kakule Tohumları & Şeker', amount: 10, unit: 'g' }],
    steps: [
      'Mayalanmış tereyağlı çörek hamurunu önceden ısıtılmış 180°C fırına yerleştirin.',
      '12-15 dakika altın rengi alana kadar pişirin.',
      'Çıkar çıkmaz üzerine şeker şurubu sürün.',
      'Şurubun üzerine kakule taneleri ve inci şekeri serpin.'
    ]
  },
  {
    id: 78, name: 'Kanelbullar (Tarçınlı Çörek)', category: 'Pastane', prepTime: '15 dk', difficulty: 'Zor', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Hamurun karamelize olmasını kontrol edin. Sıcakken servis edin.',
    ingredients: [{ name: 'Tereyağlı Tarçınlı Çörek Hamuru', amount: 1, unit: 'adet' }],
    steps: [
      'Önceden ısıtılmış 180°C fırında 12-15 dakika üzeri kızarana dek pişirin.',
      'Ilınmaya bırakıp servis edin.'
    ]
  },
  {
    id: 79, name: 'Sade Kruvasan (Butter Croissant)', category: 'Pastane', prepTime: '10 dk', difficulty: 'Orta', temp: '190°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Dışı çıtır olması için 190°C fırında pişerken fırın kapağını açmayın.',
    ingredients: [{ name: 'Tereyağlı Kruvasan Hamuru', amount: 1, unit: 'adet' }],
    steps: [
      'Kruvasan hamurunu yağlı kağıt serili tepsiye alın.',
      '190°C fırında 10 dakika pişirin.'
    ]
  },
  {
    id: 80, name: 'Bademli Kruvasan (Almond Croissant)', category: 'Pastane', prepTime: '12 dk', difficulty: 'Zor', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz', 'Kuruyemiş'], tags: [],
    proTip: 'Badem dolgusu (franjipan) fırında kabaracaktır.',
    ingredients: [{ name: 'Kruvasan', amount: 1, unit: 'adet' }, { name: 'Badem Kreması (Franjipan)', amount: 25, unit: 'g' }, { name: 'File Badem', amount: 10, unit: 'g' }],
    steps: [
      'Kruvasanı ortadan kesip içine badem kreması sürün.',
      'Üstüne de badem kreması sürüp file badem serpiştirin.',
      '180°C fırında 10-12 dakika pişirin.'
    ]
  },
  {
    id: 81, name: 'Çikolatalı Kruvasan (Pain au Chocolat)', category: 'Pastane', prepTime: '10 dk', difficulty: 'Orta', temp: '190°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Çikolata dolgusu akışkan kalmalıdır.',
    ingredients: [{ name: 'Çikolatalı Kruvasan Hamuru', amount: 1, unit: 'adet' }],
    steps: [
      'Hamuru tepsiye yerleştirin.',
      '190°C fırında 10 dakika çıtırlaşana dek pişirin.'
    ]
  },
  {
    id: 82, name: 'Källa Lemon Cake', category: 'Pastane', prepTime: '30 dk', difficulty: 'Orta', temp: '175°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Kek tamamen soğumadan glazesini dökerseniz şurup eriyip akar.',
    ingredients: [{ name: 'Limonlu Kek Hamuru', amount: 1, unit: 'dilim' }, { name: 'Limon Glazesi', amount: 20, unit: 'g' }],
    steps: [
      'Limonlu kek harcını kalıba döküp 175°C fırında 30 dakika pişirin.',
      'Kek soğuduktan sonra limon and pudra şekeri glazesi sürün.'
    ]
  },
  {
    id: 83, name: 'Salted Caramel Brownie', category: 'Pastane', prepTime: '25 dk', difficulty: 'Orta', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'İçinin ıslak kalması için kürdan testi hafif nemli çıkmalıdır.',
    ingredients: [{ name: 'Belçika Çikolatalı Brownie Harcı', amount: 1, unit: 'porsiyon' }, { name: 'Karamel Sosu', amount: 20, unit: 'ml' }, { name: 'Deniz Tuzu', amount: 1, unit: 'tutam' }],
    steps: [
      'Brownie harcını kalıba yayın, üzerine karamel sosu gezdirin.',
      'Deniz tuzu serpiştirip 180°C fırında 22 dakika pişirin.'
    ]
  },
  {
    id: 84, name: 'San Sebastian Cheesecake', category: 'Pastane', prepTime: '40 dk', difficulty: 'Zor', temp: '220°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Fırından çıkarınca jöle gibi sallanmalıdır, dolapta kıvam alır.',
    ingredients: [{ name: 'Krema Peynir Harcı', amount: 1, unit: 'porsiyon' }],
    steps: [
      'Peynir ve krema harcını kalıba dökün.',
      '220°C fırında 26-28 dakika pişirip oda sıcaklığında soğutun.'
    ]
  },
  {
    id: 85, name: 'Raspberry & Pistachio Tart', category: 'Pastane', prepTime: '20 dk', difficulty: 'Zor', temp: 'Oda Sıcaklığı', allergens: ['Gluten', 'Süt/Laktoz', 'Kuruyemiş'], tags: [],
    proTip: 'Ahududuların taze ve kuru olmasına dikkat edin, sulanmamalıdır.',
    ingredients: [{ name: 'Pişmiş Tart Hamuru', amount: 1, unit: 'adet' }, { name: 'Fıstık Kreması', amount: 30, unit: 'g' }, { name: 'Taze Ahududu', amount: 12, unit: 'adet' }],
    steps: [
      'Tart tabanına fıstık kremasını sıkıp yayın.',
      'Üzerine ahududuları yan yana dizerek süsleyin.'
    ]
  },
  {
    id: 86, name: 'Double Chocolate Cookie', category: 'Pastane', prepTime: '12 dk', difficulty: 'Kolay', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Çıktığında yumuşaktır, ızgarada bekledikçe çıtırlaşır.',
    ingredients: [{ name: 'Çikolatalı Kurabiye Hamuru', amount: 1, unit: 'adet' }],
    steps: [
      'Kurabiye hamurlarını aralıklı dizin.',
      '180°C fırında 10-12 dakika pişirin.'
    ]
  },
  {
    id: 87, name: 'Nordic Blueberry Scone', category: 'Pastane', prepTime: '18 dk', difficulty: 'Orta', temp: '190°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Hamuru çok yoğurursanız scone sert olur.',
    ingredients: [{ name: 'Scone Hamuru', amount: 1, unit: 'adet' }, { name: 'Taze Yaban Mersini', amount: 20, unit: 'g' }],
    steps: [
      'Hamurun içine ezmeden yaban mersinlerini katın.',
      'Dilimleyip 190°C fırında 15 dakika pişirin.'
    ]
  },
  {
    id: 88, name: 'Red Velvet Cookie', category: 'Pastane', prepTime: '12 dk', difficulty: 'Kolay', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'İçindeki beyaz çikolata dolgusu ısırınca akmalıdır.',
    ingredients: [{ name: 'Red Velvet Kurabiye Hamuru', amount: 1, unit: 'adet' }, { name: 'Beyaz Çikolata Dolgusu', amount: 10, unit: 'g' }],
    steps: [
      'Kırmızı kurabiye hamurunun ortasına çikolata dolgusu koyup kapatın.',
      '180°C fırında 10 dakika pişirin.'
    ]
  },
  {
    id: 89, name: 'Vegan Banana Bread', category: 'Pastane', prepTime: '40 dk', difficulty: 'Orta', temp: '175°C', allergens: ['Gluten'], tags: ['Vegan'],
    proTip: 'Olgun muzlar kekin nemli kalmasını sağlar.',
    ingredients: [{ name: 'Vegan Muzlu Kek Harcı', amount: 1, unit: 'dilim' }],
    steps: [
      'Harcı kalıba döküp üzerine muz dilimleri koyun.',
      '175°C fırında 35 dakika pişirin.'
    ]
  },
  {
    id: 90, name: 'Glutensiz Orman Meyveli Muffin', category: 'Pastane', prepTime: '20 dk', difficulty: 'Orta', temp: '180°C', allergens: [], tags: ['Glutensiz'],
    proTip: 'Glutensiz unlar sıvıyı fazla çeker, muffin kaplarını aşırı doldurmayın.',
    ingredients: [{ name: 'Glutensiz Muffin Harcı', amount: 1, unit: 'adet' }, { name: 'Taze Böğürtlen', amount: 10, unit: 'g' }],
    steps: [
      'Harcı muffin kaplarına paylaştırıp üzerine taze böğürtlen yerleştirin.',
      '180°C fırında 18-20 dakika pişirin.'
    ]
  },

  // 7. Gurme Sandviçler & Tuzlular (91 - 102)
  {
    id: 91, name: 'Smoked Salmon Bagel', category: 'Sandviçler ve Tuzlular', prepTime: '5 dk', difficulty: 'Kolay', temp: 'Oda Sıcaklığı', allergens: ['Gluten', 'Balık', 'Süt/Laktoz'], tags: [],
    proTip: 'Bageli fırında hafif ısıtın ancak somon füme soğuk kalmalıdır.',
    ingredients: [{ name: 'Bagel Ekmek', amount: 1, unit: 'adet' }, { name: 'Füme Somon Dilimleri', amount: 40, unit: 'g' }, { name: 'Labne / Krem Peynir', amount: 20, unit: 'g' }, { name: 'Kapari & Dereotu', amount: 5, unit: 'g' }],
    steps: [
      'Bagel ekmeğini fırında hafifçe kızartın.',
      'İç yüzeyine taze labne peyniri sürün.',
      'Somon füme, kapari ve dereotunu ekleyip kapatın.'
    ]
  },
  {
    id: 92, name: 'Avocado Sourdough Toast', category: 'Sandviçler ve Tuzlular', prepTime: '6 dk', difficulty: 'Kolay', temp: 'Oda Sıcaklığı', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Avokadoyu limon suyuyla ezin, kararmasını önler.',
    ingredients: [{ name: 'Ekşi Mayalı Ekmek Dilimi', amount: 1, unit: 'adet' }, { name: 'Taze Avokado Püresi', amount: 40, unit: 'g' }, { name: 'Ezine Peyniri', amount: 20, unit: 'g' }, { name: 'Çeri Domates', amount: 3, unit: 'adet' }],
    steps: [
      'Ekşi maya ekmeğini tost makinesinde veya tavada çıtırlaştırın.',
      'Üzerine taze ezilmiş avokado püresini yayın.',
      'Peynir ve domates dilimlerini yerleştirip çörek otu serpin.'
    ]
  },
  {
    id: 93, name: 'Roast Beef Panini', category: 'Sandviçler ve Tuzlular', prepTime: '8 dk', difficulty: 'Orta', temp: 'Izgara / Pres', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Ballı hardal sosunu ekmeğe eşit olarak yayın.',
    ingredients: [{ name: 'Panini Ekmeği', amount: 1, unit: 'adet' }, { name: 'Rozbif Dilimleri', amount: 50, unit: 'g' }, { name: 'Cheddar Peyniri', amount: 20, unit: 'g' }, { name: 'Ballı Hardal Sosu', amount: 10, unit: 'ml' }],
    steps: [
      'Panini ekmeğinin arasına hardal sosunu sürün.',
      'Rozbif ve cheddar dilimlerini yerleştirip panini makinesinde 4 dakika presleyin.'
    ]
  },
  {
    id: 94, name: 'Turkey Croissant Sandviç', category: 'Sandviçler ve Tuzlular', prepTime: '5 dk', difficulty: 'Kolay', temp: 'Oda Sıcaklığı', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Hindi fümenin tazeliğini korumak için kruvasanı soğuk hazırlayın.',
    ingredients: [{ name: 'Taze Kruvasan', amount: 1, unit: 'adet' }, { name: 'Hindi Füme Dilimi', amount: 30, unit: 'g' }, { name: 'Gouda Peyniri', amount: 20, unit: 'g' }, { name: 'Kurutulmuş Domates Sosu', amount: 10, unit: 'g' }],
    steps: [
      'Kruvasanı ortadan kesip domates sosu sürün.',
      'Hindi füme ve gouda peyniri ekleyip yeşilliklerle kapatın.'
    ]
  },
  {
    id: 95, name: 'Spinach & Feta Quiche', category: 'Sandviçler ve Tuzlular', prepTime: '15 dk', difficulty: 'Orta', temp: '180°C', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Kişi dilimlemeden önce 3-4 dakika dinlendirin.',
    ingredients: [{ name: 'Ispanaklı Peynirli Kiş Harcı', amount: 1, unit: 'dilim' }],
    steps: [
      'Kiş dilimini 180°C fırında 6-8 dakika ısıtın.',
      'Yanında yeşilliklerle servis tabağına alın.'
    ]
  },
  {
    id: 96, name: 'Three Cheese Grilled Cheese', category: 'Sandviçler ve Tuzlular', prepTime: '6 dk', difficulty: 'Kolay', temp: 'Tavada Pres', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Tereyağını ekmeğin dış yüzeylerine sürün.',
    ingredients: [{ name: 'Ekşi Mayalı Ekmek', amount: 2, unit: 'dilim' }, { name: 'Cheddar Peyniri', amount: 20, unit: 'g' }, { name: 'Mozzarella Peyniri', amount: 20, unit: 'g' }, { name: 'Kaşar Peyniri', amount: 20, unit: 'g' }],
    steps: [
      'Ekmeklerin arasına cheddar, mozzarella ve kaşar peyniri yerleştirin.',
      'Tavada dışı çıtırlaşana dek arkalı önlü tereyağında kızartın.'
    ]
  },
  {
    id: 97, name: 'Caprese Ciabatta', category: 'Sandviçler ve Tuzlular', prepTime: '5 dk', difficulty: 'Kolay', temp: 'Oda Sıcaklığı', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Pesto sosu taze fesleğenle yapılmalıdır.',
    ingredients: [{ name: 'Ciabatta Ekmeği', amount: 1, unit: 'adet' }, { name: 'Taze Mozzarella', amount: 30, unit: 'g' }, { name: 'Dilim Domates', amount: 3, unit: 'adet' }, { name: 'Fesleğen Pesto Sosu', amount: 15, unit: 'g' }],
    steps: [
      'Ciabatta ekmeğinin içine pesto sosunu sürün.',
      'Dilimlenmiş mozzarella ve domatesleri yerleştirip kapatın.'
    ]
  },
  {
    id: 98, name: 'Hummus & Veggie Wrap', category: 'Sandviçler ve Tuzlular', prepTime: '6 dk', difficulty: 'Kolay', temp: 'Oda Sıcaklığı', allergens: ['Gluten'], tags: ['Vegan'],
    proTip: 'Wrap katlarken malzemelerin sıkışık olmasına özen görün.',
    ingredients: [{ name: 'Lavaş / Tortilla', amount: 1, unit: 'adet' }, { name: 'Ev Yapımı Humus', amount: 30, unit: 'g' }, { name: 'Közlenmiş Karışık Sebze', amount: 40, unit: 'g' }],
    steps: [
      'Lavaşın yüzeyine humusu sürün.',
      'Közlenmiş sebzeleri (biber, kabak, patlıcan) yerleştirip dürüp dilimleyin.'
    ]
  },
  {
    id: 99, name: 'Pesto & Chicken Panini', category: 'Sandviçler ve Tuzlular', prepTime: '8 dk', difficulty: 'Orta', temp: 'Izgara / Pres', allergens: ['Gluten', 'Süt/Laktoz'], tags: [],
    proTip: 'Tavukların önceden ızgaralanmış olması hızı artırır.',
    ingredients: [{ name: 'Izgara Tavuk Dilimleri', amount: 50, unit: 'g' }, { name: 'Fesleğen Pesto Sosu', amount: 15, unit: 'g' }, { name: 'Mozzarella', amount: 20, unit: 'g' }, { name: 'Panini Ekmeği', amount: 1, unit: 'adet' }],
    steps: [
      'Panini içine pesto sürüp tavuk ve peynir ekleyin.',
      'Panini makinesinde 4 dakika presleyin.'
    ]
  },
  {
    id: 100, name: 'Källa Granola Bowl', category: 'Sandviçler ve Tuzlular', prepTime: '4 dk', difficulty: 'Kolay', temp: 'Soğuk', allergens: ['Süt/Laktoz'], tags: ['Glutensiz'],
    proTip: 'Meyvelerin taze dilimlenmiş olması sunumu güzelleştirir.',
    ingredients: [{ name: 'Süzme Yoğurt', amount: 120, unit: 'g' }, { name: 'Ev Yapımı Granola', amount: 40, unit: 'g' }, { name: 'Taze Çilek & Muz', amount: 1, unit: 'adet' }, { name: 'Süzme Çiçek Balı', amount: 10, unit: 'ml' }],
    steps: [
      'Kase tabanına yoğurdu yayın.',
      'Üzerine granolayı ekleyin.',
      'Meyve dilimlerini yerleştirip bal gezdirin.'
    ]
  },
  {
    id: 101, name: 'Acai Berry Bowl', category: 'Sandviçler ve Tuzlular', prepTime: '5 dk', difficulty: 'Orta', temp: 'Soğuk', allergens: [], tags: ['Vegan', 'Glutensiz'],
    proTip: 'Acai püresi dondurulmuş olarak blenderdan geçirilmelidir.',
    ingredients: [{ name: 'Dondurulmuş Acai Püresi', amount: 100, unit: 'g' }, { name: 'Yulaf Sütü', amount: 50, unit: 'ml' }, { name: 'Granola & Hindistan Cevizi', amount: 20, unit: 'g' }],
    steps: [
      'Acai and yulaf sütünü blenderda çekip kaseye alın.',
      'Üzerini granola, hindistan cevizi ve yaban mersinleriyle dekore edin.'
    ]
  },
  {
    id: 102, name: 'Lox & Egg Breakfast Plate', category: 'Sandviçler ve Tuzlular', prepTime: '7 dk', difficulty: 'Kolay', temp: 'Oda Sıcaklığı', allergens: ['Gluten', 'Balık', 'Süt/Laktoz'], tags: [],
    proTip: 'Yumurta tam 6.5 dakika haşlanmış (kayısı kıvamı) olmalıdır.',
    ingredients: [{ name: 'Füme Somon Dilimleri', amount: 45, unit: 'g' }, { name: 'Haşlanmış Yumurta', amount: 1, unit: 'adet' }, { name: 'Avokado Dilimleri', amount: 0.5, unit: 'adet' }, { name: 'Ekşi Mayalı Ekmek', amount: 1, unit: 'dilim' }],
    steps: [
      'Kızarmış ekmek dilimini tabağa alın.',
      'Yanına somon, avokado ve dilimlenmiş yumurtayı yerleştirip sunun.'
    ]
  }
];

if (typeof module !== "undefined") {
  module.exports = { RECIPES };
}
