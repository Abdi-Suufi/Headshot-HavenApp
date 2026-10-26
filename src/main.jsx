import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first so page and component stylesheets can override them.
import './styles/global.css';
import './styles/layout.css';
import App from './App';

// Inside the desktop app: enables the frameless-window styles (drag area, window buttons).
if (window.headshotDesktop) document.documentElement.classList.add('is-desktop');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
