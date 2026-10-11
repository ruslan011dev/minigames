import { describe, expect, it } from 'vitest';
import { formatCompactCount, formatRating, formatRelativeTime, formatScore } from './format';

const now = new Date(2026, 5, 15, 12, 0, 0, 0);

function ago(ms: number): string {
  return new Date(now.getTime() - ms).toISOString();
}

function at(year: number, month: number, day: number): string {
  return new Date(year, month, day, 12, 0, 0, 0).toISOString();
}

describe('formatCompactCount', () => {
  it('keeps small counts and rounds thousands down to one decimal', () => {
    expect(formatCompactCount(0)).toBe('0');
    expect(formatCompactCount(999)).toBe('999');
    expect(formatCompactCount(1000)).toBe('1.0K');
    expect(formatCompactCount(1099)).toBe('1.0K');
    expect(formatCompactCount(38200)).toBe('38.2K');
  });
});

describe('formatRating and formatScore', () => {
  it('shows one decimal and groups the score', () => {
    expect(formatRating(4)).toBe('4.0');
    expect(formatRating(4.56)).toBe('4.6');
    expect(formatScore(20)).toBe('20');
    expect(formatScore(1234567)).toBe('1,234,567');
  });
});

describe('formatRelativeTime', () => {
  it('says just now for an invalid, future, or very recent time', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('just now');
    expect(formatRelativeTime(ago(-60_000), now)).toBe('just now');
    expect(formatRelativeTime(ago(59_999), now)).toBe('just now');
  });

  it('counts minutes, hours, days, and weeks', () => {
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    expect(formatRelativeTime(ago(minute), now)).toBe('1 min ago');
    expect(formatRelativeTime(ago(59 * minute), now)).toBe('59 min ago');
    expect(formatRelativeTime(ago(hour), now)).toBe('1 hour ago');
    expect(formatRelativeTime(ago(23 * hour), now)).toBe('23 hours ago');
    expect(formatRelativeTime(ago(day), now)).toBe('1 day ago');
    expect(formatRelativeTime(ago(6 * day), now)).toBe('6 days ago');
    expect(formatRelativeTime(ago(7 * day), now)).toBe('1 week ago');
    expect(formatRelativeTime(ago(21 * day), now)).toBe('3 weeks ago');
  });

  it('counts calendar months and years after three weeks', () => {
    expect(formatRelativeTime(at(2026, 4, 18), now)).toBe('1 month ago');
    expect(formatRelativeTime(at(2026, 4, 15), now)).toBe('1 month ago');
    expect(formatRelativeTime(at(2026, 3, 15), now)).toBe('2 months ago');
    expect(formatRelativeTime(at(2025, 6, 14), now)).toBe('11 months ago');
    expect(formatRelativeTime(at(2025, 5, 15), now)).toBe('1 year ago');
    expect(formatRelativeTime(at(2024, 5, 15), now)).toBe('2 years ago');
  });
});
