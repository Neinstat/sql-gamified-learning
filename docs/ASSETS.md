# Art status (food truck v2)

Which pictures in the food truck are final and which are still placeholders. In the game, the
**🏷 Art** button shows a red `PLACEHOLDER` tag over every picture that is not final yet.

Placeholders are drawn in code (`src/game/truck/truckArt.ts`, `customerArt.ts`) with the
risograph inks in `src/game/art/riso.ts`. The source of the final art is decided in Phase 7 (GAME_DESIGN.md §14.8):
CC0 packs for objects, and for the big characters a licensed pack, an artist, or the owner's own
drawings. Every third-party asset goes in `CREDITS.md` with its source and licence.

| Asset | Size (px) | Status | Notes for the final version |
|---|---|---|---|
| Riso palette + dither style (`src/game/art/riso.ts`) | — | 🟨 Style chosen | Final art should keep the risograph look: flat inks, dither shading, mis-registered red edges |
| Customers, near (half body at the window, 5 looks) | 128×160, 2 frames | 🟥 Placeholder | Big, expressive faces; idle + happy/annoyed; more looks |
| Customers, mid / far (full body on the path) | 32×72 / 22×50, 2 frames | 🟥 Placeholder | Walk cycle |
| The Manager (suit) | — | ⬜ Not drawn yet | Comes in 4.10 |
| Side 1 — fridge, stock shelves, clipboard | 480×270 | 🟥 Placeholder | |
| Side 2 — serving window, counter, tip jar, plant, tablet | 480×270 | 🟥 Placeholder | |
| Side 3 — espresso machine, wall clock, menu board, recipe binders, jars | 480×270 | 🟥 Placeholder | Clock hands are drawn by code (time of day) |
| Side 4 — back door, apron hook, calendar, bin | 480×270 | 🟥 Placeholder | |
| Park outside (sky, far city, trees, lawn, path, benches, picnic tables, lamps, string lights) | 1100×270 | 🟥 Placeholder | Seats fill with visitors when business is good (Phase 7); changes with time of day |
| Hover outline (mustard + red) | — | 🟥 Placeholder | |

## 3D prototype (`?truck3d`)

All 3D models are built in code from boxes, cylinders and spheres (`src/game/truck3d/build.ts`)
and drawn through the riso shader (`risoPass.ts`). Final models would come from CC0 3D packs
(e.g. Kenney, Quaternius, Poly Pizza), recorded in `CREDITS.md`.

| Model | Status | Notes for the final version |
|---|---|---|
| Truck interior (walls, window, counters, fridge, shelves, espresso machine, menu board, binders, clock, door) | 🟥 Placeholder | A CC0 kitchen/food-truck kit, recoloured to riso inks |
| Park (lawn, path, benches, picnic tables, lamps, string lights, trees, skyline, sun) | 🟥 Placeholder | CC0 nature/park kit |
| Customers (blocky people, swinging limbs) | 🟥 Placeholder | CC0 animated low-poly characters (walk, idle) |
| Riso shader (inks, Bayer dither, ink outlines, red misprint) | 🟨 Style chosen | Tune line thickness and dither once final models are in |

Legend: 🟥 placeholder · 🟨 final art chosen, not added yet · 🟩 final · ⬜ not drawn yet
