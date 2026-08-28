/**
 * biblioteca.js
 * Renderização dos documentos da Biblioteca Técnica (biblioteca-tecnica.html).
 * BIBLIOTECA_DOCS é a fonte única de verdade — cada documento é um
 * objeto { titulo, categoria, arquivo, data }. Vazio por enquanto: a
 * função de renderização já está pronta, basta popular o array quando
 * os primeiros documentos forem publicados.
 *
 * Categorias válidas (ver data-biblioteca-lista no HTML): banco-de-dados,
 * pareceres-tecnicos, legislacao-normas, estudos-publicacoes,
 * manuais-referencias.
 */

const BIBLIOTECA_DOCS = [
  // Exemplo de item futuro:
  // { titulo: 'Plano Municipal de Meio Ambiente', categoria: 'legislacao-normas', arquivo: 'data/documentos/plano-municipal.pdf', data: '2025-01-01' },
];

function formatarDataDoc(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function renderBibliotecaCategoria(container) {
  const categoria = container.dataset.bibliotecaLista;
  const docs = BIBLIOTECA_DOCS.filter((doc) => doc.categoria === categoria);

  if (!docs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <p>Nenhum documento publicado ainda.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <ul class="doc-list">
      ${docs.map((doc) => `
        <li>
          <a href="${doc.arquivo}" target="_blank" rel="noopener">
            <i class="fa-solid fa-file-lines"></i>
            <span>${doc.titulo}</span>
          </a>
          <span class="doc-date">${formatarDataDoc(doc.data)}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-biblioteca-lista]').forEach(renderBibliotecaCategoria);
});
