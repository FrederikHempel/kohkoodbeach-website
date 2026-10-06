"""Thailand's mainland coast from Natural Earth (world-atlas countries-10m.json).

Why not OpenStreetMap's Thailand polygon: its Gulf side is the MARITIME boundary,
not the shoreline — a straight line through the sea south of Koh Kood joins the
Trat coast to the Cambodian border, so the island ends up *inside* the country
outline and the map says it is on the mainland. Natural Earth follows the coast.
"""
import json
def thailand_ring(fn='countries-10m.json'):
    t = json.load(open(fn))
    sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    def build(idxs):
        out = []
        for i in idxs:
            seg = arcs[i] if i >= 0 else arcs[~i][::-1]
            out += seg if not out else seg[1:]
        return out
    g = next(g for g in t['objects']['countries']['geometries'] if g.get('properties', {}).get('name') == 'Thailand')
    rings = [build(poly[0]) for poly in g['arcs']]
    return max(rings, key=len), rings
if __name__ == '__main__':
    r, rings = thailand_ring()
    print(len(r), [len(x) for x in rings])
    def pip(pt, poly):
        x, y = pt; c = False
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if (y1 > y) != (y2 > y) and x < x1 + (x2 - x1) * (y - y1) / (y2 - y1): c = not c
        return c
    for n, p in (('Bangkok', (100.50, 13.76)), ('Laem Sok', (102.5861, 12.0404)), ('Ao Salad', (102.5711, 11.7051)), ('Koh Kood centre', (102.55, 11.66))):
        print(n, [i for i, x in enumerate(rings) if pip(p, x)])
    xs = [p[0] for p in r]; ys = [p[1] for p in r]; print(min(xs), max(xs), min(ys), max(ys))
