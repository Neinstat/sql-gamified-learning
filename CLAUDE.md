# CLAUDE.md

Project: **SQL Valley** — a **first-person 3D** web game for learning SQL, focused on thinking like a BI analyst. The player works at **Rolling Roast**, a food truck parked in a city park: customers queue with orders answered in SQL on the truck's tablet, and **The Manager** (suit, bossy) sometimes knocks on the back door with BI questions. The world is built with **Three.js** and drawn through a **risograph shader** (few inks, dither, ink outlines, a mis-registered red line). See `GAME_DESIGN.md` and the design history in `docs/JOURNEY.md`. Old code (the v1 top-down café and the 2D truck prototypes) has been removed; it only lives in git tags `v1-cafe-mvp` and `v2-prototypes`.

- Every design decision is in `GAME_DESIGN.md`. Read it before designing or building a feature, and update it when a new design decision is made.
- **Everything in the repository is in English** — code, comments, docs (`GAME_DESIGN.md`, `docs/`, README), commit messages and PR descriptions — so anyone can follow the project. Only the game's Indonesian translations (`locales/id/`, the `id` text in `src/i18n.ts` and `src/sql-core/feedback.ts`) are in Indonesian.
- **Conversation with the project owner is in Bahasa Indonesia.** The owner is learning Claude Code and git: explain steps in Indonesian, briefly and clearly.
- **Game language: English first, Bahasa Indonesia as a player option.** Story and UI text (dialogue, lesson cards, tasks, hints, feedback, buttons) is written in English first, then translated to Indonesian in separate files (`locales/id/`); missing translations fall back to English. **Always English (never translated):** SQL keywords, table and column names (`snake_case`, e.g. `menu_items`, `sales`), data values, and PostgreSQL error messages.
- SQL dialect taught: PostgreSQL (in the browser via PGlite). No backend for now.
- Architecture: the **SQL core** (`src/sql-core/`: database, answer checking, level data, orders) is separate from the **game world** (`src/game/`: Three.js, no React). The SQL core must not depend on game code; the game world and React only talk through `src/game/truck/bridge.ts`.
- Follow the phase roadmap in `GAME_DESIGN.md` §12 — do not build next-phase features before the current phase is done, unless asked.
- Visuals and characters must be original; third-party assets only with a clear licence, recorded with source and licence in `CREDITS.md`. Track placeholder art in `docs/ASSETS.md`.
- Work in small iterations: one feature → check in the browser → commit.
- Git: **never add a `Co-Authored-By` line or any Claude attribution** to commit messages or PR descriptions.
