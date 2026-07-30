/**
 * charts.js
 * Renderização de gráficos históricos para os indicadores ambientais,
 * usando Chart.js (via CDN, sem bundler).
 *
 * Os dados de cada indicador ficam em data/processed/<indicador>.json,
 * no formato: [{ "ano": 2022, "valor": 71.2, "fonte": "MapBiomas" }, ...]
 *
 * Este arquivo é intencionalmente genérico: cada página de indicador
 * (a criar futuramente em /mapas ou /indicadores) pode chamar
 * renderIndicatorChart(canvasId, jsonFile, options) para plotar seu gráfico.
 */

const CHART_COLORS = {
  forest: '#2b6b41',
  water: '#2f7fb0',
  fire: '#c96a3c',
  soil: '#8a5a3c',
  amber: '#c99a3c',
  violet: '#7a5ea8',
  conservation: '#6fb178',
};

async function fetchIndicatorData(jsonFile) {
  try {
    const base = window.SEMMA_BASE_PATH || '';
    const res = await fetch(`${base}data/processed/${jsonFile}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[charts] Não foi possível carregar ${jsonFile}:`, err.message);
    return [];
  }
}

/**
 * Renderiza um gráfico de linha/barra simples ano x valor.
 * @param {string} canvasId - id do elemento <canvas>
 * @param {string} jsonFile - nome do arquivo em data/processed/
 * @param {object} options - { label, color, type: 'line'|'bar' }
 */
async function renderIndicatorChart(canvasId, jsonFile, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const data = await fetchIndicatorData(jsonFile);
  if (!data.length) return;

  const color = options.color || CHART_COLORS.forest;

  new Chart(canvas, {
    type: options.type || 'line',
    data: {
      labels: data.map((d) => d.ano),
      datasets: [{
        label: options.label || jsonFile,
        data: data.map((d) => d.valor),
        borderColor: color,
        backgroundColor: options.type === 'bar' ? color + 'aa' : color + '22',
        fill: options.type !== 'bar',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: color,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const fonte = data[ctx.dataIndex]?.fonte;
              return fonte ? `Fonte: ${fonte}` : '';
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#e2e5df' } },
        x: { grid: { display: false } },
      },
    },
  });
}

// Carrega o Chart.js via CDN sob demanda apenas se houver algum <canvas data-indicator-chart>
document.addEventListener('DOMContentLoaded', () => {
  const canvases = document.querySelectorAll('canvas[data-indicator-chart]');
  if (!canvases.length) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
  script.onload = () => {
    canvases.forEach((canvas) => {
      renderIndicatorChart(
        canvas.id,
        canvas.dataset.indicatorChart,
        {
          label: canvas.dataset.label,
          color: canvas.dataset.color,
          type: canvas.dataset.type,
        }
      );
    });
  };
  document.head.appendChild(script);
});
