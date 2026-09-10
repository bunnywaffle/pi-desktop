import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeService } from './services/themeService';
import './styles/globals.css';

// Initialize and apply saved theme immediately
ThemeService.initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
