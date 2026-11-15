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

✅ **Phase 1 (SQL core)** and ✅ **Phase 2 (the first world)** are done.

🧪 **Phase 3 (the café grows)** — the full MVP is built and waiting for a final playtest:

- **Six chapters, 34 levels**, from `SELECT` to `JOIN`s and aggregation:
  0 · First Day · 1 · Cleaning Up the Menu · 2 · First Reports · 3 · Numbers Talk · 4 · Connecting the Dots · 5 · The Analysis Case
- **Mini Cases** at the end of Chapters 1–4: open questions where you run your own queries, pin 📌 the results that prove your answer, and draw conclusions — like a real analyst. Chapter 5 ends with the big **Analysis Case**: *"October sales dropped 18%. What happened?"*
- **"So what?"** questions after some levels: what does this result actually mean?
- **Four rooms** that open chapter by chapter — the front room, kitchen, storeroom and back office — each with its own SQL station that only sees its own tables (like real company systems).
- **A café that grows**: stars, coins, upgrades (plants, a rug, tables, a fancy menu board, strolling customers), a daily streak 🔥 and badges 🏅.
- **Skill Check** for players who already know some SQL, and **Rush Hour** ⏱, a timed challenge.
- Warm autumn pixel art: original characters, plus furniture from Kenney's CC0 pack (see [CREDITS.md](CREDITS.md)).
- Realistic café data made by a seeded generator: about 4,600 orders from August to October, with hidden patterns to discover.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full design and roadmap (written in Indonesian).

## Getting started

Requires Node.js 22+.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm test           # run the tests
npm run build      # typecheck and build for production
npm run preview    # serve the production build at http://localhost:4173
```

While developing, open `http://localhost:5173/?level=ch3-7` to jump straight to a level's request in the game world.

## Project structure

```
src/
├── sql-core/      # the SQL "brain" — no UI or game-engine code allowed here
│   ├── db.ts        # PGlite database, station roles and the safe, read-only query runner
│   ├── stations.ts  # which tables each station's console can see
│   ├── checker.ts   # compares the player's result with the solution
│   ├── cases.ts     # Mini Case / Analysis Case conclusions and evidence
│   ├── skillCheck.ts, rushHour.ts
│   ├── feedback.ts  # feedback messages in English and Indonesian
│   ├── data/        # café data: menu, generated sales, recipes, stock (seeded, always the same)
│   └── levels/      # chapters, levels and their translations (locales/id)
├── console/       # SQL console UI (React): blocks, fill-in-the-blank, editor, Mini Case notes
├── game/          # the 2D world (Phaser) — no React code allowed here
│   ├── rooms/       # the café map as text (one character = one 16×16 tile), rooms and upgrades
│   ├── art/         # pixel art as text grids in one 32-colour palette
│   └── bridge.ts    # the only link between the game world and the React overlays
├── app/           # the page around the world: overlays, quests, rewards, growth, the database worker
└── i18n.ts        # UI text in both languages
```
