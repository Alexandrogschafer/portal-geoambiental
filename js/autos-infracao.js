/**
 * autos-infracao.js
 * Carregamento e controle da camada "Autos de Infração" — específica de
 * mapas/autos-infracao.html. Usa o `map` global já inicializado por
 * map-core.js. Dados em data/processed/autos_infracao_{areas,pontos}.geojson
 * (ver data/processed/FONTES.md — o campo "autuado" só aparece para pessoa
 * jurídica/órgão público, nome de pessoa física é omitido por privacidade).
 */

const AUTOS_DATA_DIR = `${window.SEMMA_BASE_PATH || ''}data/processed/`;
const AUTOS_COLOR = '#c99a3c'; // âmbar — mesma família de licenciamento/autos (ver CLAUDE.md)

const AUTOS_POPUP_LABELS = {
  data_infracao: 'Data',
  numero_processo: 'Nº do processo',
  autuado: 'Autuado',
  descricao: 'Infração',
  area_ha: 'Área (ha)',
  status: 'Status',
};

const autosGroups = {
  areas: L.layerGroup(),
  pontos: L.layerGroup(),
};

async function fetchAutosGeoJSON(filename) {
  try {
    const res = await fetch(AUTOS_DATA_DIR + filename);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[autos-infracao] Não foi possível carregar ${filename}:`, err.message);
    return null;
  }
}

function buildAutosPopup(props) {
  const rows = Object.entries(AUTOS_POPUP_LABELS)
    .filter(([key]) => props[key] !== undefined && props[key] !== null)
    .map(([key, label]) => `<tr><td style="padding-right:8px;color:#7c877e;">${label}</td><td><strong>${props[key]}</strong></td></tr>`)
    .join('');
  return `<table style="font-size:12.5px;">${rows}</table>`;
}

function onEachAutosFeature(feature, layer) {
  if (feature.properties) layer.bindPopup(buildAutosPopup(feature.properties));
}

async function initAutosLayers() {
  const [areas, pontos] = await Promise.all([
    fetchAutosGeoJSON('autos_infracao_areas.geojson'),
    fetchAutosGeoJSON('autos_infracao_pontos.geojson'),
  ]);

  if (areas) {
    L.geoJSON(areas, {
      style: { color: AUTOS_COLOR, weight: 1, fillColor: AUTOS_COLOR, fillOpacity: 0.35 },
      onEachFeature: onEachAutosFeature,
    }).addTo(autosGroups.areas);
  }

  if (pontos) {
    L.geoJSON(pontos, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6, color: '#fff', weight: 1, fillColor: AUTOS_COLOR, fillOpacity: 0.9,
        }),
      onEachFeature: onEachAutosFeature,
    }).addTo(autosGroups.pontos);
  }

  autosGroups.areas.addTo(map);
  autosGroups.pontos.addTo(map);

  const bundle = L.featureGroup([autosGroups.areas, autosGroups.pontos]);
  try {
    const bounds = bundle.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
  } catch (e) { /* ignora se não houver feições */ }
}

function bindAutosToggle(checkboxId, groupKey) {
  const el = document.getElementById(checkboxId);
  if (!el) return;
  el.addEventListener('change', () => {
    if (el.checked) {
      autosGroups[groupKey].addTo(map);
    } else {
      map.removeLayer(autosGroups[groupKey]);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAutosLayers();

  bindAutosToggle('layer-autos-areas', 'areas');
  bindAutosToggle('layer-autos-pontos', 'pontos');
});
