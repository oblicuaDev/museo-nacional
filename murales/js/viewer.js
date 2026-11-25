import {
  applyImageWithFallback,
  generateFragmentMock,
} from './utils/mockGenerator.js';

/**
 * Visor continuo de fragmentos e interacción narrativa (Fases 2 y 3):
 * - Ensambla los fragmentos del mural sin espacios en tira horizontal (`strip`)
 *   o cuadrícula (`grid`), con soporte de imagen real y fallback SVG automático.
 * - Soporta arrastre (pan) con mouse/touch, pinch-to-zoom táctil, rueda del mouse,
 *   botones de zoom (+/- y restablecer vista) y desplazamiento por teclado (flechas).
 * - Renderiza hotspots circulares concéntricos en porcentajes (x%, y%) con tamaño
 *   constante independiente del zoom, spotlight/imagen oscurecida (`detailSrc`),
 *   enfoque suave, panel narrativo con cierre (X / Escape) y modo desarrollo
 *   para capturar coordenadas (x%, y%) al hacer clic.
 */

const ZOOM_STEP = 1.25;
const KEYBOARD_PAN_STEP = 90;
const DEV_CLICK_MAX_DRAG_PX = 6;

export function createViewer(store) {
  const dom = {
    viewport: document.getElementById('viewer-viewport'),
    stage: document.getElementById('viewer-stage'),
    canvas: document.getElementById('mural-canvas'),
    fragments: document.getElementById('mural-fragments'),
    spotlight: document.getElementById('mural-spotlight'),
    hotspots: document.getElementById('mural-hotspots'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    zoomReadout: document.getElementById('zoom-readout'),
    devBadge: document.getElementById('dev-badge'),
    narrativePanel: document.getElementById('narrative-panel'),
    narrativeSubtitle: document.getElementById('narrative-subtitle'),
    narrativeTitle: document.getElementById('narrative-title'),
    narrativeBody: document.getElementById('narrative-body'),
    narrativeCounter: document.getElementById('narrative-counter'),
    narrativeFooter: document.getElementById('narrative-footer'),
    btnCloseNarrative: document.getElementById('btn-close-narrative'),
    btnPrevHotspot: document.getElementById('btn-prev-hotspot'),
    btnNextHotspot: document.getElementById('btn-next-hotspot'),
  };

  // Estado interno de cámara/transformación
  const camera = {
    contentWidth: 1920,
    contentHeight: 1080,
    fitScale: 1,
    minScale: 0.6,
    maxScale: 4,
    scale: 1,
    tx: 0,
    ty: 0,
    isSingleFullBleed: true,
  };

  // Estado de punteros activos (arrastre y pinch-to-zoom)
  const activePointers = new Map();
  let dragStart = null;
  let pinchStart = null;
  let currentMuralId = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getViewportSize() {
    const rect = dom.viewport.getBoundingClientRect();
    return {
      width: rect.width || window.innerWidth,
      height: rect.height || window.innerHeight,
    };
  }

  /**
   * Mantiene el mural dentro de márgenes razonables para que nunca se pierda
   * fuera del área visible durante el paneo.
   */
  function clampTranslation(tx, ty, scale) {
    const { width: vw, height: vh } = getViewportSize();
    const scaledW = camera.contentWidth * scale;
    const scaledH = camera.contentHeight * scale;

    let clampedX = tx;
    let clampedY = ty;

    if (scaledW <= vw) {
      clampedX = (vw - scaledW) / 2;
    } else {
      const marginX = Math.min(80, vw * 0.12);
      clampedX = clamp(tx, vw - scaledW - marginX, marginX);
    }

    if (scaledH <= vh) {
      clampedY = (vh - scaledH) / 2;
    } else {
      const marginY = Math.min(80, vh * 0.12);
      clampedY = clamp(ty, vh - scaledH - marginY, marginY);
    }

    return { tx: clampedX, ty: clampedY };
  }

  function updateTransform({ animate = false } = {}) {
    dom.stage.classList.toggle('is-animating', animate);
    dom.stage.style.transform = `translate3d(${camera.tx.toFixed(2)}px, ${camera.ty.toFixed(2)}px, 0) scale(${camera.scale.toFixed(5)})`;

    // Escala inversa para que los hotspots mantengan un tamaño visual constante al hacer zoom
    const invScale = 1 / Math.max(camera.scale, 0.05);
    dom.hotspots.style.setProperty('--inv-scale', invScale.toFixed(5));

    const relativePercent = Math.round((camera.scale / camera.fitScale) * 100);
    dom.zoomReadout.textContent = `${relativePercent}%`;
    dom.btnZoomIn.disabled = camera.scale >= camera.maxScale - 0.001;
    dom.btnZoomOut.disabled = camera.scale <= camera.minScale + 0.001;
  }

  function computeFitMetrics() {
    const { width: vw, height: vh } = getViewportSize();
    const config = store.getConfig();

    const padX = camera.isSingleFullBleed ? 0 : Math.min(48, vw * 0.05);
    const padTop = camera.isSingleFullBleed ? 0 : Math.min(130, vh * 0.18);
    const padBottom = camera.isSingleFullBleed ? 0 : Math.min(72, vh * 0.1);

    const availW = Math.max(200, vw - padX * 2);
    const availH = Math.max(200, vh - padTop - padBottom);

    camera.fitScale = Math.min(
      availW / camera.contentWidth,
      availH / camera.contentHeight,
    );
    camera.minScale = camera.fitScale * (config.minZoom || 0.6);
    camera.maxScale = camera.fitScale * (config.maxZoom || 4.0);
  }

  function resetView({ animate = true } = {}) {
    computeFitMetrics();
    const { width: vw, height: vh } = getViewportSize();
    const scaledW = camera.contentWidth * camera.fitScale;
    const scaledH = camera.contentHeight * camera.fitScale;

    camera.scale = camera.fitScale;
    camera.tx = (vw - scaledW) / 2;
    camera.ty = (vh - scaledH) / 2;
    updateTransform({ animate });
  }

  function zoomToScale(nextScale, anchorX, anchorY, { animate = false } = {}) {
    const clampedScale = clamp(nextScale, camera.minScale, camera.maxScale);
    if (Math.abs(clampedScale - camera.scale) < 0.0001) return;

    const rect = dom.viewport.getBoundingClientRect();
    const px = typeof anchorX === 'number' ? anchorX - rect.left : rect.width / 2;
    const py = typeof anchorY === 'number' ? anchorY - rect.top : rect.height / 2;

    const worldX = (px - camera.tx) / camera.scale;
    const worldY = (py - camera.ty) / camera.scale;

    const rawTx = px - worldX * clampedScale;
    const rawTy = py - worldY * clampedScale;
    const clamped = clampTranslation(rawTx, rawTy, clampedScale);

    camera.scale = clampedScale;
    camera.tx = clamped.tx;
    camera.ty = clamped.ty;
    updateTransform({ animate });
  }

  function zoomBy(factor, anchorX, anchorY, options = {}) {
    zoomToScale(camera.scale * factor, anchorX, anchorY, options);
  }

  function panBy(dx, dy, { animate = false } = {}) {
    const clamped = clampTranslation(camera.tx + dx, camera.ty + dy, camera.scale);
    camera.tx = clamped.tx;
    camera.ty = clamped.ty;
    updateTransform({ animate });
  }

  /**
   * Enfoca y centra una coordenada porcentual (x%, y%) del mural con transición suave.
   */
  function focusPoint(xPercent, yPercent, zoomMultiplier = 1.3) {
    computeFitMetrics();
    const { width: vw, height: vh } = getViewportSize();
    const targetScale = clamp(
      camera.fitScale * zoomMultiplier,
      camera.minScale,
      camera.maxScale,
    );

    const worldX = (xPercent / 100) * camera.contentWidth;
    const worldY = (yPercent / 100) * camera.contentHeight;

    // Ligeramente desplazado en escritorio para no quedar detrás del panel narrativo
    const screenFocusX = vw > 860 ? vw * 0.54 : vw * 0.5;
    const screenFocusY = vh * 0.48;

    const rawTx = screenFocusX - worldX * targetScale;
    const rawTy = screenFocusY - worldY * targetScale;
    const clamped = clampTranslation(rawTx, rawTy, targetScale);

    camera.scale = targetScale;
    camera.tx = clamped.tx;
    camera.ty = clamped.ty;
    updateTransform({ animate: true });
  }

  function applyCanvasDimensions(columns, rows, fragWidth, fragHeight) {
    camera.contentWidth = columns * fragWidth;
    camera.contentHeight = rows * fragHeight;

    dom.canvas.style.width = `${camera.contentWidth}px`;
    dom.canvas.style.height = `${camera.contentHeight}px`;
    dom.fragments.style.width = `${camera.contentWidth}px`;
    dom.fragments.style.height = `${camera.contentHeight}px`;
    dom.fragments.style.gridTemplateColumns = `repeat(${columns}, ${fragWidth}px)`;
    dom.fragments.style.gridTemplateRows = `repeat(${rows}, ${fragHeight}px)`;
  }

  /* ------------------------------------------------------------------------
   * Hotspots, spotlight / imagen oscurecida (`detailSrc`) y panel narrativo
   * ------------------------------------------------------------------------ */

  function renderHotspots() {
    const mural = store.getActiveMural();
    const activeId = store.getState().activeHotspotId;

    dom.hotspots.innerHTML = '';
    dom.hotspots.classList.toggle('has-active', Boolean(activeId));

    for (const hs of mural.hotspots || []) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hotspot-marker';
      btn.dataset.hotspotId = hs.id;
      btn.style.left = `${hs.x}%`;
      btn.style.top = `${hs.y}%`;
      btn.setAttribute('aria-label', `${hs.title}${hs.subtitle ? ` — ${hs.subtitle}` : ''}`);
      btn.setAttribute('aria-pressed', String(hs.id === activeId));
      if (hs.id === activeId) {
        btn.classList.add('is-active');
      }

      const rings = document.createElement('span');
      rings.className = 'hotspot-marker__rings';
      rings.setAttribute('aria-hidden', 'true');

      const tooltip = document.createElement('span');
      tooltip.className = 'hotspot-marker__tooltip';
      tooltip.textContent = hs.title;

      btn.append(rings, tooltip);

      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const currentActive = store.getState().activeHotspotId;
        if (currentActive === hs.id) {
          closeActiveHotspot();
        } else {
          store.setActiveHotspot(hs.id);
        }
      });

      dom.hotspots.appendChild(btn);
    }
  }

  function applyRadialSpotlight(hotspot) {
    dom.spotlight.innerHTML = '';
    dom.spotlight.style.setProperty('--spot-x', `${hotspot.x}%`);
    dom.spotlight.style.setProperty('--spot-y', `${hotspot.y}%`);
    dom.spotlight.classList.add('is-radial', 'is-active');
  }

  function renderSpotlight(hotspot) {
    if (!hotspot) {
      dom.spotlight.classList.remove('is-active', 'is-radial');
      dom.spotlight.innerHTML = '';
      return;
    }

    const hasDetailSrc =
      typeof hotspot.detailSrc === 'string' && hotspot.detailSrc.trim().length > 0;

    if (hasDetailSrc) {
      dom.spotlight.classList.remove('is-radial');
      dom.spotlight.innerHTML = '';

      const detailImg = document.createElement('img');
      detailImg.className = 'mural-spotlight__detail';
      detailImg.alt = '';
      detailImg.draggable = false;

      detailImg.addEventListener(
        'error',
        () => {
          console.warn(
            `[Claustro] No se pudo cargar detalle "${hotspot.detailSrc}". Usando spotlight radial CSS.`,
          );
          applyRadialSpotlight(hotspot);
        },
        { once: true },
      );

      detailImg.src = hotspot.detailSrc;
      dom.spotlight.appendChild(detailImg);
      // Activar opacidad en el siguiente frame para transición suave
      requestAnimationFrame(() => {
        if (store.getState().activeHotspotId === hotspot.id) {
          dom.spotlight.classList.add('is-active');
        }
      });
    } else {
      applyRadialSpotlight(hotspot);
    }
  }

  function renderNarrativePanel(hotspot) {
    if (!hotspot) {
      dom.narrativePanel.hidden = true;
      return;
    }

    const mural = store.getActiveMural();
    const list = mural.hotspots || [];
    const idx = list.findIndex((item) => item.id === hotspot.id);

    dom.narrativeSubtitle.textContent = hotspot.subtitle || mural.shortTitle;
    dom.narrativeSubtitle.hidden = !dom.narrativeSubtitle.textContent;
    dom.narrativeTitle.textContent = hotspot.title;
    dom.narrativeBody.textContent = hotspot.body || '';

    if (list.length > 1 && idx !== -1) {
      dom.narrativeFooter.hidden = false;
      dom.narrativeCounter.textContent = `Punto ${idx + 1} de ${list.length}`;
      dom.btnPrevHotspot.disabled = idx <= 0;
      dom.btnNextHotspot.disabled = idx >= list.length - 1;
    } else {
      dom.narrativeFooter.hidden = true;
    }

    dom.narrativePanel.hidden = false;
  }

  function syncActiveHotspotUI({ focus = false } = {}) {
    const hotspot = store.getActiveHotspot();
    const activeId = hotspot ? hotspot.id : null;

    dom.hotspots.classList.toggle('has-active', Boolean(activeId));
    dom.hotspots.querySelectorAll('.hotspot-marker').forEach((btn) => {
      const isCurrent = btn.dataset.hotspotId === activeId;
      btn.classList.toggle('is-active', isCurrent);
      btn.setAttribute('aria-pressed', String(isCurrent));
    });

    renderSpotlight(hotspot);
    renderNarrativePanel(hotspot);

    if (hotspot && focus) {
      const zoomFactor =
        hotspot.focusZoom || store.getConfig().defaultFocusZoom || 1.3;
      focusPoint(hotspot.x, hotspot.y, zoomFactor);
    }
  }

  function closeActiveHotspot() {
    if (store.getState().activeHotspotId) {
      store.clearActiveHotspot();
    } else {
      resetView({ animate: true });
    }
  }

  function stepHotspot(direction) {
    const mural = store.getActiveMural();
    const list = mural.hotspots || [];
    const currentId = store.getState().activeHotspotId;
    const idx = list.findIndex((item) => item.id === currentId);
    if (idx === -1) return;

    const target = list[idx + direction];
    if (target) {
      store.setActiveHotspot(target.id);
    }
  }

  /* ------------------------------------------------------------------------
   * Modo ayuda de desarrollo: captura de coordenadas (x%, y%) al hacer clic
   * ------------------------------------------------------------------------ */

  function logDevCoordinates(clientX, clientY) {
    const canvasRect = dom.canvas.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0) return;

    const withinX = clientX >= canvasRect.left && clientX <= canvasRect.right;
    const withinY = clientY >= canvasRect.top && clientY <= canvasRect.bottom;
    if (!withinX || !withinY) return;

    const x = Number(
      clamp(((clientX - canvasRect.left) / canvasRect.width) * 100, 0, 100).toFixed(2),
    );
    const y = Number(
      clamp(((clientY - canvasRect.top) / canvasRect.height) * 100, 0, 100).toFixed(2),
    );

    const floor = store.getActiveFloor();
    const mural = store.getActiveMural();
    const columns = mural.layout?.columns || mural.fragments.length || 1;
    const rows = mural.layout?.rows || 1;
    const col = Math.min(columns - 1, Math.floor((x / 100) * columns));
    const row = Math.min(rows - 1, Math.floor((y / 100) * rows));
    const fragmentIndex = Math.min(
      mural.fragments.length - 1,
      row * columns + col,
    );
    const fragment = mural.fragments[fragmentIndex];

    const snippet = `{
  id: 'hs-${mural.id}-${(mural.hotspots?.length || 0) + 1}',
  code: '${(mural.hotspots?.length || 0) + 1}',
  x: ${x},
  y: ${y},
  focusZoom: 1.35,
  title: 'Nuevo punto de interés',
  subtitle: 'Fragmento ${fragmentIndex + 1} de ${mural.fragments.length}',
  body: 'Descripción editable...',
  detailSrc: null,
}`;

    console.info(
      `[Claustro Dev] ${floor.label} · ${mural.title} → x: ${x}%, y: ${y}% (Fragmento ${fragmentIndex + 1}/${mural.fragments.length}: ${fragment?.id || 'n/a'})`,
    );
    console.log(snippet);

    if (dom.devBadge) {
      dom.devBadge.textContent = `Modo Dev · x: ${x}%, y: ${y}% (Frag ${fragmentIndex + 1}/${mural.fragments.length}) — ver consola`;
    }
  }

  function syncDevModeUI() {
    const { isDevMode } = store.getState();
    dom.viewport.classList.toggle('is-dev-mode', isDevMode);
    if (isDevMode && dom.devBadge) {
      dom.devBadge.textContent =
        'Modo Dev · Haz clic en el mural para registrar coordenadas (x%, y%) en consola';
    }
  }

  /* ------------------------------------------------------------------------
   * Renderizado del mural (fragmentos + capa de hotspots)
   * ------------------------------------------------------------------------ */

  function renderMural() {
    const floor = store.getActiveFloor();
    const mural = store.getActiveMural();
    const { columns = mural.fragments.length, rows = 1 } = mural.layout || {};

    currentMuralId = mural.id;
    camera.isSingleFullBleed = mural.fragments.length === 1;

    const firstFragMock = mural.fragments[0]?.mock || { width: 800, height: 1000 };
    applyCanvasDimensions(columns, rows, firstFragMock.width, firstFragMock.height);

    dom.fragments.innerHTML = '';

    mural.fragments.forEach((fragment, index) => {
      const img = document.createElement('img');
      img.className = 'mural-fragment';
      img.alt = fragment.alt || `${mural.shortTitle} - Fragmento ${index + 1}`;
      img.draggable = false;
      img.dataset.fragmentIndex = String(index);

      if (index === 0) {
        img.addEventListener(
          'load',
          () => {
            if (currentMuralId !== mural.id) return;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              const nextW = columns * img.naturalWidth;
              const nextH = rows * img.naturalHeight;
              if (nextW !== camera.contentWidth || nextH !== camera.contentHeight) {
                applyCanvasDimensions(columns, rows, img.naturalWidth, img.naturalHeight);
                resetView({ animate: false });
              }
            }
          },
          { once: true },
        );
      }

      applyImageWithFallback(
        img,
        fragment.src,
        () =>
          generateFragmentMock({
            floor,
            mural,
            fragment,
            index,
            total: mural.fragments.length,
          }),
        fragment.id,
      );

      dom.fragments.appendChild(img);
    });

    renderHotspots();
    syncActiveHotspotUI({ focus: false });
    resetView({ animate: false });
  }

  /* ------------------------------------------------------------------------
   * Eventos de mouse, touch (Pointer Events), rueda y teclado
   * ------------------------------------------------------------------------ */

  function getPinchGeometry() {
    const [p1, p2] = Array.from(activePointers.values());
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    return {
      distance: Math.hypot(dx, dy) || 1,
      midX: (p1.clientX + p2.clientX) / 2,
      midY: (p1.clientY + p2.clientY) / 2,
    };
  }

  function handlePointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (event.target.closest('.hotspot-marker')) return;

    dom.viewport.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (activePointers.size === 1) {
      dragStart = {
        clientX: event.clientX,
        clientY: event.clientY,
        tx: camera.tx,
        ty: camera.ty,
        moved: false,
      };
      pinchStart = null;
      dom.viewport.classList.add('is-dragging');
    } else if (activePointers.size === 2) {
      dragStart = null;
      const geom = getPinchGeometry();
      pinchStart = {
        distance: geom.distance,
        scale: camera.scale,
      };
    }
  }

  function handlePointerMove(event) {
    if (!activePointers.has(event.pointerId)) return;

    activePointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (activePointers.size === 1 && dragStart) {
      const dx = event.clientX - dragStart.clientX;
      const dy = event.clientY - dragStart.clientY;
      if (Math.hypot(dx, dy) > DEV_CLICK_MAX_DRAG_PX) {
        dragStart.moved = true;
      }
      const clamped = clampTranslation(dragStart.tx + dx, dragStart.ty + dy, camera.scale);
      camera.tx = clamped.tx;
      camera.ty = clamped.ty;
      updateTransform({ animate: false });
    } else if (activePointers.size === 2 && pinchStart) {
      const geom = getPinchGeometry();
      const targetScale = pinchStart.scale * (geom.distance / pinchStart.distance);
      zoomToScale(targetScale, geom.midX, geom.midY, { animate: false });
    }
  }

  function handlePointerUpOrCancel(event) {
    const wasCleanClick =
      event.type === 'pointerup' &&
      activePointers.size === 1 &&
      dragStart &&
      !dragStart.moved;

    activePointers.delete(event.pointerId);

    if (activePointers.size === 0) {
      dragStart = null;
      pinchStart = null;
      dom.viewport.classList.remove('is-dragging');

      if (wasCleanClick && store.getState().isDevMode) {
        logDevCoordinates(event.clientX, event.clientY);
      }
    } else if (activePointers.size === 1) {
      const [remaining] = Array.from(activePointers.values());
      dragStart = {
        clientX: remaining.clientX,
        clientY: remaining.clientY,
        tx: camera.tx,
        ty: camera.ty,
        moved: true,
      };
      pinchStart = null;
    }
  }

  function handleWheel(event) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomBy(factor, event.clientX, event.clientY, { animate: false });
  }

  function handleDoubleClick(event) {
    if (event.target.closest('.hotspot-marker')) return;
    if (store.getState().isDevMode) return;

    const isNearFit = Math.abs(camera.scale - camera.fitScale) < camera.fitScale * 0.15;
    if (isNearFit) {
      zoomToScale(camera.fitScale * 2, event.clientX, event.clientY, { animate: true });
    } else {
      closeActiveHotspot();
    }
  }

  function handleKeyDown(event) {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (store.getState().isPlanOpen) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        panBy(KEYBOARD_PAN_STEP, 0, { animate: false });
        break;
      case 'ArrowRight':
        event.preventDefault();
        panBy(-KEYBOARD_PAN_STEP, 0, { animate: false });
        break;
      case 'ArrowUp':
        event.preventDefault();
        panBy(0, KEYBOARD_PAN_STEP, { animate: false });
        break;
      case 'ArrowDown':
        event.preventDefault();
        panBy(0, -KEYBOARD_PAN_STEP, { animate: false });
        break;
      case '+':
      case '=':
        event.preventDefault();
        zoomBy(ZOOM_STEP, null, null, { animate: true });
        break;
      case '-':
      case '_':
        event.preventDefault();
        zoomBy(1 / ZOOM_STEP, null, null, { animate: true });
        break;
      case '0':
        event.preventDefault();
        closeActiveHotspot();
        break;
      default:
        break;
    }
  }

  function bindEvents() {
    dom.viewport.addEventListener('pointerdown', handlePointerDown);
    dom.viewport.addEventListener('pointermove', handlePointerMove);
    dom.viewport.addEventListener('pointerup', handlePointerUpOrCancel);
    dom.viewport.addEventListener('pointercancel', handlePointerUpOrCancel);
    dom.viewport.addEventListener('wheel', handleWheel, { passive: false });
    dom.viewport.addEventListener('dblclick', handleDoubleClick);

    dom.btnZoomIn.addEventListener('click', () =>
      zoomBy(ZOOM_STEP, null, null, { animate: true }),
    );
    dom.btnZoomOut.addEventListener('click', () =>
      zoomBy(1 / ZOOM_STEP, null, null, { animate: true }),
    );
    dom.btnZoomReset.addEventListener('click', () => closeActiveHotspot());

    dom.btnCloseNarrative.addEventListener('click', () => closeActiveHotspot());
    dom.btnPrevHotspot.addEventListener('click', () => stepHotspot(-1));
    dom.btnNextHotspot.addEventListener('click', () => stepHotspot(1));

    window.addEventListener('keydown', handleKeyDown);
  }

  const resizeObserver = new ResizeObserver(() => {
    const prevFit = camera.fitScale;
    const relativeZoom = prevFit > 0 ? camera.scale / prevFit : 1;
    computeFitMetrics();

    if (Math.abs(relativeZoom - 1) < 0.03) {
      resetView({ animate: false });
    } else {
      camera.scale = clamp(camera.fitScale * relativeZoom, camera.minScale, camera.maxScale);
      const clamped = clampTranslation(camera.tx, camera.ty, camera.scale);
      camera.tx = clamped.tx;
      camera.ty = clamped.ty;
      updateTransform({ animate: false });
    }
  });
  resizeObserver.observe(dom.viewport);

  bindEvents();
  renderMural();
  syncDevModeUI();

  const unsubscribe = store.subscribe((nextState, prevState) => {
    if (nextState.activeMuralId !== prevState.activeMuralId) {
      renderMural();
      return;
    }

    if (nextState.activeHotspotId !== prevState.activeHotspotId) {
      const hasHotspot = Boolean(nextState.activeHotspotId);
      syncActiveHotspotUI({ focus: hasHotspot });
      if (!hasHotspot && prevState.activeHotspotId) {
        resetView({ animate: true });
      }
    }

    if (nextState.isDevMode !== prevState.isDevMode) {
      syncDevModeUI();
    }
  });

  return {
    renderMural,
    resetView,
    zoomBy,
    focusPoint,
    destroy() {
      unsubscribe();
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    },
  };
}
