// Katalog verisi. Fiyatlar prototip içindir (TL), gerçek fiyatlandırma maliyet çalışmasıyla netleşecek.
// tile: ürün görselinin zemin tonu (styles.css'teki --tile-* tokenları).
(() => {
  const NAVY = '#14213D';
  const WHITE = '#F7F8FA';
  const COURT = '#2350C8';
  const BALL = '#DDF247';

  const C = {
    beyaz: { n: 'Beyaz', c: WHITE, i: NAVY },
    lacivert: { n: 'Lacivert', c: '#1B2A4A', i: WHITE },
    kort: { n: 'Kort Mavisi', c: COURT, i: WHITE },
    top: { n: 'Top Sarısı', c: BALL, i: NAVY },
    melanj: { n: 'Gri Melanj', c: '#C9CDD3', i: NAVY },
    siyah: { n: 'Siyah', c: '#1A1D22', i: WHITE },
  };
  const APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const COLLECTIONS = [
    { id: 'temel', name: 'Temel Seri', tag: 'Essentials', tagLang: 'en', blurb: 'Tek ikon, tek çizgi. Kortta da kafede de giyilir.' },
    { id: 'mizah', name: 'Kort Mizahı', tag: 'Oops serisi', blurb: 'Her padelcinin en az bir kez söylediği cümleler.' },
    { id: 'pratik', name: 'Kortta Pratik', tag: 'Gear', blurb: 'Skoru tutan, topu koruyan, raketi süsleyen küçük şeyler.' },
    { id: 'kit', name: 'Unuttum Kiti', tag: 'Otomatta 7/24', blurb: 'Grip yırtıldı, çorap unutuldu, top bitti. Çözüm otomatta.' },
    { id: 'kulup', name: 'Pin & Pasaport', tag: 'Koleksiyon', blurb: 'Oynadığın her kulüpten bir pin, pasaportuna bir damga.' },
  ];

  const PRODUCTS = [
    // Temel Seri
    {
      id: 'ikon-tisort', col: 'temel', name: 'Raket İkon Tişört', price: 1290, badge: 'Yeni',
      line: 'Göğüste tek bir raket. O kadar.',
      desc: '%100 pamuk, 220 gr ağır gramaj, rahat kalıp. Sol göğüste nakış raket ikonu. Kortta, kafede, ofiste.',
      art: { type: 'tee', graphic: 'racket' }, tile: 'blue',
      variants: [C.beyaz, C.lacivert, C.kort], sizes: APPAREL, channels: ['corner', 'online'],
    },
    {
      id: 'kort-plani-tisort', col: 'temel', name: 'Kort Planı Tişört', price: 1290,
      line: '10 × 20 metre, tek çizgi.',
      desc: 'Padel kortunun kuşbakışı planı, gerçek oranlarla ince çizgi baskı. Servis çizgileri fileden 6,95 metrede, tam olması gerektiği yerde.',
      art: { type: 'tee', graphic: 'court' }, tile: 'glass',
      variants: [C.lacivert, C.beyaz, C.kort], sizes: APPAREL, channels: ['corner', 'online'],
    },
    {
      id: 'ikon-sweatshirt', col: 'temel', name: 'Raket İkon Sweatshirt', price: 1990,
      line: 'Kış ligi için.',
      desc: 'İçi şardonlu, 340 gr pamuk karışımı. Sol göğüste nakış raket ikonu, ribanalı bel ve kol.',
      art: { type: 'sweat', graphic: 'racket' }, tile: 'slate',
      variants: [C.melanj, C.lacivert, C.kort], sizes: APPAREL, channels: ['corner', 'online'],
    },
    {
      id: 'mini-raket-sapka', col: 'temel', name: 'Mini Raket Şapka', price: 890,
      line: 'Ön panelde küçük nakış.',
      desc: 'Yıkanmış pamuk, ayarlanabilir arka toka. Güneşli dış kortlar ve kötü saç günleri için.',
      art: { type: 'cap', graphic: 'racket' }, tile: 'turf',
      variants: [C.beyaz, C.lacivert, C.top], channels: ['corner', 'online'],
    },
    {
      id: 'kort-corap', col: 'temel', name: 'Kort Çizgili Çorap', price: 290,
      line: 'Bilekte servis çizgisi.',
      desc: 'Kaymaz taban, ter emen pamuk karışımı, topuk ve burunda takviye. Bilekte kort çizgileri.',
      art: { type: 'socks' }, tile: 'turf',
      variants: [C.beyaz, C.lacivert], sizes: ['36–39', '40–43', '44–46'], channels: ['corner', 'otomat', 'online'],
    },
    {
      id: 'kort-tote', col: 'temel', name: 'Kort Planı Bez Çanta', price: 590,
      line: 'Raket sığmaz, gerisi sığar.',
      desc: 'Kalın kanvas, iç cep, omuza uzun sap. Havlu, matara, yedek tişört ve maç sonu kahvesi için.',
      art: { type: 'tote', graphic: 'court' }, tile: 'ball',
      variants: [{ n: 'Ham', c: '#E7E1D3', i: NAVY }, C.lacivert], channels: ['corner', 'online'],
    },
    {
      id: 'mini-raket-anahtarlik', col: 'temel', name: 'Mini Raket Anahtarlık', price: 249, badge: 'Çok satan',
      line: 'Gerçek raketin 1:8 ölçeği.',
      desc: 'Delikli yüzeyiyle gerçek bir padel raketinin minyatürü. Metal halka, çantaya ya da anahtara.',
      art: { type: 'keychain' }, tile: 'blue',
      variants: [C.kort, C.top, C.siyah], channels: ['corner', 'otomat', 'online'],
    },
    {
      id: 'ikon-sticker', col: 'temel', name: 'Kort Dili Sticker Seti', price: 149,
      line: '12 ikon. Raket, matara, laptop.',
      desc: 'Suya dayanıklı vinil, mat yüzey. Raket, top, kort planı, golden point ve daha fazlası.',
      art: { type: 'stickers' }, tile: 'sand', channels: ['corner', 'otomat', 'online'],
    },

    // Kort Mizahı
    {
      id: 'oops-havlu', col: 'mizah', name: 'Oops, Was It Out? Havlu', en: 'Oops, Was It Out?', price: 549, badge: 'Çok satan',
      line: 'Cevap her zaman "içerideydi".',
      desc: 'Mikrofiber spor havlusu, 40 × 80 cm, hızlı kurur. Çantaya asmak için halkalı.',
      art: { type: 'towel', text: ['OOPS,', 'WAS IT', 'OUT?'] }, tile: 'blue',
      variants: [C.top, C.beyaz, C.lacivert], channels: ['corner', 'online'],
    },
    {
      id: 'glass-half-full-matara', col: 'mizah', name: 'Glass Half Full Matara', price: 690,
      line: 'Padelde cam hep yarı dolu.',
      desc: '750 ml çift cidarlı paslanmaz çelik. 24 saat soğuk, 12 saat sıcak tutar.',
      art: { type: 'bottle', text: 'GLASS HALF FULL' }, tile: 'glass',
      variants: [C.beyaz, C.kort, C.siyah], channels: ['corner', 'online'],
    },
    {
      id: 'bende-sende-set', col: 'mizah', name: 'BENDE! / SENDE! Partner Seti', price: 2290, badge: 'Hediye',
      line: 'İki tişört. "Kimdeydi?" tartışması biter.',
      desc: 'Biri BENDE!, diğeri SENDE! yazan iki tişört, hediye kutusunda. Partnerine, eşine ya da her maç aynı topa giden arkadaşına.',
      art: { type: 'partner' }, tile: 'ball',
      sizes: ['S + S', 'S + M', 'M + M', 'M + L', 'L + L', 'L + XL'], channels: ['corner', 'online'],
    },
    {
      id: 'one-more-set-kupa', col: 'mizah', name: 'Just One More Set Kupa', price: 390,
      line: 'Saat 23:40, 2 numaralı kort hâlâ dolu.',
      desc: '350 ml seramik kupa, bulaşık makinesinde yıkanabilir.',
      art: { type: 'mug', text: ['JUST ONE', 'MORE SET'] }, tile: 'slate',
      variants: [C.beyaz, C.lacivert], channels: ['corner', 'online'],
    },
    {
      id: 'i-lob-you-tote', col: 'mizah', name: 'I Lob You Bez Çanta', price: 590, badge: 'Hediye',
      line: 'Sevgililer Günü\'nün padel hâli.',
      desc: 'Kalın kanvas, iç cep. Padel oynayan sevgiliye, oynamayan sevgiliye ise ikna aracı olarak.',
      art: { type: 'tote', text: ['I LOB', 'YOU'] }, tile: 'sand',
      variants: [{ n: 'Ham', c: '#E7E1D3', i: '#C8374A' }, C.siyah], channels: ['corner', 'online'],
    },
    {
      id: 'sorry-partner-bileklik', col: 'mizah', name: 'Sorry Partner Terbandı', price: 179,
      line: 'Fileye takılan topun resmî özrü.',
      desc: 'Pamuklu havlu kumaş bileklik, 8 cm. Tek sayı kaybettiren her hatadan sonra bileğini göster.',
      art: { type: 'wristband', text: 'SORRY PARTNER' }, tile: 'turf',
      variants: [C.beyaz, C.top, C.lacivert], channels: ['corner', 'otomat', 'online'],
    },
    {
      id: 'por-tres-sapka', col: 'mizah', name: 'Por Tres Club Şapka', price: 890,
      line: 'Topu yan çitten dışarı atanlar kulübü.',
      desc: 'Yıkanmış pamuk, ön panelde nakış. Üyelik şartı: en az bir por tres. Kanıt istemiyoruz.',
      art: { type: 'cap', text: 'POR 3' }, tile: 'blue',
      variants: [C.lacivert, C.beyaz], channels: ['corner', 'online'],
    },

    // Kortta Pratik
    {
      id: 'skor-tutucu', col: 'pratik', name: 'Klipsli Skor Tutucu', price: 449, badge: 'Yeni',
      line: '"Kaç kaçtı?" tartışmasına son.',
      desc: 'Çantaya ya da file direğine takılır. İki çevirmeli kadran: oyun ve set. Suya ve düşmeye dayanıklı.',
      art: { type: 'scorer' }, tile: 'blue',
      variants: [C.top, C.beyaz], channels: ['corner', 'online'],
    },
    {
      id: 'basinc-tupu', col: 'pratik', name: 'Top Basınç Tüpü', price: 799,
      line: 'Açılmış top, açılmamış gibi kalsın.',
      desc: '3 topu basınç altında saklar. Pompa kapağındaki göstergeyle basıncı görürsün, topların ömrü uzar.',
      art: { type: 'tube', pump: true }, tile: 'ball',
      variants: [C.kort, C.siyah], channels: ['corner', 'online'],
    },
    {
      id: 'kenar-bandi', col: 'pratik', name: 'Kenar Koruma Bandı · Kort Çizgisi', price: 199,
      line: 'Raketin kenarına çizgili zırh.',
      desc: 'Darbeye dayanıklı şeffaf koruma bandı, üzerinde ince kort çizgisi deseni. Bir raketlik rulo.',
      art: { type: 'tape' }, tile: 'slate',
      variants: [C.kort, C.top, C.siyah], channels: ['corner', 'otomat', 'online'],
    },
    {
      id: 'klipsli-havlu', col: 'pratik', name: 'Klipsli Mini Havlu', price: 249,
      line: 'Sap mı kaydı? Sil, devam.',
      desc: '25 × 25 cm mikrofiber, karabina klipsli. Çantanın dışında durur, setler arasında elinin altında.',
      art: { type: 'minitowel' }, tile: 'turf',
      variants: [C.kort, C.top, C.beyaz], channels: ['corner', 'otomat', 'online'],
    },

    // Unuttum Kiti
    {
      id: 'overgrip-3lu', col: 'kit', name: 'Overgrip 3\'lü', price: 249, badge: 'Otomatta',
      line: 'Yırtılan grip maçı bitirmesin.',
      desc: '0,6 mm, kaymaz ve ter emen overgrip. Üçlü paket: beyaz, sarı, mavi.',
      art: { type: 'grip' }, tile: 'sand', channels: ['corner', 'otomat', 'online'],
    },
    {
      id: 'top-3lu', col: 'kit', name: 'Turnuva Topu · 3\'lü Tüp', price: 449,
      line: 'Basınçlı, yeni, hazır.',
      desc: 'Basınçlı tüpte üç turnuva topu. Otomatta her zaman soğuk ve yeni.',
      art: { type: 'tube' }, tile: 'blue', channels: ['corner', 'otomat', 'online'],
    },
    {
      id: 'kurtarici-kit', col: 'kit', name: 'Maç Sonu Kurtarıcı Kit', price: 349,
      line: 'Deodorant, ıslak mendil, kuru şampuan, toka.',
      desc: 'Maçtan direkt akşam yemeğine gidenler için. Seyahat boyu dört ürün, fermuarlı kılıfta.',
      art: { type: 'kit' }, tile: 'glass', channels: ['corner', 'otomat', 'online'],
    },

    // Pin & Pasaport
    {
      id: 'padel-pasaportu', col: 'kulup', name: 'Padel Pasaportu', price: 299, badge: 'Yeni',
      line: 'Her kulüpte bir damga. 10 damgaya bir hediye.',
      desc: '40 sayfalık cep defteri: kulüp damgaları, maç notları, partner listesi. Corner\'ımız olan her kulüpte damga basılır. 10 damga dolunca bir ürün bizden.',
      art: { type: 'passport' }, tile: 'slate', channels: ['corner', 'online'],
    },
    {
      id: 'golden-point-pin', col: 'kulup', name: 'Golden Point Pini', en: 'Golden Point', price: 199,
      line: '40–40. Tek sayı. Her şey.',
      desc: 'Sert emaye, altın kaplama kenar, kelebek arkalık. Çantana, şapkana, ceketine.',
      art: { type: 'pin' }, tile: 'ball', channels: ['corner', 'online'],
    },
    {
      id: 'kort-dili-pin-seti', col: 'kulup', name: 'Kort Dili Pin Seti · 4\'lü', price: 649,
      line: 'Bandeja, víbora, chiquita, globo.',
      desc: 'Dört vuruş, dört sert emaye pin. Koleksiyon kartında gelir.',
      art: { type: 'pinset' }, tile: 'blue', channels: ['corner', 'online'],
    },
  ];

  const GLOSSARY = [
    { id: 'bandeja', term: 'Bandeja', say: 'ban·de·ha', lit: 'tepsi', product: 'kort-dili-pin-seti',
      def: 'Yüksek gelen topu omuz hizasında, kesik ve kontrollü vurmak. Amaç sayıyı bitirmek değil, filedeki yerini korumak.' },
    { id: 'vibora', term: 'Víbora', say: 'bi·bo·ra', lit: 'engerek', product: 'kort-dili-pin-seti',
      def: 'Bandejanın daha sert ve yan falsolu hâli. Top camdan dönerken yana kaçar, rakip zor karşılar.' },
    { id: 'por-tres', term: 'Por tres', say: 'por tres', lit: 'üçten', product: 'por-tres-sapka',
      def: 'Smaçla topu yan çitin üzerinden kort dışına çıkarmak. Kortun en gösterişli sayısı.' },
    { id: 'chiquita', term: 'Chiquita', say: 'çi·ki·ta', lit: 'ufaklık', product: 'kort-corap',
      def: 'Filedeki rakibin ayaklarına bırakılan yavaş, alçak top. Rakibi topu yukarı vurmaya zorlar.' },
    { id: 'globo', term: 'Globo', say: 'glo·bo', lit: 'balon', product: 'i-lob-you-tote',
      def: 'Lob. Filedeki rakibin başının üzerinden arka cama atılan yüksek top. İyi bir globo fileyi el değiştirtir.' },
    { id: 'golden-point', term: 'Golden point', lang: 'en', say: 'gol·dın poynt', lit: 'altın sayı', product: 'golden-point-pin',
      def: '40–40\'ta avantaj oynanmaz. Tek sayı oyunu bitirir; karşılayan çift hangi taraftan karşılayacağını seçer.' },
    { id: 'bajada', term: 'Bajada', say: 'ba·ha·da', lit: 'iniş', product: 'ikon-tisort',
      def: 'Arka camdan yükselerek dönen topu havadayken, hücum için sertçe vurmak.' },
    { id: 'contrapared', term: 'Contrapared', say: 'kon·tra·pa·red', lit: 'karşı duvar', product: 'glass-half-full-matara',
      def: 'Sıkışınca topu kendi arka camına vurup rakip sahaya göndermek. Nadir görülür, görüldüğünde alkış alır.' },
  ];

  GLOSSARY.forEach((g) => { g.lang = g.lang || 'es'; });

  // Pilot kulüpler henüz belli değil; isimler pilotla birlikte netleşecek.
  const CLUBS = [
    { id: 'pilot-1', name: 'Pilot Kulüp 1 · İstanbul Anadolu' },
    { id: 'pilot-2', name: 'Pilot Kulüp 2 · İstanbul Avrupa' },
    { id: 'pilot-3', name: 'Pilot Kulüp 3 · İzmir' },
  ];

  window.SHOP = { COLLECTIONS, PRODUCTS, GLOSSARY, CLUBS };
})();
