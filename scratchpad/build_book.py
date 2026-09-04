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

def row(key):
    """One house as a row: photo | name + one line | the views as chips | more."""
    r = rooms[key]; src, w, h = r['img']
    views = '\n'.join(
        f'''          <button type="button" class="chip" role="radio" aria-checked="false"
                  data-room="{p['id']}" data-label="{NAMES[key]} &ndash; {p['name']}">
            <span class="chip__name">{p['name']}</span>
            <span class="chip__where">{p['where']}</span>
            <span class="chip__price">from {p['price']}<span class="chip__unit">THB</span></span>
          </button>''' for p in r['picks'])
    return f'''      <div class="rr">
        <img class="rr__shot" src="{src}" alt="" width="{w}" height="{h}" loading="lazy">
        <div class="rr__text">
          <h3 class="rr__name">{NAMES[key]}</h3>
          <p class="rr__hook">{HOOKS[key]}</p>
        </div>
        <div class="rr__views" role="radiogroup" aria-label="{NAMES[key]} &mdash; choose your view">
{views}
        </div>
        <button type="button" class="rr__more" data-dlg-open="rdlg-{key}">More info</button>
      </div>'''

rows = '\n'.join(row(k) for k in STYLE_ORDER)
dialogs = '\n\n'.join(dialog(k) for k in STYLE_ORDER)

# The country list is carried forward from whatever book.html currently holds,
# so re-running this script never silently drops or reorders it. The attribute
# match is loose because the rebuilt select gains `required`.
COUNTRIES = re.search(r'<select name="nationality"[^>]*>(.*?)</select>',
                      (ROOT / 'book.html').read_text(encoding='utf-8'), re.S).group(1)

BODY = f'''<section class="page-hero page-hero--short" style="background-image:url('assets/book-hero.webp')">
  <div class="page-hero__inner">
    <span class="label">Enquire</span>
    <h1>When will you arrive?</h1>
  </div>
</section>

<!-- ============ THE ENQUIRY ============
     One form, four groups, in the order a visitor actually decides: when, who,
     which bungalow (optional, folded), then who they are. Nothing sits between
     the hero and the first field, so the form is reachable without scrolling.
     ⚠️ The bungalow rows and the three overlays are GENERATED from
     accommodation.html by scratchpad/build_book.py — edit the rooms there. -->
<section class="band band--tight" id="enquiry">
  <form class="form enq wrap-narrow" data-book-form data-endpoint="https://api.web3forms.com/submit">
    <!-- ⚠️ Empty on purpose. Paste the Web3Forms access key here and the form
         starts POSTing for real; while it is blank the submit handler falls
         back to the mailto draft. See CLAUDE.md — do not invent a key. -->
    <input type="hidden" name="access_key" value="">
    <input type="hidden" name="subject" value="Booking enquiry — Koh Kood Beach Resort">
    <input type="hidden" name="from_name" value="Koh Kood Beach Resort website">
    <input type="hidden" name="room" value="">
    <input type="hidden" name="room_label" value="Not sure yet">
    <!-- Web3Forms' honeypot: real people never see it, bots fill it in. -->
    <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">

    <fieldset class="enq__group">
      <legend class="enq__legend">When</legend>
      <div class="radios">
        <label><input type="radio" name="dates" value="fixed" checked> <span>Fixed dates</span></label>
        <label><input type="radio" name="dates" value="flexible"> <span>Flexible by 2&ndash;3 days</span></label>
      </div>
      <div class="form__row">
        <label><span class="label">Arrival</span><input type="date" name="checkin" required></label>
        <label><span class="label">Departure</span><input type="date" name="checkout" required></label>
      </div>
    </fieldset>

    <fieldset class="enq__group">
      <legend class="enq__legend">Who&rsquo;s coming</legend>
      <div class="guests__grid">
        <label><span class="guests__cap">Adults <span class="label__hint">13+</span></span>
          <input type="number" name="adults" min="1" max="12" value="2" required inputmode="numeric"></label>
        <label><span class="guests__cap">Children <span class="label__hint">2&ndash;12</span></span>
          <input type="number" name="children" min="0" max="10" value="0" inputmode="numeric"></label>
        <label><span class="guests__cap">Infants <span class="label__hint">under 2</span></span>
          <input type="number" name="infants" min="0" max="6" value="0" inputmode="numeric"></label>
        <label><span class="guests__cap">Extra bed</span>
          <select name="extrabed"><option value="no">No</option><option value="yes">Yes</option></select></label>
      </div>
    </fieldset>

    <fieldset class="enq__group">
      <legend class="enq__legend">Your bungalow <span class="label__hint">optional</span></legend>
      <!-- Native <details>: opens without JS, is keyboard-operable, and the
           summary is a real control. JS only keeps its text in step with the
           chosen chip. -->
      <details class="fold" data-fold>
        <summary class="fold__sum">
          <span class="fold__current" data-fold-current>Not sure yet &mdash; we&rsquo;ll recommend one</span>
          <span class="fold__cta">Choose a bungalow</span>
        </summary>
        <div class="fold__body">
          <button type="button" class="chip chip--any" role="radio" aria-checked="true"
                  data-room="" data-label="Not sure yet &mdash; happy to be recommended a room">
            Not sure yet &mdash; recommend one for us
          </button>
{rows}
        </div>
      </details>
    </fieldset>

    <fieldset class="enq__group">
      <legend class="enq__legend">Your details</legend>
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
      <label><span class="label">Anything else we should know?</span><textarea name="message" rows="4"></textarea></label>
    </fieldset>

    <div class="enq__send">
      <button type="submit" class="btn">Send enquiry <span class="arrow" aria-hidden="true">&#8594;</span></button>
      <p class="enq__note">No payment now. We reply by email within 24 hours, usually the same day
        &mdash; or <a href="https://wa.me/66819088966?text=Hi%21%20I%27d%20like%20to%20ask%20about%20staying%20at%20Koh%20Kood%20Beach%20Resort." target="_blank" rel="noopener" class="link">message us on WhatsApp</a>.</p>
    </div>
  </form>
</section>

<!-- Warm-white on purpose: this is the last band before the footer, and the
     footer illustration's sky is warm-white. scratchpad/check_last_band.py
     refuses the commit otherwise. -->
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
a = s.index('<section class="page-hero"')
b = s.index('<footer class="footer">')
p.write_text(s[:a] + BODY + '\n' + s[b:], encoding='utf-8')
print(f'book.html rebuilt — {len(BODY)} bytes of body')
for k in STYLE_ORDER:
    print(f'  {NAMES[k]:16s} {len(rooms[k]["picks"])} views, overlay {len(panels[k])} bytes')
