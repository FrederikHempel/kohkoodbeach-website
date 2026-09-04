"""
Rebuilds the body of book.html.

The room chooser and the three "See more information" overlays are generated
from accommodation.html, not hand-written, so the two pages cannot drift: the
overlay reuses that page's own .panel markup verbatim, with its "Book now"
links swapped for buttons that set the form's selection and close the dialog.

Run from the project root:  python3 scratchpad/build_book.py
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
acc = (ROOT / 'accommodation.html').read_text(encoding='utf-8')

STYLE_ORDER = ['bali-house', 'bali-deluxe', 'thai-twin-house']
NAMES = {'bali-house': 'Bali House', 'bali-deluxe': 'Bali Deluxe',
         'thai-twin-house': 'Thai Twin House'}
# One line per house, taken from the accommodation page's own card copy.
HOOKS = {
    'bali-house': 'Bali cottage style on stilts among the palms, with an open-air bathroom.',
    'bali-deluxe': 'The same style, half as big again — two bedrooms and a living space.',
    'thai-twin-house': 'Simpler and lighter, with two proper beds and a terrace at the front.',
}

# ---- pull each room's panel out of accommodation.html ----
starts = [(m.group(1), m.start()) for m in re.finditer(r'<div class="panel" id="panel-([a-z-]+)"', acc)]
panels, rooms = {}, {}
for i, (key, a) in enumerate(starts):
    b = starts[i + 1][1] if i + 1 < len(starts) else acc.index('</section>', a)
    blk = acc[a:b].rstrip()
    # Trim back to the panel's own closing tag. The last panel is followed by the
    # region's wrappers, so count divs rather than trusting the final one.
    depth, end = 0, None
    for m in re.finditer(r'<div\b|</div>', blk):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            end = m.end(); break
    blk = blk[:end]
    panels[key] = blk
    picks = []
    for p in re.finditer(r'<span class="pick__name">(.*?)</span>\s*'
                         r'<span class="pick__where">(.*?)</span>\s*'
                         r'<span class="pick__price">from ([\d,]+).*?'
                         r'book\.html\?room=([a-z-]+)', blk, re.S):
        picks.append({
            'name': re.sub(r'<span class="pick__note">([^<]*)</span>', r' \1', p.group(1)).strip(),
            'where': p.group(2).strip(), 'price': p.group(3), 'id': p.group(4),
        })
    rooms[key] = {'picks': picks, 'img': re.search(r'<img src="([^"]+)"[^>]*width="(\d+)" height="(\d+)"', blk).groups()}

def dialog(key):
    """The room's accommodation-page panel, re-pointed at the form."""
    blk = panels[key]
    blk = blk.replace(f'<div class="panel" id="panel-{key}" data-panel="{key}" hidden>',
                      '<div class="panel">')
    # "Book now" links leave the page; in the overlay they must choose and close.
    blk = re.sub(r'<a class="pick__book" href="book\.html\?room=([a-z-]+)">Book now</a>',
                 r'<button type="button" class="pick__book" data-choose="\1">Choose this room</button>', blk)
    return f'''<dialog class="rdlg" id="rdlg-{key}" aria-labelledby="rdlg-{key}-h">
  <div class="rdlg__bar">
    <h2 class="rdlg__h" id="rdlg-{key}-h">{NAMES[key]}</h2>
    <button type="button" class="rdlg__close" data-dlg-close aria-label="Close">&#10005;</button>
  </div>
  <div class="rdlg__body">
{blk}
  </div>
</dialog>'''

def house(key):
    """One house: photograph-led row, with its views folded underneath."""
    r = rooms[key]; src, w, h = r['img']
    lowest = min(r['picks'], key=lambda p: int(p['price'].replace(',', '')))['price']
    views = '\n'.join(
        f'''          <label class="view">
            <input type="radio" name="room" value="{p['id']}" data-label="{NAMES[key]} &ndash; {p['name']}" data-price="{p['price']}">
            <span class="view__name">{p['name']}</span>
            <span class="view__price">from {p['price']}<span class="view__unit">THB</span></span>
          </label>''' for p in r['picks'])
    return f'''    <article class="house" data-house="{key}">
      <img class="house__shot" src="{src}" alt="" width="{w}" height="{h}" loading="lazy">
      <div class="house__body">
        <h2 class="house__name">{NAMES[key]}</h2>
        <p class="house__hook">{HOOKS[key]}</p>
        <p class="house__from">from {lowest} <span class="house__unit">THB</span> <span class="house__night">per night</span></p>
        <p class="house__chosen" data-house-chosen aria-live="polite"></p>
        <div class="house__actions">
          <button type="button" class="btn" data-house-open="{key}" aria-expanded="false" aria-controls="views-{key}">Choose this room</button>
          <button type="button" class="house__more" data-dlg-open="rdlg-{key}">More about it</button>
          <button type="button" class="house__change" data-house-change="{key}" hidden>Change</button>
        </div>
      </div>
      <div class="house__views" id="views-{key}" data-house-views hidden>
        <div class="house__views-inner" role="radiogroup" aria-label="{NAMES[key]} &mdash; which view?">
{views}
        </div>
      </div>
    </article>'''

houses = '\n'.join(house(k) for k in STYLE_ORDER)
dialogs = '\n\n'.join(dialog(k) for k in STYLE_ORDER)

# The country list is carried forward from whatever book.html currently holds,
# so re-running this script never silently drops or reorders it. The attribute
# match is loose because the rebuilt select gains `required`.
COUNTRIES = re.search(r'<select name="nationality"[^>]*>(.*?)</select>',
                      (ROOT / 'book.html').read_text(encoding='utf-8'), re.S).group(1)

BODY = f'''<!-- ============ THE ENQUIRY ============
     One <form> wraps the whole page: the hero strip, the rail, the houses and
     the details are all fields of the same enquiry. The visitor clicked "Book
     now" — the page's job is to take the question with as little friction as
     possible and to feel like the first day of the stay while it does.
     ⚠️ The houses and their overlays are GENERATED from accommodation.html by
     scratchpad/build_book.py — edit the rooms there. -->
<form class="enq" data-book-form data-endpoint="https://api.web3forms.com/submit">
  <!-- ⚠️ Empty on purpose. Paste the Web3Forms access key here and the form
       starts POSTing for real; while blank it falls back to the mailto draft.
       See CLAUDE.md — do not invent a key. -->
  <input type="hidden" name="access_key" value="">
  <input type="hidden" name="subject" value="Booking enquiry — Koh Kood Beach Resort">
  <input type="hidden" name="from_name" value="Koh Kood Beach Resort website">
  <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">

  <!-- ============ HERO: the photograph, and the four fields that start it ============
       The <video> has no src in the markup. initBookHero() attaches it only on a
       wide screen, without prefers-reduced-motion, and not on a save-data
       connection — everyone else gets the poster, which is the video's own
       first frame, so nothing jumps when it does start. -->
  <section class="bhero" data-bhero>
    <video class="bhero__video" muted playsinline loop preload="none"
           poster="assets/book-hero-poster.webp" data-src="assets/book-hero.mp4" aria-hidden="true"></video>
    <div class="bhero__copy">
      <h1>When will you arrive?</h1>
      <p class="bhero__sub">Tell us your dates and who is coming. We reply within 24 hours, usually the same day &mdash; no payment now.</p>
    </div>
    <div class="bhero__strip">
      <label class="field"><span class="label">Arrival</span><input type="date" name="checkin" required></label>
      <label class="field"><span class="label">Departure</span><input type="date" name="checkout" required></label>
      <label class="field"><span class="label">Adults <span class="label__hint">13+</span></span><input type="number" name="adults" min="1" max="12" value="2" required inputmode="numeric"></label>
      <label class="field"><span class="label">Children <span class="label__hint">2&ndash;12</span></span><input type="number" name="children" min="0" max="10" value="0" inputmode="numeric"></label>
      <button type="button" class="btn" data-continue>Continue <span class="arrow" aria-hidden="true">&#8594;</span></button>
    </div>
  </section>

  <!-- The page answering back: fills in as the visitor chooses. Sticky under
       the nav on desktop, a bottom bar on a phone. -->
  <div class="rail" data-rail aria-live="polite">
    <div class="wrap rail__inner">
      <span class="rail__item" data-rail-dates>Your dates</span>
      <span class="rail__sep" aria-hidden="true">&middot;</span>
      <span class="rail__item" data-rail-guests>2 adults</span>
      <span class="rail__sep" aria-hidden="true">&middot;</span>
      <span class="rail__item" data-rail-room>Any bungalow</span>
      <a href="#send" class="rail__send">Send enquiry <span class="arrow" aria-hidden="true">&#8594;</span></a>
    </div>
  </div>

  <!-- ============ THE HOUSES ============ -->
  <section class="houses wrap" id="rooms">
{houses}
    <label class="view view--any">
      <input type="radio" name="room" value="" data-label="Not sure yet &mdash; happy to be recommended a room" checked>
      <span class="view__name">Not sure yet &mdash; recommend one for us</span>
    </label>
  </section>

  <!-- ============ YOUR DETAILS ============ -->
  <section class="details form wrap-narrow" id="details">
    <h2 class="details__h">Your details</h2>
    <div class="radios" role="radiogroup" aria-label="Are your dates fixed?">
      <label><input type="radio" name="dates" value="fixed" checked> <span>Fixed dates</span></label>
      <label><input type="radio" name="dates" value="flexible"> <span>Flexible by 2&ndash;3 days</span></label>
    </div>
    <div class="form__row">
      <label><span class="label">Name</span><input type="text" name="name" required autocomplete="name"></label>
      <label><span class="label">Country</span>
        <select name="nationality" required>{COUNTRIES}</select>
      </label>
    </div>
    <div class="form__row">
      <label><span class="label">Email</span><input type="email" name="email" required autocomplete="email"></label>
      <label><span class="label">Telephone <span class="label__hint">optional</span></span><input type="tel" name="phone" autocomplete="tel"></label>
    </div>
    <div class="form__row">
      <label><span class="label">Infants <span class="label__hint">under 2</span></span><input type="number" name="infants" min="0" max="6" value="0" inputmode="numeric"></label>
      <label><span class="label">Extra bed</span>
        <select name="extrabed"><option value="no">No</option><option value="yes">Yes</option></select></label>
    </div>
    <label><span class="label">Anything else we should know?</span><textarea name="message" rows="4"></textarea></label>
    <div class="details__send" id="send">
      <button type="submit" class="btn">Send enquiry <span class="arrow" aria-hidden="true">&#8594;</span></button>
      <p class="details__note">No payment now. We reply by email within 24 hours, usually the same day
        &mdash; or <a href="https://wa.me/66819088966?text=Hi%21%20I%27d%20like%20to%20ask%20about%20staying%20at%20Koh%20Kood%20Beach%20Resort." target="_blank" rel="noopener" class="link">message us on WhatsApp</a>.</p>
    </div>
  </section>
</form>

<!-- Warm-white on purpose: the last band before the footer must match the
     footer illustration's sky. scratchpad/check_last_band.py refuses the
     commit otherwise. -->
<aside class="rev rev--light">
  <div class="wrap-narrow rev__inner">
    <span class="rev__stars" role="img" aria-label="5 out of 5"><span aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span></span>
    <p class="rev__text">A guest who came in November called it one of the best weeks of her travels around Thailand.</p>
    <p class="rev__by">Gina B <span>&middot;</span> November 2025 <span>&middot;</span>
      <a href="https://www.tripadvisor.com/Hotel_Review-g1152744-d1103353-Reviews-Koh_Kood_Beach_Resort-Ko_Kut_Trat_Province.html" target="_blank" rel="noopener">TripAdvisor</a></p>
  </div>
</aside>

{dialogs}
'''

# ---- splice into book.html between the nav and the footer ----
p = ROOT / 'book.html'
s = p.read_text(encoding='utf-8')
# The body starts at whatever opener the previous build left: the old
# .page-hero section, or this build's own <form>. Match the prefix only —
# the hero carried modifier classes, so an exact class="…" never matched.
import re as _re
_m = _re.search(r'<section class="page-hero[^"]*"|<form class="enq"', s)
if not _m: raise SystemExit('no body opener found in book.html')
a = _m.start()
b = s.index('<footer class="footer">')
p.write_text(s[:a] + BODY + '\n' + s[b:], encoding='utf-8')
print(f'book.html rebuilt — {len(BODY)} bytes of body')
for k in STYLE_ORDER:
    print(f'  {NAMES[k]:16s} {len(rooms[k]["picks"])} views, overlay {len(panels[k])} bytes')
