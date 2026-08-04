import {
  AnswerOption,
  ContentImage,
  ContentPackage,
  ContentQuestion,
  Difficulty,
  ScoringRules,
} from '../models/content-package.model';

const CATALOG_IMAGES: Readonly<Record<string, ContentImage>> = {
  hrana: {
    src: '/assets/games/themes/food.webp',
    alt: 'Košara s voćem, povrćem i kruhom',
  },
  kuća: {
    src: '/assets/games/themes/home.webp',
    alt: 'Mekana igračka u obliku kuće',
  },
  priroda: {
    src: '/assets/games/themes/nature.webp',
    alt: 'Stablo, sunce, oblaci i cvijeće',
  },
  životinje: {
    src: '/assets/games/themes/animals.webp',
    alt: 'Lav, slon i zebra kao mekane igračke',
  },
  prijevoz: {
    src: '/assets/games/themes/transport.webp',
    alt: 'Automobil, avion i jedrilica kao igračke',
  },
  odjeća: {
    src: '/assets/games/themes/clothing.webp',
    alt: 'Džemper, kapa i čizme',
  },
  škola: {
    src: '/assets/games/themes/school.webp',
    alt: 'Školski ruksak, knjige i olovka',
  },
  igračke: {
    src: '/assets/games/themes/toys.webp',
    alt: 'Medvjedić, kocke i lopta',
  },
};

const yesNo = (sound: string): readonly AnswerOption[] => [
  { id: 'yes', label: `Čujem glas ${sound}` },
  { id: 'no', label: `Ne čujem glas ${sound}` },
];

const pairAnswers = (first: string, second: string): readonly AnswerOption[] => [
  { id: first, label: `Čujem glas ${first}` },
  { id: second, label: `Čujem glas ${second}` },
];

const positionAnswers = (includeMiddle = true): readonly AnswerOption[] =>
  includeMiddle
    ? [
        { id: 'start', label: 'Početak' },
        { id: 'middle', label: 'Sredina' },
        { id: 'end', label: 'Kraj' },
      ]
    : [
        { id: 'start', label: 'Početak' },
        { id: 'end', label: 'Kraj' },
      ];

const rules = (difficulty: Difficulty): ScoringRules => ({
  basePoints: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 15 : 20,
  secondAttemptMultiplier: 0.6,
  streakLength: 3,
  streakBonus: difficulty === 'HARD' ? 6 : 5,
  replayPenalty: 0,
  maxAttempts: 2,
});

const q = (
  id: string,
  spokenText: string,
  answers: readonly AnswerOption[],
  correctAnswerId: string,
  explanation: string,
  emoji?: string,
  taskText = 'Poslušaj i odaberi odgovor.',
): ContentQuestion => ({
  id,
  taskText,
  spokenText,
  displayText: spokenText,
  image: emoji ? { emoji, alt: `Ilustracija za pojam ${spokenText}` } : undefined,
  answers,
  correctAnswerIds: [correctAnswerId],
  explanation,
});

const withImageSrc = (question: ContentQuestion, src: string): ContentQuestion => ({
  ...question,
  image: {
    ...question.image,
    src,
    alt: question.image?.alt ?? `Ilustracija za pojam ${question.spokenText}`,
  },
});

const categoryOptions = (...labels: string[]): readonly AnswerOption[] =>
  labels.map((label) => ({ id: label.toLocaleLowerCase('hr-HR'), label }));

interface PronunciationWordPrompt {
  readonly id: string;
  readonly text: string;
  readonly emoji: string;
}

interface PronunciationSoundSet {
  readonly sound: string;
  readonly slug: string;
  readonly theme: string;
  readonly words: readonly PronunciationWordPrompt[];
}

const PRONUNCIATION_VOWELS = ['A', 'E', 'I', 'O'] as const;

const PRONUNCIATION_SOUND_SETS: readonly PronunciationSoundSet[] = [
  {
    sound: 'R',
    slug: 'r',
    theme: 'životinje',
    words: [
      { id: 'riba', text: 'riba', emoji: '🐟' },
      { id: 'rak', text: 'rak', emoji: '🦀' },
      { id: 'roda', text: 'roda', emoji: '🐦' },
      { id: 'tigar', text: 'tigar', emoji: '🐯' },
    ],
  },
  {
    sound: 'L',
    slug: 'l',
    theme: 'igračke',
    words: [
      { id: 'lopta', text: 'lopta', emoji: '⚽' },
      { id: 'lutka', text: 'lutka', emoji: '🪆' },
      { id: 'balon', text: 'balon', emoji: '🎈' },
      { id: 'vlak', text: 'vlak', emoji: '🚂' },
    ],
  },
  {
    sound: 'S',
    slug: 's',
    theme: 'priroda',
    words: [
      { id: 'sunce', text: 'sunce', emoji: '☀️' },
      { id: 'rosa', text: 'rosa', emoji: '💧' },
      { id: 'list', text: 'list', emoji: '🍃' },
      { id: 'snijeg', text: 'snijeg', emoji: '❄️' },
    ],
  },
  {
    sound: 'Z',
    slug: 'z',
    theme: 'životinje',
    words: [
      { id: 'zec', text: 'zec', emoji: '🐇' },
      { id: 'koza', text: 'koza', emoji: '🐐' },
      { id: 'zebra', text: 'zebra', emoji: '🦓' },
      { id: 'zmija', text: 'zmija', emoji: '🐍' },
    ],
  },
  {
    sound: 'Š',
    slug: 'sh',
    theme: 'škola',
    words: [
      { id: 'skola', text: 'škola', emoji: '🏫' },
      { id: 'skare', text: 'škare', emoji: '✂️' },
      { id: 'sestar', text: 'šestar', emoji: '📐' },
      { id: 'mis', text: 'miš', emoji: '🖱️' },
    ],
  },
  {
    sound: 'Ž',
    slug: 'zh',
    theme: 'životinje',
    words: [
      { id: 'zaba', text: 'žaba', emoji: '🐸' },
      { id: 'puz', text: 'puž', emoji: '🐌' },
      { id: 'jez', text: 'jež', emoji: '🦔' },
      { id: 'zirafa', text: 'žirafa', emoji: '🦒' },
    ],
  },
  {
    sound: 'C',
    slug: 'c',
    theme: 'odjeća',
    words: [
      { id: 'cipele', text: 'cipele', emoji: '👟' },
      { id: 'majica', text: 'majica', emoji: '👕' },
      { id: 'rukavice', text: 'rukavice', emoji: '🧤' },
      { id: 'kapica', text: 'kapica', emoji: '🧢' },
    ],
  },
  {
    sound: 'Č',
    slug: 'ch',
    theme: 'hrana',
    words: [
      { id: 'caj', text: 'čaj', emoji: '🫖' },
      { id: 'kolac', text: 'kolač', emoji: '🍰' },
      { id: 'naranca', text: 'naranča', emoji: '🍊' },
      { id: 'cokolada', text: 'čokolada', emoji: '🍫' },
    ],
  },
  {
    sound: 'Ć',
    slug: 'cj',
    theme: 'kuća',
    words: [
      { id: 'kuca', text: 'kuća', emoji: '🏠' },
      { id: 'svijeca', text: 'svijeća', emoji: '🕯️' },
      { id: 'vreca', text: 'vreća', emoji: '🛍️' },
      { id: 'pec', text: 'peć', emoji: '🔥' },
    ],
  },
];

const pronunciationPackages = PRONUNCIATION_SOUND_SETS.flatMap(({ sound, slug, theme, words }) => [
  {
    schemaVersion: 1,
    id: `izgovor-glas-${slug}`,
    gameType: 'pronunciation-practice',
    name: `Izgovori glas ${sound}`,
    description: `Poslušaj, snimi i poslušaj svoj glas ${sound}.`,
    objective: `Vježbanje samostalnog izgovora glasa ${sound}.`,
    targetSound: sound,
    practiceMode: 'SOUND',
    theme: 'igračke',
    difficulty: 'EASY',
    scoring: rules('EASY'),
    questions: PRONUNCIATION_VOWELS.map((vowel): ContentQuestion => {
      const syllable = `${sound}${vowel}`;
      return {
        id: `izgovor-${slug}-slog-${vowel.toLowerCase()}`,
        taskText: 'Poslušaj i izgovori glas.',
        spokenText: syllable,
        displayText: syllable,
        targetSound: sound,
        image: {
          emoji: '🗣️',
          alt: `Vježba izgovora sloga ${syllable}`,
        },
        answers: [],
        correctAnswerIds: [],
        explanation: `Snimka sloga ${syllable} spremljena je za tekstualno prepoznavanje.`,
      };
    }),
  },
  {
    schemaVersion: 1,
    id: `izgovor-rijeci-${slug}`,
    gameType: 'pronunciation-practice',
    name: `Izgovori riječi s glasom ${sound}`,
    description: `Poslušaj i snimi četiri riječi koje sadrže glas ${sound}.`,
    objective: `Vježbanje izgovora glasa ${sound} u cijelim riječima.`,
    targetSound: sound,
    practiceMode: 'WORD',
    theme,
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: words.map((word): ContentQuestion => ({
      id: `izgovor-${slug}-${word.id}`,
      taskText: 'Poslušaj i izgovori riječ.',
      spokenText: word.text,
      displayText: word.text,
      targetSound: sound,
      image: {
        emoji: word.emoji,
        alt: `Ilustracija za riječ ${word.text}`,
      },
      answers: [],
      correctAnswerIds: [],
      explanation: `Snimka riječi ${word.text} spremljena je za tekstualno prepoznavanje.`,
    })),
  },
]) satisfies readonly Omit<ContentPackage, 'catalogImage' | 'professionalReview'>[];

const DEMO_CONTENT_PACKAGE_DEFINITIONS = [
  {
    schemaVersion: 1,
    id: 'slusaj-hrana-s-lagano',
    gameType: 'listen-and-decide',
    name: 'Što jedemo?',
    description: 'Razvrstaj poznate namirnice u voće i povrće.',
    objective: 'Pažljivo slušanje i razumijevanje poznatih riječi.',
    theme: 'hrana',
    difficulty: 'EASY',
    scoring: rules('EASY'),
    questions: [
      withImageSrc(
        q('jabuka', 'Jabuka', categoryOptions('Voće', 'Povrće'), 'voće', 'Jabuka je voće.', '🍎'),
        '/assets/games/food/apple.webp',
      ),
      withImageSrc(
        q('mrkva', 'Mrkva', categoryOptions('Voće', 'Povrće'), 'povrće', 'Mrkva je povrće.', '🥕'),
        '/assets/games/food/carrot.webp',
      ),
      withImageSrc(
        q('banana', 'Banana', categoryOptions('Voće', 'Povrće'), 'voće', 'Banana je voće.', '🍌'),
        '/assets/games/food/banana.webp',
      ),
      withImageSrc(
        q(
          'krumpir',
          'Krumpir',
          categoryOptions('Voće', 'Povrće'),
          'povrće',
          'Krumpir je povrće.',
          '🥔',
        ),
        '/assets/games/food/potato.webp',
      ),
    ],
  },
  {
    schemaVersion: 1,
    id: 'slusaj-kuca-lr-srednje',
    gameType: 'listen-and-decide',
    name: 'Gdje to radimo?',
    description: 'Poveži kratku rečenicu s prostorijom u kući.',
    objective: 'Razumijevanje kratkih rečenica i pojmova iz doma.',
    theme: 'kuća',
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: [
      q(
        'kuhamo',
        'Kuhamo ručak.',
        categoryOptions('Kuhinja', 'Kupaonica'),
        'kuhinja',
        'Ručak najčešće kuhamo u kuhinji.',
      ),
      q(
        'zubi',
        'Peremo zube.',
        categoryOptions('Kupaonica', 'Dnevna soba'),
        'kupaonica',
        'Zube najčešće peremo u kupaonici.',
      ),
      q(
        'spavamo',
        'Spavamo u krevetu.',
        categoryOptions('Spavaća soba', 'Kuhinja'),
        'spavaća soba',
        'Krevet se nalazi u spavaćoj sobi.',
      ),
      q(
        'kauč',
        'Sjedimo na kauču.',
        categoryOptions('Dnevna soba', 'Kupaonica'),
        'dnevna soba',
        'Kauč se najčešće nalazi u dnevnoj sobi.',
      ),
    ],
  },
  {
    schemaVersion: 1,
    id: 'slusaj-priroda-zž-izazovno',
    gameType: 'listen-and-decide',
    name: 'Može li se dogoditi?',
    description: 'Procijeni je li rečenica moguća ili nemoguća.',
    objective: 'Pažljivo slušanje duljih rečenica i zaključivanje.',
    theme: 'priroda',
    difficulty: 'HARD',
    scoring: rules('HARD'),
    questions: [
      q(
        'riba-pliva',
        'Mala riba pliva u jezeru.',
        categoryOptions('Može', 'Ne može'),
        'može',
        'Ribe mogu plivati u jezeru.',
      ),
      q(
        'kamen-pjeva',
        'Veliki kamen pjeva na livadi.',
        categoryOptions('Može', 'Ne može'),
        'ne može',
        'Kamen ne može pjevati.',
      ),
      q(
        'kiša',
        'Nakon kiše na lišću ostaju kapljice.',
        categoryOptions('Može', 'Ne može'),
        'može',
        'Kapljice mogu ostati na lišću nakon kiše.',
      ),
      q(
        'oblak-trči',
        'Sivi oblak obuva cipele i trči.',
        categoryOptions('Može', 'Ne može'),
        'ne može',
        'Oblak ne može obuti cipele ni trčati.',
      ),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-zivotinje-r-lagano',
    gameType: 'catch-the-sound',
    name: 'Uhvati glas R',
    description: 'Prepoznaj čuješ li glas R u kratkim riječima.',
    objective: 'Slušno prepoznavanje glasa R.',
    targetSound: 'R',
    recognitionMode: 'DETECT',
    theme: 'životinje',
    difficulty: 'EASY',
    scoring: rules('EASY'),
    questions: [
      q('riba-r', 'riba', yesNo('R'), 'yes', 'U riječi riba čujemo glas R na početku.', '🐟'),
      q('roda-r', 'roda', yesNo('R'), 'yes', 'U riječi roda čujemo glas R na početku.', '🐦'),
      q('pas-r', 'pas', yesNo('R'), 'no', 'U riječi pas ne čujemo glas R.', '🐕'),
      q('mis-r', 'miš', yesNo('R'), 'no', 'U riječi miš ne čujemo glas R.', '🐭'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-kuca-l-srednje',
    gameType: 'catch-the-sound',
    name: 'Uhvati glas L',
    description: 'Potraži glas L na različitim mjestima u riječi.',
    objective: 'Slušno prepoznavanje glasa L.',
    targetSound: 'L',
    recognitionMode: 'DETECT',
    theme: 'kuća',
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: [
      q('lampa-l', 'lampa', yesNo('L'), 'yes', 'U riječi lampa čujemo glas L.', '💡'),
      q('stol-l', 'stol', yesNo('L'), 'yes', 'U riječi stol čujemo glas L.', '🪑'),
      q('tepih-l', 'tepih', yesNo('L'), 'no', 'U riječi tepih ne čujemo glas L.'),
      q('prozor-l', 'prozor', yesNo('L'), 'no', 'U riječi prozor ne čujemo glas L.', '🪟'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-prijevoz-sš-izazovno',
    gameType: 'catch-the-sound',
    name: 'Razlikuj S i Š',
    description: 'Pažljivo razlikuj slične glasove u riječima o prijevozu.',
    objective: 'Akustičko razlikovanje glasova S i Š.',
    targetSound: 'S',
    contrastSound: 'Š',
    soundPair: { primary: 'S', contrast: 'Š' },
    recognitionMode: 'DISCRIMINATE',
    theme: 'prijevoz',
    difficulty: 'HARD',
    scoring: rules('HARD'),
    questions: [
      q('semafor-sš', 'semafor', pairAnswers('S', 'Š'), 'S', 'U riječi semafor čujemo glas S.'),
      q('sina-sš', 'šina', pairAnswers('S', 'Š'), 'Š', 'U riječi šina čujemo glas Š.'),
      q('skuter-sš', 'skuter', pairAnswers('S', 'Š'), 'S', 'U riječi skuter čujemo glas S.', '🛴'),
      q(
        'autobus-sš',
        'autobus',
        pairAnswers('S', 'Š'),
        'S',
        'U riječi autobus čujemo glas S.',
        '🚌',
      ),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-hrana-zž-srednje',
    gameType: 'catch-the-sound',
    name: 'Razlikuj Z i Ž',
    description: 'Odaberi koji glas čuješ u riječima o hrani.',
    objective: 'Akustičko razlikovanje glasova Z i Ž.',
    targetSound: 'Z',
    contrastSound: 'Ž',
    soundPair: { primary: 'Z', contrast: 'Ž' },
    recognitionMode: 'DISCRIMINATE',
    theme: 'hrana',
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: [
      q('zelje-zž', 'zelje', pairAnswers('Z', 'Ž'), 'Z', 'U riječi zelje čujemo glas Z.'),
      q('zlica-zž', 'žlica', pairAnswers('Z', 'Ž'), 'Ž', 'U riječi žlica čujemo glas Ž.'),
      q('grozde-zž', 'grožđe', pairAnswers('Z', 'Ž'), 'Ž', 'U riječi grožđe čujemo glas Ž.', '🍇'),
      q(
        'zitarice-zž',
        'žitarice',
        pairAnswers('Z', 'Ž'),
        'Ž',
        'U riječi žitarice čujemo glas Ž.',
        '🥣',
      ),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-odjeca-c-lagano',
    gameType: 'catch-the-sound',
    name: 'Uhvati glas C',
    description: 'Pronađi glas C u poznatim riječima o odjeći.',
    objective: 'Slušno prepoznavanje glasa C.',
    targetSound: 'C',
    recognitionMode: 'DETECT',
    theme: 'odjeća',
    difficulty: 'EASY',
    scoring: rules('EASY'),
    questions: [
      q('cipele-c', 'cipele', yesNo('C'), 'yes', 'U riječi cipele čujemo glas C.', '👟'),
      q('majica-c', 'majica', yesNo('C'), 'yes', 'U riječi majica čujemo glas C.', '👕'),
      q('kapa-c', 'kapa', yesNo('C'), 'no', 'U riječi kapa ne čujemo glas C.', '🧢'),
      q('sal-c', 'šal', yesNo('C'), 'no', 'U riječi šal ne čujemo glas C.', '🧣'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-skola-cč-izazovno',
    gameType: 'catch-the-sound',
    name: 'Razlikuj C i Č',
    description: 'Razlikuj glasove C i Č u riječima iz škole.',
    objective: 'Akustičko razlikovanje glasova C i Č.',
    targetSound: 'C',
    contrastSound: 'Č',
    soundPair: { primary: 'C', contrast: 'Č' },
    recognitionMode: 'DISCRIMINATE',
    theme: 'škola',
    difficulty: 'HARD',
    scoring: rules('HARD'),
    questions: [
      q('crta-cč', 'crta', pairAnswers('C', 'Č'), 'C', 'U riječi crta čujemo glas C.'),
      q(
        'citanka-cč',
        'čitanka',
        pairAnswers('C', 'Č'),
        'Č',
        'U riječi čitanka čujemo glas Č.',
        '📖',
      ),
      q(
        'biljeznica-cč',
        'bilježnica',
        pairAnswers('C', 'Č'),
        'C',
        'U riječi bilježnica čujemo glas C.',
        '📓',
      ),
      q('ploca-cč', 'ploča', pairAnswers('C', 'Č'), 'Č', 'U riječi ploča čujemo glas Č.'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-igracke-čć-izazovno',
    gameType: 'catch-the-sound',
    name: 'Razlikuj Č i Ć',
    description: 'Pažljivo razlikuj glasove Č i Ć kroz poznate pojmove.',
    objective: 'Akustičko razlikovanje glasova Č i Ć.',
    targetSound: 'Č',
    contrastSound: 'Ć',
    soundPair: { primary: 'Č', contrast: 'Ć' },
    recognitionMode: 'DISCRIMINATE',
    theme: 'igračke',
    difficulty: 'HARD',
    scoring: rules('HARD'),
    questions: [
      q('cun-čć', 'čun', pairAnswers('Č', 'Ć'), 'Č', 'U riječi čun čujemo glas Č.', '⛵'),
      q(
        'kuca-čć',
        'kuća za lutke',
        pairAnswers('Č', 'Ć'),
        'Ć',
        'U riječi kuća čujemo glas Ć.',
        '🏠',
      ),
      q('psic-čć', 'psić', pairAnswers('Č', 'Ć'), 'Ć', 'U riječi psić čujemo glas Ć.', '🐶'),
      q('macka-čć', 'mačka', pairAnswers('Č', 'Ć'), 'Č', 'U riječi mačka čujemo glas Č.', '🐈'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'uhvati-skola-ć-srednje',
    gameType: 'catch-the-sound',
    name: 'Uhvati glas Ć',
    description: 'Prepoznaj glas Ć u riječima povezanima sa školskim danom.',
    objective: 'Slušno prepoznavanje glasa Ć.',
    targetSound: 'Ć',
    recognitionMode: 'DETECT',
    theme: 'škola',
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: [
      q('zadaca-ć', 'zadaća', yesNo('Ć'), 'yes', 'U riječi zadaća čujemo glas Ć.', '📝'),
      q('vrecica-ć', 'vrećica', yesNo('Ć'), 'yes', 'U riječi vrećica čujemo glas Ć.', '🛍️'),
      q('ucenik-ć', 'učenik', yesNo('Ć'), 'no', 'U riječi učenik čujemo Č, ali ne Ć.', '🧑‍🎓'),
      q('ploca-ć', 'ploča', yesNo('Ć'), 'no', 'U riječi ploča čujemo Č, ali ne Ć.'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'pozicija-hrana-s-lagano',
    gameType: 'sound-position',
    name: 'Gdje je S?',
    description: 'Pronađi glas S na početku ili kraju riječi.',
    objective: 'Određivanje položaja glasa S u kratkim riječima.',
    targetSound: 'S',
    theme: 'hrana',
    difficulty: 'EASY',
    scoring: rules('EASY'),
    questions: [
      q('sir-s', 'sir', positionAnswers(false), 'start', 'Glas S je na početku riječi sir.', '🧀'),
      q('sok-s', 'sok', positionAnswers(false), 'start', 'Glas S je na početku riječi sok.', '🧃'),
      q(
        'ananas-s',
        'ananas',
        positionAnswers(false),
        'end',
        'Glas S je na kraju riječi ananas.',
        '🍍',
      ),
      q('keks-s', 'keks', positionAnswers(false), 'end', 'Glas S je na kraju riječi keks.', '🍪'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'pozicija-priroda-š-srednje',
    gameType: 'sound-position',
    name: 'Gdje je Š?',
    description: 'Pronađi glas Š na početku, u sredini ili na kraju.',
    objective: 'Određivanje položaja glasa Š u riječi.',
    targetSound: 'Š',
    theme: 'priroda',
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: [
      q(
        'kruska-š',
        'kruška',
        positionAnswers(),
        'middle',
        'Glas Š je u sredini riječi kruška.',
        '🍐',
      ),
      q('suma-š', 'šuma', positionAnswers(), 'start', 'Glas Š je na početku riječi šuma.', '🌳'),
      q('mis-š', 'miš', positionAnswers(), 'end', 'Glas Š je na kraju riječi miš.', '🐭'),
      q(
        'kosara-š',
        'košara',
        positionAnswers(),
        'middle',
        'Glas Š je u sredini riječi košara.',
        '🧺',
      ),
    ],
  },
  {
    schemaVersion: 1,
    id: 'pozicija-kuca-z-izazovno',
    gameType: 'sound-position',
    name: 'Gdje je Z?',
    description: 'Slušaj dulje riječi i pronađi položaj glasa Z.',
    objective: 'Precizno određivanje položaja glasa Z.',
    targetSound: 'Z',
    theme: 'kuća',
    difficulty: 'HARD',
    scoring: rules('HARD'),
    questions: [
      q('zavjesa-z', 'zavjesa', positionAnswers(), 'start', 'Glas Z je na početku riječi zavjesa.'),
      q(
        'prozor-z',
        'prozor',
        positionAnswers(),
        'middle',
        'Glas Z je u sredini riječi prozor.',
        '🪟',
      ),
      q('ulaz-z', 'ulaz', positionAnswers(), 'end', 'Glas Z je na kraju riječi ulaz.'),
      q('vaza-z', 'vaza', positionAnswers(), 'middle', 'Glas Z je u sredini riječi vaza.', '🏺'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'pozicija-zivotinje-ž-srednje',
    gameType: 'sound-position',
    name: 'Gdje je Ž?',
    description: 'Pronađi položaj glasa Ž u riječima o životinjama.',
    objective: 'Određivanje položaja glasa Ž.',
    targetSound: 'Ž',
    theme: 'životinje',
    difficulty: 'MEDIUM',
    scoring: rules('MEDIUM'),
    questions: [
      q('zaba-ž', 'žaba', positionAnswers(), 'start', 'Glas Ž je na početku riječi žaba.', '🐸'),
      q('jezek-ž', 'jež', positionAnswers(), 'end', 'Glas Ž je na kraju riječi jež.', '🦔'),
      q('mreza-ž', 'mreža', positionAnswers(), 'middle', 'Glas Ž je u sredini riječi mreža.'),
      q('puž-ž', 'puž', positionAnswers(), 'end', 'Glas Ž je na kraju riječi puž.', '🐌'),
    ],
  },
  {
    schemaVersion: 1,
    id: 'pozicija-prijevoz-lr-izazovno',
    gameType: 'sound-position',
    name: 'Putovanje s L i R',
    description: 'Pronađi glas L dok se u riječima pojavljuje i kontrastni R.',
    objective: 'Položaj glasa L uz razlikovanje od glasa R.',
    targetSound: 'L',
    contrastSound: 'R',
    soundPair: { primary: 'L', contrast: 'R' },
    theme: 'prijevoz',
    difficulty: 'HARD',
    scoring: rules('HARD'),
    questions: [
      q(
        'lokomotiva-l',
        'lokomotiva',
        positionAnswers(),
        'start',
        'Glas L je na početku riječi lokomotiva.',
        '🚂',
      ),
      q('let-l', 'let', positionAnswers(), 'start', 'Glas L je na početku riječi let.', '✈️'),
      q('bicikl-l', 'bicikl', positionAnswers(), 'end', 'Glas L je na kraju riječi bicikl.', '🚲'),
      q(
        'trolejbus-l',
        'trolejbus',
        positionAnswers(),
        'middle',
        'Glas L je u sredini riječi trolejbus.',
        '🚎',
      ),
    ],
  },
  ...pronunciationPackages,
] satisfies readonly Omit<ContentPackage, 'professionalReview'>[];

export const DEMO_CONTENT_PACKAGES: readonly ContentPackage[] =
  DEMO_CONTENT_PACKAGE_DEFINITIONS.map((contentPackage) => ({
    ...contentPackage,
    catalogImage: CATALOG_IMAGES[contentPackage.theme],
    professionalReview: { status: 'NOT_REVIEWED' },
  }));
