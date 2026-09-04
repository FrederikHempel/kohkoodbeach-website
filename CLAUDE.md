# Koh Kood Beach Resort — Hjemmeside (v3)

This is the **third** parallel version of the site. v1 (`KKBR Hjemmeside/`) is the
straight modernisation of the old PHP site; v2 (`KKBR Hjemmeside v2/`) applies a
conversion-research report to that same structure. v3 keeps v2's *content and
information architecture* almost entirely, and replaces the *visual and
interaction design*.

---

## Why v3 exists

v2's design was judged "very static and basic AI" — evenly-sized sections, boxed
cards, centred headings, everything on one rhythm. v3 was commissioned to move
away from that toward something dynamic and editorial, using the
**Sabor del Mar** Webflow template as the reference
(`https://webflow.com/templates/html/sabor-del-mar-hotel-website-template`).
Reference screenshots are kept in `Visual inspiration/`.

**Explicit brief:** *"it's very boutique so the brand design shouldn't match, but
if we could build the look of the website in similar fashion"* — i.e. borrow the
**layout language**, not the brand. So:

- **Borrowed** from the reference: oversized light display serif, big whitespace,
  minimal nav (logo + Book Now + Menu, no visible link bar), full-screen overlay
  menu, sand booking band under the hero with dotted-underline inputs, full-bleed
  colour sections, hairline-separated numbered lists, vertical rotated
  Previous/Next labels, asymmetric two-column editorial text.
- **Kept from Koh Kood:** the palette (charcoal / warm-white / sand / gold), the
  typefaces (Fraunces + Work Sans), the logo, the photography, and the beach
  illustration above the footer.

The one new colour is `--sage` (#7D8F6F) with `--sage-deep`. The brand's palm
green (#3E9B5C) is too saturated to carry a full-bleed section without vibrating
against photography, so it is muted for large fields only. It is not a new brand
colour — it is the existing green, desaturated for area use.

---

## Tech stack

Unchanged from v1/v2 by design: **plain HTML5, CSS3, vanilla JS. No frameworks,
no build step, no npm.** Deploys as a static folder (e.g. Netlify Drop).
`assets/` is a full self-contained copy — a static host uploads one folder.

---

## Files

| File | Notes |
|---|---|
| `index.html` | The showcase page — hero, booking band, editorial intro, two pinned-image sections, sage room slider, marquee, numbered experiences, journey, reviews |
| `accommodation.html` | All 9 room types as tabbed panels, with per-room galleries, rate tables and amenity lists |
| `getting-here.html` | 3-step journey + numbered transport options + ferry timetables |
| `about.html`, `facilities.html`, `activities.html`, `family.html`, `promotion.html`, `faq.html`, `gallery.html`, `contact.html`, `book.html` | Same content as v2, rebuilt in the v3 design system |
| `style.css` | Whole design system (~750 lines, heavily sectioned) |
| `script.js` | All behaviour |
| `Visual inspiration/` | The reference screenshots this design was built against |

---

## The interaction work (what makes it "dynamic")

All in `script.js`, all vanilla:

- **Scroll reveals** — `[data-reveal]` elements start 34px low and transparent and
  settle when they enter the viewport. Uses `IntersectionObserver`, **not** a
  scroll listener, so it stays off the main thread. Each element is
  `unobserve`d after firing (reveal once). Wrapping a group in
  `[data-reveal-group]` auto-staggers its children via `--reveal-delay`.
- **Pinned background images** — `.reveal-img` uses `background-attachment: fixed`
  so the photo sits still while content scrolls over it. This is what was asked
  for by *"you see a full background picture as you scroll further down"*.
  ⚠️ iOS Safari ignores/janks on `fixed`, so the ≤820px breakpoint deliberately
  falls back to `scroll`. Don't "fix" that back.
- **Full-screen overlay menu** — at every breakpoint, not just mobile. Links
  stagger in with JS-assigned `transition-delay`, body scroll locks, Escape closes.
- **Hero** — cross-fade carousel with a slow CSS Ken Burns scale. Pauses on
  `visibilitychange` so it doesn't burn cycles in a background tab.
- **Room slider** (`[data-rooms]`) — reads its content from hidden `[data-room]`
  divs, so adding a room is a markup change with no JS edit. Preloads the next
  image before swapping so there's no flash of empty space.
- **Marquee** — `initMarquee()` duplicates the track's innerHTML at runtime, which
  is what makes the `translateX(-50%)` keyframe loop seamlessly. If you edit the
  marquee, edit the single set of spans; the duplicate is generated.
- **Reduced motion** — `applyMotionPreference()` adds `.no-motion` to `<html>`
  when the OS asks for it, which disables reveals, marquee and Ken Burns.

## Motion system — two speeds, on purpose

`--ease` (1s+) is the **editorial** curve: hero Ken Burns, image settles, section
reveals. At a resort this size the photography *is* the product, so a slow settle
reads as considered.

`--ease-quick` with `--t-press` (130ms) / `--t-control` (200ms) / `--t-panel`
(260ms) is for anything the visitor **operates** — buttons, links, tabs,
accordions, arrows. These must answer immediately; a 400ms button feels broken no
matter how luxurious the rest of the page is. Don't unify the two.

Rules that go with it:

- Every pressable has an `:active` scale (0.96 on small controls, 0.985 on the
  wide `.btn` — a big scale on a wide button reads as a wobble).
- **All `:hover` rules are wrapped in `@media (hover: hover) and (pointer: fine)`.**
  On a touch screen a tap latches `:hover`, so a zoom or colour change sticks
  until you tap elsewhere. Add new hover rules inside a gated block.
- `:focus-visible` rings exist sitewide, in gold (white on dark bands). The form
  fields set `outline: none` for their dotted-underline look, so the ring is what
  keyboard users have — don't remove it.
- `prefers-reduced-motion` **reduces**, it doesn't kill. Opacity and colour still
  cross-fade; travel, scale, loops and the fixed-attachment parallax stop. A
  blanket `transition-duration: 0.01ms !important` was tried and removed — it
  makes every control snap, which is its own kind of harsh.

## Two CSS traps already hit here — don't reintroduce

1. **`.rooms__nav-mobile` source order.** Its default `display: none` must be
   declared *before* the `@media (max-width: 820px)` block that flips it to
   `flex`. It was originally written after, and same-specificity later rules win,
   so the mobile slider had **no** navigation at all (side arrows are hidden below
   820px). Verified fixed at 390px.
2. **Nav legibility over photography.** The logo is a mid-tone colour PNG and
   there is no light-on-dark variant (checked: both `logo.png` and
   `logo-footer.png` average the same mid olive). Over a bright hero frame it
   washes out. Solved with `.nav::before` — a gradient scrim behind the nav strip
   only, which fades out when the nav goes solid. Don't remove it, and don't
   solve it by tinting the whole hero.

---

## Content integrity (carried forward from v2)

- **Real numbers only.** 4.3/5 from 331 TripAdvisor reviews is the confirmed
  figure and appears in every page's `aggregateRating`. No Google rating exists
  for this property — don't invent one.
- **No fabricated cancellation/deposit policy.** There is no online payment; the
  FAQ says so plainly.
- **Prices in THB** with one indicative EUR/DKK/SEK/GBP note per page rather than
  ~30 conversions that would go stale.
- **Boonsiri is the recommended route**, with real details (departure times,
  1,100 THB standard / +100 VIP, ~7–8 h total) taken from
  `boonsiriferry.com/en/news/koh-kood`.
- Booking still converges on `book.html` → `mailto:`. There is no engine. Swap the
  submit handler in `initBookPage()` when one exists — and per the v2 research,
  keep any engine's script on the booking route only, not sitewide.

---

## Local preview

```bash
cd "KKBR Hjemmeside v3" && python3 -m http.server 8936
```

Note: during development a no-cache server was used, because the browser
aggressively cached `style.css`/`script.js` between edits and made changes look
like they hadn't applied. If something looks stale, hard-refresh first.

---

## Audit fixes — 20 Aug 2026

An audit of this build found the design solid but nothing connecting it to
revenue. What changed:

**Enquiry flow (the important one).** The form used to set `window.location.href`
to a `mailto:` and stop. With no mail client configured — routine on webmail and
mobile — that does *visibly nothing*, so a visitor could fill in eight fields and
get no acknowledgement either way. `showEnquirySent()` in `script.js` now replaces
the form with a confirmation panel. It deliberately does **not** say "sent" — the
draft still has to be sent from the visitor's own mail client, and it may never
have opened. It shows the composed message for manual copying and offers WhatsApp,
which always works. Keep that framing honest if you edit it.

`trackEnquiry()` fires `fbq('track','Lead')` and `gtag('event','generate_lead')`.
Both are no-ops until a pixel exists, wrapped so a tracking error can never break
the form. **On a site with no booking engine, that submit is the only measurable
conversion — do not remove it.**

**Forms.** Phone is optional (it was `required`, on a flow that replies by email).
A Country select replaced it. Arrival now has `min` = today and departure's floor
follows arrival; both used to accept dates in the past.

**Copy.** The homepage band said "Check Availability" but the form is a `GET` to
`book.html` and checks nothing — now "Enquire about these dates". A 24-hour reply
promise sits under the form and in the confirmation panel; confirm it matches what
reception can actually keep.

**Getting Here.** The Trat flight sat at position 02, naming the airline, counting
daily departures and linking out to book it — promotion, against the house rule.
It is now last, neutral, with no outbound link, and the meta description no longer
advertises it. Do not reinstate.

**Images.** All 149 rasters have a WebP twin (`assets/*.webp`); the JPEGs are kept
on disk but nothing references them — delete them before deploying if you want the
upload smaller. Homepage dropped 2531 KB → 1499 KB. Hero frames 2–5 are now
`data-bg` and load on demand instead of all five up front. Every `<img>` carries
width/height, so no layout shift. Regenerate with
`scratchpad/convert_images.py` if source images change.

⚠️ Two deliberate placeholders are live: hero slide 4 (the old file was 900×600
shown full-screen) and one gallery slot (`img50p34` has been a broken link since
v1). Both render a grey "Find suitable image" box. They are meant to be visible.

**SEO.** Canonical, Open Graph, Twitter card and favicon on all 12 pages;
`robots.txt` and `sitemap.xml` added; JSON-LD `url`/`image` are absolute now
(they were relative, which Google rejects). **`ORIGIN` is hard-coded as
`https://kohkoodbeachresorts.com` in every page** — if the site moves to a .dk
domain, find-and-replace that string across `*.html`, `robots.txt` and `sitemap.xml`.

**Accessibility.** New `--warm-gray-strong` (#6B6459) for small text: the old
`--warm-gray` measured 4.27:1 on warm-white, under the AA floor, while carrying
every form label. Now 5.41:1 on warm-white and 4.76:1 on sand.

**No-JS guard.** `[data-reveal]` is now scoped to `.js`, set by an inline script in
each `<head>` before first paint. Previously the hidden state was the default, so a
script failure left 24 homepage sections permanently invisible. Don't unscope it.

### Footer illustration — traced from the original (20 Aug 2026)

The illustration shipped in v1–v3 was a hand-simplified re-creation of a design-tool
screenshot, not the artwork itself: the palm crown was seven smooth leaves radiating
like a starburst, the parasol a fabric dome with a zigzag hem, the bungalow a plain
box. It is now traced from the original.

**Two screenshots exist** in `KKBR Hjemmeside v2/assets/Beach resort amenity icons/uploads/`.
The 14.41 one is a *plainer* render whose hut roof has no thatch ribs at all; **14.52
is the detailed artwork** and the one to trace. Don't confuse them.

**The artwork is three tones, not two** — cream ground, a mid-brown mass, and darker
linework drawn into it. Tracing at a single threshold merges the last two and silently
erases every rib, slat and trunk ring; that mistake is what made the hut read as a
plain box. So it is traced twice and rendered as two stacked CSS masks:

| file | cut-off | painted with |
|---|---|---|
| `assets/footer-illustration.svg` | ink (<400) | `--charcoal` |
| `assets/footer-illustration-lines.svg` | lines only (<115) | `--charcoal-line` |

The mass must stay exactly `--charcoal`: the illustration's ground runs straight into
`.footer`'s own background, and any difference shows as a hard seam across the page.
That is why the *lines* take the darker shade rather than the mass taking a lighter one.

Masks rather than a coloured SVG so both tones still come from the brand tokens — no
third brown enters the palette — and so one cached file serves all 12 pages instead of
being inlined into each. That swap cut the HTML from ~236 KB to 188 KB; the two masks
are 56 KB + 78 KB raw, 17 KB + 22 KB gzipped, fetched once.

The source screenshot is wider relative to its height than the 2400×560 viewBox, so the
crop is padded downward with solid ground until the aspect matches, leaving the footer
CSS untouched. Regenerate both files with `scratchpad/trace_footer.py`.

### Footer colour and the dune transition (20 Aug 2026)

Three linked changes, after the illustration itself was signed off.

**The footer is now `--footer-brown` (#4A3626), not `--charcoal`.** That is the
original artwork's own colour, restored. It was worth checking why the obvious
candidates fail, so nobody re-tries them:

| candidate | footer text | illustration vs sky | verdict |
|---|---|---|---|
| `--charcoal` #2B2926 | 7.7:1 | 13.4:1 | works, but reads as a near-black slab |
| **`--footer-brown` #4A3626** | **6.3:1** | **10.5:1** | **chosen** |
| `--sand` #EFE7DA | 1.1:1 | 1.1:1 | text unreadable *and* the dune/huts vanish |
| `--warm-gray` #7C7468 | 3.1:1 | 4.3:1 | text fails AA |

The illustration's mass and `.footer`'s background **must stay the same token**.
The dune runs straight into the footer, so any difference shows as a seam across
the full width. That is why the illustration's *linework* takes the darker shade
(`--footer-brown-line`) rather than the mass taking a lighter one.

**The hard line above the dune is gone.** A full-width charcoal band ended right
where the warm-white sky began, putting a hard horizon a few pixels above the
soft dune curve — two horizons competing. The last band on `index.html` (the
TripAdvisor quote, was `band--ink`) and on `facilities.html` (was `band--sage`)
are now plain warm-white bands, so the illustration emerges from the page with
the dune as the only horizon. Ten of twelve pages now meet the illustration with
warm-white; `accommodation.html` and `getting-here.html` still end on `band--sand`,
which is 1.14:1 against the sky — no visible line. **Don't put a coloured band
last on a page** without checking how it meets the dune.

**Masks are bled 1px** (`calc(100% + 2px)`). The traced contour stops ~0.2px short
of the viewBox edge and that sliver let the sky through as a hairline exactly where
the dune meets the footer — reintroducing the seam the redesign removed.

**Logo stretch fixed.** `.footer__logo img` set `height: 52px` with no `width`.
Harmless until the layout-shift pass added `width="317" height="77"` attributes,
after which the width stayed at 317px and the logo rendered 6.10:1 instead of its
natural 4.12:1. It now sets `width: auto`. This was the only rule in the stylesheet
setting one axis on an `<img>` — if you add another, set both or set the other to
`auto`.

### Hero carousel — new photography (20 Aug 2026)

Frederik added `assets/hero-carousel/New/`. What came in and what was done:

| file | verdict |
|---|---|
| `IMG_0293.jpeg` 4032×3024 | **used — now hero-1.** Turquoise bay, headland, kayakers. Bright, high-res, and the water colour is the actual product. 16:9 crop taken from the vertical centre; the dark pavilion roof lands bottom-left under the headline, which helps legibility. |
| `Hero .jpeg` 4032×2268 | not used. Golden-hour beach volleyball. Real resolution, but the figures are backlit and dim, and it duplicates hero-2's people-on-the-beach theme. Offered as an optional upgrade for hero-2. |
| `By night.jpeg` 4032×2268 | not used. Lovely dusk shot, but it breaks the standing "no dark/murky heroes" rule and hero-5 already covers evening-with-garden-lights. |
| `162 …pool….mp4` 75 MB | not used. A video hero is a separate decision and this needs transcoding first. |
| `img_9p8136.*` | already in the room library, not hero material. |

**The hero-4 placeholder is gone.** The former hero-1 (the DJI_0227 aerial) moved
down to slide 4, so both good full-resolution frames are in use. The
`.hero__slide--placeholder` CSS was deleted with it; the gallery placeholder
(`.gal-item--placeholder`) stays, since that slot is still genuinely empty.

**Don't lighten `.hero::after`.** The scrim (0.42 → 0.12 at 38% → 0.62) mutes
hero-1's turquoise, which is tempting to fix. It was measured: as it stands only
**4.1%** of the headline area falls below 3:1 contrast. A modest lightening
(0.38 → 0.10 at 50% → 0.56) pushes that to **30.5%** — a third of the headline
becomes hard to read. The muting is the price of a legible headline.

**Two of five slides are still dark** — hero-3 (sunset silhouette) and hero-5
(blue hour). That sits against the no-dark-heroes rule and is worth a decision;
they were inherited from v1, not chosen here.

### Accommodation rebuilt around three room styles (20 Aug 2026)

The page tabbed between **nine** "room types" — Bali House four times, Thai Twin
three, Bali Deluxe once, plus a Sunset House. There are three bungalow styles;
the rest were *views* at different prices, which is why the tab bar read as four
identical "Bali House" buttons.

**One section per style now, views as rate rows inside it.** No tabs: with three
items the machinery cost more than it saved, and it hid two thirds of the page
from both visitors and crawlers. An at-a-glance table at the top compares size,
layout, occupancy, terrace, breakfast and starting price across all three, with
each column heading linking down to its section.

**Every view links straight to its own enquiry** — `book.html?room=<id>` on the
rate row, so the price you are reading is the room that arrives preselected. All
eight ids still match options in `book.html`; check that if you touch either.

**Sunset House is gone site-wide** — it is not bookable. Removed from this page,
the `book.html` dropdown, the homepage room slider, the `about.html` tiles, and
the `promotion.html` copy that claimed the discount applied to it. Nothing else
referenced it.

The homepage slider's `data-image` attributes still pointed at the original
JPEGs; the WebP pass only rewrote `src=` and `background-image`. Fixed here.

**Contrast: three shared tokens were under AA, site-wide.** Found while checking
this page, fixed across the stylesheet:

| token | was | now | why it mattered |
|---|---|---|---|
| `--ink-muted` | 0.62 alpha → 4.14:1 | **0.68 → 4.92:1** | `p { color }` — every paragraph on the site |
| `--warm-gray` | 4.27:1 | replaced by `--warm-gray-strong` in 6 small-text rules | table headers, `.data-list dt`, gallery tabs, `.label__hint` |
| `--gold-dark` as text | 3.94:1 | new **`--gold-text` #8A5C24 → 5.35:1** | the "Recommended" badge, rate-row hover, quote mark |

`--ink-muted` at 0.68 is the lowest step clearing 4.5:1 on **both** warm-white
and sand — rates tables sit on sand for Bali Deluxe, so both grounds matter.
`--warm-gray` is now used for nothing; keep text on `--warm-gray-strong`.

**Do not put a kicker above a heading here.** The old panels set `Bali House` as
an eyebrow over `Garden View`; the headings now carry themselves. The `.page-hero`
label+h1 pattern is left alone deliberately — it is the incumbent system on all
12 pages, and changing it on one would break the set.

Rebuild the page with `scratchpad/build_rooms.py`, which holds the rates,
amenities and occupancy as data. Nothing on the page is invented — all copy is
carried over from the old panels.

### Rooms rebuilt as a sales page (25 Aug 2026)

The catalogue version was accurate and unpersuasive: facts first, photographs
last and small, price as a spreadsheet. Three moves carry the redesign.

**Each house leads with the one thing that makes it itself** — the open-air
bathroom, the second bedroom, the jacuzzi — not with its square metres. The hook
is set at display scale because it does the work the photograph cannot. Specs
moved below the pitch.

**The view is the purchase decision.** Garden, Partial Sea and Sea are the same
bungalow at different prices, so the rate rows became priced choices, each
linking straight to `book.html?room=<id>` — the price you are reading is the room
that arrives preselected.

**The seasonal grid moved into a `<details>`.** Real information a guest needs,
but reference rather than persuasion, and it was drowning the page. Native
element, so it works with no JS and is keyboard accessible.

⚠️ **The photography cannot show what the sea-view premium buys.** Every terrace
shot across all three houses looks alike and none has visible sea, so four tiles
labelled Garden / Partial Sea / Sea read as the same photo four times and quietly
damage credibility. The captions therefore carry the difference in words —
"Set back among the palms", "Angled towards the water", "The front row, facing
the sea" — describing *position*, never implying the picture proves it. **Do not
re-caption these as if the images differ.** The real fix is a photographer.

**Resolution governs the layout.** Only 13 of 65 room photos are ≥1200px wide and
the Thai Twin House has none — every frame of it is 750×500. Images are framed at
editorial scale rather than run full-bleed, which would ship visibly soft. Keep
displayed widths near source width; the spread sits at ~630px and view tiles at
~305px for that reason.

**Two more sitewide contrast fixes**, found here:

| what | was | now |
|---|---|---|
| keyboard focus ring | `--gold` 2.7:1 on warm-white, 2.38:1 on sand | `--gold-dark` 3.94:1 / 3.47:1 |
| form + booking-band rings | same | same |

A focus indicator needs 3:1 against its background (WCAG 1.4.11), and the gold
ring failed on every page. Contrast on this page: 0 failures across 150 elements.

Still open: footer link tap targets are 17px tall, under the 24px WCAG 2.2 asks
for. Sitewide, pre-existing, left alone rather than churn the footer mid-redesign.

Rebuild with `scratchpad/build_rooms2.py`, which holds the copy, rates and photo
choices as data. Restore `/tmp/acc.before.html` first if re-running — the script
splices into the catalogue-era markup.

### Rooms, third pass — compact, quick access, honest views (25 Aug 2026)

**The per-view photographs are gone, and they must not come back.** The photo
library has **13 sets of byte-identical files copied across view folders** — a
frame sitting in `sea-view/` is not evidence of a sea view. Two of them really
did appear on the page under different prices (`img_6p2997` = `img_5p1851`, and
`img_4p814` = `img_6p3261`). Views are now named and described in words —
"Set back among the palms", "Angled towards the water", "The front row, facing
the sea" — which is the only honest option until someone photographs the actual
outlooks. `build_rooms3.py` **asserts no two images on the page are byte-identical**
and fails the build if they are; leave that assertion in.

**The seasonal rate grid is gone.** It was a static price comparison that read as
a spreadsheet. Each view keeps a single "from" price and the page says the exact
rate is confirmed on enquiry, which is how this resort actually books.

**Reviews appear as reviews** — stars, paraphrased text, name, date, TripAdvisor
link — not folded into the resort's descriptive voice. They stay **paraphrased**
on purpose: reproducing TripAdvisor text verbatim on a commercial site risks both
copyright and platform terms. Do not "improve" them into direct quotes.

**Quick access.** Three cards above the fold jump to each style, and a sticky bar
keeps all three reachable from anywhere on the page.

Two bugs found and fixed while building this:

**Fragment links did not land.** Opening `accommodation.html#bali-house` left the
visitor at the top of the page — the browser resolves the fragment while the
document is still growing (lazy images, web font), so its offset is stale by the
time layout settles, and `scroll-behavior: smooth` turns the attempt into an
animation that ends in the wrong place. **The homepage room slider links this
way**, so it was breaking the main path from the homepage into a room.
`initHashLanding()` re-lands after `load`.

**The sticky bar hid under the fixed nav.** `.nav` is `position: fixed`, so a bar
at `top: 0` sits behind it. `publishNavHeight()` measures the nav and publishes
`--nav-h`; the bar and `scroll-margin-top` both key off it. The nav's padding is a
clamp, so it must be measured, not hard-coded.

`initRoomNav()` deliberately reads scroll position on rAF rather than using
IntersectionObserver, against the convention in the rest of this file. These
sections are taller than the viewport, so their intersection ratio never reaches
a useful threshold, and jumping to an anchor skips the crossing entirely — the
highlight then sticks on whichever section it last saw. The comment in the
function explains this; do not "fix" it back to IO.

Contrast on the page: 0 failures across 124 elements. Detector clean.

### Rooms, fourth pass — slider, sharper hero (3 Sep 2026)

Built against `Visual inspiration/New/3 room presentation.png`.

**The three cards and the sticky bar are both gone**, replaced by one full-bleed
slider: tab labels over the photograph, centred headline, one line, and a CTA
into that room's section. The tabs *are* the navigation, so the three names
appear once instead of twice.

**It advances every 4.5s, not the 3s sketched.** A headline plus a sentence needs
about four seconds to read; a slide that leaves before the reader finishes reads
as a fault rather than as pace. It pauses on hover and on keyboard focus, and does
not auto-advance at all under `prefers-reduced-motion`.

Pause is held as **state**, not by call order — `holds = {hover, focus, hidden}`.
An earlier version called `stop()`/`play()` directly and a stray `visibilitychange`
restarted the slider while the pointer was still resting on it, yanking the
sentence away mid-read. Whichever event fires last must not win.

**The page hero was 750×500 stretched full-bleed** — a 3.8× upscale, which is the
pixelation that was reported. Re-exported from the 2364px original in v2 as
`assets/rooms/rooms-hero.webp` (1800×1013, 353 KB), now 1.25× at 1440.

**"Three bungalow styles" is centred.**

**Bali House no longer leads on the bathroom.** Its hook is "Charming Bali style,
with a terrace of your own"; the open-air bathroom stays in the body copy.

**The quick essentials said "One double room", which was wrong** — a Bali House is
king *or* twin. The row is now Size / Beds / Sleeps, and Beds reads "King or twin".

⚠️ **The Thai Twin slide is soft and cannot be fixed from stock.** There is no
photograph of the Thai Twin House above 750×500 anywhere in this project — not in
v3, v2, `Nye billeder` or `For SoMe`. Every high-resolution room frame is a Bali
House or Bali Deluxe. Run full-bleed it is a ~2× upscale. The only fix is a
photographer; it is the same root cause as the header pixelation.

Slider and section deliberately use **different frames** of the same house, so the
visitor sees more of it — and the build's byte-identical assertion enforces it.

Contrast outside the photographs: 0 failures across 104 elements. Detector clean.

### Rooms, fifth pass — countdown slider, cards that unfold (3 Sep 2026)

Order: hero · centred intro · slider · review (Gina B) · three cards side by side
· the unfolding detail · good to know · review (Diveguy70).

**The long stacked room sections are gone.** Everything past "See more" lives in
one shared panel below the card row, so opening a second room swaps the contents
instead of stacking another open block. "Good to know" sits under the row and is
pushed down by exactly the panel's height.

**The countdown line.** The active tab's rule is `--gold` and a white overlay
sweeps it right-to-left over the slide's life, so the label itself shows how long
is left. Duration lives in `--rs-dur` on `.rs` and **script.js reads that property**
— one number drives both the CSS animation and the JS timer, so they cannot drift.
Set to 3s as asked. The line pauses with the slider (`.rs.is-held`).
The animation is restarted by replacing the `.rs__prog` node on each change;
re-selecting the same tab would otherwise leave a finished animation in place.

**Two techniques were tried and rejected, with evidence — do not reinstate:**

`grid-template-rows: 0fr -> 1fr` for the unfold. Tidier, no measuring, but **this
engine does not interpolate fr units** — measured at 50ms it was already at full
height. The panel now measures and animates `height` in pixels, which does
animate. That is why `layout-transition=height` is an accepted finding in
`.impeccable/config.json` rather than a defect.

`requestAnimationFrame` to flush before adding the open class. **A throttled or
backgrounded tab never runs the callback**, and the panel then never opened at
all. It is now a synchronous `void region.offsetHeight` read.

`transitionend` also has a **700ms timeout fallback** (`afterHeight()`): it does
not fire when the value did not change, and the panel would otherwise be left
frozen at a pixel height or stuck open in the accessibility tree.

**The page hero was 750×500 stretched full-bleed** (3.8× upscale — the reported
pixelation). Re-exported from the 2364px original in v2 as `assets/rooms/rooms-hero.webp`.

⚠️ **Thai Twin photography, again.** Searched v3, v2, `Nye billeder`, `For SoMe`,
`KKBR Meta Ads` and every video: **nothing above 750×500 exists.** The slide uses
`img_4p814@1600.webp` — a Lanczos upscale with a light unsharp mask, which hands
the browser a picture at display size instead of letting it scale 2× with a
cheaper filter. It adds no detail; only a photographer fixes this.

**Verification limit worth knowing:** CSS transitions do not advance in the
preview pane — verified directly (with the transition suppressed a height applies
correctly; with it active the computed value never moves). Final states of the
unfold are verified; the motion itself is not, and cannot be from here.

### Staging deploy on kohkoodbeach.com, noindex (3 Sep 2026)

Frederik bought `kohkoodbeach.com` (One.com registrar) to preview this build
without competing with the existing site in search. `ORIGIN` is now
`https://kohkoodbeach.com` everywhere it was hard-coded (12 pages, robots.txt,
sitemap.xml — was `kohkoodbeachresorts.com`).

**This domain is deliberately not indexable.** Every page carries
`<meta name="robots" content="noindex, nofollow">` and `robots.txt` is
`Disallow: /`. Both together, belt-and-braces: a crawler that ignores the meta
tag still can't fetch the page, and one that ignores robots.txt still sees the
meta tag. **When this becomes the real production domain**, both need
reverting — drop the meta tag from all 12 pages, restore `robots.txt` to
`Allow: /` with the `Sitemap:` line pointing at `sitemap.xml`, and only then
submit it in Search Console. Don't flip one without the other.

Hosting is GitHub Pages from a public repo (`kohkoodbeach-website`, pushed from
this folder) — Frederik's GitHub account is Free tier, which requires a public
repo for Pages. That's fine here: there is no server logic or secret to leak,
booking still goes through `book.html`'s `mailto:`, so a public repo exposes
nothing a view-source on the live site wouldn't already show.

`.gitignore` excludes `Visual inspiration/` (reference only) and the 152 unused
JPEG/PNG originals + the unused 72 MB hero video — everything the pages load is
already `.webp`, per the note under "Images" above. Repo is 22 MB, not 167 MB.
Three raster exceptions stay tracked because pages reference them directly:
`assets/og-image.jpg`, `assets/logo/apple-touch-icon.png` (favicon is `.svg`,
already untouched by the excludes).

A `CNAME` file at the repo root (containing `kohkoodbeach.com`) is what GitHub
Pages needs for the custom domain; DNS at One.com points the apex at GitHub's
four Pages IPs (185.199.108/109/110/111.153) via A records.

### Cookie consent, GDPR groundwork (3 Sep 2026)

Frederik asked to have the Meta Pixel set up so he could "kode det ind, så det
overholder GDPR" — coded so it complies with GDPR. Worth being precise about
what that request can and can't mean: **this is a solid technical
implementation, not a legal certification.** No amount of code can certify
compliance on its own — that's a legal judgment, and the previous site used a
paid consent tool (Cookiebot-style) specifically because those also provide
ongoing auto-scanning (catching new trackers as the site changes) and
lawyer-reviewed policy text, neither of which this static build can replicate
on its own. If KKBR runs paid EU-facing campaigns off this domain, a real
legal review (or reinstating a paid CMP) is still worth doing before treating
this as final — this closes the concrete gaps found in the existing code, not
every gap that could exist.

**What was actually missing before this pass**, found by testing what the
banner already claimed: it promised a "privacy note" that didn't exist
(linked to `contact.html`, which had no privacy content at all — a dead
promise); there was no way to change your mind once you dismissed it; and
`kkbr_consent` was a bare string with no expiry, so a "yes" would be treated
as valid forever.

**Fixed:**
- `contact.html#privacy` is now a real section — what's stored (the consent
  choice itself, exempt as strictly necessary), what's marketing-only
  (Meta Pixel, `_fbp`, shared with Meta Platforms Ireland Limited), and that
  nothing else is tracked. Keep this section honest as tracking changes —
  it's a factual claim about what the site does, not boilerplate.
- `[data-cookie-settings]` — a "Cookie settings" link in the footer of all 12
  pages — reopens the banner via `showConsentBar()`, so withdrawal is exactly
  as easy as giving consent was (a GDPR requirement, not a nicety).
- Consent is `{value, ts}` JSON, not a bare string, and `readConsent()` treats
  anything older than `CONSENT_MAX_AGE_DAYS` (365) as absent — re-prompts
  rather than assuming a year-old yes still holds.

**Only one non-essential category exists (marketing/Meta), so the banner
stays binary Accept/Decline.** If GA4 or another analytics tool is ever
added, split it into its own checkbox rather than bundling it under the same
Accept — GDPR wants purpose-specific consent, and "analytics" and
"advertising" are different purposes even though both are "not essential."
Don't fold a second tracker into this binary without doing that.

### Rooms, sixth pass — the slider is the hero now (3 Sep 2026)

Frederik's read on the page-hero was blunt and correct: boring, type too big
and clunky, and the photo didn't work. Worth recording exactly why, because
the fix wasn't "pick a nicer photo."

**The page-hero background was `img_d03y201734.webp` — 750x500 — shown up to
700px tall.** A 3-4x upscale, hence the softness. But a proper replacement
already existed on disk and unused: `assets/rooms/rooms-hero.webp`,
1800x1013, sharp, well-composed — made during an earlier pass, then silently
dropped when a later rebuild script regenerated the page-hero markup. So the
image half of the complaint had a five-minute fix sitting right there.

**Fixing the photo wouldn't have fixed the actual problem, which is pacing.**
The page opened with one showcase photo (generic "arrival" mood), then
immediately the room slider — three more showcase photos, each with its own
headline. Two similar beats back to back, and Frederik's own words drew the
line precisely: the slider "virker virkelig godt", the header "kedelig,
klodset". That's not a resolution problem, it's a craft-level gap between two
elements doing adjacent jobs. Polishing the weaker one has a lower ceiling
than promoting the one that already works.

**So `.page-hero` is gone from this page and `.rs` (the slider) is now the
first section — the page's actual hero.** It was already sized close to one
(`clamp(460px, 74vh, 760px)`, against `.page-hero`'s `62vh`), so this is a
promotion, not a rebuild:

- `.rs__stage` is now `100svh; min-height: 620px` — the same formula as
  `.hero` on the homepage, since it now plays the same role.
- A small `.rs__kicker` ("Accommodation") gives the page an identity anchor
  that a bare tab row didn't carry on its own — the thing `.page-hero`'s
  label used to do. An `<h1>Room Collection</h1>` still exists for SEO/a11y,
  now `.visually-hidden` rather than a visible headline competing with the
  per-room `.rs__h` headlines underneath the tabs.
- `initNav()`'s hero selector gained `.rs` (`'.hero, .page-hero, .rs'`) so
  the fixed nav goes transparent-over-photo here too, exactly as it does on
  every other page's opener.
- The intro paragraph ("Three bungalow styles...") moved from *before* the
  slider to *after* it — now the calm settle-beat right after the big visual
  opener, which is the order that pattern normally runs in.

⚠️ **`.rs__tabs` and the new `.rs__kicker` position off `--nav-h`, not a flat
vh guess — this is the bug this promotion actually exposed.** The tabs used
to sit at `top: clamp(26px, 5vh, 54px)`, which is *inside* the fixed nav's
own ~70px height on every breakpoint. That was invisible before because the
slider sat well below the nav's transparent phase, scrolled past it. Making
`.rs` the very first section put the tabs directly under the nav for the
first time, and stacked mobile layout (logo/tabs/kicker all sharing the same
left edge) made the overlap a literal text collision — caught in a mobile
screenshot, not by the detector. Both offsets are now
`calc(var(--nav-h, 70px) + clamp(...))`. Any future absolutely-positioned
element inside `.rs` needs the same treatment, not a raw vh clamp.

**The crossfade is slower and drifts, matching the homepage hero's language
instead of its own flat 900ms cut.** `.rs__slide` opacity transition went
from 900ms to 1.6s, and `.rs__shot img` now carries the same slow Ken Burns
scale the homepage hero uses (`scale(1.05) → scale(1)` over 6s linear,
restarting whenever a slide regains `.is-on`). Both are gated by
`.no-motion` the same way the homepage hero is. This was the direct answer to
"the transition between categories should be smoother" — a crossfade alone
was never going to read as smooth at 900ms; the homepage's 1.8s/7s pairing is
why that one already did.

`accommodation.html`'s JSON-LD `image` now points at `rooms-hero.webp`
instead of the 750x500 original, since that's the page's real representative
photo now. `img_d03y201734.webp` is still used as a small thumbnail on
`index.html` and `family.html` — leave those, only this page's use of it as
a full-bleed background was the problem.

### Homepage, first pass (4 Sep 2026)

Going page by page per Frederik's request, starting with `index.html`. Six
changes, agreed after a critique round — worth recording the two where the
brief and the site's own standing rules pulled in different directions.

**Hero tagline changed to "Stay closer to nature".** Flagged before making
this change: "Sense of true happiness" is baked into the logo file itself,
not just page copy, so the hero and the logo now say two different things.
Frederik's call, made knowingly — not an oversight. `.hero h1` also got its
own scoped font-size (`clamp(2.6rem, 7.6vw, 6.6rem)`, down from the shared
`h1`'s `clamp(2.9rem, 9vw, 8rem)`) rather than touching the sitewide rule,
which every page's `<h1>` draws from.

**The snorkelling photo is a genuine judgement call, overruled on purpose.**
Flagged that `img_victoria_snorkel.webp` (an Unsplash download) reads to me
as wetsuited scuba gear, not snorkelling — Frederik's read, with more context
than I have, is that it's swimmers/snorkellers and less stock-looking than
what was there before. Went with his call. It's now row 02 on the homepage
Experiences list. **Row 05, "Scuba Diving", is new** — reuses
`assets/activities/5_79_img_d07y201791.webp`, already live on `activities.html`
for the same activity. Its copy, and `activities.html`'s existing copy, both
now mention the Open Water certification available in the resort's own pool
— a real detail Frederik gave me, not previously written anywhere.

**New "Book reminder" band**, between the Journey section and the Gina
review (which stays untouched, per instruction). Copy was steered away from
the brief's own example ("Enquire now to ensure your private bungalow") —
"ensure" implies scarcity, which is the exact framing this project has
rejected before (see the rooms-page passes above: no "only 19 rooms," this
audience is inoculated against it). Landed on "Ready to book your stay? /
Tell us your dates, and we'll take it from there." instead. Reuses
`assets/rooms/rooms-hero.webp` as the background (already vetted sharp,
unused elsewhere on this page) rather than sourcing a new photo.

New `.cta-band` in style.css puts a **warm-white-filled `.btn`** on the photo,
not the standard charcoal fill — charcoal on this band's scrim
(`rgba(28,26,24,...)`, close to the scrim's own tone) would barely register.
Every other on-photo CTA in this project solves the same problem the same
way (`.rs__cta`, `.footer__social a:hover`): invert to light-on-dark, don't
reach for a new brand colour.

⚠️ **Deferred, deliberately: the "Getting Here" band.** Frederik wants the
photo-locked, scroll-driven route animation (NIHI Sumba reference — bus from
Bangkok to Laem Sok pier, then a ferry icon to Koh Kood, drawn over
`assets/hero-carousel/hero-4.webp`, the resort's own drone shot). Worth
recording why this didn't happen in the same pass as everything else here:
it's a real interactive build (an illustrated SVG route, not a live map — the
NIHI reference itself is a hand-drawn island outline, not real map data;
scroll-pinning logic; a simpler non-locked fallback for mobile, confirmed
explicitly rather than assumed), not a copy or asset swap. Frederik agreed
it should be its own session. The homepage's existing Journey section
(bus/ferry/pickup, three steps) is untouched for now, and still ends in a CTA
to `getting-here.html` — that full page redesign is separately deferred too.
