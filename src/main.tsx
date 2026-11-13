import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { WorldApp } from './app/WorldApp';
import './app/styles.css';

// Phase 2 transition: the game world is the main page; the Phase 1 page stays at ?classic.
const classic = new URLSearchParams(window.location.search).has('classic');

createRoot(document.getElementById('root')!).render(<StrictMode>{classic ? <App /> : <WorldApp />}</StrictMode>);
