import { defineConfig } from 'vitest/config';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/minigames/' : '/',
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
      exclude: [
        // Boots the page and starts the app. It has no feature logic of its own.
        'src/main.ts',
        // Ambient Vite environment types. There is no runtime code to execute.
        'src/vite-env.d.ts',
      ],
    },
  },
}));
