import { ApiError, isAbortError } from '../../api/client';
import { getLeaderboard, type LeaderboardPlayer } from '../../api/leaderboard';
import { createEmptyState, createErrorBanner } from '../../components/feedback/feedback';
import { snackbar } from '../../components/snackbar/snackbar';
import { formatCompactCount, formatScore } from '../../utils/format';

type PlayerRow = {
  rank: number;
  name: string;
  initials: string;
  games: string;
  score: string;
  scoreShort: string;
  streak: string;
  streakShort: string;
  favorite: string;
};

const SKELETON_ROWS = 5;
const SKELETON_COLUMNS = ['', 'player', 'games', 'score', '', 'favorite'] as const;

export class Leaderboard {
  private panel: HTMLElement | null = null;
  private controller: AbortController | null = null;
  private alive = true;
  private hadError = false;

  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'leaderboard';
    section.setAttribute('aria-labelledby', 'leaderboard-title');

    const panel = document.createElement('div');
    panel.className = 'leaderboard__panel';
    this.panel = panel;

    section.append(this.createHeader(), panel);
    this.showLoading();
    void this.load();

    return section;
  }

  public destroy(): void {
    this.alive = false;
    this.controller?.abort();
  }

  private load = async (): Promise<void> => {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.showLoading();

    try {
      const players = await getLeaderboard(controller.signal);

      if (!this.alive || controller.signal.aborted) {
        return;
      }

      if (players.length === 0) {
        this.showEmpty();
        snackbar.show('No leaderboard results right now.', 'warning');
        return;
      }

      this.showPlayers(players);

      if (this.hadError) {
        this.hadError = false;
        snackbar.show('Leaderboard loaded.', 'success');
      }
    } catch (error) {
      if (!this.alive || isAbortError(error)) {
        return;
      }

      this.hadError = true;
      const message = error instanceof ApiError ? error.message : 'Could not load the leaderboard.';
      this.showError(message);
      snackbar.show(message, 'error');
    }
  };

  private showLoading(): void {
    if (!this.panel) {
      return;
    }

    this.panel.setAttribute('aria-busy', 'true');
    this.panel.replaceChildren(this.createSkeleton());
  }

  private showError(message: string): void {
    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(
      createErrorBanner(message, () => {
        void this.load();
      }),
    );
  }

  private showEmpty(): void {
    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(
      createEmptyState('No players yet', 'Top scores will show up here when players finish games.'),
    );
  }

  private showPlayers(players: LeaderboardPlayer[]): void {
    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(this.createTable(players.map((player) => this.toRow(player))));
  }

  private createSkeleton(): HTMLElement {
    const table = document.createElement('table');
    table.className = 'leaderboard__table';
    table.setAttribute('aria-hidden', 'true');
    table.append(this.createHead(), this.createSkeletonBody());

    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.textContent = 'Loading top players';

    const wrap = document.createElement('div');
    wrap.append(status, table);

    return wrap;
  }

  private createSkeletonBody(): HTMLTableSectionElement {
    const tbody = document.createElement('tbody');

    for (let index = 0; index < SKELETON_ROWS; index += 1) {
      const row = document.createElement('tr');

      if (index >= 3) {
        row.className = 'leaderboard__row--extra';
      }

      SKELETON_COLUMNS.forEach((extraClass) => {
        const cell = document.createElement('td');

        if (extraClass) {
          cell.className = `leaderboard__col--${extraClass}`;
        }

        const bar = document.createElement('span');
        bar.className = 'leaderboard__skeleton-bar is-skeleton';
        cell.append(bar);
        row.append(cell);
      });

      tbody.append(row);
    }

    return tbody;
  }

  private toRow(player: LeaderboardPlayer): PlayerRow {
    const streak = formatStreak(player.streakDays);
    const prefix = '🔥 ';

    return {
      rank: player.rank,
      name: player.playerName,
      initials: playerInitials(player.playerName),
      games: String(player.gamesPlayed),
      score: formatScore(player.totalScore),
      scoreShort: formatCompactCount(player.totalScore),
      streak: `${prefix}${streak.full}`,
      streakShort: `${prefix}${streak.short}`,
      favorite: player.favoriteGameName,
    };
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'leaderboard__header';

    const accent = document.createElement('span');
    accent.className = 'leaderboard__accent';

    const title = document.createElement('h2');
    title.id = 'leaderboard-title';
    title.className = 'leaderboard__title';
    title.textContent = 'Top Players This Week';

    header.append(accent, title);

    return header;
  }

  private createTable(players: PlayerRow[]): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'leaderboard__table';
    table.setAttribute('aria-labelledby', 'leaderboard-title');
    table.append(this.createHead(), this.createBody(players));

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

  private createBody(players: PlayerRow[]): HTMLTableSectionElement {
    const tbody = document.createElement('tbody');

    players.forEach((player) => {
      tbody.append(this.createRow(player));
    });

    return tbody;
  }

  private createRow(player: PlayerRow): HTMLTableRowElement {
    const row = document.createElement('tr');

    if (player.rank > 3) {
      row.className = 'leaderboard__row--extra';
    }

    const rank = this.createCell(`#${player.rank}`);
    rank.classList.add('leaderboard__rank');

    if (player.rank === 1) {
      rank.classList.add('leaderboard__rank--top');
    }

    row.append(
      rank,
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

  private createPlayerCell(player: PlayerRow): HTMLTableCellElement {
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
    name.append(this.createPair(player.name, player.name));

    wrap.append(avatar, name);
    td.append(wrap);

    return td;
  }

  private createScoreCell(player: PlayerRow): HTMLTableCellElement {
    const td = document.createElement('td');
    td.className = 'leaderboard__col--score';
    td.append(this.createPair(player.score, player.scoreShort));

    return td;
  }

  private createStreakCell(player: PlayerRow): HTMLTableCellElement {
    const td = document.createElement('td');
    td.append(this.createPair(player.streak, player.streakShort));

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

function formatStreak(days: number): { full: string; short: string } {
  const unit = days === 1 ? 'day' : 'days';

  return {
    full: `${days} ${unit}`,
    short: `${days}d`,
  };
}

function playerInitials(name: string): string {
  const parts = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 1 && /[A-Za-z]/.test(part));

  if (parts.length === 0) {
    const letters = name.replace(/[^A-Za-z]/g, '');
    return (letters.slice(0, 2) || '?').toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
