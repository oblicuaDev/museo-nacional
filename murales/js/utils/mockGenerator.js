/**
 * Generador de placeholders SVG (data-URI) para fragmentos de mural y planos
 * esquemáticos del Claustro San Agustín.
 *
 * Cada fragmento usa un viewBox recortado sobre el espacio global del mural
 * (columns * width × rows * height) para garantizar que las líneas guía
 * horizontales, diagonales y curvas crucen con continuidad matemática exacta
 * a través de todas las uniones (tanto en modo tira como en cuadrícula).
 */

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toDataUri(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

/**
 * Construye el trazado de una onda continua que recorre todo el ancho del mural.
 */
function buildContinuousWavePath(totalW, centerY, amplitude, cycles = 2) {
  const steps = 48;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = (t * totalW).toFixed(1);
    const y = (centerY + Math.sin(t * Math.PI * 2 * cycles) * amplitude).toFixed(1);
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return points.join(' ');
}

/**
 * Genera un SVG data-URI para un fragmento individual conservando continuidad
 * visual con sus fragmentos vecinos.
 */
export function generateFragmentMock({ floor, mural, fragment, index, total }) {
  const columns = mural.layout?.columns || total;
  const rows = mural.layout?.rows || 1;
  const fragW = fragment.mock?.width || 800;
  const fragH = fragment.mock?.height || 1000;

  const col = index % columns;
  const row = Math.floor(index / columns);
  const offsetX = col * fragW;
  const offsetY = row * fragH;

  const totalW = columns * fragW;
  const totalH = rows * fragH;

  const isAltTile = (col + row) % 2 === 1;
  const tileBg = isAltTile ? '#e7ebf0' : '#eff2f5';
  const label =
    fragment.mock?.label ||
    `${floor.label} - ${mural.shortTitle} - Frag ${index + 1}/${total}`;
  const subLabel = `Col ${col + 1}/${columns} · Fila ${row + 1}/${rows} · ${fragW}×${fragH}px`;

  // Líneas guía globales en el espacio completo del mural (0..totalW, 0..totalH)
  const h20 = (totalH * 0.2).toFixed(1);
  const h50 = (totalH * 0.5).toFixed(1);
  const h80 = (totalH * 0.8).toFixed(1);
  const wavePath = buildContinuousWavePath(
    totalW,
    totalH * 0.5,
    Math.min(totalH * 0.16, 180),
    Math.max(1.5, columns * 0.5),
  );
  const archTopY = (totalH * 0.12).toFixed(1);
  const archBaseY = (totalH * 0.88).toFixed(1);
  const archMidX = (totalW * 0.5).toFixed(1);

  // Centro local del fragmento para su etiqueta y crucetas
  const cx = offsetX + fragW / 2;
  const cy = offsetY + fragH / 2;
  const boxW = Math.min(fragW * 0.78, 560);
  const boxH = 112;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${fragW}" height="${fragH}" viewBox="${offsetX} ${offsetY} ${fragW} ${fragH}" role="img" aria-label="${escapeXml(label)}">
  <!-- Fondo neutro diferenciado sutilmente por baldosa -->
  <rect x="${offsetX}" y="${offsetY}" width="${fragW}" height="${fragH}" fill="${tileBg}" />

  <!-- Retícula fina de referencia global (cada 100px) -->
  <defs>
    <pattern id="grid-${index}" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cfd6de" stroke-width="1" />
    </pattern>
  </defs>
  <rect x="${offsetX}" y="${offsetY}" width="${fragW}" height="${fragH}" fill="url(#grid-${index})" />

  <!-- Líneas guía continuas en coordenadas globales del mural completo -->
  <g fill="none">
    <!-- Bandas horizontales de nivel -->
    <line x1="0" y1="${h20}" x2="${totalW}" y2="${h20}" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="14 8" />
    <line x1="0" y1="${h50}" x2="${totalW}" y2="${h50}" stroke="#475569" stroke-width="3" />
    <line x1="0" y1="${h80}" x2="${totalW}" y2="${h80}" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="14 8" />

    <!-- Diagonales continuas de esquina a esquina del mural -->
    <line x1="0" y1="${(totalH * 0.14).toFixed(1)}" x2="${totalW}" y2="${(totalH * 0.86).toFixed(1)}" stroke="#64748b" stroke-width="2.5" />
    <line x1="0" y1="${(totalH * 0.86).toFixed(1)}" x2="${totalW}" y2="${(totalH * 0.14).toFixed(1)}" stroke="#64748b" stroke-width="2.5" />

    <!-- Arco arquitectónico continuo -->
    <path d="M 0 ${archBaseY} Q ${archMidX} ${archTopY} ${totalW} ${archBaseY}" stroke="#334155" stroke-width="3" stroke-dasharray="18 10" />

    <!-- Onda sinusoidal continua para verificar alineación entre costuras -->
    <path d="${wavePath}" stroke="#1f2937" stroke-width="4" />
  </g>

  <!-- Borde punteado interno de costura del fragmento -->
  <rect
    x="${offsetX + 1}"
    y="${offsetY + 1}"
    width="${fragW - 2}"
    height="${fragH - 2}"
    fill="none"
    stroke="#9aa5b1"
    stroke-width="2"
    stroke-dasharray="8 8"
  />

  <!-- Marcas de registro en las 4 esquinas del fragmento -->
  <g stroke="#475569" stroke-width="2">
    <line x1="${offsetX + 16}" y1="${offsetY + 32}" x2="${offsetX + 48}" y2="${offsetY + 32}" />
    <line x1="${offsetX + 32}" y1="${offsetY + 16}" x2="${offsetX + 32}" y2="${offsetY + 48}" />

    <line x1="${offsetX + fragW - 48}" y1="${offsetY + 32}" x2="${offsetX + fragW - 16}" y2="${offsetY + 32}" />
    <line x1="${offsetX + fragW - 32}" y1="${offsetY + 16}" x2="${offsetX + fragW - 32}" y2="${offsetY + 48}" />

    <line x1="${offsetX + 16}" y1="${offsetY + fragH - 32}" x2="${offsetX + 48}" y2="${offsetY + fragH - 32}" />
    <line x1="${offsetX + 32}" y1="${offsetY + fragH - 48}" x2="${offsetX + 32}" y2="${offsetY + fragH - 16}" />

    <line x1="${offsetX + fragW - 48}" y1="${offsetY + fragH - 32}" x2="${offsetX + fragW - 16}" y2="${offsetY + fragH - 32}" />
    <line x1="${offsetX + fragW - 32}" y1="${offsetY + fragH - 48}" x2="${offsetX + fragW - 32}" y2="${offsetY + fragH - 16}" />
  </g>

  <!-- Cartela central con etiqueta visible del fragmento -->
  <g transform="translate(${cx - boxW / 2}, ${cy - boxH / 2})">
    <rect width="${boxW}" height="${boxH}" rx="8" fill="#ffffff" fill-opacity="0.92" stroke="#334155" stroke-width="2" />
    <text
      x="${boxW / 2}"
      y="46"
      text-anchor="middle"
      font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
      font-size="24"
      font-weight="700"
      fill="#182026"
    >${escapeXml(label)}</text>
    <text
      x="${boxW / 2}"
      y="80"
      text-anchor="middle"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      font-size="16"
      fill="#4b5563"
    >${escapeXml(subLabel)}</text>
  </g>
</svg>
`;

  return toDataUri(svg);
}

/**
 * Genera el plano esquemático SVG del Claustro San Agustín para el piso indicado.
 * Sus dimensiones y corredores coinciden con las coordenadas `planPin` (x%, y%).
 */
export function generateFloorPlanMock(floor) {
  const width = floor.plan?.viewBox?.width || 800;
  const height = floor.plan?.viewBox?.height || 500;
  const isFirstFloor = floor.number === 1;
  const levelTag = isFirstFloor ? 'PISO 1 — PLANTA BAJA' : 'PISO 2 — PLANTA ALTA';

  // Detalle arquitectónico diferenciado por piso en el patio central
  const courtyardDetail = isFirstFloor
    ? `
      <!-- Patio abierto con fuente central y senderos -->
      <line x1="400" y1="130" x2="400" y2="370" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 6" />
      <line x1="190" y1="250" x2="610" y2="250" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 6" />
      <circle cx="400" cy="250" r="36" fill="#e2e8f0" stroke="#64748b" stroke-width="2" />
      <circle cx="400" cy="250" r="14" fill="#ffffff" stroke="#64748b" stroke-width="1.5" />
      <text x="400" y="314" text-anchor="middle" font-family="-apple-system, Segoe UI, sans-serif" font-size="13" font-weight="600" fill="#64748b" letter-spacing="1.5">PATIO CENTRAL</text>
      <!-- Acceso principal en ala oeste (solo Piso 1) -->
      <rect x="46" y="220" width="20" height="60" fill="#ffffff" stroke="#475569" stroke-width="2" />
      <text x="36" y="254" text-anchor="end" font-family="-apple-system, Segoe UI, sans-serif" font-size="11" fill="#64748b">ACCESO</text>
    `
    : `
      <!-- Vacío del patio visto desde el segundo piso con baranda perimetral -->
      <rect x="206" y="146" width="388" height="208" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5" stroke-dasharray="8 6" />
      <line x1="206" y1="146" x2="594" y2="354" stroke="#cbd5e1" stroke-width="1.5" />
      <line x1="594" y1="146" x2="206" y2="354" stroke="#cbd5e1" stroke-width="1.5" />
      <rect x="315" y="232" width="170" height="36" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" />
      <text x="400" y="255" text-anchor="middle" font-family="-apple-system, Segoe UI, sans-serif" font-size="12" font-weight="600" fill="#64748b" letter-spacing="1.2">VACÍO SOBRE PATIO</text>
    `;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(floor.plan?.alt || levelTag)}">
  <!-- Fondo del plano -->
  <rect width="${width}" height="${height}" fill="#f8fafc" />

  <!-- Retícula arquitectónica suave -->
  <defs>
    <pattern id="plan-grid-${floor.number}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#plan-grid-${floor.number})" />

  <!-- Perímetro exterior del claustro (galerías transitables) -->
  <rect x="60" y="40" width="680" height="420" fill="#ffffff" stroke="#1f2937" stroke-width="3.5" />

  <!-- Divisiones suaves de esquinas de galerías -->
  <g stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="5 5">
    <line x1="190" y1="40" x2="190" y2="130" />
    <line x1="610" y1="40" x2="610" y2="130" />
    <line x1="190" y1="370" x2="190" y2="460" />
    <line x1="610" y1="370" x2="610" y2="460" />
    <line x1="60" y1="130" x2="190" y2="130" />
    <line x1="610" y1="130" x2="740" y2="130" />
    <line x1="60" y1="370" x2="190" y2="370" />
    <line x1="610" y1="370" x2="740" y2="370" />
  </g>

  <!-- Patio central / vacío -->
  <rect x="190" y="130" width="420" height="240" fill="#f8fafc" stroke="#334155" stroke-width="2.5" />

  <!-- Columnata perimetral del claustro -->
  <g fill="#334155">
    <rect x="186" y="126" width="8" height="8" />
    <rect x="256" y="126" width="8" height="8" />
    <rect x="326" y="126" width="8" height="8" />
    <rect x="396" y="126" width="8" height="8" />
    <rect x="466" y="126" width="8" height="8" />
    <rect x="536" y="126" width="8" height="8" />
    <rect x="606" y="126" width="8" height="8" />

    <rect x="186" y="366" width="8" height="8" />
    <rect x="256" y="366" width="8" height="8" />
    <rect x="326" y="366" width="8" height="8" />
    <rect x="396" y="366" width="8" height="8" />
    <rect x="466" y="366" width="8" height="8" />
    <rect x="536" y="366" width="8" height="8" />
    <rect x="606" y="366" width="8" height="8" />

    <rect x="186" y="206" width="8" height="8" />
    <rect x="186" y="286" width="8" height="8" />
    <rect x="606" y="206" width="8" height="8" />
    <rect x="606" y="286" width="8" height="8" />
  </g>

  ${courtyardDetail}

  <!-- Escaleras esquemáticas en esquina suroeste -->
  <g stroke="#64748b" stroke-width="1.5" fill="none">
    <rect x="76" y="388" width="44" height="54" fill="#f1f5f9" />
    <line x1="76" y1="400" x2="120" y2="400" />
    <line x1="76" y1="412" x2="120" y2="412" />
    <line x1="76" y1="424" x2="120" y2="424" />
    <line x1="76" y1="436" x2="120" y2="436" />
  </g>

  <!-- Etiquetas de las cuatro galerías -->
  <g font-family="-apple-system, Segoe UI, sans-serif" font-size="12" font-weight="600" fill="#64748b" letter-spacing="1.2">
    <text x="400" y="64" text-anchor="middle">GALERÍA NORTE</text>
    <text x="400" y="446" text-anchor="middle">GALERÍA SUR</text>
    <text x="90" y="250" text-anchor="middle" transform="rotate(-90 90 250)">GALERÍA OESTE</text>
    <text x="710" y="250" text-anchor="middle" transform="rotate(90 710 250)">GALERÍA ESTE</text>
  </g>

  <!-- Rosa de los vientos discreta -->
  <g transform="translate(758, 62)" stroke="#475569" stroke-width="1.5" fill="none">
    <circle cx="0" cy="0" r="14" fill="#ffffff" />
    <path d="M 0 -9 L 4 5 L 0 2 L -4 5 Z" fill="#1f2937" stroke="none" />
    <text x="0" y="-18" text-anchor="middle" font-family="-apple-system, Segoe UI, sans-serif" font-size="10" font-weight="700" fill="#334155" stroke="none">N</text>
  </g>

  <!-- Identificador del piso -->
  <text
    x="74"
    y="26"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
    font-size="12"
    font-weight="600"
    fill="#334155"
  >${escapeXml(levelTag)}</text>
</svg>
`;

  return toDataUri(svg);
}

/**
 * Asigna una imagen real si existe `src`; si es nulo/vacío o falla al cargar,
 * sustituye automáticamente por el SVG generado por `fallbackFactory`.
 */
export function applyImageWithFallback(imgEl, src, fallbackFactory, contextLabel = 'recurso') {
  const hasRealSrc = typeof src === 'string' && src.trim().length > 0;

  if (!hasRealSrc) {
    imgEl.dataset.sourceType = 'mock';
    imgEl.src = fallbackFactory();
    return;
  }

  imgEl.dataset.sourceType = 'real';
  imgEl.addEventListener(
    'error',
    () => {
      if (imgEl.dataset.fallbackApplied === 'true') return;
      imgEl.dataset.fallbackApplied = 'true';
      imgEl.dataset.sourceType = 'mock-fallback';
      console.warn(
        `[Claustro] No se pudo cargar "${src}" (${contextLabel}). Usando placeholder SVG automático.`,
      );
      imgEl.src = fallbackFactory();
    },
    { once: true },
  );

  imgEl.src = src;
}
