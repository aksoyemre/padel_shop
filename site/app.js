// Tek sayfalık mağaza: hash ile yönlendirme (#magaza, #magaza-<koleksiyon>, #urun-<id>, #odeme),
// localStorage'da sepet. Ödeme ve formlar prototip: hiçbir şey sunucuya gitmez.
(() => {
  const { COLLECTIONS, PRODUCTS, GLOSSARY, CLUBS } = window.SHOP;
  const ART = window.ART;
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  const colById = new Map(COLLECTIONS.map((c) => [c.id, c]));
  const view = document.getElementById('view');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FREE_SHIP = 1500;
  const SHIP_FEE = 89;
  const GIFT_WRAP = 49;
  const HOME_SECTIONS = ['temel-seri', 'koleksiyonlar', 'kort-dili', 'nerede', 'pasaport', 'kulupler'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const fmt = (n) => `${n.toLocaleString('tr-TR')} TL`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Büyük harfe çevrilen başlıklarda yabancı ifadeler Türkçe kurala takılmasın (WAS IT, İT değil).
  const tagHTML = (c) => (c.tagLang ? `<span lang="${c.tagLang}">${esc(c.tag)}</span>` : esc(c.tag));
  const nameHTML = (p) => (p.en ? esc(p.name).replace(esc(p.en), `<span lang="en">${esc(p.en)}</span>`) : esc(p.name));

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* depolama kapalıysa sepet oturumla sınırlı kalır */ }
    },
  };

  // --- Sepet ---------------------------------------------------------------

  let cart = (store.get('do-cart', []) || []).filter((l) => byId.has(l.id) && l.qty > 0);
  const lineKey = (id, v, size) => `${id}|${v ?? ''}|${size ?? ''}`;
  const subtotal = () => cart.reduce((s, l) => s + byId.get(l.id).price * l.qty, 0);
  const itemCount = () => cart.reduce((s, l) => s + l.qty, 0);

  function saveCart() {
    store.set('do-cart', cart);
    $('#cart-count').textContent = itemCount();
    renderDrawer();
    if (current === 'checkout') renderCheckout();
  }

  function addToCart(id, v, size, qty = 1) {
    const key = lineKey(id, v, size);
    const line = cart.find((l) => l.key === key);
    if (line) line.qty += qty; else cart.push({ key, id, v, size, qty });
    saveCart();
    const badge = $('#cart-count');
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    toast(`${byId.get(id).name} sepete eklendi`);
  }

  function changeQty(key, delta) {
    const line = cart.find((l) => l.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter((l) => l !== line);
    saveCart();
  }

  function lineHTML(l, editable) {
    const p = byId.get(l.id);
    const opts = [p.variants?.[l.v]?.n, l.size].filter(Boolean).join(' · ');
    const ctrl = editable
      ? `<div class="line-ctrl"><div class="qty small"><button type="button" data-dec="${esc(l.key)}" aria-label="${esc(p.name)} adedini azalt">−</button><output>${l.qty}</output><button type="button" data-inc="${esc(l.key)}" aria-label="${esc(p.name)} adedini artır">+</button></div><button class="link-btn" type="button" data-rm="${esc(l.key)}">Kaldır</button></div>`
      : `<div class="line-opts">${l.qty} adet</div>`;
    return `<div class="line"><a class="line-art" href="#urun-${p.id}" data-close tabindex="-1">${ART.render(p, l.v || 0)}</a>`
      + `<div><a class="line-name" href="#urun-${p.id}" data-close>${esc(p.name)}</a>${opts ? `<div class="line-opts">${esc(opts)}</div>` : ''}${ctrl}</div>`
      + `<span class="line-price">${fmt(p.price * l.qty)}</span></div>`;
  }

  // --- Çekmece & toast -----------------------------------------------------

  const drawer = $('#drawer');
  const scrim = $('#scrim');

  function renderDrawer() {
    const body = $('#drawer-body');
    const foot = $('#drawer-foot');
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><p>Sepetin boş. Kortta unuttuğun bir şey mutlaka vardır.</p><a class="btn btn-outline" href="#magaza-kit" data-close>Unuttum Kiti'ne bak</a></div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = cart.map((l) => lineHTML(l, true)).join('');
    const sub = subtotal();
    const left = Math.max(0, FREE_SHIP - sub);
    foot.innerHTML = `<div class="ship-meter">${left
      ? `Eve ücretsiz kargo için <b>${fmt(left)}</b> daha. Kulübüne teslim her zaman ücretsiz.`
      : 'Eve kargo ücretsiz. Kulübüne teslim de ücretsiz.'}<div class="ship-bar"><i style="width:${Math.min(100, (sub / FREE_SHIP) * 100)}%"></i></div></div>`
      + `<div class="sum total"><span>Ara toplam</span><span>${fmt(sub)}</span></div>`
      + `<a class="btn btn-primary btn-block" href="#odeme" data-close>Ödemeye geç</a>`;
  }

  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    scrim.hidden = false;
    $('#cart-close').focus();
  }
  function closeDrawer(restoreFocus = true) {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
    if (restoreFocus && lastFocus) lastFocus.focus();
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // --- Ortak parçalar ------------------------------------------------------

  function card(p) {
    const col = colById.get(p.col);
    const needsChoice = p.sizes;
    const chan = p.channels.includes('otomat') ? '<div class="chan"><span>Otomatta da var</span></div>' : '';
    return `<article class="card">
      <a class="card-art" href="#urun-${p.id}" tabindex="-1" aria-hidden="true">${ART.render(p)}</a>
      <div class="card-top"><span class="eyebrow">${esc(col.name)}</span>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</div>
      <h3 class="card-title"><a href="#urun-${p.id}">${esc(p.name)}</a></h3>
      <p class="card-line">${esc(p.line)}</p>
      ${chan}
      <div class="card-foot"><span class="price">${fmt(p.price)}</span>
        <button class="add-btn" type="button" data-quick="${p.id}">${needsChoice ? 'Beden seç' : 'Sepete ekle'}</button></div>
    </article>`;
  }

  // --- Ana sayfa -----------------------------------------------------------

  const QUOTES = [
    { t: 'Oops, was it out?', id: 'oops-havlu', lang: 'en' },
    { t: 'Sorry partner.', id: 'sorry-partner-bileklik', lang: 'en' },
    { t: 'Glass half full.', id: 'glass-half-full-matara', lang: 'en' },
    { t: 'Bende! Sende!', id: 'bende-sende-set' },
    { t: 'Just one more set.', id: 'one-more-set-kupa', lang: 'en' },
  ];
  const COL_COVER = { temel: 'ikon-tisort', mizah: 'oops-havlu', pratik: 'skor-tutucu', kit: 'overgrip-3lu', kulup: 'padel-pasaportu' };
  const STAMPS = [
    { t: 'PİLOT 01', s: 'İST · 14.09', r: '-9deg' },
    { t: 'PİLOT 02', s: 'İST · 02.10', r: '6deg' },
    { t: 'PİLOT 03', s: 'İZM · 19.10', r: '-4deg' },
  ];

  function heroHTML() {
    return `<section class="hero">
      <div class="wrap hero-inner">
        <div>
          <span class="eyebrow">Padel kulüplerinde · Otomatlarda · <span lang="en">Online</span></span>
          <h1 class="display hero-title">Dördüncü kişi <span class="ball-word">bulundu.</span></h1>
          <p class="hero-lead">Kortta unuttuğun, kortta lazım olan ve padelciye hediye edilecek her şey. Kulübünün içindeki küçük dükkân.</p>
          <div class="hero-ctas">
            <a class="btn btn-ball" href="#magaza">Mağazaya gir</a>
            <a class="btn btn-ghost-light" href="#kort-dili">Kort dilini öğren</a>
          </div>
        </div>
        <div class="court-stage">
          <div class="scoreboard" aria-hidden="true">
            <span>BİZ</span><b id="sc-us">0</b>
            <span class="them">ONLAR</span><span class="them"><b id="sc-them">0</b></span>
            <span>OYUN</span><b id="sc-games">0–0</b>
          </div>
          <svg class="court-svg" viewBox="0 0 640 340" role="img" aria-label="Kuşbakışı padel kortu. Üç oyuncu bekliyor, dördüncü oyuncu katılıyor ve ralli başlıyor.">
            <rect class="turf" x="20" y="20" width="600" height="300"/>
            <g class="lines" fill="none" stroke-width="2.5">
              <line x1="111.5" y1="20" x2="111.5" y2="320"/>
              <line x1="528.5" y1="20" x2="528.5" y2="320"/>
              <line x1="111.5" y1="170" x2="528.5" y2="170"/>
            </g>
            <g fill="none" stroke-width="3" stroke-dasharray="2 5" class="wall-mesh">
              <line x1="140" y1="20" x2="500" y2="20"/><line x1="140" y1="320" x2="500" y2="320"/>
            </g>
            <g fill="none" stroke-width="6" stroke-linecap="square">
              <path class="wall-glass" id="wall-l" d="M140 20 H20 V320 H140"/>
              <path class="wall-glass" id="wall-r" d="M500 20 H620 V320 H500"/>
            </g>
            <line class="net" x1="320" y1="12" x2="320" y2="328" stroke-width="4"/>
            <circle cx="320" cy="12" r="5" fill="#FFFFFF"/><circle cx="320" cy="328" r="5" fill="#FFFFFF"/>
            <circle id="ripple" r="4" fill="none" stroke="var(--ball)" stroke-width="2" opacity="0"/>
            <circle class="p-them" cx="90" cy="215" r="11"/>
            <circle class="p-them" cx="250" cy="110" r="11"/>
            <circle class="p-us" cx="395" cy="105" r="11"/>
            <g id="p4">
              <circle class="p4-ring" cx="540" cy="235" r="15"/>
              <circle class="p-us" id="p4-dot" cx="540" cy="235" r="11" opacity="0"/>
              <text class="p-label" id="p4-label" x="540" y="270" text-anchor="middle" fill="var(--ball)">?</text>
            </g>
            <ellipse id="bshadow" cx="540" cy="235" rx="6" ry="3" fill="rgba(0,0,0,.35)" opacity="0"/>
            <circle id="ball" cx="540" cy="235" r="7" fill="var(--ball)" stroke="#0E1A2B" stroke-opacity=".25" opacity="0"/>
          </svg>
          <p class="court-caption">Kort 10 × 20 m · Servis çizgisi fileden 6,95 m · Arka cam 4 m</p>
        </div>
      </div>
    </section>`;
  }

  function renderHome() {
    const featured = ['ikon-tisort', 'kort-plani-tisort', 'mini-raket-sapka', 'kort-corap'].map((id) => byId.get(id));
    const g0 = GLOSSARY[0];
    view.innerHTML = `${heroHTML()}

    <section class="section" id="temel-seri">
      <div class="wrap">
        <div class="manifesto">
          <div><span class="eyebrow">Drop 01 · Temel Seri</span><h2 class="display">Tek ikon. Tek çizgi.</h2></div>
          <p>İlk akla gelenleri en iyi hâliyle yaptık. Göğüste küçük bir raket, şapkada nakış, bilekte servis çizgisi. Logosu bağırmayan, padelcinin padelciyi tanıdığı parçalar.</p>
        </div>
        <div class="grid">${featured.map(card).join('')}</div>
      </div>
    </section>

    <section class="section" id="koleksiyonlar">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">5 koleksiyon · ${PRODUCTS.length} ürün</span><h2 class="display">Koleksiyonlar</h2></div>
          <a class="text-link" href="#magaza">Tüm ürünler →</a>
        </div>
        <div class="collections">
          ${COLLECTIONS.map((c) => {
            const cover = byId.get(COL_COVER[c.id]);
            const n = PRODUCTS.filter((p) => p.col === c.id).length;
            return `<a class="col-tile" href="#magaza-${c.id}">
              <div><span class="eyebrow">${tagHTML(c)}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p></div>
              <div class="col-art" aria-hidden="true">${ART.render(cover)}</div>
              <span class="col-count">${n} ürün</span>
            </a>`;
          }).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="oops">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Kort Mizahı</span><h2 class="display">Kortta duyduğun her şey</h2></div>
          <p>Her maçta en az bir kez söylenen cümleler. Havluda, matarada, tişörtte.</p>
        </div>
        <div class="quotes">
          ${QUOTES.map((q) => {
            const p = byId.get(q.id);
            return `<a class="quote" href="#urun-${p.id}"><span class="quote-text"${q.lang ? ` lang="${q.lang}"` : ''}>${esc(q.t)}</span><span class="quote-meta"><b>${esc(p.name)}</b>${fmt(p.price)}</span></a>`;
          }).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="kort-dili">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Sözlük</span><h2 class="display">Kort dili</h2></div>
          <p>Padel İspanyolca konuşur. Terimleri bilen, kortta ne olduğunu da bilir. Bir terime dokun.</p>
        </div>
        <div class="glossary">
          <div class="terms" role="group" aria-label="Terimler">
            ${GLOSSARY.map((g, i) => `<button class="term-btn" type="button" data-term="${g.id}" aria-pressed="${i === 0}">${esc(g.term)}</button>`).join('')}
          </div>
          <div class="term-card" id="term-card" aria-live="polite">${termCardHTML(g0)}</div>
        </div>
      </div>
    </section>

    <section class="section" id="nerede">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Bizi nerede bulursun</span><h2 class="display">Üç yerde varız</h2></div>
          <p>Kulübün resepsiyonunda, koridordaki otomatta ve burada. Stok her yerde aynı ürünlerle başlar, her kanal kendi işini yapar.</p>
        </div>
        <div class="channels">
          <div class="channel"><span class="eyebrow">Kulüp içi stand</span><h3>Corner</h3>
            <p>Resepsiyonun yanında, kafenin karşısında. Maç öncesi ve sonrası bakılan yer.</p>
            <ul><li>Yeni seriler ve hediyelikler</li><li>Pasaport damgası burada basılır</li><li>Her ürünün yanında QR, stokta olmayan renk online</li></ul></div>
          <div class="channel"><span class="eyebrow">7/24</span><h3>Otomat</h3>
            <p>Gece 23:00'te grip yırtıldığında açık olan tek dükkân.</p>
            <ul><li>Top, overgrip, çorap, terbandı</li><li>Kurtarıcı kit, su, elektrolit</li><li>Kartla ve QR ile temassız ödeme</li></ul></div>
          <div class="channel"><span class="eyebrow">Tüm katalog</span><h3 lang="en">Online</h3>
            <p>Bütün ürünler, hediye paketleri ve kişiye özel baskılar.</p>
            <ul><li>Hediye paketi ve not</li><li>Kurumsal ve turnuva siparişleri</li><li>Eve kargo ya da kulübüne teslim</li></ul></div>
        </div>
        <div class="pickup"><strong>Kulübüne teslim</strong><p>Online sipariş ver, ürünün oynadığın kulübün corner'ına gelsin. Maça giderken al. Kargo ücreti yok.</p></div>
      </div>
    </section>

    <section class="section" id="pasaport">
      <div class="wrap passport">
        <div class="passport-copy">
          <span class="eyebrow">Sadakat · Koleksiyon</span>
          <h2 class="display">Padel Pasaportu</h2>
          <p>Corner'ımız olan her kulüpte pasaportuna bir damga basılır. Farklı kulüplerde oyna, damgaları topla. Onuncu damga bir ürün bizden.</p>
          <a class="btn btn-primary" href="#urun-padel-pasaportu">Pasaportu al · ${fmt(byId.get('padel-pasaportu').price)}</a>
        </div>
        <div class="stamps" aria-label="Örnek pasaport sayfası: 10 damgadan 3'ü dolu">
          ${Array.from({ length: 10 }, (_, i) => {
            if (i < STAMPS.length) return `<div class="stamp done" style="--r:${STAMPS[i].r}"><span><b>${STAMPS[i].t}</b>${STAMPS[i].s}</span></div>`;
            if (i === 9) return `<div class="stamp gift"><span><b>10</b>HEDİYE</span></div>`;
            return `<div class="stamp"><span>${String(i + 1).padStart(2, '0')}</span></div>`;
          }).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="kulupler">
      <div class="wrap partner">
        <div class="partner-copy">
          <span class="eyebrow">Kulüpler için</span>
          <h2 class="display">Kulübüne bir köşe aç</h2>
          <p>Stand, stok ve otomat bizden. Sen yer ver, satıştan pay al. Üyelerin kortta unuttuğunu kulübün içinde bulsun.</p>
          <div class="models">
            <div class="model"><b>Ciro paylaşımı</b><span>Stok ve stand bizden, satıştan %15–25 senin. Risk yok.</span></div>
            <div class="model"><b>Otomat</b><span>1 m² alan ve bir priz yeterli. Dolum ve takip bizden.</span></div>
            <div class="model"><b>Kulüp koleksiyonu</b><span>Kulübünün logosuyla aynı ürünler. Üretim ve satış bizden.</span></div>
            <div class="model"><b>Turnuva paketi</b><span>Madalya, kupa ve katılımcı hediyeleri.</span></div>
          </div>
        </div>
        <form class="form" id="club-form" novalidate>
          <div class="form-row">
            <div class="field"><label for="cf-kulup">Kulüp adı</label><input id="cf-kulup" name="kulup" autocomplete="organization" required></div>
            <div class="field"><label for="cf-sehir">Şehir</label><input id="cf-sehir" name="sehir" autocomplete="address-level2" required></div>
          </div>
          <div class="form-row">
            <div class="field"><label for="cf-kort">Kort sayısı</label><select id="cf-kort" name="kort"><option>1–3</option><option selected>4–6</option><option>7 ve üzeri</option></select></div>
            <div class="field"><label for="cf-format">İlgilendiğin format</label><select id="cf-format" name="format"><option>Corner</option><option>Otomat</option><option selected>Corner + otomat</option><option>Kulüp koleksiyonu</option></select></div>
          </div>
          <div class="field"><label for="cf-iletisim">Telefon ya da e-posta</label><input id="cf-iletisim" name="iletisim" required></div>
          <p class="pdp-msg" id="cf-msg" role="alert"></p>
          <button class="btn btn-primary btn-block" type="submit">Görüşme iste</button>
          <p class="form-note">Prototip: form bir yere gönderilmez.</p>
        </form>
      </div>
    </section>

    <section class="newsletter">
      <div class="wrap newsletter-inner">
        <h2 class="display">Yeni drop'lar, <span>önce sana.</span></h2>
        <form class="news-form" id="news-form" novalidate>
          <label class="eyebrow" for="nf-mail" style="flex-basis:100%;color:inherit;opacity:.7">E-posta adresin</label>
          <input id="nf-mail" type="email" autocomplete="email" placeholder="ad@ornek.com">
          <button class="btn btn-ball" type="submit">Listeye yazıl</button>
          <span class="news-msg" id="nf-msg" role="status"></span>
        </form>
      </div>
    </section>`;

    bindHome();
    startRally();
  }

  function termCardHTML(g) {
    const p = byId.get(g.product);
    return `<span class="term-meta">[${esc(g.say)}] · "${esc(g.lit)}"</span>
      <span class="term-word" lang="${g.lang}">${esc(g.term)}</span>
      <p class="term-def">${esc(g.def)}</p>
      ${p ? `<a class="term-link" href="#urun-${p.id}">${esc(p.name)} →</a>` : ''}`;
  }

  function bindHome() {
    view.querySelectorAll('[data-term]').forEach((btn) => btn.addEventListener('click', () => {
      const g = GLOSSARY.find((x) => x.id === btn.dataset.term);
      view.querySelectorAll('[data-term]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      $('#term-card').innerHTML = termCardHTML(g);
    }));

    $('#club-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const missing = ['cf-kulup', 'cf-sehir', 'cf-iletisim'].filter((id) => !$(`#${id}`).value.trim());
      if (missing.length) {
        $('#cf-msg').textContent = 'Kulüp adı, şehir ve iletişim bilgisi gerekli.';
        $(`#${missing[0]}`).focus();
        return;
      }
      const name = $('#cf-kulup').value.trim();
      f.innerHTML = `<div class="form-done">Teşekkürler, ${esc(name)}. Gerçek sürümde ekibimiz iki iş günü içinde dönüş yapacak. (Prototip: bilgiler gönderilmedi.)</div>`;
    });

    $('#news-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#nf-mail').value.trim();
      $('#nf-msg').textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? 'Listedesin. İlk drop haberi senin. (Prototip: adres kaydedilmedi.)'
        : 'Geçerli bir e-posta adresi yaz, örneğin ad@ornek.com.';
    });
  }

  // Hero: dördüncü oyuncu katılır, ralli başlar, skor "biz" lehine işler.
  function startRally() {
    const svg = view.querySelector('.court-svg');
    if (!svg) return;
    const ballEl = $('#ball', svg), shadow = $('#bshadow', svg), ripple = $('#ripple', svg);
    const p4dot = $('#p4-dot', svg), p4ring = $('.p4-ring', svg), p4label = $('#p4-label', svg);
    const scUs = $('#sc-us'), scThem = $('#sc-them'), scGames = $('#sc-games');
    const POINTS = ['0', '15', '30', '40'];
    let pts = 0, games = 0;

    const joinFourth = () => {
      p4dot.setAttribute('opacity', '1');
      p4ring.setAttribute('opacity', '0');
      p4label.textContent = 'SEN';
    };

    if (reduceMotion) {
      joinFourth();
      ballEl.setAttribute('opacity', '1'); ballEl.setAttribute('cx', '300'); ballEl.setAttribute('cy', '140');
      scUs.textContent = '15';
      return;
    }

    const P = { A1: [90, 215], A2: [250, 110], B1: [395, 105], B2: [540, 235] };
    const SEQ = [
      { p: P.B2, z: 14 },
      { p: [165, 250], z: 0, peak: 80, k: 'bounce' },
      { p: [22, 262], z: 10, peak: 22, k: 'glass-l' },
      { p: P.A1, z: 14, peak: 16, k: 'hit' },
      { p: [445, 200], z: 0, peak: 60, k: 'bounce' },
      { p: P.B2, z: 14, peak: 24, k: 'hit' },
      { p: P.A2, z: 14, peak: 46, k: 'hit' },
      { p: P.B1, z: 14, peak: 14, k: 'hit' },
      { p: [205, 292], z: 0, peak: 22, k: 'bounce' },
      { p: [236, 312], z: 0, peak: 6, k: 'point' },
    ];
    const SPEED = 480;
    const segs = SEQ.slice(1).map((s, i) => {
      const a = SEQ[i];
      const d = Math.hypot(s.p[0] - a.p[0], s.p[1] - a.p[1]);
      return { a, b: s, dur: Math.max(260, (d / SPEED) * 1000) };
    });

    let rippleStart = -1, ripplePt = [0, 0], rippleMax = 16;
    const fire = (k, pt, now) => {
      if (k === 'bounce' || k === 'hit') { rippleStart = now; ripplePt = pt; rippleMax = k === 'hit' ? 22 : 16; }
      if (k === 'glass-l' || k === 'glass-r') {
        const wall = $(k === 'glass-l' ? '#wall-l' : '#wall-r', svg);
        wall.classList.add('flash');
        setTimeout(() => wall.classList.remove('flash'), 260);
      }
      if (k === 'point') {
        pts += 1;
        if (pts > 3) { pts = 0; games += 1; }
        scUs.textContent = POINTS[pts] === '0' && games ? 'OYUN' : POINTS[pts];
        scThem.textContent = '0';
        scGames.textContent = `${games}–0`;
        if (games >= 6) games = 0;
      }
    };

    const INTRO = 1500, PAUSE = 900;
    let t0 = null, seg = 0, segStart = 0, phase = 'intro';

    function frame(now) {
      if (!svg.isConnected) return;
      if (t0 === null) { t0 = now; }
      if (phase === 'intro') {
        const k = (now - t0) / INTRO;
        p4ring.setAttribute('r', String(15 + Math.sin(k * Math.PI * 4) * 3));
        if (k >= 1) {
          joinFourth();
          ballEl.setAttribute('opacity', '1'); shadow.setAttribute('opacity', '1');
          phase = 'rally'; seg = 0; segStart = now;
        }
      } else if (phase === 'rally') {
        let s = segs[seg];
        let t = (now - segStart) / s.dur;
        if (t >= 1) {
          fire(s.b.k, s.b.p, now);
          seg += 1; segStart = now; t = 0;
          if (seg >= segs.length) { phase = 'pause'; segStart = now; }
          s = segs[Math.min(seg, segs.length - 1)];
        }
        if (phase === 'rally') {
          const x = s.a.p[0] + (s.b.p[0] - s.a.p[0]) * t;
          const y = s.a.p[1] + (s.b.p[1] - s.a.p[1]) * t;
          const h = s.a.z + (s.b.z - s.a.z) * t + (s.b.peak || 0) * Math.sin(Math.PI * t);
          shadow.setAttribute('cx', x.toFixed(1)); shadow.setAttribute('cy', y.toFixed(1));
          ballEl.setAttribute('cx', x.toFixed(1)); ballEl.setAttribute('cy', (y - h * 0.55).toFixed(1));
          ballEl.setAttribute('r', (7 + h * 0.03).toFixed(2));
        }
      } else if (phase === 'pause') {
        const k = (now - segStart) / PAUSE;
        ballEl.setAttribute('opacity', String(Math.max(0, 1 - k)));
        shadow.setAttribute('opacity', String(Math.max(0, 1 - k)));
        if (k >= 1) {
          phase = 'rally'; seg = 0; segStart = now;
          ballEl.setAttribute('opacity', '1'); shadow.setAttribute('opacity', '1');
        }
      }
      if (rippleStart >= 0) {
        const k = (now - rippleStart) / 420;
        if (k >= 1) { ripple.setAttribute('opacity', '0'); rippleStart = -1; }
        else {
          ripple.setAttribute('cx', ripplePt[0]); ripple.setAttribute('cy', ripplePt[1]);
          ripple.setAttribute('r', (4 + k * rippleMax).toFixed(1));
          ripple.setAttribute('opacity', (1 - k).toFixed(2));
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // --- Mağaza --------------------------------------------------------------

  let shopSort = 'onerilen';

  function sorted(list) {
    if (shopSort === 'artan') return [...list].sort((a, b) => a.price - b.price);
    if (shopSort === 'azalan') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }

  function renderShop(colId) {
    const col = colById.get(colId);
    const list = PRODUCTS.filter((p) => !col || p.col === col.id);
    view.innerHTML = `<div class="wrap">
      <header class="page-head">
        <span class="eyebrow">${col ? `${tagHTML(col)} · ${list.length} ürün` : `${PRODUCTS.length} ürün · ${COLLECTIONS.length} koleksiyon`}</span>
        <h1 class="display">${col ? esc(col.name) : 'Mağaza'}</h1>
        <p>${col ? esc(col.blurb) : 'İlk akla gelenler, minimal ve iyi çizilmiş. Yanında, padelcinin "bunu nereden buldun?" diyeceği şeyler.'}</p>
      </header>
      <div class="shop-bar">
        <nav class="chips" aria-label="Koleksiyonlar">
          <a class="chip" href="#magaza"${col ? '' : ' aria-current="true"'}>Hepsi</a>
          ${COLLECTIONS.map((c) => `<a class="chip" href="#magaza-${c.id}"${col === c ? ' aria-current="true"' : ''}>${esc(c.name)}</a>`).join('')}
        </nav>
        <label class="sort" for="sort">Sırala
          <select id="sort">
            <option value="onerilen">Önerilen</option>
            <option value="artan">Fiyat: düşükten yükseğe</option>
            <option value="azalan">Fiyat: yüksekten düşüğe</option>
          </select>
        </label>
      </div>
      <div class="grid shop-section" id="shop-grid">${sorted(list).map(card).join('')}</div>
    </div>`;
    const sel = $('#sort');
    sel.value = shopSort;
    sel.addEventListener('change', () => {
      shopSort = sel.value;
      $('#shop-grid').innerHTML = sorted(list).map(card).join('');
    });
  }

  // --- Ürün sayfası --------------------------------------------------------

  function renderProduct(p) {
    const col = colById.get(p.col);
    const st = { v: 0, size: null, qty: 1 };
    const where = { corner: 'Corner', otomat: 'Otomat', online: 'Online' };
    const related = [
      ...PRODUCTS.filter((x) => x.col === p.col && x !== p),
      ...PRODUCTS.filter((x) => x.col !== p.col),
    ].slice(0, 4);

    view.innerHTML = `<div class="wrap">
      <nav class="crumbs" aria-label="Konum"><a href="#magaza">Mağaza</a><span>/</span><a href="#magaza-${col.id}">${esc(col.name)}</a></nav>
      <div class="pdp">
        <div class="pdp-art" id="pdp-art">${ART.render(p, 0)}</div>
        <div class="pdp-info">
          <div class="card-top"><span class="eyebrow">${esc(col.name)} · ${tagHTML(col)}</span>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</div>
          <h1 class="pdp-title">${nameHTML(p)}</h1>
          <p class="pdp-line">${esc(p.line)}</p>
          <p class="pdp-price">${fmt(p.price)}</p>
          ${p.variants ? `<fieldset class="opt"><legend>Renk: <span id="v-name">${esc(p.variants[0].n)}</span></legend>
            <div class="swatches">${p.variants.map((v, i) => `<button class="swatch" type="button" data-v="${i}" aria-pressed="${i === 0}" aria-label="${esc(v.n)}" style="background:${v.c}"></button>`).join('')}</div></fieldset>` : ''}
          ${p.sizes ? `<fieldset class="opt"><legend>Beden</legend>
            <div class="sizes">${p.sizes.map((s) => `<button class="size" type="button" data-size="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}</div></fieldset>` : ''}
          <div class="buy-row">
            <div class="qty"><button type="button" id="q-dec" aria-label="Adedi azalt">−</button><output id="q-val">1</output><button type="button" id="q-inc" aria-label="Adedi artır">+</button></div>
            <button class="btn btn-primary" type="button" id="pdp-add">Sepete ekle · ${fmt(p.price)}</button>
          </div>
          <p class="pdp-msg" id="pdp-msg" role="alert"></p>
          <p class="pdp-desc">${esc(p.desc)}</p>
          <ul class="facts">
            <li><span>Nerede bulunur</span><span>${p.channels.map((c) => where[c]).join(' · ')}</span></li>
            <li><span>Kulübüne teslim</span><span>Ücretsiz</span></li>
            <li><span>Eve kargo</span><span>${fmt(SHIP_FEE)} · ${fmt(FREE_SHIP)} üzeri ücretsiz</span></li>
            <li><span>Hediye paketi</span><span>+${fmt(GIFT_WRAP)}</span></li>
          </ul>
        </div>
      </div>
      <section class="shop-section">
        <div class="section-head"><h2 class="display" style="font-size:var(--fs-h2)">Bununla iyi gider</h2></div>
        <div class="grid">${related.map(card).join('')}</div>
      </section>
    </div>`;

    view.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      st.v = Number(b.dataset.v);
      view.querySelectorAll('[data-v]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $('#v-name').textContent = p.variants[st.v].n;
      $('#pdp-art').innerHTML = ART.render(p, st.v);
    }));
    view.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
      st.size = b.dataset.size;
      view.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $('#pdp-msg').textContent = '';
    }));
    const setQty = (q) => {
      st.qty = Math.min(20, Math.max(1, q));
      $('#q-val').textContent = st.qty;
      $('#pdp-add').textContent = `Sepete ekle · ${fmt(p.price * st.qty)}`;
    };
    $('#q-dec').addEventListener('click', () => setQty(st.qty - 1));
    $('#q-inc').addEventListener('click', () => setQty(st.qty + 1));
    $('#pdp-add').addEventListener('click', () => {
      if (p.sizes && !st.size) {
        $('#pdp-msg').textContent = 'Önce beden seç.';
        view.querySelector('[data-size]').focus();
        return;
      }
      addToCart(p.id, p.variants ? st.v : null, st.size, st.qty);
    });
  }

  // --- Ödeme ---------------------------------------------------------------

  const co = { teslim: 'kulup', hediye: false };

  function totals() {
    const sub = subtotal();
    const ship = co.teslim === 'ev' && sub < FREE_SHIP ? SHIP_FEE : 0;
    const gift = co.hediye ? GIFT_WRAP : 0;
    return { sub, ship, gift, total: sub + ship + gift };
  }

  function summaryHTML() {
    const t = totals();
    return `<h2>Sipariş özeti</h2>
      <div>${cart.map((l) => lineHTML(l, false)).join('')}</div>
      <div class="sum"><span>Ara toplam</span><span>${fmt(t.sub)}</span></div>
      <div class="sum"><span>${co.teslim === 'ev' ? 'Eve kargo' : 'Kulübüne teslim'}</span><span>${t.ship ? fmt(t.ship) : 'Ücretsiz'}</span></div>
      ${t.gift ? `<div class="sum"><span>Hediye paketi</span><span>${fmt(t.gift)}</span></div>` : ''}
      <div class="sum total"><span>Toplam</span><span>${fmt(t.total)}</span></div>`;
  }

  function renderCheckout() {
    if (!cart.length) {
      view.innerHTML = `<div class="wrap confirm"><span class="eyebrow">Ödeme</span><h1 class="display">Sepet boş</h1>
        <p>Ödemeye geçmek için önce sepete bir şey ekle.</p><a class="btn btn-primary" href="#magaza">Mağazaya dön</a></div>`;
      return;
    }
    view.innerHTML = `<div class="wrap">
      <header class="page-head"><span class="eyebrow">${itemCount()} ürün</span><h1 class="display">Ödeme</h1></header>
      <div class="checkout">
        <form class="form" id="co-form" novalidate>
          <h2>Teslimat</h2>
          <div class="radio-cards" role="radiogroup" aria-label="Teslimat yöntemi">
            <label class="radio-card"><input type="radio" name="teslim" value="kulup"${co.teslim === 'kulup' ? ' checked' : ''}><b>Kulübüne teslim</b><span>Ücretsiz · Corner'dan teslim al</span></label>
            <label class="radio-card"><input type="radio" name="teslim" value="ev"${co.teslim === 'ev' ? ' checked' : ''}><b>Eve kargo</b><span>${fmt(SHIP_FEE)} · ${fmt(FREE_SHIP)} üzeri ücretsiz</span></label>
          </div>
          <div class="field" id="f-kulup"${co.teslim === 'kulup' ? '' : ' hidden'}><label for="co-kulup">Kulüp</label>
            <select id="co-kulup">${CLUBS.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
            <span class="form-note">Pilot kulüpler netleşince liste güncellenecek.</span></div>
          <div class="field" id="f-adres"${co.teslim === 'ev' ? '' : ' hidden'}><label for="co-adres">Teslimat adresi</label><textarea id="co-adres" autocomplete="street-address"></textarea></div>
          <h2>İletişim</h2>
          <div class="form-row">
            <div class="field"><label for="co-ad">Ad soyad</label><input id="co-ad" autocomplete="name" required></div>
            <div class="field"><label for="co-tel">Telefon</label><input id="co-tel" type="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required></div>
          </div>
          <div class="field"><label for="co-mail">E-posta</label><input id="co-mail" type="email" autocomplete="email" required></div>
          <h2>Hediye</h2>
          <label class="check"><input type="checkbox" id="co-hediye"${co.hediye ? ' checked' : ''}> Hediye paketi (+${fmt(GIFT_WRAP)}). Fatura pakete fiyatsız konur.</label>
          <div class="field" id="f-not"${co.hediye ? '' : ' hidden'}><label for="co-not">Hediye notu</label><textarea id="co-not" maxlength="160" placeholder="İyi ki varsın partner. Bende!"></textarea></div>
          <p class="pdp-msg" id="co-msg" role="alert"></p>
          <button class="btn btn-primary btn-block" type="submit" id="co-submit">Siparişi tamamla · ${fmt(totals().total)}</button>
          <p class="form-note">Prototip: ödeme adımı yok, sipariş oluşturulmaz.</p>
        </form>
        <aside class="summary" id="co-summary">${summaryHTML()}</aside>
      </div>
    </div>`;

    const refresh = () => {
      $('#co-summary').innerHTML = summaryHTML();
      $('#co-submit').textContent = `Siparişi tamamla · ${fmt(totals().total)}`;
    };
    view.querySelectorAll('input[name="teslim"]').forEach((r) => r.addEventListener('change', () => {
      co.teslim = r.value;
      $('#f-kulup').hidden = co.teslim !== 'kulup';
      $('#f-adres').hidden = co.teslim !== 'ev';
      refresh();
    }));
    $('#co-hediye').addEventListener('change', (e) => {
      co.hediye = e.target.checked;
      $('#f-not').hidden = !co.hediye;
      refresh();
    });

    $('#co-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (id) => $(`#${id}`).value.trim();
      let err = null;
      if (!val('co-ad')) err = ['co-ad', 'Ad soyad gerekli.'];
      else if (val('co-tel').replace(/\D/g, '').length < 10) err = ['co-tel', 'Telefon numarası en az 10 haneli olmalı.'];
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('co-mail'))) err = ['co-mail', 'Geçerli bir e-posta adresi yaz, örneğin ad@ornek.com.'];
      else if (co.teslim === 'ev' && val('co-adres').length < 10) err = ['co-adres', 'Kargo için açık adres gerekli.'];
      if (err) { $('#co-msg').textContent = err[1]; $(`#${err[0]}`).focus(); return; }

      const club = CLUBS.find((c) => c.id === $('#co-kulup').value);
      const no = `DO-${String(Date.now()).slice(-6)}`;
      const t = totals();
      cart = [];
      store.set('do-cart', cart);
      $('#cart-count').textContent = '0';
      renderDrawer();
      view.innerHTML = `<div class="wrap confirm">
        <span class="order-no">${no}</span>
        <h1 class="display">Bende!</h1>
        <p>Siparişin bizde. ${co.teslim === 'kulup'
          ? `Ürünlerin hazır olduğunda ${esc(club.name)} corner'ından teslim alabilirsin, sana SMS atacağız.`
          : 'Kargoya verdiğimizde takip numarasını e-postayla göndereceğiz.'} Toplam: ${fmt(t.total)}.</p>
        <p>Prototip: gerçek bir sipariş oluşturulmadı ve ödeme alınmadı.</p>
        <a class="btn btn-primary" href="#magaza">Alışverişe devam</a>
      </div>`;
      window.scrollTo(0, 0);
    });
  }

  // --- Yönlendirme ---------------------------------------------------------

  let current = null;

  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    closeDrawer(false);
    const prev = current;
    if (h === 'magaza' || h.startsWith('magaza-')) {
      current = 'shop';
      renderShop(h.slice(7));
    } else if (h.startsWith('urun-') && byId.has(h.slice(5))) {
      current = 'product';
      renderProduct(byId.get(h.slice(5)));
    } else if (h === 'odeme') {
      current = 'checkout';
      renderCheckout();
    } else {
      current = 'home';
      if (prev !== 'home') renderHome();
    }
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (a.dataset.nav === 'magaza' && current === 'shop') a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (current === 'home' && HOME_SECTIONS.includes(h)) {
      requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView({ behavior: reduceMotion || prev !== 'home' ? 'auto' : 'smooth' }));
    } else {
      window.scrollTo(0, 0);
    }
  }

  // --- Olaylar -------------------------------------------------------------

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-quick], [data-inc], [data-dec], [data-rm], [data-close]');
    if (!t) return;
    if (t.dataset.quick) {
      const p = byId.get(t.dataset.quick);
      if (p.sizes) location.hash = `urun-${p.id}`;
      else addToCart(p.id, p.variants ? 0 : null, null);
    } else if (t.dataset.inc) changeQty(t.dataset.inc, 1);
    else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
    else if (t.dataset.rm) changeQty(t.dataset.rm, -Infinity);
    else if (t.hasAttribute('data-close')) closeDrawer(false);
  });
  $('#cart-open').addEventListener('click', openDrawer);
  $('#cart-close').addEventListener('click', () => closeDrawer());
  scrim.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  window.addEventListener('hashchange', route);

  $('#cart-count').textContent = itemCount();
  renderDrawer();
  route();
})();
