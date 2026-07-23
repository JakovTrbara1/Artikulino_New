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

## Audiozapisi hrane

| Datoteka                                     | Tekst   | Izvor                        | Format                    |
| -------------------------------------------- | ------- | ---------------------------- | ------------------------- |
| `public/assets/games/audio/food/jabuka.wav`  | Jabuka  | Microsoft Matej, lokalni TTS | WAV, mono, 16-bit, 16 kHz |
| `public/assets/games/audio/food/mrkva.wav`   | Mrkva   | Microsoft Matej, lokalni TTS | WAV, mono, 16-bit, 16 kHz |
| `public/assets/games/audio/food/banana.wav`  | Banana  | Microsoft Matej, lokalni TTS | WAV, mono, 16-bit, 16 kHz |
| `public/assets/games/audio/food/krumpir.wav` | Krumpir | Microsoft Matej, lokalni TTS | WAV, mono, 16-bit, 16 kHz |

- Datum izrade: 2026-07-23.
- Zapisi su izrađeni offline glasom `Microsoft Matej` (`hr-HR`) iz Windows OneCore sustava, bez
  slanja teksta vanjskom servisu.
- Brzina govora postavljena je na `0.82` u odnosu na zadanu brzinu glasa.
- Tehnička provjera potvrdila je valjani PCM WAV, jedan kanal, 16-bitni uzorak, 16 kHz i trajanje od
  1,585 do 1,822 sekunde.
- Status slušne provjere: **nije provedena**. Izvorni govornik hrvatskog jezika treba potvrditi
  izgovor i naglasak prije javne uporabe ili zamijeniti zapise profesionalnim snimkama.
- Prije javne distribucije vlasnik projekta treba potvrditi primjenjive uvjete korištenja glasa i
  generiranih zapisa.
