# Pravila za Artikulino sadržajne pakete

Ovaj dokument služi kao kratka kontrolna lista pri dodavanju sadržaja.

## Obavezna pravila

- `schemaVersion` mora biti `1`.
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
- Slika mora imati smislen, neprazan `alt`. Dekorativni sadržaj ne treba stavljati u paket pitanja.
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

## Težine

- `EASY`: poznate kratke riječi, jasne mogućnosti i vizualna pomoć.
- `MEDIUM`: različite pozicije glasova, kratke rečenice i sličniji distraktori.
- `HARD`: dulje riječi ili rečenice, kontrastni glasovi i manje vizualne pomoći.

## Stručna provjera

Prije objave većeg sadržajnog skupa logoped treba provjeriti dobnu primjerenost, fonetsku točnost, položaj ciljnih glasova, značenje distraktora i redoslijed težine.
