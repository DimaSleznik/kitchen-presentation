import { marked } from 'marked';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import 'highlight.js/styles/base16/atelier-cave.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import { mountBoard } from './board.js';
import { mountPhases } from './phases.js';
import { mountArch } from './arch.js';
import { mountMigration } from './migration.js';
import { mountPipeline } from './pipeline.js';
import { hydratePlates } from './plates.js';

/* ── load all docs as raw text (bundled, no fetch) ── */
const rawDocs = import.meta.glob('/docs/*.md', { query: '?raw', import: 'default', eager: true });
const DOCS = {};
for (const [path, text] of Object.entries(rawDocs)) {
  const name = path.split('/').pop().replace(/\.md$/, '');
  DOCS[name] = text;
}

/* ── каталог документов: бизнес-язык вверху, техника — под «для технарей» ── */
const DOC_GROUPS = [
  {
    id: 'plain', label: 'Понятное', tech: false,
    items: [
      ['migration', 'миграция', 'Миграция Häcker', 'Как переносим реальные данные Häcker (IDM · imos · Navigram) в новую систему без потерь — простыми словами.'],
      ['catalog-architecture', 'главное', 'Как создаются модули', 'Главная идея: шаблоны вместо тысяч файлов — как это устроено и почему масштабируется.'],
      ['roadmap-product', 'план', 'План развития по фазам', 'Что делаем по шагам и какие демо показываем заказчику на каждом этапе.'],
      ['ai-strategy', 'ИИ', 'Где помогает ИИ', 'Три роли искусственного интеллекта — и почему правила всегда главнее ИИ.'],
      ['backend-services', 'устройство', 'Из чего собран продукт', 'Какие части (сервисы) хранят 3D-детали, данные и помогают ассистенту.'],
    ],
  },
  {
    id: 'tech', label: 'Для технарей', tech: true,
    items: [
      ['architecture', 'проект', 'Структура и стек прототипа', 'Существующая архитектура прототипа: слои, состояние, рендер.'],
      ['kitchen-data-model', 'данные', 'Модель данных кухни', 'Как описаны модули, материалы и сцена в данных.'],
      ['parametric-catalog-research', 'ресерч', 'Источники и обоснования', 'На что опирается рекомендованная архитектура: стандарты и аналоги.'],
      ['tech-debt', 'качество', 'Технический долг (детально)', 'Полная инвентаризация по коду. Бизнес-сводка — в разделе «Зрелость и риски» на странице «Обзор».'],
      ['roadmap', 'план', 'Роадмап прототипа (детально)', 'Технический роадмап прототипа со всеми деталями.'],
    ],
  },
];

/* ── mermaid theme matched to the blueprint palette ── */
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'JetBrains Mono Variable, monospace',
  themeVariables: {
    background: '#ece4d5',
    primaryColor: '#f1e0d3',
    primaryBorderColor: '#b3502a',
    primaryTextColor: '#1d1a15',
    secondaryColor: '#e4dac6',
    tertiaryColor: '#ece4d5',
    lineColor: '#266b72',
    fontSize: '13px',
  },
});

/* ── marked renderer: mermaid blocks + heading ids ── */
function slugify(s) {
  return s.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}
const renderer = new marked.Renderer();
const origCode = renderer.code.bind(renderer);
renderer.code = (token) => {
  if (token.lang === 'mermaid') {
    const b64 = btoa(unescape(encodeURIComponent(token.text)));
    return `<div class="mermaid" data-src="${b64}"></div>`;
  }
  return origCode(token);
};
renderer.heading = function (token) {
  const content = this.parser.parseInline(token.tokens);
  const id = slugify(token.text);
  return `<h${token.depth} id="${id}">${content}</h${token.depth}>`;
};
marked.setOptions({ renderer, gfm: true, breaks: false });

/* ── views ── */
const presentation = document.getElementById('presentation');
const boardView = document.getElementById('board-view');
const phasesView = document.getElementById('phases-view');
const archView = document.getElementById('arch-view');
const migrationView = document.getElementById('migration-view');
const docsView = document.getElementById('docs-view');
const docView = document.getElementById('doc-view');
const docContent = document.getElementById('doc-content');

const ALL_VIEWS = [presentation, boardView, phasesView, archView, migrationView, docsView, docView];
function showOnly(view) {
  ALL_VIEWS.forEach((v) => { if (v) v.hidden = v !== view; });
}

async function renderDoc(name, frag) {
  const src = DOCS[name];
  if (!src) {
    docContent.innerHTML = `<h1>Документ не найден</h1><p>${name}.md</p>`;
    return;
  }
  docContent.innerHTML = marked.parse(src);

  docContent.querySelectorAll('.mermaid[data-src]').forEach((el) => {
    el.textContent = decodeURIComponent(escape(atob(el.dataset.src)));
    el.removeAttribute('data-src');
  });
  try {
    await mermaid.run({ nodes: docContent.querySelectorAll('.mermaid') });
  } catch (e) { /* keep going if a diagram fails */ }

  docContent.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));

  docContent.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; return; }
    const md = href.match(/([\w-]+)\.md(?:#(.*))?$/);
    if (md) { a.setAttribute('href', `#/doc/${md[1]}${md[2] ? '~' + md[2] : ''}`); return; }
    if (href.startsWith('#') && !href.startsWith('#/')) {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const t = docContent.querySelector(`[id="${href.slice(1)}"]`);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  requestAnimationFrame(() => {
    if (frag) {
      const t = docContent.querySelector(`[id="${frag}"]`);
      if (t) { t.scrollIntoView({ block: 'start' }); return; }
    }
    window.scrollTo(0, 0);
  });
}

function showDoc(name, frag) {
  showOnly(docView);
  window.scrollTo(0, 0);
  renderDoc(name, frag);
}

/* ── Документы: индекс на бизнес-языке ── */
let docsMounted = false;
function buildDocsIndex() {
  if (docsMounted) return;
  docsMounted = true;
  const groups = DOC_GROUPS.map((g) => {
    const cards = g.items
      .filter(([n]) => DOCS[n])
      .map(([n, tag, title, desc]) => `<a class="doc" href="#/doc/${n}">
        <span class="n">${tag}</span><h3>${title}</h3><p>${desc}</p></a>`)
      .join('');
    return `<div class="docs-group${g.tech ? ' tech' : ''}">
      <h2>${g.label}<span class="grp-tag">${g.tech ? 'глубоко' : 'просто'}</span></h2>
      <div class="docs-grid">${cards}</div></div>`;
  }).join('');
  docsView.innerHTML = `<div class="docs-wrap">
    <h1>Документы</h1>
    <p class="sub">Сверху — понятные обзоры простыми словами. Ниже, под пометкой «для технарей» —
      детальные технические документы. Начните с «Понятного».</p>
    <div class="tip"><span class="tip-i">i</span><div>Бизнес-сводка по рискам — в разделе
      <a href="#/#maturity">«Зрелость и риски»</a> на странице «Обзор». Здесь же — детальная версия для технарей.</div></div>
    ${groups}
  </div>`;
}

function showDocsIndex() {
  buildDocsIndex();
  showOnly(docsView);
  window.scrollTo(0, 0);
}

function showIntro() {
  showOnly(presentation);
  hydratePlates(presentation);
  const pipeHost = document.getElementById('hk-pipeline-map');
  if (pipeHost) { mountPipeline(pipeHost); requestAnimationFrame(() => pipeHost._drawPipe && pipeHost._drawPipe()); }
  const raw = location.hash.replace(/^#\/?(intro)?/, '');
  const frag = raw.replace(/^#/, '');
  if (frag) {
    const t = document.getElementById(frag);
    if (t) { requestAnimationFrame(() => t.scrollIntoView({ block: 'start' })); kickReveal(); return; }
  }
  window.scrollTo(0, 0);
  kickReveal();
}

function showBoard() {
  showOnly(boardView);
  mountBoard(boardView);
  hydratePlates(boardView);
  window.scrollTo(0, 0);
  requestAnimationFrame(() => boardView._drawDeps && boardView._drawDeps());
}

function showPhases() {
  showOnly(phasesView);
  mountPhases(phasesView);
  window.scrollTo(0, 0);
  observeReveals();
  kickReveal();
}

function showArch() {
  showOnly(archView);
  mountArch(archView);
  hydratePlates(archView);
  window.scrollTo(0, 0);
  requestAnimationFrame(() => archView._drawArch && archView._drawArch());
}

function showMigration() {
  showOnly(migrationView);
  mountMigration(migrationView);
  hydratePlates(migrationView);
  window.scrollTo(0, 0);
}

function route() {
  const h = location.hash;
  if (h.startsWith('#/doc/')) {
    const [name, frag] = h.slice(6).split('~');
    showDoc(decodeURIComponent(name), frag ? decodeURIComponent(frag) : null);
  } else if (h.startsWith('#/board')) {
    showBoard();
  } else if (h.startsWith('#/phases')) {
    showPhases();
  } else if (h.startsWith('#/arch')) {
    showArch();
  } else if (h.startsWith('#/migration')) {
    showMigration();
  } else if (h.startsWith('#/docs')) {
    showDocsIndex();
  } else {
    showIntro();
  }
}
window.addEventListener('hashchange', route);

/* ── scroll reveal (robust: IO + in-view kick + safety net) ── */
const reveal = (el) => el.classList.add('in');
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
}, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
function observeReveals() {
  document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
}
function kickReveal() {
  document.querySelectorAll('.reveal').forEach((el) => {
    if (el.getBoundingClientRect().top < (window.innerHeight || 800)) reveal(el);
  });
}
observeReveals();
kickReveal();
window.addEventListener('load', kickReveal);
setTimeout(() => document.querySelectorAll('.reveal').forEach(reveal), 3000);

route();
