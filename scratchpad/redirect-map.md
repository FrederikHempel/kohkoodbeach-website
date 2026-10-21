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

## Tilføjelse 20. oktober 2026 — offentlige .html-værelsessider

Den oprindelige PHP-liste ovenfor er ikke en komplet URL-inventarliste.
Disse offentlige HTML-adresser skal også håndteres. Målene nedenfor er lokale
sider, som nu findes i v3. Brug det endeligt valgte hoveddomæne foran målstien.
Opsæt serverbaserede permanente omdirigeringer og test både www/non-www og
HTTP/HTTPS; ingen omdirigeringer er aktiveret af denne lokale ændring.

| Gammel sti | Ny sti |
|---|---|
| `/room-balihousegardenview-1-1.html` | `/bali-house.html#bali-house-garden-view` |
| `/room-balihouseseaview-1-2.html` | `/bali-house.html#bali-house-sea-view` |
| `/room-balihousepartialseaview-1-3.html` | `/bali-house.html#bali-house-partial-sea-view` |
| `/room-balideluxepartialseaview-5-9.html` | `/bali-deluxe.html#bali-deluxe-partial-sea-view` |
| `/room-thaitwinhousegardenview-2-4.html` | `/thai-twin-house.html#thai-twin-house-garden-view` |
| `/room-thaitwinhouseseaview-2-5.html` | `/thai-twin-house.html#thai-twin-house-sea-view` |
| `/room-thaitwinhousepartialseaview-2-6.html` | `/thai-twin-house.html#thai-twin-house-partial-sea-view` |
| `/room-sunsethouselower-3-7.html` | `/sunset-house.html` |
| `/room-sunsethouseupper-3-8.html` | `/sunset-house.html` |

Før lancering: Udvid listen med Search Console-landingssider, backlinks,
serverlogs og aktuelle sitemaps. Bekræft særskilt twin-varianten og de thailandske
URL'er. Engelske erstatningssider bevarer ikke nødvendigvis thailandske placeringer.
Undgå at sende alle udgåede URL'er til forsiden. Test statuskode, slutmål,
query-parametre og ingen redirect-loops. Bevar hoveddomænet hvis muligt;
domæneoverdragelse alene er ikke en garanti for bevaret Googletrafik.
