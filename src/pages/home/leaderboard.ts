type Player = {
  rank: number;
  name: string;
  nameShort: string;
  initials: string;
  games: string;
  score: string;
  scoreShort: string;
  streak: string;
  streakShort: string;
  favorite: string;
};

const PLAYERS: Player[] = [
  {
    rank: 1,
    name: 'Alex_Pro99',
    nameShort: 'Alex_Pro99',
    initials: 'AP',
    games: '142',
    score: '94,250',
    scoreShort: '94.2K',
    streak: '12 days',
    streakShort: '12d',
    favorite: 'Heartopia',
  },
  {
    rank: 2,
    name: 'CozyGamer_x',
    nameShort: 'CozyGamer',
    initials: 'CG',
    games: '118',
    score: '81,400',
    scoreShort: '81.4K',
    streak: '8 days',
    streakShort: '8d',
    favorite: 'Cat Mail Co.',
  },
  {
    rank: 3,
    name: 'MatchMaster',
    nameShort: 'MatchMaster',
    initials: 'MM',
    games: '98',
    score: '72,110',
    scoreShort: '72.1K',
    streak: '5 days',
    streakShort: '5d',
    favorite: 'Tiny Glade',
  },
  {
    rank: 4,
    name: 'BubblePop',
    nameShort: 'BubblePop',
    initials: 'BP',
    games: '87',
    score: '65,900',
    scoreShort: '65.9K',
    streak: '3 days',
    streakShort: '3d',
    favorite: 'Whisper of the House',
  },
  {
    rank: 5,
    name: 'SudokuGod',
    nameShort: 'SudokuGod',
    initials: 'SG',
    games: '74',
    score: '59,320',
    scoreShort: '59.3K',
    streak: '2 days',
    streakShort: '2d',
    favorite: 'Cat Chess',
  },
];

export class Leaderboard {
  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'leaderboard';
    section.setAttribute('aria-label', 'Top players');
    section.append(this.createHeader(), this.createTable());

    return section;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'leaderboard__header';

    const accent = document.createElement('span');
    accent.className = 'leaderboard__accent';

    const title = document.createElement('h2');
    title.className = 'leaderboard__title';
    title.textContent = 'Top Players This Week';

    header.append(accent, title);

    return header;
  }

  private createTable(): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'leaderboard__table';

    table.setAttribute('aria-label', 'Top players this week');
    table.append(this.createHead(), this.createBody());

    return table;
  }

  private createHead(): HTMLTableSectionElement {
    const thead = document.createElement('thead');
    const row = document.createElement('tr');

    row.append(
      this.createHeadCell('Rank'),
      this.createHeadCell('Player', 'player'),
      this.createPairHead('Games Played', 'Games', 'games'),
      this.createPairHead('Total Score', 'Score', 'score'),
      this.createHeadCell('Streak'),
      this.createHeadCell('Favorite Game', 'favorite'),
    );

    thead.append(row);

    return thead;
  }

  private createHeadCell(label: string, extraClass?: string): HTMLTableCellElement {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;

    if (extraClass) {
      th.className = `leaderboard__col--${extraClass}`;
    }

    return th;
  }

  private createPairHead(full: string, short: string, extraClass: string): HTMLTableCellElement {
    const th = document.createElement('th');
    th.scope = 'col';
    th.className = `leaderboard__col--${extraClass}`;
    th.append(this.createPair(full, short));

    return th;
  }

  private createPair(full: string, short: string): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const fullEl = document.createElement('span');
    fullEl.className = 'leaderboard__full';
    fullEl.textContent = full;

    const shortEl = document.createElement('span');
    shortEl.className = 'leaderboard__short';
    shortEl.textContent = short;

    fragment.append(fullEl, shortEl);

    return fragment;
  }

  private createBody(): HTMLTableSectionElement {
    const tbody = document.createElement('tbody');

    PLAYERS.forEach((player) => {
      tbody.append(this.createRow(player));
    });

    return tbody;
  }

  private createRow(player: Player): HTMLTableRowElement {
    const row = document.createElement('tr');

    if (player.rank > 3) {
      row.className = 'leaderboard__row--extra';
    }

    row.append(
      this.createCell(`#${player.rank}`),
      this.createPlayerCell(player),
      this.createCell(player.games, 'games'),
      this.createScoreCell(player),
      this.createStreakCell(player),
      this.createFavoriteCell(player.favorite),
    );

    return row;
  }

  private createCell(text: string, extraClass?: string): HTMLTableCellElement {
    const td = document.createElement('td');
    td.textContent = text;

    if (extraClass) {
      td.className = `leaderboard__col--${extraClass}`;
    }

    return td;
  }

  private createPlayerCell(player: Player): HTMLTableCellElement {
    const td = document.createElement('td');
    td.className = 'leaderboard__col--player';

    const wrap = document.createElement('div');
    wrap.className = 'leaderboard__player';

    const avatar = document.createElement('span');
    avatar.className = `leaderboard__avatar leaderboard__avatar--${player.rank}`;
    avatar.textContent = player.initials;
    avatar.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'leaderboard__name';
    name.append(this.createPair(player.name, player.nameShort));

    wrap.append(avatar, name);
    td.append(wrap);

    return td;
  }

  private createScoreCell(player: Player): HTMLTableCellElement {
    const td = document.createElement('td');
    td.className = 'leaderboard__col--score';
    td.append(this.createPair(player.score, player.scoreShort));

    return td;
  }

  private createStreakCell(player: Player): HTMLTableCellElement {
    const td = document.createElement('td');
    const prefix = player.rank === 1 ? '🔥 ' : '';
    td.append(this.createPair(`${prefix}${player.streak}`, `${prefix}${player.streakShort}`));

    return td;
  }

  private createFavoriteCell(game: string): HTMLTableCellElement {
    const td = document.createElement('td');
    td.className = 'leaderboard__col--favorite';

    const chip = document.createElement('span');
    chip.className = 'leaderboard__chip';
    chip.textContent = game;

    td.append(chip);

    return td;
  }
}
