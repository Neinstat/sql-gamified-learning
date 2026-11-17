import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WorldApp } from './app/WorldApp';
import { TruckApp } from './app/TruckApp';
import { Truck3DApp } from './app/Truck3DApp';
import './app/styles.css';

// Food truck v2 (GAME_DESIGN.md §14) is opened with `?truck` (2D) or `?truck3d` (3D prototype)
// until it replaces the café.
const params = new URLSearchParams(window.location.search);
const App = params.has('truck3d') ? Truck3DApp : params.has('truck') ? TruckApp : WorldApp;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
