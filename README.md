# Artikulino

Artikulino je Angular 21 MVP za gamificirano vježbanje slušanja, govora i artikulacije kod djece predškolske i školske dobi. Aplikacija je namijenjena podršci vježbanju i ne postavlja dijagnozu niti zamjenjuje procjenu logopeda.

## Pokretanje

Preduvjeti su Node.js 20.19+ ili noviji LTS i npm.

```bash
npm install
npm --prefix server install
py -3.11 -m venv transcription/.venv
.\transcription\.venv\Scripts\python.exe -m pip install -r transcription/requirements-dev.txt
```

Pokreni lokalni prijepis, API i Angular u tri terminala:

```bash
npm run transcription:start
npm run server:dev
npm start
```

Aplikacija je zatim dostupna na `http://localhost:4200`, a lokalni API na
`http://localhost:3000`. Lokalni FastAPI worker sluša na `http://127.0.0.1:8000`. Angular razvojni
poslužitelj prosljeđuje `/api` pozive kroz `proxy.conf.json`; preglednik nikada ne poziva Python
worker izravno. Razvojna naredba `server:dev` ponovno učitava Express nakon promjene izvornog koda
i sprječava da Angular koristi zastarjeli API proces.

Provjere kvalitete:

```bash
npm run prototype:check
```

Ova naredba izrađuje produkcijsku verziju aplikacije te pokreće Angular, Express i Python testove
uz provjeru formatiranja. Frontend provjera ostaje dostupna kroz `npm run check`, a pojedinačne
provjere kroz `npm run build`, `npm run test:ci`, `npm --prefix server run check`,
`npm run transcription:test` i `npx prettier . --check`.

ESLint trenutačno nije uveden. Za MVP su dogovoreni Angular build, testovi i Prettier kao zajednička
provjera bez dodavanja nove ovisnosti.

Točne postavke za zajedničko pokretanje sva tri servisa u IntelliJ IDEA-i nalaze se u
[`docs/INTELLIJ_RUN_CONFIGURATIONS.md`](docs/INTELLIJ_RUN_CONFIGURATIONS.md).
Završni automatski, integrirani i responzivni rezultati te preostale provjere na stvarnom uređaju
nalaze se u [`docs/THESIS_PROTOTYPE_QA.md`](docs/THESIS_PROTOTYPE_QA.md).

## Rute

- `/` – naslovnica i najkraći put do prve igre
- `/igre` – katalog s preklopnim vrstama igara i filtrima sadržajnih paketa
- `/igre/:packageId` – zajednički game engine s prikazom odabrane igre
- `/prijava` – prijava unaprijed definiranim demo računom
- `/profili` – odabir ili upravljanje izmišljenim demo profilima
- `/napredak` – pregled sesija aktivnog demo profila s lokalnog poslužitelja
- `/pregled-terapeuta` – zaštićeni pregled završenih demo sesija, snimki i osvrta terapeuta

Sve glavne stranice učitavaju se lazy loadingom i koriste standalone komponente.

## Lokalna demo prijava i podaci

Zaseban Express/SQLite servis služi samo lokalnom diplomskom prototipu.

- roditelj: `parent@artikulino.test` / `ParentDemo123!`;
- terapeut: `therapist@artikulino.test` / `TherapistDemo123!`.

Naslovnica i katalog ostaju javni. Za pokretanje igre treba se prijaviti kao demo roditelj i
odabrati izmišljeni profil. Terapeut može pregledati završene sesije svih izmišljenih demo profila,
zaštićeno reproducirati testne snimke te spremiti jednostavan status pregleda i komentar.

Lozinke i tokeni nisu spremljeni u čistom tekstu. Prijava traje osam sati, token je u
`sessionStorage`. SQLite baza i audiosnimke nalaze se u Git-ignoriranoj mapi `server/runtime/`.
Naredba za reset briše sesije, snimke i profile te ponovno stvara demo račune i početne profile:

```bash
npm run prototype:reset
```

Detalji API-ja i granica nalaze se u
[`docs/PROTOTYPE_BACKEND.md`](docs/PROTOTYPE_BACKEND.md).

## Igre

Implementirane su četiri različite mehanike:

1. **Slušaj i odluči** – kategorizacija riječi i rečenica.
2. **Uhvati glas** – prepoznavanje ciljnog glasa ili razlikovanje kontrastnog para.
3. **Gdje je glas?** – određivanje početka, sredine ili kraja riječi pomoću interaktivnog vlaka.
4. **Vježbaj izgovor** – slušanje, snimanje i ponovno slušanje slogova ili cijelih riječi.

Sve igre koriste isti zajednički tijek i praćenje sesije, ali imaju zasebne komponente za prikaz
odgovora ili snimanje. Igre prepoznavanja koriste postojeće bodovanje odgovora, dok `Vježbaj
izgovor` dodjeljuje razmjerne bodove samo iz tekstualne podudarnosti očekivanog i prepoznatog
teksta. Ta vrijednost nije procjena kvalitete izgovora. Sadržaj nije ugrađen u komponente igre.

Katalog sadrži po jednu vježbu slogova i cijelih riječi za R, L, S, Z, Š, Ž, C, Č i Ć. Svaka
vježba sloga koristi četiri različita poticaja s vokalima A, E, I i O. Vježba zahtijeva da dijete
najprije posluša primjer, a zatim snimi barem jedan pokušaj. Ako preglednik odbije ili ne podržava
mikrofon, ponuđen je jasan nastavak bez snimanja.

Paketi `Uhvati glas` izričito razlikuju način `DETECT` od načina `DISCRIMINATE`. Paketi
`Slušaj i odluči` ne navode ciljni glas kada ga zadatak stvarno ne vježba.

Katalog prikazuje samo filtre koji imaju smisla za odabranu vrstu igre. `Slušaj i odluči` koristi
temu i razinu, `Uhvati glas` koristi glas, vrstu vježbe i razinu, a `Gdje je glas?` koristi glas i
razinu. `Vježbaj izgovor` koristi glas, vrstu izgovora i razinu. Povratak na prikaz svih igara
vraća zajedničke filtre glasa, teme i razine.

Model izravno podržava glasove R, L, S, Z, Š, Ž, C, Č i Ć te parove S/Š, Z/Ž, L/R, C/Č i Č/Ć. Engine nema logiku vezanu uz pojedini glas, pa se novi glas aktivira dodavanjem paketa.

## Sadržajni paketi

Model paketa nalazi se u `src/app/features/games/models/content-package.model.ts`, a demonstracijski sadržaj u `src/app/features/games/data/demo-content-packages.ts`.

Novi paket dodaje se kao novi `ContentPackage` objekt. Nije potrebno stvarati novu stranicu, rutu ili game engine. Paket definira:

- vrstu igre, naziv, opis i cilj;
- opcionalni ciljni i kontrastni glas, samo kada ih igra stvarno vježba;
- način prepoznavanja (`DETECT` ili `DISCRIMINATE`) odnosno način izgovora (`SOUND` ili `WORD`);
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
  recognitionMode: 'DETECT',
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

Kategorije `Slušaj i odluči`, `Uhvati glas` i `Gdje je glas?` ne koriste mikrofon. Snimanje je
rezervirano za zasebnu kategoriju `Vježbaj izgovor`. Postojeće povijesne testne snimke ostaju
dostupne u pregledima roditelja i terapeuta.

U igri izgovora mikrofon se otključava tek nakon slušanja primjera. `MediaRecorder` omogućuje
djetetu da snimi glas ili riječ, posluša snimku, snimi novi pokušaj i izbriše posljednji pokušaj.
Prelaskom na novo pitanje panel se vraća u početno stanje.

- snimka se asinkrono šalje samo lokalnom demonstracijskom poslužitelju;
- više pokušaja za isto pitanje ostaje spremljeno uz sesiju aktivnog demo profila;
- aplikacija provjerava stanje prijepisa jednom u sekundi, najdulje 30 sekundi;
- bodovi su `round(osnovni bodovi × Podudarnost teksta / 100)`;
- za pitanje se računa samo najbolji pokušaj, pa slabiji ponovni pokušaj ne smanjuje bodove;
- neuspjeli ili istekli prijepis ostavlja snimku i dopušta novi pokušaj ili nastavak bez bodova;
- neuspjelo slanje zadržava lokalnu snimku za ponovni pokušaj ili brisanje;
- ograničena je na 15 sekundi i 10 MB;
- aplikacija ne tvrdi da automatski ocjenjuje izgovor.

Nakon obrade dijete vidi samo `Podudarnost teksta` i razmjerne bodove za taj krug; sam prijepis
ostaje u odraslim pregledima. Rezultat se ne naziva kvalitetom izgovora ni logopedskom procjenom.

Nakon spremanja Express asinkrono šalje samo audiodatoteku lokalnom FastAPI workeru. Pokušaj ima
status `PENDING`, `COMPLETED` ili `FAILED`. Uspješan prijepis sprema tekst i cjelobrojnu
`Podudarnost teksta`, dobivenu normaliziranom Levenshteinovom sličnošću. To nije procjena
izgovora. U igri izgovora može utjecati samo na razmjerne bodove prema prethodnoj formuli;
neuspjeh prijepisa ne briše snimku.

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

Stranica Napredak za prijavljenog demo roditelja čita te sesije iz API-ja i dijeli ih u dva
odjeljka. `Napredak djeteta` čuva potpuni povijesni pregled sesija i svih snimljenih pokušaja, dok
`Feedback terapeuta` prikazuje samo pokušaje iz završenih sesija za koje je spremljen osvrt
terapeuta. Detalji uključuju očekivani i prepoznati tekst, stanje prijepisa, `Podudarnost teksta`,
zaštićenu reprodukciju te potpuni spremljeni osvrt. Ti podaci ostaju u prikazu za odrasle i ne
pojavljuju se tijekom dječje igre.

Brisanje sesije uklanja metapodatke i povezane audiodatoteke. Roditelj može potvrditi i potpuno
brisanje aktivnog demo profila sa svim sesijama, prijepisima i snimkama. Obje radnje čiste stari
`localStorage` ključ; postojeći lokalni napredak se ne migrira.

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
- Nema automatske procjene pravilnosti izgovora. Lokalni hrvatski prijepis služi samo demonstraciji
  s izmišljenim ili odraslim testnim snimkama; `Podudarnost teksta` nije logopedska procjena.
- Demo sadržaj služi tehničkoj demonstraciji i prije stručne uporabe treba ga pregledati logoped.
- Svaki demo paket izričito je označen statusom `NOT_REVIEWED`; upute za dokumentiranje stručne
  provjere nalaze se u `docs/CONTENT_PACKAGES.md`.
- Speech Synthesis glas i MediaRecorder format ovise o pregledniku i operacijskom sustavu.
- Zapakirani audiozapisi nisu dio MVP-a; govorni poticaji trenutačno koriste Speech Synthesis.
- Svaka od 34 kartice kataloga koristi vlastitu optimiziranu lokalnu WebP ilustraciju putem
  `catalogImage`; nijedna putanja nije podijeljena između dvije igre. Paket „Što jedemo?” dodatno
  koristi lokalne ilustracije pitanja putem `image.src`; ostali emoji poticaji mogu se zamijeniti
  istim postupkom bez promjene logike igre.

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

Jedinstvene optimizirane transparentne soft-toy ilustracije za svih 34 igre nalaze se u
`public/assets/games/catalog/`, a povećane rubne dekoracije u
`public/assets/games/decorations/`. Katalog povezuje ilustracije s konkretnim igrama, boji kartice
prema vrsti igre i koristi četiri pristupačna preklopna gumba kao prvi filtar. Naredba
`npm run assets:check` provjerava da ilustracije postoje, da se njihove putanje i sadržaj ne
ponavljaju te da ostaju unutar dogovorenih ograničenja veličine.

Lokalni backend, testni računi, izmišljeni profili, sesije, višestruki pokušaji snimanja, lokalni
hrvatski prijepis, četiri mentorom usklađene vrste igara, podijeljeni roditeljski pregled i
terapeutski pregled sada su implementirani. Završna mentor-feedback provjera prototipa također je
implementirana i dokumentirana u
[`docs/THESIS_PROTOTYPE_QA.md`](docs/THESIS_PROTOTYPE_QA.md). Detaljne upute za Python worker nalaze se u
[`transcription/README.md`](transcription/README.md).

Integrirana provjera od 4. kolovoza 2026. potvrdila je čuvanje nove sesije i snimke nakon ponovnog
pokretanja sva tri servisa, roditeljski i terapeutski tijek, privremenu nedostupnost transkripcijskog
workera te responzivni prikaz. Provjera nije pokretala reset baze, a svi privremeni QA zapisi i
snimke izbrisani su nakon provjere.
