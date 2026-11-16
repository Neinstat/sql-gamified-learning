# Art status (food truck v2)

Which pictures in the food truck are final and which are still placeholders. In the game, the
**🏷 Art** button shows a red `PLACEHOLDER` tag over every picture that is not final yet.

Placeholders are drawn in code (`src/game/truck/truckArt.ts`, `customerArt.ts`) with the
32-colour palette. The source of the final art is decided in Phase 7 (GAME_DESIGN.md §14.8):
CC0 packs for objects, and for the big characters a licensed pack, an artist, or the owner's own
drawings. Every third-party asset goes in `CREDITS.md` with its source and licence.

| Asset | Size (px) | Status | Notes for the final version |
|---|---|---|---|
| Player (side view, walk cycle) | 40×96, 3 frames | 🟥 Placeholder | Needs left/right walk (4–6 frames), idle; ideally up/down too |
| Customers (half body, 5 looks) | 64×80, 2 frames | 🟥 Placeholder | Big, expressive faces; several looks; idle + happy/annoyed |
| The Manager (suit) | — | ⬜ Not drawn yet | Comes in 4.8 |
| Truck interior: wall, ceiling lamps, floor | 960×270 | 🟥 Placeholder | Tileable wall and floor |
| Serving window + sill + shutter | 320×114 | 🟥 Placeholder | |
| Tablet (POS) on the sill | 46×26 | 🟥 Placeholder | |
| Fridge & stock clipboard | 84×124 | 🟥 Placeholder | |
| Prep counter + coffee machine + cups | 156×48 | 🟥 Placeholder | |
| Wall clock | 32×32 | 🟥 Placeholder | Hands are drawn by code (time of day) |
| Menu board | 70×82 | 🟥 Placeholder | |
| Recipe shelf | 72×114 | 🟥 Placeholder | |
| Back door | 70×138 | 🟥 Placeholder | |
| Street outside (parallax) | 960×270 | 🟥 Placeholder | Changes with location and time of day later |
| "E" prompt | 14×14 | 🟥 Placeholder | |

Legend: 🟥 placeholder · 🟨 final art chosen, not added yet · 🟩 final · ⬜ not drawn yet
