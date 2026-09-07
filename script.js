/* ==========================================================================
   Koh Kood Beach Resort — v3 behaviour
   --------------------------------------------------------------------------
   Still plain vanilla JS, no build step. The scroll work is done with
   IntersectionObserver and CSS transitions rather than a scroll-position
   listener, so it stays off the main thread and doesn't fight the browser.

   Booking note: there is still no reservation engine. Every enquiry path
   converges on book.html, which sends a pre-filled mailto. Swap the submit
   handler in initBookPage() for a real engine's embed when one exists.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  applyMotionPreference();
  initNav();
  publishNavHeight();
  initMenu();
  initReveal();
  initHero();
  initAccordion();
  initGalleryTabs();
  initLightbox();
  initHashLanding();
  initRoomSlider2();
  initRoomDetail();
  initRoomGalleries();
  initBookHero();
  initDateRanges();
  initFlow();
  initRoomChooser();
  initRoomDialogs();
  initBookPage();
  initContactForm();
  initConsent();
  initMarquee();
  initRoute();
  initPlot();
});

/* Respect the OS "reduce motion" setting. Note it *reduces* rather than removes:
   travel, scaling and looping stop, but opacity and colour still cross-fade, so
   content arrives softly instead of popping in. See the `.no-motion` rules and
   the `prefers-reduced-motion` block in style.css. */
function applyMotionPreference() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('no-motion');
  }
}

/* Nav turns solid once you leave the hero. Pages without a hero start solid. */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const hero = document.querySelector('.hero, .page-hero, .rs, .bhero');
  if (!hero) { nav.classList.add('nav--solid'); return; }

  const sentinel = document.createElement('div');
  // ⚠️ min(70vh, 70%) — not a flat 70vh. The sentinel marks where the nav
  // stops being transparent, so it must never be taller than the hero it
  // sits in. book.html's hero is 52vh; a 70vh sentinel reached past its
  // bottom and left the nav transparent over the light page below, washing
  // out the mid-tone logo. Percentages keep every hero honest about its own
  // height.
  sentinel.style.cssText = 'position:absolute;top:0;height:min(70vh,70%);width:1px;pointer-events:none;';
  hero.style.position = hero.style.position || 'relative';
  hero.appendChild(sentinel);

  new IntersectionObserver(([entry]) => {
    nav.classList.toggle('nav--solid', !entry.isIntersecting);
  }, { threshold: 0 }).observe(sentinel);
}

/* The nav is fixed, so anything else that sticks has to know how tall it is.
   Its padding is a clamp, so the height changes with the viewport — measure it
   rather than hard-coding a guess. */
function publishNavHeight() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const set = () => document.documentElement.style
    .setProperty('--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
  set();
  /* ⚠️ border-box, not the default content-box. Going solid past the hero only
     changes the nav's PADDING (114px → 74px at 1440); its content box never
     moves, so the default observer never fired and --nav-h stayed at the tall
     value on every page with a hero — and everything pinned to it (the plot,
     the route stage) sat 40px below the nav with the section ground showing. */
  if (window.ResizeObserver) new ResizeObserver(set).observe(nav, { box: 'border-box' });
  else window.addEventListener('resize', set);
}

/* Full-screen overlay menu. Links stagger in via inline transition-delay. */
function initMenu() {
  const menu = document.querySelector('.menu');
  const open = document.querySelector('[data-menu-open]');
  const close = document.querySelector('[data-menu-close]');
  if (!menu || !open) return;

  const links = menu.querySelectorAll('.menu__nav a');
  links.forEach((a, i) => { a.style.transitionDelay = `${80 + i * 40}ms`; });

  const setOpen = (state) => {
    menu.classList.toggle('is-open', state);
    document.body.style.overflow = state ? 'hidden' : '';
    open.setAttribute('aria-expanded', String(state));
  };

  open.addEventListener('click', () => setOpen(true));
  close?.addEventListener('click', () => setOpen(false));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
  });
}

/* Scroll reveal. Children of [data-reveal-group] get an automatic stagger. */
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll('[data-reveal]').forEach((el, i) => {
      // 70ms, not 110. A stagger reads as one gesture below ~80ms per step;
      // beyond that the last item in a row arrives late enough to feel like a
      // separate event.
      el.style.setProperty('--reveal-delay', `${i * 70}ms`);
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);       // reveal once, then stop watching
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach((el) => io.observe(el));
}

/* Hero cross-fade carousel with slow Ken Burns scale (CSS-driven). */
function initHero() {
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  if (slides.length < 2) return;

  let index = 0;
  let timer;

  /* Only the first frame ships its background in the markup; the rest carry a
     `data-bg` and are fetched just before they are needed. Five full-bleed
     photographs used to load before the visitor had done anything. */
  const load = (slide) => {
    if (!slide || !slide.dataset.bg) return;
    slide.style.backgroundImage = `url('${slide.dataset.bg}')`;
    delete slide.dataset.bg;
  };

  const show = (next) => {
    index = (next + slides.length) % slides.length;
    load(slides[index]);
    load(slides[(index + 1) % slides.length]);   // preload the one after
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  };

  const play = () => {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 6500);
  };

  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); play(); }));

  // Pause while the tab is hidden so we don't burn cycles in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer); else play();
  });

  load(slides[1]);   // have the second frame ready before the first swap
  play();
}

/* Room collection slider — image cross-fades, meta text swaps, prev/next wrap. */

/* FAQ accordion — uses a grid-rows transition so it animates to auto height. */
function initAccordion() {
  document.querySelectorAll('.acc__q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc__item');
      const isOpen = item.classList.contains('is-open');
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}


/* Gallery category tabs */
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gal-tabs button');
  if (!tabs.length) return;
  const panels = document.querySelectorAll('.gal-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      panels.forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById(tab.dataset.target)?.classList.add('is-active');
    });
  });
}

/* Lightbox, scoped per gallery panel so prev/next stay within one category. */
function initLightbox() {
  const box = document.querySelector('.lightbox');
  if (!box) return;
  const img = box.querySelector('img');
  let items = [];
  let idx = 0;

  const show = (delta) => {
    if (!items.length) return;
    idx = (idx + delta + items.length) % items.length;
    img.src = items[idx].src;
    img.alt = items[idx].alt;
  };

  document.querySelectorAll('.gal-item').forEach((item) => {
    item.addEventListener('click', () => {
      const scope = item.closest('.gal-panel') || document;
      items = Array.from(scope.querySelectorAll('.gal-item img'));
      idx = items.indexOf(item.querySelector('img'));
      img.src = items[idx].src;
      img.alt = items[idx].alt;
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  const close = () => { box.classList.remove('is-open'); document.body.style.overflow = ''; };
  box.querySelector('.lightbox__close')?.addEventListener('click', close);
  box.querySelector('.lightbox__prev')?.addEventListener('click', () => show(-1));
  box.querySelector('.lightbox__next')?.addEventListener('click', () => show(1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(-1);
    if (e.key === 'ArrowRight') show(1);
  });
}

/* ==========================================================================
   Enquiry handling
   --------------------------------------------------------------------------
   There is still no reservation engine, so every enquiry leaves as an email.
   That makes the *handover* the fragile moment: `mailto:` either opens the
   visitor's mail client or does nothing at all, and the page has no way to
   tell which happened. So we never claim the message was sent — we say the
   draft is ready, show the full text so nothing is lost if the client never
   opened, and give the phone number as the path that always works.
   4 Sep 2026: WhatsApp was removed from the whole site until the business
   account is set up properly — restoring it means putting the wa.me links
   back here and in every page's menu, footer and floating button. The .wa
   rule is still in style.css.
   ========================================================================== */

const RESORT_EMAIL = 'reservation@kohkoodbeachresorts.com';
const RESORT_PHONE = '+66 (0) 8 1908 8966';

/* The pixel for this site. "KKBR kohkoodbeach.com (correct pixel)", created
   on the Koh Kood Beach Resort business and verified live there.
   4 Sep 2026: replaced 2040247273287344, which Frederik had created under the
   wrong ad account. Nothing is swapped at go-live — this is the one that
   collects, staging and production alike. An earlier version of this comment
   said to swap to the old kohkoodbeachresorts.com pixel at launch; that plan
   died when this pixel was created, and the line outlived it by a day. */
const META_PIXEL_ID = '1600958241509815';

/* Injects the Meta Pixel base snippet and fires PageView. Only called from
   initConsent() once the visitor has actually agreed — loading it eagerly in
   <head> would contradict the consent banner's own "Analytics stay off until
   you agree" copy. Guarded against double-injection since it can be reached
   both from a stored prior consent and from clicking Accept in the same
   session. */
function loadMetaPixel() {
  if (window.fbq) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

const GA_MEASUREMENT_ID = 'G-EJN1DGKE8N';

/* Same rule as loadMetaPixel(): only called post-consent, never eagerly in
   <head>. trackEnquiry() already guards its gtag() call behind
   `if (window.gtag)`, so it starts working the moment this runs — no
   changes needed there. */
function loadGoogleAnalytics() {
  if (window.gtag) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}

/* Fires the conversion event once a pixel exists. No-op until then, wrapped
   so a tracking failure can never take the form down with it. */
function trackEnquiry(kind) {
  try {
    if (window.fbq) window.fbq('track', 'Lead', { content_name: kind });
    if (window.gtag) window.gtag('event', 'generate_lead', { method: kind });
  } catch (err) {
    /* deliberately swallowed */
  }
}

/* Swaps the form for a confirmation panel. `subject`/`body` are the composed
   email so the visitor can copy it manually if their mail client never opened. */
function showEnquirySent(form, subject, body, kind, delivered) {
  const panel = document.createElement('div');
  panel.className = 'sent';
  panel.setAttribute('role', 'status');
  panel.setAttribute('tabindex', '-1');

  // Two different truths, and the panel must not confuse them. `delivered` is
  // true only when the form POSTed to the backend and the backend said yes —
  // then, and only then, may this say the enquiry has been sent. Without an
  // access key the page still falls back to opening the visitor's own mail
  // client, where the message is a draft nobody has sent yet.
  panel.innerHTML = delivered ? `
    <span class="label">Enquiry sent</span>
    <h2 class="sent__head">Thank you</h2>
    <p class="sent__lead">
      We look forward to welcoming you to Koh Kood and our resort. You will hear from us
      as soon as possible, and no later than 24 hours (Thailand, GMT+7).
    </p>
    <div class="sent__panel">
      <p class="sent__panel-title">Something to add?</p>
      <p>Reply to the confirmation landing in your inbox, or call the front desk on
         <a class="link" href="tel:+66819088966">${RESORT_PHONE}</a>.</p>
    </div>
    <p class="sent__foot"><a href="index.html" class="link">Back to the resort</a></p>
  ` : `
    <span class="label">Almost there</span>
    <h2 class="sent__head">Your email is ready to send</h2>
    <p class="sent__lead">
      We have opened your email app with the enquiry filled in. <strong>Press send there</strong>
      and it reaches us — you will hear from us as soon as possible, and no later than 24 hours
      (Thailand, GMT+7).
    </p>
    <div class="sent__panel">
      <p class="sent__panel-title">Nothing opened, or you use webmail?</p>
      <p>Copy the message below and send it to <a href="mailto:${RESORT_EMAIL}" class="link">${RESORT_EMAIL}</a>,
         or call us on <a href="tel:+66819088966" class="link">${RESORT_PHONE}</a> — either always works.</p>
      <pre class="sent__copy" data-copy-body></pre>
      <div class="sent__actions">
        <button type="button" class="btn btn--ghost" data-copy>Copy the message</button>
      </div>
    </div>
    <p class="sent__foot"><a href="index.html" class="link">Back to the resort</a></p>
  `;

  const copyTarget = panel.querySelector('[data-copy-body]');
  if (copyTarget) copyTarget.textContent = body;   // textContent — the body is whatever was typed

  const copyBtn = panel.querySelector('[data-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(`${subject}\n\n${body}`);
        copyBtn.textContent = 'Copied';
      } catch (err) {
        copyBtn.textContent = 'Select the text above to copy';
      }
      setTimeout(() => { copyBtn.textContent = 'Copy the message'; }, 3000);
    });
  }

  form.replaceWith(panel);
  /* focus() alone scrolls the panel to the very top of the viewport, which is
     behind the fixed nav — that is what put the heading under the logo. Take
     the focus without the scroll, then place it below the nav ourselves. */
  panel.focus({ preventScroll: true });
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
  window.scrollTo({ top: Math.max(0, panel.getBoundingClientRect().top + window.scrollY - navH), behavior: 'instant' });
  trackEnquiry(kind);
}

/* book.html — the room chooser, the "more information" overlays, and the
   enquiry itself.
   ------------------------------------------------------------------------
   ⚠️ HOW AN ENQUIRY ACTUALLY LEAVES THIS PAGE. There are two paths and the
   difference matters, because only one of them sends anything:

     access key present -> the form POSTs to Web3Forms, which sends the mail
                           server-side. This genuinely sends, on any device,
                           including the phones and webmail users where the
                           other path silently does nothing.
     access key blank   -> falls back to opening the visitor's own mail client
                           with a pre-filled draft, which they must send
                           themselves. This is what the page did for its whole
                           life before this pass, and it is why the fallback
                           panel says "ready to send" rather than "sent".

   The key is deliberately empty in book.html until someone pastes a real one.
   Do not invent one to make the page look finished — a fake key turns every
   enquiry into a silent 4xx, which is strictly worse than the mailto. */
function chosenRoom(form) {
  const on = form.querySelector('input[name="room"]:checked');
  return { id: on?.value || '', label: on?.dataset.label || 'Not sure yet', price: on?.dataset.price || '' };
}

/* The hero video is attached, not shipped. Everyone gets the poster (the
   video's own first frame); the 2.4 MB clip is fetched only on a wide screen,
   without prefers-reduced-motion, and not on a save-data connection. */
function initBookHero() {
  // ⚠️ Query the video directly. This read `[data-bhero] video` until the hero
  // was rebuilt without that attribute, and then silently attached nothing —
  // every guard passed and the poster just stayed. Don't couple it to a
  // wrapper attribute the markup does not have to keep.
  const video = document.querySelector('.bhero video[data-src]');
  if (!video) return;
  const wide = window.matchMedia('(min-width: 821px)').matches;
  const still = document.documentElement.classList.contains('no-motion');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (!wide || still || saveData) return;
  if (!video.canPlayType('video/mp4')) return;
  video.src = video.dataset.src;
  video.load();
  video.play().catch(() => {});   // autoplay can be refused; the poster stays
}

/* The page's own scroll, because the browser's `behavior: 'smooth'` gives no
   say over duration or easing — on a long jump it reads as a lurch, which is
   exactly what a booking flow must not do at the moment someone commits. This
   eases in and out over a distance-aware duration and yields the moment the
   visitor touches the page themselves. */
function glideTo(y, still) {
  if (still) { window.scrollTo({ top: y, behavior: 'instant' }); return; }
  const start = window.scrollY;
  const dist = y - start;
  if (Math.abs(dist) < 2) return;

  // ⚠️ The glide must outlast the fold that makes room for it. The target sits
  // below the page's current bottom until the opening step has grown into it,
  // so scrollTo is clamped and NOTHING moves — then the ceiling lifts and the
  // remaining distance is covered at once. That stall-then-rush is what read as
  // a lurch. Running longer than --t-section means the height is already there
  // for most of the travel, and each frame re-clamps against the live ceiling
  // instead of assuming it.
  /* ⚠️ A fixed duration, read from the same custom property the fold uses, and
     NOT scaled by distance. Frederik's note was that choosing a room still felt
     fast next to "Choose your room" — and the scroll was not the difference:
     that step also collapses the room section, and a 1000px collapse in 520ms
     is what threw the page up the screen. Fold and glide now share one duration
     and one curve, so the two interactions move identically however far apart
     their targets are. */
  const ms = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--t-section')) || 760;

  let t0 = null, cancelled = false;
  const clean = () => {
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  const stop = () => { cancelled = true; clean(); };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const step = (now) => {
    if (cancelled) return;
    if (t0 === null) t0 = now;          // start the clock on the first frame, not before it
    const p = Math.min(1, (now - t0) / ms);
    // Cosine ease: peaks at 1.57x the average speed. Cubic ease-in-out peaks at
    // 2x, and on a 600px move that middle is exactly the part that startles.
    const e = 0.5 - Math.cos(Math.PI * p) / 2;
    const ceiling = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    // ⚠️ `behavior: 'instant'`, and it is not optional. The stylesheet sets
    // `html { scroll-behavior: smooth }`, so a bare scrollTo is ANIMATED by the
    // browser — this loop would hand it a fresh target every frame, it would
    // chase each one and fall behind, then converge on the last in one jump
    // once the loop stopped. Measured: a 126px crawl over 730ms followed by
    // 283px in a single frame. Two easing curves fighting is not an easing bug,
    // it is two animations.
    window.scrollTo({ top: Math.min(start + dist * e, ceiling), behavior: 'instant' });
    if (p < 1) requestAnimationFrame(step); else clean();
  };
  requestAnimationFrame(step);
}

/* Measured-height unfold. Shared by the steps and by each house's views:
   fr units do not interpolate in this engine, so a pixel height is what
   animates. The flush is a synchronous offsetHeight read — a rAF never runs in
   a throttled or backgrounded tab — and transitionend carries a timeout,
   because it does not fire when the value did not change. */
function unfold(region, open, still, after) {
  const inner = region.firstElementChild;
  if (still) { region.hidden = !open; region.style.height = open ? 'auto' : '0'; region.style.overflow = open ? 'visible' : 'hidden'; if (after) after(); return; }

  // ⚠️ Generation token. Each call claims the region; the settle below only
  // acts if it is still the newest. Without it the 700ms fallback from an
  // EARLIER unfold fires later and undoes the current one — opening step 2 and
  // choosing a room inside 700ms left the rooms expanded again, because the
  // open-timeout set height back to `auto` after the collapse had run.
  region.style.overflow = 'hidden';        // clip again for the duration of the move
  const gen = (region._unfoldGen = (region._unfoldGen || 0) + 1);
  let settled = false;
  const settle = () => {
    if (settled || region._unfoldGen !== gen) return;
    settled = true;
    region.removeEventListener('transitionend', onEnd);
    if (open) {
      region.style.height = 'auto';
      // ⚠️ Release the clip once the fold is at rest. `overflow: hidden` is what
      // makes the height animation possible, but it also crops anything drawn
      // outside a child's box — and a focus ring is drawn outside, with
      // `outline-offset: 3px`. The message field sits flush against this edge,
      // so its ring lost its left side. At rest there is nothing to clip.
      region.style.overflow = 'visible';
    } else {
      region.hidden = true;
    }
    if (after) after();
  };
  // Height transitions on nested regions bubble; only this element's own
  // transition may settle it.
  const onEnd = (e) => { if (e.target === region && e.propertyName === 'height') settle(); };

  region.addEventListener('transitionend', onEnd);
  if (open) {
    region.hidden = false;
    region.style.height = '0px';
    void region.offsetHeight;          // synchronous flush; rAF never runs in a throttled tab
    region.style.height = `${inner.offsetHeight}px`;
  } else {
    region.style.height = `${inner.offsetHeight}px`;
    void region.offsetHeight;
    region.style.height = '0px';
  }
  setTimeout(settle, 700);             // transitionend does not fire when the value did not change
}

/* The three-step flow: when → which room → who you are. A finished step
   collapses to a line saying what it holds; the next opens in its place. That
   collapse is why the page has no sticky summary bar. Without JS every step
   body is simply open and the page is one long form. */
/* ==========================================================================
   Arrival / departure pair
   --------------------------------------------------------------------------
   Two forms carry this pair: the booking page's own form and the homepage
   booking bar, which GETs its values straight into it. Both need the same
   floors, so the rules live here rather than inside either page's setup.
   ========================================================================== */

const isoToday = () => new Date().toISOString().slice(0, 10);

/* ⚠️ All UTC, deliberately. `new Date('2026-09-24T00:00:00')` is LOCAL
   midnight, and `toISOString()` then converts it back to UTC — east of
   Greenwich that lands on the previous day, so "the day after" returned the
   same date and the departure floor never moved. Parsing with a trailing Z
   and stepping with setUTCDate keeps a plain calendar date a calendar date. */
function dayAfter(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return isoToday();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/* ⚠️ A FUNCTION, not just a listener, and that is the whole point. A native
   date picker renders its grid from `min` at the instant it opens, and the
   booking page opens the departure picker for the visitor the moment an
   arrival is chosen. Both used to hang off the same `change` event from
   different init functions, so they ran in registration order: the picker
   opened first, showing a month with nothing greyed out, and the floor landed
   a tick later. Reopening the picker showed the right thing, which is why this
   read as "it works the second time". Anything that opens the departure picker
   must call this synchronously first — never rely on listener order.

   Departure's floor is the night AFTER arrival, not arrival itself: `checkin`
   as the floor leaves the arrival date selectable, which is a nought-night
   stay the form would happily submit. */
function applyDateFloors(form) {
  const checkin = form.querySelector('[name="checkin"]');
  const checkout = form.querySelector('[name="checkout"]');
  if (!checkin || !checkout) return;
  const today = isoToday();
  checkin.min = today;
  checkout.min = checkin.value ? dayAfter(checkin.value) : today;
  if (checkout.value && checkout.value < checkout.min) checkout.value = '';
}

/* Wires every form on the page that has both fields. The homepage bar had no
   floors at all for months — it is not `[data-book-form]`, so the booking
   page's setup skipped it, and it would GET an impossible range into the
   booking page without complaint. Selecting on the fields rather than on a
   form attribute is what stops the next such form from being missed. */
function initDateRanges() {
  document.querySelectorAll('form').forEach((form) => {
    const checkin = form.querySelector('[name="checkin"]');
    const checkout = form.querySelector('[name="checkout"]');
    if (!checkin || !checkout) return;

    checkin.addEventListener('change', () => applyDateFloors(form));

    /* ⚠️ Watch DEPARTURE as well. Listening only on arrival left the other half
       open: pick a departure earlier than the arrival — by typing, or by setting
       it first — and nothing corrected it. The field went `rangeUnderflow` and
       simply stayed on screen showing an impossible stay. Snapping up to the
       first legal night is never a dead end, and the picker already greys out
       everything below `min`, so this only fires on a typed or pasted value. */
    checkout.addEventListener('change', () => {
      if (checkout.value && checkout.min && checkout.value < checkout.min) {
        checkout.value = checkout.min;
      }
    });

    applyDateFloors(form);
  });
}

function initFlow() {
  const form = document.querySelector('[data-book-form]');
  const steps = Array.from(document.querySelectorAll('.step'));
  if (!form || !steps.length) return;
  const still = document.documentElement.classList.contains('no-motion');
  const byName = (n) => steps.find((s) => s.dataset.step === n);

  const fmt = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
  const datesSummary = () => {
    const a = form.checkin.value, b = form.checkout.value;
    if (!a || !b) return '';
    const nights = Math.round((new Date(b) - new Date(a)) / 86400000);
    const ad = Number(form.adults.value || 0), ch = Number(form.children.value || 0), inf = Number(form.infants.value || 0);
    const who = [`${ad} adult${ad === 1 ? '' : 's'}`];
    if (ch) who.push(`${ch} child${ch === 1 ? '' : 'ren'}`);
    if (inf) who.push(`${inf} infant${inf === 1 ? '' : 's'}`);
    const flex = form.querySelector('input[name="dates"]:checked')?.value === 'flexible';
    return `${fmt(a)} – ${fmt(b)} · ${nights} night${nights === 1 ? '' : 's'}${flex ? ' (flexible)' : ''} · ${who.join(', ')}`;
  };
  const roomSummary = () => {
    const on = form.querySelector('input[name="room"]:checked');
    if (!on || !on.value) return 'Any bungalow — we will recommend one';
    return `${on.dataset.label.replace(' – ', ', ')} · from ${on.dataset.price} THB`;
  };

  /* ⚠️ `after` is not a nicety. scrollIntoView computes its target from the
     layout at the moment it is called, and opening a step collapses the one
     above it — the document shrank ~350px mid-animation, so a smooth scroll
     begun beforehand kept going to a position that no longer existed and
     landed at the foot of the page. Measured: target 1903, ended 1904 with the
     step 1031px above the viewport. So the scroll waits for every height to
     settle, and then offsets for the fixed nav, which `block: 'start'` would
     otherwise hide the header behind. */
  const open = (name, after) => {
    let pending = 0;
    const settled = () => { if (--pending <= 0 && after) after(); };
    steps.forEach((s) => {
      const body = s.querySelector('[data-step-body]');
      const is = s.dataset.step === name;
      s.classList.toggle('is-open', is);
      s.querySelector('[data-step-toggle]')?.setAttribute('aria-expanded', String(is));
      if (is === Boolean(body.hidden)) { pending += 1; unfold(body, is, still, settled); }
    });
    if (pending === 0 && after) after();
  };

  const closeAll = () => {
    steps.forEach((s) => {
      const body = s.querySelector('[data-step-body]');
      s.classList.remove('is-open');
      s.querySelector('[data-step-toggle]')?.setAttribute('aria-expanded', 'false');
      if (!body.hidden) unfold(body, false, still);
    });
  };

  /* ⚠️ The destination is computed BEFORE the folds run, not read after them.
     Waiting for the heights to settle and only then scrolling is correct but
     reads as a pause followed by a lurch. Every region that is about to change
     height and sits above the target shifts it by exactly (final - current), so
     the arrival point is knowable up front — and the glide can run alongside
     the fold as one movement instead of after it. */
  const targetFor = (name) => {
    const s = byName(name);
    if (!s) return null;
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
    const top = s.getBoundingClientRect().top + window.scrollY;
    let shift = 0;
    steps.forEach((o) => {
      const body = o.querySelector('[data-step-body]');
      if (body.getBoundingClientRect().top + window.scrollY >= top) return;   // below the target: no effect
      const willOpen = o.dataset.step === name;
      const current = body.hidden ? 0 : body.offsetHeight;
      const final = willOpen ? body.firstElementChild.offsetHeight : 0;
      shift += final - current;
    });
    return Math.max(0, top + shift - navH - 18);
  };
  const markDone = (name, text) => {
    const s = byName(name); if (!s) return;
    const sum = s.querySelector('[data-step-sum]');
    s.classList.add('is-done');
    if (sum) { sum.textContent = text; sum.hidden = false; }
  };
  const goto = (name) => {
    const y = targetFor(name);
    open(name);
    if (y !== null) glideTo(y, still);
  };

  steps.forEach((s) => {
    const body = s.querySelector('[data-step-body]');
    const first = s.dataset.step === 'room';
    body.hidden = !first;
    body.style.height = first ? 'auto' : '0';
    s.classList.toggle('is-open', first);
    s.querySelector('[data-step-toggle]')?.setAttribute('aria-expanded', String(first));
  });

  document.querySelector('[data-step-next]').addEventListener('click', () => {
    const err = document.querySelector('[data-step-err]');
    for (const f of [form.checkin, form.checkout]) {
      if (!f.value) { err.textContent = 'Please give both an arrival and a departure date.'; err.hidden = false; f.focus(); return; }
    }
    if (form.checkout.value <= form.checkin.value) {
      err.textContent = 'Departure has to be after arrival.'; err.hidden = false; form.checkout.focus(); return;
    }
    err.hidden = true;
    goto('room');
  });

  /* Picking an arrival should open the departure picker, not make the visitor
     find it. showPicker() needs the user activation the click carries, and is
     not in every engine — the focus() is what the rest get. */
  form.checkin.addEventListener('change', () => {
    if (!form.checkin.value || form.checkout.value) return;
    applyDateFloors(form);   // ⚠️ before opening — the picker reads `min` once, on open
    try { form.checkout.showPicker(); } catch (err) { form.checkout.focus(); }
  });

  // Any step, any time. The flow suggests an order; it does not lock one.
  steps.forEach((s) => {
    s.querySelector('[data-step-toggle]').addEventListener('click', () => {
      if (s.classList.contains('is-open')) { closeAll(); return; }
      goto(s.dataset.step);
    });
  });

  // Choosing a room finishes step 2 and opens step 3 — the rooms fold away and
  // the details take their place.
  form.querySelectorAll('input[name="room"]').forEach((r) => {
    r.addEventListener('change', () => {
      if (!r.checked) return;
      document.querySelectorAll('.cat[data-house]').forEach((c) =>
        c.classList.toggle('is-chosen', c.contains(r)));
      markDone('room', roomSummary());
      goto('you');
    });
  });

  // The routes appear only once the offer is accepted.
  const ask = form.querySelector('[data-transfer]');
  const opts = form.querySelector('[data-transfer-opts]');
  if (ask && opts) {
    ask.addEventListener('change', () => {
      unfold(opts, ask.checked, still);
      if (!ask.checked) form.querySelectorAll('[name="transfer_route"]').forEach((r) => { r.checked = false; });
    });
  }

  window.__flow = { markDone, goto, roomSummary };
}

/* The houses inside step 2. "Choose this room" unfolds that house's views;
   picking one is a real radio change, which the flow above acts on. */
function initRoomChooser() {
  const form = document.querySelector('[data-book-form]');
  const houses = Array.from(document.querySelectorAll('.cat[data-house]'));
  if (!form || !houses.length) return;
  const still = document.documentElement.classList.contains('no-motion');

  const openHouse = (house) => {
    houses.forEach((h) => {
      const region = h.querySelector('[data-house-views]');
      const is = h === house;
      h.querySelector('[data-house-open]').setAttribute('aria-expanded', String(is));
      h.classList.toggle('is-open', is);
      if (is === Boolean(region.hidden)) unfold(region, is, still);
    });
  };

  houses.forEach((h) => h.querySelector('[data-house-open]').addEventListener('click', () => openHouse(h)));

  document.querySelectorAll('[data-choose]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const radio = form.querySelector(`input[name="room"][value="${btn.dataset.choose}"]`);
      if (!radio) return;
      btn.closest('dialog')?.close();
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  const wanted = new URLSearchParams(window.location.search).get('room');
  if (wanted) {
    const radio = form.querySelector(`input[name="room"][value="${wanted}"]`);
    if (radio) {
      radio.checked = true;
      openHouse(radio.closest('.cat'));
      if (window.__flow) window.__flow.markDone('room', window.__flow.roomSummary());
    }
  }
}

/* Native <dialog>: Escape and the backdrop come free, and focus is trapped for
   us. No library, consistent with the rest of this file. */
function initRoomDialogs() {
  document.querySelectorAll('[data-dlg-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dlg = document.getElementById(btn.dataset.dlgOpen);
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    });
  });
  document.querySelectorAll('dialog.rdlg').forEach((dlg) => {
    dlg.querySelectorAll('[data-dlg-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
    // Clicking the backdrop closes it. The check is on the dialog itself being
    // the click target, which only happens outside the inner panel.
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });
}

function initBookPage() {
  const form = document.querySelector('[data-book-form]');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  ['checkin', 'checkout', 'adults', 'children', 'infants', 'extrabed', 'nationality'].forEach((key) => {  // room is handled by initRoomChooser
    const field = form.querySelector(`[name="${key}"]`);
    if (field && params.get(key)) field.value = params.get(key);
  });
  if (params.get('dates') === 'flexible') {
    const flex = form.querySelector('input[name="dates"][value="flexible"]');
    if (flex) flex.checked = true;
  }

  /* ⚠️ Re-floor AFTER the prefill. initDateRanges() has already run and set the
     floors from empty fields; arriving from the homepage bar with dates in the
     query string fills them without firing `change`, so nothing recomputes.
     Landing here with 10–14 November left departure's floor on today, and the
     picker offered every date back to this morning. Setting a date field from
     script never fires an event — whatever depends on that value has to be
     re-run by hand. */
  applyDateFloors(form);

  /* The transport request, in words rather than a field name. It is the one
     answer here the resort has to act on separately from the room. */
  const transferLine = () => {
    const on = form.querySelector('[data-transfer]')?.checked;
    if (!on) return null;
    const route = form.querySelector('input[name="transfer_route"]:checked')?.value;
    const named = { 'bus-ferry': 'Boonsiri bus + ferry',
                    'minivan-ferry': 'private minivan + ferry',
                    'either': 'no preference — please recommend' }[route];
    return `Transport from Bangkok: YES, please quote${named ? ` (${named})` : ''}`;
  };

  /* ⚠️ ONE list of [label, value] pairs, and it feeds BOTH paths — the fields
     Web3Forms renders in the notification email, and the plain-text body of the
     mailto fallback. It used to be `new FormData(form)` plus a composed
     `message`, which mailed the raw control values AND the readable summary:
     reception read "bali-house-sea-view", "dk", "bus-ferry", "flexible". A
     booking enquiry is read by a person, so it says what the website says.
     Web3Forms turns underscores into spaces and capitalises, so `Extra_bed`
     arrives as "Extra bed"; `name` and `email` stay lowercase because the
     service reads those two itself — `email` becomes the reply-to address. */
  const compose = () => {
    const get = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const optionText = (n) => {
      const el = form.querySelector(`[name="${n}"]`);
      return el && el.selectedOptions && el.selectedOptions[0] ? el.selectedOptions[0].text : '';
    };
    const day = (iso) => {
      const d = new Date(iso + 'T00:00:00Z');
      return isNaN(d) ? iso : d.toLocaleDateString('en-GB',
        { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    };
    const nights = (() => {
      const a = get('checkin'), b = get('checkout');
      if (!a || !b) return 0;
      return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
    })();

    const room = chosenRoom(form);
    const flexible = form.querySelector('input[name="dates"]:checked')?.value === 'flexible';
    const ad = Number(get('adults') || 0), ch = Number(get('children') || 0), inf = Number(get('infants') || 0);
    const who = [`${ad} adult${ad === 1 ? '' : 's'}`];
    if (ch) who.push(`${ch} child${ch === 1 ? '' : 'ren'} (2–12)`);
    if (inf) who.push(`${inf} infant${inf === 1 ? '' : 's'} (under 2)`);

    const wantsTransfer = form.querySelector('[data-transfer]')?.checked;
    const routeName = {
      'bus-ferry': 'Boonsiri bus + ferry',
      'minivan-ferry': 'Private minivan + ferry',
      'either': 'No preference — please recommend one',
    }[form.querySelector('input[name="transfer_route"]:checked')?.value];
    const country = optionText('nationality');

    const fields = [
      ['Room', room.id ? `${room.label}${room.price ? ` — from ${room.price} THB per night` : ''}`
                       : 'Not chosen yet — please recommend one'],
      ['Arrival', get('checkin') ? day(get('checkin')) : 'not given'],
      ['Departure', get('checkout') ? day(get('checkout')) : 'not given'],
      ['Nights', nights > 0 ? String(nights) : null],
      ['Dates', flexible ? 'Flexible by 2–3 days either way' : 'Fixed'],
      ['Guests', who.join(', ')],
      ['Extra_bed', get('extrabed') === 'yes' ? 'Yes, please' : 'No'],
      ['Transport_from_Bangkok', wantsTransfer
        ? `Yes, please quote${routeName ? ` — ${routeName}` : ''}`
        : 'Not requested'],
      ['Country', country && country !== 'Select a country' ? country : 'not given'],
      ['Phone', get('phone') || 'not given'],
      ['Message', get('message') || '—'],
    ].filter(([, v]) => v !== null);

    const body = [`Name: ${get('name') || 'not given'}`, `Email: ${get('email') || 'not given'}`, '']
      .concat(fields.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`))
      .join('\n');

    return { fields, body, subject: `Booking enquiry — ${room.label}` };
  };

  const fallbackToMail = ({ subject, body }) => {
    window.location.href = `mailto:${RESORT_EMAIL}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;
    showEnquirySent(form, subject, body, 'booking-enquiry', false);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    /* ⚠️ preventDefault means the browser's own validation no longer guards the
       send — it runs before this event, and a programmatic submit skips it
       entirely. An enquiry with a departure before the arrival went straight
       through. reportValidity() re-runs every constraint, focuses the first
       offender and shows the browser's own message, in the visitor's language.
       Every required field lives in a section that is open at this point, so
       there is nothing it cannot focus. */
    if (!form.reportValidity()) return;
    const { subject, body, fields } = compose();
    const key = form.querySelector('[name="access_key"]')?.value.trim();

    if (!key) { fallbackToMail({ subject, body }); return; }

    const btn = form.querySelector('button[type="submit"]');
    const restore = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      // Built by hand, not from the form: only what a person should read.
      const data = new FormData();
      data.set('access_key', key);
      data.set('subject', subject);
      data.set('from_name', form.querySelector('[name="from_name"]')?.value || 'Koh Kood Beach Resort website');
      data.set('name', form.querySelector('[name="name"]')?.value.trim() || '');
      data.set('email', form.querySelector('[name="email"]')?.value.trim() || '');
      fields.forEach(([k, v]) => data.set(k, v));
      const res = await fetch(form.dataset.endpoint, { method: 'POST', body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || 'send failed');
      showEnquirySent(form, subject, body, 'booking-enquiry', true);
    } catch (err) {
      // The backend is the better path, not the only one. If it is down or the
      // key is wrong, the visitor still gets their enquiry out.
      if (btn) { btn.disabled = false; btn.innerHTML = restore; }
      fallbackToMail({ subject, body });
    }
  });
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const compose = () => {
    const get = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const body = [
      `Name: ${get('name') || 'not given'}`,
      `Email: ${get('email') || 'not given'}`,
      get('phone') ? `Phone: ${get('phone')}` : null,
      '',
      get('message'),
    ].filter((l) => l !== null).join('\n');
    return { body, subject: 'Message from the resort website' };
  };

  const fallbackToMail = ({ subject, body }) => {
    window.location.href = `mailto:${RESORT_EMAIL}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;
    showEnquirySent(form, subject, body, 'contact-message', false);
  };

  // Same pattern as initBookPage(): a real POST if a backend is configured,
  // mailto as the fallback if it isn't or fails. Kept as two copies rather
  // than one shared function — the two forms compose different bodies and
  // the duplication is small enough that a shared abstraction would cost
  // more to read than it saves.
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    /* ⚠️ preventDefault means the browser's own validation no longer guards the
       send — it runs before this event, and a programmatic submit skips it
       entirely. An enquiry with a departure before the arrival went straight
       through. reportValidity() re-runs every constraint, focuses the first
       offender and shows the browser's own message, in the visitor's language.
       Every required field lives in a section that is open at this point, so
       there is nothing it cannot focus. */
    if (!form.reportValidity()) return;
    const { subject, body } = compose();
    const key = form.querySelector('[name="access_key"]')?.value.trim();

    if (!key) { fallbackToMail({ subject, body }); return; }

    const btn = form.querySelector('button[type="submit"]');
    const restore = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const data = new FormData(form);
      data.set('subject', subject);
      data.set('message', body);
      const res = await fetch(form.dataset.endpoint, { method: 'POST', body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || 'send failed');
      showEnquirySent(form, subject, body, 'contact-message', true);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.innerHTML = restore; }
      fallbackToMail({ subject, body });
    }
  });
}

/* Cookie consent. Two tools load on "accept" and nothing loads before it:
   the Meta Pixel and GA4. ⚠️ Both are named individually in contact.html's
   privacy section, which is a factual claim about what this site does — add
   or remove a tool here and that section has to change in the same pass. */
const CONSENT_KEY = 'kkbr_consent';
const CONSENT_MAX_AGE_DAYS = 365;

/* A stored choice is a JSON {value, ts}, not a bare string — so it can expire.
   A "yes" from a year ago isn't consent given today; re-asking after a year
   is standard regulator guidance (Datatilsynet included), not a design choice
   we're free to skip. */
function readConsent() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONSENT_KEY));
    if (!raw || !raw.value || !raw.ts) return null;
    const ageDays = (Date.now() - raw.ts) / 86400000;
    if (ageDays > CONSENT_MAX_AGE_DAYS) return null;
    return raw.value;
  } catch (err) {
    return null;
  }
}

function writeConsent(value) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, ts: Date.now() }));
}

/* Renders the bar and wires its two buttons. Called on first visit, once
   stored consent expires, and any time the visitor reopens it from the
   "Cookie settings" link in the footer — withdrawing has to be exactly as
   easy as agreeing was, on every page, not just the one it was given on. */
function showConsentBar() {
  document.querySelector('.consent')?.remove();

  const bar = document.createElement('div');
  bar.className = 'consent';
  bar.innerHTML = `
    <p>We use cookies to understand how guests use this site. Marketing cookies stay off until you agree — see our <a href="contact.html#privacy">privacy and cookies note</a>.</p>
    <div class="consent__actions">
      <button type="button" class="btn btn--ghost" data-consent="decline">Decline</button>
      <button type="button" class="btn" data-consent="accept">Accept</button>
    </div>`;
  document.body.appendChild(bar);

  bar.querySelectorAll('[data-consent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      writeConsent(btn.dataset.consent);
      if (btn.dataset.consent === 'accept') { loadMetaPixel(); loadGoogleAnalytics(); }
      // window.gtag?.('consent', 'update', {
      //   analytics_storage:   btn.dataset.consent === 'accept' ? 'granted' : 'denied',
      //   ad_storage:          btn.dataset.consent === 'accept' ? 'granted' : 'denied',
      //   ad_user_data:        btn.dataset.consent === 'accept' ? 'granted' : 'denied',
      //   ad_personalization:  btn.dataset.consent === 'accept' ? 'granted' : 'denied',
      // });
      bar.remove();
    });
  });
}

function initConsent() {
  const stored = readConsent();
  if (stored === 'accept') { loadMetaPixel(); loadGoogleAnalytics(); }
  if (!stored) showConsentBar();

  /* The footer's "Cookie settings" link exists on all 12 pages, so this is
     never a no-op query — it reopens the bar with the current choice already
     reflected in whichever button the visitor clicks next. */
  document.querySelectorAll('[data-cookie-settings]').forEach((btn) => {
    btn.addEventListener('click', showConsentBar);
  });
}

/* The marquee needs its content duplicated so the -50% keyframe loops seamlessly. */
function initMarquee() {
  document.querySelectorAll('.marquee__track').forEach((track) => {
    track.innerHTML += track.innerHTML;
  });
}


/* Land on the right section when the page is opened at a fragment.
   Arriving at accommodation.html#bali-house was leaving the visitor at the top
   of the page: the browser resolves the fragment while the document is still
   growing — lazy images, the web font — so the offset it scrolls to is stale by
   the time layout settles, and `scroll-behavior: smooth` means the attempt is
   an animation that simply ends in the wrong place. The homepage room slider
   links in this way, so the fix matters beyond this page.
   Re-running it after `load` puts the visitor where the link promised. */
function initHashLanding() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  const land = () => target.scrollIntoView({ behavior: 'auto', block: 'start' });
  land();
  window.addEventListener('load', () => requestAnimationFrame(land), { once: true });
}


/* The three bungalow styles, one at a time.

   The countdown line IS the timer. It used to be a separate setInterval running
   alongside the CSS animation, and the two drifted: hovering paused the line but
   restarting the interval on mouseleave gave the slide a fresh full duration, so
   the line would finish with the picture still sitting there. Advancing on the
   line's own animationend makes them one clock by construction, and
   animation-play-state handles pausing for free.

   Duration lives in --rs-dur on .rs so the CSS owns it outright. */
function initRoomSlider2() {
  const root = document.querySelector('[data-roomslider]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('[data-rs-slide]'));
  const tabs = Array.from(root.querySelectorAll('[data-rs-tab]'));
  if (slides.length < 2) return;

  const still = document.documentElement.classList.contains('no-motion');
  const holds = { hover: false, focus: false, hidden: document.hidden };
  let i = 0;

  const bar = () => tabs[i] && tabs[i].querySelector('[data-rs-bar]');

  const armBar = () => {
    const el = bar();
    if (!el) return;
    // Replacing the node is what restarts the animation; re-selecting the same
    // tab would otherwise leave a finished animation in place and never fire
    // animationend again.
    const fresh = el.cloneNode(false);
    el.replaceWith(fresh);
    fresh.addEventListener('animationend', () => { if (!still) show(i + 1); }, { once: true });
  };

  function show(next) {
    i = (next + slides.length) % slides.length;
    slides.forEach((s, n) => {
      const on = n === i;
      s.classList.toggle('is-on', on);
      if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
    });
    tabs.forEach((t, n) => t.setAttribute('aria-selected', String(n === i)));
    armBar();
  }

  const held = () => holds.hover || holds.focus || holds.hidden;
  const sync = () => root.classList.toggle('is-held', held());
  const hold = (key, on) => { holds[key] = on; sync(); };

  tabs.forEach((tab, n) => {
    tab.addEventListener('click', () => show(n));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const to = (n + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[to].focus();
      show(to);
    });
  });

  root.addEventListener('mouseenter', () => hold('hover', true));
  root.addEventListener('mouseleave', () => hold('hover', false));
  root.addEventListener('focusin', () => hold('focus', true));
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) hold('focus', false);
  });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));

  sync();
  show(0);
}

/* The photo viewer inside an unfolded room panel: arrows on the large picture,
   and a thumbnail strip under the details that scrolls in one line. */
function initRoomGalleries() {
  document.querySelectorAll('[data-gallery]').forEach((gal) => {
    const frames = Array.from(gal.querySelectorAll('[data-gal-frame]'));
    if (frames.length < 2) {
      gal.querySelectorAll('.viewer__arrow').forEach((b) => { b.hidden = true; });
      return;
    }
    const strip = gal.closest('.panel').querySelector('.strip');
    const thumbs = strip ? Array.from(strip.querySelectorAll('[data-gal-go]')) : [];
    const count = gal.querySelector('[data-gal-count]');
    let at = 0;

    const go = (next) => {
      at = (next + frames.length) % frames.length;
      frames.forEach((f, n) => { f.hidden = n !== at; });
      thumbs.forEach((t, n) => t.classList.toggle('is-on', n === at));
      if (count) count.textContent = `${at + 1} / ${frames.length}`;
      // Keep the active thumbnail in view without yanking the page around it.
      const thumb = thumbs[at];
      if (thumb && strip) {
        const l = thumb.offsetLeft, r = l + thumb.offsetWidth;
        if (l < strip.scrollLeft || r > strip.scrollLeft + strip.clientWidth) {
          strip.scrollTo({ left: l - 12, behavior: 'smooth' });
        }
      }
    };

    gal.querySelector('[data-gal-prev]')?.addEventListener('click', () => go(at - 1));
    gal.querySelector('[data-gal-next]')?.addEventListener('click', () => go(at + 1));
    thumbs.forEach((t, n) => t.addEventListener('click', () => go(n)));
    gal.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1); }
    });
  });
}

/* "See more" on a room card unfolds that room's detail below the row. One shared
   panel region rather than three, so opening a second room swaps the contents
   instead of stacking another open block down the page.

   The height is measured and animated in pixels. The tidier
   grid-template-rows 0fr -> 1fr does not interpolate in every engine — here it
   jumped to full height with no motion — so the panel is measured, frozen at its
   current height, and transitioned to the new one. After the transition it is
   released to auto so it can reflow if the viewport changes. */
function initRoomDetail() {
  const region = document.querySelector('[data-detail]');
  if (!region) return;

  const inner = region.querySelector('.detail__inner');
  const buttons = Array.from(document.querySelectorAll('[data-expand]'));
  const panels = Array.from(region.querySelectorAll('[data-panel]'));
  if (!buttons.length || !panels.length || !inner) return;

  const still = document.documentElement.classList.contains('no-motion');
  let open = null;

  const setLabel = (btn, isOpen) => {
    const label = btn.querySelector('.cat__more-label');
    if (label) label.textContent = isOpen ? 'See less' : 'See more';
    btn.setAttribute('aria-expanded', String(isOpen));
    const card = btn.closest('.cat');
    if (card) card.classList.toggle('is-open', isOpen);
  };

  const freeze = () => { region.style.height = region.offsetHeight + 'px'; };

  /* Runs fn when the height transition finishes — or on a timer if it never
     reports. transitionend does not fire when the value did not actually change,
     and some environments never advance transitions at all; without the fallback
     the panel would be left frozen at a pixel height, or stuck open with its
     contents still in the accessibility tree. */
  const afterHeight = (fn) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      region.removeEventListener('transitionend', onEnd);
      fn();
    };
    const onEnd = (e) => { if (e.propertyName === 'height') finish(); };
    region.addEventListener('transitionend', onEnd);
    setTimeout(finish, 700);                       // transition is 520ms
  };

  const settle = (to) => {
    if (still) { region.style.height = to === 0 ? '0px' : 'auto'; return; }
    void region.offsetHeight;                     // flush before the new value
    region.style.height = to + 'px';
    if (to === 0) return;
    // Release to auto once open, so a resize or a font swap cannot leave the
    // panel clipped at a stale pixel height.
    afterHeight(() => { if (open) region.style.height = 'auto'; });
  };

  const showPanel = (id) => {
    panels.forEach((p) => { p.hidden = p.dataset.panel !== id; });
    buttons.forEach((b) => setLabel(b, b.dataset.expand === id));
  };

  const openFor = (id) => {
    freeze();
    showPanel(id);
    open = id;
    settle(inner.offsetHeight);
  };

  const close = () => {
    freeze();
    buttons.forEach((b) => setLabel(b, false));
    open = null;
    settle(0);
    if (still) panels.forEach((p) => { p.hidden = true; });
    else afterHeight(() => { if (open === null) panels.forEach((p) => { p.hidden = true; }); });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.expand;
      if (open === id) close(); else openFor(id);
    });
  });

  // The slider's CTA opens the matching room rather than only jumping to it.
  document.querySelectorAll('[data-rs-see]').forEach((a) => {
    a.addEventListener('click', () => {
      if (open !== a.dataset.rsSee) openFor(a.dataset.rsSee);
    });
  });

  /* Arriving with a house in the hash — the homepage's "Learn more" links this
     way — opens that house's panel, so nobody lands on the card only to have
     to click once more for what they came for. initHashLanding() has already
     put the card at the top; the panel unfolds beneath it. */
  const fromHash = decodeURIComponent(window.location.hash.slice(1));
  if (fromHash && buttons.some((b) => b.dataset.expand === fromHash)) openFor(fromHash);
}

/* ==========================================================================
   The Journey — scroll-drawn route (index.html)
   --------------------------------------------------------------------------
   This is the one place in the file that genuinely needs a scroll POSITION
   rather than an IntersectionObserver. IO answers "is it on screen"; this needs
   "how far through it are we", continuously, to place a vehicle on a path. So
   it follows the same exception initRoomNav() already makes: a passive scroll
   listener that only ever schedules a rAF, and the rAF does the writing.

   It does not lock the scroll. The pin is CSS `position: sticky` (see the block
   in style.css) — the browser scrolls normally throughout and this function
   only reads where it got to. Nothing here calls preventDefault.

   Below 820px, and under prefers-reduced-motion, the stage is not sticky at all
   and settle() paints the finished drawing once. Both breakpoints are matched
   here and in the stylesheet; if you move one, move the other.
   ========================================================================== */
function initRoute() {
  const root = document.querySelector('[data-route]');
  if (!root) return;

  const stage = root.querySelector('.route__stage');
  const stops = [...root.querySelectorAll('.route__stop')];
  const glyphs = [...root.querySelectorAll('.route__glyph')];
  const steps = [...root.querySelectorAll('.route__step')];
  const geo = [...root.querySelectorAll('[data-geo]')];
  const fades = [...root.querySelectorAll('[data-fade]')];   // the land tints

  // Prepare every drawable line: dash the whole length, then hide it by
  // offsetting a full length. Doing this in JS rather than CSS is what keeps
  // the no-JS page showing a complete drawing instead of an empty photograph.
  // ⚠️ A LIST, not an object keyed by name. Several paths legitimately share a
  // key — Thailand and Koh Kood are both `coast` and draw on together — and a
  // dict silently kept only the last one. The country was left at a full dash
  // offset and simply never appeared; the tint underneath it was the only
  // reason the shape showed at all, which made it look like a styling problem.
  const lines = [];
  root.querySelectorAll('[data-draw]').forEach((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = String(len);
    lines.push({ key: el.dataset.draw, el, len });
  });

  const draw = (key, t) => {
    lines.forEach((l) => {
      if (l.key === key) l.el.style.strokeDashoffset = String(l.len * (1 - t));
    });
  };

  // Progress windows. One per leg, in the order the journey happens, so each of
  // the three steps below the photograph has a leg of its own being drawn while
  // it is the marked one. The coastline and island are only the stage being
  // set, so they are over quickly.
  const SEG = {
    map:  [0.02, 0.18],
    leg0: [0.18, 0.46],
    leg1: [0.48, 0.76],
    leg2: [0.78, 0.94],
  };
  const STOP_AT = [0.15, 0.45, 0.75, 0.93];

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const span = (p, [a, b]) => clamp01((p - a) / (b - a));

  // Ride a glyph along its path. getPointAtLength is exact for the curve, so
  // the vehicle sits ON the line rather than on a straight-line approximation
  // between its endpoints.
  const ride = (i, t, visible) => {
    const g = glyphs[i];
    const path = geo[i];
    if (!g || !path) return;
    g.style.opacity = visible ? '1' : '0';
    if (!visible) return;
    const pt = path.getPointAtLength(path.getTotalLength() * t);
    g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
  };

  const paint = (p) => {
    const m = span(p, SEG.map);
    draw('coast', m);
    draw('isle', m);
    fades.forEach((el) => { el.style.opacity = String(m); });

    const legs = [span(p, SEG.leg0), span(p, SEG.leg1), span(p, SEG.leg2)];
    legs.forEach((t, i) => {
      draw(`leg${i}`, t);
      // The vehicle leaves once its leg is drawn — a bus parked at the pier for
      // the rest of the scroll reads as a bug, not as an arrival.
      ride(i, t, t > 0 && t < 1);
    });

    stops.forEach((s, i) => { s.style.opacity = p >= STOP_AT[i] ? '1' : '0'; });

    steps.forEach((s, i) => {
      s.style.setProperty('--fill', String(legs[i]));
      s.classList.toggle('is-lit', legs[i] > 0.02);
    });
  };

  // Everything drawn, every stop named, no vehicles mid-journey.
  const settle = () => {
    lines.forEach((l) => { l.el.style.strokeDashoffset = '0'; });
    stops.forEach((s) => { s.style.opacity = '1'; });
    fades.forEach((el) => { el.style.opacity = '1'; });
    glyphs.forEach((g) => { g.style.opacity = '0'; });
    steps.forEach((s) => { s.style.setProperty('--fill', '1'); s.classList.add('is-lit'); });
  };

  // Matches the stylesheet's two un-pinning queries exactly: too narrow, or
  // too short for a pinned stage to hold its own content. Change one, change
  // the other, or the drawing is left half-finished in a band that never pins.
  const pinned = window.matchMedia('(min-width: 821px) and (min-height: 561px)');
  const isLive = () => pinned.matches && !document.documentElement.classList.contains('no-motion');

  let ticking = false;
  const read = () => {
    ticking = false;
    if (!isLive()) return;
    const box = root.getBoundingClientRect();
    // Distance the stage is actually pinned for = the section's height minus
    // one stage. Guard the divide: a zero-height section (display:none, a print
    // stylesheet) would otherwise produce NaN and blank the drawing.
    const travel = root.offsetHeight - stage.offsetHeight;
    if (travel <= 0) { settle(); return; }
    paint(clamp01(-box.top / travel));
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(read);
  };

  const sync = () => { if (isLive()) onScroll(); else settle(); };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', sync);
  pinned.addEventListener('change', sync);
  sync();
}

/* ==========================================================================
   Where you'll stay — the plot from above (homepage)
   --------------------------------------------------------------------------
   Pinned and scroll-driven like the route map: the section is taller than the
   stage, the stage sticks, and progress through the extra height first shows
   the photograph on its own — the restaurant circling itself — then picks a
   house and draws its circle. Reads scroll on rAF for the same reason
   initRoute() does: this needs "how far", not "is it on screen".
   ⚠️ The preview pane cannot exercise this: document.hidden is true there and
   rAF never runs. Verify with headless Chrome. Markup: scratchpad/build_plot.py.
   ========================================================================== */
function initPlot() {
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
  // must agree with the un-pinning media queries in style.css
  const pinned = () => matchMedia('(min-width: 821px) and (min-height: 561px)').matches
                      && !document.documentElement.classList.contains('no-motion');

  loops.forEach((l) => { const len = l.getTotalLength(); l.dataset.len = len; l.style.strokeDasharray = len; l.style.strokeDashoffset = len; });
  const stepIds = [-1, ...cards.map((_, i) => i)];      // -1: the opening beat and its landmark
  const byStep = stepIds.map((k) => loops.filter((l) => +l.dataset.loop === k));

  let current = null;
  function show(i) {                                    // i = -1 is the opening beat: no house yet
    if (i === current) return;
    current = i;
    lead.classList.toggle('is-on', i < 0);
    side.classList.toggle('is-houses', i >= 0);
    cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
    tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); });
  }
  function draw(i, t) {
    byStep.forEach((group, idx) => group.forEach((l, j) => {
      const k = stepIds[idx];
      const len = +l.dataset.len;
      const tj = k < i ? 1 : k > i ? 0 : Math.min(1, Math.max(0, t * group.length - j));   // several strokes per step draw in turn
      l.style.strokeDashoffset = len * (1 - tj);
      l.classList.toggle('is-on', k === i); l.classList.toggle('is-past', k < i);
    }));
    // two label sets share each step (desktop and phone positions) — read the step off the element, never the array index
    marks.forEach((m) => { const k = +m.dataset.label; m.classList.toggle('is-on', k === i && t > 0.55); m.classList.toggle('is-past', k < i); });
  }
  function settle() {                                    // unpinned: everything drawn, every house shown, the lead in the flow
    root.style.height = '';
    loops.forEach((l) => { l.style.strokeDashoffset = 0; l.classList.add('is-on'); l.classList.remove('is-past'); });
    marks.forEach((m) => { m.classList.add('is-on'); m.classList.remove('is-past'); });
    cards.forEach((c) => c.classList.add('is-on'));
    lead.classList.add('is-on');
    current = null;
  }
  function layout() {
    // the SVG has to crop exactly as the photograph does, or the circles drift off the huts
    overlay.setAttribute('preserveAspectRatio', matchMedia('(max-width: 820px)').matches ? 'xMaxYMax slice' : 'xMidYMax slice');
    if (!pinned()) return settle();
    root.style.height = `calc((100vh - ${navH()}px) + ${(N + INTRO) * STEP_VH * 100}vh)`;
    current = null;
    update();
  }
  function update() {
    if (!pinned()) return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const y = Math.min(Math.max(navH() - root.getBoundingClientRect().top, 0), travel);
    const seg = (travel ? y / travel : 1) * (N + INTRO) - INTRO;
    if (seg < 0) { show(-1); draw(-1, Math.min(1, (seg + INTRO) / (INTRO * 0.7))); return; }   // the landmark draws through the opening beat
    const i = Math.min(N - 1, Math.floor(seg));
    const t = Math.min(1, (seg - i) / DRAW);
    show(i); draw(i, t);
  }
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  window.addEventListener('resize', layout);
  // a viewport can cross the pin threshold without a resize event reaching us — the media queries are the reliable signal
  ['(min-width: 821px)', '(min-height: 561px)', '(max-width: 820px)'].forEach((q) => matchMedia(q).addEventListener('change', layout));
  tabs.forEach((tab, k) => tab.addEventListener('click', () => {
    if (!pinned()) return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const top = root.getBoundingClientRect().top + scrollY - navH() + travel * (INTRO + k + DRAW * 0.9) / (N + INTRO);
    window.scrollTo({ top, behavior: 'smooth' });
  }));
  layout();
}
