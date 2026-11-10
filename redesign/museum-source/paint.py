# Turns a rendered scene into an oil-painting look: wobbly hand-drawn edges,
# oil brushwork, directional stroke texture, canvas weave, warm varnish and a
# soft vignette. Usage: python3 -I paint.py raw out
import sys, os, glob
import numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)
def smooth_noise(h, w, scale, seed):
    r = np.random.default_rng(seed).standard_normal((h // scale + 2, w // scale + 2)).astype(np.float32)
    return cv2.resize(r, (w, h), interpolation=cv2.INTER_CUBIC)
for f in sorted(glob.glob(os.path.join(src, "*.png"))):
    img = cv2.imread(f)
    h, w = img.shape[:2]
    seed = abs(hash(os.path.basename(f))) % 1000
    # 1) hand-drawn wobble
    dx = smooth_noise(h, w, 18, seed) * 1.6 + smooth_noise(h, w, 90, seed + 1) * 3
    dy = smooth_noise(h, w, 18, seed + 2) * 1.6 + smooth_noise(h, w, 90, seed + 3) * 3
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    img = cv2.remap(img, gx + dx, gy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # 2) oil brushwork (two passes: broad, then finer)
    img = cv2.xphoto.oilPainting(img, 7, 1)
    img = cv2.xphoto.oilPainting(img, 4, 1)
    # 3) directional brush strokes modulating value
    strokes = np.zeros((h, w), np.float32)
    ang_field = smooth_noise(h, w, 160, seed + 5) * 0.9
    for _ in range(9000):
        x, y = rng.integers(0, w), rng.integers(0, h)
        a = ang_field[y, x] + rng.normal(0, 0.25)
        L = rng.uniform(10, 34); t = rng.uniform(1.5, 4.5)
        x2, y2 = int(x + np.cos(a) * L), int(y + np.sin(a) * L)
        cv2.line(strokes, (int(x), int(y)), (x2, y2), float(rng.uniform(-1, 1)), int(t), cv2.LINE_AA)
    strokes = cv2.GaussianBlur(strokes, (0, 0), 0.8)
    f32 = img.astype(np.float32) / 255.0
    f32 *= (1 + strokes[..., None] * 0.07)
    # 4) canvas weave
    weave = (np.sin(gx * 0.9) * np.sin(gy * 0.9)) * 0.5 + 0.5
    weave = cv2.GaussianBlur(weave.astype(np.float32), (0, 0), 0.6)
    grain = np.random.default_rng(seed + 9).normal(0, 1, (h, w)).astype(np.float32)
    f32 *= (1 - 0.045 + weave[..., None] * 0.09) * (1 + grain[..., None] * 0.018)
    # 5) warm varnish + gentle S-curve
    b, g, r = f32[..., 0], f32[..., 1], f32[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    f32[..., 2] = r + 0.035 * lum; f32[..., 0] = b - 0.03 * lum
    f32 = np.clip(f32, 0, 1)
    f32 = f32 + 0.08 * (f32 - 0.5) * (1 - np.abs(f32 - 0.5) * 2)
    # 6) vignette
    vy, vx = (gy / h - 0.5), (gx / w - 0.5)
    vig = 1 - 0.32 * np.clip((vx ** 2 * 1.2 + vy ** 2 * 1.6) * 2.2, 0, 1) ** 1.4
    f32 *= vig[..., None]
    outimg = (np.clip(f32, 0, 1) * 255).astype(np.uint8)
    outimg = cv2.resize(outimg, (1200, 800), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(out, os.path.basename(f)[:-4] + ".jpg"), outimg, [cv2.IMWRITE_JPEG_QUALITY, 84, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
    print(os.path.basename(f), end=" ", flush=True)
