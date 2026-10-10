import { afterEach, describe, expect, it, vi } from 'vitest';

describe('publicAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('joins the asset path to the base and strips one leading slash', async () => {
    const { publicAssetUrl } = await import('./media');

    expect(publicAssetUrl('/img/cat.png')).toBe('/img/cat.png');
    expect(publicAssetUrl('img/cat.png')).toBe('/img/cat.png');
  });

  it('keeps a subdirectory base', async () => {
    vi.resetModules();
    vi.stubEnv('BASE_URL', '/minigames/');
    const { publicAssetUrl } = await import('./media');

    expect(publicAssetUrl('/img/cat.png')).toBe('/minigames/img/cat.png');
  });
});
