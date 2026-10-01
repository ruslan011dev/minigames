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
