# SQL Valley — Game Design Document

> A first-person 3D web game for learning SQL while learning to **think like a Business Intelligence (BI) analyst**. You run a coffee food truck parked in a city park; customers at the window bring requests you answer with SQL on the truck's tablet, and a bossy manager knocks on the back door with business questions.
>
> **Status:** 🚚 Version 2 (3D food truck) was locked in on 17 Nov 2026. Phase 4 (the one-day prototype) is done; **Phase 5 (order generator & repetition) is in progress.** Version 1 (a top-down 2D café, MVP finished 16 Nov 2026) has been removed from the code; it lives in git tag `v1-cafe-mvp`. How the design got here, with screenshots: [`docs/JOURNEY.md`](docs/JOURNEY.md).
>
> This document is the single source of truth for design decisions. Update it whenever a new decision is made.
>
> **Language:** the game's main language is **English**, with **Bahasa Indonesia** as a player option for story and UI text. SQL keywords, table and column names, data values and PostgreSQL error messages always stay in English.

---

## 1. Vision

Most SQL resources only teach **syntax**:

- **SQLBolt** has a gentle, easy-to-follow learning curve, but it is not very interactive or fun.
- **LeetCode** is interactive, but its case studies often jump too far in difficulty for beginners.

**SQL Valley** keeps SQLBolt's gentle curve, wraps it in game mechanics that make players want to keep going, and ends with the skill real data jobs need: **answering business questions with data** — all the way to "sales dropped last month, why?".

## 2. Players

| Player | Path |
|---|---|
| **Complete beginners** (never written SQL) | Start at week 1 |
| **Players who know the basics** | Take the **Skill Check** first and skip ahead to the right week |

**Skill Check** (built in v1, `src/sql-core/skillCheck.ts`): adaptive, two free-typing questions per chapter, stopping at the first chapter the player fails. Skipped content stays open (without stars) so it can be played later. In v2 it decides the starting week.

The end goal: people who want a career as a **data / BI analyst**, who need both SQL and business context. The market is global, so the game is in English with an Indonesian option so beginners in Indonesia can get in easily.

## 3. Concept & story

### Why a food truck (decided 16 Nov 2026)
- **Focus on SQL, not walking.** In v1 the player walked to a station first. In v2 tasks come to the player through customers at the truck window.
- **Natural repetition.** Similar orders come back on later days with different details, so queries are practised again without feeling like repeated exercises.
- **A stronger analyst feel.** The player's own sales go into the database, and the manager asks about that data, so BI questions feel personal.

### Story and characters
A **completely fresh start** (owner's decision, 16 Nov 2026): v1's story (Grandma's café) and its characters are not used.

- The player is the **new hire** at **Rolling Roast**, a coffee food truck owned by a small company, **Valley Eats Co.** The truck is parked in a city park and opens **10:00–17:00**.
- **The Manager** — a boss in a sharp suit and tie, carrying a report tablet. Now and then they knock on the truck's back door and ask for numbers: sales, revenue, what keeps selling out, this month's target. They are **bossy**: short, demanding, no small talk ("Numbers. Now.", "I don't want feelings, I want revenue by day."). A right answer earns a small, stiff compliment.
- **Customers** queue at the window: new faces, each with their own way of talking. Some become regulars who come back on other days.
- **A supplier's courier** delivers stock in the morning and brings tasks about `inventory`.
- The menu is still coffee and snacks (v1's `menu_items` data), so the SQL content of v1's levels still fits. Story text that mentions Grandma or the café is rewritten when it moves over in Phase 6.

## 4. Core loop: one working day

1. **Morning (before opening):** today's summary, a stock check (sometimes a task from the courier), and a lesson card when there is a new concept.
2. **Open at 10:00:** customers arrive one by one and queue (2–3 visible).
3. **An order is an SQL task.** The customer at the window says what they want in a speech bubble. The player uses the tablet and answers with SQL. Examples:
   - "Anything under $4?" → `SELECT … WHERE price < 4;`
   - "Do you still have oat milk?" → check `inventory` (at the fridge)
   - "Which drinks have no milk? I'm lactose intolerant." → `JOIN recipes` (at the recipe binders)
   - "What's my usual?" → `sales` + `customers`
4. **A correct answer serves the order.** The game records the sale in the database (`INSERT` into `sales`, stock goes down); the player does not write `INSERT` (that is taught later, if at all).
5. **The manager knocks 🚪** (once a day, at a random time): BI questions about today's or this week's sales, what sells out, and so on. This replaces v1's "So what?" questions and Mini Cases.
6. **Close at 17:00 → end-of-day summary:** revenue, tips, happy customers, concepts practised, stars for the day.

**Time and pressure (decided):**
- **The clock stops while the tablet is open.** Writing SQL is never timed.
- A customer's patience only drops while they wait in the queue, and **only affects the tip**. There is no losing. A customer who waits too long leaves without tipping, but their task comes back on another day.
- One day takes about 8–12 real minutes (8–12 orders + 1 manager case). Built in 4.10: the clock runs at 0.7 game minutes per real second (≈ 10 minutes for 10:00–17:00), and **4× faster while nobody is waiting**, so there is no idle waiting.
- Customers arrive **spread over the day** (prototype: 10:00, 10:35, 11:15, 12:00, 12:50, 13:50, 15:00). Patience is **60 game minutes** in the line; their mood shows in the speech bubble (😊 / 😐 / 😠 with a patience bar), and the tip is **$1.00 / $0.50 / $0** by mood when the order is handed over.
- v1's Rush Hour becomes **"Lunch Rush"**: an optional event from 12:00 to 13:00 with quick orders and a running clock, from week 3.

## 5. Tasks: order templates and repetition

- An **order template** is one kind of request with randomised parameters (seeded per day), e.g. `price_under(max)`, `items_in_category(category)`, `stock_of(ingredient)`. Each template has a `concept` (e.g. `where-compare`, `group-by`), EN/ID dialogue with slots like `{max}`, a parameterised solution query, and three hints.
- **Answers are graded on results, as in v1:** the player's result is compared with the solution's result **on the data as it is right now** (including today's sales).
- **Simple spaced repetition:** each concept has a mastery level from 0 to 5. Right without hints → it goes up and comes back less often (1 → 2 → 4 → 7 days). Wrong, or with hints → it goes down and comes back tomorrow. Each day's orders are picked from this week's new concepts + concepts that are "due" + a little randomness.
- **Difficulty rises week by week** (§6). Customers never ask for a concept that has not been taught yet.
- **Manager cases** use v1's case engine (📌 pinned evidence + conclusion questions). Daily cases are small (1–2 queries); end-of-week cases are bigger; the Analysis Case "October sales dropped 18%" closes week 6.

### Kinds of tasks (from v1, still used)

| Kind | What it is |
|---|---|
| **Request** | One question, one correct result (customer orders) |
| **Report** | A result with specific columns (top-N, KPIs) |
| **Case** 🔍 | An investigation: run any queries, **pin** 📌 the results that prove each answer, then answer 2–3 conclusion questions. Evidence counts when its result contains the key rows. ⭐ solved · ⭐⭐ no hints · ⭐⭐⭐ no unsupported conclusion |
| **Analysis Case** 🎯 | The big open investigation: "October sales dropped 18%. What happened?", with step-by-step conclusions, each backed by pinned evidence |

### Input grows with the player

| Stage | When | How |
|---|---|---|
| Word blocks | Week 1 | Build the query from given blocks, like a puzzle |
| Fill in the blanks | Week 2 | The query is partly written; the player fills the gaps |
| Free typing | Week 3 on | A full SQL editor with highlighting and **autocomplete** for table and column names |

## 6. Curriculum: six weeks

One week = five working days. v1's chapters map onto weeks:

| Week | SQL (from v1 chapter) | Example order | Manager case at the end of the week | Input |
|---|---|---|---|---|
| 1. Opening Week | `SELECT`, `FROM` (Ch0) | "What's on the menu?" | — (tutorial) | Blocks |
| 2. Picky Customers | `WHERE`, `AND`/`OR`, `IN`, `LIKE`, `IS NULL` (Ch1) | "Vegan and under $5?" | The Menu Audit | Fill in the blanks |
| 3. Daily Specials | `ORDER BY`, `LIMIT`, `DISTINCT`, aliases, computed columns (Ch2) | "Your 3 cheapest snacks?" | What Should We Promote? | Free |
| 4. Counting the Till | Aggregates, `GROUP BY`, `HAVING`, dates (Ch3) | "How many lattes sold today?" | The Quiet Day | Free |
| 5. Regulars & Recipes | `JOIN`, `LEFT JOIN` (Ch4) | "Which drinks have no milk?" | Where Did the Regulars Go? | Free |
| 6. The Big Question | Everything | A mix of all concepts | Analysis Case: October Sales Dropped | Free |

After week 6: an **endless free mode**. Days keep coming with spaced repetition; new locations and advanced topics (subqueries, CTEs, window functions, month-over-month analysis) can be added later.

### Existing level content (v1, 34 levels in `src/sql-core/levels/`)

These become order templates and manager cases in Phase 6.

- **Chapter 0 · First Day** (4 levels): what a table is, `SELECT`, `FROM`.
- **Chapter 1 · Cleaning Up the Menu** (6 + case): `WHERE`, `AND`/`OR`, `IN`, `LIKE`, `IS NULL`; case *The Menu Audit* (which items are not ready to print?).
- **Chapter 2 · First Reports** (5 + case): the most expensive sandwich (`ORDER BY … DESC`) · the three cheapest desserts (`LIMIT`) · categories (`DISTINCT`) · margin per item (`price - cost AS margin`) · the five biggest margins — **a deliberate trap:** with `DESC`, PostgreSQL puts `NULL` first, so it must be filtered (`IS NOT NULL` or `NULLS LAST`); case *What Should We Promote?* Sorted results are chosen without ties so the expected order is always certain.
- **Chapter 3 · Numbers Talk** (6 + case): `COUNT(*)` + `WHERE` · total revenue `SUM(quantity * unit_price)` · orders and average order value (`COUNT(DISTINCT order_id)`, `ROUND`; why not `AVG` per row) · revenue per channel (`GROUP BY`) · revenue per month (`DATE_TRUNC`; October drops → first hint of the Analysis Case) · items with more than 400 portions sold (`HAVING`; one item is exactly 400 → `>` vs `>=`); case *The Quiet Day* (`EXTRACT(DOW …)`).
- **Chapter 4 · Connecting the Dots** (6 + case): items that use milk (`JOIN … ON`, table aliases) · items with no recipe (`LEFT JOIN … IS NULL` → Secret Cake) · portions per category (`JOIN` + `GROUP BY`) · top five items by revenue (Avocado Toast earns most per portion, but Latte wins on volume) · the most loyal customer (`LIMIT 1`; top-5 avoided because of ties) · customers who signed up but never bought (`LEFT JOIN`); case *Where Did the Regulars Go?* Answers with tables in another order, without aliases, or with `NOT EXISTS` are accepted too (tested).
- **Chapter 5 · The Analysis Case** (2 + case): suppliers, earliest delivery first (the 12:00 delivery is already a clue) · monthly revenue and orders (October: far fewer orders, order value only slightly lower) · the **Analysis Case** with five steps: how much did it drop (number, tolerance ±0.6 → 18 / 18.4 / 18.36% accepted) → which item (Latte) → when (mornings) → why (milk runs out in the morning because the new supplier delivers at noon) → what to do (get milk delivered in the morning again). A conclusion may accept several kinds of evidence; one is enough.

## 7. Look and feel (locked in 17 Nov 2026)

The look was found through six prototypes (see [`docs/JOURNEY.md`](docs/JOURNEY.md)). The one **locked in** is the last:

- **First-person 3D** with **Three.js**. The player stands inside the truck: **WASD / arrow keys** to walk, the **mouse** to look (pointer lock, Esc frees the mouse), aim the **crosshair** at something and press **E** or click. Movement stays inside the truck so the focus stays on SQL.
- **The truck** (6 × 2.4 × 2.4 m): serving window + counter + tablet in the front wall; **fridge & stock shelves** at the left end (`inventory`); a **back counter** with a red espresso machine, a clock, the **menu board** (`menu_items`) and the **recipe binders** (`recipes`); the **back door** at the right end (The Manager).
- **Parked in a city park:** a striped lawn, the path customers queue on, benches and picnic tables with umbrellas (which will **fill with visitors when business is good**, Phase 7), lamp posts and string lights, trees, a distant city skyline, a low sun. The park ground is 0.35 m lower than the truck floor so customers' heads sit in the window.
- **A "risograph print" style** — the signature look, deliberately not playing it safe: the scene is rendered at low resolution (about 300 lines, big pixels), then a shader maps every pixel to the **riso inks** (`src/game/art/riso.ts`) with a **4×4 Bayer dither**, draws **ink outlines** where depth jumps, and prints a **red copy of each outline one pixel off**, like a mis-registered riso layer. Ink colours are used exactly as written (no sRGB → linear conversion), and lights are neutral × π (Three.js uses physical light units).
- **Signature feature: the "Data Lens"** (built in 4.8) — **L** or the 🔍 button dissolves the world, pixel by pixel in Bayer order, into a teal blueprint on paper with a grid, and a card floats over every object with its tables (row counts, columns, two sample rows). The tables the current order needs are starred in mustard, so the lens also hints where to look. The world and the database feel like one.
- **Placeholder models** made from basic shapes (boxes, cylinders, spheres). Final models will come from **CC0** 3D packs (Kenney, Quaternius, Poly Pizza), recoloured to the riso inks. The status of every part is in [`docs/ASSETS.md`](docs/ASSETS.md); sources and licences go in `CREDITS.md`.
- React draws the overlays (the SQL tablet, the speech bubble that follows the customer's head, the crosshair, the HUD). The 3D code never imports React; the two only talk through `src/game/truck/bridge.ts`.
- Size: the 3D code (Three.js + game) is about 128 KB gzipped and loads after the page appears.
- Not yet: phone controls (see §13).

## 8. Data

- A realistic database: `menu_items` (category, price and cost), `sales` per line item (date and time, channel), `customers`, `recipes`, `inventory`, `suppliers`. Names are English `snake_case`.
- **Dirty data on purpose** (empty values, missing prices) in some levels, because that is real work.
- **Sales data** (`src/sql-core/data/sales.ts`): made by a generator with a **fixed seed** (always the same, so answers are stable and testable), 1 August – 31 October 2026, 07:00–17:59, about 4,600 orders and 7,700 rows. `customers`: 60 people — 16 regulars, 39 occasional, 5 who signed up but never bought (for `LEFT JOIN`). Dates and times are returned as text exactly as PostgreSQL writes them.
- **Hidden patterns** (locked by tests):
  - **The Quiet Day:** Tuesday is market day → the lowest revenue, because of **fewer orders** (about 40% fewer), not smaller ones.
  - **Where Did the Regulars Go?:** four regulars came for *Grandma's Secret Cake*; it was dropped after August and they never came back. *(Item names from v1 stay until the data is rewritten.)*
  - **The Analysis Case:** in October milk often ran out in the morning (`inventory.sold_out_at`), because the new cheaper supplier delivers at 12:00 instead of 06:00. Milk drinks fell, some customers switched to black coffee, some left; October revenue is **18% below September**, and Latte dropped the most.
- **v2 additions (Phase 4–5):** this history becomes the truck's **past**, so the manager can still ask about it. **Play days** start on 1 November 2026: the player's sales are added to `sales` with `channel = 'truck'`, and daily stock to `inventory`. Progress stores a **day log** per day (its planned orders, orders served and missed); on load, the data is rebuilt from the seed and every saved day is replayed (past days, then today), so it is exactly the same every time and stays testable.
- Player queries are **always read-only** and rolled back. Only the game writes to the database.
- Each part of the truck sees its own tables (like v1's stations): the tablet sees `menu_items`, `sales` and `customers`; the fridge sees `inventory` and `suppliers`; the menu board sees `menu_items`; the recipe binders see `recipes` + `menu_items`; the manager's cases see everything. This keeps the lesson "company data lives in many systems".

## 9. Answer checking and level format

### Answer checking
- The **result** is graded, not the query text — there are many right ways to write SQL.
- Row order only counts when the task asks for it (`ORDER BY` in the solution).
- Column names and aliases are graded loosely, unless the level teaches aliases.
- **A query must end with `;`** — a habit from day one. It is checked after the result is right, with a friendly message ("your result is right, just end it with `;`").
- The player's query and the official solution run on the same database; their **results** are compared.
- Every player query runs in a **READ ONLY** transaction that is always rolled back; transaction commands (`BEGIN`/`COMMIT`/…) are refused.
- **Per-area tables:** one PostgreSQL role per area with `GRANT SELECT` on its tables only, then `SET LOCAL ROLE` inside the transaction. `permission denied for table …` becomes a friendly message naming where that table lives. `SET`/`RESET`/`DO` are refused and `set_config` is revoked, so a player cannot switch back to the all-seeing role (tested).
- The database runs in a **Web Worker**: a running query shows a **■ Stop** button that ends the worker and starts a fresh one (about 1 s; the data is rebuilt exactly the same).
- Result tables show the **first 200 rows**; the checker always uses every row.
- Hints: up to three per task, from general direction → the clause needed → nearly there. Hints lower the stars; they never block progress.

### Level format
Each level is a TypeScript object (`src/sql-core/levels/`, one file per chapter):
- `id` (e.g. `ch0-1`; saved in progress, so never renamed after release), `title`, `character`
- `lesson` (optional): a short lesson card for a new concept
- `dialogue` and `task` (one clear sentence, always visible while working)
- `input`: `blocks` (may include decoys), `fill-blank` (a template with `___`), or `free`
- `solution` (only its result is compared), `check` (checker options), `hints` (exactly 3), `success`
- `soWhat` (optional): a short multiple-choice "what does this mean?" question
- **Cases**: `kind: 'case'`, with `starters` (editable starting queries) and `questions`, each with an `answer` (`number` or `choice`) and `evidence` — reference queries whose rows must all appear in a pinned result. Columns match by name, or by **value** when the name differs; `exact: true` means the row count must match; otherwise at most `maxRows` rows, so "the whole table" never counts as evidence.

Indonesian text lives in `src/sql-core/levels/locales/id/` (text only — SQL, blocks and answers are never translated). Checker feedback comes back as structured codes and becomes EN/ID sentences in `formatFeedback`. Tests check that every level runs, that blocks are enough to build the answer, that cases' evidence passes its own check, and that every level has a translation with the same structure.

**Orders** (Phase 5): an order is an **order template** + one **variant** of its parameters (`src/sql-core/truck/templates.ts`, Indonesian in `locales/id/templates.ts`). Its id, `template:variant` (e.g. `price-under:3.5`), is all that is saved: it rebuilds the task, the SQL, the hints and what the customer buys. The customer's look and which line they say come from the day's seed (`orders.ts`). Template and variant ids are saved in progress, so they are never renamed.

## 10. Rewards (rules kept from v1)

- **Stars per task:** ⭐ correct · ⭐⭐ correct with no hints · ⭐⭐⭐ no hints and no wrong runs (cases: no unsupported conclusions).
- **Coins:** 10 per star for a request, 20 per star for a case; a replay only pays the difference to the best result (`src/app/rewards.ts`, tested).
- In v2, stars and coins are counted per day in the end-of-day summary; coins buy **truck upgrades** (decorations, a bigger fridge, new menu items) and **new locations** in Phase 7. A **daily streak** 🔥 and **badges** 🏅 return in the per-day form.

## 11. Technical decisions

| Topic | Decision | Why |
|---|---|---|
| Platform | **Web app** in the browser | Easy to reach and to share |
| Game world | **Three.js** (first-person 3D, risograph post-processing) | Chosen after the 3D prototype (17 Nov 2026); small, flexible, and lots of CC0 3D assets |
| SQL tablet | **HTML overlay over the canvas** (React, CodeMirror 6) | Editors, autocomplete and result tables are far easier in HTML than inside a canvas |
| Architecture | **SQL core separate from the game world** | The SQL core was built and tested first; the world could be replaced several times without touching it |
| Backend | **None** for now | Free to host, quick to build; progress is saved in the browser |
| SQL engine | **PostgreSQL in the browser via PGlite**, in a Web Worker | Closest dialect to real BI work (Postgres, Redshift, BigQuery, Snowflake); a slow query can be stopped |
| Languages | **English (main) + Bahasa Indonesia** for story and UI; SQL, tables, columns, data and PostgreSQL errors always English | A global audience; Indonesian makes it easy for local beginners. Translations live in separate files (`locales/id/`) and fall back to English |
| Build / language / tests | **Vite**, **TypeScript**, **Vitest** | Fast dev server and static builds; field-name mistakes caught before running; the SQL core is tested automatically |
| Currency | **$ (USD)** | Generic and widely understood |

### Code structure
- `src/sql-core/` — database (PGlite), answer checker, cases, levels, data, orders. **Must not** import React or Three.js.
- `src/console/` — the SQL console (React): blocks, fill-in-the-blank, editor, result table, case notes.
- `src/game/` — the 3D world (Three.js). **Must not** import React.
  - `art/riso.ts` — the riso inks.
  - `truck/world.ts` — sizes, layout, walking, aiming, the queue path (pure logic, tested).
  - `truck/build.ts` — low-poly models; `truck/looks.ts` — customers' looks.
  - `truck/risoPass.ts` — the riso shader; `truck/colour.ts` — exact ink colours.
  - `truck/queue.ts` — the customer queue (pure logic, tested).
- `src/sql-core/truck/` — the truck's rules: `objects.ts` (what each object sees), `templates.ts` + `orders.ts` (orders), `concepts.ts` + `repetition.ts` (mastery and day planning), `day.ts` (the clock, the day log, sales), `manager.ts` (the Manager's case).
  - `truck/TruckGame.ts` — the game loop, input, customers.
  - `truck/bridge.ts` — the only link between the game and React (events).
- `src/app/` — the page: `TruckApp.tsx` (HUD, crosshair, bubble), `useTruckShift.tsx` (the shift's logic: database, orders, tablet), `ConsoleOverlay.tsx`, the database worker, `rewards.ts`.
- `src/i18n.ts` — UI text in both languages.

## 12. Roadmap

Built in phases; every phase produces something playable. Every iteration: build → check in the browser → commit and push.

| Phase | Contents | Done when… |
|---|---|---|
| **1. SQL core** ✅ | PGlite + data, checker, level format, console (blocks → fill-in → free), Chapters 0–1, EN/ID | Done 13 Nov 2026 |
| **2. First world** ✅ | v1's top-down café world (Phaser) | Done; replaced by v2 |
| **3. The café grows** ✅ | Chapters 2–5, cases, Analysis Case, stars/coins/upgrades, Skill Check, Rush Hour | v1 MVP done 16 Nov 2026; its SQL content is kept |
| **4. One-day prototype** ✅ | The look (✅ 3D), the 3D truck, customers with hand-written orders (week 2), the tablet, using the truck's objects, the Data Lens, sales into the database, the clock and end-of-day summary, one manager knock | The owner plays a full day and finds the concept fun |
| **5. Order generator & repetition** 🚧 | Parameterised order templates, concept mastery + spaced repetition, patience & tips, the day log saved and replayed | Day 2, day 3… feel different but still practise what needs practice |
| **6. Six-week curriculum** | Chapters 0–5 become templates + manager cases, lesson cards per week, Skill Check → starting week, the Analysis Case in week 6 | A new player can go from week 1 to the Analysis Case, EN/ID |
| **7. The truck grows & final art** | Truck upgrades, new locations (park, market, festival), Lunch Rush, per-day streak & badges, all final models | Coins can be spent and the truck/locations visibly change |
| **8. Release** | Full playtest, phone controls, hosting | The owner approves → v2 done |

### Phase 4 plan — one-day prototype

| # | Iteration | Done when… |
|---|---|---|
| 4.1–4.5 ✅ | **Finding the look** with 2D prototypes: a static truck, the queue + tablet, a side-view truck to walk around, a first-person panorama in the riso style. Replaced by 4.6; code removed (git tag `v2-prototypes`). Details and screenshots in `docs/JOURNEY.md` | The order → tablet → SQL → served loop works; the riso style is born |
| 4.6 ✅ | **3D prototype** (Three.js): low-poly truck and park, WASD + mouse, E/click to use, 3D customers queueing, the order tablet, the riso shader → **locked in**; v1 and 2D code removed, `/` opens the 3D truck | The owner tried it and chose 3D ✅ |
| 4.7 ✅ | **Using the truck's objects:** the menu board, fridge and recipe binders open the console with their own tables; an order may need checking another object first | Each object opens its tables; one order uses the fridge (`inventory`) |
| 4.8 ✅ | **Data Lens** (signature feature): a button that shows tables over every object | The Data Lens works on every side of the truck |
| 4.9 ✅ | **Sales into the database** (`INSERT` by the game, `channel = 'truck'`) + the day log in progress, replayed on load | After serving, a `sales` query shows today's sales, also after reloading the page |
| 4.10 ✅ | **The clock** 10:00–17:00, patience → tips, closing time + end-of-day summary | A day can be played from opening to the summary |
| 4.11 ✅ | **The manager's knock:** The Manager (suit) at the back door, one small case using the case engine on today's data | The manager's case can be solved with 📌 evidence |
| 4.12 ✅ | Owner playtest + fixes | The owner chose to go on to Phase 5 (20 Nov 2026) |

**4.12 playtest fixes so far (18 Nov 2026):** the park's furniture now lives in `PARK` (`world.ts`), and tests keep every bench, picnic table, lamp and tree off the path customers walk (in and out) and apart from each other — a bench had been standing right on the path, and a lamp post on the exit route. Picnic tables got legs under both seats and low cross-bars, so the seats no longer float. The order bubble and the Data Lens cards keep a **fixed width** and slide to stay on screen (`src/app/overlayLayout.ts`, tested) — near the right edge the bubble had squeezed to 76 px and grown 422 px tall; its tail still points at the customer. Lens cards no longer let long values spill out (cut with "…"), cards that would overlap move up out of each other's way, and the order bubble hides while the lens is on.

**4.12 additions from the playtest (18 Nov 2026):**
- **Data Lens cards are clickable.** Turning the lens on frees the mouse (pointer lock off; dragging still looks around, and clicking the 3D view does not capture the mouse again while the lens is on). Every table name on a card is a button that opens a look-around console on that table, with the object that holds it (cards carry their `object`; the customer's card opens the tablet). A hint at the bottom says so.
- **The Manager talks first.** Opening the back door starts a **talk** (`src/app/TalkBox.tsx`): the Manager's lines one by one (click, Space, Enter or E), then the player picks one of three replies (click or 1–3) and hears an answer in the Manager's bossy voice, then *Open the case 📋*. The script is `MANAGER_INTRO` in `manager.ts` (Indonesian in `locales/id/manager.ts`, tested). The case console then only shows a one-line reminder. Walking away (Esc or ✕) closes the door; the Manager keeps knocking. Coming back to a case already opened skips the talk.
- Opening the back door while the records are still loading (just after a reload) now says so ("Still opening the records — try again in a moment.") instead of showing the plain door message.

**4.6 as built (17 Nov 2026):**
- `src/game/truck/world.ts` (tested, no Three.js): the truck in metres, where things are (`LAYOUT`), where the player may walk (`WALK`), `walkStep` (WASD relative to the view; diagonals are not faster), `rayBox` / `aimedInteractable` (the thing under the crosshair within 1.7 m), and `queuePosition` (the queue path in the park).
- `src/game/truck/build.ts`: the truck (a wall with the window cut out, counters, a tilted tablet, a fridge full of bottles, stock shelves, a red espresso machine, the menu board, recipe binders, a clock, the back door), the park (striped lawn, path, benches, picnic tables with umbrellas, lamps and string lights, trees, skyline, sun, the truck's awning), and blocky 1.75 m customers with swinging arms and legs.
- `src/game/truck/risoPass.ts`: the low-resolution render, ink mapping with dither, depth outlines and the red misprint. Without exact ink colours and lights × π, everything turns dark green.
- `src/game/truck/TruckGame.ts`: WASD/arrows, mouse look (pointer lock; dragging works too), click/E on the thing under the crosshair, head bob, customers turning to walk and then facing the truck, and the front customer's head position sent to React (`anchor`) for the speech bubble. Time stops while the tablet is open (keyboard and pointer lock released).
- Not yet: phone controls.

**4.7 as built (17 Nov 2026):**
- `src/sql-core/truck/objects.ts` is the source of truth for the truck's objects: which tables each one sees (`OBJECT_STATION`: tablet → `sales`, `customers`, `menu_items`; fridge → `inventory`, `suppliers`; menu board → `menu_items`; recipe binders → `recipes`, `menu_items`; back door → nothing yet) and where an order is answered (`objectForStation`: menu and sales questions on the tablet, stock at the fridge, recipes at the recipe binders).
- Using the object an order needs opens the order's console; any other object with data opens a **look-around console** (`src/console/ExploreConsole.tsx`): any query on its own tables, run as its PostgreSQL role, ungraded. Its header says where the current order is answered. The back door shows a short message until The Manager arrives (4.11).
- The speech bubble says where to answer ("Answer at the fridge (aim + E)").
- Feedback names the truck's objects: "You can't see `sales` from here — that table is at the tablet." (`STATION_NAMES` now holds object names.)
- Two new requests written for the truck (`src/sql-core/truck/levels.ts`, Indonesian in `locales/id/levels.ts`), week 2 concepts with fill-in-the-blank input: *Who Brings the Milk?* at the fridge (`suppliers`, `WHERE … AND until IS NULL` → Highland Dairy at 12:00, a first clue for the Analysis Case) and *How Much Milk?* at the recipe binders (`recipes`, `WHERE ingredient = 'milk'`). The prototype day now has seven orders; looks are ordered so no two identical customers stand in the queue together (tested).
- `findOrderLevel` finds an order's level among the chapters and the truck's own levels, translated, with English as the fallback.

**4.8 as built (17 Nov 2026):**
- `LENS_SPOTS` in `world.ts` (tested): one card per spot with its tables — the tablet (`sales`, `menu_items`), the fridge (`inventory`), the stock shelves (`suppliers`), the menu board (`menu_items`) and the recipe binders (`recipes`, `menu_items`); the `customers` card follows the customer at the window. Tests check that each card only lists tables its object can see, that every table appears somewhere, and that every table an order needs is on the card of the object where it is answered.
- `risoPass.ts`: a `lens` uniform (0–1). Pixels switch to the blueprint when their Bayer value is below it, so the lens dissolves in over 0.45 s; edges turn teal and the misprint turns mustard. It keeps animating while time is stopped.
- `TruckGame.ts`: **L** sends `lensKey`; React owns the on/off state and sends `lens`; the game projects each card's point to the screen (`lensCards`, hidden beyond 6 m or off screen).
- `src/app/DataLens.tsx`: loads each table's row count and first two rows once (read-only, as the database owner), and draws the cards; nearer cards are larger. Cards hide while a console is open.

**4.9 as built (17 Nov 2026):**
- Every order says what the customer **buys** (`buys` in `orders.ts`: item ids and quantities; tested to be items on sale).
- `src/sql-core/truck/day.ts`: the **day log** (`{ date, served: [{ orderId, at }] }`, first play day 2026-11-01), `serveOrder`, `parseDayLog` (broken or unknown entries are dropped), and `saleSql`: one `sales` row per item at the menu price, with the next `sale_id`s and one new `order_id`, `channel = 'truck'`, built only from the game's own data (dates and times are checked). Until the clock (4.10), orders are served 12 minutes apart from 10:00.
- `CafeDatabase.write(sql)`: game-only writes, never player SQL; players stay read-only (tested). `LocalCafeDatabase` now runs requests **one at a time**, so a write or a second query can never land between `BEGIN READ ONLY` and `ROLLBACK` (tested with concurrent requests).
- The worker database remembers every write and replays it after **■ Stop** restarts the worker.
- The day log is saved in the browser (`sql-valley.truck-day`). On load, `getDayDatabase` replays it **before** anyone can query; the game skips customers already served. The HUD shows "📅 Nov 1 · 3/7 served"; after the last order a card suggests `SELECT * FROM sales WHERE channel = 'truck';` and offers to start the day again. Data Lens cards reload after each sale.
- Checked in the browser: one sale takes `sales` from 7,694 to 7,695 rows, a reload keeps it (and the next customer is the second one), and a full day gives 7,703 rows.
- ⚠ For Phase 6: v1 questions over *all* sales now include the truck's sales. Answers are still graded fairly (same data), but teaching traps can break — e.g. Chapter 3's "item 6 sold exactly 400 portions" (`>` vs `>=`) becomes 401 after the *How Much Milk?* customer buys a Flat White. Moved questions should be limited to the history (August–October) or rewritten.

**4.10 as built (17 Nov 2026):**
- `src/sql-core/truck/day.ts` (tested): the day rules — `OPENING`/`CLOSING`, `GAME_MINUTES_PER_SECOND`, `QUIET_SPEEDUP`, `PATIENCE_MINUTES`, `arrivalTime`, `moodFor`, `TIPS`, `formatClock`, `isDayOver` — and a richer day log: `{ date, clock, served: [{ orderId, at, tip, stars }], missed }`. A log saved by 4.9 (times as text) is read as a fresh day without crashing. `revenueSql(date)` is the summary's query.
- `queue.ts`: `giveUp(customer)` — anyone in the line can leave; they walk back down the path and the others close the gap (tested).
- `TruckGame.ts`: owns the clock (stops while a console is open, ×4 when the line is empty, stops at 17:00), moves the wall clock's hands, lets customers arrive at their time, counts their patience, sends `clock`, `patience`, `gaveUp` and `closed` (closing time or nobody else to come, and the line empty). A reload carries on from the saved clock and skips orders already served or missed.
- `useTruckShift.tsx`: saves the clock as it moves (never backwards), records missed customers, and on hand-over records the time, the tip (from the mood) and the stars (`starsFor`: hints and wrong runs).
- `src/app/DaySummary.tsx`: the **end-of-day summary** — orders served, customers who left, revenue, tips and stars. Revenue comes from running `revenueSql` on the tablet's role, and the query is shown: *"How the revenue was counted — you can run this on the tablet too."*
- HUD: 🕙 clock (red "closed" after closing) next to the day's date and orders served.
- Checked in the browser: the clock runs and stops while the tablet is open; an ignored customer turns 😐, then leaves at 11:00 (60 minutes); a served customer at 11:14 gets a $0.50 tip and ⭐⭐⭐; at the end the summary shows revenue $6.00 from the query (2 × Americano); a reload mid-afternoon carries on at the saved time.

**4.11 as built (17 Nov 2026):** The Manager knocks at 13:30 (`KNOCK_TIME`), or as soon as every customer has been handled; the back door rattles and a "Knock knock!" alert shows. Using the door swings it open (the end wall now has a real opening) and shows the Manager (suit, red tie, glasses, report tablet) on a step outside. `src/sql-core/truck/manager.ts` builds the case when the door opens, working out today's answers from the database: today's orders, today's revenue, and October's best channel, each backed by pinned evidence (tested on a played day and on an empty day; Indonesian in `locales/id/manager.ts`). The console shows the Manager's lines above the task. Answering records `manager: { stars }` in the day log; the summary shows it. The day only closes once the Manager has been answered (or at 17:00). Checked in the browser end to end: knock at 13:30, three answers backed by data (2 orders, $8.75, dine-in), the Manager leaves, stars saved.

**Cleanup (17 Nov 2026):** v1's code (Phaser, the top-down café, Journal, shop, quests, `progress.ts`), the 2D truck prototypes, 72 unused UI strings, 112 unused CSS rules and the Phaser dependency were removed. `src/sql-core/` stays whole because its content is reused in Phase 6. Documents were moved to English for a global audience.

### Phase 5 plan — order generator & repetition

Patience & tips (4.10) and the saved, replayed day log (4.9) were already built in Phase 4.

| # | Iteration | Done when… |
|---|---|---|
| 5.1 ✅ | **Order templates, mastery and days that follow:** templates with variants replace the hand-written orders; concept mastery + spaced repetition plan each day; "Open the next day" | Day 2, day 3… bring different orders, and weak concepts come back sooner |
| 5.2 | **Input grows with mastery:** a well-known concept gets more blanks (a whole condition), then free typing | A level-4 concept is answered without a template |
| 5.3 | Owner playtest of several days + fixes | The owner plays three days and they feel different |

**5.1 as built (20 Nov 2026):**
- `concepts.ts`: the six week-2 concepts in teaching order (`where-compare`, `where-text`, `and`, `in`, `like`, `is-null`), their names (EN/ID) and their lesson cards (taken from the Chapter 1 levels).
- `templates.ts`: 11 templates with 2–5 variants each (36 orders): under/at least a price, a category, available items, a category under a price, two categories (`IN`), name and description patterns (`LIKE`), missing values and the current supplier (`IS NULL`, at the fridge), and recipe ingredients (at the recipe binders). Price limits are always an exact price of some item, so `<=` instead of `<` shows extra rows. Tests run every variant: its solution returns rows on its own station, the blanks filled with the reference answers are graded correct, it buys only items on sale, and its Indonesian text has the same shape.
- `repetition.ts`: **mastery** per concept (level 0–5, due day, times practised), never saved but **worked out again from the saved day logs**, so playing a day again never counts twice. ⭐⭐⭐ → up one level, back in 1/2/4/7/14 days; hints or wrong runs → down one, back tomorrow; a customer who gave up → same level, back tomorrow. **Planning a day** (seeded by the date): due concepts first (weakest first), then up to 3 new concepts, then a draw where weaker concepts are more likely; 7 orders, at most 3 per concept, never the same order twice in a day, yesterday's orders avoided when possible. A day with new concepts opens with the first of them, and an order of a concept met for the first time opens its lesson card.
- The day log now holds the day's planned `orders`; logs saved before templates start a fresh Day 1. Finished days are kept in `sql-valley.truck-past`.
- The end-of-day summary shows **Practised today**: each concept with its level (●●○○○, ▲/▼ or *new*) and when it comes back, then **Open the next day →** (or play the same day again). The HUD shows "Day 2 · Nov 2 · 0/7 served".
- Checked in the browser: Day 1 plans 7 orders from the first three concepts and opens the lesson card; a served order is saved; a finished day shows the summary; the next day is Nov 2 with the weak concepts and three new ones, also in Indonesian.
- Not yet: weekends and weeks (every calendar day is a working day for now; weeks come with the curriculum in Phase 6).

## 13. Open questions

- [ ] Truck name and game title — for now **SQL Valley**, with the truck called *Rolling Roast*
- [ ] Should `INSERT`/`UPDATE` be taught in later weeks (the player records orders or restocks themselves)?
- [ ] The right length of a day (8–12 minutes) — decided by the 4.12 playtest
- [ ] Locations: only visual, or does each have its own customers and data?
- [ ] Phone controls for 3D: a virtual joystick + drag to look, or turning side by side like prototype 4.5
- [ ] Hosting (e.g. GitHub Pages / Vercel / Netlify)
- [ ] Town setting: generic and international, or with a local touch?

## History

- **v1 — Grandma's café** (Phases 1–3, 13–16 Nov 2026): a top-down 2D pixel-art café where the player walked to SQL stations. The full v1 design document (written in Indonesian at the time) and its code are in git tag `v1-cafe-mvp`.
- **v2 prototypes** (4.1–4.6, 16–17 Nov 2026): from a static 2D truck to the 3D first-person truck. Code in git tag `v2-prototypes`; the story with screenshots in [`docs/JOURNEY.md`](docs/JOURNEY.md).
