import { CLAUSTRO_DATA } from './data/murales.js';

/**
 * Estado central reactivo (patrón pub/sub ligero) del prototipo.
 * Centraliza piso activo, muro activo, piso mostrado en el panel de plano,
 * hotspot seleccionado, visibilidad del panel de plano y modo desarrollo.
 */

function detectInitialDevMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const flag = params.get('dev');
  return flag === '1' || flag === 'true';
}

function findInitialIds() {
  const { config, floors } = CLAUSTRO_DATA;
  const initialFloor =
    floors.find((floor) => floor.id === config.initialFloorId) || floors[0];
  const initialMural =
    initialFloor.murals.find((mural) => mural.id === config.initialMuralId) ||
    initialFloor.murals[0];

  return {
    activeFloorId: initialFloor.id,
    activeMuralId: initialMural.id,
    planFloorId: initialFloor.id,
  };
}

class AppStore {
  constructor(data) {
    this._data = data;
    this._listeners = new Set();

    const initial = findInitialIds();
    this._state = {
      activeFloorId: initial.activeFloorId,
      activeMuralId: initial.activeMuralId,
      planFloorId: initial.planFloorId,
      activeHotspotId: null,
      isPlanOpen: false,
      isDevMode: detectInitialDevMode(),
    };
  }

  /* ------------------------------------------------------------------------
   * Lectura de estado y selectores derivados
   * ------------------------------------------------------------------------ */

  getState() {
    return { ...this._state };
  }

  getConfig() {
    return this._data.config;
  }

  getFloors() {
    return this._data.floors;
  }

  getFloorById(floorId) {
    return this._data.floors.find((floor) => floor.id === floorId) || null;
  }

  getActiveFloor() {
    return this.getFloorById(this._state.activeFloorId) || this._data.floors[0];
  }

  getPlanFloor() {
    return this.getFloorById(this._state.planFloorId) || this.getActiveFloor();
  }

  findMuralLocation(muralId) {
    for (const floor of this._data.floors) {
      const index = floor.murals.findIndex((mural) => mural.id === muralId);
      if (index !== -1) {
        return { floor, mural: floor.murals[index], index };
      }
    }
    return null;
  }

  getActiveMural() {
    const floor = this.getActiveFloor();
    return (
      floor.murals.find((mural) => mural.id === this._state.activeMuralId) ||
      floor.murals[0]
    );
  }

  getActiveMuralPosition() {
    const floor = this.getActiveFloor();
    const index = Math.max(
      0,
      floor.murals.findIndex((mural) => mural.id === this._state.activeMuralId),
    );
    return {
      index,
      number: index + 1,
      total: floor.murals.length,
    };
  }

  getAdjacentMurals() {
    const floor = this.getActiveFloor();
    const { index } = this.getActiveMuralPosition();
    return {
      prev: index > 0 ? floor.murals[index - 1] : null,
      next: index < floor.murals.length - 1 ? floor.murals[index + 1] : null,
    };
  }

  getActiveHotspot() {
    if (!this._state.activeHotspotId) return null;
    const mural = this.getActiveMural();
    return (
      mural.hotspots.find((hs) => hs.id === this._state.activeHotspotId) || null
    );
  }

  /* ------------------------------------------------------------------------
   * Suscripción
   * ------------------------------------------------------------------------ */

  subscribe(listener) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  _update(partial, actionName) {
    const prevState = this._state;
    const nextState = { ...prevState, ...partial };

    const changed = Object.keys(nextState).some(
      (key) => nextState[key] !== prevState[key],
    );
    if (!changed) return;

    this._state = nextState;
    for (const listener of this._listeners) {
      listener(this.getState(), prevState, actionName);
    }
  }

  /* ------------------------------------------------------------------------
   * Acciones
   * ------------------------------------------------------------------------ */

  setFloor(floorId, muralId = null) {
    const floor = this.getFloorById(floorId);
    if (!floor || floor.murals.length === 0) return;

    const targetMural =
      (muralId && floor.murals.find((mural) => mural.id === muralId)) ||
      floor.murals[0];

    this._update(
      {
        activeFloorId: floor.id,
        activeMuralId: targetMural.id,
        planFloorId: floor.id,
        activeHotspotId: null,
      },
      'setFloor',
    );
  }

  setMural(muralId) {
    const location = this.findMuralLocation(muralId);
    if (!location) return;

    this._update(
      {
        activeFloorId: location.floor.id,
        activeMuralId: location.mural.id,
        planFloorId: location.floor.id,
        activeHotspotId: null,
      },
      'setMural',
    );
  }

  goToNextMural() {
    const { next } = this.getAdjacentMurals();
    if (next) this.setMural(next.id);
  }

  goToPrevMural() {
    const { prev } = this.getAdjacentMurals();
    if (prev) this.setMural(prev.id);
  }

  setPlanOpen(isOpen) {
    const nextOpen = Boolean(isOpen);
    const partial = { isPlanOpen: nextOpen };

    // Al abrir el panel, sincronizar el plano mostrado con el piso activo
    if (nextOpen) {
      partial.planFloorId = this._state.activeFloorId;
    }

    this._update(partial, 'setPlanOpen');
  }

  togglePlanOpen() {
    this.setPlanOpen(!this._state.isPlanOpen);
  }

  /**
   * Cambia el piso visualizado dentro del panel desplegable del plano
   * sin cerrarlo ni cambiar aún el mural activo.
   */
  setPlanFloor(floorId) {
    const floor = this.getFloorById(floorId);
    if (!floor) return;
    this._update({ planFloorId: floor.id }, 'setPlanFloor');
  }

  cyclePlanFloor(direction = 1) {
    const floors = this.getFloors();
    if (floors.length <= 1) return;

    const currentIndex = floors.findIndex(
      (floor) => floor.id === this._state.planFloorId,
    );
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + floors.length) % floors.length;

    this.setPlanFloor(floors[nextIndex].id);
  }

  setActiveHotspot(hotspotId) {
    const mural = this.getActiveMural();
    const exists = mural.hotspots.some((hs) => hs.id === hotspotId);
    if (!exists) return;

    this._update(
      {
        activeHotspotId: hotspotId,
        isPlanOpen: false,
      },
      'setActiveHotspot',
    );
  }

  clearActiveHotspot() {
    if (!this._state.activeHotspotId) return;
    this._update({ activeHotspotId: null }, 'clearActiveHotspot');
  }

  toggleDevMode(forceValue) {
    const nextValue =
      typeof forceValue === 'boolean' ? forceValue : !this._state.isDevMode;
    this._update({ isDevMode: nextValue }, 'toggleDevMode');
  }
}

export const appState = new AppStore(CLAUSTRO_DATA);
