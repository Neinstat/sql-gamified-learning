/// <reference lib="webworker" />
/**
 * The café database in a Web Worker (GAME_DESIGN.md §10): a slow query only blocks this
 * worker, never the game, and the page can stop it by ending the worker.
 * Messages: see WorkerRequest / WorkerReply in workerDatabase.ts.
 */
import { createCafeDatabase } from '../sql-core/db';
import type { WorkerReply, WorkerRequest } from './workerDatabase';

const reply = (message: WorkerReply) => postMessage(message);

const ready = createCafeDatabase();
ready.then(
  () => reply({ type: 'ready' }),
  (err) => reply({ type: 'failed', message: String(err) }),
);

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const db = await ready;
    const result = request.type === 'run' ? await db.run(request.sql, request.station) : await db.schema();
    reply({ type: 'result', id: request.id, result });
  } catch (err) {
    reply({ type: 'error', id: request.id, message: String(err) });
  }
};
