"""Fotoğraf gerçekçiliğinde tişört "flat-lay" görselleri üretir (ürün çekimi gelene kadar).

Kumaş bir yükseklik haritası olarak modellenir (kenar kabarıklığı, kırışıklıklar, dikişler,
yaka ribanası, örgü dokusu), normal haritasıyla ışıklandırılır ve stüdyo zemini üzerine
gölgesiyle yerleştirilir. Baskı, kumaşın kıvrımlarına göre bükülür.

Kullanım:
    python3 tools/render_tees.py            # site/img/ altına mia-tuya, mia, tuya yazar
Gerekenler: numpy, scipy, Pillow
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'tools', 'fonts', 'SchibstedGrotesk-SemiBold.ttf')
OUT = os.path.join(ROOT, 'site', 'img')

S = 1600          # tek tişört tuvali (px)
SCENE = 1800      # sahne, sonra yarıya küçültülür
FINAL = 900


# --- Geometri ---------------------------------------------------------------

def cubic(p0, p1, p2, p3, n=60):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def line(p0, p1, n=20):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) * np.array(p0) + t * np.array(p1)


def outline(rng):
    j = lambda p: (p[0] + rng.normal(0, 0.0025), p[1] + rng.normal(0, 0.0025))
    segs = [
        cubic((0.405, 0.115), (0.45, 0.104), (0.55, 0.104), (0.595, 0.115)),        # arka yaka
        line((0.595, 0.115), j((0.712, 0.156))),                                     # sağ omuz
        cubic((0.712, 0.156), (0.785, 0.183), (0.86, 0.245), j((0.905, 0.305))),      # sağ kol üstü
        line((0.905, 0.305), (0.808, 0.405)),                                          # sağ kol ağzı
        cubic((0.808, 0.405), (0.785, 0.385), (0.762, 0.378), (0.746, 0.388)),           # koltuk altı
        cubic((0.746, 0.388), (0.752, 0.56), (0.748, 0.76), j((0.754, 0.888))),       # sağ yan
        cubic((0.754, 0.888), (0.6, 0.898), (0.4, 0.898), (0.246, 0.888)),           # etek
        cubic((0.246, 0.888), (0.252, 0.76), (0.248, 0.56), (0.254, 0.388)),          # sol yan
        cubic((0.254, 0.388), (0.238, 0.378), (0.215, 0.385), (0.192, 0.405)),
        line((0.192, 0.405), j((0.095, 0.305))),
        cubic((0.095, 0.305), (0.14, 0.245), (0.215, 0.183), (0.288, 0.156)),
        line((0.288, 0.156), (0.405, 0.115)),
    ]
    return np.vstack(segs)


FRONT_NECK = cubic((0.405, 0.115), (0.425, 0.186), (0.575, 0.186), (0.595, 0.115))
BACK_NECK = cubic((0.405, 0.115), (0.45, 0.104), (0.55, 0.104), (0.595, 0.115))
SLEEVE_SEAMS = [
    cubic((0.712, 0.156), (0.726, 0.23), (0.736, 0.32), (0.746, 0.388)),
    cubic((0.288, 0.156), (0.274, 0.23), (0.264, 0.32), (0.254, 0.388)),
]
HEM = cubic((0.754, 0.888), (0.6, 0.898), (0.4, 0.898), (0.246, 0.888))


def raster_poly(pts, size=S):
    im = Image.new('L', (size, size), 0)
    ImageDraw.Draw(im).polygon([tuple(p * size) for p in pts], fill=255)
    return np.asarray(im, dtype=np.float32) / 255


def dist_to(pts, size=S):
    im = Image.new('L', (size, size), 255)
    ImageDraw.Draw(im).line([tuple(p * size) for p in pts], fill=0, width=1)
    return ndimage.distance_transform_edt(np.asarray(im) > 0).astype(np.float32)


def offset(pts, dx, dy):
    return pts + np.array([dx, dy])


def gauss(d, w):
    return np.exp(-(d ** 2) / (2 * w ** 2))


def noise(rng, sigma, size=S):
    n = ndimage.gaussian_filter(rng.standard_normal((size, size)).astype(np.float32), sigma)
    return n / (n.std() + 1e-6)


def fold(X, Y, p0, p1, w, amp, crease=False):
    p0, p1 = np.array(p0) * S, np.array(p1) * S
    d = p1 - p0
    L = np.hypot(*d)
    u = d / L
    rx, ry = X - p0[0], Y - p0[1]
    t = (rx * u[0] + ry * u[1]) / L
    perp = -rx * u[1] + ry * u[0]
    along = np.clip(np.sin(np.pi * np.clip(t, 0, 1)), 0, 1) ** 0.8
    if crease:
        return amp * along * (perp / (w * S)) * gauss(perp, w * S) * 1.65
    return amp * along * gauss(perp, w * S)


# --- Baskı ------------------------------------------------------------------

def text_mask(text, width_frac, center, tracking=0.12):
    font_px = 200
    font = ImageFont.truetype(FONT, font_px)
    adv = [font.getlength(c) for c in text]
    total = sum(adv) + tracking * font_px * (len(text) - 1)
    scale = width_frac * S / total
    font = ImageFont.truetype(FONT, max(8, int(round(font_px * scale))))
    fpx = font.size
    adv = [font.getlength(c) for c in text]
    total = sum(adv) + tracking * fpx * (len(text) - 1)
    im = Image.new('L', (S, S), 0)
    dr = ImageDraw.Draw(im)
    x = center[0] * S - total / 2
    y = center[1] * S
    for c, a in zip(text, adv):
        dr.text((x, y), c, font=font, fill=255, anchor='ls')
        x += a + tracking * fpx
    return np.asarray(im, dtype=np.float32) / 255


# --- Tişört render ----------------------------------------------------------

def render_tee(albedo, ink, text, seed):
    rng = np.random.default_rng(seed)
    Y, X = np.mgrid[0:S, 0:S].astype(np.float32)

    mask = raster_poly(outline(rng))
    # kenarlar cetvel gibi düz olmasın: siluete hafif dalga
    wx = 3.5 * noise(rng, 0.03 * S) + 0.8 * noise(rng, 0.006 * S)
    wy = 3.5 * noise(rng, 0.03 * S) + 0.8 * noise(rng, 0.006 * S)
    mask = ndimage.map_coordinates(mask, [Y + wy, X + wx], order=1)
    neck_open = raster_poly(np.vstack([BACK_NECK, FRONT_NECK[::-1]]))
    d_in = ndimage.distance_transform_edt(mask > 0.5).astype(np.float32)

    H = np.zeros((S, S), np.float32)
    # kenar kabarıklığı: kumaş iki kat, kenarda yuvarlanır
    H += 7.0 * (1 - np.exp(-d_in / (0.011 * S)))
    # yaka açıklığı: içeride arka panel, bir kat aşağıda
    H -= 4.0 * ndimage.gaussian_filter(neck_open, 3)

    # yaka ribanası (ön ve arka), üzerinde ince rib çizgileri
    d_front = dist_to(FRONT_NECK)
    d_back = dist_to(BACK_NECK)
    rib_w = 0.016 * S
    front_rib = (d_front < rib_w) & (neck_open < 0.5) & (mask > 0.5)
    back_rib = (d_back < 0.012 * S) & (neck_open > 0.5)
    rib = ndimage.gaussian_filter((front_rib | back_rib).astype(np.float32), 1.2)
    ang = np.arctan2(Y - 0.06 * S, X - 0.5 * S)
    H += rib * (2.2 + 0.35 * np.sin(ang * 260))
    H -= 1.4 * gauss(d_front - rib_w, 1.3) * (mask > 0.5) * (neck_open < 0.5)  # ribana dikişi

    # kol takma dikişleri
    for seam in SLEEVE_SEAMS:
        d = dist_to(seam)
        H += -1.5 * gauss(d, 1.3) + 0.9 * gauss(d - 4, 2.5)

    # etek: kıvrılmış bant + çift iğne dikiş
    d_hem = dist_to(HEM)
    hem_band = (d_hem < 0.026 * S) & (Y > 0.8 * S)
    H += 1.2 * ndimage.gaussian_filter(hem_band.astype(np.float32), 2)
    for off in (0.021, 0.027):
        d = dist_to(offset(HEM, 0, -off))
        H -= 1.1 * gauss(d, 1.0) * (Y > 0.8 * S)
    # kol ağızları
    for a, b, sh in (((0.905, 0.305), (0.808, 0.405), (0.712, 0.156)), ((0.095, 0.305), (0.192, 0.405), (0.288, 0.156))):
        a, b, sh = np.array(a), np.array(b), np.array(sh)
        n = np.array([-(b - a)[1], (b - a)[0]])
        n /= np.hypot(*n)
        if np.dot(n, sh - (a + b) / 2) < 0:
            n = -n  # kol içine, omuza doğru
        cuff = np.vstack([a - (b - a) * 0.1, b + (b - a) * 0.1])
        dc = dist_to(cuff)
        H += 1.0 * ndimage.gaussian_filter(((dc < 0.022 * S) & (mask > 0.5)).astype(np.float32), 2)
        for off in (0.017, 0.022):
            d = dist_to(cuff + n * off)
            H -= 1.0 * gauss(d, 1.0)

    # kırışıklıklar
    j = lambda v, s=0.012: v + rng.normal(0, s)
    folds = [
        ((0.27, j(0.41)), (j(0.41), j(0.58)), 0.026, 6.5),
        ((0.73, j(0.41)), (j(0.60), j(0.56)), 0.022, 5.0),
        ((j(0.28), j(0.67)), (j(0.64), j(0.63)), 0.034, 5.0),
        ((j(0.36), j(0.79)), (j(0.72), j(0.775)), 0.028, -4.0),
        ((j(0.30), j(0.50)), (j(0.52), j(0.46)), 0.045, 3.0),
        ((0.81, 0.23), (j(0.85), j(0.35)), 0.016, 3.5),
        ((0.19, 0.23), (j(0.15), j(0.35)), 0.016, 3.0),
    ]
    for p0, p1, w, a in folds:
        H += fold(X, Y, p0, p1, w, a * rng.uniform(0.85, 1.15))
    # paketten çıkmış tişörtün katlama izleri
    creases = [
        ((j(0.355, 0.004), 0.30), (j(0.36, 0.004), 0.86), 0.006, 0.55),
        ((j(0.645, 0.004), 0.32), (j(0.64, 0.004), 0.84), 0.006, -0.45),
        ((0.27, j(0.565, 0.006)), (0.73, j(0.57, 0.006)), 0.006, 0.75),
    ]
    for p0, p1, w, a in creases:
        H += fold(X, Y, p0, p1, w, a, crease=True)

    # düşük frekanslı dalgalanma + örgü dokusu
    H += 4.0 * noise(rng, 0.07 * S) + 0.35 * noise(rng, 0.02 * S)
    micro = noise(rng, 0.7)
    wales = ndimage.gaussian_filter(rng.standard_normal((S, S)).astype(np.float32), (3.0, 0.6))
    wales /= wales.std() + 1e-6
    H += 0.06 * micro + 0.05 * wales
    H *= np.clip(mask * 1.0, 0, 1)

    # yakada dokuma etiket (arka panel içinde)
    label = ((np.abs(X - 0.5 * S) < 0.013 * S) & (np.abs(Y - 0.128 * S) < 0.007 * S)).astype(np.float32)
    label = ndimage.gaussian_filter(label, 1) * neck_open
    H += 1.0 * label

    # ışıklandırma
    gy, gx = np.gradient(H)
    k = 1.0
    N = np.stack([-gx * k, -gy * k, np.ones_like(H)], -1)
    N /= np.linalg.norm(N, axis=-1, keepdims=True)
    L = np.array([-0.45, -0.65, 1.0])
    L /= np.linalg.norm(L)
    diff = np.clip(N @ L, 0, 1)
    s = diff / L[2]
    ao = 1 + np.clip(H - ndimage.gaussian_filter(H, 0.02 * S), -40, 0) * 0.035
    ao = np.clip(ao, 0.55, 1)

    alb = np.ones((S, S, 3), np.float32) * np.array(albedo, np.float32)
    inside = (neck_open > 0.5) & ~back_rib
    alb[inside] *= 0.86
    lab_col = np.array([0.16, 0.20, 0.32], np.float32)
    alb = alb * (1 - label[..., None]) + lab_col * label[..., None]

    if text:
        tm = text_mask(text, 0.098, (0.5, 0.287))
        # baskı kumaşla birlikte bükülsün
        lowH = ndimage.gaussian_filter(H, 6)
        ly, lx = np.gradient(lowH)
        warped = ndimage.map_coordinates(tm, [Y + ly * 1.4, X + lx * 1.4], order=1)
        warped = ndimage.gaussian_filter(warped, 0.6)
        warped *= np.clip(0.88 + 0.12 * micro, 0, 1)  # su bazlı baskı: doku içinden görünür
        a = np.clip(warped * 0.97, 0, 1)[..., None]
        alb = alb * (1 - a) + np.array(ink, np.float32) * a

    dark = (1 - alb.mean(-1, keepdims=True))  # koyu kumaşta parlama daha belirgin
    col = alb * (1 + (s[..., None] - 1) * 0.55) + (0.03 + 0.13 * dark) * (s[..., None] - 1)
    col *= ao[..., None]
    col *= (0.86 + 0.14 * (1 - np.exp(-d_in / 5.0)))[..., None]
    # gölgede hafif soğuk ton
    cool = np.clip(1 - s, 0, 0.4)[..., None]
    col = col * (1 + cool * 0.15 * (np.array([0.96, 0.99, 1.05]) - 1))
    col = np.clip(col, 0, 1)

    _, (iy, ix) = ndimage.distance_transform_edt(mask < 0.5, return_indices=True)
    col = col[iy, ix]
    alpha = ndimage.gaussian_filter(mask, 0.7)
    rgba = np.dstack([col, alpha])
    return Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')


# --- Sahne ------------------------------------------------------------------

def background(rng):
    Y, X = np.mgrid[0:SCENE, 0:SCENE].astype(np.float32) / SCENE
    base = np.array([0.905, 0.912, 0.918], np.float32)
    light = 1.04 - 0.10 * (0.6 * X + 0.4 * Y) - 0.03 * np.exp(-((X - 0.9) ** 2 + (Y - 0.95) ** 2) / 0.1)
    blot = ndimage.gaussian_filter(rng.standard_normal((SCENE, SCENE)).astype(np.float32), 90)
    blot /= blot.std() + 1e-6
    grain = rng.standard_normal((SCENE, SCENE)).astype(np.float32)
    v = light * (1 + 0.015 * blot + 0.006 * grain)
    return base * v[..., None]


def place(scene, tee_img, size, center, rot):
    t = tee_img.resize((size, size), Image.LANCZOS).rotate(rot, Image.BICUBIC, expand=True)
    arr = np.asarray(t, dtype=np.float32) / 255
    h, w = arr.shape[:2]
    x0 = int(center[0] * SCENE - w / 2)
    y0 = int(center[1] * SCENE - h / 2)
    full = np.zeros((SCENE, SCENE, 4), np.float32)
    xs, ys = max(0, x0), max(0, y0)
    xe, ye = min(SCENE, x0 + w), min(SCENE, y0 + h)
    full[ys:ye, xs:xe] = arr[ys - y0:ye - y0, xs - x0:xe - x0]
    a = full[..., 3]
    soft = ndimage.shift(ndimage.gaussian_filter(a, 26), (22, 14), order=1)
    contact = ndimage.shift(ndimage.gaussian_filter(a, 5), (4, 3), order=1)
    scene *= (1 - 0.26 * soft - 0.22 * contact)[..., None]
    scene[:] = scene * (1 - a[..., None]) + full[..., :3] * a[..., None]
    return scene


def finish(scene, rng, path):
    Y, X = np.mgrid[0:SCENE, 0:SCENE].astype(np.float32) / SCENE
    vig = 1 - 0.10 * ((X - 0.45) ** 2 + (Y - 0.45) ** 2)
    light = 1.02 - 0.04 * (0.6 * X + 0.4 * Y)
    out = scene * (vig * light)[..., None]
    out += rng.standard_normal(out.shape[:2]).astype(np.float32)[..., None] * 0.006
    img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGB').resize((FINAL, FINAL), Image.LANCZOS)
    img.save(path, quality=84, optimize=True, progressive=True)
    print('wrote', path, os.path.getsize(path) // 1024, 'KB')


WHITE = (0.945, 0.945, 0.938)
BLACK = (0.092, 0.094, 0.100)
INK_BLACK = (0.06, 0.06, 0.065)
INK_WHITE = (0.93, 0.93, 0.91)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    mia = render_tee(WHITE, INK_BLACK, '¡MÍA!', seed=7)
    tuya = render_tee(BLACK, INK_WHITE, '¡TUYA!', seed=11)

    rng = np.random.default_rng(3)
    sc = background(rng)
    sc = place(sc, mia, 1120, (0.335, 0.405), -7)
    sc = place(sc, tuya, 1120, (0.665, 0.595), 6)
    finish(sc, rng, os.path.join(OUT, 'mia-tuya.jpg'))

    for name, tee, rot in (('mia', mia, -3), ('tuya', tuya, 3)):
        rng = np.random.default_rng(5)
        sc = background(rng)
        sc = place(sc, tee, 1700, (0.5, 0.5), rot)
        finish(sc, rng, os.path.join(OUT, f'{name}.jpg'))
