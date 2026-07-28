# Granica servisa za prepoznavanje govora

## Trenutačno stanje

`SPEECH_TRANSCRIPTION` definira neutralnu granicu za eventualno buduće prepoznavanje govora. Zadani adapter namjerno je isključen: ne poziva mrežu, ne šalje snimke iz preglednika i ne mijenja postojeći tijek vježbe.

Granica prima samo:

- audiozapis kao `Blob`;
- podržanu oznaku jezika (`hr-HR`).

Uspješan budući adapter smije vratiti prijepis i opcionalnu pouzdanost samog prepoznavanja. Ta pouzdanost nije procjena pravilnosti izgovora, rezultat vježbe ni klinički ili dijagnostički zaključak.

Zahtjev namjerno ne sadrži ime djeteta, korisnički račun, identifikator paketa, očekivanu riječ ni rezultat.

## Pravila buduće integracije

Predviđeni tijek je:

1. lokalno snimanje nakon korisnikove radnje;
2. zasebna, jasna korisnička radnja za slanje;
3. provjera privole i pravila privatnosti;
4. ubrizgani, odobreni adapter iza `SPEECH_TRANSCRIPTION`;
5. povrat prijepisa bez automatskog bodovanja izgovora.

Komponente ne smiju izravno pozivati vanjski API niti uvoziti SDK pružatelja usluge. Nedostupnost servisa ili tehnička pogreška ne smije blokirati igru ni lokalno preslušavanje snimke.

## Uvjeti prije uključivanja adaptera

Prije zamjene isključenog adaptera moraju biti definirani i odobreni:

- roditeljska privola i jednostavno povlačenje privole;
- jasna obavijest što se šalje, kome i zašto;
- regija obrade, rok čuvanja, brisanje i pravo pristupa;
- podržani audioformati, ograničenja veličine i obrada pogrešaka;
- sigurnosni i ugovorni uvjeti odabranog pružatelja;
- stručna validacija svakog tumačenja prijepisa.

Do tada `SPEECH_TRANSCRIPTION` mora ostati u stanju `not-configured`.

Detaljni proizvodni i tehnički uvjeti, popis otvorenih odluka i izlazna kontrolna lista nalaze se u
[`PRIVACY_AND_CONSENT.md`](PRIVACY_AND_CONSENT.md). Taj dokument ne odobrava vanjski prijenos:
adapter ostaje isključen dok sve kontrolne točke nisu potvrđene.

## Lokalna iznimka za prototip diplomskog rada

Odobreni lokalni prototip koristi zaseban FastAPI/faster-whisper proces isključivo na
`127.0.0.1`. Preglednik ga nikada ne poziva izravno: Express šalje već spremljenu testnu
audiosnimku bez imena profila, očekivanog teksta, bodova ili drugih podataka sesije.

Ova lokalna iznimka:

- vrijedi samo za izmišljene profile i izmišljene ili odrasle testne snimke;
- ne odobrava vanjskog ASR pružatelja ni prijenos u oblak;
- vraća samo prijepis; `Podudarnost teksta` računa Express;
- ne mijenja bodove i ne prikazuje rezultat djetetu tijekom igre;
- ne uklanja snimku ako prijepis ne uspije.

Produkcijske i vanjske kontrolne točke u ovom dokumentu i dalje ostaju otvorene.
