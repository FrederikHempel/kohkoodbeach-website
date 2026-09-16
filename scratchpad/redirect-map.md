# kohkoodbeachresorts.com — omdirigeringskort

Klar til at indsættes i Cloudflare Redirect Rules (Bulk Redirects), den dag
DNS flyttes dertil. Bygget fra den live sides egen `sitemap.xml`, hentet
16. sep 2026 — 60 indekserede URL'er, alle `.php`.

**Hvorfor Cloudflare og ikke bare GitHub Pages:** GitHub Pages kan ikke lave
rigtige 301-viderestillinger (ingen server-side config). Cloudflare foran
(gratis) løser det OG giver jer DNS-kontrol uafhængig af enhver udvikler —
to problemer, én løsning, som allerede var anbefalingen 10. sep.

## Præcise stier (1:1)

| Gammel | Ny |
|---|---|
| `/` | `/` |
| `/index.php` | `/` |
| `/aboutus.php` | `/about.html` |
| `/transportation.php` | `/getting-here.html` |
| `/contactus.php` | `/contact.html` |
| `/facilities.php` | `/facilities.html` |
| `/gallery.php` | `/gallery.html` |
| `/activities.php` | `/activities.html` |

## Query-varianter (mange-til-én)

`accommodation.php` med `?room=N&type=M` viser samme markup uanset query
(tjekket direkte — ingen server-side skelnen mellem rum). Al variation går
til samme mål:

| Gammelt mønster | Ny |
|---|---|
| `/accommodation.php*` (alle `?room=`/`?type=` varianter) | `/accommodation.html` |
| `/gallery.php?album=*` | `/gallery.html` |
| `/promotion.php*`, `/promotion_detail.php?id=*` | `/` — **`promotion.html` findes ikke i v3** (kampagnen var udløbet, siden droppet bevidst i sep-passet) |
| `/review.php*`, `/review_detail.php?id=*` | `/accommodation.html` — anmeldelser vises der i v3 |

## Thai-version (findes ikke i v3)

v3 har intet thailandsk indhold. Bedste alternativ er den engelske
tilsvarende side, ikke en 404:

| Gammel | Ny |
|---|---|
| `/index_th.php` | `/` |
| `/aboutus_th.php` | `/about.html` |
| `/transportation_th.php` | `/getting-here.html` |
| `/contactus_th.php` | `/contact.html` |
| `/facilities_th.php` | `/facilities.html` |
| `/accommodation_th.php*` | `/accommodation.html` |
| `/gallery_th.php*` | `/gallery.html` |
| `/activities_th.php` | `/activities.html` |
| `/promotion_th.php*`, `/promotion_detail_th.php?id=*` | `/` |
| `/review_th.php*`, `/review_detail_th.php?id=*` | `/accommodation.html` |

## Ikke løst endnu

`/gallery.php?album=1..5` — hvis de fem albummer reelt svarer til bestemte
kategorier på v3's `gallery.html` (Panorama/Facilities/Restaurant/Activities/
Events), er en mere præcis pr.-album-omdirigering mulig, men albummernes
rækkefølge/indhold er ikke bekræftet fra den gamle side endnu.
