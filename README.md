# MiniGames

Educational SPA for the RS School MiniGames assignment: a catalog of mini-games with Home and Library pages, plus Auth and Game Details dialogs.

The UI is built with **TypeScript**, **HTML**, and **SCSS** only — no JS/CSS frameworks or ready-made UI libraries.

## Current stage

Story 1: project setup, Home page layout, Auth dialog layout.

## Planned tech stack

- TypeScript
- HTML5
- SCSS (design tokens and breakpoints)
- Bundler (dev + production)
- ESLint, Prettier, Husky

## Getting started

```bash
git clone <repository-url>
cd minigames
npm install
npm run dev
```

## Project structure

```text
src/
  assets/        # fonts, icons, images
  components/    # reusable UI (header, footer, dialogs)
  pages/         # page-level views
  styles/        # tokens, mixins, global styles
  types/         # shared TypeScript types
  utils/         # helpers
public/          # static files (favicon, etc.)
```

## Scripts

- `npm run dev` — start local server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — eslint
- `npm run format` — prettier

## Deployment

Live site: [https://ruslan011dev.github.io/minigames/](https://ruslan011dev.github.io/minigames/)
