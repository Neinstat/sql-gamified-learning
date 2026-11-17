import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TruckApp } from './app/TruckApp';
import './app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TruckApp />
  </StrictMode>,
);
