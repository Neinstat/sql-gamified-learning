# SQL Valley

An interactive top-down game for learning SQL — fun to play, with a gentle learning curve, and built around **thinking like a Business Intelligence (BI) analyst**.

## Why this project exists

- **SQLBolt** has a great, easy-to-follow learning curve, but it isn't very interactive or fun.
- **LeetCode** is interactive, but many of its case-study problems jump too far in difficulty for beginners.

SQL Valley sits in between: step-by-step lessons like SQLBolt, wrapped in game mechanics that make you want to keep going — and ending with the skill real data jobs need: **answering business questions with data**.

## The concept

You inherit your grandma's struggling café and become its data analyst. Explore the café in a 2D top-down world, take on requests from the people around you, and solve them with SQL at consoles found at the cashier, the kitchen, the storeroom, and the back office — from "show me the menu" all the way to "sales dropped last month, why?".

- Web game that runs entirely in the browser
- Queries run on a real PostgreSQL database in the browser (PGlite) — no backend needed
- Progresses from basic `SELECT` to `JOIN`s, aggregation, and real business analysis cases
- Play in **English** or **Bahasa Indonesia** (SQL, table names and data always stay in English)

## Status

✅ **Phase 1 (SQL core)** — Chapters 0–1 are playable on a simple page:

- **Chapter 0 · First Day** — tables, `SELECT`, `FROM` (build queries from word blocks)
- **Chapter 1 · Cleaning Up the Menu** — `WHERE`, `AND`, `IN`, `LIKE`, `IS NULL` (fill in the blanks)
- Answers are graded on their **result**, not their text, with specific feedback ("Column `price` is missing", "Your result has 12 rows — expected 3")
- Three-step hints, saved progress, beginner-friendly error messages

🚧 **Phase 2 (the first world)** — in progress. Chapters 0–1 are now played inside the café's front room (Phaser, placeholder pixel art): walk with WASD/arrows or click/tap, take requests from Grandma, the barista and a regular, solve them at the menu board's SQL console, and report back. The Phase 1 page is still available as **classic mode** at `?classic`. See [GAME_DESIGN.md](GAME_DESIGN.md) for the full design and roadmap (written in Indonesian).

## Getting started

Requires Node.js 22+.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm test           # run the tests
npm run build      # typecheck and build for production
npm run preview    # serve the production build at http://localhost:4173
```

While developing, open `http://localhost:5173/?classic&level=ch1-3` to jump straight to a level in classic mode.

## Project structure

```
src/
├── sql-core/      # the SQL "brain" — no UI or game-engine code allowed here
│   ├── db.ts        # PGlite database + safe, read-only query runner
│   ├── stations.ts  # which tables each station's console can see
│   ├── checker.ts   # compares the player's result with the solution
│   ├── feedback.ts  # feedback messages in English and Indonesian
│   ├── data/        # café schema and seed data
│   └── levels/      # chapters, levels and their translations (locales/id)
├── console/       # SQL console UI (React): blocks, fill-in-the-blank, editor, results
├── game/          # the 2D world (Phaser) — no React code allowed here
│   ├── rooms/       # room maps as text (one character = one 16×16 tile)
│   ├── bridge.ts    # the only link between the game world and the React overlays
│   └── placeholder*.ts  # temporary tiles, sprites and portraits drawn in code
├── app/           # pages (world + classic), level flow, level list, saved progress
└── i18n.ts        # UI text in both languages
```
