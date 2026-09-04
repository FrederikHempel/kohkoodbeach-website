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
  initRoomSlider();
  initAccordion();
  initGalleryTabs();
  initLightbox();
  initHashLanding();
  initRoomSlider2();
  initRoomDetail();
  initRoomGalleries();
  initBookHero();
  initFlow();
  initRoomChooser();
  initRoomDialogs();
  initBookPage();
  initContactForm();
  initConsent();
  initMarquee();
  initRoute();
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
  sentinel.style.cssText = 'position:absolute;top:0;height:70vh;width:1px;pointer-events:none;';
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
  if (window.ResizeObserver) new ResizeObserver(set).observe(nav);
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
function initRoomSlider() {
  const root = document.querySelector('[data-rooms]');
  if (!root) return;

  const rooms = Array.from(root.querySelectorAll('[data-room]')).map((el) => ({
    image: el.dataset.image,
    name: el.dataset.name,
    desc: el.dataset.desc,
    href: el.dataset.href,
    price: el.dataset.price || '',
  }));
  if (!rooms.length) return;

  const img = root.querySelector('[data-room-img]');
  const name = root.querySelector('[data-room-name]');
  const desc = root.querySelector('[data-room-desc]');
  const link = root.querySelector('[data-room-link]');
  const price = root.querySelector('[data-room-price]');
  const count = root.querySelector('[data-room-count]');
  const peek = root.querySelector('[data-room-peek]');
  const peekName = root.querySelector('[data-room-peek-name]');
  let i = 0;

  const render = (next) => {
    i = (next + rooms.length) % rooms.length;
    const room = rooms[i];

    img.classList.add('is-swapping');
    const swap = new Image();
    swap.src = room.image;
    const apply = () => {
      img.src = room.image;
      img.alt = room.name;
      img.classList.remove('is-swapping');
    };
    swap.complete ? setTimeout(apply, 220) : swap.addEventListener('load', () => setTimeout(apply, 220));

    if (name) name.textContent = room.name;
    if (desc) desc.textContent = room.desc;
    if (link) link.href = room.href;
    if (price) price.textContent = room.price;
    if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')}`;

    // The sliver on the right always shows whichever room comes next.
    if (peek) {
      const upcoming = rooms[(i + 1) % rooms.length];
      peek.src = upcoming.image;
      if (peekName) peekName.textContent = upcoming.name;
    }
  };

  root.querySelectorAll('[data-room-prev]').forEach((b) => b.addEventListener('click', () => render(i - 1)));
  root.querySelectorAll('[data-room-next]').forEach((b) => {
    b.addEventListener('click', () => render(i + 1));
    // The peek is a <figure>, not a <button>, so give it keyboard parity.
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); render(i + 1); }
    });
  });

  render(0);
}

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
   opened, and offer WhatsApp as the path that always works.
   ========================================================================== */

const RESORT_EMAIL = 'reservation@kohkoodbeachresorts.com';
const RESORT_WA = '66819088966';

/* Staging pixel for kohkoodbeach.com testing, kept separate from the pixel
   already live on kohkoodbeachresorts.com so clicks made while building this
   site don't mix into real campaign data. Swap to 876625588428207 (the
   production pixel) in the same pass as removing noindex at go-live — see
   CLAUDE.md under "Staging deploy on kohkoodbeach.com".
   4 Sep 2026: replaced 2040247273287344 — Frederik had created that one
   under the wrong ad account. This is "KKBR kohkoodbeach.com (correct
   pixel)", verified live on the Koh Kood Beach Resort business. */
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

  const wa = `https://wa.me/${RESORT_WA}?text=${encodeURIComponent(body)}`;

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
      <p>Reply to the confirmation landing in your inbox, or reach the front desk directly on
         <a class="link" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>.</p>
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
         or send the same details on WhatsApp — that always works, on any phone.</p>
      <pre class="sent__copy" data-copy-body></pre>
      <div class="sent__actions">
        <button type="button" class="btn btn--ghost" data-copy>Copy the message</button>
        <a class="btn" href="${wa}" target="_blank" rel="noopener" data-wa>Send on WhatsApp</a>
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

  const waBtn = panel.querySelector('[data-wa]');
  if (waBtn) waBtn.addEventListener('click', () => trackEnquiry(kind + '-whatsapp'));

  form.replaceWith(panel);
  panel.focus();
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

/* Measured-height unfold. Shared by the steps and by each house's views:
   fr units do not interpolate in this engine, so a pixel height is what
   animates. The flush is a synchronous offsetHeight read — a rAF never runs in
   a throttled or backgrounded tab — and transitionend carries a timeout,
   because it does not fire when the value did not change. */
function unfold(region, open, still) {
  const inner = region.firstElementChild;
  if (still) { region.hidden = !open; region.style.height = open ? 'auto' : '0'; return; }

  // ⚠️ Generation token. Each call claims the region; the settle below only
  // acts if it is still the newest. Without it the 700ms fallback from an
  // EARLIER unfold fires later and undoes the current one — opening step 2 and
  // choosing a room inside 700ms left the rooms expanded again, because the
  // open-timeout set height back to `auto` after the collapse had run.
  const gen = (region._unfoldGen = (region._unfoldGen || 0) + 1);
  let settled = false;
  const settle = () => {
    if (settled || region._unfoldGen !== gen) return;
    settled = true;
    region.removeEventListener('transitionend', onEnd);
    if (open) region.style.height = 'auto';
    else region.hidden = true;
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

  const open = (name) => {
    steps.forEach((s) => {
      const body = s.querySelector('[data-step-body]');
      const is = s.dataset.step === name;
      s.classList.toggle('is-open', is);
      if (is === Boolean(body.hidden)) unfold(body, is, still);
    });
  };
  const markDone = (name, text) => {
    const s = byName(name); if (!s) return;
    const sum = s.querySelector('[data-step-sum]'), ch = s.querySelector('[data-step-change]');
    s.classList.add('is-done');
    if (sum) { sum.textContent = text; sum.hidden = false; }
    if (ch) ch.hidden = false;
  };
  const goto = (name) => {
    open(name);
    byName(name)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  };

  steps.forEach((s) => {
    const body = s.querySelector('[data-step-body]');
    const first = s.dataset.step === 'dates';
    body.hidden = !first;
    body.style.height = first ? 'auto' : '0';
    s.classList.toggle('is-open', first);
  });

  byName('dates').querySelector('[data-step-next]').addEventListener('click', () => {
    const err = byName('dates').querySelector('[data-step-err]');
    for (const f of [form.checkin, form.checkout]) {
      if (!f.value) { err.textContent = 'Please give both an arrival and a departure date.'; err.hidden = false; f.focus(); return; }
    }
    if (form.checkout.value <= form.checkin.value) {
      err.textContent = 'Departure has to be after arrival.'; err.hidden = false; form.checkout.focus(); return;
    }
    err.hidden = true;
    markDone('dates', datesSummary());
    goto('room');
  });

  steps.forEach((s) => {
    s.querySelector('[data-step-change]')?.addEventListener('click', () => {
      s.classList.remove('is-done');
      s.querySelector('[data-step-sum]').hidden = true;
      s.querySelector('[data-step-change]').hidden = true;
      goto(s.dataset.step);
    });
  });

  // Choosing a room finishes step 2 and opens step 3 — the rooms fold away and
  // the details take their place.
  form.querySelectorAll('input[name="room"]').forEach((r) => {
    r.addEventListener('change', () => {
      if (!r.checked) return;
      markDone('room', roomSummary());
      goto('you');
    });
  });

  form.addEventListener('input', () => {
    const s = byName('dates');
    if (s.classList.contains('is-done')) s.querySelector('[data-step-sum]').textContent = datesSummary();
  });

  window.__flow = { markDone, goto, roomSummary };
}

/* The houses inside step 2. "Choose this room" unfolds that house's views;
   picking one is a real radio change, which the flow above acts on. */
function initRoomChooser() {
  const form = document.querySelector('[data-book-form]');
  const houses = Array.from(document.querySelectorAll('.house'));
  if (!form || !houses.length) return;
  const still = document.documentElement.classList.contains('no-motion');

  const openHouse = (house) => {
    houses.forEach((h) => {
      const region = h.querySelector('[data-house-views]');
      const is = h === house;
      h.querySelector('[data-house-open]').setAttribute('aria-expanded', String(is));
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
      openHouse(radio.closest('.house'));
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

  // No enquiries for dates that have already passed, and departure must follow
  // arrival — the form used to accept both.
  const checkin = form.querySelector('[name="checkin"]');
  const checkout = form.querySelector('[name="checkout"]');
  const today = new Date().toISOString().slice(0, 10);
  if (checkin) {
    checkin.min = today;
    checkin.addEventListener('change', () => {
      if (!checkout) return;
      checkout.min = checkin.value || today;
      if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
    });
  }
  if (checkout) checkout.min = checkin?.value || today;

  const compose = () => {
    const get = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const or = (v, fallback) => (v === '' ? fallback : v);
    const natSelect = form.querySelector('[name="nationality"]');
    const nationality = natSelect?.selectedOptions[0]?.text || '';
    const flexible = form.querySelector('input[name="dates"]:checked')?.value === 'flexible';
    const guests = [
      `${or(get('adults'), '0')} adult(s)`,
      Number(get('children')) ? `${get('children')} child(ren) 2–12` : null,
      Number(get('infants')) ? `${get('infants')} infant(s) under 2` : null,
    ].filter(Boolean).join(', ');

    const body = [
      `Room: ${chosenRoom(form).label}`,
      `Arrival: ${or(get('checkin'), 'not given')}`,
      `Departure: ${or(get('checkout'), 'not given')}`,
      flexible ? 'Flexible: yes, by 2–3 days either way' : null,
      `Guests: ${guests}`,
      `Extra bed: ${or(get('extrabed'), 'no')}`,
      '',
      `Name: ${or(get('name'), 'not given')}`,
      `Email: ${or(get('email'), 'not given')}`,
      nationality && nationality !== 'Select a country' ? `Country: ${nationality}` : null,
      get('phone') ? `Phone: ${get('phone')}` : null,
      get('message') ? `\n${get('message')}` : null,
    ].filter((l) => l !== null).join('\n');

    return { body, subject: `Booking enquiry — ${chosenRoom(form).label}` };
  };

  const fallbackToMail = ({ subject, body }) => {
    window.location.href = `mailto:${RESORT_EMAIL}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;
    showEnquirySent(form, subject, body, 'booking-enquiry', false);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { subject, body } = compose();
    const key = form.querySelector('[name="access_key"]')?.value.trim();

    if (!key) { fallbackToMail({ subject, body }); return; }

    const btn = form.querySelector('button[type="submit"]');
    const restore = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const data = new FormData(form);
      data.set('subject', subject);
      data.set('message', body);          // one readable block, not 14 loose fields
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

/* Cookie consent scaffold. No analytics is wired up yet — when a GA4 property
   exists, uncomment the gtag consent call and load the tag after "accept". */
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
