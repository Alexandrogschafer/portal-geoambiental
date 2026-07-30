/**
 * supressao.js
 * Carregamento e controle da camada "Autorizações de Supressão de
 * Vegetação" — específica de mapas/supressao.html. Usa o `map` global já
 * inicializado por map-core.js. Dados em
 * data/processed/supressao_vegetal.geojson (ver data/processed/FONTES.md).
 */

const SUPRESSAO_DATA_DIR = `${window.SEMMA_BASE_PATH || ''}data/processed/`;
const SUPRESSAO_COLOR = '#c99a3c'; // âmbar — mesma família de licenciamento/autos (ver CLAUDE.md)

const SUPRESSAO_POPUP_LABELS = {
  numero_processo: 'Nº do processo',
  tipo_licenca: 'Tipo de licença',
  feicao: 'Feição',
  descricao_atividade: 'Atividade',
  data_criacao: 'Criação',
  data_emissao: 'Emissão',
  data_validade: 'Validade',
};

const supressaoGroup = L.featureGroup();

async function fetchSupressaoGeoJSON(filename) {
  try {
    const res = await fetch(SUPRESSAO_DATA_DIR + filename);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[supressao] Não foi possível carregar ${filename}:`, err.message);
    return null;
  }
}

function buildSupressaoPopup(props) {
  const rows = Object.entries(SUPRESSAO_POPUP_LABELS)
    .filter(([key]) => props[key] !== undefined && props[key] !== null)
    .map(([key, label]) => `<tr><td style="padding-right:8px;color:#7c877e;">${label}</td><td><strong>${props[key]}</strong></td></tr>`)
    .join('');
  return `<table style="font-size:12.5px;">${rows}</table>`;
}

async function initSupressaoLayer() {
  const supressao = await fetchSupressaoGeoJSON('supressao_vegetal.geojson');

  if (supressao) {
    L.geoJSON(supressao, {
      style: { color: SUPRESSAO_COLOR, weight: 1, fillColor: SUPRESSAO_COLOR, fillOpacity: 0.35 },
      onEachFeature: (feature, layer) => {
        if (feature.properties) layer.bindPopup(buildSupressaoPopup(feature.properties));
      },
    }).addTo(supressaoGroup);
  }

  supressaoGroup.addTo(map);

  try {
    const bounds = supressaoGroup.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
  } catch (e) { /* ignora se não houver feições */ }
}

document.addEventListener('DOMContentLoaded', () => {
  initSupressaoLayer();

  const el = document.getElementById('layer-supressao');
  if (el) {
    el.addEventListener('change', () => {
      if (el.checked) {
        supressaoGroup.addTo(map);
      } else {
        map.removeLayer(supressaoGroup);
      }
    });
  }
});
