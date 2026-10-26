import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import './DesktopMenu.css';

// Desktop app only: a game-style menu opened with Esc (or the window's close button),
// with Resume / Settings / Quit to desktop.

const desktop = typeof window !== 'undefined' ? window.headshotDesktop : undefined;
export const OPEN_MENU_EVENT = 'hh:open-menu';

export function openDesktopMenu() {
  window.dispatchEvent(new Event(OPEN_MENU_EVENT));
}

/** Minimize / fullscreen / close buttons for the frameless window. */
export function WindowControls() {
  if (!desktop) return null;
  return (
    <div className="window-controls">
      <button type="button" onClick={() => desktop.minimize()} aria-label="Minimize" title="Minimize">
        <Icon name="minimize" size={15} />
      </button>
      <button type="button" onClick={() => desktop.toggleFullscreen()} aria-label="Toggle fullscreen" title="Fullscreen (F11)">
        <Icon name="fullscreen" size={15} />
      </button>
      <button type="button" className="is-close" onClick={openDesktopMenu} aria-label="Quit" title="Quit (Esc)">
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}

export default function DesktopMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const resumeRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!desktop) return undefined;
    const onOpen = () => setOpen(true);
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.repeat) return;
      // During a run, Esc belongs to the game (it pauses). The menu is one more Esc away.
      if (document.documentElement.dataset.arenaRun === 'active') return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener(OPEN_MENU_EVENT, onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_MENU_EVENT, onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) resumeRef.current?.focus();
  }, [open]);

  if (!desktop || !open) return null;

  return (
    <div className="desktop-menu" role="dialog" aria-modal="true" aria-label="Game menu" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="desktop-menu-panel fade-up">
        <span className="nav-mark desktop-menu-mark">
          <Icon name="crosshair" size={22} strokeWidth={2.4} />
        </span>
        <h2>Headshot Haven</h2>
        <div className="desktop-menu-actions">
          <button ref={resumeRef} type="button" className="btn btn-primary btn-lg btn-block" onClick={close}>
            <Icon name="play" size={15} /> Resume
          </button>
          <button
            type="button"
            className="btn btn-lg btn-block"
            onClick={() => {
              close();
              navigate('/settings');
            }}
          >
            <Icon name="settings" size={16} /> Settings
          </button>
          <button type="button" className="btn btn-lg btn-block desktop-menu-quit" onClick={() => desktop.quit()}>
            <Icon name="logout" size={16} /> Quit to desktop
          </button>
        </div>
        <p className="desktop-menu-hint">
          <span className="kbd">Esc</span> to resume · <span className="kbd">F11</span> fullscreen
        </p>
      </div>
    </div>
  );
}
