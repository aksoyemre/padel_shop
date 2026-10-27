// Ürün görselleri: fotoğraf çekimi gelene kadar her ürünü düz, minimal SVG ile çizer.
// ART.render(product, variantIndex) -> <svg> string. Zemin rengi CSS tokenından gelir (--tile-*).
(() => {
  const DISP = "'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif";
  const MONO = "'Martian Mono', ui-monospace, monospace";
  const NAVY = '#14213D';
  const BALL = '#DDF247';
  const COURT = '#2350C8';
  const METAL = '#9AA3AF';
  const EDGE = 'rgba(14,26,43,.14)';
  const SHADE = 'rgba(14,26,43,.10)';

  // --- İkonlar -------------------------------------------------------------

  // Padel raketi: delikli kafa, kısa sap. s = toplam yükseklik.
  function racket(x, y, s, c, o = {}) {
    const rot = o.rot ?? -28;
    const hw = s * 0.30, hh = s * 0.36, hy = -s * 0.14;
    const holeFill = o.solid ? o.hole : c;
    let holes = '';
    const r = s * 0.028, g = s * 0.11;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) holes += `<circle cx="${i * g}" cy="${hy + j * g}" r="${r}" fill="${holeFill}"/>`;
    }
    const head = o.solid
      ? `<ellipse cx="0" cy="${hy}" rx="${hw}" ry="${hh}" fill="${c}"/>`
      : `<ellipse cx="0" cy="${hy}" rx="${hw}" ry="${hh}" fill="none" stroke="${c}" stroke-width="${s * 0.05}"/>`;
    const t = hy + hh * 0.92;
    const handle = `<path d="M${-s * 0.07} ${t} L${-s * 0.045} ${s * 0.3} L${s * 0.045} ${s * 0.3} L${s * 0.07} ${t} Z" fill="${c}"/>`
      + `<rect x="${-s * 0.05}" y="${s * 0.28}" width="${s * 0.1}" height="${s * 0.22}" rx="${s * 0.03}" fill="${c}"/>`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})">${head}${holes}${handle}</g>`;
  }

  function ball(x, y, r, fill = BALL, seam = '#FFFFFF') {
    return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${fill}"/>`
      + `<path d="M${-r * 0.55} ${-r * 0.83} Q${r * 0.05} 0 ${-r * 0.55} ${r * 0.83}M${r * 0.55} ${-r * 0.83} Q${-r * 0.05} 0 ${r * 0.55} ${r * 0.83}" fill="none" stroke="${seam}" stroke-width="${r * 0.12}" stroke-linecap="round"/></g>`;
  }

  // Kuşbakışı kort planı (dikey). Servis çizgisi arka duvardan 3,05 m (20 m'lik kortta).
  function court(x, y, w, c, sw) {
    const h = w * 2, x0 = x - w / 2, y0 = y - h / 2, sl = h * (3.05 / 20);
    return `<g fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="square">`
      + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}"/>`
      + `<line x1="${x0 - sw * 2}" y1="${y}" x2="${x0 + w + sw * 2}" y2="${y}" stroke-width="${sw * 1.8}"/>`
      + `<line x1="${x0}" y1="${y0 + sl}" x2="${x0 + w}" y2="${y0 + sl}"/>`
      + `<line x1="${x0}" y1="${y0 + h - sl}" x2="${x0 + w}" y2="${y0 + h - sl}"/>`
      + `<line x1="${x}" y1="${y0 + sl}" x2="${x}" y2="${y0 + h - sl}"/></g>`;
  }

  function text(lines, x, y, size, fill, o = {}) {
    const arr = Array.isArray(lines) ? lines : [lines];
    const lh = size * (o.lh ?? 0.95);
    const start = y - ((arr.length - 1) * lh) / 2;
    return arr.map((l, i) => `<text x="${x}" y="${start + i * lh}" text-anchor="middle" dominant-baseline="central" font-family="${o.font ?? DISP}" font-weight="${o.weight ?? 800}" font-size="${size}" letter-spacing="${o.ls ?? 0}" fill="${fill}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${l}</text>`).join('');
  }

  // --- Ürün çizimleri ------------------------------------------------------

  const TEE = 'M150 72 C170 92 230 92 250 72 L300 86 L352 134 L322 182 L290 166 L290 338 L110 338 L110 166 L78 182 L48 134 L100 86 Z';

  function teeBody(c) {
    return `<path d="${TEE}" fill="${c}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M150 72 C170 98 230 98 250 72" fill="none" stroke="${SHADE}" stroke-width="7"/>`
      + `<path d="M78 182 L48 134M322 182 L352 134" stroke="${SHADE}" stroke-width="3"/>`;
  }

  function chestGraphic(spec, ink) {
    if (spec.graphic === 'racket') return racket(244, 138, 46, ink, { rot: -24 });
    if (spec.graphic === 'court') return court(200, 206, 60, ink, 2.6);
    return '';
  }

  const draw = {
    tee: (s, v) => teeBody(v.c) + chestGraphic(s, v.i),

    sweat: (s, v) =>
      `<path d="M150 72 C170 92 230 92 250 72 L300 86 L340 140 L362 300 L326 306 L296 190 L292 330 L108 330 L104 190 L74 306 L38 300 L60 140 L100 86 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M150 72 C170 98 230 98 250 72" fill="none" stroke="${SHADE}" stroke-width="8"/>`
      + `<rect x="106" y="312" width="188" height="18" fill="${SHADE}"/>`
      + `<path d="M38 300 L74 306 L76 290 L41 284 Z M362 300 L326 306 L324 290 L359 284 Z" fill="${SHADE}"/>`
      + chestGraphic(s, v.i),

    cap: (s, v) =>
      `<path d="M108 236 C104 150 150 108 200 108 C250 108 296 150 292 236 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<path d="M200 110 C192 160 192 200 200 236" fill="none" stroke="${SHADE}" stroke-width="3"/>`
      + `<path d="M92 236 C150 222 250 222 308 236 C320 264 296 288 200 292 C104 288 80 264 92 236 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<path d="M92 236 C150 222 250 222 308 236" fill="none" stroke="${SHADE}" stroke-width="6"/>`
      + `<circle cx="200" cy="110" r="7" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + (s.text ? text(s.text, 200, 182, 40, v.i) : racket(200, 178, 50, v.i, { rot: -20 })),

    socks: (s, v) => {
      const sock = (dx, dy, op) => `<g transform="translate(${dx} ${dy})" opacity="${op}">`
        + `<path d="M150 70 h86 v170 c0 14 6 22 18 28 l46 24 c22 12 20 50 -6 52 c-10 1 -22 -2 -34 -8 l-84 -42 c-18 -9 -26 -24 -26 -44 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>`
        + `<rect x="150" y="70" width="86" height="26" fill="${SHADE}"/>`
        + `<path d="M150 108 H236 M150 122 H236 M193 108 V122" stroke="${COURT}" stroke-width="3.5"/>`
        + `<path d="M266 330 c10 6 22 8 30 6 c18 -4 22 -26 4 -40" fill="none" stroke="${SHADE}" stroke-width="9"/></g>`;
      return sock(-50, -14, 0.9) + sock(10, 12, 1);
    },

    tote: (s, v) =>
      `<path d="M150 150 C150 70 250 70 250 150" fill="none" stroke="${v.i}" stroke-opacity=".55" stroke-width="12"/>`
      + `<path d="M108 150 H292 L304 342 H96 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M108 150 H292" stroke="${SHADE}" stroke-width="10"/>`
      + (s.text ? text(s.text, 200, 250, 64, v.i, { lh: 0.92 }) : court(200, 248, 54, v.i, 2.6)),

    keychain: (s, v) =>
      `<circle cx="200" cy="74" r="30" fill="none" stroke="${METAL}" stroke-width="8"/>`
      + `<path d="M200 104 V128" stroke="${METAL}" stroke-width="6"/><circle cx="200" cy="134" r="7" fill="none" stroke="${METAL}" stroke-width="5"/>`
      + `<g transform="translate(200 250) rotate(180)">${racket(0, 0, 220, v.c, { rot: 0, solid: true, hole: 'var(--art-bg)' })}</g>`
      + `<rect x="190" y="140" width="20" height="10" rx="3" fill="${METAL}"/>`,

    stickers: () => {
      const st = (x, y, rot, inner) => `<g transform="translate(${x} ${y}) rotate(${rot})">${inner}</g>`;
      return st(130, 130, -10, `<circle r="72" fill="#FFFFFF" stroke="${EDGE}" stroke-width="2"/><circle r="62" fill="${COURT}"/>${ball(0, 0, 36)}`)
        + st(272, 128, 8, `<rect x="-62" y="-62" width="124" height="124" rx="22" fill="#FFFFFF" stroke="${EDGE}" stroke-width="2"/><rect x="-54" y="-54" width="108" height="108" rx="16" fill="${BALL}"/>${racket(0, 0, 86, NAVY, { rot: -24 })}`)
        + st(140, 278, 6, `<rect x="-84" y="-32" width="168" height="64" rx="32" fill="#FFFFFF" stroke="${EDGE}" stroke-width="2"/><rect x="-76" y="-24" width="152" height="48" rx="24" fill="${NAVY}"/>${text('BANDEJA', 0, 0, 30, '#FFFFFF', { ls: 1.5 })}`)
        + st(290, 276, -6, `<rect x="-46" y="-78" width="92" height="156" rx="12" fill="#FFFFFF" stroke="${EDGE}" stroke-width="2"/><rect x="-38" y="-70" width="76" height="140" rx="6" fill="#3E8E5E"/>${court(0, 0, 56, '#FFFFFF', 2.4)}`);
    },

    towel: (s, v) =>
      `<path d="M70 66 H330" stroke="${METAL}" stroke-width="7" stroke-linecap="round"/>`
      + `<rect x="112" y="62" width="176" height="282" rx="8" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<rect x="112" y="62" width="176" height="34" fill="${SHADE}"/>`
      + `<path d="M112 304 H288 M112 318 H288" stroke="${v.i}" stroke-opacity=".35" stroke-width="5"/>`
      + text(s.text, 200, 196, 50, v.i, { lh: 0.9 }),

    bottle: (s, v) =>
      `<rect x="164" y="56" width="72" height="40" rx="10" fill="${NAVY}"/>`
      + `<rect x="176" y="92" width="48" height="26" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<rect x="148" y="114" width="104" height="236" rx="34" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<path d="M148 232 H252 V316 a34 34 0 0 1 -34 34 H182 a34 34 0 0 1 -34 -34 Z" fill="${COURT}" fill-opacity=".22"/>`
      + `<path d="M148 232 H252" stroke="${COURT}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 5"/>`
      + text(s.text, 200, 232, 32, v.i, { rot: -90, ls: 1 }),

    mug: (s, v) =>
      `<path d="M262 170 C318 170 318 282 262 282" fill="none" stroke="${v.c}" stroke-width="20"/>`
      + `<path d="M262 170 C318 170 318 282 262 282" fill="none" stroke="${EDGE}" stroke-width="2"/>`
      + `<path d="M118 136 H264 V300 C264 326 248 340 222 340 H160 C134 340 118 326 118 300 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<ellipse cx="191" cy="136" rx="73" ry="12" fill="${SHADE}"/>`
      + text(s.text, 191, 238, 40, v.i, { lh: 0.95 }),

    wristband: (s, v) =>
      `<path d="M92 168 C150 150 250 150 308 168 C250 188 150 188 92 168 Z" fill="${NAVY}" fill-opacity=".25"/>`
      + `<path d="M92 168 C150 188 250 188 308 168 L308 244 C250 264 150 264 92 244 Z" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<path d="M92 176 C150 196 250 196 308 176 M92 236 C150 256 250 256 308 236" fill="none" stroke="${SHADE}" stroke-width="3"/>`
      + text(s.text, 200, 216, 30, v.i, { ls: 1.5 }),

    scorer: (s, v) =>
      `<rect x="172" y="44" width="56" height="76" rx="28" fill="none" stroke="${METAL}" stroke-width="9"/>`
      + `<rect x="118" y="104" width="164" height="232" rx="30" fill="${v.c}" stroke="${EDGE}" stroke-width="2"/>`
      + `<rect x="138" y="150" width="58" height="76" rx="8" fill="${NAVY}"/><rect x="204" y="150" width="58" height="76" rx="8" fill="${NAVY}"/>`
      + text('30', 167, 189, 24, BALL, { font: MONO, weight: 500 }) + text('15', 233, 189, 24, '#FFFFFF', { font: MONO, weight: 500 })
      + text('BİZ', 167, 246, 11, NAVY, { font: MONO, weight: 500, ls: 1 }) + text('ONLAR', 233, 246, 11, NAVY, { font: MONO, weight: 500, ls: 1 })
      + `<circle cx="167" cy="292" r="18" fill="${NAVY}" fill-opacity=".14"/><circle cx="233" cy="292" r="18" fill="${NAVY}" fill-opacity=".14"/>`
      + `<path d="M167 280 V292 M233 280 V292" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/>`,

    tube: (s, v) => {
      const cap = s.pump
        ? `<rect x="138" y="58" width="124" height="54" rx="14" fill="${v.c}"/><circle cx="200" cy="85" r="15" fill="#FFFFFF"/><path d="M200 85 L209 76" stroke="${NAVY}" stroke-width="3" stroke-linecap="round"/><rect x="184" y="40" width="32" height="20" rx="6" fill="${v.c}"/>`
        : `<rect x="146" y="76" width="108" height="36" rx="10" fill="${NAVY}"/>`;
      return `<rect x="150" y="106" width="100" height="248" rx="20" fill="#FFFFFF" fill-opacity=".55" stroke="${EDGE}" stroke-width="2"/>`
        + ball(200, 156, 40) + ball(200, 232, 40) + ball(200, 308, 40)
        + (s.pump ? '' : `<rect x="150" y="214" width="100" height="36" fill="${COURT}"/>${text('3 × TOP', 200, 232, 18, '#FFFFFF', { font: MONO, weight: 500 })}`)
        + cap;
    },

    tape: (s, v) =>
      `<path d="M226 286 L340 318 L332 350 L218 318 Z" fill="${v.c}" fill-opacity=".85"/>`
      + `<path d="M232 300 L336 330" stroke="#FFFFFF" stroke-width="2.5"/>`
      + `<circle cx="180" cy="196" r="112" fill="${v.c}"/>`
      + `<circle cx="180" cy="196" r="96" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="2.5"/>`
      + `<circle cx="180" cy="196" r="84" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2"/>`
      + `<circle cx="180" cy="196" r="54" fill="var(--art-bg)" stroke="${EDGE}" stroke-width="2"/>`,

    minitowel: (s, v) =>
      `<circle cx="150" cy="96" r="26" fill="none" stroke="${METAL}" stroke-width="8"/>`
      + `<path d="M150 122 V146" stroke="${METAL}" stroke-width="6"/>`
      + `<rect x="120" y="140" width="176" height="186" rx="10" fill="${v.c}" stroke="${EDGE}" stroke-width="2" transform="rotate(4 208 233)"/>`
      + `<path d="M126 296 H294 M126 306 H294" stroke="${v.i}" stroke-opacity=".3" stroke-width="4" transform="rotate(4 208 233)"/>`
      + racket(212, 222, 72, v.i, { rot: -20 }),

    grip: () => {
      const roll = (x, rot, c, stripe) => `<g transform="translate(${x} 210) rotate(${rot})">`
        + `<rect x="-30" y="-120" width="60" height="240" rx="30" fill="${c}" stroke="${EDGE}" stroke-width="2"/>`
        + [-80, -40, 0, 40, 80].map((y) => `<path d="M-30 ${y + 14} L30 ${y - 14}" stroke="${stripe}" stroke-width="3"/>`).join('')
        + `</g>`;
      return roll(130, -14, '#FFFFFF', SHADE) + roll(200, 0, BALL, 'rgba(14,26,43,.18)') + roll(270, 14, COURT, 'rgba(255,255,255,.35)');
    },

    kit: () =>
      `<path d="M98 152 Q98 130 120 130 H280 Q302 130 302 152 L292 318 Q290 338 270 338 H130 Q110 338 108 318 Z" fill="${NAVY}"/>`
      + `<path d="M104 152 H296" stroke="${METAL}" stroke-width="5" stroke-dasharray="3 3"/>`
      + `<rect x="270" y="142" width="12" height="34" rx="4" fill="${METAL}"/>`
      + `<rect x="138" y="196" width="124" height="96" rx="6" fill="${BALL}"/>`
      + text(['MAÇ SONU', 'KURTARICI', 'KİT'], 200, 244, 22, NAVY, { ls: 1, lh: 1.05 }),

    passport: () =>
      `<rect x="112" y="64" width="184" height="280" rx="10" fill="${COURT}"/>`
      + `<rect x="112" y="64" width="18" height="280" rx="4" fill="rgba(0,0,0,.18)"/>`
      + court(212, 168, 46, '#E9D9A0', 2.4)
      + text('PADEL', 212, 268, 30, '#E9D9A0', { ls: 4 }) + text('PASAPORTU', 212, 300, 22, '#E9D9A0', { ls: 3 }),

    pin: () =>
      `<circle cx="200" cy="200" r="118" fill="#D6B656"/><circle cx="200" cy="200" r="104" fill="${NAVY}"/>`
      + ball(200, 158, 34)
      + text('GOLDEN', 200, 226, 34, '#FFFFFF', { ls: 2 }) + text('POINT', 200, 258, 34, BALL, { ls: 2 }),

    pinset: () => {
      const pin = (x, y, fill, inner) => `<g transform="translate(${x} ${y})"><circle r="68" fill="#D6B656"/><circle r="58" fill="${fill}"/>${inner}</g>`;
      return pin(122, 122, NAVY, text('BANDEJA', 0, 0, 26, '#FFFFFF', { ls: 1 }))
        + pin(278, 122, BALL, text('VÍBORA', 0, 0, 26, NAVY, { ls: 1 }))
        + pin(122, 278, COURT, text('CHIQUITA', 0, 0, 22, '#FFFFFF', { ls: 1 }))
        + pin(278, 278, '#FFFFFF', text('GLOBO', 0, 0, 28, NAVY, { ls: 1 }));
    },

    partner: () => {
      const t = (dx, c, ink, word) => `<g transform="translate(${dx} 70) scale(0.56)">${teeBody(c)}${text(word, 200, 196, 64, ink, { ls: 2 })}</g>`;
      return t(-6, '#FFFFFF', COURT, 'BENDE!') + t(182, NAVY, BALL, 'SENDE!');
    },
  };

  function render(p, vi = 0) {
    const v = (p.variants && p.variants[vi]) || { c: '#FFFFFF', i: NAVY };
    const body = (draw[p.art.type] || (() => ''))(p.art, v);
    return `<svg viewBox="0 0 400 400" role="img" aria-label="${p.name}" style="--art-bg: var(--tile-${p.tile})">`
      + `<rect width="400" height="400" fill="var(--art-bg)"/>${body}</svg>`;
  }

  window.ART = { render, racket, ball, court };
})();
