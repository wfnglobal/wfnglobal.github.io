# Twelve gallery scenes for "The Story of Jesus", composed as SVG and later
# painted (paint.py). 1500x1000. Figures are backlit silhouettes, never faces,
# and the cross is shown at a reverent distance.
import math, random
W, H = 1500, 1000

def defs(extra=""):
    return f'''<defs>
  <filter id="clouds" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves="5" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.55"/><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="soft2"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="soft3"><feGaussianBlur stdDeviation="40"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0.25 0"/></filter>
  {extra}
</defs>'''

def sky(stops, id_="sky"):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="0" y2="1">{s}</linearGradient>'

def glow(cx, cy, r, color, op=0.9):
    gid = f"g{abs(hash((cx,cy,r,color)))%10**8}"
    return (f'<radialGradient id="{gid}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="{color}" stop-opacity="{op}"/><stop offset="0.45" stop-color="{color}" stop-opacity="{op*0.35}"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>',
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{gid})"/>')

def clouds(color="#fff", op=0.5, y=0, h=H, tint=None):
    return f'<g opacity="{op}"><rect x="0" y="{y}" width="{W}" height="{h}" filter="url(#clouds)" fill="{color}"/></g>'

def hills(pts, color, op=1, blur=None):
    d = "M" + " L".join(f"{x},{y}" for x, y in pts) + f" L{W},{H} L0,{H}Z"
    f = f' filter="url(#{blur})"' if blur else ""
    return f'<path d="{d}" fill="{color}" opacity="{op}"{f}/>'

def ridge(y0, amp, seed, color, step=60, op=1, rough=1.0):
    r = random.Random(seed); pts = []
    x = 0; y = y0
    while x <= W + step:
        y = y0 + amp * math.sin(x / 260 + seed) + r.uniform(-amp, amp) * 0.35 * rough
        pts.append((x, y)); x += step
    d = f"M0,{H} L" + " L".join(f"{x:.0f},{y:.0f}" for x, y in pts) + f" L{W},{H}Z"
    return f'<path d="{d}" fill="{color}" opacity="{op}"/>'

def figure(x, y, h, color, kind="stand", lean=0, veil=False, arms=None, flip=1):
    """Robed figure, feet at (x,y), height h. Silhouette only."""
    s = h / 100.0
    t = f'translate({x},{y}) scale({s*flip},{s}) rotate({lean})'
    head = '<ellipse cx="0" cy="-90" rx="7.5" ry="9"/>'
    if veil: head = '<path d="M-10,-80 C-12,-96 -6,-102 0,-102 C7,-102 12,-96 11,-80 C8,-74 -8,-74 -10,-80Z"/>'
    if kind == "stand":
        body = '<path d="M-9,-80 C-16,-76 -19,-60 -20,-40 C-22,-18 -24,-6 -21,0 L21,0 C23,-8 21,-20 19,-40 C18,-60 15,-76 9,-80Z"/>'
    elif kind == "walk":
        body = '<path d="M-9,-80 C-16,-74 -18,-58 -20,-38 C-23,-20 -30,-6 -28,0 L-10,0 L-4,-14 L6,0 L24,0 C22,-10 20,-24 18,-40 C17,-60 15,-76 9,-80Z"/>'
    elif kind == "kneel":
        body = '<path d="M-8,-60 C-16,-56 -18,-42 -18,-30 C-18,-18 -26,-10 -30,0 L26,0 C24,-8 14,-14 12,-24 C12,-38 14,-54 8,-60Z"/>'
        head = '<ellipse cx="0" cy="-70" rx="7.5" ry="9"/>' if not veil else '<path d="M-10,-60 C-12,-76 -6,-82 0,-82 C7,-82 12,-76 11,-60 C8,-54 -8,-54 -10,-60Z"/>'
    elif kind == "sit":
        body = '<path d="M-11,-64 C-24,-58 -28,-40 -28,-24 C-28,-10 -24,-2 -16,0 L32,0 C34,-6 30,-12 20,-14 L6,-17 C10,-30 12,-48 11,-60 C7,-66 -4,-68 -11,-64Z"/>'
        head = '<ellipse cx="-1" cy="-74" rx="8" ry="9.5"/>' if not veil else '<path d="M-11,-64 C-13,-80 -7,-86 -1,-86 C6,-86 11,-80 10,-64 C7,-58 -8,-58 -11,-64Z"/>'
    elif kind == "arms_up":
        body = '<path d="M-9,-80 C-16,-76 -19,-60 -20,-40 C-22,-18 -24,-6 -21,0 L21,0 C23,-8 21,-20 19,-40 C18,-60 15,-76 9,-80Z"/><path d="M-12,-74 L-30,-112 L-24,-114 L-6,-78Z"/><path d="M12,-74 L30,-112 L24,-114 L6,-78Z"/>'
    else:
        body = ""
    extra = arms or ""
    return f'<g transform="{t}" fill="{color}">{head}{body}{extra}</g>'

def crowd(x0, x1, y, h, color, n, seed=1, veil_p=0.35, op=1):
    r = random.Random(seed); out = []
    for i in range(n):
        x = x0 + (x1 - x0) * (i + r.random() * 0.6) / n
        hh = h * r.uniform(0.85, 1.08)
        out.append(figure(x, y + r.uniform(-4, 4), hh, color, "stand", lean=r.uniform(-4, 4), veil=r.random() < veil_p, flip=r.choice([1, -1])))
    return f'<g opacity="{op}">' + "".join(out) + "</g>"

def olive(x, y, s, trunk, leaf, seed=1):
    r = random.Random(seed)
    tr = f'<path d="M{x-10*s},{y} C{x-14*s},{y-40*s} {x+8*s},{y-60*s} {x-6*s},{y-100*s} C{x+4*s},{y-110*s} {x+16*s},{y-70*s} {x+14*s},{y-40*s} C{x+12*s},{y-20*s} {x+18*s},{y-6*s} {x+16*s},{y}Z" fill="{trunk}"/>'
    blobs = "".join(f'<ellipse cx="{x + r.uniform(-90,90)*s:.0f}" cy="{y - r.uniform(90,170)*s:.0f}" rx="{r.uniform(30,60)*s:.0f}" ry="{r.uniform(18,34)*s:.0f}" fill="{leaf}" opacity="{r.uniform(0.75,1):.2f}"/>' for _ in range(14))
    return tr + blobs

def palm(x, y, s, trunk, leaf):
    t = f'<path d="M{x-5*s},{y} C{x-8*s},{y-90*s} {x+10*s},{y-170*s} {x+18*s},{y-230*s} L{x+26*s},{y-228*s} C{x+18*s},{y-170*s} {x+4*s},{y-90*s} {x+6*s},{y}Z" fill="{trunk}"/>'
    cx, cy = x + 22 * s, y - 232 * s
    fr = "".join(f'<path d="M{cx},{cy} Q{cx + math.cos(a)*70*s},{cy + math.sin(a)*40*s - 30*s} {cx + math.cos(a)*120*s},{cy + math.sin(a)*70*s + 20*s} Q{cx + math.cos(a)*60*s},{cy + math.sin(a)*30*s} {cx},{cy}Z" fill="{leaf}"/>' for a in [math.pi*k/4 for k in range(-1, 6)])
    return t + fr

def building(x, y, w, h, color, dome=False, door=None, windows=0, wincolor="#F2C77A"):
    out = f'<rect x="{x}" y="{y-h}" width="{w}" height="{h}" fill="{color}"/>'
    if dome: out += f'<path d="M{x+w*0.2},{y-h} A{w*0.3},{w*0.3} 0 0 1 {x+w*0.8},{y-h}Z" fill="{color}"/>'
    for i in range(windows):
        out += f'<rect x="{x + w*(0.2+0.6*i/max(1,windows-1)) - 4 if windows>1 else x+w/2-4}" y="{y-h*0.65}" width="8" height="12" rx="4" fill="{wincolor}"/>'
    return out

def cross(x, y, h, color, w=None):
    w = w or h * 0.08
    return f'<rect x="{x-w/2}" y="{y-h}" width="{w}" height="{h}" fill="{color}"/><rect x="{x-h*0.3}" y="{y-h*0.78}" width="{h*0.6}" height="{w*0.9}" fill="{color}"/>'

def rays(cx, cy, n, length, color, op=0.25, spread=180, start=0, width=0.06, seed=4):
    r = random.Random(seed); out = []
    for i in range(n):
        a = math.radians(start + spread * i / max(1, n - 1) + r.uniform(-3, 3))
        wa = width * r.uniform(0.5, 1.4)
        x1, y1 = cx + math.cos(a - wa) * length, cy + math.sin(a - wa) * length
        x2, y2 = cx + math.cos(a + wa) * length, cy + math.sin(a + wa) * length
        out.append(f'<path d="M{cx},{cy} L{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}Z" fill="{color}" opacity="{op*r.uniform(0.5,1):.2f}"/>')
    return '<g filter="url(#soft2)" style="mix-blend-mode:screen">' + "".join(out) + "</g>"

def sheep(x, y, s, c="#E9E1D2", d="#3A332C"):
    return f'<g transform="translate({x},{y}) scale({s})"><ellipse cx="0" cy="-12" rx="20" ry="12" fill="{c}"/><ellipse cx="-8" cy="-18" rx="10" ry="8" fill="{c}"/><ellipse cx="8" cy="-17" rx="10" ry="8" fill="{c}"/><ellipse cx="22" cy="-16" rx="6" ry="5" fill="{d}"/><rect x="-12" y="-4" width="3" height="8" fill="{d}"/><rect x="10" y="-4" width="3" height="8" fill="{d}"/></g>'

def donkey(x, y, s, c):
    return f'<g transform="translate({x},{y}) scale({s})" fill="{c}"><ellipse cx="0" cy="-40" rx="38" ry="18"/><path d="M30,-50 L52,-78 L62,-74 L48,-44Z"/><ellipse cx="60" cy="-78" rx="12" ry="8"/><path d="M54,-86 L52,-102 L57,-88Z M62,-86 L64,-101 L66,-86Z"/><rect x="-30" y="-30" width="6" height="30"/><rect x="-18" y="-30" width="6" height="30"/><rect x="16" y="-30" width="6" height="30"/><rect x="26" y="-30" width="6" height="30"/><path d="M-36,-44 L-48,-20 L-44,-20 L-34,-38Z"/></g>'

def svg(body, extra_defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs(extra_defs)}{body}<rect width="{W}" height="{H}" filter="url(#grain)"/></svg>'

SCENES = {}

# I · Prophecy — an old prophet writes by lamplight; through the window, a star over the hills of Bethlehem
def s1():
    g1d, g1 = glow(560, 520, 420, "#F6C77A", 0.85)
    g2d, g2 = glow(1090, 250, 160, "#FFF1C9", 1)
    b = f'''<rect width="{W}" height="{H}" fill="#2A1C14"/>
    <rect x="860" y="120" width="440" height="460" rx="210" ry="210" fill="url(#sky)"/>
    <clipPath id="win"><rect x="860" y="120" width="440" height="460" rx="210" ry="210"/></clipPath>
    <g clip-path="url(#win)">{g2}{rays(1090,250,10,260,"#FFF3D0",0.35,360,0,0.02)}
      <circle cx="1090" cy="250" r="7" fill="#FFF8E6"/>
      {''.join(f'<circle cx="{random.Random(i).uniform(870,1290):.0f}" cy="{random.Random(i*7).uniform(140,420):.0f}" r="{random.Random(i*3).uniform(0.8,2.2):.1f}" fill="#F3EBD8" opacity="0.8"/>' for i in range(40))}
      {ridge(500, 18, 2, "#1B2433")}{ridge(530, 10, 5, "#141A26")}
      <g fill="#C9A167" opacity="0.8">{''.join(f'<rect x="{1000+i*26}" y="{482 + (i%3)*6}" width="18" height="14"/>' for i in range(8))}</g>
    </g>
    <rect x="850" y="110" width="460" height="480" rx="220" ry="220" fill="none" stroke="#4A3324" stroke-width="22"/>
    <rect x="0" y="700" width="{W}" height="300" fill="#3A2618"/>
    {g1}
    <path d="M180,640 L900,640 L940,700 L140,700Z" fill="#5A3B25"/><rect x="180" y="700" width="18" height="300" fill="#3B2617"/><rect x="880" y="700" width="18" height="300" fill="#3B2617"/>
    <path d="M300,600 C420,580 560,590 700,612 L700,640 L300,640Z" fill="#E8D6B0"/><path d="M300,600 C300,620 296,632 300,640" stroke="#B89A6A" stroke-width="10" fill="none"/>
    <g stroke="#3A2A1A" stroke-width="2" opacity="0.6">{''.join(f'<path d="M{330+(i%2)*10},{612+i*5} L{640-(i%3)*30},{614+i*5}"/>' for i in range(5))}</g>
    <path d="M760,640 C760,612 800,600 812,618 C830,606 850,626 832,640Z" fill="#8A5A2E"/><path d="M812,608 C806,590 818,576 812,560 C826,578 822,596 812,608Z" fill="#FFE2A0"/>
    <rect x="380" y="860" width="140" height="18" fill="#24170E"/><rect x="392" y="878" width="14" height="110" fill="#24170E"/><rect x="494" y="878" width="14" height="110" fill="#24170E"/>{figure(450, 862, 360, "#1E140D", "sit", veil=True)}
    <path d="M500,640 L600,600 L606,606 L508,648Z" fill="#E9D9B7"/>
    {crowd(0,0,0,0,"#000",0)}'''
    return svg(b, sky([(0, "#0F1A33"), (0.7, "#2B3558"), (1, "#5A4A5A")]) + g1d + g2d)
SCENES["01-prophecy"] = s1

# II · Bethlehem — a lit stable under the star, shepherds on the hill
def s2():
    gs_d, gs = glow(760, 140, 260, "#FFF2CF", 1)
    gb_d, gb = glow(760, 690, 360, "#F4B962", 0.95)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#9FB2D6", 0.18, 0, 600)}
    {''.join(f'<circle cx="{random.Random(i).uniform(0,1500):.0f}" cy="{random.Random(i*5).uniform(0,520):.0f}" r="{random.Random(i*9).uniform(0.6,2):.1f}" fill="#EEF0F7" opacity="0.75"/>' for i in range(120))}
    {gs}{rays(760,140,16,900,"#FFF4D6",0.22,140,20,0.03)}
    <path d="M760,100 L768,132 L800,140 L768,148 L760,180 L752,148 L720,140 L752,132Z" fill="#FFFBEE"/>
    {ridge(560, 30, 3, "#1C2742")}{ridge(640, 20, 9, "#16203A")}
    {sheep(250,640,1.1,"#C8C3BC","#151B2E")}{sheep(330,652,0.9,"#BDB8B2","#151B2E")}{sheep(180,660,1.0,"#C8C3BC","#151B2E")}
    {figure(380, 640, 120, "#0F1528", "stand")}{figure(430, 646, 110, "#0F1528", "stand", lean=4)}<rect x="440" y="520" width="4" height="126" fill="#0F1528" transform="rotate(8 440 520)"/>
    <path d="M0,760 C300,700 600,690 900,720 C1150,745 1350,700 1500,720 L1500,1000 L0,1000Z" fill="#1A1410"/>
    {gb}
    <path d="M520,780 L540,560 L760,470 L990,560 L1010,780Z" fill="#3A2716"/>
    <path d="M500,575 L760,455 L1020,575 L1000,590 L760,482 L520,590Z" fill="#5A3C22"/>
    <path d="M590,780 L600,600 L920,600 L930,780Z" fill="#F0B866"/>
    <path d="M590,780 L600,600 L920,600 L930,780Z" fill="url(#hay)"/>
    <path d="M700,760 L820,760 L840,712 L680,712Z" fill="#7A5230"/><ellipse cx="760" cy="712" rx="62" ry="14" fill="#E8C98A"/><ellipse cx="760" cy="706" rx="30" ry="12" fill="#FFF3D8"/>
    {figure(660, 770, 150, "#3A2414", "kneel", veil=True)}{figure(880, 770, 210, "#2E1D10", "stand", lean=-3)}
    <rect x="910" y="560" width="5" height="212" fill="#2E1D10"/>
    {sheep(640,790,1.1,"#E9D6B0","#4A3220")}{sheep(1060,820,1.3,"#3A2A1E","#1A120B")}'''
    return svg(b, sky([(0, "#0B1430"), (0.55, "#22305A"), (1, "#5A5070")]) + gs_d + gb_d + '<linearGradient id="hay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3A8" stop-opacity="0.2"/><stop offset="1" stop-color="#B9772C" stop-opacity="0.8"/></linearGradient>')
SCENES["02-bethlehem"] = s2

# III · Nazareth — a carpenter's workshop in golden afternoon light
def s3():
    gl_d, gl = glow(1100, 360, 460, "#FFD58C", 0.7)
    b = f'''<rect width="{W}" height="{H}" fill="#5B3B22"/>
    <rect x="900" y="160" width="420" height="560" fill="url(#sky)"/>
    <g clip-path="url(#door)">{ridge(520, 22, 4, "#B6A07A")}{ridge(560, 16, 8, "#9E8660")}
      {building(950,640,90,120,"#D8C3A0",windows=1)}{building(1060,620,120,90,"#CDB28A",windows=2)}{building(1200,640,90,140,"#D9C6A2",windows=1)}
      {olive(1260, 700, 0.6, "#5A4630", "#7E8A5A", 3)}</g>
    <clipPath id="door"><rect x="900" y="160" width="420" height="560"/></clipPath>
    <rect x="880" y="140" width="460" height="24" fill="#3B2615"/><rect x="880" y="140" width="24" height="600" fill="#3B2615"/><rect x="1316" y="140" width="24" height="600" fill="#3B2615"/>
    {gl}{rays(1120,300,9,1200,"#FFE3A6",0.2,70,120,0.035)}
    <rect x="0" y="720" width="{W}" height="280" fill="#6B4A2C"/>
    <path d="M140,640 L760,640 L760,672 L140,672Z" fill="#8E6338"/><rect x="170" y="672" width="22" height="200" fill="#5A3B20"/><rect x="710" y="672" width="22" height="200" fill="#5A3B20"/>
    <path d="M260,626 L640,626 L640,640 L260,640Z" fill="#D9AE72"/>
    <g fill="#E8C58E" opacity="0.9">{''.join(f'<path d="M{620+i*14},{700+ (i%3)*8} q8,-10 16,0 q-8,6 -16,0Z"/>' for i in range(10))}</g>
    {figure(560, 860, 300, "#2B1A0E", "walk", lean=8)}
    <path d="M500,610 L600,640 L596,648 L494,618Z" fill="#3A2412"/>
    <g fill="#2E1C0E"><rect x="60" y="300" width="160" height="10"/><rect x="80" y="310" width="6" height="60"/><rect x="120" y="310" width="4" height="40"/><path d="M160,310 L176,310 L170,370 L166,370Z"/><rect x="240" y="260" width="10" height="200" transform="rotate(-6 240 260)"/></g>
    <g fill="#9A7448">{''.join(f'<rect x="{40+i*30}" y="{780+(i%2)*16}" width="26" height="140" transform="rotate({-8+i*2} {40+i*30} 780)"/>' for i in range(5))}</g>'''
    return svg(b, sky([(0, "#E9C98D"), (0.6, "#F3D7A0"), (1, "#E2B97C")]) + gl_d)
SCENES["03-nazareth"] = s3

# IV · The Jordan — the heavens open, the Spirit descends like a dove
def s4():
    gh_d, gh = glow(760, 60, 420, "#FFF1C8", 1)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#E9E4DA", 0.5, 0, 480)}
    {gh}{rays(760,40,16,1000,"#FFF4D4",0.42,70,55,0.035)}
    {ridge(470, 26, 6, "#8C9C82")}{ridge(520, 18, 2, "#6E8068")}
    <path d="M0,560 C300,540 600,600 900,580 C1200,560 1350,600 1500,580 L1500,1000 L0,1000Z" fill="#3C6E78"/>
    <path d="M0,600 C400,640 800,610 1500,650 L1500,1000 L0,1000Z" fill="#2E5966" opacity="0.8"/>
    <g fill="#D9EEF0" opacity="0.45">{''.join(f'<rect x="{random.Random(i).uniform(0,1500):.0f}" y="{random.Random(i*3).uniform(600,980):.0f}" width="{random.Random(i*5).uniform(40,140):.0f}" height="3" rx="2"/>' for i in range(60))}</g>
    <g fill="#3E5A3A">{''.join(f'<path d="M{x},{600+ (x%7)*4} q-6,-80 4,-140 q2,70 6,140Z"/>' for x in range(0,320,14))}{''.join(f'<path d="M{x},{610+ (x%5)*4} q-6,-70 4,-120 q2,60 6,120Z"/>' for x in range(1180,1500,14))}</g>
    {figure(720, 760, 250, "#1E2E2E", "stand", arms='<path d="M-14,-70 L-26,-40 L-20,-38 L-8,-64Z"/>')}
    {figure(880, 770, 270, "#1A2626", "stand", lean=-6, arms='<path d="M-10,-72 C-30,-64 -44,-58 -52,-60 L-50,-54 C-38,-52 -24,-58 -6,-66Z"/>')}
    <path d="M0,712 C300,706 600,722 900,714 C1200,706 1350,720 1500,714 L1500,1000 L0,1000Z" fill="#35656F" opacity="0.92"/>
    <path d="M560,716 C680,706 900,726 1010,714 C980,724 700,730 560,722Z" fill="#E4F2F2" opacity="0.6"/>
    <circle cx="790" cy="300" r="90" fill="#FFF6DD" opacity="0.5" filter="url(#soft2)"/><g transform="translate(790,300) scale(2.4)" fill="#FFFFFF"><path d="M0,0 C-30,-18 -64,-10 -86,-30 C-60,-4 -34,4 -10,8Z"/><path d="M0,0 C30,-18 64,-10 86,-30 C60,-4 34,4 10,8Z"/><ellipse cx="0" cy="8" rx="9" ry="16"/><circle cx="0" cy="-8" r="6"/></g>'''
    return svg(b, sky([(0, "#6F86A6"), (0.35, "#B9B6B0"), (0.6, "#D8C9A6"), (1, "#9DB0A8")]) + gh_d)
SCENES["04-jordan"] = s4

# V · Galilee — dawn on the lake, a boat and a crowd on the shore
def s5():
    gs_d, gs = glow(1150, 330, 380, "#FFC98A", 1)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#FBD7B8", 0.35, 0, 420)}
    {gs}<circle cx="1150" cy="360" r="46" fill="#FFE7C2"/>
    {ridge(380, 22, 11, "#7A6A86")}{ridge(420, 14, 3, "#5E5470")}
    <rect x="0" y="440" width="{W}" height="560" fill="url(#sea)"/>
    <path d="M1100,440 L1200,440 L1300,1000 L1000,1000Z" fill="#FFD7A0" opacity="0.28" filter="url(#soft2)"/>
    <g fill="#FFE2B8" opacity="0.4">{''.join(f'<rect x="{random.Random(i).uniform(0,1500):.0f}" y="{random.Random(i*3).uniform(450,900):.0f}" width="{random.Random(i*5).uniform(30,120):.0f}" height="2.5" rx="2"/>' for i in range(70))}</g>
    <g transform="translate(560,600)"><path d="M-170,0 L170,0 L130,46 L-140,46Z" fill="#2E2028"/><rect x="-6" y="-210" width="8" height="210" fill="#2E2028"/><path d="M2,-200 L120,-40 L2,-30Z" fill="#E7D7C0" opacity="0.9"/>
      {figure(-60, 2, 90, "#241820", "stand")}{figure(-110, 2, 84, "#241820", "stand", lean=4)}{figure(70, 2, 88, "#241820", "stand", lean=-4)}</g>
    <path d="M0,820 C300,780 700,800 1000,840 C1200,860 1350,850 1500,860 L1500,1000 L0,1000Z" fill="#3A2C2C"/>
    {crowd(80, 520, 860, 130, "#1F161A", 9, seed=4)}{crowd(980, 1460, 880, 140, "#1F161A", 8, seed=9)}
    {figure(760, 900, 210, "#140E12", "stand", arms='<path d="M-12,-72 C-30,-66 -48,-70 -60,-80 L-58,-74 C-44,-64 -30,-60 -8,-64Z"/>')}'''
    return svg(b, sky([(0, "#5A5A86"), (0.5, "#D99A8A"), (1, "#F5C89A")]) + gs_d + '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C99A9A"/><stop offset="0.5" stop-color="#6E6688"/><stop offset="1" stop-color="#3A3A5A"/></linearGradient>')
SCENES["05-galilee"] = s5

# VI · Jerusalem — the King rides in; palm branches on the road
def s6():
    gs_d, gs = glow(300, 160, 420, "#FFE6A8", 1)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#FFFFFF", 0.3, 0, 380)}{gs}{rays(300,160,10,1400,"#FFEFC4",0.22,60,10,0.04)}
    <path d="M500,430 L1500,380 L1500,560 L500,580Z" fill="#CBB48C"/>
    {''.join(building(560 + i*80, 560 - (i%3)*14, 76, 110 + (i%4)*26, ["#E6D2AA","#D9C298","#EBDAB6"][i%3], windows=1) for i in range(11))}
    <rect x="980" y="300" width="260" height="170" fill="#EFE0BE"/><rect x="1010" y="270" width="200" height="34" fill="#F5E9CC"/><path d="M1060,270 L1060,220 L1160,220 L1160,270Z" fill="#EEDDB6"/>
    <path d="M500,580 L1500,560 L1500,600 L500,620Z" fill="#B9A07A"/>
    {ridge(640, 30, 5, "#9C9468")}
    {palm(140, 820, 1.4, "#5A4A30", "#4D6A3A")}{palm(1380, 840, 1.3, "#5A4A30", "#4D6A3A")}
    <path d="M0,760 C400,720 900,720 1500,760 L1500,1000 L0,1000Z" fill="#C9AE80"/>
    <g fill="#5E7E44">{''.join(f'<path d="M{x},{860+(x%9)*5} q30,-14 70,-4 q-30,10 -70,4Z" transform="rotate({(x%30)-15} {x} 860)"/>' for x in range(280,1260,46))}</g>
    {crowd(200, 600, 820, 170, "#4A3624", 7, seed=2)}{crowd(920, 1320, 820, 170, "#4A3624", 7, seed=8)}
    {''.join(figure(250 + i*60, 822, 170, "#4A3624", "arms_up", veil=i%2==0) for i in range(0))}
    {donkey(760, 930, 2.1, "#4A3626")}
    <path d="M690,846 L840,846 L828,880 L700,880Z" fill="#A8362A"/>
    {figure(752, 862, 250, "#5E3A26", "sit")}
    <path d="M736,700 C720,740 716,790 726,850 L760,852 C748,800 750,746 756,704Z" fill="#A8362A" opacity="0.95"/>
    <g fill="#5E7E44">{''.join(f'<path d="M{x},{770+(x%3)*10} l40,-120 l6,2 l-38,120Z"/>' for x in (420,470,1010,1060,1120))}</g>'''
    return svg(b, sky([(0, "#BFD3E6"), (0.6, "#F3E2BE"), (1, "#F1D49E")]) + gs_d)
SCENES["06-jerusalem"] = s6

# VII · The Upper Room — bread and cup at a long table by lamplight
def s7():
    gl_d, gl = glow(750, 520, 620, "#F6B860", 0.9)
    b = f'''<rect width="{W}" height="{H}" fill="#1F140E"/>
    <path d="M620,120 L880,120 L880,400 A130,130 0 0 0 620,400Z" fill="#14203A" transform="scale(1,1)"/>
    <path d="M620,400 L620,180 A130,130 0 0 1 880,180 L880,400Z" fill="#1A2848"/>
    {''.join(f'<circle cx="{random.Random(i).uniform(630,870):.0f}" cy="{random.Random(i*4).uniform(150,390):.0f}" r="1.4" fill="#E9E4D6" opacity="0.8"/>' for i in range(24))}
    <circle cx="820" cy="210" r="26" fill="#F2EBD6"/>
    <rect x="600" y="160" width="300" height="250" fill="none" stroke="#3A271A" stroke-width="20" rx="130"/>
    {gl}
    <path d="M140,640 L1360,640 L1420,720 L80,720Z" fill="#6A4628"/><path d="M80,720 L1420,720 L1420,760 L80,760Z" fill="#4A3019"/>
    <path d="M120,628 L1380,628 L1360,640 L140,640Z" fill="#EADBC0"/>
    <ellipse cx="750" cy="624" rx="56" ry="12" fill="#D2A260"/><path d="M712,616 C720,596 780,596 790,616Z" fill="#C88F48"/>
    <path d="M820,624 L860,624 L850,600 C866,590 868,566 862,552 L818,552 C812,566 814,590 830,600Z" fill="#B78A3E"/>
    {''.join(f'<path d="M{x},630 c0,-20 24,-20 24,0Z" fill="#C49A5C"/>' for x in (300,520,1000,1200))}
    {''.join(f'<path d="M{x},632 C{x},610 {x+30},604 {x+36},618 C{x+50},612 {x+60},626 {x+46},632Z" fill="#9A6838"/><path d="M{x+36},606 C{x+30},590 {x+40},580 {x+36},566 C{x+48},582 {x+46},598 {x+36},606Z" fill="#FFE0A0"/>' for x in (420,1080))}
    {''.join(figure(170 + i*96, 628, 200, "#21140C", "sit", flip=1 if i<6 else -1) for i in range(6))}
    {figure(750, 628, 230, "#2A1A0F", "sit")}
    {''.join(figure(860 + i*96, 628, 200, "#21140C", "sit", flip=-1) for i in range(6))}
    <rect x="0" y="760" width="{W}" height="240" fill="#2A1A10"/>'''
    return svg(b, gl_d)
SCENES["07-upper-room"] = s7

# VIII · Gethsemane — a kneeling figure among olive trees under the moon
def s8():
    gm_d, gm = glow(1180, 170, 300, "#DDE6F2", 1)
    ga_d, ga = glow(560, 520, 300, "#F2E4B8", 0.6)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#AFC0D8", 0.25, 0, 500)}
    {gm}<circle cx="1180" cy="170" r="54" fill="#F1F2EC"/>
    {ridge(520, 18, 7, "#1E2C3E")}
    <g fill="#E9C58A" opacity="0.7">{''.join(f'<rect x="{900+i*22}" y="{505+(i%3)*5}" width="6" height="6"/>' for i in range(18))}</g>
    {ridge(600, 22, 3, "#121C2A")}
    {olive(200, 760, 1.6, "#0E141E", "#1A2A2E", 2)}{olive(1300, 760, 1.8, "#0E141E", "#18262A", 6)}{olive(980, 700, 1.0, "#101824", "#1C2C30", 9)}
    {rays(560,-80,7,900,"#F3E9C8",0.16,30,75,0.05)}{ga}
    <path d="M0,760 C400,720 900,740 1500,760 L1500,1000 L0,1000Z" fill="#0C121C"/>
    <path d="M440,760 C460,700 640,690 680,760Z" fill="#2A3444"/>
    {figure(570, 720, 200, "#0A0F18", "kneel", arms='<path d="M8,-50 L22,-80 L28,-78 L14,-48Z"/>')}
    <g opacity="0.55">{figure(1000, 800, 120, "#05080E", "sit")}{figure(1080, 806, 120, "#05080E", "sit", flip=-1)}{figure(1150, 800, 110, "#05080E", "sit")}</g>'''
    return svg(b, sky([(0, "#0A1224"), (0.6, "#1E2E4A"), (1, "#30405A")]) + gm_d + ga_d)
SCENES["08-gethsemane"] = s8

# IX · Via Dolorosa — the cross carried through a narrow street of light and shadow
def s9():
    gl_d, gl = glow(820, 300, 420, "#FFD99E", 0.9)
    b = f'''<rect width="{W}" height="{H}" fill="#3A2A1E"/>
    <path d="M520,0 L980,0 L900,640 L620,640Z" fill="url(#sky)"/>
    {gl}{rays(800,120,8,1100,"#FFE6B8",0.35,40,70,0.05)}
    <path d="M0,0 L520,0 L620,640 L640,1000 L0,1000Z" fill="#5A4430"/><path d="M1500,0 L980,0 L900,640 L880,1000 L1500,1000Z" fill="#4E3A28"/>
    <path d="M520,0 L620,640 L600,640 L470,0Z" fill="#7A6044" opacity="0.6"/><path d="M980,0 L900,640 L920,640 L1040,0Z" fill="#6A5038" opacity="0.6"/>
    <path d="M560,300 Q760,160 960,300 L940,330 Q760,200 580,330Z" fill="#4A3624"/>
    <path d="M620,640 L900,640 L1100,1000 L420,1000Z" fill="#9A7E5A"/>
    <g stroke="#7A6044" stroke-width="3" opacity="0.6">{''.join(f'<path d="M{620-i*30},{660+i*40} L{900+i*30},{660+i*40}"/>' for i in range(8))}</g>
    {crowd(460, 640, 690, 150, "#2A1C12", 5, seed=3, op=0.85)}{crowd(880, 1060, 690, 150, "#2A1C12", 5, seed=6, op=0.85)}
    <g transform="translate(760,880)"><path d="M-60,-150 L200,-330 L214,-318 L-50,-136Z" fill="#3A2614"/></g>
    {figure(760, 900, 250, "#1E120A", "walk", lean=18, arms='<path d="M-6,-74 L20,-100 L26,-96 L0,-68Z"/>')}
    {figure(930, 906, 230, "#24170D", "walk", lean=6)}'''
    return svg(b, sky([(0, "#F6E3B8"), (1, "#E8B87A")]) + gl_d)
SCENES["09-via-dolorosa"] = s9

# X · Golgotha — three crosses against a darkened sky; light breaks behind the centre
def s10():
    gl_d, gl = glow(750, 330, 700, "#F4C27E", 0.85)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#3A2E3A", 0.7, 0, 700)}
    {gl}{rays(750,330,14,1300,"#FFE3B0",0.25,360,0,0.03)}
    {clouds("#1C1620", 0.45, 0, 300)}
    {ridge(650, 20, 4, "#2A2028")}
    <path d="M300,1000 C420,760 560,600 750,560 C940,600 1080,760 1200,1000Z" fill="#1A1216"/>
    <path d="M0,820 C300,800 500,860 760,880 C1000,860 1200,800 1500,820 L1500,1000 L0,1000Z" fill="#120C10"/>
    {cross(750, 570, 330, "#0B0709", 18)}{cross(560, 640, 250, "#0B0709", 13)}{cross(940, 640, 250, "#0B0709", 13)}
    <g opacity="0.95">{figure(660, 900, 130, "#080506", "stand", veil=True)}{figure(700, 902, 120, "#080506", "kneel", veil=True)}{figure(830, 900, 135, "#080506", "stand", lean=-4)}{figure(790, 904, 118, "#080506", "stand", veil=True)}</g>'''
    return svg(b, sky([(0, "#120C14"), (0.5, "#3A2430"), (1, "#7A4A3A")]) + gl_d)
SCENES["10-golgotha"] = s10

# XI · The Garden Tomb — the stone rolled away at sunrise
def s11():
    gs_d, gs = glow(1260, 300, 520, "#FFE6B0", 1)
    gt_d, gt = glow(640, 560, 260, "#FFF6DC", 1)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#FFFFFF", 0.35, 0, 420)}
    {gs}{rays(1260,300,14,1500,"#FFF0CC",0.3,120,110,0.03)}
    <path d="M0,240 C200,180 600,200 900,320 L960,1000 L0,1000Z" fill="#8A7A62"/>
    <path d="M0,300 C200,260 520,280 820,380 L860,1000 L0,1000Z" fill="#A3917A"/>
    <path d="M520,700 L520,500 A120,120 0 0 1 760,500 L760,700Z" fill="#1A120C"/>
    {gt}
    <path d="M560,690 C600,670 700,672 740,690 L740,700 L560,700Z" fill="#F6F1E6" opacity="0.9"/>
    <circle cx="900" cy="610" r="130" fill="#7C6C56"/><circle cx="900" cy="610" r="104" fill="none" stroke="#5E5040" stroke-width="10"/>
    <path d="M0,700 C400,680 800,690 1500,720 L1500,1000 L0,1000Z" fill="#5E7448"/>
    <g>{''.join(f'<circle cx="{random.Random(i).uniform(0,1500):.0f}" cy="{random.Random(i*7).uniform(720,990):.0f}" r="{random.Random(i*3).uniform(4,9):.0f}" fill="{["#F2D06B","#F4F0E4","#E58B78","#C9A6E0"][i%4]}" opacity="0.9"/>' for i in range(90))}</g>
    {olive(1250, 760, 1.2, "#4A3A2A", "#6E8A58", 5)}{palm(150, 780, 1.2, "#5A4A30", "#5C7A44")}
    {figure(1080, 880, 210, "#3A2A30", "stand", veil=True, lean=-6, flip=-1)}'''
    return svg(b, sky([(0, "#BFD6EA"), (0.5, "#F8DDB6"), (1, "#FBC889")]) + gs_d + gt_d)
SCENES["11-garden-tomb"] = s11

# XII · Mount of Olives — taken up into a radiant cloud; disciples look up
def s12():
    gc_d, gc = glow(750, 200, 360, "#FFE9B8", 1)
    b = f'''<rect width="{W}" height="{H}" fill="url(#sky)"/>
    {clouds("#FFFFFF", 0.35, 0, 560)}
    {rays(750,200,24,1400,"#FFF2CF",0.4,360,0,0.025)}{gc}
    <g filter="url(#soft)">{''.join(f'<ellipse cx="{750+dx}" cy="{300+dy}" rx="{rx}" ry="{ry}" fill="#FFFFFF" opacity="0.95"/>' for dx,dy,rx,ry in [(-200,10,120,50),(-90,-20,130,70),(30,-30,140,80),(160,0,130,60),(240,20,90,40),(-260,30,80,34),(0,30,260,50)])}</g>
    <g>{figure(750, 290, 190, "#7A4E2E", "stand", arms='<path d="M-12,-74 L-34,-104 L-28,-108 L-6,-78Z"/><path d="M12,-74 L34,-104 L28,-108 L6,-78Z"/>')}</g>
    <g filter="url(#soft)">{''.join(f'<ellipse cx="{750+dx}" cy="{330+dy}" rx="{rx}" ry="{ry}" fill="#FFFFFF" opacity="0.92"/>' for dx,dy,rx,ry in [(-150,0,140,46),(0,-6,170,56),(150,4,140,44),(-280,14,90,30),(280,16,90,30)])}</g>
    {ridge(700, 24, 3, "#8E9AA8")}
    <g fill="#E6D8BC" opacity="0.8">{''.join(f'<rect x="{1050+i*28}" y="{690+(i%3)*8}" width="22" height="16"/>' for i in range(14))}</g>
    <path d="M0,780 C300,700 700,690 1000,740 C1200,770 1350,800 1500,800 L1500,1000 L0,1000Z" fill="#5C6E4C"/>
    {olive(120, 840, 1.1, "#3A3022", "#56684A", 4)}{olive(1400, 860, 1.0, "#3A3022", "#56684A", 8)}
    {''.join(figure(420 + i*95, 900 + (i%2)*10, 200, "#2A2A26", "stand", lean=-10 + (i%3)*4, veil=i%4==1) for i in range(7))}'''
    return svg(b, sky([(0, "#4E6A92"), (0.45, "#9DB3CF"), (0.75, "#E8DCC4"), (1, "#C9B79A")]) + gc_d)
SCENES["12-mount-of-olives"] = s12

if __name__ == "__main__":
    import sys, os
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name, fn in SCENES.items():
        open(os.path.join(out, name + ".svg"), "w").write(fn())
    print(len(SCENES), "scenes")
