/**
 * layers.js
 * Configuração e carregamento das camadas GeoJSON do "painel de Camadas"
 * (ver CLAUDE.md > "Convenção de camadas do mapa").
 *
 * LAYER_CONFIG é a fonte única de verdade (arquivo, estilo, campos de
 * popup) para cada camada — reaproveitada tanto pelo mapa geral
 * (index.html, todas as camadas com toggle, via initLayers()) quanto
 * pelas páginas individuais em mapas/*.html (via initIndividualMapPage(),
 * que sempre desenha o contorno municipal como referência e, se a página
 * declarar data-layer-key/data-layer-keys, carrega a(s) camada(s) de
 * dados também). Qual caminho roda é decidido sozinho no DOMContentLoaded
 * no fim do arquivo, olhando o que existe na página.
 */

const DATA_DIR = `${window.SEMMA_BASE_PATH || ''}data/processed/`;

// Nomes de coluna crus (ex.: vindos de shapefile) -> rótulo amigável no popup.
// Campos sem entrada aqui exibem a própria chave como rótulo.
const FIELD_LABELS = {
  HIDRO: 'Tipo',
  COMP_KM: 'Comprimento (km)',
  nome_uc: 'Nome',
  categoria: 'Categoria',
  ANODETEC: 'Ano de detecção',
  AREAHA: 'Área (ha)',
  ano: 'Ano',
  area_ha: 'Área (ha)',
  name: 'Via',
  highway: 'Tipo de via',
};

// Contorno branco grosso em volta de cada polígono/linha — sem isso, o
// weight:1 na mesma família de cor do preenchimento praticamente some
// sobre a imagem de satélite (fundo com muito verde/marrom já ocupa a
// mesma faixa de cor). O preenchimento continua com a cor institucional
// da camada (ver CLAUDE.md > "Convenção de camadas do mapa").
const HALO_WEIGHT = 2.5;

const LAYER_CONFIG = {
  limite: {
    file: 'limite_municipal.geojson',
    type: 'line',
    style: { color: '#ffffff', weight: 3, dashArray: '5 4', fillOpacity: 0 },
  },
  hidrografia: {
    file: 'hidrografia.geojson',
    type: 'line',
    style: { color: '#2f7fb0', weight: 2.5 },
    popupFields: ['HIDRO', 'COMP_KM'],
  },
  nascentes: {
    file: 'nascentes.geojson',
    type: 'point',
    pointColor: '#5fb0e0',
    pointRadius: 4,
    popupFields: ['HIDRO'],
  },
  ucs: {
    file: 'unidades_conservacao.geojson',
    type: 'polygon',
    style: { color: '#ffffff', weight: HALO_WEIGHT, fillColor: '#6fb178', fillOpacity: 0.5 },
    popupFields: ['nome_uc', 'categoria'],
  },
  apps: {
    file: 'apps.geojson',
    type: 'polygon',
    style: { color: '#ffffff', weight: HALO_WEIGHT, fillColor: '#c99a3c', fillOpacity: 0.45 },
  },
  queimadas: {
    fileTemplate: 'queimadas_{ano}.geojson',
    type: 'polygon',
    style: { color: '#ffffff', weight: HALO_WEIGHT, fillColor: '#c96a3c', fillOpacity: 0.6 },
    popupFields: ['ano', 'area_ha'],
  },
  desmatamento: {
    fileTemplate: 'desmatamento_{ano}.geojson',
    type: 'polygon',
    style: { color: '#ffffff', weight: HALO_WEIGHT, fillColor: '#e63946', fillOpacity: 0.6 },
    popupFields: ['ANODETEC', 'AREAHA'],
  },
  urbana: {
    file: 'area_urbana.geojson',
    type: 'polygon',
    style: { color: '#ffffff', weight: HALO_WEIGHT, fillColor: '#7c877e', fillOpacity: 0.4 },
  },
  viario: {
    file: 'sistema_viario.geojson',
    type: 'line',
    style: { color: '#4a4a4a', weight: 2 },
    popupFields: ['name', 'highway'],
  },
};

// Grupos de camadas — populados assincronamente ao carregar os GeoJSON.
// L.featureGroup() (não layerGroup()) porque as páginas individuais
// precisam de .getBounds() para o fit automático.
const layerGroups = Object.fromEntries(
  Object.keys(LAYER_CONFIG).map((key) => [key, L.featureGroup()])
);

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

// Camadas anuais (queimadas / desmatamento): tenta do ano atual pra trás,
// usa só o ano mais recente disponível para não pesar o mapa.
async function fetchLatestAnnualGeoJSON(fileTemplate) {
  const anoAtual = new Date().getFullYear();
  for (let ano = anoAtual; ano >= anoAtual - 5; ano--) {
    const geojson = await fetchGeoJSON(fileTemplate.replace('{ano}', ano));
    if (geojson) return geojson;
  }
  return null;
}

function fetchLayerData(key) {
  const config = LAYER_CONFIG[key];
  return config.fileTemplate
    ? fetchLatestAnnualGeoJSON(config.fileTemplate)
    : fetchGeoJSON(config.file);
}

function buildPopup(props, fields) {
  const rows = (fields || Object.keys(props))
    .filter((f) => props[f] !== undefined)
    .map((f) => `<tr><td style="padding-right:8px;color:#7c877e;">${FIELD_LABELS[f] || f}</td><td><strong>${props[f]}</strong></td></tr>`)
    .join('');
  return `<table style="font-size:12.5px;">${rows}</table>`;
}

function addConfiguredLayer(key, geojson, group) {
  const config = LAYER_CONFIG[key];
  const onEachFeature = (feature, layer) => {
    if (feature.properties) layer.bindPopup(buildPopup(feature.properties, config.popupFields));
  };

  if (config.type === 'point') {
    L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: config.pointRadius || 5, color: '#fff', weight: 1.5, fillColor: config.pointColor, fillOpacity: 0.9,
        }),
      onEachFeature,
    }).addTo(group);
  } else {
    L.geoJSON(geojson, { style: config.style, onEachFeature }).addTo(group);
  }
}

/**
 * Carrega todas as camadas configuradas (mapa geral, index.html). Cada
 * camada falha de forma independente e silenciosa (log em console) caso
 * o arquivo não exista ainda em data/processed/.
 */
async function initLayers() {
  const keys = Object.keys(LAYER_CONFIG);
  const geojsons = await Promise.all(keys.map((key) => fetchLayerData(key)));

  keys.forEach((key, i) => {
    if (geojsons[i]) addConfiguredLayer(key, geojsons[i], layerGroups[key]);
  });

  // Camadas visíveis por padrão (conforme protótipo): limite, hidrografia, nascentes, UCs
  layerGroups.limite.addTo(map);
  layerGroups.hidrografia.addTo(map);
  layerGroups.nascentes.addTo(map);
  layerGroups.ucs.addTo(map);

  // Ajusta o zoom ao limite municipal, se disponível
  const limite = geojsons[keys.indexOf('limite')];
  if (limite) {
    try {
      const bounds = L.geoJSON(limite).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch (e) { /* ignora se geometria vazia */ }
  }
}

// Licença ODbL do OpenStreetMap exige atribuição visível sempre que a
// camada de Sistema Viário estiver ativa — usamos o controle de
// atribuição padrão do Leaflet (já mostra a atribuição dos tiles), em
// vez de um texto separado escondido em algum canto.
const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

// ---- Toggle das checkboxes do painel "Camadas" (mapa geral) ----
function bindLayerToggle(checkboxId, groupKey) {
  const el = document.getElementById(checkboxId);
  if (!el) return;
  el.addEventListener('change', () => {
    if (el.checked) {
      layerGroups[groupKey].addTo(map);
      if (groupKey === 'viario') map.attributionControl.addAttribution(OSM_ATTRIBUTION);
    } else {
      map.removeLayer(layerGroups[groupKey]);
      if (groupKey === 'viario') map.attributionControl.removeAttribution(OSM_ATTRIBUTION);
    }
  });
}

/**
 * Carrega uma página individual em mapas/*.html. Sempre desenha o
 * contorno municipal como referência visual (não é opcional — sem ele,
 * uma página com dado ainda não processado, como Virada Ambiental ou
 * APM, mostraria só o mapa base sem nenhum contexto). Se a página
 * declarar data-layer-key (uma camada) ou data-layer-keys (várias, cada
 * uma com toggle próprio — ex.: Hidrografia + Nascentes), carrega e
 * ajusta o zoom a essa(s) camada(s); sem nenhuma das duas, ajusta o zoom
 * ao próprio contorno municipal.
 */
async function initIndividualMapPage(keys) {
  const [limite, ...geojsons] = await Promise.all([
    fetchGeoJSON('limite_municipal.geojson'),
    ...keys.map((key) => fetchLayerData(key)),
  ]);

  if (limite) addConfiguredLayer('limite', limite, layerGroups.limite);
  layerGroups.limite.addTo(map);

  if (!keys.length) {
    if (limite) {
      const bounds = L.geoJSON(limite).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
    }
    return;
  }

  keys.forEach((key, i) => {
    if (geojsons[i]) addConfiguredLayer(key, geojsons[i], layerGroups[key]);
    layerGroups[key].addTo(map);
    if (keys.length > 1) bindLayerToggle(`layer-${key}`, key);
  });

  let bounds = L.featureGroup(keys.map((key) => layerGroups[key])).getBounds();
  if (!bounds.isValid() && limite) {
    bounds = L.geoJSON(limite).getBounds();
  }
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('layer-limite')) {
    // Mapa geral (index.html): todas as camadas, com toggle.
    initLayers();
    bindLayerToggle('layer-limite', 'limite');
    bindLayerToggle('layer-hidrografia', 'hidrografia');
    bindLayerToggle('layer-nascentes', 'nascentes');
    bindLayerToggle('layer-ucs', 'ucs');
    bindLayerToggle('layer-apps', 'apps');
    bindLayerToggle('layer-queimadas', 'queimadas');
    bindLayerToggle('layer-desmatamento', 'desmatamento');
    bindLayerToggle('layer-urbana', 'urbana');
    bindLayerToggle('layer-viario', 'viario');
  } else if (document.getElementById('map')) {
    // Página individual (mapas/*.html): contorno municipal sempre, mais
    // a(s) camada(s) de dados da página, se declaradas.
    const keys = document.body.dataset.layerKeys
      ? document.body.dataset.layerKeys.split(',')
      : document.body.dataset.layerKey
        ? [document.body.dataset.layerKey]
        : [];
    initIndividualMapPage(keys);
  }
});
