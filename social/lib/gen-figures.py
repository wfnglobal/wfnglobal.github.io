"""Character kit v2 for social/templates/reel-scenes.html (run: python3 social/lib/gen-figures.py).
Builds human silhouettes out of tapered 'tubes' (spine points + radii) so
limbs, waists and shoulders read like a person, not a sack. Same ids,
poses and anchors as v1: feet / floor at y=0, ~500 units tall."""
import math, sys

def _catmull(pts, closed=True):
    n = len(pts)
    if n < 3:
        return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + (" Z" if closed else "")
    pts = [tuple(p) for p in pts]
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed or i > 0 else pts[i]
        p1 = pts[i]; p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed or i + 2 < n else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        if len(p1) > 2: c1 = p1[:2]
        if len(p2) > 2: c2 = p2[:2]
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + (" Z" if closed else "")

def tube(spine, cap=True):
    """spine: [(x, y, r)] -> closed smooth outline."""
    L, R = [], []
    for i, (x, y, r) in enumerate(spine):
        xa, ya = spine[max(i - 1, 0)][:2]; xb, yb = spine[min(i + 1, len(spine) - 1)][:2]
        dx, dy = xb - xa, yb - ya; m = math.hypot(dx, dy) or 1
        nx, ny = -dy / m, dx / m
        L.append((x + nx * r, y + ny * r)); R.append((x - nx * r, y - ny * r))
    pts = L + R[::-1]
    if cap:
        # round the two ends a touch
        x0, y0, r0 = spine[0]; x1, y1, r1 = spine[-1]
        xa, ya = spine[1][:2]; xb, yb = spine[-2][:2]
        def tip(x, y, ox, oy, r):
            m = math.hypot(x - ox, y - oy) or 1
            return (x + (x - ox) / m * r * 0.6, y + (y - oy) / m * r * 0.6)
        pts = [tip(x0, y0, xa, ya, r0)] + L + [tip(x1, y1, xb, yb, r1)] + R[::-1]
    return _catmull(pts)

def poly(pts):
    return _catmull(pts)

def P(d):
    return f'<path d="{d}"/>'

FD = '<g class="fd" fill="none" stroke="#fff" stroke-opacity="0.11" stroke-width="3" stroke-linecap="round">{}</g>'
RIM = '<g class="rim" fill="none" style="stroke:var(--rim,transparent)" stroke-width="3.2" stroke-linecap="round" opacity="0.9">{}</g>'
def lines(*ds):
    return "".join(f'<path d="{d}"/>' for d in ds)

# ── shared heads ───────────────────────────────────────────────────────
# Bearded man in headcloth, profile facing LEFT. Crown ~ -506, beard tip ~ -418.
HEAD_L = ("M -22 -484 C -18 -502 2 -510 20 -506 C 38 -502 46 -486 46 -466 C 46 -448 50 -434 60 -420"
          " C 50 -414 34 -412 20 -414 C 8 -414 -4 -414 -12 -416 C -20 -418 -26 -422 -30 -430"
          " C -33 -436 -33 -442 -31 -446 C -34 -449 -37 -452 -37 -456 C -40 -459 -42 -463 -41 -466"
          " C -38 -468 -35 -469 -34 -472 C -32 -478 -28 -482 -22 -484 Z")
HEAD_L_FD = ["M -18 -486 C -6 -480 10 -480 34 -486", "M -18 -480 C -6 -474 10 -474 34 -480"]
HEAD_L_RIM = ["M -26 -480 C -18 -500 2 -510 20 -506 C 38 -502 46 -486 46 -466 C 46 -448 50 -434 60 -420"]

def mirror(d):
    """mirror a path's x coordinates (for right-facing variants)."""
    import re
    out = []
    toks = re.findall(r"[MCLZ]|-?\d+\.?\d*", d)
    expect_x = True
    for t in toks:
        if t in "MCLZ":
            out.append(t); expect_x = True; continue
        v = float(t)
        if expect_x: v = -v
        out.append(f"{v:g}"); expect_x = not expect_x
    return " ".join(out)

# Body for a standing robed man, three-quarter facing left.
def robe_body(back_flare=92, front_flare=-94):
    return poly([(-8, -420), (-32, -414), (-52, -402), (-60, -380), (-58, -340), (-52, -300),
                 (-50, -272), (-58, -232), (-68, -170), (-80, -90), (front_flare, -4), (front_flare, 0, 's'),
                 (back_flare, 0, 's'), (back_flare, -4), (82, -90), (74, -170), (66, -232), (60, -272),
                 (62, -300), (66, -340), (66, -380), (58, -404), (34, -418)])

SASH = "M -50 -286 L 60 -286 L 62 -264 L -50 -262 Z"
FEET_L = [P("M -96 0 C -98 -8 -92 -14 -80 -14 L -56 -12 L -52 0 Z"), P("M 40 0 L 44 -10 L 70 -10 C 80 -10 86 -6 86 0 Z")]

# ── fig-staff ─────────────────────────────────────────────────────────
staff = [
    P("M -116 -380 C -118 -404 -102 -420 -84 -416 C -68 -412 -64 -394 -74 -384 L -82 -392 C -78 -398 -80 -406 -88 -407 C -100 -408 -106 -396 -106 -380 L -103 0 L -113 0 Z"),
    P(HEAD_L), P(robe_body()),
    # mantle trailing behind
    P(poly([(56, -404), (80, -370), (106, -310), (134, -230), (156, -160), (174, -116), (150, -124), (118, -138), (92, -156), (76, -200), (68, -290)])),
    # near arm: shoulder -> elbow -> forearm forward to the staff
    P(tube([(-46, -396, 18), (-58, -360, 17), (-66, -318, 15), (-80, -300, 12), (-98, -292, 10)])),
    # hand gripping the staff
    P(poly([(-100, -304), (-112, -306), (-118, -296), (-118, -282), (-108, -276), (-96, -280), (-92, -292)])),
    *FEET_L, P(SASH),
]
staff_fd = FD.format(lines(*HEAD_L_FD, "M -10 -360 C -16 -300 -22 -200 -34 -40", "M 30 -360 C 32 -300 36 -200 46 -40",
                           "M -54 -258 C -66 -180 -76 -100 -86 -20", "M 76 -290 C 104 -240 126 -190 146 -140"))
staff_rim = RIM.format(lines(*HEAD_L_RIM, "M 60 -420 C 66 -404 66 -380 66 -340", "M -50 -404 C -62 -384 -66 -350 -68 -318",
                             "M -116 -380 C -118 -404 -102 -420 -84 -416"))

# ── fig-robe ──────────────────────────────────────────────────────────
robe = [
    P(HEAD_L), P(robe_body()),
    P(poly([(56, -404), (78, -360), (96, -300), (110, -230), (122, -176), (132, -150), (114, -156), (96, -170), (84, -190), (76, -260)])),
    # near arm hanging, slight bend, hand
    P(tube([(-48, -398, 18), (-62, -360, 17), (-68, -310, 15), (-68, -262, 13), (-66, -224, 11)])),
    P(poly([(-76, -230), (-58, -230), (-56, -210), (-60, -192), (-68, -186), (-76, -194), (-78, -212)])),
    # far arm, partly hidden behind the body
    P(tube([(58, -398, 15), (70, -350, 14), (74, -300, 12), (74, -250, 11)])),
    P(poly([(66, -256), (82, -256), (84, -236), (78, -222), (70, -224), (66, -240)])),
    *FEET_L, P(SASH),
]
robe_fd = FD.format(lines(*HEAD_L_FD, "M -10 -360 C -16 -300 -22 -200 -34 -40", "M 30 -360 C 32 -300 36 -200 46 -40",
                          "M -52 -250 C -64 -170 -74 -100 -86 -20", "M -62 -360 C -66 -320 -66 -280 -64 -240"))
robe_rim = RIM.format(lines(*HEAD_L_RIM, "M 60 -420 C 70 -404 74 -380 72 -340", "M -50 -404 C -64 -384 -72 -340 -76 -300"))

# ── fig-raise (facing us) ─────────────────────────────────────────────
HEAD_F = ("M -30 -478 C -32 -502 -16 -516 0 -516 C 16 -516 32 -502 30 -478 C 30 -464 32 -450 36 -438"
          " C 30 -436 24 -436 20 -438 C 18 -426 12 -412 0 -398 C -12 -412 -18 -426 -20 -438 C -24 -436 -30 -436 -36 -438 C -32 -450 -30 -464 -30 -478 Z")
def raise_arm(s):
    # s = +1 right, -1 left (mirror)
    sh = (s * 56, -404); el = (s * 92, -470); wr = (s * 110, -530)
    arm = tube([(sh[0], sh[1], 17), ((sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2, 15), (el[0], el[1], 13),
                ((el[0] + wr[0]) / 2, (el[1] + wr[1]) / 2, 11), (wr[0], wr[1], 9.5)])
    # wide sleeve fallen back to the elbow, hanging toward the shoulder
    sleeve = poly([(s * 76, -448), (s * 100, -476), (s * 112, -470), (s * 104, -446), (s * 92, -420), (s * 74, -404), (s * 60, -398)])
    # open hand: palm + thumb + fingers as one shape
    hx, hy = wr
    hand = poly([(hx - s * 10, hy + 4), (hx - s * 14, hy - 12), (hx - s * 12, hy - 34), (hx - s * 6, hy - 40), (hx - s * 2, hy - 34),
                 (hx + s * 1, hy - 44), (hx + s * 6, hy - 42), (hx + s * 8, hy - 30), (hx + s * 12, hy - 34), (hx + s * 17, hy - 28),
                 (hx + s * 16, hy - 12), (hx + s * 22, hy - 16), (hx + s * 24, hy - 8), (hx + s * 14, hy + 6)])
    return [P(arm), P(sleeve), P(hand)]
raise_ = [
    P(HEAD_F),
    P(poly([(0, -404), (-30, -418), (-54, -408), (-64, -384), (-62, -340), (-54, -290), (-52, -268), (-62, -220), (-74, -150),
            (-88, -70), (-99, -4), (-100, 0, 's'), (100, 0, 's'), (99, -4), (88, -70), (74, -150), (62, -220), (52, -268), (54, -290),
            (62, -340), (64, -384), (54, -408), (30, -418)])),
    *raise_arm(-1), *raise_arm(1),
    P(poly([(64, -310), (96, -260), (128, -200), (164, -128), (138, -136), (108, -150), (80, -170), (66, -230)])),
    P("M -50 -282 L 50 -282 L 52 -262 L -52 -262 Z"),
    P("M -60 0 C -62 -8 -56 -14 -44 -14 L -20 -12 L -18 0 Z"), P("M 18 0 L 20 -12 L 44 -14 C 56 -14 62 -8 60 0 Z"),
]
raise_fd = FD.format(lines("M -26 -484 C -10 -478 10 -478 26 -484", "M -2 -396 L -6 -40", "M -36 -250 C -44 -180 -54 -100 -66 -30",
                           "M 36 -250 C 44 -180 54 -100 66 -30", "M -20 -440 C -12 -432 12 -432 20 -440"))
raise_rim = RIM.format(lines("M -30 -480 C -32 -502 -16 -516 0 -516 C 16 -516 32 -502 30 -480",
                             "M -112 -528 C -104 -500 -90 -466 -58 -416", "M 112 -528 C 104 -500 90 -466 58 -416"))

# ── fig-seated (Job), facing right, bowed ─────────────────────────────
HEAD_SEATED = ("M 32 -250 C 34 -274 54 -290 76 -286 C 96 -282 108 -266 108 -248 C 110 -242 114 -236 116 -230"
               " C 112 -228 110 -226 110 -222 C 112 -218 112 -214 108 -212 C 110 -206 108 -200 104 -196"
               " C 104 -186 100 -172 92 -160 C 84 -150 74 -150 70 -160 C 62 -172 48 -186 40 -200 C 34 -214 30 -232 32 -250 Z")
seated = [
    # curved back and mantle down to the ground; drawn-up knees in front
    P(poly([(-88, 0, 's'), (-92, -50), (-84, -110), (-62, -164), (-30, -206), (4, -232), (36, -240), (60, -214),
            (90, -186), (122, -164), (142, -144), (150, -110), (152, -60), (156, -10), (158, 0, 's'), (-88, 0, 's')])),
    P(HEAD_SEATED),
    # knees drawn up
    P(tube([(40, -120, 34), (90, -150, 32), (130, -130, 28)])),
    # forearm across the knee to the hand with the potsherd
    P(tube([(56, -196, 14), (96, -178, 12), (134, -164, 10), (152, -160, 9)])),
    P(poly([(150, -170), (164, -174), (174, -166), (172, -152), (160, -148), (150, -152)])),
    P(poly([(168, -180), (196, -170), (188, -142), (164, -148)])),
    P("M 112 0 C 114 -8 124 -12 138 -12 C 152 -12 164 -8 168 0 Z"),
]
seated_fd = FD.format(lines("M -50 -160 C -30 -110 -14 -60 -6 -10", "M 10 -200 C 30 -150 54 -120 80 -110",
                            "M 40 -256 C 54 -270 78 -274 98 -266", "M 70 -90 C 100 -70 126 -40 142 -10"))
seated_rim = RIM.format(lines("M 34 -252 C 36 -274 56 -290 78 -286 C 96 -282 108 -266 108 -248",
                              "M -88 -40 C -88 -100 -78 -140 -60 -168 C -38 -200 -10 -226 20 -238"))

# ── fig-david: young king, facing right, face lifted, hand on chest ───
HEAD_DAVID = ("M -24 -440 C -28 -462 -12 -478 6 -476 C 18 -476 28 -468 30 -456 C 34 -452 38 -446 40 -440"
              " C 38 -438 36 -436 34 -436 C 36 -432 35 -428 32 -426 C 34 -422 32 -418 28 -416 C 24 -410 18 -408 12 -408"
              " L 10 -396 L -14 -396 L -14 -414 C -22 -420 -24 -430 -24 -440 Z")
CROWN = "M -28 -458 L -26 -478 L -17 -466 L -8 -484 L 0 -468 L 8 -484 L 15 -467 L 23 -477 L 25 -458 C 10 -464 -14 -464 -28 -458 Z"
david = [
    P(HEAD_DAVID), P(CROWN),
    P(poly([(-4, -398), (-28, -396), (-46, -386), (-54, -364), (-52, -320), (-46, -282), (-46, -262), (-54, -220),
            (-60, -150), (-64, -70), (-66, 0, 's'), (64, 0, 's'), (62, -70), (58, -150), (52, -220), (46, -262), (48, -282),
            (52, -320), (54, -364), (46, -386), (26, -396)])),
    P("M -46 -278 L 48 -278 L 50 -260 L -48 -260 Z"),
    # arm folded, hand on the chest
    P(tube([(40, -388, 15), (50, -350, 14), (40, -322, 12), (16, -330, 10), (4, -336, 9)])),
    P(poly([(8, -346), (-6, -348), (-12, -338), (-8, -326), (4, -324), (10, -332)])),
    # royal cloak billowing behind
    P(poly([(-36, -394), (-62, -366), (-88, -310), (-112, -236), (-130, -170), (-146, -94), (-122, -112), (-98, -150), (-80, -200), (-66, -270), (-56, -340)])),
    P("M -64 0 C -66 -8 -60 -14 -48 -14 L -24 -12 L -22 0 Z"), P("M 20 0 L 22 -12 L 50 -14 C 62 -14 70 -8 68 0 Z"),
]
david_fd = FD.format(lines("M -14 -246 C -18 -160 -20 -80 -24 -10", "M 22 -246 C 24 -160 28 -80 30 -10",
                           "M -56 -340 C -80 -280 -102 -200 -122 -120"))
david_rim = RIM.format(lines("M -26 -458 L -26 -478 L -17 -466 L -8 -484 L 0 -468 L 8 -484 L 15 -467 L 23 -477",
                             "M 30 -456 C 34 -452 38 -446 40 -440", "M 26 -396 C 44 -388 54 -370 54 -340"))

# ── fig-modern: man in shirt and trousers seated at a table, facing right ──
modern = [
    P("M -112 -640 L -100 -640 L -100 0 L -112 0 Z"),
    P("M -112 -300 L 40 -300 L 40 -286 L -112 -286 Z"), P("M 28 -286 L 40 -286 L 40 0 L 28 0 Z"),
    # head: short hair, ear, profile right
    P("M -20 -568 C -22 -592 -4 -606 14 -604 C 32 -602 42 -588 40 -570 C 44 -564 48 -558 48 -552 L 42 -550"
      " C 44 -544 42 -538 38 -536 C 38 -528 32 -524 24 -524 L 20 -510 L -6 -510 L -6 -530 C -16 -538 -20 -552 -20 -568 Z"),
    # torso, slightly leaning toward the table
    P(poly([(4, -514), (-22, -510), (-44, -496), (-56, -470), (-58, -420), (-56, -360), (-56, -310), (-50, -296), (36, -296),
            (40, -340), (40, -400), (36, -456), (28, -492), (18, -508)])),
    # arm: shoulder -> elbow -> forearm along the table -> hand
    P(tube([(10, -488, 15), (26, -444, 14), (44, -404, 12), (80, -392, 11), (118, -386, 10)])),
    P(poly([(116, -396), (132, -398), (144, -390), (144, -378), (130, -374), (116, -376)])),
    # thigh, knee, shin, shoe
    P(tube([(-40, -306, 22), (40, -308, 22), (96, -306, 20)], cap=True)),
    P(tube([(100, -304, 17), (104, -200, 14), (106, -100, 12), (106, -26, 11)])),
    P("M 92 -26 L 116 -28 C 134 -26 148 -16 150 0 L 92 0 Z"),
]
modern_fd = FD.format(lines("M -6 -506 L -10 -320", "M -36 -470 C -44 -420 -46 -370 -46 -320", "M 60 -300 C 80 -300 96 -298 110 -292"))
modern_rim = RIM.format(lines("M -20 -570 C -22 -592 -4 -606 14 -604 C 32 -602 42 -588 40 -570",
                              "M 4 -514 C -22 -510 -44 -496 -56 -470 C -60 -440 -60 -400 -58 -360"))

FIGS = [
    ("fig-staff", "Bearded prophet in robe, headcloth and sash, facing left, gripping a shepherd's staff.", staff, staff_fd, staff_rim),
    ("fig-robe", "Bearded man in robe and headcloth standing, arms at his sides (three-quarter, facing left).", robe, robe_fd, robe_rim),
    ("fig-raise", "Bearded man facing us, both arms lifted high, sleeves fallen back, hands open.", raise_, raise_fd, raise_rim),
    ("fig-seated", "Seated, hunched bearded man (Job), knees drawn up, facing right, a potsherd in his hand.", seated, seated_fd, seated_rim),
    ("fig-david", "Young king, beardless, gold circlet, face lifted, hand on his chest, cloak in the wind (facing right).", david, david_fd, david_rim),
    ("fig-modern", "Modern man in shirt and trousers seated at a table, facing right. Base = floor.", modern, modern_fd, modern_rim),
]

HEADER = """    <!-- Character kit v2: human figures built from tapered limbs, with
         faces in profile, beards, headcloths, sashes, hands and sandaled
         feet. Same ids, anchors and poses as v1 (feet / floor at y=0, ~500
         tall) so every scene that <use>s them upgrades in place. Each one
         is a silhouette that inherits the <use>'s fill, plus:
           .fd  - faint cloth folds (white, low opacity) seen on the solid pass
           .rim - a backlight rim on head and shoulders coloured by the CSS
                  custom property --rim on the solid <use> (transparent when
                  unset). Regenerate with social/lib/gen-figures.py. -->
"""

def build():
    out = [HEADER]
    for fid, desc, parts, fd, rim in FIGS:
        out.append(f"    <!-- {desc} -->\n    <g id=\"{fid}\">\n      " + "\n      ".join(parts) + f"\n      {fd}\n      {rim}\n    </g>\n")
    return "\n".join(out)

START, END = "<!-- figures:start -->", "<!-- figures:end -->"

if __name__ == "__main__":
    # python3 social/lib/gen-figures.py            -> rewrite the block in reel-scenes.html
    # python3 social/lib/gen-figures.py out.svg    -> just write the block to a file
    import os
    if len(sys.argv) > 1:
        open(sys.argv[1], "w").write(build())
    else:
        tpl = os.path.join(os.path.dirname(__file__), "..", "templates", "reel-scenes.html")
        t = open(tpl).read()
        a, b = t.index(START) + len(START), t.index(END)
        open(tpl, "w").write(t[:a] + "\n" + build() + "    " + t[b:])
        print("updated", tpl)
