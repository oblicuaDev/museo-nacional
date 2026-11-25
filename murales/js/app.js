import { CLAUSTRO_DATA } from './data/murales.js';
import { appState } from './state.js';
import { createNavigation } from './navigation.js';
import { createViewer } from './viewer.js';

/**
 * Orquestador principal de la aplicación (Fase 2).
 * Conecta el estado central con los módulos `navigation.js` y `viewer.js`,
 * además de los atajos globales de teclado (Escape y tecla de modo dev).
 */

const devBadge = document.getElementById('dev-badge');

function renderDevBadge(state) {
  devBadge.hidden = !state.isDevMode;
}

function bindGlobalShortcuts(viewer) {
  const devKey = (appState.getConfig().devModeKey || 'd').toLowerCase();

  window.addEventListener('keydown', (event) => {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (event.key === 'Escape') {
      const state = appState.getState();
      if (state.isPlanOpen) {
        event.preventDefault();
        appState.setPlanOpen(false);
        return;
      }
      if (state.activeHotspotId) {
        event.preventDefault();
        appState.clearActiveHotspot();
      }
      return;
    }

    if (event.key.toLowerCase() === devKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      appState.toggleDevMode();
    }
  });
}

function init() {
  const navigation = createNavigation(appState);
  const viewer = createViewer(appState);

  renderDevBadge(appState.getState());
  appState.subscribe((state) => renderDevBadge(state));
  bindGlobalShortcuts(viewer);

  // Referencia útil para inspección en DevTools
  window.__CLAUSTRO_APP__ = {
    data: CLAUSTRO_DATA,
    state: appState,
    navigation,
    viewer,
  };
}

init();
