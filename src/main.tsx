import "reflect-metadata";
import { Buffer } from 'buffer';
import process from 'process';
import React from 'react'; // ← Required for JSX (unless automatic runtime is configured)

window.Buffer = Buffer;
window.process = process;
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
