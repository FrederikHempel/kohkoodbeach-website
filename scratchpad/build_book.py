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
gh = (ROOT / 'getting-here.html').read_text(encoding='utf-8')

# The transport overlay's content comes from getting-here.html's own numbered
# rows — same times, same fares, one place to edit them.
def _route(n):
    m = re.search(r'<span class="numbered__no">0%d\.</span>\s*<div class="numbered__body">(.*?)</div>\s*</div>' % n, gh, re.S)
    b = m.group(1)
    head = re.sub(r'<span[^>]*>.*?</span>', '', re.search(r'<h3>(.*?)</h3>', b, re.S).group(1), flags=re.S).strip()
    lead = ' '.join(re.sub('<[^>]+>', '', re.findall(r'<p[^>]*>(.*?)</p>', b, re.S)[0]).split())
    rows = re.findall(r'<dt>(.*?)</dt><dd>(.*?)</dd>', b)
    return head, lead, rows
ROUTES = [_route(1), _route(2)]

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

# The card face — photo, one line, the Size/Beds/Sleeps facts — is the same
# component accommodation.html uses. Read from there so the two cannot drift.
cats = {}
for _m in re.finditer(r'<article class="cat" id="([a-z-]+)">(.*?)</article>', acc, re.S):
    _k, _b = _m.group(1), _m.group(2)
    cats[_k] = {
        'img': re.search(r'<img src="([^"]+)"[^>]*width="(\d+)" height="(\d+)"', _b).groups(),
        'line': re.search(r'<p class="cat__line">(.*?)</p>', _b, re.S).group(1).strip(),
        'facts': re.findall(r'<dt>(.*?)</dt><dd>(.*?)</dd>', _b),
    }


# ---- the transport overlay ----
def transport_dialog():
    blocks = []
    for head, lead, rows in ROUTES:
        dl = ''.join(f'<div><dt>{d}</dt><dd>{dd}</dd></div>' for d, dd in rows)
        blocks.append(f'''      <section class="tinfo">
        <h3 class="tinfo__h">{head}</h3>
        <p class="tinfo__lead">{lead}</p>
        <dl class="data-list">{dl}</dl>
      </section>''')
    body = '\n'.join(blocks)
    return f'''<dialog class="rdlg" id="tdlg-transport" aria-labelledby="tdlg-transport-h">
  <div class="rdlg__bar">
    <h2 class="rdlg__h" id="tdlg-transport-h">Getting here from Bangkok</h2>
    <button type="button" class="rdlg__close" data-dlg-close aria-label="Close">&#10005;</button>
  </div>
  <div class="rdlg__body">
{body}
    <p class="tinfo__foot">Whichever you take, we meet you at Ao Salad pier and drive you the last stretch.
      Rates move with the season and are confirmed on enquiry; in high season the seats want about 30 days&rsquo; notice.
      The <a href="getting-here.html" class="link">full page</a> has the ferry timetable and the other routes.</p>
  </div>
</dialog>'''

def house(key):
    """The accommodation card, re-pointed: See more opens the overlay, Choose
    this room unfolds that card's views underneath the row."""
    r, c = rooms[key], cats[key]
    src, w, h = c['img']
    lowest = min(r['picks'], key=lambda p: int(p['price'].replace(',', '')))['price']
    facts = '\n'.join(f'            <div><dt>{d}</dt><dd>{dd}</dd></div>' for d, dd in c['facts'])
    views = '\n'.join(
        f'''            <label class="view">
              <input type="radio" name="room" value="{p['id']}" data-label="{NAMES[key]} &ndash; {p['name']}" data-price="{p['price']}">
              <span class="view__name">{p['name']}</span>
              <span class="view__price">from {p['price']}<span class="view__unit">THB</span></span>
            </label>''' for p in r['picks'])
    return f'''      <article class="cat" data-house="{key}">
        <div class="cat__shot"><img src="{src}" alt="{NAMES[key]}" width="{w}" height="{h}" loading="lazy"></div>
        <div class="cat__body">
          <h3 class="cat__name">{NAMES[key]}</h3>
          <p class="cat__line">{c['line']}</p>
          <dl class="cat__facts">
{facts}
          </dl>
          <p class="cat__price">from {lowest} <span class="cat__unit">THB per night</span></p>
          <div class="cat__actions">
            <button type="button" class="cat__more" data-dlg-open="rdlg-{key}">See more</button>
            <button type="button" class="cat__book" data-house-open="{key}" aria-expanded="false" aria-controls="views-{key}">Choose this room</button>
          </div>
          <div class="cat__views" id="views-{key}" data-house-views hidden>
            <div class="cat__views-inner" role="radiogroup" aria-label="{NAMES[key]} &mdash; which view?">
{views}
            </div>
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
     One <form>, three steps, in the order the visitor decides: when → which
     room → who you are. Each finished step collapses to a line stating what it
     holds, with Change to reopen; the next opens in its place. No sticky bar —
     the steps say what they carry, where they are.
     ⚠️ The houses and their overlays are GENERATED from accommodation.html by
     scratchpad/build_book.py — edit the rooms there. -->
<form class="enq" data-book-form data-endpoint="https://api.web3forms.com/submit">
  <!-- ⚠️ The Web3Forms access key. With it present the form POSTs for real;
       blank it out and the submit handler falls back to the mailto draft.
       ⚠️ SAME key as contact.html, on purpose. There is ONE form in the
       Web3Forms account ("Booking form", recipient frja91@outlook.com), and a
       key identifies the destination, not the markup — several forms may post
       to it. Both pages therefore share this key, and the `subject` field is
       what tells a booking enquiry from a contact message in the inbox.
       Repoint the recipient to reservation@kohkoodbeachresorts.com in the
       dashboard before the site takes real bookings; the key does not change.
       The key is public by design — it only permits sending TO that mailbox. -->
  <input type="hidden" name="access_key" value="c5260114-8255-4e7d-8b9c-0e7c568001ce">
  <input type="hidden" name="subject" value="Booking enquiry — Koh Kood Beach Resort">
  <input type="hidden" name="from_name" value="Koh Kood Beach Resort website">
  <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">

  <!-- Short on purpose: the video sets the scene, step 1 has to be reachable
       without hunting for it. initBookHero() attaches the source only on a wide
       screen, without prefers-reduced-motion and not on save-data; everyone
       else keeps the poster, which is the clip's own first frame. -->
  <!-- The dates live in the hero, on the site's own sand booking strip. The
       visitor clicked "Book now"; the first thing they should meet is a date
       field, not a heading about one. -->
  <section class="bhero">
    <video class="bhero__video" muted playsinline loop preload="none"
           poster="assets/book-hero-poster.webp" data-src="assets/book-hero.mp4" aria-hidden="true"></video>
    <div class="bhero__copy">
      <h1>When will you arrive?</h1>
      <p class="bhero__sub">No payment now &mdash; we reply within 24 hours, usually the same day.</p>
    </div>
    <div class="bhero__strip">
      <label class="field"><span class="label">Arrival</span><input type="date" name="checkin" required></label>
      <label class="field"><span class="label">Departure</span><input type="date" name="checkout" required></label>
      <label class="field"><span class="label">Adults <span class="label__hint">13+</span></span><input type="number" name="adults" min="1" max="12" value="2" required inputmode="numeric"></label>
      <label class="field"><span class="label">Children <span class="label__hint">2&ndash;12</span></span><input type="number" name="children" min="0" max="10" value="0" inputmode="numeric"></label>
      <button type="button" class="btn" data-step-next="room">Choose your room <span class="arrow" aria-hidden="true">&#8594;</span></button>
    </div>
    <p class="bhero__err" data-step-err hidden role="alert"></p>
  </section>

  <ol class="flow wrap">
    <li class="step is-open" data-step="room">
      <h2 class="step__h">
        <button type="button" class="step__toggle" data-step-toggle="room" aria-expanded="true" aria-controls="body-room">
          <span class="step__title">Your room</span>
          <span class="step__sum" data-step-sum hidden></span>
          <span class="step__chev" aria-hidden="true"></span>
        </button>
      </h2>
      <div class="step__body" id="body-room" data-step-body>
        <div class="step__inner">
          <div class="cats__grid">
{houses}
          </div>
          <label class="view view--any">
            <input type="radio" name="room" value="" data-label="Not sure yet &mdash; happy to be recommended a room" checked>
            <span class="view__name">Not sure yet &mdash; recommend one for us</span>
          </label>
        </div>
      </div>
    </li>

    <li class="step" data-step="you">
      <h2 class="step__h">
        <button type="button" class="step__toggle" data-step-toggle="you" aria-expanded="false" aria-controls="body-you">
          <span class="step__title">Tell us about you</span>
          <span class="step__sum" data-step-sum hidden></span>
          <span class="step__chev" aria-hidden="true"></span>
        </button>
      </h2>
      <div class="step__body" id="body-you" data-step-body>
        <div class="step__inner form">
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
          <div class="radios" role="radiogroup" aria-label="Are your dates fixed?">
            <label><input type="radio" name="dates" value="fixed" checked> <span>Fixed dates</span></label>
            <label><input type="radio" name="dates" value="flexible"> <span>Flexible by 2&ndash;3 days</span></label>
          </div>
          <!-- The resort really does arrange both routes — see getting-here.html,
               where the times, fares and the 30-day lead time already live. This
               only asks whether to quote them; it does not repeat the prices,
               which move with the season. -->
          <div class="offer">
            <label class="offer__ask">
              <input type="checkbox" name="transfer" value="yes" data-transfer>
              <span class="offer__ask-text">I&rsquo;d like an offer for transport from Bangkok</span>
            </label>
            <div class="offer__opts" data-transfer-opts hidden>
              <div class="offer__opts-inner" role="radiogroup" aria-label="Which route?">
                <p class="offer__hint">Both end the same way &mdash; we meet you at Ao Salad pier and drive you the last stretch. In high season the seats want about 30 days&rsquo; notice. <button type="button" class="link" data-dlg-open="tdlg-transport">Times and fares</button>.</p>
                <label class="offer__opt">
                  <input type="radio" name="transfer_route" value="bus-ferry">
                  <span class="offer__opt-name">Boonsiri bus + ferry</span>
                  <span class="offer__opt-note">One ticket from Bangkok. Roughly 7&ndash;8 hours door to door.</span>
                </label>
                <label class="offer__opt">
                  <input type="radio" name="transfer_route" value="minivan-ferry">
                  <span class="offer__opt-name">Private minivan + ferry</span>
                  <span class="offer__opt-note">Collected from your Bangkok hotel, then the same crossing.</span>
                </label>
                <label class="offer__opt">
                  <input type="radio" name="transfer_route" value="either">
                  <span class="offer__opt-name">Not sure &mdash; recommend one</span>
                  <span class="offer__opt-note">Tell us your arrival time and we will suggest the simpler of the two.</span>
                </label>
              </div>
            </div>
          </div>
          <label><span class="label">Anything else we should know?</span><textarea name="message" rows="4"></textarea></label>
          <div class="step__send">
            <button type="submit" class="btn">Send enquiry <span class="arrow" aria-hidden="true">&#8594;</span></button>
            <p class="step__note">No payment now. We reply by email within 24 hours, usually the same day
              &mdash; or <a href="https://wa.me/66819088966?text=Hi%21%20I%27d%20like%20to%20ask%20about%20staying%20at%20Koh%20Kood%20Beach%20Resort." target="_blank" rel="noopener" class="link">message us on WhatsApp</a>.</p>
          </div>
        </div>
      </div>
    </li>
  </ol>
</form>

<!-- Warm-white on purpose: the last band before the footer must match the
     footer illustration's sky. scratchpad/check_last_band.py refuses the
     commit otherwise, and also checks the .rev--light rule still exists. -->
<aside class="rev rev--light">
  <div class="wrap-narrow rev__inner">
    <span class="rev__stars" role="img" aria-label="5 out of 5"><span aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span></span>
    <p class="rev__text">A guest who came in November called it one of the best weeks of her travels around Thailand.</p>
    <p class="rev__by">Gina B <span>&middot;</span> November 2025 <span>&middot;</span>
      <a href="https://www.tripadvisor.com/Hotel_Review-g1152744-d1103353-Reviews-Koh_Kood_Beach_Resort-Ko_Kut_Trat_Province.html" target="_blank" rel="noopener">TripAdvisor</a></p>
  </div>
</aside>

{dialogs}

{transport_dialog()}
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
