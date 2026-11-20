import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type CafeDatabase } from '../db';
import { STATIONS } from '../stations';
import { OBJECT_STATION, TRUCK_OBJECTS } from './objects';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
}, 60_000);

describe('truck objects', () => {
  it('let every object with data be looked around, but not read other tables', async () => {
    for (const object of TRUCK_OBJECTS) {
      const station = OBJECT_STATION[object];
      if (!station) continue;
      const own = await runQuery(db, `SELECT * FROM ${STATIONS[station].tables[0]} LIMIT 1;`, station);
      expect(own.ok, object).toBe(true);
    }
    const blocked = await runQuery(db, 'SELECT * FROM sales LIMIT 1;', OBJECT_STATION.fridge!);
    expect(blocked.ok).toBe(false);
  });
});
