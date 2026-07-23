# Zahtjevi privatnosti, privole i čuvanja podataka

## Svrha dokumenta

Ovaj dokument definira proizvodne i tehničke uvjete koje Artikulino mora ispuniti prije bilo kakvog
slanja dječje snimke van preglednika. Ne predstavlja pravno mišljenje niti odobrenje za uključivanje
ASR-a. Prije takve promjene imenovani voditelj obrade mora potvrditi pravnu osnovu i pribaviti
odgovarajući pravni, sigurnosni i stručni pregled.

## Trenutačni MVP

| Podatak                | Mjesto obrade                                  | Čuvanje                                                                                   | Vanjski prijenos |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------- |
| Rezultat završene igre | `localStorage` uređaja                         | Najnovijih 100 sesija, do brisanja na stranici Napredak ili brisanja podataka preglednika | Nema             |
| Snimka mikrofona       | Memorija preglednika i privremeni objektni URL | Do ručnog brisanja, nove snimke ili napuštanja komponente                                 | Nema             |
| ASR zahtjev            | Zadani adapter je `not-configured`             | Ne nastaje                                                                                | Nema             |

MVP nema korisničke račune, ime djeteta, adresu e-pošte, analitiku ni sinkronizaciju. Lokalni rezultat
sadrži podatke o paketu i uspješnosti vježbe, ali ne sadrži audiozapis ni prijepis.

## Obvezne odluke

Prije razvoja integracije moraju se zapisati i odobriti:

1. pravna osoba koja je voditelj obrade i kontakt za privatnost;
2. točna svrha obrade snimke i odgovarajuća pravna osnova za tu svrhu;
3. ciljana dob, način provjere dobi i način provjere nositelja roditeljske odgovornosti;
4. pružatelj ASR usluge, izvršitelji i podizvršitelji obrade te regije obrade;
5. ugovoreno čuvanje, brisanje, zabrana treniranja modela i zabrana sekundarne uporabe;
6. postupak za pristup, brisanje, povlačenje privole, prigovor i sigurnosni incident;
7. je li potrebna procjena učinka na zaštitu podataka (DPIA), uz dokumentirano obrazloženje odluke.

Ako se obrada temelji na privoli za uslugu informacijskog društva izravno ponuđenu djetetu, za djecu
mlađu od 16 godina u Hrvatskoj privolu mora dati ili odobriti nositelj roditeljske odgovornosti.
Odabranu pravnu osnovu ipak mora potvrditi voditelj obrade; privola se ne smije koristiti kao
automatski ili rezervni temelj.

## Zahtjevi za privolu i obavijest

- Dopuštenje preglednika za mikrofon nije privola za vanjski prijenos.
- Odbijanje ili povlačenje privole ne smije onemogućiti lokalnu igru, snimanje i preslušavanje.
- Privola mora biti dobrovoljna, posebna, informirana, nedvosmislena i odvojena po svrsi.
- Ne smiju se koristiti unaprijed označene kućice, šutnja ili nastavak korištenja kao privola.
- Povlačenje mora biti jednako jednostavno kao davanje i mora zaustaviti buduće prijenose.
- Prije svakog prijenosa korisnik mora napraviti jasnu radnju; nema pozadinskog ni kontinuiranog
  slanja.
- Obavijest za roditelja mora navesti podatke, svrhu, primatelje, regiju, rok čuvanja, prava i kontakt.
- Dijete mora dobiti kratku, dobno primjerenu obavijest na hrvatskom jeziku.
- Dokaz privole mora sadržavati samo nužne podatke: verziju obavijesti, svrhu, vrijeme, način
  provjere i povlačenje. Mjesto čuvanja tog dokaza još nije odobreno.

## Zahtjevi za podatke i sigurnost

- ASR zahtjev ostaje ograničen na audiozapis i `hr-HR`; ne dodaju se ime djeteta, očekivana riječ,
  rezultat, paket ni stabilni identifikator.
- Aplikacija zadano ne čuva audiozapis ni prijepis nakon odgovora servisa.
- Tehnički zapisi ne smiju sadržavati audiozapis, prijepis ili drugi sadržaj koji dijete izgovori.
- Pružatelj mora ugovorno isključiti treniranje modela i sekundarnu uporabu podataka.
- Prednost ima obrada bez zadržavanja podataka u EGP-u. Svako drugačije rješenje zahtijeva zasebno
  dokumentiranje prijenosa i odobrenje.
- Dugotrajni API ključ ne smije biti ugrađen u klijentsku aplikaciju. Ako pružatelj zahtijeva tajnu,
  potreban je zasebno odobren poslužiteljski servis za kratkotrajne tokene.
- Neuspjeh, odbijanje privole ili nedostupnost pružatelja ne smije utjecati na bodove ni završetak
  igre.
- Prijepis i pouzdanost prepoznavanja ne smiju se prikazivati kao procjena pravilnosti izgovora,
  dijagnoza ili stručna preporuka.

## Model računa i pristupa

Za MVP ostaje odluka **bez računa**. Lokalni napredak može izbrisati korisnik uređaja.

Ako se kasnije uvedu računi:

- roditelj ili skrbnik upravlja dječjim profilom, privolom, pristupom i brisanjem;
- dječji profil koristi pseudonim i najmanji nužni skup podataka;
- pristup logopeda zahtijeva zasebnu, opozivu poveznicu koju odobri roditelj ili skrbnik;
- svaka uloga dobiva samo nužni pristup, uz zapis promjena i mogućnost opoziva;
- račun, sinkronizacija i dijeljenje ostaju zasebni projekti i nisu preduvjet lokalnog MVP-a.

## Uvjeti za početak implementacije

`SPEECH_TRANSCRIPTION` mora ostati `not-configured` dok svi sljedeći uvjeti nisu ispunjeni:

- [ ] imenovani voditelj obrade i kontakt;
- [ ] odobrena svrha, pravna osnova i ciljana dob;
- [ ] odobren način provjere roditelja ili skrbnika;
- [ ] odabran pružatelj i pregledani ugovori, podizvršitelji, regije i sigurnost;
- [ ] potvrđeno čuvanje, brisanje, bez treniranja i bez sadržaja u zapisima;
- [ ] odobren tekst obavijesti i postupak povlačenja;
- [ ] procijenjena potreba za DPIA-om;
- [ ] odobren tehnički model tokena bez tajne u klijentu;
- [ ] zasebno korisnikovo odobrenje za implementaciju vanjskog prijenosa.

## Službeni izvori

- [Opća uredba o zaštiti podataka, osobito članci 5, 7, 8, 12–13 i 25](https://eur-lex.europa.eu/legal-content/HR/TXT/?uri=CELEX%3A32016R0679)
- [EDPB: zaštita podataka djece](https://www.edpb.europa.eu/topics/key-gdpr-concepts/children_en)
- [EDPB: osnove zaštite podataka za male organizacije](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en)
- [AZOP: privola i dobna granica u Hrvatskoj](https://azop.hr/privola/)
