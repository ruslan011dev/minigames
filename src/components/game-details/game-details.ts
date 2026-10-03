import closeUrl from '../../assets/icons/close.svg?url';
import heartUrl from '../../assets/icons/heart.svg?url';
import sendUrl from '../../assets/icons/send.svg?url';
import starUrl from '../../assets/icons/star.svg?url';
import { ApiError, isAbortError } from '../../api/client';
import { getGameComments, type GameComment, type GameComments } from '../../api/comments';
import { getGame, type GameDetails, type GameRecord } from '../../api/games';
import { createEmptyState, createErrorBanner } from '../feedback/feedback';
import { snackbar } from '../snackbar/snackbar';
import {
  formatCompactCount,
  formatRating,
  formatRelativeTime,
  formatScore,
} from '../../utils/format';
import { publicAssetUrl } from '../../utils/media';

const SPECS = [
  { label: 'Genre', key: 'genre' },
  { label: 'Players', key: 'players' },
  { label: 'Duration', key: 'duration' },
  { label: 'Price', key: 'price' },
] as const;

const RECORD_MEDALS = ['🥇', '🥈', '🥉'] as const;
const COMMENT_PLACEHOLDER = 'Write a comment...';

const FAVORITE_ADD = 'Add to Favorites';
const FAVORITE_REMOVE = 'Remove from Favorites';

export class GameDetailsDialog {
  private dialog: HTMLDialogElement | null = null;
  private userClose = false;
  private panel: HTMLElement | null = null;
  private favoriteButton: HTMLButtonElement | null = null;
  private favoriteLabel: HTMLElement | null = null;
  private favorite = false;
  private commentField: HTMLTextAreaElement | null = null;
  private likeButtons: HTMLButtonElement[] = [];
  private controller: AbortController | null = null;
  private commentsController: AbortController | null = null;
  private commentsTitle: HTMLElement | null = null;
  private commentsPanel: HTMLElement | null = null;
  private comments: GameComments | null = null;
  private commentsStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  private commentsError = '';
  private slug = '';
  private hadError = false;
  private hadCommentsError = false;

  constructor(private readonly onDismiss?: () => void) {}

  public render(): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.className = 'details';
    dialog.setAttribute('aria-labelledby', 'game-details-title');

    const panel = document.createElement('div');
    panel.className = 'details__panel';
    this.panel = panel;
    dialog.append(panel, this.createClose());
    dialog.addEventListener('click', this.onDialogClick);
    dialog.addEventListener('cancel', this.onDialogCancel);
    dialog.addEventListener('close', this.onDialogClose);
    this.dialog = dialog;

    return dialog;
  }

  public open(slug: string): void {
    if (this.dialog?.open && this.slug === slug) {
      return;
    }

    this.slug = slug;

    if (!this.dialog?.open) {
      this.dialog?.showModal();
    }

    void this.fetchGame();
  }

  public close(): void {
    if (!this.dialog?.open) {
      return;
    }

    this.userClose = true;
    this.dialog.close();
    this.emitDismiss();
  }

  public dismiss(): void {
    if (!this.dialog?.open) {
      return;
    }

    this.dialog.close();
  }

  private fetchGame = async (): Promise<void> => {
    this.controller?.abort();
    this.commentsController?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.showLoading();
    void this.fetchComments(this.slug, controller.signal);

    try {
      const game = await getGame(this.slug, controller.signal);

      if (controller.signal.aborted || !this.dialog?.open) {
        return;
      }

      this.showGame(game);

      if (this.hadError) {
        this.hadError = false;
        snackbar.show('Game loaded.', 'success');
      }
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      this.commentsController?.abort();
      this.hadError = true;
      const message = error instanceof ApiError ? error.message : 'Could not load game.';
      this.showError(message);
      snackbar.show(message, 'error');
    }
  };

  private showLoading(): void {
    if (!this.panel || !this.dialog) {
      return;
    }

    this.commentsTitle = null;
    this.commentsPanel = null;
    this.dialog.setAttribute('aria-busy', 'true');
    this.panel.replaceChildren(this.createSkeleton());
  }

  private showError(message: string): void {
    if (!this.panel || !this.dialog) {
      return;
    }

    this.commentsTitle = null;
    this.commentsPanel = null;
    this.dialog.removeAttribute('aria-busy');
    const body = document.createElement('div');
    body.className = 'details__body';
    body.append(
      createErrorBanner(message, () => {
        void this.fetchGame();
      }),
    );
    this.panel.replaceChildren(body);
  }

  private showGame(game: GameDetails): void {
    if (!this.panel || !this.dialog) {
      return;
    }

    this.likeButtons = [];
    this.favorite = false;
    this.favoriteButton = null;
    this.favoriteLabel = null;
    this.commentField = null;
    this.dialog.removeAttribute('aria-busy');
    this.panel.replaceChildren(this.createHero(game), this.createBody(game));
  }

  private createSkeleton(): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'details__skeleton';
    skeleton.setAttribute('aria-hidden', 'true');

    const hero = document.createElement('div');
    hero.className = 'details__skeleton-hero is-skeleton';

    const body = document.createElement('div');
    body.className = 'details__body';

    const title = document.createElement('div');
    title.className = 'details__skeleton-line details__skeleton-line--title is-skeleton';

    const text = document.createElement('div');
    text.className = 'details__skeleton-line is-skeleton';

    const short = document.createElement('div');
    short.className = 'details__skeleton-line details__skeleton-line--short is-skeleton';

    body.append(title, text, short);
    skeleton.append(hero, body);

    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.textContent = 'Loading game details';

    const wrap = document.createElement('div');
    wrap.append(status, skeleton);

    return wrap;
  }

  private createHero(game: GameDetails): HTMLElement {
    const hero = document.createElement('div');
    hero.className = 'details__hero';

    const image = document.createElement('img');
    image.className = 'details__image';
    image.src = publicAssetUrl(game.heroImage);
    image.alt = '';

    hero.append(image);

    return hero;
  }

  private createBody(game: GameDetails): HTMLElement {
    const body = document.createElement('div');
    body.className = 'details__body';
    body.append(
      this.createHeading(game),
      this.createDescription(game),
      this.createSpecs(game),
      this.createActions(),
      this.createRecords(game),
      this.createComments(),
    );

    return body;
  }

  private createHeading(game: GameDetails): HTMLElement {
    const heading = document.createElement('div');
    heading.className = 'details__heading';

    const title = document.createElement('h2');
    title.id = 'game-details-title';
    title.className = 'details__title';
    title.textContent = game.name;

    const ratings = document.createElement('div');
    ratings.className = 'details__ratings';
    ratings.append(
      this.createStat(starUrl, formatRating(game.rating), 'Rating'),
      this.createStat(heartUrl, formatCompactCount(game.likesCount), 'Likes'),
    );

    heading.append(title, ratings);

    return heading;
  }

  private createStat(iconUrl: string, value: string, name: string): HTMLElement {
    const stat = document.createElement('p');
    stat.className = 'details__stat';
    stat.setAttribute('aria-label', `${name} ${value}`);

    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.alt = '';

    stat.append(icon, document.createTextNode(value));

    return stat;
  }

  private createDescription(game: GameDetails): HTMLParagraphElement {
    const description = document.createElement('p');
    description.className = 'details__description';
    description.textContent = game.fullDescription;

    return description;
  }

  private createSpecs(game: GameDetails): HTMLDListElement {
    const list = document.createElement('dl');
    list.className = 'details__specs';

    SPECS.forEach((spec) => {
      const item = document.createElement('div');
      item.className = 'details__spec';

      const term = document.createElement('dt');
      term.textContent = spec.label;

      const detail = document.createElement('dd');
      detail.textContent = game.specs[spec.key];

      item.append(term, detail);
      list.append(item);
    });

    return list;
  }

  private createActions(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'details__actions';

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'details__play';
    play.textContent = 'Play Now';

    actions.append(play, this.createFavorite());

    return actions;
  }

  private createFavorite(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'details__favorite';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', FAVORITE_ADD);

    const icon = document.createElement('img');
    icon.src = heartUrl;
    icon.alt = '';

    const label = document.createElement('span');
    label.className = 'details__favorite-label';
    label.textContent = FAVORITE_ADD;

    button.append(icon, label);
    button.addEventListener('click', this.onFavoriteClick);
    this.favoriteButton = button;
    this.favoriteLabel = label;

    return button;
  }

  private createRecords(game: GameDetails): HTMLElement {
    const section = document.createElement('section');
    section.className = 'details__records';
    section.setAttribute('aria-labelledby', 'details-records-title');

    const title = document.createElement('h3');
    title.id = 'details-records-title';
    title.className = 'details__records-title';

    const trophy = document.createElement('span');
    trophy.setAttribute('aria-hidden', 'true');
    trophy.textContent = '🏆';
    title.append(trophy, document.createTextNode('Top Records'));

    if (game.topRecords.length === 0) {
      section.append(
        title,
        createEmptyState('No records yet', 'No scores have been posted for this game.'),
      );
      return section;
    }

    const list = document.createElement('ol');
    list.className = 'details__record-list';
    game.topRecords.forEach((record, index) => {
      list.append(this.createRecord(record, index));
    });

    section.append(title, list);

    return section;
  }

  private createRecord(record: GameRecord, index: number): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'details__record';

    const player = document.createElement('span');
    player.className = 'details__player';

    const medal = document.createElement('span');
    medal.setAttribute('aria-hidden', 'true');
    medal.textContent = RECORD_MEDALS[index] ?? '';

    const playerName = document.createElement('span');
    playerName.textContent = record.playerName;
    player.append(medal, playerName);

    const result = document.createElement('span');
    result.className = 'details__result';

    const points = document.createElement('span');
    points.className = 'details__points';
    points.textContent = `${formatScore(record.score)} pts`;

    const when = document.createElement('span');
    when.className = 'details__when';
    when.textContent = formatRelativeTime(record.achievedAt);

    result.append(points, when);
    item.append(player, result);

    return item;
  }

  private fetchComments = async (slug: string, parent?: AbortSignal): Promise<void> => {
    this.commentsController?.abort();
    const controller = new AbortController();
    this.commentsController = controller;

    if (parent) {
      if (parent.aborted) {
        controller.abort();
        return;
      }

      parent.addEventListener('abort', () => controller.abort(), { once: true });
    }

    this.comments = null;
    this.commentsStatus = 'loading';
    this.paintComments();

    try {
      const result = await getGameComments(slug, controller.signal);

      if (controller.signal.aborted || slug !== this.slug) {
        return;
      }

      this.comments = result;
      this.commentsStatus = 'ready';
      this.paintComments();
      const recovered = this.hadCommentsError;
      this.hadCommentsError = false;

      if (result.comments.length === 0) {
        snackbar.show('No comments for this game right now.', 'warning');
      } else if (recovered) {
        snackbar.show('Comments loaded.', 'success');
      }
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        return;
      }

      this.hadCommentsError = true;
      this.commentsStatus = 'error';
      this.commentsError = error instanceof ApiError ? error.message : 'Could not load comments.';
      this.paintComments();
      snackbar.show(this.commentsError, 'error');
    }
  };

  private createComments(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'details__comments';
    section.setAttribute('aria-labelledby', 'details-comments-title');

    const title = document.createElement('h3');
    title.id = 'details-comments-title';
    title.className = 'details__comments-title';
    title.textContent = 'Comments';
    this.commentsTitle = title;

    const panel = document.createElement('div');
    panel.className = 'details__comment-panel';
    this.commentsPanel = panel;

    section.append(title, this.createComposer(), panel);
    this.paintComments();

    return section;
  }

  private paintComments(): void {
    const panel = this.commentsPanel;
    const title = this.commentsTitle;

    if (!panel || !title) {
      return;
    }

    if (this.commentsStatus === 'loading' || this.commentsStatus === 'idle') {
      title.textContent = 'Comments';
      panel.setAttribute('aria-busy', 'true');
      panel.replaceChildren(this.createCommentsSkeleton());
      return;
    }

    panel.removeAttribute('aria-busy');

    if (this.commentsStatus === 'error') {
      title.textContent = 'Comments';
      panel.replaceChildren(
        createErrorBanner(this.commentsError, () => {
          void this.fetchComments(this.slug);
        }),
      );
      return;
    }

    const comments = this.comments;

    if (!comments) {
      return;
    }

    title.textContent = `Comments (${comments.totalComments})`;

    if (comments.comments.length === 0) {
      panel.replaceChildren(
        createEmptyState('No comments yet', 'Nobody has written about this game.'),
      );
      return;
    }

    this.likeButtons = [];
    const list = document.createElement('ul');
    list.className = 'details__comment-list';
    comments.comments.forEach((comment, index) => {
      list.append(this.createComment(comment, index));
    });
    panel.replaceChildren(list);
  }

  private createCommentsSkeleton(): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'details__comment-skeleton';
    skeleton.setAttribute('aria-hidden', 'true');

    for (let index = 0; index < 3; index += 1) {
      const line = document.createElement('div');
      line.className = 'details__skeleton-line is-skeleton';
      skeleton.append(line);
    }

    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.textContent = 'Loading comments';

    const wrap = document.createElement('div');
    wrap.append(status, skeleton);

    return wrap;
  }

  private createComposer(): HTMLElement {
    const composer = document.createElement('form');
    composer.className = 'details__composer';
    composer.addEventListener('submit', this.onSendComment);

    const avatar = document.createElement('span');
    avatar.className = 'details__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'U';

    const field = document.createElement('textarea');
    field.className = 'details__field';
    field.rows = 1;
    field.placeholder = COMMENT_PLACEHOLDER;
    field.setAttribute('aria-label', COMMENT_PLACEHOLDER);
    field.addEventListener('input', this.onCommentInput);
    this.commentField = field;

    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'details__send';
    send.setAttribute('aria-label', 'Send comment');

    const icon = document.createElement('img');
    icon.src = sendUrl;
    icon.alt = '';
    send.append(icon);

    composer.append(avatar, field, send);

    return composer;
  }

  private createComment(comment: GameComment, index: number): HTMLLIElement {
    const author = comment.authorName;
    const text = comment.text;
    const likes = comment.likesCount;
    const createdAt = comment.createdAt;
    const item = document.createElement('li');
    const article = document.createElement('article');
    article.className = 'details__comment';

    const head = document.createElement('div');
    head.className = 'details__comment-head';

    const avatar = document.createElement('span');
    avatar.className = `details__avatar details__avatar--comment details__avatar--${index + 1}`;
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = author.slice(0, 1);

    const name = document.createElement('span');
    name.className = 'details__author';
    name.textContent = author;

    const time = document.createElement('time');
    time.className = 'details__comment-time';
    time.dateTime = createdAt;
    time.textContent = formatRelativeTime(createdAt);

    head.append(avatar, name, time);

    const body = document.createElement('p');
    body.className = 'details__comment-text';
    body.textContent = text;

    article.append(head, body, this.createLike(author, likes));
    item.append(article);

    return item;
  }

  private createLike(author: string, likes: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'details__like';
    button.dataset.base = String(likes);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Like comment by ${author}`);

    const icon = document.createElement('img');
    icon.src = heartUrl;
    icon.alt = '';

    const count = document.createElement('span');
    count.className = 'details__like-count';
    count.textContent = String(likes);

    button.append(icon, count);
    button.addEventListener('click', () => this.onLikeClick(button));
    this.likeButtons.push(button);

    return button;
  }

  private createClose(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'details__close';
    button.setAttribute('aria-label', 'Close game details');

    const icon = document.createElement('img');
    icon.src = closeUrl;
    icon.alt = '';

    button.append(icon);
    button.addEventListener('click', () => this.close());

    return button;
  }

  private onFavoriteClick = (): void => {
    this.setFavorite(!this.favorite);
  };

  private onCommentInput = (): void => {
    this.resizeComment();
  };

  private onSendComment = (event: Event): void => {
    event.preventDefault();

    if (!this.commentField || this.commentField.value.trim() === '') {
      return;
    }

    this.commentField.value = '';
    this.resizeComment();
  };

  private onLikeClick(button: HTMLButtonElement): void {
    const liked = button.getAttribute('aria-pressed') === 'true';
    const next = !liked;
    const base = Number(button.dataset.base);
    const count = button.querySelector('.details__like-count');

    button.setAttribute('aria-pressed', String(next));
    button.classList.toggle('details__like--active', next);

    if (count) {
      count.textContent = String(base + (next ? 1 : 0));
    }
  }

  private onDialogCancel = (): void => {
    this.userClose = true;
  };

  private onDialogClose = (): void => {
    this.controller?.abort();
    this.commentsController?.abort();
    this.resetTransientState();
    this.emitDismiss();
  };

  private emitDismiss(): void {
    if (!this.userClose) {
      return;
    }

    this.userClose = false;
    this.onDismiss?.();
  }

  private resetTransientState(): void {
    this.setFavorite(false);
    this.resetComments();
  }

  private onDialogClick = (event: MouseEvent): void => {
    if (event.target === this.dialog) {
      this.close();
    }
  };

  private setFavorite(active: boolean): void {
    this.favorite = active;
    const text = active ? FAVORITE_REMOVE : FAVORITE_ADD;
    this.favoriteButton?.classList.toggle('details__favorite--active', active);
    this.favoriteButton?.setAttribute('aria-pressed', String(active));
    this.favoriteButton?.setAttribute('aria-label', text);

    if (this.favoriteLabel) {
      this.favoriteLabel.textContent = text;
    }
  }

  private resizeComment(): void {
    const field = this.commentField;

    if (!field) {
      return;
    }

    if (field.value === '') {
      field.style.height = '';
      return;
    }

    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }

  private resetComments(): void {
    if (this.commentField) {
      this.commentField.value = '';
      this.commentField.style.height = '';
    }

    this.likeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('details__like--active');
      const count = button.querySelector('.details__like-count');

      if (count) {
        count.textContent = button.dataset.base ?? '';
      }
    });
  }
}
