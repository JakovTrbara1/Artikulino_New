# Pravila za Artikulino sadržajne pakete

Ovaj dokument služi kao kratka kontrolna lista pri dodavanju sadržaja.

## Obavezna pravila

- `schemaVersion` mora biti `1`.
- `professionalReview` mora izričito bilježiti status stručne provjere.
- `id` paketa i pitanja mora biti jedinstven u cijeloj kolekciji i stabilan.
- `answers.id` mora biti jedinstven unutar pitanja, a svako pitanje mora imati najmanje dva
  ponuđena odgovora.
- `spokenText` je jedini izvor za Speech Synthesis fallback.
- `correctAnswerIds` mora sadržavati najmanje jedan ID i svaki mora upućivati na postojeći
  `answers.id`.
- Ciljni i kontrastni glasovi moraju biti podržani, a `soundPair` mora odgovarati tim glasovima.
- `basePoints` mora biti veći od nule; množitelj drugog pokušaja mora biti između 0 i 1;
  `streakLength` i `maxAttempts` moraju biti pozitivni cijeli brojevi; bonus i kazna moraju biti
  konačni nenegativni brojevi.
- Za igru `sound-position` `spokenText` mora sadržavati ciljni glas točno jednom. Riječi bez ciljnog
  glasa ili s ponovljenim ciljnim glasom treba razdvojiti u drugi tip zadatka.
- `catalogImage` i slika pitanja moraju imati izvor (`src` ili emoji) te smislen, neprazan `alt`.
  Dekorativni sadržaj ne treba stavljati u paket pitanja.
- Audio i slika trebaju biti lokalni optimizirani asseti ili URL-ovi iz pouzdanog izvora s uređenim
  pravima korištenja.
- Ne koristiti kliničke tvrdnje niti poruke koje kažnjavaju dijete.

## Automatizirana provjera

`validateContentPackages` iz
`src/app/features/games/models/content-package.validation.ts` vraća sve pronađene probleme kao
objekte sa stabilnim `code`, `path` i hrvatskom porukom. Funkcija ne mijenja sadržaj i ne prekida
izvođenje iznimkom.

Demonstracijski paketi moraju vratiti prazan popis problema. Nakon izmjene sadržaja pokrenuti:

```bash
npm run test:ci
```

Validator provjerava strukturu i tehničku dosljednost. Ne potvrđuje fonetsku, dobnu ili kliničku
ispravnost sadržaja.

## Pravila za slike

- `catalogImage` je opcionalna ilustracija kartice u katalogu. Ako nije zadana, kartica prikazuje
  neutralnu rezervnu ilustraciju.
- Za podržane teme koristite lokalne ilustracije iz `public/assets/games/themes/`; ne povezujte
  karticu izravno s vanjskim servisom.
- Slike za pitanja spremati pod `public/assets/games/` i povezivati apsolutnom putanjom
  `/assets/games/...`.
- Za kvadratne ilustracije koristiti WebP do 512 × 512 piksela i ciljnu veličinu manju od 100 KB,
  osim kada kvaliteta ili drugi prikaz opravdavaju veću datoteku.
- Zadržati smislen `alt`; emoji se može zadržati kao podatkovna rezerva ako slika poslije bude
  uklonjena iz paketa.
- Podrijetlo, način izrade i naknadnu obradu evidentirati u `docs/MEDIA_PROVENANCE.md`.
- Prije javne objave potvrditi da način distribucije odgovara uvjetima izvora ili alata kojim je
  asset izrađen.

## Težine

- `EASY`: poznate kratke riječi, jasne mogućnosti i vizualna pomoć.
- `MEDIUM`: različite pozicije glasova, kratke rečenice i sličniji distraktori.
- `HARD`: dulje riječi ili rečenice, kontrastni glasovi i manje vizualne pomoći.

## Stručna provjera

Svi demonstracijski paketi imaju `professionalReview.status: 'NOT_REVIEWED'`. Taj status ne znači da
je sadržaj netočan, nego da stručna provjera nije dokumentirana.

Prije promjene statusa logoped treba provjeriti dobnu primjerenost, fonetsku točnost, položaj
ciljnih glasova, značenje distraktora i redoslijed težine. Nakon dokumentirane provjere postaviti:

```ts
professionalReview: {
  status: 'PROFESSIONALLY_REVIEWED',
  reviewerName: 'Ime i prezime pregledavatelja',
  reviewedAt: '2026-07-23',
},
```

Datum se zapisuje u obliku `GGGG-MM-DD`. Nakon sadržajne izmjene pregledanog paketa status treba
vratiti na `NOT_REVIEWED` i ukloniti `reviewerName` i `reviewedAt` dok se ponovna provjera ne dovrši.
Validator provjerava potpunost zapisa, ali ne može potvrditi stručnu ispravnost sadržaja.
