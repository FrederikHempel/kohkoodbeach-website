# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Couples and families, predominantly Scandinavian, planning a stay of about a week
at a small island resort in Thailand. They arrive at the site already interested
— usually from search, a recommendation, TripAdvisor, or the resort's own social
channels — and are deciding between this resort and one or two others. They will
travel roughly seven hours from Bangkok to get here (bus to Laem Sok, ferry to
Ao Salad, pickup), so the decision is deliberate, not impulsive. They book
direct, by email, and expect a human reply.

*(Audience confirmed by Frederik on 4 Sep 2026: "din læsning er korrekt".)*

## Product Purpose

The website exists to turn interest into a direct booking enquiry — a dated,
named email conversation with the front desk — for Koh Kood Beach Resort, a
19-bungalow beach resort at Hat Taphao on the west coast of Koh Kood, Trat,
inside the Koh Chang Marine Park. There is no booking engine and no online
payment; the enquiry *is* the product's conversion, and the reply promise is
within 24 hours, usually the same day.

## Positioning

A quiet, unspoiled, family-run beach resort that is deliberately hard to reach:
the seven-hour journey is what keeps the island the way it is. Bali-style
bungalows on stilts among coconut palms, a private beach, a pool, and staff who
have looked after guests for years. It sells calm and directness — you talk to
the people who run it — not luxury, scarcity, or urgency. "Only 19 rooms" and
similar pressure framing are explicitly rejected.

## Operating Context

- Static site, hosted on GitHub Pages from a public repo; staging at
  `kohkoodbeach.com` (noindex) ahead of a move to `kohkoodbeachresorts.com`.
- Enquiries go to `reservation@kohkoodbeachresorts.com`. The form POSTs to
  Web3Forms once an access key exists; until then it falls back to a mailto
  draft. Frederik is obtaining the key from whoever administers that mailbox.
- Rates are quoted "from" in THB and confirmed on enquiry; they move with the
  season. No currency conversion is ever shown.
- The recommended route is Boonsiri bus + ferry; the resort can also arrange a
  private minivan + ferry, with about 30 days' notice in high season.
- The site's owner reviews each page in a critique round and decides.

## Capabilities and Constraints

- Three bungalow styles — Bali House (garden / partial sea / partial sea twin /
  sea view, from 2,900 THB), Bali Deluxe (partial sea view, from 5,500 THB),
  Thai Twin House (garden / partial sea / sea view, from 7,000 THB). Views are
  named and described in words; the photography cannot show the difference
  between views and must not be captioned as if it does.
- Plain HTML, CSS and vanilla JS. No framework, no build step, no npm. A set of
  Python generator scripts in `scratchpad/` produce repeated markup from a single
  source (rooms from `accommodation.html`, the route map from OSM data).
- Guests are entered as adults (13+), children (2–12), infants (under 2), plus an
  optional extra bed. Dates, guests, name, email and country are required; phone
  is optional.
- Terminology: "bungalow" and "house" (not "room type"); "enquiry" (not
  "booking", since nothing is confirmed until the resort replies); "Book direct".
- Undecided: the name of the resort's own bay (a "Bang Bao Bay" caption was
  removed because nobody could confirm it); whether a video hero ships sitewide
  or only on the booking page.

## Brand Commitments

- Name: Koh Kood Beach Resort. Logo files in `assets/logo/` carry the line
  "Sense of true happiness"; the homepage hero now says "Stay closer to nature"
  — a knowing choice by the owner, not an oversight.
- Voice: warm, plain, unhurried, first person plural ("we meet you at the pier").
  No scarcity, no exclamation marks, no invented claims.
- Photography is the resort's own; the drone footage in
  `assets/hero-carousel/New/` and `../For SoMe/Fra Simon/` is real and usable.
- The typefaces (Fraunces, Work Sans), palette (charcoal / warm-white / sand /
  gold) and the footer illustration are settled and binding.

## Evidence on Hand

- TripAdvisor: 4.3/5 from 331 reviews (the only confirmed rating; there is no
  Google rating — do not invent one). Two paraphrased reviews are in use (Gina B,
  Nov 2025; Diveguy70, Jan 2026); reviews stay paraphrased, never quoted.
- Real transport facts and timetables from boonsiriferry.com, on
  `getting-here.html`.
- Real geocodes for the resort (11.6672, 102.5345), Laem Sok pier, Ao Salad.
- Photography: Bali House and Bali Deluxe have 2000×1500 frames; **the Thai
  Twin House has nothing above 750×500** — a known gap only a photographer fixes.
- 4K drone clips (3840×2160 pool pull-back, 15 s; portrait clips of the resort
  from the sea).

## Product Principles

1. The enquiry is the conversion. Every page ends up at it, and the page that
   takes it must feel like starting a conversation, not filling in a database.
2. Say only what is true and confirmable. A real number beats a persuasive one;
   an absence is stated, not filled.
3. Calm over urgency. This audience is inoculated against pressure; the resort's
   quietness is the offer.
4. Photography is the product. Where it is strong, let it lead; where it is
   weak (Thai Twin), don't pretend.
5. One source for each fact. Rooms, prices and routes are generated from one
   place so pages cannot disagree.

## Accessibility & Inclusion

WCAG AA as the floor: measured text contrast on every new surface, keyboard
operability of all controls (native elements preferred — `<details>`,
`<dialog>`, `<fieldset>`), `prefers-reduced-motion` honoured by reducing rather
than removing, and no information carried by colour alone.
