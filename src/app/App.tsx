import { Playground } from './Playground';

export function App() {
  return (
    <main className="page">
      <header className="header">
        <h1 className="title">SQL Valley</h1>
        <p className="tagline">Grandma left you her café — and a very messy database.</p>
      </header>
      <Playground />
    </main>
  );
}
