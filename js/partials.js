/**
 * partials.js
 * Injeta sidebar e topbar compartilhados (partials/sidebar.html,
 * partials/topbar.html) via fetch(), evitando duplicar essa marcação em
 * cada página. Cada página declara, no <body>:
 *
 *   <body data-page="hidrografia" data-title="Hidrografia" data-tagline="...">
 *     <aside class="sidebar" data-partial="sidebar"></aside>
 *     ...
 *     <div class="topbar" data-partial="topbar"></div>
 *
 * data-page controla qual item do menu recebe a classe "active";
 * data-title/data-tagline preenchem o <h1>/tagline do topbar. Links dentro
 * do partial usam o token __BASE__ no lugar do prefixo relativo (""" na
 * raiz, "../" em mapas/), resolvido a partir de window.SEMMA_BASE_PATH —
 * a mesma convenção já usada por charts.js/layers.js para data/processed/.
 */

async function fetchPartial(name) {
  const base = window.SEMMA_BASE_PATH || '';
  const res = await fetch(`${base}partials/${name}.html`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function resolveBaseTokens(html) {
  const base = window.SEMMA_BASE_PATH || '';
  return html.replaceAll('__BASE__', base);
}

function markActiveNavItem(sidebarEl) {
  const page = document.body.dataset.page;
  if (!page) return;
  sidebarEl.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach((el) => el.classList.add('active'));
}

function fillTopbarText(topbarEl) {
  const { title, tagline } = document.body.dataset;
  const titleEl = topbarEl.querySelector('[data-topbar="title"]');
  const taglineEl = topbarEl.querySelector('[data-topbar="tagline"]');
  if (titleEl && title) titleEl.textContent = title;
  if (taglineEl && tagline) taglineEl.textContent = tagline;
}

async function injectPartial(selector, name, afterInject) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    el.innerHTML = resolveBaseTokens(await fetchPartial(name));
    if (afterInject) afterInject(el);
  } catch (err) {
    console.warn(`[partials] Não foi possível carregar ${name}:`, err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectPartial('[data-partial="sidebar"]', 'sidebar', markActiveNavItem);
  injectPartial('[data-partial="topbar"]', 'topbar', fillTopbarText);
});
