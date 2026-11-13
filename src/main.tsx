import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WorldApp } from './app/WorldApp';
import './app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorldApp />
  </StrictMode>,
);
