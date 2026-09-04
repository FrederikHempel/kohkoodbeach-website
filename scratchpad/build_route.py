"""
Generates the <svg> for the homepage "Journey" band, and prints it to
scratchpad/route_svg.html for splicing into index.html.

The two source polygons are NOT committed (Thailand's is 1.1 MB). Re-fetch them
into this directory first — Nominatim asks for a real User-Agent:

  UA="KKBR-site-illustration/1.0 (frja91@outlook.com)"
  curl -A "$UA" "https://nominatim.openstreetmap.org/search?q=Thailand&polygon_geojson=1&format=json&limit=1" -o tha_nom.json
  curl -A "$UA" "https://nominatim.openstreetmap.org/search?q=Ko%20Kut%20island,%20Trat,%20Thailand&polygon_geojson=1&format=json&limit=5" -o kood_nom.json

Coastlines are REAL: Thailand and Koh Kood come from OpenStreetMap, projected
equirectangular with a cos(lat) correction and simplified with Douglas-Peucker
to a tolerance just under one drawn pixel. Every marked place is a real geocode,
and the two island markers are snapped onto the island's own coastline so they
sit on the shore rather than near it. Bang Bao is the resort's beach — that is
the site's own claim (index.html's "Bang Bao Bay" caption), not an assumption.
"""

import json, math

# ---------- geometry helpers ----------
def ring(fn):
    d = json.load(open(fn))
    g = d[0]['geojson'] if isinstance(d, list) else d['features'][0]['geometry']
    rings = [g['coordinates'][0]] if g['type'] == 'Polygon' else [p[0] for p in g['coordinates']]
    return max(rings, key=len)

def dp(pts, tol):
    if len(pts) < 3: return pts
    def seg(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0: return math.hypot(x - x1, y - y1)
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        dmax, idx = 0, a
        for i in range(a + 1, b):
            d = seg(pts[i], pts[a], pts[b])
            if d > dmax: dmax, idx = d, i
        if dmax > tol: keep[idx] = True; stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]

class Proj:
    """Equirectangular, cos(lat) corrected, fitted to a target box."""
    def __init__(self, lonlats, x, y, w, h):
        lons = [p[0] for p in lonlats]; lats = [p[1] for p in lonlats]
        self.lon0, self.lat1 = min(lons), max(lats)
        self.k = math.cos(math.radians((min(lats) + max(lats)) / 2))
        sx = (max(lons) - min(lons)) * self.k
        sy = max(lats) - min(lats)
        self.s = min(w / sx, h / sy)
        self.ox = x + (w - sx * self.s) / 2
        self.oy = y + (h - sy * self.s) / 2
        self.size = (sx * self.s, sy * self.s)
    def __call__(self, lon, lat):
        return (self.ox + (lon - self.lon0) * self.k * self.s,
                self.oy + (self.lat1 - lat) * self.s)

def d_path(pts, close=True, prec=1):
    out = [f'M{pts[0][0]:.{prec}f} {pts[0][1]:.{prec}f}']
    for x, y in pts[1:]:
        out.append(f'L{x:.{prec}f} {y:.{prec}f}')
    if close: out.append('Z')
    return ''.join(out)

def snap(lon, lat, coast):
    """Nearest coastline vertex — so a marker sits ON the shore, not near it."""
    return min(coast, key=lambda p: (p[0] - lon) ** 2 + ((p[1] - lat) * 1.0) ** 2)

def curve(a, b, bow=0.16, prec=1):
    """One cubic between two points, bowed perpendicular to the chord."""
    (x1, y1), (x2, y2) = a, b
    dx, dy = x2 - x1, y2 - y1
    nx, ny = -dy * bow, dx * bow
    c1 = (x1 + dx * 0.32 + nx, y1 + dy * 0.32 + ny)
    c2 = (x1 + dx * 0.68 + nx, y1 + dy * 0.68 + ny)
    return (f'M{x1:.{prec}f} {y1:.{prec}f}C{c1[0]:.{prec}f} {c1[1]:.{prec}f} '
            f'{c2[0]:.{prec}f} {c2[1]:.{prec}f} {x2:.{prec}f} {y2:.{prec}f}')


def spine(a, b, ring, n=6):
    """A line from a to b that stays ON the island.

    The road leg used to be a single bowed cubic, and the bow put most of it in
    the sea off the west coast — a road drawn in the water. This walks down the
    latitudes between the two stops instead, and at each one takes the midpoint
    of the island's own width, so every interior point is by construction on
    land. Endpoints stay exactly on the two coastal markers."""
    pts = [a]
    for i in range(1, n):
        lat = a[1] + (b[1] - a[1]) * i / n
        xs = []
        for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
            if (y1 <= lat < y2) or (y2 <= lat < y1):
                xs.append(x1 + (x2 - x1) * (lat - y1) / (y2 - y1))
        if xs: pts.append(((min(xs) + max(xs)) / 2, lat))
    pts.append(b)
    return pts

def smooth(pts, prec=1):
    """Catmull-Rom through the points, emitted as cubics."""
    d = [f'M{pts[0][0]:.{prec}f} {pts[0][1]:.{prec}f}']
    ext = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i-1], ext[i], ext[i+1], ext[i+2]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
        c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        d.append(f'C{c1[0]:.{prec}f} {c1[1]:.{prec}f} {c2[0]:.{prec}f} {c2[1]:.{prec}f} {p2[0]:.{prec}f} {p2[1]:.{prec}f}')
    return ''.join(d)

# ---------- real places (OSM geocodes) ----------
BANGKOK  = (100.5018, 13.7563)
LAEM_SOK = (102.5861, 12.0404)   # Laem Sok Pier, Trat
AO_SALAD = (102.5711, 11.7051)   # Ao Salad, Ko Kut
BANG_BAO = (102.5370, 11.6118)   # Hat Bang Bao — the resort's own beach

tha_r  = ring('tha_nom.json')
kood_r = ring('kood_nom.json')

# ---------- layout, in the 1000 x 640 viewBox ----------
TH = Proj(tha_r, 26, 20, 330, 604)
tha = dp(tha_r, 0.022)
kood_small = dp(kood_r, 0.004)

# The inset. Koh Kood is 0.41 as wide as it is tall, so the panel is mostly
# vertical and the labels hang off its sides.
# Island 137 wide, so the panel is mostly margin: a 60px gutter on the left for
# the ferry to arrive across, and a wider one on the right holding both labels
# aligned to one column — the tidiest arrangement for two stops on one island.
PANEL = (500, 150, 430, 400)     # x, y, w, h
KD = Proj(kood_r, PANEL[0] + 60, PANEL[1] + 35, 137, 330)
LABEL_X = PANEL[0] + 270         # shared leader terminus for both island stops
MAIN_X  = 112                    # ...and for both mainland ones, mirrored on the left
kood_big = dp(kood_r, 0.00045)

print('# points:', 'thailand', len(tha), '| kood small', len(kood_small), '| kood big', len(kood_big))
print('# kood inset drawn size %.0f x %.0f' % KD.size)

# markers, snapped to the coast where they are coastal places
salad_ll = snap(*AO_SALAD, kood_r)
bao_ll   = snap(*BANG_BAO, kood_r)
print('# Ao Salad snapped %.4f,%.4f -> %.4f,%.4f' % (AO_SALAD[1], AO_SALAD[0], salad_ll[1], salad_ll[0]))
print('# Bang Bao snapped %.4f,%.4f -> %.4f,%.4f' % (BANG_BAO[1], BANG_BAO[0], bao_ll[1], bao_ll[0]))

bkk_t   = TH(*BANGKOK)
sok_t   = TH(*LAEM_SOK)
kood_t  = TH(*AO_SALAD)                    # island's place on the national map
salad_i = KD(*salad_ll)
bao_i   = KD(*bao_ll)

out = {
  'THA':        d_path([TH(*p) for p in tha]),
  'KOOD_SMALL': d_path([TH(*p) for p in kood_small]),
  'KOOD_BIG':   d_path([KD(*p) for p in kood_big], prec=2),
  'LEG_BUS':    curve(bkk_t, sok_t, 0.13),
  'LEG_SEA':    curve(sok_t, salad_i, -0.14),
  'LEG_ROAD':   smooth([KD(*ll) for ll in spine(salad_ll, bao_ll, kood_r)]),
  'PANEL':      'x="%d" y="%d" width="%d" height="%d"' % PANEL,
}
pts = {'bkk': bkk_t, 'sok': sok_t, 'koodT': kood_t, 'salad': salad_i, 'bao': bao_i}
for k, v in pts.items(): print(f'# {k}: {v[0]:.1f}, {v[1]:.1f}')
json.dump({'paths': out, 'pts': {k: [round(v[0],1), round(v[1],1)] for k,v in pts.items()},
           'panel': PANEL}, open('route_geo.json','w'), indent=1)
print('# wrote route_geo.json — path bytes:', {k: len(v) for k,v in out.items()})

# ---------- emit the SVG fragment ----------
P = out
px, py, pw, ph = PANEL
def f(p): return f'{p[0]:.1f} {p[1]:.1f}'

svg = f'''      <svg class="route__map" viewBox="0 0 1000 640" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <!-- ⚠️ GENERATED GEOMETRY — do not hand-edit the long `d` attributes.
             Thailand and Koh Kood are real OpenStreetMap coastlines; every marked
             place is a real geocode and the two island markers are snapped onto
             the coastline itself. Regenerate with scratchpad/build_route.py. -->
        <defs>
          <mask id="route-sea" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640">
            <path data-draw="leg1" d="{P['LEG_SEA']}" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round"/>
          </mask>
        </defs>

        <!-- Only KOH KOOD is tinted. Thailand was too, and a 0.07 wash over an
             area that size stopped reading as a tint and started reading as a
             pale blob with a soft edge — the opposite of the recognisable
             outline the country is here to provide. Outline only. -->
        <path class="route__land" data-fade d="{P['KOOD_BIG']}"/>

        <!-- Thailand, and Koh Kood at national scale -->
        <path class="route__line route__coast" data-draw="coast" d="{P['THA']}"/>
        <path class="route__line route__coast" data-draw="coast" d="{P['KOOD_SMALL']}"/>

        <!-- the inset: Koh Kood enlarged -->
        <g class="route__inset" data-fade>
          <!-- The magnifier: ring the real island on the national map, then two
               hairlines to the panel it is enlarged in. Without them the ring
               sits 14px below Laem Sok's dot and reads as part of that marker —
               at this scale the pier and the island really are that close. -->
          <path class="route__zoom" d="M{pts['koodT'][0]+9:.1f} {pts['koodT'][1]-5:.1f}L{px} {py}M{pts['koodT'][0]+9:.1f} {pts['koodT'][1]+5:.1f}L{px} {py+ph}"/>
          <rect class="route__panel" x="{px}" y="{py}" width="{pw}" height="{ph}" rx="3"/>
          <circle class="route__ring" cx="{pts['koodT'][0]:.1f}" cy="{pts['koodT'][1]:.1f}" r="9"/>
          <text class="route__name route__name--panel" x="{px+18}" y="{py+28}">Koh Kood</text>
        </g>
        <path class="route__line route__coast route__isle" data-draw="isle" d="{P['KOOD_BIG']}"/>

        <!-- 01 the road down to the pier -->
        <path class="route__line route__leg" data-draw="leg0" data-geo="0" d="{P['LEG_BUS']}"/>
        <!-- 02 the crossing — it leaves the national map and lands in the inset -->
        <path class="route__line route__leg route__leg--sea" data-geo="1" mask="url(#route-sea)" d="{P['LEG_SEA']}"/>
        <!-- 03 the last stretch by road, on the island -->
        <path class="route__line route__leg" data-draw="leg2" data-geo="2" d="{P['LEG_ROAD']}"/>

        <!-- Both mainland labels run to one column at x={MAIN_X}, mirroring the
             island's column on the right. Laem Sok's used to sit where its own
             leader put it, which was directly on top of the Gulf coastline. -->
        <g class="route__stop" data-stop="0">
          <path class="route__leader" d="M{f(bkk_t)}H{MAIN_X}"/>
          <circle class="route__dot" cx="{bkk_t[0]:.1f}" cy="{bkk_t[1]:.1f}" r="5"/>
          <text class="route__name" x="{MAIN_X-10}" y="{bkk_t[1]+5:.1f}" text-anchor="end">Bangkok</text>
        </g>
        <!-- Laem Sok's label goes right, into the Gulf. Left, in the column with
             Bangkok, it landed on the peninsula's own coastline; the water east
             of Trat is the only empty space anywhere near the pier. -->
        <g class="route__stop" data-stop="1">
          <path class="route__leader" d="M{f(sok_t)}l40 56h40"/>
          <circle class="route__dot" cx="{sok_t[0]:.1f}" cy="{sok_t[1]:.1f}" r="4.5"/>
          <text class="route__name" x="{sok_t[0]+90:.1f}" y="{sok_t[1]+61:.1f}" text-anchor="start">Laem Sok</text>
        </g>
        <g class="route__stop" data-stop="2">
          <path class="route__leader" d="M{f(salad_i)}H{LABEL_X}"/>
          <circle class="route__dot" cx="{salad_i[0]:.1f}" cy="{salad_i[1]:.1f}" r="5"/>
          <text class="route__name" x="{LABEL_X+10}" y="{salad_i[1]+5:.1f}" text-anchor="start">Ao Salad</text>
        </g>
        <g class="route__stop" data-stop="3">
          <path class="route__leader" d="M{f(bao_i)}H{LABEL_X}"/>
          <circle class="route__dot route__dot--end" cx="{bao_i[0]:.1f}" cy="{bao_i[1]:.1f}" r="6.5"/>
          <text class="route__name route__name--end" x="{LABEL_X+10}" y="{bao_i[1]:.1f}" text-anchor="start">Koh Kood<tspan x="{LABEL_X+10}" dy="17">Beach Resort</tspan></text>
        </g>

        <!-- ⚠️ MOBILE LABELS. Below 820px the whole 1000-unit viewBox is drawn
             into ~350 CSS px, so the desktop labels above render at about 5px —
             type too small to read is worse than no type. These are the two
             that matter (the mainland pair is spelled out in step 01 anyway),
             set large and right-aligned to the frame, and the desktop set is
             hidden. Positions cannot come from CSS: `x` on <text> is an SVG
             attribute, not a stylable property. -->
        <g class="route__mlabels" aria-hidden="true">
          <path class="route__leader" d="M{salad_i[0]:.1f} {salad_i[1]:.1f}H800"/>
          <text class="route__name route__name--m" x="985" y="{salad_i[1]+9:.1f}" text-anchor="end">Ao Salad</text>
          <path class="route__leader" d="M{bao_i[0]:.1f} {bao_i[1]:.1f}H720"/>
          <text class="route__name route__name--m route__name--end" x="985" y="{bao_i[1]-2:.1f}" text-anchor="end">Koh Kood<tspan x="985" dy="34">Beach Resort</tspan></text>
        </g>

        <g class="route__glyph" data-glyph="0">
          <circle class="route__disc" r="16"/>
          <rect class="route__ico" x="-9" y="-7.5" width="18" height="11" rx="2.6"/>
          <rect class="route__ico-cut" x="-6.6" y="-5.1" width="5.4" height="3.9" rx="0.8"/>
          <rect class="route__ico-cut" x="1.2" y="-5.1" width="5.4" height="3.9" rx="0.8"/>
          <circle class="route__ico" cx="-4.8" cy="5" r="2.1"/>
          <circle class="route__ico" cx="4.8" cy="5" r="2.1"/>
        </g>
        <g class="route__glyph" data-glyph="1">
          <circle class="route__disc" r="16"/>
          <path class="route__ico" d="M-9.4 1.4h18.8l-3.6 6.2h-11.6z"/>
          <rect class="route__ico" x="-4.8" y="-5.4" width="8" height="6.2" rx="1.2"/>
          <path class="route__ico" d="M4.6-7.6h1.6v8.4h-1.6z"/>
        </g>
        <g class="route__glyph" data-glyph="2">
          <circle class="route__disc" r="16"/>
          <path class="route__ico" d="M-9.6 2.6v-3.8c0-1.1.6-2.1 1.6-2.6l3.4-1.6c.4-.2.9-.3 1.4-.3h5.4c1.7 0 3 1.4 3 3v5.3z"/>
          <circle class="route__ico" cx="-5" cy="4.4" r="2.1"/>
          <circle class="route__ico" cx="5" cy="4.4" r="2.1"/>
        </g>
      </svg>'''
open('route_svg.html','w').write(svg)
print('# wrote route_svg.html', len(svg), 'bytes')
