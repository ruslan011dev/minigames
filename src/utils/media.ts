export function publicAssetUrl(apiPath: string): string {
  const base = import.meta.env.BASE_URL;
  const relative = apiPath.replace(/^\//, '');
  return `${base}${relative}`;
}
