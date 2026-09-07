"""Builds staging-plot.html at the project root — a standalone page to test the
"where you'll stay" beat: the drone frame pinned, one house card in the left
margin at a time, its circle drawing itself as you scroll.

Loop geometry is in viewBox units (1000 x 562 over the 2000 x 1125 frame).
Positions came from Frederik on 7 Sep 2026: the four leftmost huts (two per
row) are Bali Deluxe, the rest of both rows are Bali House, the four houses in
the cluster to the north-east are Thai Twin.
"""
import math, random, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = 'assets/'

# --- loop geometry: centre, radii, rotation (radians), a seed for the wobble --
# `n` is the superellipse exponent: 2 is an ellipse, ~3.5 a rounded rectangle —
# what a hand draws round a row of huts. Several strokes per house are allowed;
# the lone Bali hut east of the rows gets its own small loop, drawn second.
LOOPS = {
    'bali-house':  [dict(cx=600, cy=478, rx=146, ry=74, rot=0.0,  n=3.5, wob=0.025, seed=11),
                    dict(cx=770, cy=380, rx=36,  ry=26, rot=0.0,  n=2.0, wob=0.05,  seed=14)],
    'bali-deluxe': [dict(cx=388, cy=478, rx=62,  ry=80, rot=0.0,  n=3.5, wob=0.025, seed=12)],
    'thai-twin':   [dict(cx=762, cy=290, rx=118, ry=55, rot=0.10, n=2.6, wob=0.04,  seed=13)],
}
# hand-lettered names, each sat just above its loop — no leaders, no arrows
LABELS = {   # desktop position, phone position
    'bali-house':  dict(x=545, y=372, mx=548, my=372, text='Bali House'),
    'bali-deluxe': dict(x=338, y=384, mx=300, my=386, text='Bali Deluxe'),
    'thai-twin':   dict(x=690, y=222, mx=660, my=222, text='Thai Twin House'),
}

HOUSES = [
    dict(id='bali-house', name='Bali House', line='The classic bungalow, on stilts among the palms.',
         img=A+'room-photos/bali-house-sea-view/img_2p9896.webp', w=2000, h=1500,
         size='46 m²', beds='King or twin', sleeps='2 adults, up to 3 children', price='2,900'),
    dict(id='bali-deluxe', name='Bali Deluxe', line='Half as big again, with a second bedroom.',
         img=A+'room-photos/bali-deluxe-partial-sea-view/img_9p8136.webp', w=2000, h=1500,
         size='63 m²', beds='King plus two singles', sleeps='4 adults', price='5,500'),
    dict(id='thai-twin-house', name='Thai Twin House', line='Two rooms around one long deck, with a jacuzzi on it.',
         img=A+'room-photos/thai-twin-house-garden-view/img_4p680.webp', w=750, h=500,
         size='63 m²', beds='King and twin, two rooms', sleeps='4 adults, 2 children', price='7,000'),
]
KEYS = ['bali-house', 'bali-deluxe', 'thai-twin']


def loop(cx, cy, rx, ry, rot, n, wob, seed):
    """One marker stroke round a superellipse: low-frequency wobble, and the
    pen overshoots its start the way a hand does."""
    random.seed(seed)
    ph = [random.uniform(0, math.tau) for _ in range(3)]
    amp = [random.uniform(wob * 0.6, wob) for _ in range(3)]
    pts, steps = [], 96
    sgn = lambda v: (v > 0) - (v < 0)
    for i in range(steps + 9):
        t = i / steps * math.tau
        w = 1 + sum(a * math.sin(k * t + p) for k, (a, p) in enumerate(zip(amp, ph), start=2))
        c, s_ = math.cos(t), math.sin(t)
        x = rx * w * sgn(c) * abs(c) ** (2 / n)
        y = ry * w * sgn(s_) * abs(s_) ** (2 / n)
        xr, yr = x * math.cos(rot) - y * math.sin(rot), x * math.sin(rot) + y * math.cos(rot)
        pts.append((cx + xr, cy + yr))
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)



def chrome():
    """Nav, menu and footer straight out of index.html, so the test page
    behaves like the site around it."""
    s = (ROOT / 'index.html').read_text(encoding='utf-8')
    nav = re.search(r'<header class="nav">.*?</header>\n\n<div class="menu".*?</div>\n</div>\n', s, re.S).group(0)
    foot = re.search(r'<footer class="footer">.*?</footer>\n', s, re.S).group(0)
    return nav, foot


def build():
    nav, foot = chrome()
    svg_paths, labels = [], []
    for i, k in enumerate(KEYS):
        for L in LOOPS[k]:
            svg_paths.append(f'<path class="pen" data-loop="{i}" d="{loop(**L)}"/>')
        Lb = LABELS[k]
        labels.append(f'<text class="hand hand--d mark" data-label="{i}" x="{Lb["x"]}" y="{Lb["y"]}">{Lb["text"]}</text>'
                      f'<text class="hand hand--m mark" data-label="{i}" x="{Lb["mx"]}" y="{Lb["my"]}">{Lb["text"]}</text>')

    cards = []
    for i, h in enumerate(HOUSES):
        cards.append(f'''
      <article class="cat plot__card" data-card="{i}">
        <div class="cat__shot"><img src="{h['img']}" alt="{h['name']}" width="{h['w']}" height="{h['h']}"></div>
        <div class="cat__body">
          <h3 class="cat__name">{h['name']}</h3>
          <p class="cat__line">{h['line']}</p>
          <dl class="cat__facts">
            <div><dt>Size</dt><dd>{h['size']}</dd></div>
            <div><dt>Beds</dt><dd>{h['beds']}</dd></div>
            <div><dt>Sleeps</dt><dd>{h['sleeps']}</dd></div>
          </dl>
          <p class="cat__price">from {h['price']} <span class="cat__unit">THB per night</span></p>
          <div class="cat__actions">
            <a class="cat__book" href="accommodation.html#{h['id']}">Learn more <span aria-hidden="true">&#8594;</span></a>
          </div>
        </div>
      </article>''')
    tabs = ''.join(f'<button type="button" role="tab" class="plot__tab" data-tab="{i}">{h["name"]}</button>' for i, h in enumerate(HOUSES))

    page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Staging — Where you'll stay — Koh Kood Beach Resort</title>
<meta name="description" content="Staging page for the homepage's rooms beat. Not linked from the site.">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="assets/logo/favicon.svg?v=2" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<script>document.documentElement.classList.add('js');</script>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@1,9..144,300..400,100,1&display=swap">
<style>
/* ---------- Where you'll stay: the plot from above (staging) ---------- */
.plot {{ position: relative; background: var(--charcoal); }}
.plot__stage {{ position: sticky; top: var(--nav-h, 70px); height: calc(100vh - var(--nav-h, 70px)); overflow: hidden; }}
.plot__photo {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 100%; filter: saturate(1.06) sepia(.07) contrast(1.03); }}
.plot__svg {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
.pen {{ fill: none; stroke: var(--gold); stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 1px 1px rgba(0,0,0,.35)); }}
.pen--thin {{ stroke-width: 2.6; }}
[data-loop] {{ opacity: 0; transition: opacity .5s var(--ease); }}
[data-loop].is-on {{ opacity: 1; }}
[data-loop].is-past {{ opacity: .38; }}
.mark {{ opacity: 0; transition: opacity .6s var(--ease); }}
.mark.is-on {{ opacity: 1; }}
.mark.is-past {{ opacity: .45; }}
.hand--m {{ display: none; }}
.hand {{ font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 300; font-variation-settings: 'SOFT' 100, 'WONK' 1, 'opsz' 40; font-size: 30px; fill: var(--warm-white); filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }}

/* the card panel: the three names as a strip on top, then accommodation.html's own .cat —
   sat in the left margin, where it covers the neighbours' roofs */
.plot__cards {{ position: absolute; left: var(--gutter); top: 50%; transform: translateY(-50%); width: clamp(300px, 27vw, 400px); background: var(--sand); box-shadow: var(--shadow-soft); }}
.plot__tabs {{ display: flex; gap: 16px; padding: 12px 18px 0; border-bottom: var(--rule); }}
.plot__tab {{ font-size: .64rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-muted); padding: 6px 0 10px; margin-bottom: -1px; border-bottom: 2px solid transparent; transition: color var(--t-control) var(--ease-quick), border-color var(--t-control) var(--ease-quick), transform var(--t-press) var(--ease-quick); }}
.plot__tab.is-on {{ color: var(--charcoal); border-bottom-color: var(--gold); }}
.plot__tab:active {{ transform: scale(.97); }}
.plot__deck {{ position: relative; }}
.plot__card {{ position: absolute; inset: 0 auto auto 0; width: 100%; background: var(--sand); border: 0;
               opacity: 0; transform: translateY(14px); transition: opacity .55s var(--ease), transform .7s var(--ease); pointer-events: none; }}
.plot__card.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; }}
.plot__card .cat__shot img {{ aspect-ratio: 3 / 2; }}
.plot__card .cat__book {{ flex: 1; }}

/* shorter laptops: keep the pin, tighten the card */
@media (max-height: 840px) {{
  .plot__card .cat__shot img {{ aspect-ratio: 16 / 9; }}
  .plot__card .cat__body {{ padding: 16px 18px; }}
  .plot__card .cat__facts {{ margin-top: 10px; padding-top: 10px; gap: 5px; }}
  .plot__card .cat__price {{ margin-top: 10px; }}
  .plot__card .cat__actions {{ padding-top: 12px; }}
}}
@media (max-height: 700px) {{
  .plot__card .cat__facts {{ display: none; }}
}}

/* phones and very short screens: no pin — the photo, all three circles, the cards stacked */
@media (max-width: 820px), (max-height: 560px) {{
  .plot {{ background: var(--warm-white); }}
  .plot__stage {{ position: static; height: auto; overflow: visible; }}
  .plot__frame {{ position: relative; aspect-ratio: 4 / 3; overflow: hidden; }}
  .plot__photo {{ object-position: 100% 100%; }}
  .pen {{ stroke-width: 5; }}
  .hand--d {{ display: none; }}
  .hand--m {{ display: block; font-size: 36px; }}
  .plot__svg {{ position: absolute; }}
  .hand {{ font-size: 44px; }}
  .plot__cards {{ position: static; transform: none; width: auto; padding: clamp(20px, 5vw, 36px) var(--gutter) 0; background: none; box-shadow: none; }}
  .plot__deck {{ display: grid; gap: 16px; }}
  .plot__card, .plot__card.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; border: var(--rule); }}
  .plot__tabs {{ display: none; }}
  [data-loop], .mark {{ opacity: 1 !important; }}
}}
@media (min-width: 821px) and (min-height: 561px) {{
  .plot__frame {{ position: absolute; inset: 0; }}
}}
.no-motion .plot__stage {{ position: static; height: auto; }}
.no-motion .plot__frame {{ position: relative; aspect-ratio: 16 / 9; }}
.no-motion .plot__cards {{ position: static; transform: none; width: auto; padding: 24px var(--gutter) 0; background: none; box-shadow: none; }}
.no-motion .plot__deck {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }}
.no-motion .plot__card, .no-motion .plot__card.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; border: var(--rule); }}
.no-motion [data-loop], .no-motion .mark {{ opacity: 1 !important; }}
.no-motion .plot__tabs {{ display: none; }}

.stg {{ background: var(--sand); }}
.stg p {{ max-width: 60ch; }}
.stg .label {{ display: block; margin-bottom: 12px; }}
</style>
</head>
<body>

{nav}
<section class="band band--tight wrap stg">
  <span class="label">Staging · not linked from the site</span>
  <h1 style="font-size:clamp(2rem,4vw,3.4rem)">Where you'll stay, as a scroll</h1>
  <p class="lead" style="margin-top:18px">Scroll on. The photograph holds while one house at a time takes the left margin, and its circle draws itself where the house actually stands. On a phone, or under reduced motion, it lays out flat instead: the photo with all three circles, then the three houses.</p>
  <p style="margin-top:14px;max-width:60ch">On the homepage this beat would be introduced in the resort's own voice, something like: <em>"The whole resort from above. We've circled where each house stands, so you can see for yourself how close to the water you'd be."</em></p>
</section>

<section class="plot" data-plot aria-labelledby="plot-h">
  <h2 id="plot-h" class="visually-hidden">Where you'll stay</h2>
  <div class="plot__stage">
    <div class="plot__frame">
      <img class="plot__photo" src="{A}hero-carousel/hero-4.webp" alt="Koh Kood Beach Resort from above: the beach, the pool, the lawn and the bungalows among the palms" width="2000" height="1125">
      <svg class="plot__svg" viewBox="0 0 1000 562" preserveAspectRatio="xMidYMid slice" data-overlay aria-hidden="true">
        {''.join(svg_paths)}
        {''.join(labels)}
      </svg>
    </div>
    <div class="plot__cards">
      <div class="plot__tabs" role="tablist" aria-label="Houses">{tabs}</div>
      <div class="plot__deck">{''.join(cards)}</div>
    </div>
  </div>
</section>

<section class="band wrap">
  <p class="lead" style="max-width:52ch">That is the whole beat. On the homepage the page would continue here with the highlights, the pool and the journey.</p>
  <a href="index.html" class="link" style="display:inline-block;margin-top:24px">Back to the homepage</a>
</section>

{foot}
<script src="script.js"></script>
<script>
/* Pinned, scroll-driven, like the route map: the section is taller than the
   stage, the stage sticks, and progress through the extra height picks the
   house and draws its circle. Reads scroll on rAF for the same reason
   initRoute() does — this needs "how far", not "is it on screen". */
(() => {{
  const root = document.querySelector('[data-plot]');
  if (!root) return;
  const stage = root.querySelector('.plot__stage');
  const cards = [...root.querySelectorAll('[data-card]')];
  const loops = [...root.querySelectorAll('[data-loop]')];
  const marks = [...root.querySelectorAll('[data-label]')];
  const tabs  = [...root.querySelectorAll('[data-tab]')];
  const N = cards.length;
  const STEP_VH = 0.9;                                   // scroll per house, in viewport heights
  const DRAW = 0.45;                                     // the circle draws over the first 45% of its step
  const navH = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
  const pinned = () => matchMedia('(min-width: 821px) and (min-height: 561px)').matches
                      && !document.documentElement.classList.contains('no-motion');

  loops.forEach((l) => {{ const len = l.getTotalLength(); l.dataset.len = len; l.style.strokeDasharray = len; l.style.strokeDashoffset = len; }});

  let current = -1;
  function show(i) {{
    if (i === current) return;
    current = i;
    cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
    tabs.forEach((t, k) => {{ t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); }});
  }}
  const byStep = cards.map((_, i) => loops.filter((l) => +l.dataset.loop === i));
  function draw(i, t) {{
    byStep.forEach((group, k) => group.forEach((l, j) => {{
      const len = +l.dataset.len;
      const tj = k < i ? 1 : k > i ? 0 : Math.min(1, Math.max(0, t * group.length - j));   // strokes in turn
      l.style.strokeDashoffset = len * (1 - tj);
      l.classList.toggle('is-on', k === i); l.classList.toggle('is-past', k < i);
    }}));
    // two label sets share each step (desktop and phone positions) — read the step off the element, never the array index
    marks.forEach((m) => {{ const k = +m.dataset.label; m.classList.toggle('is-on', k === i && t > 0.55); m.classList.toggle('is-past', k < i); }});
  }}
  function settle() {{                                    // unpinned: everything drawn, every card shown
    root.style.height = '';
    loops.forEach((l) => {{ l.style.strokeDashoffset = 0; l.classList.add('is-on'); l.classList.remove('is-past'); }});
    marks.forEach((m) => {{ m.classList.add('is-on'); m.classList.remove('is-past'); }});
    cards.forEach((c) => c.classList.add('is-on'));
    current = -2;
  }}
  const overlay = root.querySelector('[data-overlay]');
  function layout() {{
    // the SVG has to crop exactly as the photograph does, or the circles drift off the huts
    overlay.setAttribute('preserveAspectRatio', matchMedia('(max-width: 820px)').matches ? 'xMaxYMax slice' : 'xMidYMax slice');
    if (!pinned()) return settle();
    root.style.height = `calc((100vh - ${{navH()}}px) + ${{N * STEP_VH * 100}}vh)`;
    cards.forEach((c, k) => c.classList.toggle('is-on', k === Math.max(0, current)));
    update();
  }}
  function update() {{
    if (!pinned()) return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const y = Math.min(Math.max(navH() - root.getBoundingClientRect().top, 0), travel);
    const seg = travel ? (y / travel) * N : N;
    const i = Math.min(N - 1, Math.floor(seg));
    const t = Math.min(1, (seg - i) / DRAW);
    show(i); draw(i, t);
  }}
  let ticking = false;
  addEventListener('scroll', () => {{ if (!ticking) {{ ticking = true; requestAnimationFrame(() => {{ ticking = false; update(); }}); }} }}, {{ passive: true }});
  addEventListener('resize', layout);
  // a viewport can cross the pin threshold without a resize event reaching us (device emulation,
  // some tablet rotations) — the media queries themselves are the reliable signal
  ['(min-width: 821px)', '(min-height: 561px)', '(max-width: 820px)'].forEach((q) => matchMedia(q).addEventListener('change', layout));
  tabs.forEach((tab, k) => tab.addEventListener('click', () => {{
    if (!pinned()) return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const top = root.getBoundingClientRect().top + scrollY - navH() + (travel / N) * (k + DRAW * 0.9);
    window.scrollTo({{ top, behavior: 'smooth' }});
  }}));
  layout();
}})();
</script>
</body>
</html>
'''
    out = ROOT / 'staging-plot.html'
    out.write_text(page, encoding='utf-8')
    print('wrote', out.name, len(page) // 1024, 'KB')


if __name__ == '__main__':
    build()
