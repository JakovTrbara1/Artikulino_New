# Pravila za Artikulino sadržajne pakete

Ovaj dokument služi kao kratka kontrolna lista pri dodavanju sadržaja.

## Obavezna pravila

- `id` paketa i pitanja mora biti jedinstven i stabilan.
- `spokenText` je jedini izvor za Speech Synthesis fallback.
- Svaki `correctAnswerIds` mora upućivati na postojeći `answers.id`.
- Bodovi moraju ostati nenegativni; engine ih dodatno ograničava na najmanje nulu.
- Za igru `sound-position` izbjegavati riječ s ciljnim glasom na više mjesta. Ako zadatak namjerno podržava više odgovora, navesti sve njihove ID-jeve u `correctAnswerIds`.
- Slika mora imati smislen `alt`. Dekorativni sadržaj ne treba stavljati u paket pitanja.
- Audio i slika trebaju biti lokalni optimizirani asseti ili URL-ovi iz pouzdanog izvora s uređenim pravima korištenja.
- Ne koristiti kliničke tvrdnje niti poruke koje kažnjavaju dijete.

## Težine

- `EASY`: poznate kratke riječi, jasne mogućnosti i vizualna pomoć.
- `MEDIUM`: različite pozicije glasova, kratke rečenice i sličniji distraktori.
- `HARD`: dulje riječi ili rečenice, kontrastni glasovi i manje vizualne pomoći.

## Stručna provjera

Prije objave većeg sadržajnog skupa logoped treba provjeriti dobnu primjerenost, fonetsku točnost, položaj ciljnih glasova, značenje distraktora i redoslijed težine.
