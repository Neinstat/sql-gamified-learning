# Art status

Which parts of the game's look are final and which are still placeholders.

All models are built in code from boxes, cylinders and spheres (`src/game/truck/build.ts`) in the
riso inks (`src/game/art/riso.ts`), then drawn through the risograph shader
(`src/game/truck/risoPass.ts`). Final models are planned to come from CC0 3D packs (for example
Kenney, Quaternius or Poly Pizza), recoloured to the riso inks and recorded in `CREDITS.md`
with their source and licence. Earlier 2D art lives only in git history (see `docs/JOURNEY.md`).

| Part | Status | Notes for the final version |
|---|---|---|
| Riso look: inks, 4×4 Bayer dither, ink outlines, red misprint | 🟨 Style chosen | Tune line thickness and dither once final models are in |
| Truck interior: walls, serving window, counters, tablet, tip jar, plant | 🟥 Placeholder | A CC0 kitchen / food-truck kit |
| Fridge with bottles, stock shelves with boxes and coffee sacks | 🟥 Placeholder | |
| Red espresso machine, wall clock, menu board, recipe binders | 🟥 Placeholder | Clock hands should follow the time of day |
| Back door, spare apron | 🟥 Placeholder | |
| Park: lawn, path, benches, picnic tables, lamps, string lights, trees, skyline, sun | 🟥 Placeholder | Seats fill with visitors when business is good (Phase 7) |
| Customers (blocky people with swinging limbs, 5 looks in `looks.ts`) | 🟥 Placeholder | CC0 animated low-poly characters (walk, idle, happy, annoyed) |
| The Manager (suit) | ⬜ Not made yet | Comes with the manager's knock |
| Crosshair, aim label, speech bubble (HTML) | 🟨 Style chosen | |
| Data Lens: blueprint mode in the shader, table cards (HTML) | 🟨 Style chosen | Cards may need a smarter layout when several overlap |

Legend: 🟥 placeholder · 🟨 style chosen, may be polished · 🟩 final · ⬜ not made yet
