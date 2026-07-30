/**
 * map-core.js
 * Inicialização do mapa Leaflet e definição das camadas base.
 * Ponto de referência: Alto Paraíso de Goiás - GO (aprox. -14.13, -47.51)
 */

const MUNICIPIO_CENTER = [-14.13, -47.51];
const MUNICIPIO_ZOOM = 11;

// Instância global do mapa — usada por layers.js
const map = L.map('map', {
  zoomControl: false, // usamos os botões customizados do painel, se aplicável
  center: MUNICIPIO_CENTER,
  zoom: MUNICIPIO_ZOOM,
});

L.control.zoom({ position: 'topleft' }).addTo(map);
L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

// ---- Mapas base ----
const baseSatelite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  }
);

const baseClaro = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  maxZoom: 19,
});

const baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19,
});

// Mapa base padrão = satélite (igual ao protótipo)
baseSatelite.addTo(map);

const baseMaps = {
  'Satélite': baseSatelite,
  'Claro': baseClaro,
  'OpenStreetMap': baseOSM,
};

L.control.layers(baseMaps, null, { position: 'bottomright', collapsed: true }).addTo(map);

// Exporta para outros scripts (layers.js) via window
window.SEMMA_MAP = map;
