# Artikulino

Artikulino je Angular 21 MVP za gamificirano vježbanje slušanja, govora i artikulacije kod djece predškolske i školske dobi. Aplikacija je namijenjena podršci vježbanju i ne postavlja dijagnozu niti zamjenjuje procjenu logopeda.

## Pokretanje

Preduvjeti su Node.js 20.19+ ili noviji LTS i npm.

```bash
npm install
npm start
```

Aplikacija je zatim dostupna na `http://localhost:4200`.

Provjere kvalitete:

```bash
npm run check
```

Ova naredba izrađuje produkcijsku verziju aplikacije, pokreće testove jednokratno i provjerava
formatiranje Prettierom. Pojedinačne provjere dostupne su kroz `npm run build`, `npm run test:ci` i
`npx prettier . --check`. `npm test` ostaje dostupan za rad tijekom razvoja.

ESLint trenutačno nije uveden. Za MVP su dogovoreni Angular build, testovi i Prettier kao zajednička
provjera bez dodavanja nove ovisnosti.

## Rute

- `/` – naslovnica i najkraći put do prve igre
- `/igre` – katalog s preklopnim vrstama igara i filtrima sadržajnih paketa
- `/igre/:packageId` – zajednički game engine s prikazom odabrane igre
- `/napredak` – lokalni pregled aktivnosti za roditelje

Sve glavne stranice učitavaju se lazy loadingom i koriste standalone komponente.

## Igre

Implementirane su tri različite mehanike:

1. **Slušaj i odluči** – kategorizacija riječi i rečenica.
2. **Uhvati glas** – prepoznavanje ciljnog glasa ili razlikovanje kontrastnog para.
3. **Gdje je glas?** – određivanje početka, sredine ili kraja riječi pomoću interaktivnog vlaka.

Sve igre koriste isti zajednički tijek, bodovanje i praćenje sesije, ali imaju zasebne komponente za prikaz odgovora. Sadržaj nije ugrađen u komponente igre.

Model izravno podržava glasove R, L, S, Z, Š, Ž, C, Č i Ć te parove S/Š, Z/Ž, L/R, C/Č i Č/Ć. Engine nema logiku vezanu uz pojedini glas, pa se novi glas aktivira dodavanjem paketa.

## Sadržajni paketi

Model paketa nalazi se u `src/app/features/games/models/content-package.model.ts`, a demonstracijski sadržaj u `src/app/features/games/data/demo-content-packages.ts`.

Novi paket dodaje se kao novi `ContentPackage` objekt. Nije potrebno stvarati novu stranicu, rutu ili game engine. Paket definira:

- vrstu igre, naziv, opis i cilj;
- ciljni i opcionalni kontrastni glas;
- par glasova, temu i razinu;
- tekst zadatka i tekst koji se izgovara;
- opcionalni `audioSrc`, ilustraciju pitanja i `catalogImage` za karticu kataloga;
- ponuđene i točne odgovore, uključujući više točnih odgovora;
- objašnjenje i sva pravila bodovanja.

Skraćeni primjer:

```ts
const packageExample: ContentPackage = {
  schemaVersion: 1,
  id: 'uhvati-odjeca-c-lagano',
  gameType: 'catch-the-sound',
  name: 'Uhvati glas C',
  description: 'Pronađi glas C u riječima o odjeći.',
  objective: 'Slušno prepoznavanje glasa C.',
  targetSound: 'C',
  theme: 'odjeća',
  difficulty: 'EASY',
  catalogImage: {
    src: '/assets/games/themes/clothing.webp',
    alt: 'Mekana 3D ilustracija odjeće',
  },
  professionalReview: { status: 'NOT_REVIEWED' },
  scoring: {
    basePoints: 10,
    secondAttemptMultiplier: 0.6,
    streakLength: 3,
    streakBonus: 5,
    replayPenalty: 0,
    maxAttempts: 2,
  },
  questions: [
    {
      id: 'cipele-c',
      taskText: 'Poslušaj i odaberi odgovor.',
      spokenText: 'cipele',
      audioSrc: '/assets/audio/cipele.mp3',
      image: { src: '/assets/images/cipele.webp', alt: 'Crvene dječje cipele' },
      answers: [
        { id: 'yes', label: 'Čujem glas C' },
        { id: 'no', label: 'Ne čujem glas C' },
      ],
      correctAnswerIds: ['yes'],
      explanation: 'U riječi cipele čujemo glas C na početku.',
    },
  ],
};
```

Ako `audioSrc` ne postoji ili se zapis ne može učitati, aplikacija koristi lokalni Speech Synthesis
preglednika s jezikom `hr-HR`. To je podržani način reprodukcije govora za MVP; zapakirani
audiozapisi odgođeni su dok se ne potvrde prava distribucije i hrvatski izgovor. Dostupnost i
kvaliteta hrvatskog glasa ovise o uređaju.

## Mikrofon i privatnost

Mikrofon se aktivira isključivo nakon korisnikova klika. `MediaRecorder` omogućuje djetetu da snimi riječ i posluša vlastitu snimku.

- snimka se ne šalje na poslužitelj;
- ne ulazi u rezultate ni `localStorage`;
- briše se ručno ili pri napuštanju komponente;
- aplikacija ne tvrdi da automatski ocjenjuje izgovor.

Za mikrofon je potreban podržani preglednik i siguran kontekst (`https` ili `localhost`). Servisna
granica `SPEECH_TRANSCRIPTION` postoji, ali je zadano isključena i ne šalje snimke izvan
preglednika. Arhitekturna granica opisana je u
[`docs/ASR_BOUNDARY.md`](docs/ASR_BOUNDARY.md), a obvezne odluke o privoli, čuvanju i pristupu u
[`docs/PRIVACY_AND_CONSENT.md`](docs/PRIVACY_AND_CONSENT.md).

## Praćenje napretka

Završena sesija lokalno sprema:

- broj pitanja i točnih odgovora;
- ukupan broj pokušaja i ponovnih slušanja;
- trenutačni i najdulji niz;
- bodove, trajanje i vrijeme završetka;
- paket, vrstu igre, glas, temu i razinu.

Podaci se spremaju u `localStorage` pod verzioniranim ključem i mogu se izbrisati sa stranice Napredak.

## Struktura

```text
src/app/
  core/
    layout/
    services/
  shared/
    components/
    services/
  features/
    home/
    games/
      components/
      data/
      models/
      pages/
      services/
    progress/
```

Globalni design tokeni, reset i zajednički stilovi nalaze se u `src/main.css`. Stilovi pojedinih prikaza ostaju uz njihove komponente.

## Trenutačna ograničenja

- Nema korisničkih računa, backend API-ja ni sinkronizacije između uređaja.
- Nema automatske procjene pravilnosti izgovora ni ASR integracije.
- Demo sadržaj služi tehničkoj demonstraciji i prije stručne uporabe treba ga pregledati logoped.
- Svaki demo paket izričito je označen statusom `NOT_REVIEWED`; upute za dokumentiranje stručne
  provjere nalaze se u `docs/CONTENT_PACKAGES.md`.
- Speech Synthesis glas i MediaRecorder format ovise o pregledniku i operacijskom sustavu.
- Zapakirani audiozapisi nisu dio MVP-a; govorni poticaji trenutačno koriste Speech Synthesis.
- Sve kartice kataloga koriste optimizirane lokalne tematske ilustracije putem `catalogImage`.
  Paket „Što jedemo?” dodatno koristi lokalne ilustracije pitanja putem `image.src`; ostali emoji
  poticaji mogu se zamijeniti istim postupkom bez promjene logike igre.

Vizualni koncept primarnog ekrana nalazi se u `docs/design/artikulino-game-concept.png`.

## Odobrena sljedeća faza: prototip za diplomski rad

Frontend-only MVP je dovršen. Sljedeća faza razvija se kao lokalni demonstracijski prototip za
diplomski rad, prema redoslijedu u [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md).

Planirana faza uključuje:

- razigraniji katalog i ekran igre prema odobrenim soft-toy 3D konceptima;
- unaprijed definirane testne račune roditelja i terapeuta;
- izmišljene dječje profile koji sadrže samo prikazno ime;
- lokalni Express/SQLite servis za testne sesije i snimke;
- lokalni Croatian Whisper prijepis bez slanja snimki u oblak;
- prikaz očekivanog teksta, prijepisa i tekstualne `Podudarnosti`;
- lokalni terapeutski pregled snimki s jednostavnim osvrtom i komentarom.

Ova faza nije produkcijski ni klinički sustav:

- smiju se koristiti samo izmišljeni profili i izmišljene ili odrasle testne snimke;
- `Podudarnost` uspoređuje očekivani i prepoznati tekst te ne procjenjuje kvalitetu izgovora;
- nema dijagnoze, automatske logopedske ocjene ni kliničkog zaključka;
- nema javne objave, vanjskog ASR pružatelja, pohrane u oblaku ni stvarnih korisničkih podataka.

Odobrene vizualne reference nalaze se u `docs/design/`:

- `catalog-soft-toy-desktop.png` i `catalog-soft-toy-mobile.png`;
- `gameplay-recording-desktop.png` i `gameplay-recording-mobile.png`;
- `therapist-review-desktop.png`.

Optimizirane transparentne soft-toy ilustracije za osam tema nalaze se u
`public/assets/games/themes/`, a nenametljive rubne dekoracije u
`public/assets/games/decorations/`. Katalog povezuje tematske ilustracije s karticama, boji ih prema
vrsti igre i koristi tri pristupačna preklopna gumba kao prvi filtar.

Backend, prijepis, testni računi i terapeutski pregled još nisu implementirani. Trenutačno
ponašanje aplikacije ostaje opisano u prethodnim odjeljcima ovog dokumenta.
