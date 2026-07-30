/**
 * licenciamento.js
 * Carregamento e controle da camada "Licenciamento Ambiental" — específica
 * de mapas/licenciamento.html. Usa o `map` global já inicializado por
 * map-core.js. Dados em data/processed/licenciamento_{pontos,areas,linhas}.geojson
 * (ver data/processed/FONTES.md).
 */

const LIC_DATA_DIR = `${window.SEMMA_BASE_PATH || ''}data/processed/`;
const LIC_COLOR = '#c99a3c'; // âmbar — licenciamento (ver css/style.css --amber)

const LIC_POPUP_LABELS = {
  tipo_licenca: 'Tipo de licença',
  atividade: 'Atividade',
  numero_processo: 'Nº do processo',
  numero_licenca: 'Nº da licença',
  data_abertura: 'Abertura',
  validade_inicio: 'Validade (início)',
  validade_fim: 'Validade (fim)',
  licenciado: 'Situação',
};

const licenciamentoGroups = {
  pontos: L.layerGroup(),
  areas: L.layerGroup(),
  linhas: L.layerGroup(),
};

async function fetchLicenciamentoGeoJSON(filename) {
  try {
    const res = await fetch(LIC_DATA_DIR + filename);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[licenciamento] Não foi possível carregar ${filename}:`, err.message);
    return null;
  }
}

function buildLicenciamentoPopup(props) {
  const rows = Object.entries(LIC_POPUP_LABELS)
    .filter(([key]) => props[key] !== undefined && props[key] !== null)
    .map(([key, label]) => {
      const value = key === 'licenciado' ? (props[key] ? 'Licenciado' : 'Em análise') : props[key];
      return `<tr><td style="padding-right:8px;color:#7c877e;">${label}</td><td><strong>${value}</strong></td></tr>`;
    })
    .join('');
  return `<table style="font-size:12.5px;">${rows}</table>`;
}

function onEachLicenciamentoFeature(feature, layer) {
  if (feature.properties) layer.bindPopup(buildLicenciamentoPopup(feature.properties));
}

async function initLicenciamentoLayers() {
  const [pontos, areas, linhas] = await Promise.all([
    fetchLicenciamentoGeoJSON('licenciamento_pontos.geojson'),
    fetchLicenciamentoGeoJSON('licenciamento_areas.geojson'),
    fetchLicenciamentoGeoJSON('licenciamento_linhas.geojson'),
  ]);

  if (pontos) {
    L.geoJSON(pontos, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6, color: '#fff', weight: 1, fillColor: LIC_COLOR, fillOpacity: 0.9,
        }),
      onEachFeature: onEachLicenciamentoFeature,
    }).addTo(licenciamentoGroups.pontos);
  }

  if (areas) {
    L.geoJSON(areas, {
      style: { color: LIC_COLOR, weight: 1, fillColor: LIC_COLOR, fillOpacity: 0.35 },
      onEachFeature: onEachLicenciamentoFeature,
    }).addTo(licenciamentoGroups.areas);
  }

  if (linhas) {
    L.geoJSON(linhas, {
      style: { color: LIC_COLOR, weight: 3 },
      onEachFeature: onEachLicenciamentoFeature,
    }).addTo(licenciamentoGroups.linhas);
  }

  licenciamentoGroups.pontos.addTo(map);
  licenciamentoGroups.areas.addTo(map);
  licenciamentoGroups.linhas.addTo(map);

  const bundle = L.featureGroup([licenciamentoGroups.pontos, licenciamentoGroups.areas, licenciamentoGroups.linhas]);
  try {
    const bounds = bundle.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
  } catch (e) { /* ignora se não houver feições */ }
}

function bindLicenciamentoToggle(checkboxId, groupKey) {
  const el = document.getElementById(checkboxId);
  if (!el) return;
  el.addEventListener('change', () => {
    if (el.checked) {
      licenciamentoGroups[groupKey].addTo(map);
    } else {
      map.removeLayer(licenciamentoGroups[groupKey]);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLicenciamentoLayers();

  bindLicenciamentoToggle('layer-lic-pontos', 'pontos');
  bindLicenciamentoToggle('layer-lic-areas', 'areas');
  bindLicenciamentoToggle('layer-lic-linhas', 'linhas');
});
