import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PracticePage } from './PracticePage';
import '../styles.css';
import './practice.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PracticePage />
  </StrictMode>,
);
