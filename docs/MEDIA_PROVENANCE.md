# Evidencija podrijetla medija

Ovaj dokument prati podrijetlo i obradu lokalnih medijskih datoteka. Evidencija podržava pregled
sadržaja, ali nije pravno mišljenje o licenciranju.

## Ilustracije hrane

| Datoteka                               | Namjena | Podrijetlo                                      | Obrada                       |
| -------------------------------------- | ------- | ----------------------------------------------- | ---------------------------- |
| `public/assets/games/food/apple.webp`  | Jabuka  | Generirano za Artikulino alatom OpenAI imagegen | 512 × 512 WebP, kvaliteta 82 |
| `public/assets/games/food/carrot.webp` | Mrkva   | Generirano za Artikulino alatom OpenAI imagegen | 512 × 512 WebP, kvaliteta 82 |
| `public/assets/games/food/banana.webp` | Banana  | Generirano za Artikulino alatom OpenAI imagegen | 512 × 512 WebP, kvaliteta 82 |
| `public/assets/games/food/potato.webp` | Krumpir | Generirano za Artikulino alatom OpenAI imagegen | 512 × 512 WebP, kvaliteta 82 |

- Datum izrade: 2026-07-23.
- Izvorne ilustracije izrađene su posebno za ovaj projekt bez preuzimanja vanjskih stock asseta.
- Zajednički vizualni opis: jedna jasno prepoznatljiva namirnica, meka 3D ilustracija za djecu,
  svijetla krem pozadina s blijedoplavim sjajem, bez teksta, logotipa i vodenog žiga.
- Izvorni PNG smanjen je s 1536 × 1536 na 512 × 512 piksela i pretvoren u WebP pomoću Pillow 12.2.
- Prije javne distribucije vlasnik projekta treba potvrditi primjenjive uvjete korištenja alata za
  generiranje.

## Koncepti prototipa za diplomski rad

| Datoteka                                     | Namjena                  | Podrijetlo                                      |
| -------------------------------------------- | ------------------------ | ----------------------------------------------- |
| `docs/design/catalog-soft-toy-desktop.png`   | Katalog, desktop         | Generirano za Artikulino alatom OpenAI imagegen |
| `docs/design/catalog-soft-toy-mobile.png`    | Katalog, mobilni prikaz  | Generirano za Artikulino alatom OpenAI imagegen |
| `docs/design/gameplay-recording-desktop.png` | Igra i snimanje, desktop | Generirano za Artikulino alatom OpenAI imagegen |
| `docs/design/gameplay-recording-mobile.png`  | Igra i snimanje, mobitel | Generirano za Artikulino alatom OpenAI imagegen |
| `docs/design/therapist-review-desktop.png`   | Terapeutski pregled      | Generirano za Artikulino alatom OpenAI imagegen |

- Datum izrade: 2026-07-25.
- Koncepti su vizualne reference za raspored, hijerarhiju, boje, dubinu, ilustracije i responsive
  ponašanje.
- Tekst i primjeri podataka prikazani u konceptima nisu izvor produkcijskog sadržaja. Stvarno
  sučelje mora koristiti code-native hrvatski tekst iz aplikacije i izmišljene testne podatke.
- Koncepti nisu namijenjeni izravnom prikazu kao statične snimke sučelja.

## Soft-toy tematske ilustracije

| Datoteka                                    | Tema      | Podrijetlo                                      |
| ------------------------------------------- | --------- | ----------------------------------------------- |
| `public/assets/games/themes/food.webp`      | Hrana     | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/home.webp`      | Kuća      | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/nature.webp`    | Priroda   | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/animals.webp`   | Životinje | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/transport.webp` | Prijevoz  | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/clothing.webp`  | Odjeća    | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/school.webp`    | Škola     | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/themes/toys.webp`      | Igračke   | Generirano za Artikulino alatom OpenAI imagegen |

## Dekoracije rubova

| Datoteka                                              | Namjena                | Podrijetlo                                      |
| ----------------------------------------------------- | ---------------------- | ----------------------------------------------- |
| `public/assets/games/decorations/catalog-left.webp`   | Lijevi rub kataloga    | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/decorations/catalog-right.webp`  | Desni rub kataloga     | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/decorations/gameplay-left.webp`  | Lijevi rub ekrana igre | Generirano za Artikulino alatom OpenAI imagegen |
| `public/assets/games/decorations/gameplay-right.webp` | Desni rub ekrana igre  | Generirano za Artikulino alatom OpenAI imagegen |

- Datum izrade: 2026-07-25.
- Svaka je ilustracija generirana zasebnim pozivom ugrađenom alatu OpenAI imagegen. Odobreni
  koncept kataloga ili igre korišten je samo kao stilska referenca.
- Zajednički opis: kompaktna dječja soft-toy 3D ilustracija, zaobljeni oblici, meko raspršeno
  svjetlo, bez teksta, logotipa, sučelja i vodenog žiga.
- Izvori su generirani na jednobojnoj chroma-key pozadini. Pozadina je uklonjena lokalnim
  `remove_chroma_key.py` alatom uz soft matte i despill obradu.
- Završne datoteke centrirane su na prozirno platno veličine 512 × 512 piksela te spremljene kao
  WebP kvalitete 82. Nijedna završna datoteka nije veća od 50 KB.
- Dekoracije su označene kao prezentacijske (`alt=""`, `aria-hidden="true`) i skrivene na užim
  prikazima kako ne bi ometale sadržaj.
- Izvorni PNG zapisi i privremene datoteke obrade nisu dio repozitorija. Nisu dodani govorni ni
  drugi audiozapisi.
