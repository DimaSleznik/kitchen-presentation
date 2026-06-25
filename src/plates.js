/* ============================================================================
   PLATES — система плашек-объяснялок.
   Самодостаточные SVG лежат в src/plates/*.svg (стандарт — см. AGENTS.md).
   Грузятся как сырой текст (бандл, без fetch) и вставляются:
     • в HTML — через placeholder <div data-plate="name" data-caption="...">;
     • в JS — через plate(name, caption).
   ========================================================================== */

const raw = import.meta.glob('./plates/*.svg', { query: '?raw', import: 'default', eager: true });

const PLATES = {};
for (const [path, svg] of Object.entries(raw)) {
  const name = path.split('/').pop().replace(/\.svg$/, '');
  PLATES[name] = svg;
}

export const hasPlate = (name) => !!PLATES[name];
export const plateSvg = (name) => PLATES[name] || '';

/* готовый <figure> со svg + подписью — для вставки из JS */
export function plate(name, caption) {
  const svg = PLATES[name];
  if (!svg) return '';
  return `<figure class="plate">${svg}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}

/* заполнить placeholder'ы <div data-plate="name" data-caption="..."> внутри root */
export function hydratePlates(root = document) {
  root.querySelectorAll('[data-plate]').forEach((el) => {
    if (el.dataset.plateDone) return;
    const svg = PLATES[el.dataset.plate];
    if (!svg) return;
    const cap = el.dataset.caption;
    el.innerHTML = svg + (cap ? `<figcaption>${cap}</figcaption>` : '');
    el.classList.add('plate');
    el.dataset.plateDone = '1';
  });
}
