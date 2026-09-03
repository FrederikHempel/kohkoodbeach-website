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
  initBookPage();
  initContactForm();
  initConsent();
  initMarquee();
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

  const hero = document.querySelector('.hero, .page-hero');
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
   CLAUDE.md under "Staging deploy on kohkoodbeach.com". */
const META_PIXEL_ID = '2040247273287344';

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
function showEnquirySent(form, subject, body, kind) {
  const panel = document.createElement('div');
  panel.className = 'sent';
  panel.setAttribute('role', 'status');
  panel.setAttribute('tabindex', '-1');

  const wa = `https://wa.me/${RESORT_WA}?text=${encodeURIComponent(body)}`;

  panel.innerHTML = `
    <span class="label">Almost there</span>
    <h2 class="sent__head">Your email is ready to send</h2>
    <p class="sent__lead">
      We have opened your email app with the enquiry filled in. <strong>Press send there</strong>
      and it reaches us — we reply within 24 hours, usually the same day (Thailand, GMT+7).
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

  // textContent, not innerHTML — the body contains whatever the visitor typed.
  panel.querySelector('[data-copy-body]').textContent = body;

  const copyBtn = panel.querySelector('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      copyBtn.textContent = 'Copied';
    } catch (err) {
      copyBtn.textContent = 'Select the text above to copy';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy the message'; }, 3000);
  });

  panel.querySelector('[data-wa]').addEventListener('click', () => trackEnquiry(kind + '-whatsapp'));

  form.replaceWith(panel);
  panel.focus();
  trackEnquiry(kind);
}

/* book.html — prefill from query params, then build the mailto on submit. */
function initBookPage() {
  const form = document.querySelector('[data-book-form]');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  ['room', 'checkin', 'checkout', 'adults', 'extrabed', 'nationality'].forEach((key) => {
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const get = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const or = (v, fallback) => (v === '' ? fallback : v);
    const roomSelect = form.querySelector('[name="room"]');
    const roomLabel = roomSelect?.selectedOptions[0]?.text || 'Not specified yet';
    const natSelect = form.querySelector('[name="nationality"]');
    const nationality = natSelect?.selectedOptions[0]?.text || '';
    const flexible = form.querySelector('input[name="dates"]:checked')?.value === 'flexible';

    const body = [
      `Room: ${roomLabel}`,
      `Arrival: ${or(get('checkin'), 'not given')}`,
      `Departure: ${or(get('checkout'), 'not given')}`,
      flexible ? 'Flexible: yes, by 2–3 days either way' : null,
      `Adults: ${or(get('adults'), 'not given')}`,
      `Extra bed: ${or(get('extrabed'), 'no')}`,
      '',
      `Name: ${or(get('name'), 'not given')}`,
      `Email: ${or(get('email'), 'not given')}`,
      nationality && nationality !== 'Select a country' ? `Country: ${nationality}` : null,
      get('phone') ? `Phone: ${get('phone')}` : null,
      get('message') ? `\n${get('message')}` : null,
    ].filter((l) => l !== null).join('\n');

    const subject = `Booking enquiry — ${roomLabel}`;
    window.location.href = `mailto:${RESORT_EMAIL}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;

    showEnquirySent(form, subject, body, 'booking-enquiry');
  });
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const get = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const body = [
      `Name: ${get('name') || 'not given'}`,
      `Email: ${get('email') || 'not given'}`,
      get('phone') ? `Phone: ${get('phone')}` : null,
      '',
      get('message'),
    ].filter((l) => l !== null).join('\n');
    const subject = 'Message from the resort website';
    window.location.href = `mailto:${RESORT_EMAIL}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;

    showEnquirySent(form, subject, body, 'contact-message');
  });
}

/* Cookie consent scaffold. No analytics is wired up yet — when a GA4 property
   exists, uncomment the gtag consent call and load the tag after "accept". */
function initConsent() {
  const stored = localStorage.getItem('kkbr_consent');
  if (stored === 'accept') loadMetaPixel();
  if (stored) return;

  const bar = document.createElement('div');
  bar.className = 'consent';
  bar.innerHTML = `
    <p>We use cookies to understand how guests use this site. Analytics stay off until you agree — see our <a href="contact.html">privacy note</a>.</p>
    <div class="consent__actions">
      <button type="button" class="btn btn--ghost" data-consent="decline">Decline</button>
      <button type="button" class="btn" data-consent="accept">Accept</button>
    </div>`;
  document.body.appendChild(bar);

  bar.querySelectorAll('[data-consent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      localStorage.setItem('kkbr_consent', btn.dataset.consent);
      if (btn.dataset.consent === 'accept') loadMetaPixel();
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
