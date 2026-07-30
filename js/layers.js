/**
 * layers.js
 * Carregamento e controle (toggle) das camadas GeoJSON do mapa.
 *
 * Convenção (ver CLAUDE.md > "Convenção de camadas do mapa"):
 *   Camada                    | Geometria       | Cor        | Arquivo
 *   Limite Municipal          | linha           | branco     | limite_municipal.geojson
 *   Hidrografia               | linha           | #2f7fb0    | hidrografia.geojson
 *   Nascentes                 | ponto           | #5fb0e0    | nascentes.geojson
 *   Unidades de Conservação   | polígono        | #6fb178    | unidades_conservacao.geojson
 *   Queimadas                 | polígono        | #c96a3c    | queimadas_AAAA.geojson
 *   Desmatamento              | polígono        | #8a5a3c    | desmatamento_AAAA.geojson
 *   APPs                      | polígono        | #c99a3c    | apps.geojson
 *   Área Urbana               | polígono        | cinza      | area_urbana.geojson
 */

const DATA_DIR = 'data/processed/';

const LAYER_STYLES = {
  limite:        { color: '#ffffff', weight: 2, dashArray: '4 3', fillOpacity: 0 },
  hidrografia:   { color: '#2f7fb0', weight: 1.5 },
  ucs:           { color: '#6fb178', weight: 1, fillColor: '#6fb178', fillOpacity: 0.35 },
  apps:          { color: '#c99a3c', weight: 1, fillColor: '#c99a3c', fillOpacity: 0.3 },
  queimadas:     { color: '#c96a3c', weight: 1, fillColor: '#c96a3c', fillOpacity: 0.45 },
  desmatamento:  { color: '#8a5a3c', weight: 1, fillColor: '#8a5a3c', fillOpacity: 0.45 },
  urbana:        { color: '#7c877e', weight: 1, fillColor: '#7c877e', fillOpacity: 0.25 },
};

const POINT_COLOR_NASCENTES = '#5fb0e0';

// Grupos de camadas — populados assincronamente ao carregar os GeoJSON
const layerGroups = {
  limite: L.layerGroup(),
  hidrografia: L.layerGroup(),
  nascentes: L.layerGroup(),
  ucs: L.layerGroup(),
  apps: L.layerGroup(),
  queimadas: L.layerGroup(),
  desmatamento: L.layerGroup(),
  urbana: L.layerGroup(),
};

/**
 * Busca um GeoJSON em data/processed/. Retorna null (com aviso no console)
 * se o arquivo ainda não existir — isso permite montar o site antes dos
 * dados reais estarem prontos.
 */
async function fetchGeoJSON(filename) {
  try {
    const res = await fetch(DATA_DIR + filename);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[layers] Não foi possível carregar ${filename}:`, err.message);
    return null;
  }
}

function addPointLayer(geojson, group, color, popupFields) {
  L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 6,
        color: '#fff',
        weight: 1,
        fillColor: color,
        fillOpacity: 0.9,
      }),
    onEachFeature: (feature, layer) => {
      if (feature.properties) layer.bindPopup(buildPopup(feature.properties, popupFields));
    },
  }).addTo(group);
}

function addLineOrPolygonLayer(geojson, group, style, popupFields) {
  L.geoJSON(geojson, {
    style,
    onEachFeature: (feature, layer) => {
      if (feature.properties) layer.bindPopup(buildPopup(feature.properties, popupFields));
    },
  }).addTo(group);
}

function buildPopup(props, fields) {
  const rows = (fields || Object.keys(props))
    .filter((f) => props[f] !== undefined)
    .map((f) => `<tr><td style="padding-right:8px;color:#7c877e;">${f}</td><td><strong>${props[f]}</strong></td></tr>`)
    .join('');
  return `<table style="font-size:12.5px;">${rows}</table>`;
}

/**
 * Carrega todas as camadas configuradas. Cada camada falha de forma
 * independente e silenciosa (log em console) caso o arquivo não exista
 * ainda em data/processed/.
 */
async function initLayers() {
  const [
    limite, hidrografia, nascentes, ucs, apps, urbana,
  ] = await Promise.all([
    fetchGeoJSON('limite_municipal.geojson'),
    fetchGeoJSON('hidrografia.geojson'),
    fetchGeoJSON('nascentes.geojson'),
    fetchGeoJSON('unidades_conservacao.geojson'),
    fetchGeoJSON('apps.geojson'),
    fetchGeoJSON('area_urbana.geojson'),
  ]);

  if (limite) addLineOrPolygonLayer(limite, layerGroups.limite, LAYER_STYLES.limite);
  if (hidrografia) addLineOrPolygonLayer(hidrografia, layerGroups.hidrografia, LAYER_STYLES.hidrografia, ['nome']);
  if (nascentes) addPointLayer(nascentes, layerGroups.nascentes, POINT_COLOR_NASCENTES, ['nome', 'situacao']);
  if (ucs) addLineOrPolygonLayer(ucs, layerGroups.ucs, LAYER_STYLES.ucs, ['nome', 'categoria']);
  if (apps) addLineOrPolygonLayer(apps, layerGroups.apps, LAYER_STYLES.apps);
  if (urbana) addLineOrPolygonLayer(urbana, layerGroups.urbana, LAYER_STYLES.urbana);

  // Camadas anuais (queimadas / desmatamento) — carrega ano mais recente por padrão
  const anoAtual = new Date().getFullYear();
  for (let ano = anoAtual; ano >= anoAtual - 5; ano--) {
    const queimadas = await fetchGeoJSON(`queimadas_${ano}.geojson`);
    if (queimadas) {
      addLineOrPolygonLayer(queimadas, layerGroups.queimadas, LAYER_STYLES.queimadas, ['ano', 'area_ha']);
      break; // usa só o ano mais recente disponível para não pesar o mapa
    }
  }
  for (let ano = anoAtual; ano >= anoAtual - 5; ano--) {
    const desmatamento = await fetchGeoJSON(`desmatamento_${ano}.geojson`);
    if (desmatamento) {
      addLineOrPolygonLayer(desmatamento, layerGroups.desmatamento, LAYER_STYLES.desmatamento, ['ano', 'area_ha']);
      break;
    }
  }

  // Camadas visíveis por padrão (conforme protótipo): limite, hidrografia, nascentes, UCs
  layerGroups.limite.addTo(map);
  layerGroups.hidrografia.addTo(map);
  layerGroups.nascentes.addTo(map);
  layerGroups.ucs.addTo(map);

  // Ajusta o zoom ao limite municipal, se disponível
  if (limite) {
    try {
      const bounds = L.geoJSON(limite).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch (e) { /* ignora se geometria vazia */ }
  }
}

// ---- Toggle das checkboxes do painel "Camadas" ----
function bindLayerToggle(checkboxId, groupKey) {
  const el = document.getElementById(checkboxId);
  if (!el) return;
  el.addEventListener('change', () => {
    if (el.checked) {
      layerGroups[groupKey].addTo(map);
    } else {
      map.removeLayer(layerGroups[groupKey]);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLayers();

  bindLayerToggle('layer-limite', 'limite');
  bindLayerToggle('layer-hidrografia', 'hidrografia');
  bindLayerToggle('layer-nascentes', 'nascentes');
  bindLayerToggle('layer-ucs', 'ucs');
  bindLayerToggle('layer-apps', 'apps');
  bindLayerToggle('layer-queimadas', 'queimadas');
  bindLayerToggle('layer-desmatamento', 'desmatamento');
  bindLayerToggle('layer-urbana', 'urbana');
});
