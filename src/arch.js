/* ============================================================================
   ARCH — «Как устроено»: интерактивная карта архитектуры для НЕтехнического читателя.
   Блоки разложены по зонам-колонкам (Клиент · Сервисы · Данные · Внешние). Связи по
   умолчанию скрыты; при наведении/клике на блок подсвечивается его цепочка. Клик →
   панель: роль + объяснение простыми словами + связи + детали для технарей.
   Всё data-driven — правьте NODES и EDGES. Тексты — на бизнес-языке; жаргон — в note.
   ========================================================================== */

import { plate } from './plates.js';

const ZONES = {
  client: { label: 'Клиент — браузер', col: 0 },
  svc: { label: 'Бэкенд-сервисы', col: 1 },
  data: { label: 'Данные / хранилище', col: 2 },
  ext: { label: 'Внешние', col: 2 },
};
const ZONE_RU = { client: 'Клиент', svc: 'Сервисы', data: 'Данные', ext: 'Внешние' };

const NODES = [
  { id: 'ui', zone: 'client', title: 'Экран / Редактор', role: 'Что видит пользователь',
    plain: 'Панели, каталог, выбор параметров и сам 3D-редактор — всё, с чем человек работает напрямую.',
    note: 'Панели, каталог, выбор параметров, 3D-редактор.', doc: 'catalog-architecture' },
  { id: 'state', zone: 'client', title: 'Состояние сцены', role: 'Память о собранном',
    plain: 'Помнит, что уже собрано в сцене, и держит под рукой данные каталога — чтобы всё работало быстро.',
    note: 'Слепок сцены (что собрано) + кэш каталога/ассетов. Zustand + TanStack Query.', doc: 'architecture' },
  { id: 'eng', zone: 'client', title: 'Сборщик геометрии', role: 'Собирает 3D',
    plain: 'Собирает корпус шкафа по размерам, ставит готовые детали и режет вырезы под технику — прямо в браузере.',
    note: 'Собирает корпус процедурно (BoxGeometry), ставит GLB-детали, режет вырезы (CSG). three.js / R3F.', doc: 'catalog-architecture' },
  { id: 'chat', zone: 'client', title: 'ИИ-ассистент (окно)', role: 'Вход для ИИ',
    plain: 'Окно чата: принимает просьбу пользователя и аккуратно применяет ответ ассистента к сцене.',
    note: 'Чат/голос: формирует запрос со слепком, применяет ответ ассистента к сцене.', doc: 'ai-strategy' },

  { id: 'cat', zone: 'svc', title: 'Каталог', role: 'Данные каталога',
    plain: 'Хранит и обновляет шаблоны, готовые товары, правила, отделки и цены. Программа их кэширует.',
    note: 'Отдаёт и версионирует шаблоны, пресеты (SKU), правила, отделки, цены. Клиент кэширует.', doc: 'backend-services' },
  { id: 'store', zone: 'svc', title: 'Хранилище 3D', role: '3D-детали',
    plain: 'Раздаёт готовые 3D-детали (фасады, ручки, петли, технику) и текстуры через быструю сеть доставки.',
    note: 'Раздаёт GLB-детали (фасады/ручки/петли/техника) и текстуры (Draco/KTX2) через CDN.', doc: 'backend-services' },
  { id: 'gen', zone: 'svc', title: 'Конвейер моделей', role: 'Фабрика контента + миграция',
    plain: 'Готовит детали (сжатие, превью), переносит формы и модели из старого софта Häcker и по запросу выгружает целую модель.',
    note: 'Оптимизация ассетов, генерация превью; миграция: импорт форм (imos) и 3D (Navigram); on-demand экспорт (GLB/STEP).', doc: 'migration' },
  { id: 'aigw', zone: 'svc', title: 'ИИ-шлюз', role: 'ИИ + проверка',
    plain: 'Общается с ИИ-моделью и проверяет её ответ нашими правилами. Главный по корректности заказа и цены.',
    note: 'tool-calling к LLM + валидация ответа движком правил. Источник истины для заказа/цены.', doc: 'ai-strategy' },

  { id: 'db', zone: 'data', title: 'База каталога', role: 'Где лежат данные',
    plain: 'Хранит каталог и все его версии.',
    note: 'Каталог и его версии.', doc: 'backend-services' },
  { id: 'obj', zone: 'data', title: 'Файлы + сеть доставки', role: 'Где лежат 3D-файлы',
    plain: '3D-модели и текстуры с быстрой доставкой, кэшем и версиями.',
    note: 'GLB/текстуры — контент-адресные, с кэшем и версиями.', doc: 'backend-services' },

  { id: 'idm', zone: 'ext', title: 'Häcker IDM', role: 'Каталог-стандарт: вход и выход',
    plain: 'Реальный каталог Häcker — товары, цены, правила — в отраслевом формате IDM. Его мы забираем в фундамент с самого начала и при этом продолжаем отдавать наружу, чтобы дилеры работали как раньше.',
    note: 'IDM 3.0.1 (DCC Möbel), ~10 234 артикула, ключ TYPE_NO. Вход: master-данные → Каталог. Выход: эмитим IDM дилерам (CARAT/KPS) — отраслевой стандарт, не лок-ин. Импорт — в Фазу 0, не «позже».', doc: 'migration' },
  { id: 'imos', zone: 'ext', title: 'imos: формы', role: 'Старые 3D-формы (мигрируем)',
    plain: 'Старый редактор Häcker, где заданы 3D-формы шкафов. Переносим формы в наш сборщик геометрии — это «тяжёлая» часть миграции.',
    note: 'imos .nfx (параметрический DSL) + itemFlexMapping.parameters. Маппинг в CabinetTemplate; сложное — fallback static-mesh.', doc: 'migration' },
  { id: 'imoscnc', zone: 'ext', title: 'imos: станки', role: 'Команды ЧПУ (мигрируем, тяжело)',
    plain: 'Команды, по которым станки на заводе режут детали. Их нет в выгрузке — вынимаем из живого редактора до его выключения и сверяем 1-в-1.',
    note: 'G-код: optionGcodeMapping = вызовы макросов; тела — в постпроцессоре imos, не выгружены. Byte-level parity, посты — последними.', doc: 'migration' },
  { id: 'navigram', zone: 'ext', title: 'Navigram', role: 'Старое 3D-хранилище (мигрируем)',
    plain: 'Облачное хранилище 3D-моделей Häcker для показа. Заменяем своим хранилищем 3D с быстрой доставкой.',
    note: 'Источник 3D-ассетов (navCategory). Вытаскиваем модели → наш GLB-сток (Draco/KTX2, CDN).', doc: 'migration' },
  { id: 'fal', zone: 'ext', title: 'Сервис фотопревью', role: 'Красивые картинки',
    plain: 'По 3D-форме делает фотореалистичную картинку модуля.',
    note: 'ControlNet/FLUX: depth/normal из three.js → фотореалистичное превью.', doc: 'ai-strategy' },
  { id: 'llm', zone: 'ext', title: 'ИИ-модель', role: 'Модель ИИ',
    plain: 'Модель для ассистента и для черновиков наполнения каталога.',
    note: 'Модель для ассистента (tool-calling) и AI-наполнения каталога (claude-opus-4-8).', doc: 'ai-strategy' },
];

const EDGES = [
  { from: 'ui', to: 'state', label: 'правки' },
  { from: 'state', to: 'eng', label: 'что собрать → сцена' },
  { from: 'cat', to: 'state', label: 'шаблоны+правила+цены' },
  { from: 'store', to: 'eng', label: '3D-детали' },
  { from: 'chat', to: 'aigw', label: 'просьба + сцена' },
  { from: 'aigw', to: 'cat', label: 'проверено по правилам' },
  { from: 'aigw', to: 'llm', label: 'запрос к ИИ' },
  { from: 'gen', to: 'store', label: 'готовые детали' },
  { from: 'gen', to: 'cat', label: 'черновики / импорт' },
  { from: 'gen', to: 'fal', label: 'превью' },
  { from: 'idm', to: 'cat', label: 'каталог → фундамент' },
  { from: 'imos', to: 'gen', label: 'формы (миграция)' },
  { from: 'imoscnc', to: 'gen', label: 'команды ЧПУ (миграция)' },
  { from: 'navigram', to: 'gen', label: '3D-модели (миграция)' },
  { from: 'cat', to: 'db', label: 'хранит' },
  { from: 'store', to: 'obj', label: 'хранит' },
];

const node = (id) => NODES.find((n) => n.id === id);
const colOf = (id) => ZONES[node(id).zone].col;

/* ортогональный коннектор: горизонт → вертикаль → горизонт, скруглённые углы */
function orthH(x1, y1, x2, y2) {
  if (Math.abs(y2 - y1) < 2) return `M${x1} ${y1} H${x2}`;
  const dx = x2 - x1, midX = x1 + dx / 2;
  const r = Math.min(12, Math.abs(y2 - y1) / 2, Math.abs(dx) / 2);
  const sx = Math.sign(dx) || 1, sy = Math.sign(y2 - y1);
  return `M${x1} ${y1} H${midX - r * sx} Q${midX} ${y1} ${midX} ${y1 + r * sy} V${y2 - r * sy} Q${midX} ${y2} ${midX + r * sx} ${y2} H${x2}`;
}
/* вертикальный «обход» сбоку для связей внутри одной колонки */
function orthSide(x1, y1, x2, y2, bx) {
  const r = Math.min(10, Math.abs(y2 - y1) / 2);
  const sy = Math.sign(y2 - y1) || 1;
  return `M${x1} ${y1} H${bx - r} Q${bx} ${y1} ${bx} ${y1 + r * sy} V${y2 - r * sy} Q${bx} ${y2} ${bx - r} ${y2} H${x2}`;
}

export function mountArch(root) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';

  const zoneCol = (z) =>
    `<div class="arch-zone zone-${z}"><div class="az-head zt-line zt-${z}">${ZONES[z].label}</div>${
      NODES.filter((n) => n.zone === z).map((n) =>
        `<button class="anode an-${z}" data-id="${n.id}"><span class="an-title">${n.title}</span><span class="an-role">${n.role}</span></button>`
      ).join('')
    }</div>`;

  root.innerHTML = `
    <div class="arch-wrap">
      <div class="arch-intro">
        <h1>Как устроено — карта продукта</h1>
        <p>Продукт собран из блоков по зонам: <b>Клиент</b> (то, что в браузере у пользователя),
           <b>Сервисы</b> (что работает на сервере), <b>Данные</b> (где всё хранится) и <b>Внешние</b>
           (что подключаем со стороны). <b>Наведи</b> или <b>кликни</b> на блок — увидишь его связи и
           прочитаешь, зачем он. Подробности — в документе
           <a href="#/doc/backend-services">«Из чего собран продукт»</a>.</p>
        <div data-plate="read-arch" data-caption="Как читать эту карту"></div>
        <div class="board-toolbar">
          <span class="tb-label">Связи</span>
          <div class="seg"><button class="tb-seg" data-mode="select">при выборе</button><button class="tb-seg" data-mode="always">всегда</button></div>
        </div>
      </div>
      <div class="arch-map">
        <div class="arch-cols">
          ${zoneCol('client')}
          ${zoneCol('svc')}
          <div class="arch-zone-stack">${zoneCol('data')}${zoneCol('ext')}</div>
          <svg class="arch-deps" aria-hidden="true"></svg>
        </div>
      </div>
      <a class="arch-doc" href="#/doc/backend-services">Открыть документ «Из чего собран продукт» →</a>
    </div>`;

  // drawer (own element, reuses .dr-* styles)
  let drawer = document.getElementById('arch-drawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'arch-drawer';
    drawer.hidden = true;
    document.body.appendChild(drawer);
  }

  const cols = root.querySelector('.arch-cols');
  const svg = root.querySelector('.arch-deps');
  const NS = 'http://www.w3.org/2000/svg';

  // mode toggle
  let mode = localStorage.getItem('archDepMode') === 'always' ? 'always' : 'select';
  const applyMode = () => {
    svg.setAttribute('class', 'arch-deps mode-' + mode);
    root.querySelectorAll('.tb-seg').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  };
  root.querySelectorAll('.tb-seg').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode; localStorage.setItem('archDepMode', mode); applyMode();
  }));

  const pos = (el) => {
    const r = el.getBoundingClientRect();
    const base = cols.getBoundingClientRect();
    return {
      left: r.left - base.left, right: r.right - base.left,
      top: r.top - base.top, bottom: r.bottom - base.top,
      cx: r.left - base.left + r.width / 2, cy: r.top - base.top + r.height / 2,
    };
  };

  function pathFor(a, b) {
    const pa = pos(a), pb = pos(b);
    if (colOf(a.dataset.id) === colOf(b.dataset.id)) {
      if (Math.abs(pa.cy - pb.cy) < 150) {
        const y1 = pa.cy < pb.cy ? pa.bottom : pa.top;
        const y2 = pa.cy < pb.cy ? pb.top : pb.bottom;
        return `M${pa.cx} ${y1} V${y2}`;
      }
      return orthSide(pa.right, pa.cy, pb.right, pb.cy, Math.max(pa.right, pb.right) + 30);
    }
    const rightward = pb.cx > pa.cx;
    const x1 = rightward ? pa.right : pa.left;
    const x2 = rightward ? pb.left : pb.right;
    return orthH(x1, pa.cy, x2, pb.cy);
  }

  function drawDeps() {
    svg.innerHTML = `<defs>
      <marker id="ae-faint" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 1 L8 4.5 L0 8 z" fill="rgba(179,80,42,.5)"/></marker>
      <marker id="ae-hot" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 1 L8 4.5 L0 8 z" fill="#b3502a"/></marker>
    </defs>`;
    svg.setAttribute('width', cols.scrollWidth);
    svg.setAttribute('height', cols.scrollHeight);
    EDGES.forEach((e) => {
      const a = root.querySelector(`.anode[data-id="${e.from}"]`);
      const b = root.querySelector(`.anode[data-id="${e.to}"]`);
      if (!a || !b) return;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', pathFor(a, b));
      p.setAttribute('class', 'arch-edge');
      p.dataset.from = e.from; p.dataset.to = e.to;
      svg.appendChild(p);
    });
  }

  const edgesOf = (id) => svg.querySelectorAll(`.arch-edge[data-from="${id}"], .arch-edge[data-to="${id}"]`);
  function showEdges(id) {
    svg.querySelectorAll('.arch-edge.hot').forEach((p) => p.classList.remove('hot'));
    edgesOf(id).forEach((p) => p.classList.add('hot'));
  }
  function clearEdges() { svg.querySelectorAll('.arch-edge.hot').forEach((p) => p.classList.remove('hot')); }

  function focusNode(id) {
    root.querySelectorAll('.anode').forEach((el) => el.classList.add('dim'));
    const keep = new Set([id]);
    EDGES.forEach((e) => { if (e.from === id) keep.add(e.to); if (e.to === id) keep.add(e.from); });
    keep.forEach((k) => root.querySelector(`.anode[data-id="${k}"]`)?.classList.remove('dim'));
    showEdges(id);
  }
  function clearFocus() {
    root.querySelectorAll('.anode.dim').forEach((el) => el.classList.remove('dim'));
    clearEdges();
  }

  function openNode(id) {
    const n = node(id);
    if (!n) return;
    const outs = EDGES.filter((e) => e.from === id).map((e) => ({ id: e.to, dir: '→', label: e.label }));
    const ins = EDGES.filter((e) => e.to === id).map((e) => ({ id: e.from, dir: '←', label: e.label }));
    const conns = [...outs, ...ins];
    drawer.innerHTML = `
      <button class="dr-close" aria-label="закрыть">✕</button>
      <div class="dr-tags"><span class="zone-tag zt-${n.zone}">${ZONE_RU[n.zone]}</span><span class="dr-iter">${ZONES[n.zone].label}</span></div>
      <h3>${n.title}</h3>
      <p class="dr-hook">${n.role}</p>
      <p class="dr-note">${n.plain || n.note}</p>
      ${conns.length ? `<div class="dr-deps"><span class="dr-deps-h">Связи:</span>${
        conns.map((c) => `<button class="dr-dep" data-id="${c.id}">${c.dir} ${node(c.id).title}<span class="dd-label">${c.label}</span></button>`).join('')
      }</div>` : ''}
      ${n.note ? `<div class="dr-block"><span class="dr-h">Детали (для технарей)</span><p>${n.note}</p></div>` : ''}
      ${n.doc ? `<a class="dr-doc" href="#/doc/${n.doc}">Открыть подробный документ →</a>` : ''}`;
    drawer.hidden = false;
    drawer.classList.add('open');
    focusNode(id);
  }
  const closeDrawer = () => { drawer.classList.remove('open'); drawer.hidden = true; clearFocus(); };

  root.addEventListener('click', (e) => {
    const n = e.target.closest('.anode');
    if (n) openNode(n.dataset.id);
  });
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('.dr-close')) { closeDrawer(); return; }
    const dep = e.target.closest('.dr-dep');
    if (dep) openNode(dep.dataset.id);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
  root.addEventListener('mouseover', (e) => {
    const n = e.target.closest('.anode');
    if (n && !n.contains(e.relatedTarget) && !drawer.classList.contains('open')) showEdges(n.dataset.id);
  });
  root.addEventListener('mouseout', (e) => {
    const n = e.target.closest('.anode');
    if (n && !n.contains(e.relatedTarget) && !drawer.classList.contains('open')) clearEdges();
  });

  applyMode();
  drawDeps();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDeps);
  requestAnimationFrame(drawDeps);
  setTimeout(drawDeps, 400);
  window.addEventListener('resize', drawDeps);
  root._drawArch = drawDeps;
}
