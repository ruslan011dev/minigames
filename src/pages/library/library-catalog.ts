import catMailUrl from '../../assets/images/cat-mail-co-card.jpg';
import heartopiaUrl from '../../assets/images/heartopia-card.jpg';
import paliaUrl from '../../assets/images/palia-card.jpg';
import shelveUrl from '../../assets/images/shelve-the-potions-card.jpg';
import vacationUrl from '../../assets/images/vacation-cafe-simulator-card.jpg';
import winterUrl from '../../assets/images/winter-burrow-card.jpg';
import categoriesFile from '../../mock-data/categories.json';
import gamesFile from '../../mock-data/all-games-seed.json';

const LIBRARY_PAGE_SIZE = 6;

const CARD_IMAGES: Record<string, string> = {
  'vacation-cafe-simulator': vacationUrl,
  'winter-burrow': winterUrl,
  'shelve-the-potions': shelveUrl,
  heartopia: heartopiaUrl,
  palia: paliaUrl,
  'cat-mail-co': catMailUrl,
};

const CARD_ORDER = [
  'vacation-cafe-simulator',
  'winter-burrow',
  'shelve-the-potions',
  'heartopia',
  'palia',
  'cat-mail-co',
];

export type LibraryGame = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: string;
  description: string;
  rating: string;
  likes: string;
  image: string;
};

const catalog: LibraryGame[] = CARD_ORDER.flatMap((slug) => {
  const game = gamesFile.data.find((item) => item.slug === slug);
  const image = CARD_IMAGES[slug];

  if (!game || !image) {
    return [];
  }

  return [
    {
      slug: game.slug,
      name: game.name,
      category: game.category,
      categoryLabel: categoryLabel(game.category),
      price: game.price,
      description: game.shortDescription,
      rating: game.rating.toFixed(1),
      likes: formatLikes(game.likesCount),
      image,
    },
  ];
});

export function selectLibraryGames(category: string, sort: string | null): LibraryGame[] {
  const filtered =
    category === 'all' ? catalog : catalog.filter((game) => game.category === category);
  const ordered = sort ? sortGames(filtered, sort) : filtered;

  return ordered.slice(0, LIBRARY_PAGE_SIZE);
}

function categoryLabel(slug: string): string {
  return categoriesFile.data.find((item) => item.slug === slug)?.label ?? slug;
}

function formatLikes(count: number): string {
  if (count < 1000) {
    return String(count);
  }

  const thousands = Math.floor(count / 100) / 10;
  return `${thousands.toFixed(1)}K`;
}

function sortGames(games: LibraryGame[], sort: string): LibraryGame[] {
  const next = [...games];

  next.sort((left, right) => {
    if (sort === 'name-asc') {
      return left.name.localeCompare(right.name);
    }

    if (sort === 'name-desc') {
      return right.name.localeCompare(left.name);
    }

    const leftRating = Number(left.rating);
    const rightRating = Number(right.rating);

    if (sort === 'rating-asc') {
      return leftRating - rightRating;
    }

    return rightRating - leftRating;
  });

  return next;
}
