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

def card(key):
    r = rooms[key]; src, w, h = r['img']
    views = '\n'.join(
        f'''          <button type="button" class="rc__view" role="radio" aria-checked="false"
                  data-room="{p['id']}" data-label="{NAMES[key]} &ndash; {p['name']}">
            <span class="rc__view-name">{p['name']}</span>
            <span class="rc__view-where">{p['where']}</span>
            <span class="rc__view-price">from {p['price']} <span class="rc__unit">THB</span></span>
          </button>''' for p in r['picks'])
    return f'''      <article class="rc__card">
        <div class="rc__shot"><img src="{src}" alt="{NAMES[key]}" width="{w}" height="{h}" loading="lazy"></div>
        <h3 class="rc__name">{NAMES[key]}</h3>
        <p class="rc__hook">{HOOKS[key]}</p>
        <div class="rc__views" role="radiogroup" aria-label="{NAMES[key]} &mdash; choose your view">
{views}
        </div>
        <button type="button" class="rc__more" data-dlg-open="rdlg-{key}">See more information</button>
      </article>'''

cards = '\n'.join(card(k) for k in STYLE_ORDER)
dialogs = '\n\n'.join(dialog(k) for k in STYLE_ORDER)

# The country list is carried forward from whatever book.html currently holds,
# so re-running this script never silently drops or reorders it. The attribute
# match is loose because the rebuilt select gains `required`.
COUNTRIES = re.search(r'<select name="nationality"[^>]*>(.*?)</select>',
                      (ROOT / 'book.html').read_text(encoding='utf-8'), re.S).group(1)

BODY = f'''<section class="page-hero" style="background-image:url('assets/book-hero.webp')">
  <div class="page-hero__inner">
    <span class="label">Enquire</span>
    <h1>When will you arrive?</h1>
  </div>
</section>

<section class="band wrap-narrow">
  <p class="lead" style="max-width:56ch" data-reveal>
    There is no online payment here, and no booking engine deciding what you get. Tell us your
    dates and we will reply by email to confirm availability and the exact rate &mdash; within
    24 hours, usually the same day.
  </p>
  <p class="book__alt" style="margin-top:clamp(16px,2vw,24px)" data-reveal>
    Prefer to chat? <a href="https://wa.me/66819088966?text=Hi%21%20I%27d%20like%20to%20ask%20about%20staying%20at%20Koh%20Kood%20Beach%20Resort." target="_blank" rel="noopener" class="link">Message us on WhatsApp</a> &mdash; often the quickest way to reach the front desk.
  </p>
</section>

<!-- ============ ROOM CHOOSER ============ -->
<!-- ⚠️ GENERATED from accommodation.html by scratchpad/build_book.py, together
     with the three overlays below it. Edit the room copy, prices or photos on
     that page and re-run the script; do not hand-edit them here. -->
<section class="band band--sand" id="rooms">
  <div class="wrap">
    <div style="max-width:52ch;margin-bottom:clamp(30px,4vw,54px)">
      <span class="label" data-reveal>Your bungalow</span>
      <h2 style="margin-top:16px;" data-reveal>Which house, and which view?</h2>
      <p style="margin-top:clamp(12px,1.6vw,20px)" data-reveal>Three styles, and within each one a
        choice of where it stands. Pick a view to put it on your enquiry, or leave it &mdash; we are
        glad to suggest one once we know your dates.</p>
    </div>

    <div class="rc" data-reveal-group>
{cards}
    </div>

    <p class="rc__any">
      <button type="button" class="rc__view rc__view--any" role="radio" aria-checked="true"
              data-room="" data-label="Not sure yet &mdash; happy to be recommended a room">
        Not sure yet &mdash; recommend a room
      </button>
    </p>
  </div>
</section>

<!-- ============ THE ENQUIRY ============ -->
<section class="band wrap-narrow" id="enquiry">
  <h2 data-reveal>Your details</h2>

  <!-- ⚠️ The endpoint is `data-endpoint`, NOT `action`, and that is deliberate.
       With a real `action` a no-JS submit would POST natively — which is the
       correct progressive enhancement ONCE a key exists, but with the key blank
       it posts to the service and lands the visitor on its error page. A form
       that cannot work should fail by doing nothing, not by throwing someone
       off the site. Give it back its `action` if you ever want the no-JS path,
       but only after the key is in. -->
  <form class="form" data-book-form data-endpoint="https://api.web3forms.com/submit"
        style="max-width:100%;margin-top:clamp(24px,3vw,38px)" data-reveal>
    <!-- ⚠️ Empty on purpose. Paste the Web3Forms access key here and the form
         starts POSTing for real; while it is blank the submit handler falls
         back to the mailto draft, which is what this page has always done.
         See CLAUDE.md — do not invent a key to make it look finished. -->
    <input type="hidden" name="access_key" value="">
    <input type="hidden" name="subject" value="Booking enquiry — Koh Kood Beach Resort">
    <input type="hidden" name="from_name" value="Koh Kood Beach Resort website">
    <input type="hidden" name="room" value="">
    <input type="hidden" name="room_label" value="Not sure yet">
    <!-- Web3Forms' honeypot: real people never see it, bots fill it in. -->
    <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">

    <p class="form__chosen" data-chosen aria-live="polite">
      <span class="label">Chosen</span>
      <span data-chosen-text>Not sure yet &mdash; we will recommend a room</span>
      <a href="#rooms" class="link" data-chosen-change>change</a>
    </p>

    <div class="radios">
      <label><input type="radio" name="dates" value="fixed" checked> <span>Fixed dates</span></label>
      <label><input type="radio" name="dates" value="flexible"> <span>Flexible by 2&ndash;3 days</span></label>
    </div>

    <div class="form__row">
      <label><span class="label">Arrival</span><input type="date" name="checkin" required></label>
      <label><span class="label">Departure</span><input type="date" name="checkout" required></label>
    </div>

    <fieldset class="guests">
      <legend class="label">Guests</legend>
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

    <button type="submit" class="btn">Send enquiry <span class="arrow" aria-hidden="true">&#8594;</span></button>
  </form>
</section>

<aside class="rev">
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
