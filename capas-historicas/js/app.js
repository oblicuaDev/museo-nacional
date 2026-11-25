// Lógica de interacción del prototipo "Capas históricas del Claustro San Agustín".
// HTML + CSS + JavaScript puro, sin frameworks ni librerías externas.

(function () {
  "use strict";

  const state = {
    layerIndex: 0,
    galleryIndex: 0,
    activeHotspotId: null,
  };

  // ---- Referencias al DOM ----
  const viewerBg = document.getElementById("viewer-bg");
  const viewerIntro = document.getElementById("viewer-intro");
  const viewerPlaceholder = document.getElementById("viewer-placeholder");
  const hotspotLayer = document.getElementById("hotspot-layer");

  const layerName = document.getElementById("layer-name");
  const layerPeriod = document.getElementById("layer-period");
  const layerPips = document.getElementById("layer-pips");

  const btnPrevHeader = document.getElementById("btn-prev-layer");
  const btnNextHeader = document.getElementById("btn-next-layer");
  const btnPrevStage = document.getElementById("btn-prev-layer-stage");
  const btnNextStage = document.getElementById("btn-next-layer-stage");

  const detailPanel = document.getElementById("detail-panel");
  const detailBackdrop = document.getElementById("detail-backdrop");
  const detailEyebrow = document.getElementById("detail-eyebrow");
  const detailTitle = document.getElementById("detail-title");
  const detailText = document.getElementById("detail-text");
  const btnCloseDetail = document.getElementById("btn-close-detail");

  const galleryImg = document.getElementById("gallery-img");
  const galleryCaption = document.getElementById("gallery-caption");
  const galleryDots = document.getElementById("gallery-dots");
  const btnGalleryPrev = document.getElementById("btn-gallery-prev");
  const btnGalleryNext = document.getElementById("btn-gallery-next");

  function currentLayer() {
    return LAYERS[state.layerIndex];
  }

  function currentHotspot() {
    const layer = currentLayer();
    if (!layer || !state.activeHotspotId) return null;
    return layer.hotspots.find((h) => h.id === state.activeHotspotId) || null;
  }

  // ---- Render: capa activa ----
  function renderLayer() {
    const layer = currentLayer();

    layerName.textContent = layer.name;
    layerPeriod.textContent = layer.years ? `${layer.period} (${layer.years})` : layer.period;

    btnPrevHeader.disabled = state.layerIndex === 0;
    btnNextHeader.disabled = state.layerIndex === LAYERS.length - 1;
    btnPrevStage.disabled = btnPrevHeader.disabled;
    btnNextStage.disabled = btnNextHeader.disabled;

    const isPlaceholder = layer.status === "placeholder";
    viewerPlaceholder.hidden = !isPlaceholder;
    viewerBg.style.opacity = isPlaceholder ? "0" : "1";

    if (!isPlaceholder) {
      viewerBg.style.backgroundImage = `url("${layer.bg}")`;
      viewerIntro.textContent = layer.intro;
      viewerIntro.hidden = false;
    } else {
      viewerBg.style.backgroundImage = "";
      viewerIntro.hidden = true;
    }

    renderHotspots(layer);
    renderPips();
    closeDetail();
  }

  function renderHotspots(layer) {
    hotspotLayer.innerHTML = "";
    if (layer.status === "placeholder") return;

    layer.hotspots.forEach((hotspot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot";
      btn.dataset.color = hotspot.color;
      btn.style.left = hotspot.x + "%";
      btn.style.top = hotspot.y + "%";
      btn.title = hotspot.label;
      btn.setAttribute("aria-label", hotspot.label);
      btn.addEventListener("click", () => openDetail(hotspot.id));
      hotspotLayer.appendChild(btn);
    });
  }

  // Menú de épocas: una pestaña con nombre por capa, para ir directo a
  // cualquiera sin depender solo de las flechas.
  function renderPips() {
    layerPips.innerHTML = "";
    LAYERS.forEach((layer, index) => {
      const item = document.createElement("li");
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "era-tab";
      if (index === state.layerIndex) {
        tab.classList.add("is-current");
        tab.setAttribute("aria-current", "true");
      }
      tab.innerHTML = `
        <span class="era-tab__num">${index + 1}</span>
        <span class="era-tab__text">
          <span class="era-tab__name">${layer.period}</span>
          ${layer.years ? `<span class="era-tab__years">${layer.years}</span>` : ""}
        </span>
      `;
      tab.addEventListener("click", () => goToLayer(index));
      item.appendChild(tab);
      layerPips.appendChild(item);
    });
    const current = layerPips.querySelector(".is-current");
    if (current && current.scrollIntoView) {
      current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function goToLayer(index) {
    if (index < 0 || index >= LAYERS.length || index === state.layerIndex) return;
    state.layerIndex = index;
    renderLayer();
  }

  function prevLayer() {
    goToLayer(state.layerIndex - 1);
  }

  function nextLayer() {
    goToLayer(state.layerIndex + 1);
  }

  // ---- Panel de detalle ----
  function openDetail(hotspotId) {
    const layer = currentLayer();
    const hotspot = layer.hotspots.find((h) => h.id === hotspotId);
    if (!hotspot) return;

    state.activeHotspotId = hotspotId;
    state.galleryIndex = 0;

    detailEyebrow.textContent = `${layer.name} · ${layer.period}`;
    detailTitle.textContent = hotspot.label;
    detailText.textContent = hotspot.text;

    renderGallery(hotspot);
    markActiveHotspotDot(hotspotId);

    detailPanel.classList.add("is-open");
    detailBackdrop.classList.add("is-open");
  }

  function closeDetail() {
    state.activeHotspotId = null;
    detailPanel.classList.remove("is-open");
    detailBackdrop.classList.remove("is-open");
    markActiveHotspotDot(null);
  }

  function markActiveHotspotDot(hotspotId) {
    const dots = hotspotLayer.querySelectorAll(".hotspot");
    dots.forEach((dot) => dot.classList.remove("is-active"));
    if (!hotspotId) return;
    const layer = currentLayer();
    const idx = layer.hotspots.findIndex((h) => h.id === hotspotId);
    if (idx >= 0 && dots[idx]) dots[idx].classList.add("is-active");
  }

  // ---- Galería dentro del panel de detalle ----
  function renderGallery(hotspot) {
    const images = hotspot.images || [];
    const hasMultiple = images.length > 1;

    btnGalleryPrev.hidden = !hasMultiple;
    btnGalleryNext.hidden = !hasMultiple;

    renderGalleryFrame(images);
    renderGalleryDots(images);
  }

  function renderGalleryFrame(images) {
    const image = images[state.galleryIndex];
    if (!image) {
      galleryImg.removeAttribute("src");
      galleryImg.alt = "";
      galleryCaption.textContent = "";
      return;
    }
    galleryImg.src = image.src;
    galleryImg.alt = image.caption || "";
    galleryCaption.textContent = image.caption || "";
  }

  function renderGalleryDots(images) {
    galleryDots.innerHTML = "";
    if (images.length <= 1) return;
    images.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "gallery__dot";
      if (index === state.galleryIndex) dot.classList.add("is-current");
      dot.setAttribute("aria-label", `Ver imagen ${index + 1}`);
      dot.addEventListener("click", () => {
        state.galleryIndex = index;
        const hotspot = currentHotspot();
        if (hotspot) renderGallery(hotspot);
      });
      galleryDots.appendChild(dot);
    });
  }

  function galleryStep(delta) {
    const hotspot = currentHotspot();
    if (!hotspot || !hotspot.images || hotspot.images.length <= 1) return;
    const total = hotspot.images.length;
    state.galleryIndex = (state.galleryIndex + delta + total) % total;
    renderGallery(hotspot);
  }

  // ---- Eventos ----
  btnPrevHeader.addEventListener("click", prevLayer);
  btnNextHeader.addEventListener("click", nextLayer);
  btnPrevStage.addEventListener("click", prevLayer);
  btnNextStage.addEventListener("click", nextLayer);

  btnCloseDetail.addEventListener("click", closeDetail);
  detailBackdrop.addEventListener("click", closeDetail);

  btnGalleryPrev.addEventListener("click", () => galleryStep(-1));
  btnGalleryNext.addEventListener("click", () => galleryStep(1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetail();
    } else if (!detailPanel.classList.contains("is-open")) {
      if (event.key === "ArrowLeft") prevLayer();
      if (event.key === "ArrowRight") nextLayer();
    } else {
      if (event.key === "ArrowLeft") galleryStep(-1);
      if (event.key === "ArrowRight") galleryStep(1);
    }
  });

  // ---- Inicio ----
  renderLayer();
})();
