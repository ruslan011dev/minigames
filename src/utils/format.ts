export function formatCompactCount(count: number): string {
  if (count < 1000) {
    return String(count);
  }

  const thousands = Math.floor(count / 100) / 10;
  return `${thousands.toFixed(1)}K`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();

  if (Number.isNaN(date.getTime()) || elapsed < MINUTE_MS) {
    return 'just now';
  }

  const minutes = Math.floor(elapsed / MINUTE_MS);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(elapsed / HOUR_MS);

  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(elapsed / DAY_MS);

  if (days <= 6) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks <= 3) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  const months = Math.max(1, calendarMonths(date, now));

  if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  const years = Math.floor(months / 12);

  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function calendarMonths(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

  if (to.getDate() < from.getDate()) {
    months -= 1;
  }

  return months;
}
