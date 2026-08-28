/**
 * fiscalizacao.js
 * Carrega os registros de Autorização de Supressão de Vegetação
 * (data/processed/supressao_vegetal.geojson) como tabela de consulta na
 * página fiscalizacao-ambiental.html — não é um mapa, só lista os
 * atributos de cada processo. Reaproveita o mesmo GeoJSON que antes
 * alimentava mapas/supressao.html (ver CLAUDE.md).
 */

const FISCALIZACAO_DATA_DIR = `${window.SEMMA_BASE_PATH || ''}data/processed/`;

const SUPRESSAO_TABLE_FIELDS = [
  ['numero_processo', 'Nº do processo'],
  ['tipo_licenca', 'Tipo de licença'],
  ['descricao_atividade', 'Atividade'],
  ['data_criacao', 'Criação'],
  ['data_emissao', 'Emissão'],
  ['data_validade', 'Validade'],
];

async function fetchSupressaoRecords() {
  try {
    const res = await fetch(`${FISCALIZACAO_DATA_DIR}supressao_vegetal.geojson`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const geojson = await res.json();
    return geojson.features.map((f) => f.properties || {});
  } catch (err) {
    console.warn('[fiscalizacao] Não foi possível carregar supressao_vegetal.geojson:', err.message);
    return null;
  }
}

function renderSupressaoTable(records) {
  const meta = document.getElementById('fiscalizacao-contagem');
  const body = document.getElementById('tabela-supressao-body');
  if (!body) return;

  if (!records) {
    if (meta) meta.textContent = 'Não foi possível carregar os dados agora — tente novamente mais tarde.';
    return;
  }

  if (meta) {
    meta.textContent = `${records.length} processo(s) encontrado(s). Fonte: SEMAD/SEMA-GO (sistema IPÊ).`;
  }

  body.innerHTML = records
    .map((props) => {
      const cells = SUPRESSAO_TABLE_FIELDS
        .map(([key]) => `<td>${props[key] ?? '—'}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('tabela-supressao-body')) return;
  renderSupressaoTable(await fetchSupressaoRecords());
});
