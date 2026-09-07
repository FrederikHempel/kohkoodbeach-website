"""Builds staging-plot.html at the project root — a standalone page to test the
"where you'll stay" beat: the drone frame pinned, the houses one at a time in
the left margin on a soft scrim, each circle drawing itself as you scroll.

Loop geometry is in viewBox units (1000 x 562 over the 2000 x 1125 frame).
Positions came from Frederik on 7 Sep 2026: the four leftmost huts (two per
row) are Bali Deluxe, the rest of both rows are Bali House, the four houses in
the cluster to the north-east are Thai Twin.

Second pass, 8 Sep 2026: the section opens on the photograph alone and the
first house arrives with the scroll; the sand card became copy on a gradient;
the Deluxe loop leans with the rows (the back pair sits ~25 units further
right than the front pair) and no longer cuts its fourth hut.
"""
import math, random, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = 'assets/'

# --- loop geometry ------------------------------------------------------------
# cx, cy, rx, ry: the box. `n` is the superellipse exponent (2 = ellipse; 6–8 = a
# rounded rectangle, which is what a hand draws round a row of huts). `shear`
# leans the shape: the bottom edge moves right by that much and the top edge
# left, because the back row is offset from the front row. `wob` is the wobble
# amplitude — kept low on the two row loops, where the strokes pass within a
# few units of the neighbouring huts.
LOOPS = {
    # the long low roof between the beach and the lawn — best reading of the frame, to be confirmed
    'restaurant':  [dict(cx=371, cy=203, rx=50,  ry=34, rot=-0.15, n=2.4, shear=0, wob=0.04, seed=15)],
    'bali-house':  [dict(cx=604, cy=479, rx=146, ry=82, rot=0.0, n=8,   shear=16, wob=0.015, seed=11),
                    dict(cx=770, cy=380, rx=36,  ry=26, rot=0.0, n=2,   shear=0,  wob=0.05,  seed=14)],
    'bali-deluxe': [dict(cx=409, cy=479, rx=53.5, ry=82, rot=0.0, n=6,  shear=16, wob=0.015, seed=12)],
    'thai-twin':   [dict(cx=762, cy=290, rx=118, ry=55, rot=0.10, n=2.6, shear=0, wob=0.04,  seed=13)],
}
# hand-lettered names, each sat just above its loop — desktop position, phone position
LABELS = {
    'restaurant':  dict(x=338, y=270, mx=330, my=272, text='Open-air restaurant'),
    'bali-house':  dict(x=560, y=374, mx=560, my=374, text='Bali House'),
    'bali-deluxe': dict(x=350, y=386, mx=312, my=388, text='Bali Deluxe'),
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
# step ids: -1 is the opening beat (the photograph alone), then one step per house
STEPS = [('restaurant', -1), ('bali-house', 0), ('bali-deluxe', 1), ('thai-twin', 2)]


def loop(cx, cy, rx, ry, rot, n, shear, wob, seed):
    """One marker stroke round a (sheared) superellipse: low-frequency wobble,
    and the pen overshoots its start the way a hand does."""
    random.seed(seed)
    ph = [random.uniform(0, math.tau) for _ in range(3)]
    amp = [random.uniform(wob * 0.6, wob) for _ in range(3)]
    pts, steps = [], 120
    sgn = lambda v: (v > 0) - (v < 0)
    for i in range(steps + 11):
        t = i / steps * math.tau
        w = 1 + sum(a * math.sin(k * t + p) for k, (a, p) in enumerate(zip(amp, ph), start=2))
        c, s_ = math.cos(t), math.sin(t)
        x = rx * w * sgn(c) * abs(c) ** (2 / n)
        y = ry * w * sgn(s_) * abs(s_) ** (2 / n)
        x += shear * (y / ry)                       # lean: bottom right, top left
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
    for k, i in STEPS:
        for L in LOOPS[k]:
            svg_paths.append(f'<path class="pen" data-loop="{i}" d="{loop(**L)}"/>')
        Lb = LABELS[k]
        labels.append(f'<text class="hand hand--d mark" data-label="{i}" x="{Lb["x"]}" y="{Lb["y"]}">{Lb["text"]}</text>'
                      f'<text class="hand hand--m mark" data-label="{i}" x="{Lb["mx"]}" y="{Lb["my"]}">{Lb["text"]}</text>')

    houses = []
    for i, h in enumerate(HOUSES):
        houses.append(f'''
        <article class="ph" data-card="{i}">
          <div class="ph__shot"><img src="{h['img']}" alt="{h['name']}" width="{h['w']}" height="{h['h']}"></div>
          <h3 class="ph__name">{h['name']}</h3>
          <p class="ph__line">{h['line']}</p>
          <dl class="ph__facts">
            <div><dt>Size</dt><dd>{h['size']}</dd></div>
            <div><dt>Beds</dt><dd>{h['beds']}</dd></div>
            <div><dt>Sleeps</dt><dd>{h['sleeps']}</dd></div>
          </dl>
          <p class="ph__price">from {h['price']} THB <span class="ph__unit">per night</span></p>
          <a class="ph__cta" href="accommodation.html#{h['id']}">Learn more <span class="arrow" aria-hidden="true">&#8594;</span></a>
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
.plot {{ position: relative; background: var(--charcoal); --pl-ink: var(--warm-white); --pl-ink-2: rgba(248,246,241,.8); --pl-ink-3: rgba(248,246,241,.62); --pl-rule: rgba(248,246,241,.26); }}
.plot__stage {{ position: sticky; top: var(--nav-h, 70px); height: calc(100vh - var(--nav-h, 70px)); overflow: hidden; }}
.plot__frame {{ position: absolute; inset: 0; }}
.plot__photo {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 100%; filter: saturate(1.06) sepia(.07) contrast(1.03); }}
.plot__svg {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
/* the left margin darkens softly — enough to carry text, never a box */
.plot__scrim {{ position: absolute; inset: 0; pointer-events: none;
                background: linear-gradient(90deg, rgba(28,26,24,.80) 0%, rgba(28,26,24,.66) 24%, rgba(28,26,24,.26) 46%, rgba(28,26,24,0) 62%); }}
.pen {{ fill: none; stroke: var(--gold); stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 1px 1px rgba(0,0,0,.35)); }}
[data-loop] {{ opacity: 0; transition: opacity 1s var(--ease); }}
[data-loop].is-on {{ opacity: 1; }}
[data-loop].is-past {{ opacity: .38; }}
[data-loop="-1"].is-past {{ opacity: .5; }}
.mark[data-label="-1"].is-past {{ opacity: .6; }}
.mark {{ opacity: 0; transition: opacity 1s var(--ease); }}
.mark.is-on {{ opacity: 1; }}
.mark.is-past {{ opacity: .45; }}
.hand--m {{ display: none; }}
.hand {{ font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 300; font-variation-settings: 'SOFT' 100, 'WONK' 1, 'opsz' 40; font-size: 30px; fill: var(--warm-white); filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }}

/* the left column: an opening line first, then one house at a time */
.plot__side {{ position: absolute; left: var(--gutter); top: 50%; transform: translateY(-50%); width: clamp(300px, 27vw, 400px); color: var(--pl-ink); }}
.plot__lead {{ position: absolute; inset: 0 auto auto 0; width: 100%; opacity: 0; transform: translateY(12px); transition: opacity .7s var(--ease), transform .9s var(--ease); pointer-events: none; }}
.plot__lead.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; transition: opacity 1.2s var(--ease) .4s, transform 1.4s var(--ease) .4s; }}
.plot__lead .label {{ color: var(--pl-ink-3); }}
.plot__lead h2 {{ color: var(--pl-ink); font-size: clamp(2.2rem, 3.6vw, 3.4rem); line-height: 1.02; margin-top: 12px; max-width: 12ch; }}
.plot__lead p {{ color: var(--pl-ink-2); margin-top: 18px; max-width: 32ch; }}
.plot__lead .plot__hint {{ margin-top: 26px; font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--pl-ink-3); }}
.plot__tabs {{ display: flex; gap: 16px; margin-bottom: 18px; opacity: 0; transition: opacity 1s var(--ease) .4s; }}
.plot__side.is-houses .plot__tabs {{ opacity: 1; }}
.plot__tab {{ font-size: .64rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--pl-ink-3); padding: 6px 0; border-bottom: 1px solid transparent; transition: color var(--t-control) var(--ease-quick), border-color var(--t-control) var(--ease-quick), transform var(--t-press) var(--ease-quick); }}
.plot__tab.is-on {{ color: var(--pl-ink); border-bottom-color: var(--gold); }}
.plot__tab:active {{ transform: scale(.97); }}
.plot__deck {{ position: relative; }}
.ph {{ position: absolute; inset: 0 auto auto 0; width: 100%; opacity: 0; transform: translateY(18px); transition: opacity .7s var(--ease), transform .9s var(--ease); pointer-events: none; }}
.ph.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; transition: opacity 1.2s var(--ease) .4s, transform 1.4s var(--ease) .4s; }}
.ph__shot {{ overflow: hidden; }}
.ph__shot img {{ width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; }}
.ph__name {{ font-family: var(--font-display); font-weight: 300; font-size: clamp(1.7rem, 2.4vw, 2.3rem); line-height: 1.08; color: var(--pl-ink); margin-top: 18px; }}
.ph__line {{ color: var(--pl-ink-2); margin-top: 8px; font-size: .95rem; max-width: 34ch; }}
.ph__facts {{ margin: 16px 0 0; padding-top: 12px; border-top: 1px solid var(--pl-rule); display: grid; gap: 6px; }}
.ph__facts > div {{ display: flex; justify-content: space-between; gap: 14px; align-items: baseline; }}
.ph__facts dt {{ font-size: .64rem; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; color: var(--pl-ink-3); }}
.ph__facts dd {{ margin: 0; font-size: .88rem; text-align: right; color: var(--pl-ink-2); }}
.ph__price {{ margin-top: 16px; font-family: var(--font-display); font-size: 1.28rem; font-variant-numeric: tabular-nums; color: var(--pl-ink); }}
.ph__unit {{ font-family: var(--font-body); font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; color: var(--pl-ink-3); margin-left: 6px; }}
.ph__cta {{ display: inline-flex; align-items: center; gap: 10px; margin-top: 20px; padding: 14px 26px; background: var(--warm-white); color: var(--charcoal);
               font-size: .7rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; transition: background var(--t-control) var(--ease-quick), transform var(--t-press) var(--ease-quick); }}
.ph__cta .arrow {{ transition: transform var(--t-control) var(--ease-quick); }}
@media (hover: hover) and (pointer: fine) {{ .ph__cta:hover {{ background: var(--sand); }} .ph__cta:hover .arrow {{ transform: translateX(3px); }} }}
.ph__cta:active {{ transform: scale(.985); }}

/* shorter laptops: keep the pin, tighten the column */
@media (max-height: 840px) {{
  .ph__shot img {{ aspect-ratio: 16 / 9; }}
  .ph__name {{ margin-top: 14px; }}
  .ph__facts {{ margin-top: 12px; padding-top: 10px; gap: 5px; }}
  .ph__price {{ margin-top: 12px; }}
  .ph__cta {{ margin-top: 14px; }}
}}
@media (max-height: 700px) {{
  .ph__facts {{ display: none; }}
  .plot__lead p {{ display: none; }}
}}

/* phones and very short screens: no pin — the lead, the photo with all three circles, the houses stacked */
@media (max-width: 820px), (max-height: 560px) {{
  .plot {{ background: var(--warm-white); --pl-ink: var(--charcoal); --pl-ink-2: var(--ink-muted); --pl-ink-3: var(--warm-gray-strong); --pl-rule: rgba(43,41,38,.16); }}
  .plot__stage {{ position: static; height: auto; overflow: visible; display: flex; flex-direction: column; }}
  .plot__frame {{ position: relative; aspect-ratio: 4 / 3; overflow: hidden; order: 2; }}
  .plot__photo {{ object-position: 100% 100%; }}
  .plot__scrim {{ display: none; }}
  .pen {{ stroke-width: 5; }}
  .hand--d {{ display: none; }}
  .hand--m {{ display: block; font-size: 36px; }}
  .plot__side {{ position: static; transform: none; width: auto; display: contents; }}
  .plot__lead, .plot__lead.is-on {{ position: static; order: 1; opacity: 1; transform: none; pointer-events: auto; padding: clamp(28px, 6vw, 48px) var(--gutter) clamp(20px, 4vw, 30px); }}
  .plot__lead .plot__hint {{ display: none; }}
  .plot__tabs {{ display: none; }}
  .plot__deck {{ order: 3; display: grid; gap: 28px; padding: clamp(24px, 5vw, 36px) var(--gutter) clamp(40px, 8vw, 64px); }}
  .ph, .ph.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; }}
  .ph__cta {{ background: var(--charcoal); color: var(--warm-white); }}
  [data-loop], .mark {{ opacity: 1 !important; }}
}}
.no-motion .plot {{ background: var(--warm-white); --pl-ink: var(--charcoal); --pl-ink-2: var(--ink-muted); --pl-ink-3: var(--warm-gray-strong); --pl-rule: rgba(43,41,38,.16); }}
.no-motion .plot__stage {{ position: static; height: auto; overflow: visible; display: flex; flex-direction: column; }}
.no-motion .plot__frame {{ position: relative; aspect-ratio: 16 / 9; order: 2; }}
.no-motion .plot__scrim {{ display: none; }}
.no-motion .plot__side {{ position: static; transform: none; width: auto; display: contents; }}
.no-motion .plot__lead, .no-motion .plot__lead.is-on {{ position: static; order: 1; opacity: 1; transform: none; pointer-events: auto; padding: 28px var(--gutter) 20px; }}
.no-motion .plot__lead .plot__hint {{ display: none; }}
.no-motion .plot__tabs {{ display: none; }}
.no-motion .plot__deck {{ order: 3; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; padding: 28px var(--gutter) 56px; }}
.no-motion .ph, .no-motion .ph.is-on {{ position: relative; opacity: 1; transform: none; pointer-events: auto; }}
.no-motion .ph__cta {{ background: var(--charcoal); color: var(--warm-white); }}
.no-motion [data-loop], .no-motion .mark {{ opacity: 1 !important; }}

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
  <p class="lead" style="margin-top:18px">Scroll on. The photograph holds, the resort reads first on its own, and then one house at a time takes the left margin while its circle draws itself where the house actually stands. On a phone, or under reduced motion, it lays out flat instead.</p>
</section>

<section class="plot" data-plot aria-labelledby="plot-h">
  <div class="plot__stage">
    <div class="plot__frame">
      <img class="plot__photo" src="{A}hero-carousel/hero-4.webp" alt="Koh Kood Beach Resort from above: the beach, the pool, the lawn and the bungalows among the palms" width="2000" height="1125">
      <svg class="plot__svg" viewBox="0 0 1000 562" preserveAspectRatio="xMidYMax slice" data-overlay aria-hidden="true">
        {''.join(svg_paths)}
        {''.join(labels)}
      </svg>
      <div class="plot__scrim"></div>
    </div>
    <div class="plot__side">
      <div class="plot__lead is-on" data-lead>
        <span class="label">The resort from above</span>
        <h2 id="plot-h">Where you'll stay</h2>
        <p>The whole resort in one picture — the beach, the pool, the open-air restaurant, and the houses among the palms. We've circled where each one stands, so you can see for yourself how close to the water you'd be.</p>
        <p class="plot__hint">Scroll to see the houses</p>
      </div>
      <div class="plot__tabs" role="tablist" aria-label="Houses">{tabs}</div>
      <div class="plot__deck">{''.join(houses)}
      </div>
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
   stage, the stage sticks, and progress through the extra height first shows
   the photograph on its own, then picks the house and draws its circle. Reads
   scroll on rAF for the same reason initRoute() does — this needs "how far",
   not "is it on screen". */
(() => {{
  const root = document.querySelector('[data-plot]');
  if (!root) return;
  const stage = root.querySelector('.plot__stage');
  const side  = root.querySelector('.plot__side');
  const lead  = root.querySelector('[data-lead]');
  const cards = [...root.querySelectorAll('[data-card]')];
  const loops = [...root.querySelectorAll('[data-loop]')];
  const marks = [...root.querySelectorAll('[data-label]')];
  const tabs  = [...root.querySelectorAll('[data-tab]')];
  const overlay = root.querySelector('[data-overlay]');
  const N = cards.length;
  const INTRO = 0.7;                                     // the photograph alone, in step lengths, before the first house
  const STEP_VH = 1.0;                                   // scroll per step, in viewport heights
  const DRAW = 0.5;                                      // a circle draws over the first half of its step
  const navH = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
  const pinned = () => matchMedia('(min-width: 821px) and (min-height: 561px)').matches
                      && !document.documentElement.classList.contains('no-motion');

  loops.forEach((l) => {{ const len = l.getTotalLength(); l.dataset.len = len; l.style.strokeDasharray = len; l.style.strokeDashoffset = len; }});
  const stepIds = [-1, ...cards.map((_, i) => i)];      // -1: the opening beat and its landmark
  const byStep = stepIds.map((k) => loops.filter((l) => +l.dataset.loop === k));

  let current = null;
  function show(i) {{                                    // i = -1 is the opening beat: no house yet
    if (i === current) return;
    current = i;
    lead.classList.toggle('is-on', i < 0);
    side.classList.toggle('is-houses', i >= 0);
    cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
    tabs.forEach((t, k) => {{ t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); }});
  }}
  function draw(i, t) {{
    byStep.forEach((group, idx) => group.forEach((l, j) => {{
      const k = stepIds[idx];
      const len = +l.dataset.len;
      const tj = k < i ? 1 : k > i ? 0 : Math.min(1, Math.max(0, t * group.length - j));   // strokes in turn
      l.style.strokeDashoffset = len * (1 - tj);
      l.classList.toggle('is-on', k === i); l.classList.toggle('is-past', k < i);
    }}));
    // two label sets share each step (desktop and phone positions) — read the step off the element, never the array index
    marks.forEach((m) => {{ const k = +m.dataset.label; m.classList.toggle('is-on', k === i && t > 0.55); m.classList.toggle('is-past', k < i); }});
  }}
  function settle() {{                                    // unpinned: everything drawn, every house shown, the lead in the flow
    root.style.height = '';
    loops.forEach((l) => {{ l.style.strokeDashoffset = 0; l.classList.add('is-on'); l.classList.remove('is-past'); }});
    marks.forEach((m) => {{ m.classList.add('is-on'); m.classList.remove('is-past'); }});
    cards.forEach((c) => c.classList.add('is-on'));
    lead.classList.add('is-on');
    current = null;
  }}
  function layout() {{
    // the SVG has to crop exactly as the photograph does, or the circles drift off the huts
    overlay.setAttribute('preserveAspectRatio', matchMedia('(max-width: 820px)').matches ? 'xMaxYMax slice' : 'xMidYMax slice');
    if (!pinned()) return settle();
    root.style.height = `calc((100vh - ${{navH()}}px) + ${{(N + INTRO) * STEP_VH * 100}}vh)`;
    current = null;
    update();
  }}
  function update() {{
    if (!pinned()) return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const y = Math.min(Math.max(navH() - root.getBoundingClientRect().top, 0), travel);
    const seg = (travel ? y / travel : 1) * (N + INTRO) - INTRO;
    if (seg < 0) {{ show(-1); draw(-1, Math.min(1, (seg + INTRO) / (INTRO * 0.7))); return; }}   // the landmark draws through the opening beat
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
    const top = root.getBoundingClientRect().top + scrollY - navH() + travel * (INTRO + k + DRAW * 0.9) / (N + INTRO);
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
