# Lokal implementering, 20. oktober 2026

## Udført
- Sammenligning af tre bookbare værelsestyper med størrelser, senge, morgenmad og fra-priser.
- Selvstændige Bali House, Bali Deluxe og Thai Twin House-sider med billeder, variantankre og direkte forespørgselslinks. Genereres med `python3 scratchpad/build_room_pages.py` fra oversigten.
- Sunset House-informationsside: under renovering, ingen værelsesreservation/pris/genåbningsdato. Beskrivelse af tidligere Sunset Upper-indretning, tydeligt historisk. Den gamle Lower-side havde ingen brugbar aktuel beskrivelse; ingen detaljer er opfundet.
- Bali Deluxe: king + to enkeltsenge, bekræftet af ejer.
- Obligatoriske middage 24./31. december skilt fra valgfrie ekstrasenge, både på værelsessiderne og i formularen.
- Børnealdre medsendes i forespørgslen. Morgenmad og festmiddag: 2–11 år. Thai Twin ekstra børnekapacitet: 0–7 år. Formens gæstegrupper 2–12/13+ er fortsat optællingsgrupper, ikke en prisgaranti.
- Ekstraseng 800 THB/person. Prisens tidsenhed er ikke bekræftet, så der står ikke pr. nat.
- Valgt værelsesvariant sammenfattes i formularen, som åbner kontakttrinnet. Datoer skal stadig udfyldes. Ukendt variant falder tilbage til normal vælger.
- Direkte takkesidebesøg, refresh og udløbne kvitteringer tæller ikke nye leads. Sessionkvittering oprettes efter accepteret formularindsendelse; hver ny indsendelse får en ny kvittering. Samtykkeregler er bevaret. Blokeret sessionstorage giver konservativt ingen leadmåling og en neutral takkeside.
- Fejlagtig påstand om busankomst kl. 23 til en færge kl. 12.30 er fjernet.
- FAQ-valuta matcher EUR-estimaterne. Den eksisterende faste kurs er bevaret, ikke en livekurs.
- Sitemap udvidet; eksisterende staging-noindex bevaret. Omdirigeringskort udvidet med ni gamle værelsesadresser.

## Kilder til børnepolitik og Sunset
- https://kohkoodbeachresorts.com/room-balihousegardenview-1-1.html
- https://kohkoodbeachresorts.com/room-thaitwinhousegardenview-2-4.html
- https://kohkoodbeachresorts.com/room-sunsethouseupper-3-8.html
- https://kohkoodbeachresorts.com/room-sunsethouselower-3-7.html

Den gamle hjemmeside bekræfter særskilte aldersbånd; der er ikke fundet en
fælles aldersgrænse for alle værelsers børnekapacitet. Ejerens bekræftelse har
forrang for Bali Deluxe-sengene og de obligatoriske middage.

## Kontrol
`node --check script.js`, `node scratchpad/test-enquiry-receipt.cjs`,
`git diff --check`, lokale links/assets, unikke HTML-id'er, JSON-LD og noindex.
Browser: Sunset-renoveringsbesked, værelse→forvalgt booking og sammenligning.
Der er ikke sendt rigtige testhenvendelser eller lavet en live leadtest i GA/Meta.

## Før lancering
- Aftal endeligt hoveddomæne. Ret canonical, sitemap og delingsadresser samlet; fjern først staging-noindex på den rigtige produktionsside.
- Aktivér/test rigtige permanente omdirigeringer via domæne/serveransvarlig. Den lokale kode aktiverer ikke DNS eller serverregler.
- Udvid URL-kortet med Search Console, backlinks og logs; afklar thailandske landingssider og twin-URL. Ingen garanti for uændrede Googleplaceringer.
- Bekræft prisperiode for ekstrasenge og de relevante børnekapaciteter, som den gamle side ikke angiver entydigt.
- Foretag en godkendt end-to-end mailtest samt måling med/uden samtykke på det rigtige domæne.
- Mobilvisning og flere browsere bør gennemgås før lancering; lokal browserkontrol er ikke en fuld enhedstest.

Intet er pushet eller publiceret. Eksisterende ændring i `.impeccable/hook.cache.json` er bevaret.

## Revision efter ejerens feedback: én oversigt
Den ekstra sammenligningstabel er fjernet. Oversigten viser tre værelseskort
og en renoveringsnote for Sunset. Kort og hero-links fører til de selvstændige
værelsessider; udfoldede dubletter på oversigten er fjernet. Alle fire sider
har en fælles værelsesnavigation med markering af den aktuelle side.
Forside/familielinks peger direkte på værelsessiderne. Tidligere delte variantankre
på accommodation.html videresendes lokalt til den relevante nye side.

Fælles værelsesindhold ligger nu i scratchpad/room-panels.html og læses af begge
generatorer. Kør build_room_pages.py efter indholdsændringer; bookingdialogerne
skal fortsat holdes i sync. Staging-noindex er bevaret frem til lancering.

## Revision: bookingknapper og sticky værelsesnavigation
- Oversigt: “Explore this room” efterfulgt af “Book this room” nedenunder.
- Bali House og Thai Twin åbner den relevante værelsestypes udsigtsvalg i bookingformularen via `house=`. Bali Deluxe har én variant, som vælges direkte.
- Værelsesnavigationen følger med under topmenuen, med vandret scroll på små skærme. Body bruger overflow-x:clip på værelsessiderne, så den ikke bliver en separat scroll-container, der hindrer sticky.
- Alle links til book.html samt bookingformularernes sendeknapper bruger logoets eksisterende gyldne farve med mørk tekst, hover og tydeligt tastaturfokus.
- Kontrol: JavaScript syntaks, diff-format, bookingdestinationer, labels, genererede menuer og tekstkontrast kontrolleret. Visuel kontrol af denne revision er blokeret: browserens automatiske godkendelseskontrol kunne ikke gennemføres på grund af en nået forbrugsgrænse. Ingen nye screenshots er taget af denne revision.
