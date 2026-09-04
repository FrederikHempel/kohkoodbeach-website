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
- **Prices in THB, and no currency conversion at all.** This used to read "one
  indicative EUR/DKK/SEK/GBP note per page"; Frederik's instruction on 4 Sep 2026
  was blunter — *no static currency conversions* anywhere. A hard-coded rate is
  wrong the day after it is written, and one stale number sitting next to a real
  price costs more trust than the convenience is worth. Don't reintroduce one.
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
the dune as the only horizon.

⚠️ **The last band on every page MUST be warm-white — a hard rule, not a
judgement call.** This paragraph used to say `band--sand` was an acceptable
closer because it measures 1.14:1 against the sky. **That was wrong**, and the
error survived because contrast ratio is the wrong instrument for the question:
1.14:1 says two tones are nearly equal in *luminance*, not that the boundary
between them is invisible. Sand is warmer and pinker than the sky, and a flat
full-width edge between two close tones is exactly what the eye is best at
picking out. Frederik sent a screenshot of the seam on `getting-here.html` — a
hard line straight across the page a few hundred pixels above the dune,
competing with it as a second horizon. That page is now plain `.band`, and **all
twelve pages end warm-white.** Don't measure this one; match the sky.

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

⚠️ **`robots.txt` also carries a `facebookexternalhit` exception, and it is not
decoration.** Meta's crawlers obey robots.txt — their own crawler documentation
is explicit, and the only stated exception is security and integrity checks — so
the blanket `Disallow: /` would have made Facebook **domain verification** fail
even with a correct `facebook-domain-verification` tag in `<head>`. That failure
would have looked like a tag problem and would not have been one. The exception
does not make the site indexable: every page still carries the `noindex` meta
tag, and Meta is not a search engine. Keep the exception when you revert the
rest, or move it into the production `robots.txt`.

The verification tag itself lives in `index.html`'s `<head>` only. Meta requires
it on the home page and requires it to be **static** — a tag injected by
JavaScript is not accepted, which is why it is in the markup rather than in
`script.js` alongside the pixel.

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

**The "Getting Here" band was deferred out of this pass** and built in its own
session — see the next section. The homepage's static Journey section is gone;
that band replaced it. The `getting-here.html` page redesign is still deferred.

### The Journey band — a scroll-drawn route (4 Sep 2026)

Built to the NIHI Sumba "How to Get Here" reference in
`Visual inspiration/New/How to get here.png`: a full-bleed photograph, a
hand-drawn hairline map over it, dotted stops on hairline leaders, and a display
serif set to one side. Here the drawing is the **route**, and it draws itself as
you scroll. It **replaced** the homepage's static three-step Journey section
rather than joining it — same three steps, same copy, same CTA to
`getting-here.html`; two versions of one itinerary on one page was never the
brief. `.steps` / `.step` in the stylesheet are still live on
`getting-here.html`, so don't delete them.

**It pins with `position: sticky`; it does not lock the scroll.** The plan
recorded here said "scroll-lock only on desktop", and sticky is the honest way
to deliver that: a real lock (preventDefault on wheel and touch, then translate
the stage by hand) breaks the scrollbar, Page Down, trackpad momentum and every
assistive scroll. Sticky gets the same "photo holds still while the route draws"
effect out of the browser's own scrolling, and it degrades to a normal flowing
band the moment the sticky context is removed — which is exactly what the
un-pinning media queries do. Nothing in `initRoute()` calls `preventDefault`.

**`initRoute()` reads scroll position on rAF, against the IO convention in the
rest of `script.js`** — the second deliberate exception, after `initRoomNav()`.
IntersectionObserver answers "is it on screen"; this needs "how far through it
are we", continuously, to place a vehicle on a path. The listener is passive and
only ever schedules a frame.

**Nothing is hidden to make the animation work.** All three steps sit at full
readable contrast the whole way through; what the scroll changes is which one is
*marked* — its rule fills gold and its numeral lights. A version that faded the
inactive steps down to 38% was built and dropped: step 01 carries the Boonsiri
link, and a link at 38% opacity on a photograph is not a readable link at any
point in the scroll.

⚠️ **The photograph is blurred, and it is the only blurred photo on the site.**
`hero-4.webp` is the overhead drone frame — palm crowns, roof ridges, footpaths,
a bright turquoise bay, hundreds of small high-contrast lines. A 1.6px hairline
route laid over that reads as a scratch on the print, not as a map; the first
build did exactly that and it was the worst thing about it. NIHI gets away with
an unblurred frame because its photograph has a large soft zone behind the
drawing. This one has none, so the photo's job here is **ground, not subject**:
blurred and dimmed it still reads unmistakably as the resort from the air, and
the drawing becomes the thing you are looking at. Don't sharpen it back without
also solving what the linework is then supposed to sit on.

**Contrast was measured on the rendered composite, not estimated** — the
lightest ground pixel in each band, which is the worst case for light text:

| band | lightest ground | warm-white | body (.86) | `--gold` |
|---|---|---|---|---|
| whole stage | rgb(95,93,90) | 6.08:1 | 5.02:1 | — |
| steps row | rgb(64,61,60) | 9.97:1 | 7.86:1 | **3.68:1** |

The gold numerals and the gold marker rule are the tight ones, and they only
clear because they are large text (27–42px) and a UI component — both floors are
3:1. That is why the vertical scrim's bottom stop runs to 0.58: at the 0.48 it
started at, the numerals measured 3.41:1 with no margin. Lighten that gradient
and the numerals fail first, the hairline drawing second.

**Three things the build got wrong first and the fixes worth keeping:**

1. **The mainland had a faint land tint too, and it had to go.** The coastline is
   an *open* path, so filling it needs closing edges off the left of the frame —
   and the frame then cuts those into visible straight diagonals across the
   photo. Koh Kood is a closed shape and fills cleanly, and one tinted landmass
   is enough to make the coastline opposite it read as a shore.
2. **The route needed a dark halo.** At Laem Sok the road and the coastline meet
   at a point, and without layering they merged into one continuous squiggle
   with the pier lost in the junction. One `drop-shadow` filter on the legs,
   stops and vehicles does every crossing at once. It is deliberately *not* on
   the coast — putting it there removes the layering it exists to create.
3. ⚠️ **`.route__copy h2` is sized off the viewport's HEIGHT as well as its
   width, and it is the only heading on the site that is.** A pinned stage
   cannot grow and cannot scroll, so anything taller than its row overflows into
   the steps underneath instead of pushing them down. The site's own
   `h2` (`clamp(2.2rem, 6vw, 5rem)`) reads width only, so at **1024×640** — wide
   enough to stay pinned, short enough to have no room — it set a 3.8rem
   headline into a row with space for half that, and the CTA landed on top of
   steps 02 and 03. Caught in a screenshot at that size, not by reasoning. Any
   new element inside the pinned stage needs the same check.

**Three un-pinning thresholds, and the stylesheet and `initRoute()` must agree
on all of them** (`(min-width: 821px) and (min-height: 561px)` in JS):

- **≤820px** — the phone breakpoint. Unpinned outright rather than shortened: a
  sticky stage costs a phone 3.2 screens of scroll to deliver three sentences,
  and iOS is the platform this project has already had to stop pinning on once
  (see `.reveal-img`).
- **≤560px tall** — no arrangement fits a pinned stage that short, so it stops
  pretending and flows.
- **≤840px tall** (still pinned) — everything that takes vertical space is
  tightened rather than the pin being dropped, since that band covers most
  laptops.

In every unpinned case `settle()` paints the finished drawing, so nothing is
ever left half-drawn in a band that never pins. `prefers-reduced-motion` gets
the same: unpinned, complete, no vehicles — the travel *is* the effect here, so
there is nothing to soften, only to remove.

**Without JS the route is simply drawn, stops and all** — the dash offsets that
hide it are set by `initRoute()`, not by CSS, so a script failure leaves a
finished map rather than an empty photograph. The three vehicles are the one
exception and are hidden unconditionally in CSS: JS is what puts them on the
path, so without it they pile up at the SVG's origin as a stack of discs in the
corner. That was visible in the first no-JS render.

**The map is `aria-hidden`.** Every fact it draws is written out in
`.route__steps` beneath it, which is what a screen reader, a crawler and a
no-JS visitor get.

**The dashed crossing is revealed through a `<mask>`, not by its own dash
offset.** One `stroke-dasharray` cannot both make the dashes and animate the
draw-on. The mask holds a fat stroked copy of the same path and grows *that*,
which leaves the visible dashes intact. The two road legs animate directly.

### The map became real geography (4 Sep 2026)

The first version of the band drew a hand-invented squiggle of coastline and a
hand-drawn blob for Koh Kood. Frederik's verdict was exact: *"if you look at the
'map' it's impossible to see where in Thailand it is"*, plus a more precise
island and the resort marker actually on its beach. All three are the same root
problem — invented geometry — so the geometry is now real.

⚠️ **The coastlines are GENERATED. Do not hand-edit the long `d` attributes.**
Rebuild with `scratchpad/build_route.py`, which re-projects and re-simplifies
from source and prints a complete `<svg>` to splice into `index.html`. Its
header carries the two `curl` commands that re-fetch the source polygons; they
are not committed, because Thailand's is 1.1 MB.

| what | source | detail |
|---|---|---|
| Thailand outline | OpenStreetMap via Nominatim | 50,452 pts → **471** at 0.022° |
| Koh Kood, national scale | same island polygon | 1,069 pts → **43** |
| Koh Kood, inset | same | → **271** at 0.00045° (~0.8 drawn px) |

Projection is equirectangular with a `cos(lat)` correction, fitted to a box —
right for a country-sized illustration and two orders of magnitude simpler than
pulling in a projection library on a site with no build step.

**Every marked place is a real geocode**, not a guess: Bangkok, Laem Sok Pier
(12.0404, 102.5861), Ao Salad (11.7051, 102.5711) and the resort itself
(**11.6672, 102.5345**). Both island markers are **snapped to the nearest
coastline vertex**, which is what puts the resort dot *on* the shore rather than
near it; it moved 33 m, so the OSM node is already essentially on the coast.

⚠️ **The resort marker was first placed at Hat Bang Bao (11.6118) and that was
wrong — about 28% of the island's length too far south.** Frederik caught it
against Google Maps. Worth recording how the mistake was reasoned into, because
the reasoning looked sound: `index.html` captions its private-beach photo
"Bang Bao Bay", so the site's own copy was taken as the authority for which beach
the resort sits on, and Bang Bao was geocoded and used. **Site copy is not a
geocode.** The resort is its own OSM `hotel` node at Hat Taphao near Hin Dam
Pier, and it self-verifies: its house number is 121, matching the JSON-LD
`"streetAddress": "121 Moo 1"` on every page. Search for the property, not for
the place-name a caption mentions.

**The "Bang Bao Bay" caption is gone from `index.html`.** Asked whether the beach
really is called that, Frederik's answer was that he genuinely does not know — so
the honest move was to stop asserting it rather than to pick whichever name looked
most likely. The eyebrow over the private-beach photo now reads **"Koh Kood, west
coast"**, which the geocoding work above actually establishes. **Don't restore a
beach name here on the strength of a map label or a listing site** — only the
resort can settle what its own bay is called, and until someone there does, the
page says the part that is known.

**Two scales, because one cannot work.** At national scale Koh Kood is about six
pixels across — you can show where in Thailand it is, or you can show a coastline
worth looking at, but not both in one frame. So the island is ringed on the
national map and enlarged in an inset panel beside it, and **the crossing is
drawn as a single line that leaves the map and lands in the panel** — it is the
ferry and the connector between the two scales at once. Two hairlines from the
ring to the panel corners say which thing is enlarged; without them the ring
sits 14px below Laem Sok's dot and reads as part of that marker, because at that
scale the pier and the island really are that close.

**Thailand is outline only; only Koh Kood is tinted.** The country carried the
same faint land tint at first and a 0.07 wash over an area that size stopped
reading as a tint and started reading as a pale blob with a soft edge — the
opposite of the recognisable silhouette the country is there to provide.

**Three bugs this pass, all found by looking rather than reasoning:**

1. ⚠️ **`initRoute()` kept its drawable paths in an object keyed by
   `data-draw`, and two paths legitimately share the key `coast`** (Thailand and
   the island draw on together). The dict silently kept only the last one, so
   Thailand was left at a full dash offset and **never appeared at all**. The
   land tint underneath was the only reason its shape showed, which made it look
   like a stroke-weight problem and sent two rounds of styling in the wrong
   direction. It is a **list** now; `draw(key, t)` updates every entry with that
   key. Don't reintroduce the dict.
2. **The last leg was a bowed cubic and the bow put it in the sea** — a road
   drawn in the water off the west coast. `spine()` now walks the latitudes
   between the two stops and takes the midpoint of the island's own width at
   each, so every interior point is on land by construction.
3. **The crossing was drawn straight through the island.** Ao Salad is on the
   north-east coast, so from the mainland the boat goes *round* the north. The
   arc does that now.

⚠️ **Mobile's resort leader is angled, not horizontal.** Once the marker moved
north to its real position the two island stops sit ~50 units apart, and at
mobile's 30-unit type a straight leader ran through the middle of the label above
it. It drops 50 units before running out to the label column.

⚠️ **Mobile gets its own label set, and this is not cosmetic.** Below 820px the
1000-unit viewBox is drawn into ~350 CSS px, so the desktop labels render at
about **5px**. Simply enlarging them cannot work — they sit in two columns
positioned for 15px type, and at a legible size they collide with the maps and
run off the frame. So `.route__mlabels` carries the two labels that matter (the
mainland pair is spelled out in step 01 anyway) at 30 units — about 10.5px on a
390px phone — right-aligned to the frame, and the desktop set plus its leaders
are hidden. The positions have to live in markup: `x` on `<text>` is an SVG
attribute, not a stylable CSS property, so a media query alone could not move them.

### Getting Here rebuilt around the route map (4 Sep 2026)

Frederik's second page-by-page pass. The route band built for the homepage is now
this page's centrepiece, and the page reads: hero · the three steps · the map ·
book-direct · transport options · ferry timetable.

**The page hero was `img4p29.webp` — 900x600 — run full-bleed.** The same defect
the rooms page had, and the same fix: a real photograph at a real size. It is now
a still from the drone clip in `assets/hero-carousel/New/`, at **12.0s**, which
frames more of the resort than 10–11s and puts darker foliage bottom-left where
the headline sits. 3840x2160 native, saved at 1800x1012 / q74 / 386 KB as
`assets/getting-here/hero.webp`.

⚠️ **There is no ffmpeg on this machine, and `sips` cannot write WebP.** The frame
came out through AVFoundation (`scratchpad/grab.swift` — `swift grab.swift <video>
<outdir> <seconds…>`), which works on any Mac with the command line tools, and the
WebP encode through Pillow, which the system Python has. The generator sets
`AVAssetImageGenerator`'s tolerance to zero on both sides so it returns the exact
frame asked for rather than drifting to the nearest keyframe. Reach for those two
rather than assuming ffmpeg exists.

**The photo band between the steps and the transport list is gone**, replaced by
the homepage's map. It differs in exactly one way: **its three steps carry no
body copy.** The band directly above already spells them out in full, and
printing the same three sentences twice on one page is a problem the homepage
never had. The numerals are the point — the same 01/02/03 the reader has just
read, lighting up in order as the legs draw. That continuity *is* the "glidende
overgang" that was asked for.

⚠️ **A soft fade on the band's leading edge was built and then removed — don't
rebuild it.** `.route--soft` put a warm-white gradient over the top of the stage,
meant to let the map emerge from the step list rather than cut against it. Shown
in place, Frederik's read was immediate and right: it does not work. A gradient
can only sell a transition if it *moves*; as a fixed 180px wash sitting
permanently at the top of a pinned stage it reads as a smudge over the
photograph. Every other full-bleed band on this site meets the page with a hard
edge, and so does this one now. The continuity is carried by the numerals, not
by the paint.

The headline is **"Roughly seven hours from Bangkok"**, kept from the band it
replaced — the one line Frederik asked to preserve.

⚠️ **The `<svg>` is duplicated in `index.html` and `getting-here.html`, byte for
byte.** With no build step and no component system there is nowhere shared to put
it; an external file would cost a second request and put the paths out of reach of
`getTotalLength()`. It is ~20 KB raw, ~5 KB gzipped, twice. **If you regenerate it
with `scratchpad/build_route.py`, splice the result into BOTH pages** — one page
quietly keeping the old geometry is the failure mode here.

**The transport list has a heading now** — "Alternative ways of getting here" —
which it never had; it used to open straight onto a numbered row. One line under
it does the work of resolving an otherwise fair objection: row 01 is the
*recommended* route, which sits oddly inside a list called alternatives. It says
so plainly instead ("The Boonsiri bus and ferry sits first — it is the route
above, in full, with times and fares"), which is also the honest description of
why that row is longer than the rest.

**New "Book direct" band** between the map and the transport options, in sand so
the page gets a quiet beat between the dark map and the warm-white list. Its claim
— that the resort will book either the Boonsiri bus-and-ferry or a private minivan
plus the ferry — is not new: both routes already appear further down the same page,
as do the 30-day lead time and the pier pickup. The band gathers them into an offer
instead of leaving them as reference material.


### Google Analytics, consent-gated (4 Sep 2026)

Frederik supplied the standard gtag.js snippet (`G-EJN1DGKE8N`) meant for
`<head>`. Wired it in via `loadGoogleAnalytics()` instead, called from the
same two places as `loadMetaPixel()` — a stored "accept" at page load, and a
fresh Accept click — for the identical reason: pasting it into every
`<head>` would fire before consent and contradict the banner's own
"Marketing cookies stay off until you agree." `trackEnquiry()` already
guarded its `gtag()` call behind `if (window.gtag)`, so GA4's `generate_lead`
event started working the moment this landed — no other change needed.

The commented-out `gtag('consent','update', ...)` block in `showConsentBar()`
is Google's Consent Mode v2 shape (`analytics_storage`, `ad_storage`, etc.) —
left commented deliberately. That pattern is for sites that want *modeled*
conversions while consent is denied (load gtag eagerly with default-denied,
then grant later); this site doesn't need that, and loading nothing at all
until Accept is simpler and matches the Meta Pixel's approach exactly. Don't
uncomment it without also switching to the default-denied loading pattern —
half of that snippet with the eager load skipped does nothing.

### Book Now rebuilt; the enquiry can actually send now (4 Sep 2026)

⚠️ **Read this before touching the enquiry flow.** Frederik asked what happened
when someone pressed "Send enquiry". The answer was: **nothing was sent.** The
handler set `window.location.href` to a `mailto:` — it opened the visitor's own
mail client with a draft they still had to send themselves, and on a phone or in
webmail, where no mail client is configured, it did *visibly nothing*. That is
why the confirmation panel has always said "ready to send" rather than "sent";
that wording was load-bearing, not shyness.

**The form now POSTs to Web3Forms, with the mailto kept as the fallback.** Two
paths, and the difference is the whole point:

| state | what happens |
|---|---|
| access key present | POST to the service, which sends the mail server-side. Works on every device. The panel may then say **sent**, because it was. |
| access key blank, or the POST fails | Falls back to the mailto draft and the old "ready to send" panel. Nothing is ever silently lost. |

⚠️ **The key in `book.html` is deliberately empty and must stay that way until a
real one exists.** A made-up key does not degrade — it turns every enquiry into a
silent rejection while the page still says thank you, which is strictly worse
than the mailto it replaced. Frederik is getting the key from whoever administers
`reservation@`; the key is public by design (it only permits sending *to* that
mailbox) so it belongs in the markup, not in a secret.

⚠️ **The endpoint is `data-endpoint`, not `action`.** A real `action` is the
correct progressive enhancement *once a key exists* — Web3Forms formats a plain
HTML form fine without JS. With the key blank it instead posts to the service and
lands the visitor on its error page. A form that cannot work should fail by doing
nothing, not by throwing someone off the site. Give it back its `action` after
the key is in, if the no-JS path is wanted.

**A copy to a second address is NOT in the code, on purpose.** Frederik asked for
a BCC to his personal address. Web3Forms has no BCC; its CC is a paid feature and
is visible to everyone on the mail anyway. More to the point, **any address in
the page is public** — this repo is public, so it would be scraped. The copy
belongs in a forwarding rule on the `reservation@` mailbox or in the service's
own dashboard. Don't put a personal address in the markup.

**`reservation@kohkoodbeach.com` appeared in 52 places and was wrong.** Commit
`0f0825d` moved the site to the staging domain with a find-and-replace of
`kohkoodbeachresorts.com` → `kohkoodbeach.com`, which also rewrote the reservation
address in every footer and every JSON-LD block. The form's own constant in
`script.js` survived because it was written separately, so the site *displayed*
one address while the form *sent* to another. All 52 restored. **If the domain
moves again, replace `ORIGIN` only — do not blanket-replace the bare domain.**

**No static currency conversions** — see the content-integrity rule above; this
page had none, but it is the same instruction.

#### The page itself

**The bungalow `<select>` is gone.** It listed eight room-and-view strings and was
the only place on the site where the rooms appeared as a database field rather
than as photographs — on the one page whose job is to make someone want the room.
It is now the same three houses the accommodation page shows, each with its views
as priced choices, plus a quiet "Not sure yet" that is a valid answer.

**The view chips ARE the "choose this room" button.** A separate button per card
would have to pick a view on the visitor's behalf, and the view is the entire
decision — it is what changes the price. "See more information" opens a native
`<dialog>` carrying that room's own accommodation-page panel: the same gallery,
copy, amenities and prices, with each view's "Book now" link swapped for a
`Choose this room` button that sets the selection and closes. Nobody leaves the
page, which is what was asked for.

⚠️ **The chooser and the three overlays are GENERATED from `accommodation.html`
by `scratchpad/build_book.py`.** Edit the rooms, prices or photos on that page
and re-run it; do not hand-edit them here, or the two pages will disagree about
what a room costs. The script is idempotent — it carries the country list forward
out of whatever `book.html` already holds.

⚠️ **`.rc__shot img` needs `height: auto` and it is load-bearing.** The global
reset is `img, svg, video { display:block; max-width:100% }` and never sets a
height, so an `<img>` carrying width/height ATTRIBUTES — every image on this site
does, for layout stability — has a *specified* height, and `aspect-ratio` is
ignored whenever height is not `auto`. Without that one word the 2000x1500 room
photos rendered 1500px tall inside a 407px card. Same family as the footer-logo
stretch recorded further up: set both axes on an `<img>`, or set the other to
auto.

**`.rdlg` needs `margin: auto` and `overflow: auto`.** Zeroing a `<dialog>`'s
padding and border drops the UA box that was centring it, so it renders hard
against the top-left; and the dialog has to be its own scroll container both to
contain a long room panel and to let its title bar stay sticky.

**Other changes:** hero is a still from `Panoramic from the ocean over the resort
drone shot.MP4` at 10.0s (the shot Frederik sent), cropped 3:2 around the pool;
the h1 is "When will you arrive?" instead of the more commanding "Send us your
dates"; Adults became **Guests** split into adults 13+, children 2–12 and infants
under 2; dates, guests, name, email and country are required and phone is not; a
paraphrased TripAdvisor review sits under the form; and the thank-you reads as
Frederik wrote it, at **24 hours** — the figure the rest of the site already
promises, chosen over 48 so the page does not make two different promises.

### Book Now, second pass — one form, and a rule that can now bite (4 Sep 2026)

Frederik's verdict on the first pass was fair: three same-size cards, a heading
over them, the form a full scroll below the hero, and — worse — a charcoal
review band sitting last above the footer, **breaking the warm-white rule the
afternoon after it was written as a hard rule.** A rule in a document did not
stop a hand. So:

⚠️ **`scratchpad/check_last_band.py` now refuses any page whose last
`<section>`/`<aside>` before the footer is a coloured band, and it is installed
as `.git/hooks/pre-commit` on this machine.** Commits with a violating page fail
with the page and class named. The hook lives in `.git/`, so it is per-clone —
re-install it after a fresh clone (`cp` the three-line script into
`.git/hooks/pre-commit`, `chmod +x`). Allowed closers: plain `.band`, or the
`rev--light` variant. `.rev` alone, `band--sand/--ink/--sage`, `.cta-band`,
`.reveal-img`, `.route` and any inline background are refused.

**The page is now one form in four fieldsets, in the order a visitor decides:**
When (fixed/flexible, arrival, departure) → Who's coming (adults 13+, children
2–12, infants under 2, extra bed) → Your bungalow (optional, folded) → Your
details → Send. Nothing sits between the hero and the first field; the hero is
`.page-hero--short` (42vh, not 62) so "Arrival" is inside the first viewport on
a laptop (measured: 628px down in a 900px window). Legends are the group
headings, set in the display serif at a modest size — headings, not eyebrows.

⚠️ **The rule between groups is drawn at the BOTTOM of each fieldset, never the
top.** A `<legend>` renders straddling its fieldset's top edge — with `border:0`
as much as with a border, and an inset top shadow lands there too. `border-top`
cut "Who's coming" in half; an inset top shadow did exactly the same. The
bottom edge has no legend on it. If you add a group, keep the rule there.

**The bungalow chooser is a native `<details>`.** It opens without JS, the
summary is a real keyboard control, and JS only keeps the summary's text in
step with the chosen chip (and opens the fold when `?room=` arrives from
accommodation.html or when "Choose this room" is pressed inside an overlay).
Folded by default because the choice is optional, the resort is glad to
recommend, and open it would push the visitor's own details below three
photographs.

**Inside the fold, each house is a row, left to right: photo · name and one line
· the views as chips · More info.** Chips are one line each — name · where ·
from-price — with `white-space: nowrap` on the name so "Partial Sea View" never
breaks. The first pass had them as three-line blocks stacking in a 300px column,
520px per house; now 43px per chip and 265px per house at 1440. **The chip is the
choice** — the view is what changes the price, so a separate "choose" button
would only have to pick a view on the visitor's behalf.

⚠️ **`.enq` is 1100px wide; the input groups cap at 760px inside it.** The row
list needs the width to lay out horizontally; the inputs want a reading measure.
Both are true, so the form is wide and `.radios`, `.form__row`, `.guests__grid`,
the message label and `.enq__send` carry `max-width: 760px`. Don't narrow the
form again to "fix" the inputs — narrow the inputs.

**The review under the form is `rev--light`** (warm-white ground, charcoal text,
gold stars): the same component as the dark `.rev` used mid-page on
accommodation.html, in the one colour a closer is allowed to be.

Verified in one batched round (desktop 1440×900 top / fold open / overlay, mobile
390 top / fold open), one fix batch, one confirmation: no horizontal overflow at
390, no console errors, Impeccable detector 0 findings on book.html, style.css
and script.js, guard green on all 12 pages. Known residual, not a defect: a chip
whose "where" line is long wraps its price to a second line inside the 575px
chip column; a 12rem text column instead of 14rem would give the chips the room.

### Book Now, third pass — the enquiry as the first day of the stay (4 Sep 2026)

Frederik's verdict on the second pass: "stadig virkelig kedelig", and a direct
question — *would you build it like this if I asked for the perfect booking
page?* No. The second pass was a correct form: fieldsets, right order, measured.
It treated the page as a tool to operate. For a 19-bungalow resort with no
engine and no payment, "book now" is not a transaction; it is the moment someone
who already wants to come starts a conversation with a place. So the page was
built again, from a clean slate, on that premise. `PRODUCT.md` now exists and
records the confirmed audience and purpose; read it before the next design pass.

**The whole page is one `<form>`.** Hero, rail, houses and details are all
fields of the same enquiry. Nothing sits between the photograph and the first
field.

**The hero carries the four fields that start it.** Video, headline, one line,
and the site's own sand booking strip from the homepage laid over the bottom of
the frame: Arrival · Departure · Adults · Children · Continue. Measured at
1440×900: strip 599–738px, Arrival at 664px — inside the first viewport.

⚠️ **The video is attached, not shipped.** `assets/book-hero.mp4` is 2.4 MB —
the daylight pool pull-back, seconds 5–14, 1280×720 H.264 at ~2.2 Mbps, no
audio, `moov` at byte 32 (fast-start; it plays before it has fully downloaded).
The `<video>` has **no `src` in the markup**; `initBookHero()` attaches it only
on a wide screen, without `prefers-reduced-motion`, and not on a save-data
connection. Everyone else gets the poster, which is the video's **own first
frame** (`book-hero-poster.webp`, 1600×900), so nothing jumps when playback
starts. Verified: `src` attached and playing at 1440, not attached at 390.
The sunset clip was considered and rejected on the standing no-dark-heroes
rule; the "palm trees over pool and vast ocean" clip is portrait. Made with
`scratchpad/transcode.swift` (AVAssetWriter — there is no ffmpeg here) and
`.gitignore` carries a `!assets/book-hero.mp4` exception, the one video the
pages load.

**The rail reads the enquiry back.** A sticky line under the nav — "12 Dec – 19
Dec · 7 nights · 2 adults, 1 child · Bali House, Sea View" — filling in as the
visitor chooses, with a Send link. On a phone it is the bottom bar, with Send
in it, and the WhatsApp float is hidden on this page because the page now has
its own bottom bar; WhatsApp stays linked under the Send button. The rail sits
at `top: var(--nav-h)`; measured, nav bottom = rail top = 114px, no gap.

**The houses are photograph-led rows, one per house**, in `.wrap`: a 3:2 photo
leads (7fr), then name, one line, "from X THB per night", **Choose this room**
and *More about it* (the existing `<dialog>`). No chips, no "where" lines.
Pressing Choose unfolds that house's views **in place, under the text column**
(`grid-column: 2` — the first cut spanned the full 1560px row and put name and
price 1400px apart) as clean rows: name and from-price only. The views are
**real `<input type="radio" name="room">`**, so the choice submits without JS
and `?room=` prefills natively. Picking one marks the house — gold rule, "Sea
View · from 3,500 THB" — folds the views, updates the rail, and shows *Change*.
"Not sure yet" is a radio too, checked by default. The unfold is the measured-
height technique from `initRoomDetail()` (synchronous `offsetHeight` flush,
`transitionend` with a 700ms timeout; instant under `.no-motion`).

⚠️ **`.form` moved from the `<form>` to the `.details` section.** With one form
wrapping the whole page, `.form`'s field rules would have styled the hero strip
and the view radios too. The first cut forgot this and the details rendered as
raw browser inputs. `.details` carries `form` now; the strip is styled by
`.field`, the views by `.view`.

⚠️ **`.rev--light` went missing once and the guard did not notice.** The
booking-page CSS block was rewritten wholesale and the light variant lived
inside it, so the page shipped a charcoal closer while
`check_last_band.py` — which reads class names — stayed green. The rules are
back, and **the guard now also asserts the `.rev--light` rule exists in
`style.css` with `--warm-white`**. A class name is a promise the stylesheet has
to keep; the check reads both now.

**Also:** `initNav()`'s hero selector gained `.bhero` so the nav goes transparent
over the video like every other opener; Fixed/Flexible dates live in the details
group; infants and extra bed moved there too, so the strip stays four fields.

Verified in one batched round, one fix batch, one confirmation: overlay
"Choose this room" checks the radio and marks the house; `Change` reopens and
resets; `?room=bali-deluxe-partial-sea-view` marks on load; the mailto body
carries room, dates, the flexible flag and the guest breakdown; no horizontal
overflow at 390; no console errors; Impeccable detector 0 findings; guard green
on all 12 pages.

### Book Now, fourth pass — three steps, and four real bugs (4 Sep 2026)

Frederik: *"Det skal være et flow — først vælger du datoer → choose your room →
Tell us about you."* Plus four defects, three of them mine.

**The page is now one `<form>` and three steps.** A finished step collapses to a
gold line saying what it holds, with *Change* to reopen; the next opens in its
place. Choosing a room folds the rooms away and puts "Tell us about you" in
their place — the fold-away that was asked for. **This is why there is no sticky
summary rail any more:** a floating bar under a 114px fixed nav stacked two
horizontal bands over the page, and when the nav was transparent the content
slid visibly under it. The steps say what they carry, where they are.

⚠️ **Four bugs, worth keeping so they are not rebuilt:**

1. **The hero video shipped the wrong nine seconds.** The clip pulls back: the
   pool fills the frame from 0–5s and is a small shape behind palms by 8s. The
   first cut took **5–14s** — the wrong half — so the hero was nothing but
   palms. It is 0–5.2s now. *Always contact-sheet a clip before choosing a
   segment; the filename said "pool" and it was true of only the first third.*
2. **The transcode silently produced the wrong material.**
   `AVAssetReaderVideoCompositionOutput` with a composition built from
   `propertiesOf: asset` remapped time — asking for 5–14s yielded a 4.01s file
   whose content was not that range. `scratchpad/enc.swift` uses a plain
   `AVAssetReaderTrackOutput` now, which keeps asset timestamps. 992 KB,
   5.21s, 156 frames at 29.97fps, `moov` at byte 32.
3. **`initBookHero()` matched nothing.** It queried
   `[data-bhero] video[data-src]`; the rebuilt hero has no `data-bhero`
   attribute, so it returned early and *every guard still reported healthy* —
   wide screen, motion allowed, `canPlayType` "maybe" — while the poster simply
   stayed. It queries `.bhero video[data-src]` now. **Don't couple a query to a
   wrapper attribute the markup does not have to keep.**
4. ⚠️ **A stale unfold timeout undid the next one.** `unfold()`'s 700ms
   `transitionend` fallback fired after a *later* call had already collapsed the
   same region, setting `height: auto` again — so opening step 2 and choosing a
   room within 700ms left the rooms expanded. `unfold()` now stamps a
   generation token on the element and the settle only acts if it is still the
   newest, and `transitionend` is filtered on `e.target === region` and
   `propertyName === 'height'` so a nested region's transition cannot settle its
   parent. The step bodies and the house views share this function.

⚠️ **Every `.step__body` has exactly one `.step__inner` child, and that is
structural.** `unfold()` measures `region.firstElementChild`, so a body with
several children animates to the height of the first one only — step 1 would
have opened to the height of its radio row. If you add content to a step, put it
inside the inner.

⚠️ **`initNav()`'s sentinel is `min(70vh, 70%)`, not a flat 70vh.** It marks
where the nav stops being transparent, so it must never be taller than the hero
that contains it. This hero is 52vh; a 70vh sentinel reached past its bottom and
left the nav transparent over the light page, washing out the mid-tone logo.
Verified solid at 700px on book, index, accommodation and getting-here.

⚠️ **`.rev--light` has now been deleted twice**, both times by a wholesale
rewrite of the book.html CSS block it was filed under. It lives **beside `.rev`
itself** now. `check_last_band.py` asserts the rule exists as well as the class.

**Other numbers:** the hero is `clamp(360px, 52vh, 560px)` — 82vh put step 1 a
full screen down; `object-position: 50% 42%` keeps the water in a band wider
than the clip's 16:9. House photos are **150px** (104px on a phone), down from
722px — the row is 203px tall against 539px. Step 1 (dates, guests, flexible),
step 2 (three houses + "not sure yet"), step 3 (name, country, email, phone,
message, send).

Verified in one batched round, one fix batch, one confirmation: video attaches
and plays at 1440 and is not fetched at 390; dates → room → you advances and
each Change reopens correctly; `?room=` still marks its house; the mailto body
carries room, dates, flexible flag and guest breakdown; no horizontal overflow
at 390; no console errors; Impeccable detector 0 findings; guard green on 12
pages.

### Book Now, fifth pass — dates in the hero, rooms as the accommodation cards (4 Sep 2026)

Frederik's iteration on the flow: the dates belong back in the hero as they were
("det stod fint før"), the rooms should use the card format from
`accommodation.html`, "Choose this room" should unfold the views inside the
card, and picking an arrival should open the departure picker on its own.

**Shape now:** hero (video + headline + the sand booking strip: arrival,
departure, adults, children, and *Choose your room*) → **Your room** (the three
`.cat` cards) → **Tell us about you**. Pressing *Choose your room* validates the
dates and glides down to the rooms; choosing a view collapses the room section
to a gold summary line with *Change* and opens the details in its place.

**The numbered step chips are gone.** They were mine, not asked for, and with
step 1 living in the hero the numbering had nowhere honest to start. The order
is carried by the interaction — button, glide, fold — which is what the craft
floor asks for before spending a numeral.

⚠️ **The room cards are GENERATED from `accommodation.html`'s own `.cat`
markup** — photo, one line, and the Size/Beds/Sleeps facts are read out of that
page by `scratchpad/build_book.py`, alongside the views and prices it already
took from the panels. Two pages, one source. Only the actions differ here:
*See more* opens the overlay dialog rather than the in-page panel, and
*Book now* becomes *Choose this room*, which unfolds `.cat__views` inside the
card. `.cats__grid` is `align-items: start`, so an opened card grows without
dragging its neighbours down.

**Picking an arrival opens the departure picker.** `showPicker()` needs the user
activation the click carries and is not in every engine, so it is wrapped and
falls back to `focus()`. It only fires when departure is still empty — reopening
the picker over a date the visitor already chose would be rude.

**The hero is `clamp(500px, 76vh, 820px)` again**, tall enough to carry the strip
under the headline: measured at 1440×900 the strip sits 553–684px, fully inside
the first viewport.

Verified in one batched round: video attaches at 1440 and not at 390; *Choose
your room* scrolls the room section to the top of the viewport; the card's
dropdown opens to 254px inside the card and the card goes gold; picking folds
the rooms and opens the details; `showPicker` is called on the departure field
after an arrival change; no horizontal overflow at 390; no console errors;
Impeccable detector 0 findings; guard green on all 12 pages.

### Book Now, sixth pass — the scroll landed at the foot of the page (4 Sep 2026)

Two faults, both reported by Frederik, both traced before touching anything.

⚠️ **Choosing a room scrolled to the bottom of the page, not to "Tell us about
you". `scrollIntoView` computes its target from the layout at the moment it is
called** — and opening a step collapses the one above it, so the document was
still shrinking while the smooth scroll ran. Traced frame by frame: the target
was document y≈1903, the room body then collapsed and `scrollHeight` fell
3353 → 3008, and the scroll finished at 1904 with the step **1031px above the
viewport**, i.e. the foot of the page.

The fix is sequencing, not easing. `unfold()` takes an `after` callback and
`open()` counts the regions it animates, firing the callback when the last one
settles; only then does the page scroll. It also scrolls to
`rect.top + scrollY - --nav-h - 18` rather than `block: 'start'`, which would
have parked the header behind the 114px fixed nav. Verified: the step lands at
viewport y=132, clear of the nav, and not at the bottom.

**Every step opens at any time.** The headers are now buttons (the `<button>` is
inside the `<h2>`, which keeps both the heading semantics and valid HTML — a
heading inside a button is not phrasing content). Clicking a closed step opens
it and closes the others; clicking the open one collapses it; `aria-expanded`
tracks on each. "Tell us about you" no longer requires a room to have been
chosen. The separate *Change* button is gone — the header is the control, and
the chosen summary stays beside the title.

**A brace went missing while editing.** Removing `.step__change` and the old
`.house` rules by pattern took the closing `}` of the final `@media` block with
them; the stylesheet parsed as one unterminated rule. Caught by counting braces
after every CSS edit, which is worth keeping in the loop — the brace count is
cheap and the failure is silent.

### Book Now, seventh pass — the glide, and two animations fighting (4 Sep 2026)

Frederik: the move to the next step "flyver" — it startles. Profiled with a rAF
sampler inside the page rather than guessed at, and the cause was not easing.

⚠️ **`window.scrollTo(x, y)` is ANIMATED here, because `html` carries
`scroll-behavior: smooth`.** A hand-written scroll loop hands the browser a new
target every frame; the browser then eases toward each one, falls behind, and
converges on the last in a single jump when the loop stops. Measured: a 126px
crawl over 730ms followed by **283px in one frame**. Two easing curves fighting
is not an easing problem, it is two animations. Every frame of `glideTo()` now
passes `behavior: 'instant'`, which overrides the CSS. **Any future scripted
scroll on this site has to do the same.**

⚠️ **A scroll target below the current page bottom does not exist yet.** Opening
a step grows the document, so the destination is unreachable while the fold
runs — `scrollTo` clamps, nothing moves, then the ceiling lifts and the rest is
covered at once. `glideTo()` re-clamps against the live ceiling every frame and
runs for `--t-section + 220ms`, so the height is already there for most of the
travel.

**The motion, as it now measures** (rAF samples, ~67ms apart, at 1440×900):

| | 0 → rooms | rooms → details |
|---|---|---|
| distance | 636px | 104px |
| peak step | 89px | 15px |
| shape | 7·31·54·71·84·**89**·88·79·65·45·21·2 | 1·5·9·12·13·**15**·14·13·11·7·3·1 |

Both are bell curves that leave and arrive at rest. The ease is a **cosine**
(`0.5 - cos(πp)/2`), whose peak is 1.57× the average speed; the cubic ease-in-out
it replaced peaks at 2×, and on a 600px move that middle is exactly the part
that startles.

**`--t-section: 520ms` is new, and it is the one duration that belongs with
`--ease` rather than `--ease-quick`.** A whole page section folding is not a
control being operated — it is the page rearranging itself, which is the
editorial speed's job. The house views inside a card keep `--t-panel`.

`glideTo()` yields the moment the visitor touches the page: wheel, touch or key
cancels it. Verified — interrupted at 225px, still at 225px 700ms later. Under
`prefers-reduced-motion` it jumps outright (measured in place at 50ms).

### Book Now, eighth pass — the clipped focus ring, and the transport offer (4 Sep 2026)

⚠️ **`overflow: hidden` on a folding region crops the focus ring of anything
flush against its edge.** The message field sits at the step body's left edge,
and the site's focus ring is drawn *outside* the element (`outline-offset: 3px`)
— so its left side was cut off. The clip is what makes the height animation
possible, but only while the region is moving: `unfold()` now sets
`overflow: hidden` for the duration and releases it to `visible` on settle.
Anything else that folds and contains focusable controls needs the same.

**New: an offer for transport from Bangkok.** A bordered block in step 3 with one
checkbox — *I'd like an offer for transport from Bangkok* — which reveals three
routes when ticked: Boonsiri bus + ferry, private minivan + ferry, or "not sure,
recommend one". Hidden until asked for, because three unrequested radios are
noise to everyone arranging their own way here. It carries no prices: the times,
fares and the 30-day lead time already live on `getting-here.html`, which it
links to, and rates move with the season. The enquiry gains one line —
`Transport from Bangkok: YES, please quote (private minivan + ferry)` — so
reception can act on it separately from the room.

⚠️ **`label.offer__ask`, not `.offer__ask`.** These labels sit inside
`.step__inner form`, where `.form label { display: grid; gap: 10px }` scores
(0,1,1) and a bare class scores (0,1,0) — the checkbox stacked *above* its own
text. Matching the specificity with `label.` and coming later in the file is
what wins it back. Worth remembering for any new label inside `.form`.

### Book Now, ninth pass — the departure floor, matched motion, transport overlay (4 Sep 2026)

⚠️ **Departure's floor is arrival + one night, and getting there exposed a
timezone trap.** `checkout.min` used to be `checkin.value`, which left the
arrival date itself selectable — a nought-night stay the form would submit. The
first fix computed the next day with `new Date(iso + 'T00:00:00')` and
`toISOString()`; that parses as **local** midnight and serialises back to UTC,
so east of Greenwich it lands on the previous day and the floor never moved.
`dayAfter()` parses with a trailing `Z` and steps with `setUTCDate` — a plain
calendar date stays a calendar date. Verified across a month boundary
(30 Sep → 1 Oct) and a year boundary (31 Dec → 1 Jan). **Any date arithmetic on
this site should use the UTC accessors; the values are dates, not instants.**

⚠️ **The fold and the glide share one duration, read from one place.** Choosing
a room still felt fast next to "Choose your room", and the scroll was not the
difference: that step also *collapses* the room section, and a 1000px collapse
in 520ms threw the page up the screen. `--t-section` is now **760ms** with
`--ease-flow` (`cubic-bezier(0.45, 0, 0.55, 1)`, the curve form of the cosine
`glideTo()` eases with), and **`glideTo()` reads `--t-section` for its own
duration instead of scaling by distance**. Both interactions now move for the
same time on the same curve however far apart their targets are — measured 734ms
for a 636px move and 700ms for a 104px one, both ending at 767ms. Change the
custom property and both change together; that is the point of it.

**"Times and fares" is an overlay, not a link away.** Sending someone to another
page in the middle of an enquiry loses the form. It is a `<dialog>` reusing the
room overlays' `.rdlg` chrome, so Escape, the backdrop and the focus trap come
free — and its content is **generated from `getting-here.html`'s own numbered
rows**, so the times and fares have one home. The footer of the overlay links to
the full page for the ferry timetable and the other routes, which is a departure
the visitor chooses rather than one the form makes for them.

### Both forms POST for real now (4 Sep 2026)

⚠️ **There are TWO Web3Forms keys, one per form, and they are not
interchangeable.** A key is bound to the address its form was created with.

| form | key | created for |
|---|---|---|
| `contact.html` | `c5260114-…` | set up in an earlier pass |
| `book.html` | `8a3f2c91-…` | pointed at `frja91@outlook.com` **as a test** |

**Before the site takes real bookings, repoint the booking form to
`reservation@kohkoodbeachresorts.com` in the Web3Forms dashboard** — the key in
the markup stays the same, only its destination changes. And confirm where
`contact.html`'s key delivers; nobody has checked it this session. The keys are
public by design: they only permit sending *to* their own mailbox.

⚠️ **The key could not be verified from here, and it is worth knowing why.**
Web3Forms refuses server-side calls outright ("Use our API in client side …
Pro plan is required"), so `curl` returns the same rejection for a good key and
a bad one. A client-side POST from headless Chrome fails with `TypeError:
Failed to fetch` — also identically for both keys. **Neither test can
distinguish a live key from a dead one**, so the only real check is a submission
from an ordinary browser. What *was* verified: both forms take the POST branch,
carry their own key, and reach the "Thank you" panel, which only appears when
the backend reports success.

**A `transferLine()` copy had leaked into `initContactForm()`.** The edit that
added it to `initBookPage()` used a plain string replace, and
`const compose = () => {` appears in both functions — so it was defined twice.
Dead in the contact form (it queries a `[data-transfer]` box that page does not
have) but wrong; removed. **When patching one of these two near-identical
handlers, anchor on something unique to it.**

### The date guard had two halves, and only one was built (4 Sep 2026)

Frederik could still put a departure before the arrival. The floor added in the
previous pass was real but covered one direction only.

⚠️ **The `change` listener sat on ARRIVAL alone.** Moving the arrival past an
existing departure cleared it correctly — but changing the *departure* to
something earlier did nothing at all. The field went `rangeUnderflow` and stayed
on screen showing an impossible stay, because `min` on a date input marks a
value invalid; it does not refuse it. Departure now snaps up to the first legal
night when a value below `min` arrives. The picker already greys those dates
out, so this only fires on a typed or pasted value.

⚠️ **And an invalid enquiry could still be SENT.** `preventDefault()` in the
submit handler means the browser's own validation no longer guards the send —
it runs before that event, and a programmatic submit skips it entirely. A
16 Sept → 15 Sept enquiry POSTed happily. The handler now calls
`form.reportValidity()` first, which re-runs every constraint, focuses the first
offender and shows the browser's own message in the visitor's language. **Any
handler on this site that calls `preventDefault()` on a submit owes the form
that call** — the constraints in the markup are otherwise decoration.

Verified across every ordering: departure-then-arrival clears; arrival-then-
earlier-departure snaps to arrival + 1; same-day snaps to the next night; a
legal stay is left untouched; a bad range no longer submits; a good one still
does.

### The booking form sends for real — and why the tests kept saying otherwise (4 Sep 2026)

⚠️ **There is ONE Web3Forms form and ONE key: `c5260114-…`** ("Booking form",
recipient `frja91@outlook.com`, free plan, 250 submissions a month). A key
identifies a *destination*, not a piece of markup, so `book.html` and
`contact.html` both post to it; the `subject` field is what separates a booking
enquiry from a contact message in the inbox. **A key pasted from anywhere other
than that dashboard is not a key** — an invented-looking one was tried and every
enquiry was silently rejected and fell back to the mailto draft, which is
exactly what the fallback is for but is not what should be happening.

⚠️ **`api.web3forms.com` is behind Cloudflare and refuses anything that does not
look like a real browser** — including headless Chrome's default
`HeadlessChrome` user-agent. It answers **403 with no `Access-Control-Allow-*`
headers at all**, on the POST and on the preflight, which the browser then
reports only as `TypeError: Failed to fetch`. That error says nothing about the
key, and for two passes it was read as one.

**How to test this endpoint from here**, and the isolation that proves the
diagnosis: same-origin `fetch` → 200; a control cross-origin `fetch` to an
unrelated host → 200; `api.web3forms.com` → `Failed to fetch`. Relaunch headless
Chrome with `--user-agent="Mozilla/5.0 … Chrome/152.0.0.0 Safari/537.36"` and
the same call returns **`{"success": true, "message": "Form submitted
successfully!"}`**. A full submission through the live form then reaches the
**"Thank you"** panel, which only renders when the backend confirms.

**Still to do before real bookings:** repoint the recipient from
`frja91@outlook.com` to `reservation@kohkoodbeachresorts.com` in the dashboard
(the key does not change), and decide the `noindex` / production-domain
question.

### The enquiry email now reads like the website (4 Sep 2026)

The first real submissions arrived as raw control values — `bali-house-sea-view`,
`dk`, `bus-ferry`, `flexible`, `yes` — because the POST was
`new FormData(form)`, which sweeps up every field exactly as the markup stores
it, *plus* a composed `message`. Reception got the machine's version and the
human's version of the same enquiry, one under the other.

⚠️ **`compose()` now returns ONE ordered list of `[label, value]` pairs, and it
feeds both paths** — the fields Web3Forms renders in the notification, and the
plain-text body of the mailto fallback. The POST builds its payload by hand from
that list; it never reads the form directly. Add a field to the booking form and
it will *not* appear in the email until it is added to that list, which is the
right way round.

| in the email | from |
|---|---|
| `Bali House – Sea View — from 3,500 THB per night` | the chosen radio's label and price |
| `Wed, 10 February 2027` · `Nights 7` | the ISO dates, formatted in UTC |
| `2 adults, 1 child (2–12)` | the three guest fields, pluralised |
| `Yes, please quote — Boonsiri bus + ferry` | the transport box |
| `Sweden` | the country select's *option text*, not its value |

**Web3Forms turns underscores into spaces and capitalises the key**, so
`Extra_bed` arrives as "Extra bed". `name` and `email` stay lowercase on
purpose: the service reads those two itself, and `email` becomes the reply-to
address, so a reply goes to the guest.

`initContactForm()` still posts `new FormData(form)` and is fine as it is — its
four fields are already words.

### The confirmation panel carries its own layout (4 Sep 2026)

⚠️ **`showEnquirySent()` replaces the `<form>` in place, so the panel inherits
that form's position in the document and nothing else.** On `contact.html` the
form sits inside a wrapped band, so the panel looked right by inheritance and
the bug stayed hidden. On `book.html` the form *is* the page — no wrap, no
gutter — and after a real booking the confirmation rendered flush against the
left edge of the viewport with its heading tucked behind the fixed nav.

`.sent` now sets its own `max-width`, `margin-inline: auto` and gutter padding,
plus top padding of `--nav-h` + space, so it lands correctly wherever it is
dropped. And `panel.focus()` was scrolling it to the very top of the viewport,
which is *behind* the nav — it is `focus({ preventScroll: true })` followed by a
scroll that subtracts the nav height.

**Anything else that replaces a form or a section wholesale has the same
problem**: the replacement keeps the slot, not the styling around it. Give it
its own layout rather than relying on where it happens to land.

Verified on both pages, both panel variants (backend-confirmed and the mailto
fallback with its copy box and two buttons), at 1440 and 390.

