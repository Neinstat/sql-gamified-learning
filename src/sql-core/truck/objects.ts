/**
 * The things in the food truck the player can use (GAME_DESIGN.md §7–§8), and which tables each
 * one sees. Every object is a "station": a PostgreSQL role that may only read its own tables,
 * which teaches that company data lives in many systems. Pure data: no game engine or UI here.
 */
import type { StationId } from '../stations';

export type TruckObjectId = 'tablet' | 'fridge' | 'menu-board' | 'recipe-shelf' | 'back-door';

export const TRUCK_OBJECTS: readonly TruckObjectId[] = ['tablet', 'fridge', 'menu-board', 'recipe-shelf', 'back-door'];

/** The tables an object shows when the player looks around with it (null: nothing to query). */
export const OBJECT_STATION: Record<TruckObjectId, StationId | null> = {
  // The till: sales, customers, and the menu they refer to.
  tablet: 'cash-register',
  // What came in, from whom, and when it ran out.
  fridge: 'stock-ledger',
  'menu-board': 'menu-board',
  // What goes into each item, next to the menu.
  'recipe-shelf': 'recipe-book',
  // The Manager knocks here (Phase 4.11); no data of its own yet.
  'back-door': null,
};

/** Where an order is answered: the object whose tables the order's level needs. */
export function objectForStation(station: StationId): TruckObjectId {
  switch (station) {
    case 'menu-board':
    case 'cash-register':
      // Menu questions come from customers at the window: answered on the tablet, which sees the menu.
      return 'tablet';
    case 'stock-ledger':
      return 'fridge';
    case 'recipe-book':
      return 'recipe-shelf';
    case 'back-office':
      return 'back-door';
  }
}
