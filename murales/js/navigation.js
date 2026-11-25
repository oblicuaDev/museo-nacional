import {
  applyImageWithFallback,
  generateFloorPlanMock,
} from './utils/mockGenerator.js';

/**
 * Módulo de navegación espacial:
 * - Cabecera flotante (título, fecha opcional, selector Piso 1/Piso 2,
 *   indicador de ubicación y botones Muro anterior / Muro siguiente).
 * - Pestaña lateral derecha y panel desplegable "Conozca otros murales del claustro"
 *   con plano interactivo, pines clicables y alternador interno Piso 1 / Piso 2
 *   sin cerrar el panel.
 */

export function createNavigation(store) {
  const dom = {
    eyebrow: document.getElementById('mural-eyebrow'),
    title: document.getElementById('mural-title'),
    date: document.getElementById('mural-date'),
    summary: document.getElementById('mural-summary'),
    locationIndicator: document.getElementById('location-indicator'),
    floorSwitcher: document.getElementById('floor-switcher'),
    btnPrevMural: document.getElementById('btn-prev-mural'),
    btnNextMural: document.getElementById('btn-next-mural'),
    btnTogglePlan: document.getElementById('btn-toggle-plan'),
    btnClosePlan: document.getElementById('btn-close-plan'),
    planBackdrop: document.getElementById('plan-backdrop'),
    planDrawer: document.getElementById('plan-drawer'),
    btnPlanPrevFloor: document.getElementById('btn-plan-prev-floor'),
    btnPlanNextFloor: document.getElementById('btn-plan-next-floor'),
    planFloorPills: document.getElementById('plan-floor-pills'),
    planFloorDesc: document.getElementById('plan-floor-desc'),
    planStage: document.getElementById('plan-stage'),
    planLegendHeading: document.getElementById('plan-legend-heading'),
    planLegend: document.getElementById('plan-legend'),
  };

  let lastRenderedPlanFloorId = null;

  function renderHeader() {
    const floor = store.getActiveFloor();
    const mural = store.getActiveMural();
    const position = store.getActiveMuralPosition();
    const adjacent = store.getAdjacentMurals();

    dom.eyebrow.textContent = `Narrativas digitales / mural ${mural.shortTitle}`;
    dom.title.textContent = mural.title;

    if (mural.date) {
      dom.date.textContent = mural.date;
      dom.date.hidden = false;
    } else {
      dom.date.textContent = '';
      dom.date.hidden = true;
    }

    dom.locationIndicator.textContent = `${floor.label} > Muro ${position.number} de ${position.total}`;
    dom.summary.textContent = mural.summary || '';
    dom.summary.hidden = !mural.summary;

    dom.btnPrevMural.disabled = !adjacent.prev;
    dom.btnNextMural.disabled = !adjacent.next;

    // Selector de piso en cabecera
    dom.floorSwitcher.innerHTML = '';
    for (const item of store.getFloors()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--glass btn--sm';
      btn.textContent = item.label;
      btn.setAttribute('aria-pressed', String(item.id === floor.id));
      btn.addEventListener('click', () => store.setFloor(item.id));
      dom.floorSwitcher.appendChild(btn);
    }
  }

  function highlightPin(muralId, isHighlighted) {
    const pin = dom.planStage.querySelector(`[data-mural-id="${muralId}"]`);
    if (pin) {
      pin.classList.toggle('is-highlighted', isHighlighted);
    }
  }

  function renderPlanDrawerContent() {
    const planFloor = store.getPlanFloor();
    const activeMural = store.getActiveMural();
    const floors = store.getFloors();

    // Botones internos Piso 1 / Piso 2 dentro del panel sin cerrarlo
    dom.planFloorPills.innerHTML = '';
    for (const item of floors) {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'btn btn--surface btn--sm';
      pill.textContent = item.label;
      pill.setAttribute('aria-pressed', String(item.id === planFloor.id));
      pill.addEventListener('click', () => store.setPlanFloor(item.id));
      dom.planFloorPills.appendChild(pill);
    }

    const disableArrows = floors.length <= 1;
    dom.btnPlanPrevFloor.disabled = disableArrows;
    dom.btnPlanNextFloor.disabled = disableArrows;
    dom.planFloorDesc.textContent = planFloor.subtitle || '';
    dom.planLegendHeading.textContent = `Murales en ${planFloor.label} (${planFloor.murals.length})`;

    // Reconstruir imagen del plano solo si cambió el piso mostrado en el panel
    if (lastRenderedPlanFloorId !== planFloor.id) {
      dom.planStage.innerHTML = '';

      const planImg = document.createElement('img');
      planImg.className = 'plan-stage__image';
      planImg.alt = planFloor.plan.alt || `Plano de ${planFloor.label}`;
      planImg.draggable = false;

      applyImageWithFallback(
        planImg,
        planFloor.plan.src,
        () => generateFloorPlanMock(planFloor),
        `plano-${planFloor.id}`,
      );

      dom.planStage.appendChild(planImg);

      // Pines interactivos sobre el plano en coordenadas porcentuales (x%, y%)
      planFloor.murals.forEach((mural, index) => {
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'plan-pin';
        pin.dataset.muralId = mural.id;
        pin.style.left = `${mural.planPin.x}%`;
        pin.style.top = `${mural.planPin.y}%`;
        pin.setAttribute(
          'aria-label',
          `Ir a ${mural.title} (${planFloor.label}, muro ${index + 1})`,
        );

        const num = document.createElement('span');
        num.textContent = String(index + 1);

        const tooltip = document.createElement('span');
        tooltip.className = 'plan-pin__tooltip';
        tooltip.textContent = mural.shortTitle;

        pin.append(num, tooltip);
        pin.addEventListener('click', () => {
          store.setMural(mural.id);
          store.setPlanOpen(false);
        });

        dom.planStage.appendChild(pin);
      });

      lastRenderedPlanFloorId = planFloor.id;
    }

    // Actualizar estado activo de los pines
    dom.planStage.querySelectorAll('.plan-pin').forEach((pin) => {
      const isCurrent = pin.dataset.muralId === activeMural.id;
      pin.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    });

    // Lista accesible complementaria debajo del plano
    dom.planLegend.innerHTML = '';
    planFloor.murals.forEach((mural, index) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plan-legend__btn';
      btn.setAttribute('aria-current', mural.id === activeMural.id ? 'true' : 'false');

      const main = document.createElement('span');
      main.className = 'plan-legend__main';

      const idx = document.createElement('span');
      idx.className = 'plan-legend__index';
      idx.textContent = String(index + 1);

      const textWrap = document.createElement('span');
      const title = document.createElement('span');
      title.className = 'plan-legend__title';
      title.textContent = mural.title;

      const meta = document.createElement('span');
      meta.className = 'plan-legend__meta';
      const metaParts = [];
      if (mural.date) metaParts.push(mural.date);
      metaParts.push(`${mural.fragments.length} frag.`);
      metaParts.push(`${mural.hotspots.length} puntos`);
      meta.textContent = metaParts.join(' · ');

      textWrap.append(title, meta);
      main.append(idx, textWrap);

      const badge = document.createElement('span');
      badge.className = 'plan-legend__badge';
      const isReal = mural.fragments.some((frag) => Boolean(frag.src));
      badge.textContent = isReal ? 'Foto real' : `${mural.layout.mode} SVG`;

      btn.append(main, badge);

      btn.addEventListener('mouseenter', () => highlightPin(mural.id, true));
      btn.addEventListener('mouseleave', () => highlightPin(mural.id, false));
      btn.addEventListener('focus', () => highlightPin(mural.id, true));
      btn.addEventListener('blur', () => highlightPin(mural.id, false));
      btn.addEventListener('click', () => {
        store.setMural(mural.id);
        store.setPlanOpen(false);
      });

      li.appendChild(btn);
      dom.planLegend.appendChild(li);
    });
  }

  function renderDrawerVisibility(state, prevState) {
    const isOpen = state.isPlanOpen;
    dom.planDrawer.hidden = !isOpen;
    dom.planBackdrop.hidden = !isOpen;
    dom.btnTogglePlan.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      renderPlanDrawerContent();
      if (!prevState || !prevState.isPlanOpen) {
        dom.btnClosePlan.focus();
      }
    } else if (prevState && prevState.isPlanOpen) {
      dom.btnTogglePlan.focus();
    }
  }

  function bindEvents() {
    dom.btnPrevMural.addEventListener('click', () => store.goToPrevMural());
    dom.btnNextMural.addEventListener('click', () => store.goToNextMural());

    dom.btnTogglePlan.addEventListener('click', () => store.togglePlanOpen());
    dom.btnClosePlan.addEventListener('click', () => store.setPlanOpen(false));
    dom.planBackdrop.addEventListener('click', () => store.setPlanOpen(false));

    // Alternar planos entre Piso 1 y Piso 2 directamente dentro del panel
    dom.btnPlanPrevFloor.addEventListener('click', () => store.cyclePlanFloor(-1));
    dom.btnPlanNextFloor.addEventListener('click', () => store.cyclePlanFloor(1));

    // Ayuda adicional en modo dev: clic sobre el plano imprime planPin { x, y }
    dom.planStage.addEventListener('click', (event) => {
      if (!store.getState().isDevMode) return;
      if (event.target.closest('.plan-pin')) return;

      const rect = dom.planStage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
      const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));
      const planFloor = store.getPlanFloor();

      console.info(
        `[Claustro Dev] Plano ${planFloor.label} → planPin: { x: ${x}, y: ${y} }`,
      );
    });
  }

  function render(state, prevState) {
    renderHeader();
    renderDrawerVisibility(state, prevState);
  }

  bindEvents();
  render(store.getState(), null);

  const unsubscribe = store.subscribe((nextState, prevState) => {
    render(nextState, prevState);
  });

  return {
    destroy() {
      unsubscribe();
    },
  };
}
