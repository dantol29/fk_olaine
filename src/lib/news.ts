export type NewsItem = {
  seed: string;
  title: string;
  date: string;
  image?: string;
};

export const NEWS: NewsItem[] = [
  {
    seed: "fkolaine-news-1",
    title: "FK Olaine izcīna svarīgu uzvaru izbraukumā",
    date: "2. septembris",
    image: "/news/fkolaine-news-1.jpg",
  },
  {
    seed: "fkolaine-news-2",
    title: "Spraiga cīņa līdz pēdējai minūtei",
    date: "28. augusts",
  },
  {
    seed: "fkolaine-news-3",
    title: "Nedēļas spēlētāja: intervija ar kapteini",
    date: "20. augusts",
  },
];
