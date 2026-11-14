import type { CafeDatabase, QueryResult, TableInfo } from '../sql-core/db';
import type { StationId } from '../sql-core/stations';

export type WorkerRequest =
  | { type: 'run'; id: number; sql: string; station?: StationId }
  | { type: 'schema'; id: number };

export type WorkerReply =
  | { type: 'ready' }
  | { type: 'failed'; message: string }
  | { type: 'result'; id: number; result: QueryResult | TableInfo[] }
  | { type: 'error'; id: number; message: string };

type Pending = { kind: WorkerRequest['type']; resolve: (value: never) => void; reject: (err: Error) => void };

/**
 * The café database running in a Web Worker (see db.worker.ts).
 * `stop()` ends the worker, answers the running query with "stopped", and starts a fresh
 * worker: the data is generated the same way every time, so nothing is lost.
 */
export class WorkerCafeDatabase implements CafeDatabase {
  private worker!: Worker;
  private ready!: Promise<void>;
  private readonly pending = new Map<number, Pending>();
  private nextId = 1;

  constructor() {
    this.start();
  }

  /** Resolves once the data is loaded; rejects if the worker could not open the database. */
  whenReady(): Promise<void> {
    return this.ready;
  }

  run(sql: string, station?: StationId): Promise<QueryResult> {
    return this.request({ type: 'run', id: 0, sql, station });
  }

  schema(): Promise<TableInfo[]> {
    return this.request({ type: 'schema', id: 0 });
  }

  stop(): void {
    this.worker.terminate();
    for (const p of this.pending.values()) {
      if (p.kind === 'run') p.resolve({ ok: false, error: { kind: 'stopped' } } as never);
      else p.reject(new Error('stopped'));
    }
    this.pending.clear();
    this.start();
  }

  private start(): void {
    this.worker = new Worker(new URL('./db.worker.ts', import.meta.url), { type: 'module' });
    this.ready = new Promise((resolve, reject) => {
      this.worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        const message = event.data;
        if (message.type === 'ready') return resolve();
        if (message.type === 'failed') return reject(new Error(message.message));
        const p = this.pending.get(message.id);
        if (!p) return;
        this.pending.delete(message.id);
        if (message.type === 'result') p.resolve(message.result as never);
        else p.reject(new Error(message.message));
      };
      this.worker.onerror = (event) => reject(new Error(event.message || 'The database worker failed to start'));
    });
  }

  private async request<T>(request: WorkerRequest): Promise<T> {
    await this.ready;
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { kind: request.type, resolve: resolve as (value: never) => void, reject });
      this.worker.postMessage({ ...request, id });
    });
  }
}
