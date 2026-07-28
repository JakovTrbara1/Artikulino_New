# Artikulino

Artikulino je Angular 21 MVP za gamificirano vježbanje slušanja, govora i artikulacije kod djece predškolske i školske dobi. Aplikacija je namijenjena podršci vježbanju i ne postavlja dijagnozu niti zamjenjuje procjenu logopeda.

## Pokretanje

Preduvjeti su Node.js 20.19+ ili noviji LTS i npm.

```bash
npm install
npm --prefix server install
```

Pokreni lokalni API i Angular u dva terminala:

```bash
npm run server:start
npm start
```

Aplikacija je zatim dostupna na `http://localhost:4200`, a lokalni API na
`http://localhost:3000`. Angular razvojni poslužitelj prosljeđuje `/api` pozive kroz
`proxy.conf.json`.

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
- `/prijava` – prijava unaprijed definiranim demo računom
- `/profili` – odabir ili upravljanje izmišljenim demo profilima
- `/napredak` – pregled sesija aktivnog demo profila s lokalnog poslužitelja

Sve glavne stranice učitavaju se lazy loadingom i koriste standalone komponente.

## Lokalna demo prijava i podaci

Zaseban Express/SQLite servis služi samo lokalnom diplomskom prototipu.

- roditelj: `parent@artikulino.test` / `ParentDemo123!`;
- terapeut: `therapist@artikulino.test` / `TherapistDemo123!`.

Naslovnica i katalog ostaju javni. Za pokretanje igre treba se prijaviti kao demo roditelj i
odabrati izmišljeni profil. Terapeut može samo pregledati sve demo profile; terapeutsko sučelje
dolazi u kasnijem milestoneu.

Lozinke i tokeni nisu spremljeni u čistom tekstu. Prijava traje osam sati, token je u
`sessionStorage`. SQLite baza i audiosnimke nalaze se u Git-ignoriranoj mapi `server/runtime/`.
Naredba za reset briše sesije, snimke i profile te ponovno stvara demo račune i početne profile:

```bash
npm run prototype:reset
```

Detalji API-ja i granica nalaze se u
[`docs/PROTOTYPE_BACKEND.md`](docs/PROTOTYPE_BACKEND.md).

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

Mikrofon se aktivira isključivo nakon korisnikova klika. Vidljivi, neobavezni panel nalazi se između
pojma i ponuđenih odgovora. `MediaRecorder` omogućuje djetetu da snimi riječ, posluša snimku i
izbriše je. Prelaskom na novo pitanje panel se vraća u početno stanje.

- snimka se asinkrono šalje samo lokalnom demonstracijskom poslužitelju;
- više pokušaja za isto pitanje ostaje spremljeno uz sesiju aktivnog demo profila;
- ne mijenja bodove i ne blokira sljedeće pitanje;
- neuspjelo slanje zadržava lokalnu snimku za ponovni pokušaj ili brisanje;
- ograničena je na 15 sekundi i 10 MB;
- aplikacija ne tvrdi da automatski ocjenjuje izgovor.

Nakon zaustavljanja panel emitira tipizirani `RecordedAttempt` (audio blob, MIME tip, trajanje, ID
pitanja i redni broj pokušaja). Metapodaci se spremaju u SQLite, a audio u
`server/runtime/recordings/`. API odgovori ne otkrivaju fizičke putanje.

Za mikrofon je potreban podržani preglednik i siguran kontekst (`https` ili `localhost`). Servisna
granica `SPEECH_TRANSCRIPTION` postoji, ali je zadano isključena i ne šalje snimke izvan
preglednika. Arhitekturna granica opisana je u
[`docs/ASR_BOUNDARY.md`](docs/ASR_BOUNDARY.md), a obvezne odluke o privoli, čuvanju i pristupu u
[`docs/PRIVACY_AND_CONSENT.md`](docs/PRIVACY_AND_CONSENT.md).

## Praćenje napretka

Završena sesija sprema se pod aktivnim izmišljenim demo profilom na lokalnom poslužitelju:

- broj pitanja i točnih odgovora;
- ukupan broj pokušaja i ponovnih slušanja;
- trenutačni i najdulji niz;
- bodove, trajanje i vrijeme završetka;
- paket, vrstu igre, glas, temu i razinu.

Stranica Napredak za prijavljenog demo roditelja čita te sesije iz API-ja. Brisanje sesije uklanja
metapodatke i povezane audiodatoteke te čisti stari `localStorage` ključ; postojeći lokalni napredak
se ne migrira.

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

- Demo prijava i profili rade samo na lokalnom prototipnom API-ju; nema produkcijskih računa,
  javne objave ni sinkronizacije između uređaja.
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

Lokalni backend, testni računi, izmišljeni profili, sesije i višestruki pokušaji snimanja sada su
implementirani. Lokalni hrvatski prijepis, prošireni roditeljski pregled i terapeutski pregled
dolaze u sljedećim milestoneima.
