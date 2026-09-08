export type ArticleCategory =
  | "Klubs"
  | "Komandas"
  | "Spēles"
  | "Treniņi"
  | "Pasākumi";

export type ArticleQuote = {
  text: string;
  author: string;
  role: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: ArticleCategory;
  /** Short team tag shown on the article page (e.g. "U14"), distinct from
   *  the broader `category` used for the list-page badges. */
  team?: string;
  image: string;
  body: string[];
  quote?: ArticleQuote;
  highlights?: string[];
  closing?: string;
  signature?: string;
};

/** Main reverse-chronological feed. */
export const ARTICLES: Article[] = [
  {
    slug: "u14-aizvada-parliecinosu-uzvaru",
    title: "U14 aizvada pārliecinošu uzvaru čempionāta spēlē",
    excerpt:
      "FK Olaine U14 komanda izcīna svarīgu uzvaru, demonstrējot raksturu un lielisku komandas spēli.",
    date: "5. sept. 2026",
    category: "Komandas",
    team: "U14",
    image: "/team-huddle.png",
    body: [
      "FK Olaine U14 komanda aizvadīja kārtējo čempionāta spēli, kurā ar pārliecinošu sniegumu izcīnīja uzvaru. Spēle norisinājās Olaines pilsētas stadionā, pulcējot kuplu līdzjutēju skaitu, kuri visas 80 minūtes aktīvi atbalstīja mūsu komandu.",
      "Mūsu spēlētāji parādīja lielisku komandas spēli, augstu disciplīnu un vēlmi uzvarēt. Pēc līdzvērtīga pirmā puslaika, otrajā puslaikā izdevās pārņemt iniciatīvu un gūt vairākus vārtus, nodrošinot pārliecinošu uzvaru.",
    ],
    quote: {
      text: "Puiši parādīja raksturu un to, pie kā mēs strādājam treniņos. Šī uzvara ir visas komandas nopelns.",
      author: "Jānis Bērziņš",
      role: "U14 galvenais treneris",
    },
    highlights: ["/player-shooting.png", "/match-action.png", "/training-drill.png"],
    closing:
      "Paldies visiem līdzjutējiem par atbalstu! Tiekamies nākamajās spēlēs, kur turpināsim cīnīties un augt kopā.",
    signature: "FK Olaine U14 komanda",
  },
  {
    slug: "jaunais-treneru-sastavs",
    title: "Jaunais treneru sastāvs gatavs jauniem izaicinājumiem",
    excerpt: "Iepazīstinām ar treneriem, kuri šosezon vadīs mūsu komandas.",
    date: "1. sept. 2026",
    category: "Klubs",
    image: "/bench-gear.png",
    body: [
      "Iepazīstinām ar treneriem, kuri šosezon vadīs mūsu komandas.",
    ],
  },
  {
    slug: "1-komanda-izciena-uzvaru-majas",
    title: "1. komanda izcīna svarīgu uzvaru mājās",
    excerpt:
      "Spraigā un emocionālā spēlē mūsu komanda pārspēj pretiniekus ar 2:1.",
    date: "29. aug. 2026",
    category: "Spēles",
    team: "1. komanda",
    image: "/match-action.png",
    body: [
      "Spraigā un emocionālā spēlē mūsu komanda pārspēj pretiniekus ar 2:1.",
    ],
  },
  {
    slug: "u12-sak-gatavosanos-rudens-sezonai",
    title: "U12 sāk gatavošanos rudens sezonai",
    excerpt:
      "Aizvadīts pirmais treniņš pēc vasaras pārtraukuma. Skatāmies uz priekšu!",
    date: "25. aug. 2026",
    category: "Treniņi",
    team: "U12",
    image: "/training-drill.png",
    body: [
      "Aizvadīts pirmais treniņš pēc vasaras pārtraukuma. Skatāmies uz priekšu!",
    ],
  },
];

/** Editor's picks shown in the sidebar, independent of the main feed's
 *  category/search filters. */
export const FEATURED_ARTICLES: {
  title: string;
  date: string;
  image: string;
}[] = [
  {
    title: "Jauns treniņu laukums Olaines sporta bāzē",
    date: "3. sept. 2026",
    image: "/stadium-sunset.png",
  },
  {
    title: "Apsveicam mūsu spēlētāju ar izsaukumu uz izlasi!",
    date: "28. aug. 2026",
    image: "/player-shooting.png",
  },
  {
    title: "Atklājam jauno sezonu",
    date: "21. aug. 2026",
    image: "/fkolaine-team.jpg",
  },
  {
    title: "FK Olaine turpina attīstīties",
    date: "15. aug. 2026",
    image: "/fk-olaine-crest-v2.png",
  },
];
