import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WorldApp } from './app/WorldApp';
import { TruckApp } from './app/TruckApp';
import './app/styles.css';

// Food truck v2 (GAME_DESIGN.md §14) is opened with `?truck` until it replaces the café.
const truck = new URLSearchParams(window.location.search).has('truck');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{truck ? <TruckApp /> : <WorldApp />}</StrictMode>,
);
