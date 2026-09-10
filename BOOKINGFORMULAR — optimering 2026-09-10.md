# Bookingformularen — hvad der skal rettes

**10. september 2026.** Grundlag: GA4 på `kohkoodbeach.com` (28 dage, renset for dansk trafik) og en gennemgang af `book.html` + `script.js`.

## Hvad de hollandske besøgende faktisk gjorde

Ti sessioner, otte personer, **alle på mobil** — syv Android/Chrome, tre iOS/Safari. Ingen desktop.

| Side | Visninger | Personer | Tid i alt |
|---|---|---|---|
| `/book.html` | 8 | 4 | 428 sek (~107 sek pr. person) |
| `/getting-here.html` | 6 | 3 | 402 sek |
| `/accommodation.html` | 5 | 3 | 183 sek |

`form_start` 4 gange af 3 personer. `form_submit` **0**. `generate_lead` **0**.

De opgav ikke med det samme. De brugte næsten to minutter hver og gik i gang med formularen. Noget stoppede dem undervejs.

**Bemærk også:** de brugte lige så lang tid på transportsiden som på bookingsiden. Transport er en reel bekymring, ikke en detalje.

---

## Rettelser, i rækkefølge efter forventet effekt

### 1. Vis euro ved siden af baht

`book.html` nævner THB **38 gange** og euro nul gange. Værelserne spænder 2.900–8.200 THB. For en hollandsk læser er det cirka **€75 til €215** — forskellen på et budgetophold og et dyrt et — og hun skal forlade siden for at finde ud af hvilken.

**Gør:** vis en omregnet pris efter baht-prisen, tydeligt markeret som cirka (`≈ €75`). Én fast kurs i en konstant, ikke et live-kald. Kursen skal stå ét sted i koden med en kommentar om, hvornår den sidst blev sat.

**Rør ikke** baht-tallet. Det er den pris, der faktisk opkræves.

### 2. Sig hvad formularen er, over den

Annoncerne har `BOOK_TRAVEL` — knappen siger "Book now". Formularen sender en e-mail via Web3Forms. Den, der trykker, forventer ledighed og en pris og møder i stedet en formular, hun skal beskrive sit ønske i og så vente.

**Gør:** én linje øverst i formularen, før første felt. Den skal sige at det er en forespørgsel, hvad der sker bagefter, og hvor hurtigt der svares.

> *"Tell us your dates and we will come back with what is free and what it costs — usually within [X] hours."*

⚠️ **[X] skal bekræftes af receptionen, før den skrives.** Et svartidsløfte, der ikke holdes, er værre end ingen.

### 3. Gør `nationality` valgfri

`book.html` linje 345: `<select name="nationality" required>`.

Det er et check-in-felt, ikke et lead-felt. På en telefon er det endnu en rullemenu midt i en formular, der allerede har seks påkrævede felter. Ingen forespørgsel er ubrugelig, fordi nationaliteten mangler.

**Gør:** fjern `required`. `compose()` håndterer allerede tom værdi.

**Påkrævede felter efter rettelsen:** `checkin`, `checkout`, `adults`, `name`, `email`. Fem, hvoraf `adults` er forudfyldt med 2.

### 4. Gør datofelterne mindre farlige på mobil

To `<input type="date">`, begge `required`, begge på en telefon. Den besøgende vælger i blinde: der er ingen ledighed nogen steder på siden. 1.–4. oktober er lukket, men det står ingen steder, og vælger hun dem, får hun det aldrig at vide — forespørgslen lander bare i en indbakke.

**Gør nu (billigt):** en kort hjælpetekst under datofelterne med de perioder, der er åbne, vedligeholdt manuelt. F.eks. *"We are open from 5 October."*

**Gør ikke nu:** automatisk ledighed fra bookingmotoren. Se "Uden for scope" nedenfor.

### 5. Behold "Not sure yet" som standard

`book.html` har `<input type="radio" name="room" value="" data-label="Not sure yet — happy to be recommended a room" checked>`.

**Det er rigtigt gjort.** Det redder den besøgende fra at skulle tage stilling til ti værelsestyper på en telefon, før hun må skrive. Lad den blive valgt som standard.

---

## Hvad der IKKE er galt

- **Backend'en virker.** `generate_lead` har fyret 9 gange og `/enquiry-sent.html` er set — den fulde vej igennem er gennemført med succes (af os, under test). Web3Forms svarer.
- **Fejlhåndteringen er fornuftig.** Fejler kaldet, falder den tilbage til `mailto`. Den besøgende mister ikke sin tekst.
- **UTM-parametre bæres med** til `enquiry-sent.html`, så konverteringen kan henføres til kampagnen.
- **`reportValidity()` kaldes** før afsendelse, så browserens egen validering stadig gælder trods `preventDefault()`.

---

## Uden for scope indtil videre: automatisk ledighed

Bookingmotorens ledigheds-endpoint (`book-directonline.com/api/properties/.../availability`) er **læseadgang, udokumenteret, og sender ingen `Access-Control-Allow-Origin`** — en browser på `kohkoodbeach.com` kan derfor ikke kalde det. Det ville kræve et natligt job, der skriver en JSON-fil ind i sitet.

**Og vigtigere:** endpointet viser, hvad *motoren udbyder*, ikke hvad der er frit. Så længe allotment er lukket ned, ville funktionen vise et resort, der ser mere lukket ud end det er. **Åbn lageret først.**

---

## Relateret, men en separat beslutning

`robots.txt` har `Disallow: /` og alle 12 sider bærer `<meta name="robots" content="noindex, nofollow">`. Siden er stadig sat op som staging, men modtager betalt trafik. Ingen besøgende kan finde tilbage via Google. Skal vendes, når siden erklæres produktion — `robots.txt` og meta-taggene sammen, som `CLAUDE.md` beskriver.
