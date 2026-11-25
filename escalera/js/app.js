// Lógica de interacción del prototipo "Historias de la escalera del Claustro
// San Agustín". HTML + CSS + JavaScript puro, sin frameworks ni librerías.
//
// Una sola pantalla, como en el wireframe del cliente: la escena de la
// escalera queda siempre a la izquierda y el panel derecho alterna entre la
// grilla de épocas y el detalle de una época. Elegir una época solo cambia la
// capa de video detrás (con fundido) y el contenido del panel.

(function () {
  "use strict";

  const state = {
    menuIndex: 0, // tarjeta resaltada en la grilla
    stageIndex: null, // época activa (null = escalera base, vista grilla)
    nightFilter: false,
    activeLayer: null, // <video> de la historia visible
  };

  // Duración del fundido entre capas (debe coincidir con .stage__layer en CSS).
  const LAYER_FADE_MS = 600;

  // ---- Referencias al DOM ----
  const menuGrid = document.getElementById("menu-grid");
  const panelGrid = document.getElementById("panel-grid");
  const panelDetail = document.getElementById("panel-detail");
  const btnShowGrid = document.getElementById("btn-show-grid");
  const btnSelectorPrev = document.getElementById("btn-selector-prev");
  const btnSelectorNext = document.getElementById("btn-selector-next");

  const stage = document.getElementById("stage");
  const stageLayers = document.getElementById("stage-layers");
  const stageWarning = document.getElementById("stage-warning");
  const sceneToggles = document.getElementById("scene-toggles");

  const infoImg = document.getElementById("info-img");
  const infoDoc = document.getElementById("info-doc");
  const infoTitle = document.getElementById("info-title");
  const infoText = document.getElementById("info-text");
  const stageIndicator = document.getElementById("stage-indicator");

  const btnStagePrev = document.getElementById("btn-stage-prev");
  const btnStageNext = document.getElementById("btn-stage-next");
  const btnToggleNight = document.getElementById("btn-toggle-night");
  const btnView360 = document.getElementById("btn-view-360");

  const view360 = document.getElementById("view-360");
  const view360Img = document.getElementById("view-360-img");
  const btnClose360 = document.getElementById("btn-close-360");

  // ---- Panel: grilla de épocas ----
  function renderSelector() {
    menuGrid.innerHTML = "";
    SCENARIOS.forEach((scenario, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "menu-card";
      if (index === state.menuIndex) card.classList.add("is-highlighted");
      card.setAttribute("aria-label", `Conocer ${scenario.name}`);
      card.innerHTML = `
        <img class="menu-card__thumb" src="${scenario.thumb}" alt="" />
        <span class="menu-card__label">${scenario.name}</span>
      `;
      card.addEventListener("click", () => {
        state.menuIndex = index;
        activarEscenario(index);
      });
      menuGrid.appendChild(card);
    });
  }

  function selectorStep(delta) {
    const total = SCENARIOS.length;
    state.menuIndex = (state.menuIndex + delta + total) % total;
    renderSelector();
  }

  // ---- Capas de video (una por historia) ----
  // Los cuatro videos tienen el mismo encuadre fijo y la misma duración, así
  // que funcionan como capas intercambiables: al cambiar de historia la nueva
  // capa arranca en el mismo instante que la anterior y se hace un fundido,
  // sin que la escalera "salte".
  const layers = SCENARIOS.map((scenario) => {
    const video = document.createElement("video");
    video.className = "stage__layer";
    video.src = scenario.video;
    video.poster = scenario.poster;
    video.muted = true; // requisito de los navegadores para autoreproducir
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-label", `Recreación: ${scenario.name}`);
    stageLayers.appendChild(video);
    return video;
  });

  function playSafe(video) {
    const p = video.play();
    if (p && p.catch) p.catch((err) => console.warn("No se pudo reproducir el video:", err));
  }

  function showLayer(index) {
    const next = layers[index];
    const prev = state.activeLayer;
    if (next === prev) {
      if (next.paused) playSafe(next);
      return;
    }

    if (prev && prev.readyState >= 1 && next.readyState >= 1) {
      next.currentTime = prev.currentTime % (next.duration || Infinity);
    } else if (!prev) {
      next.currentTime = 0;
    }

    playSafe(next);
    next.classList.add("is-active");

    if (prev) fadeOutLayer(prev);
    state.activeLayer = next;
  }

  function fadeOutLayer(video) {
    video.classList.remove("is-active");
    setTimeout(() => {
      if (video !== state.activeLayer) video.pause();
    }, LAYER_FADE_MS);
  }

  function hideLayers() {
    if (state.activeLayer) fadeOutLayer(state.activeLayer);
    state.activeLayer = null;
  }

  // ---- Panel: detalle de la época activa ----
  function renderDetail() {
    const scenario = SCENARIOS[state.stageIndex];

    showLayer(state.stageIndex);

    infoImg.src = scenario.thumb;
    infoImg.alt = scenario.document ? scenario.document.title : scenario.name;
    infoTitle.textContent = scenario.name;
    infoText.textContent = scenario.text;
    infoDoc.textContent = scenario.document
      ? `${scenario.document.title} (${scenario.document.year})`
      : "Relato oral";
    stageIndicator.textContent = `${state.stageIndex + 1} / ${SCENARIOS.length}`;

    btnView360.hidden = !scenario.has360;

    state.nightFilter = scenario.nightFilterDefault;
    applyNightFilter();
  }

  function stageStep(delta) {
    const total = SCENARIOS.length;
    state.stageIndex = (state.stageIndex + delta + total) % total;
    state.menuIndex = state.stageIndex;
    renderDetail();
  }

  function activarEscenario(index) {
    state.stageIndex = index;
    panelGrid.hidden = true;
    panelDetail.hidden = false;
    sceneToggles.hidden = false;
    stageWarning.hidden = false;
    renderDetail();
  }

  // Vuelve a la grilla: la escena se queda, solo se funde a la escalera base.
  function volverAGrilla() {
    if (state.stageIndex === null) return;
    state.stageIndex = null;
    hideLayers();
    state.nightFilter = false;
    applyNightFilter();
    panelDetail.hidden = true;
    panelGrid.hidden = false;
    sceneToggles.hidden = true;
    stageWarning.hidden = true;
    renderSelector();
  }

  // ---- Filtro nocturno ----
  function applyNightFilter() {
    stage.classList.toggle("is-night", state.nightFilter);
    btnToggleNight.textContent = `Filtro nocturno: ${state.nightFilter ? "encendido" : "apagado"}`;
    btnToggleNight.classList.toggle("is-on", state.nightFilter);
  }

  function toggleNightFilter() {
    state.nightFilter = !state.nightFilter;
    applyNightFilter();
  }

  // ---- Vista 360 (prototipo estático) ----
  function openView360() {
    if (state.stageIndex === null) return;
    const scenario = SCENARIOS[state.stageIndex];
    if (!scenario.has360) return;
    view360Img.src = scenario.image360;
    view360.hidden = false;
  }

  function closeView360() {
    view360.hidden = true;
  }

  // ---- Eventos ----
  btnSelectorPrev.addEventListener("click", () => selectorStep(-1));
  btnSelectorNext.addEventListener("click", () => selectorStep(1));
  btnShowGrid.addEventListener("click", volverAGrilla);

  btnStagePrev.addEventListener("click", () => stageStep(-1));
  btnStageNext.addEventListener("click", () => stageStep(1));

  btnToggleNight.addEventListener("click", toggleNightFilter);
  btnView360.addEventListener("click", openView360);
  btnClose360.addEventListener("click", closeView360);

  document.addEventListener("keydown", (event) => {
    if (!view360.hidden) {
      if (event.key === "Escape") closeView360();
      return;
    }
    if (state.stageIndex !== null) {
      if (event.key === "Escape") volverAGrilla();
      else if (event.key === "ArrowLeft") stageStep(-1);
      else if (event.key === "ArrowRight") stageStep(1);
    } else {
      if (event.key === "ArrowLeft") selectorStep(-1);
      if (event.key === "ArrowRight") selectorStep(1);
      if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
        activarEscenario(state.menuIndex);
      }
    }
  });

  // ---- Inicio ----
  renderSelector();
})();
