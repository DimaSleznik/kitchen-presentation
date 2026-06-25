/* ============================================================================
   PIPELINE — «Как у Häcker сейчас»: интерактивная карта текущего пайплайна Häcker
   для НЕтехнического читателя (дубликат «стендов»). Слева направо: данные → редактор →
   {показ/продажи, завод}. Кликни на блок — что это, зачем и что с ним в миграции.
   Движок повторяет arch.js; стили переиспользуются (.arch-*, .anode, .dr-*).
   Data-driven: правь NODES/EDGES. Тексты — бизнес-язык; деталь/миграция — в note.
   ========================================================================== */

const ZONES = {
  cat: { label: 'Каталог-данные', col: 0 },
  imos: { label: 'Редактор imos', col: 1 },
  show: { label: 'Показ и продажи', col: 2 },
  make: { label: 'Завод', col: 2 },
};
const ZONE_RU = { cat: 'Данные', imos: 'Редактор', show: 'Продажи', make: 'Завод' };

const NODES = [
  { id: 'idm', zone: 'cat', title: 'IDM-каталог', role: 'Данные о товарах',
    plain: 'Мастер-данные Häcker: все товары, цены, правила и опции. Хранятся как один большой XML-файл отраслевого формата IDM — общий язык для программ-планировщиков у дилеров. 3D-форм и команд станкам внутри нет.',
    note: 'Формат: XML, T_NEW_CATALOG / IDM_3_0_1, ~92 МБ. В миграции: ОСТАВЛЯЕМ и продолжаем отдавать наружу. ~10 234 артикула, общий ключ — номер TYPE_NO.', keep: true },
  { id: 'imos', zone: 'imos', title: 'imos — редактор', role: 'Где «собирают» шкаф',
    plain: 'Сложная программа, где инженеры Häcker задают, как устроен каждый шкаф: из каких панелей он собирается и по каким правилам.',
    note: 'В миграции: ЗАМЕНЯЕМ своим — сборщиком геометрии в браузере. Самая тяжёлая часть перехода.' },
  { id: 'nfx', zone: 'imos', title: '3D-формы (.nfx)', role: 'Описание формы',
    plain: 'Формат редактора imos для форм шкафов. Внутри файла .nfx — не данные, а мини-программа-рецепт: «собери корпус, поставь фасад и полки по размеру». Поэтому форму нельзя просто скопировать — её надо понять и пересобрать.',
    note: 'Формат: imos .nfx — параметрический DSL (hold/subscribe/configurator) с зависимостями. В миграции: переносим в наши шаблоны геометрии с проверкой формы. Это логика, а не просто данные.' },
  { id: 'cnc', zone: 'imos', title: 'CNC-программы', role: 'Команды станкам',
    plain: 'Команды для станков (G-код), которые imos сам генерит из формы шкафа: где пилить, сверлить и фрезеровать каждую деталь.',
    note: 'В миграции: самое тяжёлое и последнее — «тел» программ нет в выгрузке, вынимаем из живого imos до его выключения.' },
  { id: 'navigram', zone: 'show', title: 'Navigram', role: 'Склад 3D-моделей',
    plain: 'Облачное хранилище готовых 3D-моделей кухонь — чтобы показывать их в каталогах и онлайн-конфигураторах.',
    note: 'В миграции: ЗАМЕНЯЕМ своим хранилищем 3D с быстрой доставкой картинок.' },
  { id: 'catweb', zone: 'show', title: 'cat@web', role: 'Портал раздачи',
    plain: 'Отраслевой портал: завод заливает каталог IDM один раз, а все программы-планировщики у дилеров его автоматически забирают.',
    note: 'В миграции: ОСТАЁТСЯ — мы продолжаем выгружать сюда IDM для дилеров.', keep: true },
  { id: 'planners', zone: 'show', title: 'Планировщики · дилеры', role: 'Где продают кухню',
    plain: 'Программы у дилеров (CARAT, KPS): в них собирают кухню под клиента, считают цену и оформляют заказ на завод.',
    note: 'В миграции: продолжают работать как раньше — мы кормим их стандартом IDM.', keep: true },
  { id: 'machines', zone: 'make', title: 'Станки на заводе', role: 'Режут детали',
    plain: 'Получают CNC-программы и режут, сверлят, кромят реальные детали будущей кухни. Вот зачем нужен ЧПУ: заказ превращается в физические детали.',
    note: 'В миграции: трогаем в последнюю очередь — сначала добиваемся, чтобы команды совпадали со старыми 1-в-1.' },
];

const EDGES = [
  { from: 'idm', to: 'imos', label: 'что выпускать' },
  { from: 'imos', to: 'nfx', label: 'строит форму' },
  { from: 'imos', to: 'cnc', label: 'генерит программы' },
  { from: 'nfx', to: 'navigram', label: '3D на склад' },
  { from: 'cnc', to: 'machines', label: 'режет детали' },
  { from: 'idm', to: 'catweb', label: 'каталог наружу' },
  { from: 'catweb', to: 'planners', label: 'дилерам' },
  { from: 'navigram', to: 'planners', label: '3D для показа' },
  { from: 'planners', to: 'machines', label: 'заказ на завод' },
];

const node = (id) => NODES.find((n) => n.id === id);
const colOf = (id) => ZONES[node(id).zone].col;

function orthH(x1, y1, x2, y2) {
  if (Math.abs(y2 - y1) < 2) return `M${x1} ${y1} H${x2}`;
  const dx = x2 - x1, midX = x1 + dx / 2;
  const r = Math.min(12, Math.abs(y2 - y1) / 2, Math.abs(dx) / 2);
  const sx = Math.sign(dx) || 1, sy = Math.sign(y2 - y1);
  return `M${x1} ${y1} H${midX - r * sx} Q${midX} ${y1} ${midX} ${y1 + r * sy} V${y2 - r * sy} Q${midX} ${y2} ${midX + r * sx} ${y2} H${x2}`;
}
function orthSide(x1, y1, x2, y2, bx) {
  const r = Math.min(10, Math.abs(y2 - y1) / 2);
  const sy = Math.sign(y2 - y1) || 1;
  return `M${x1} ${y1} H${bx - r} Q${bx} ${y1} ${bx} ${y1 + r * sy} V${y2 - r * sy} Q${bx} ${y2} ${bx - r} ${y2} H${x2}`;
}

export function mountPipeline(root) {
  if (!root || root.dataset.mounted) return;
  root.dataset.mounted = '1';

  const zoneCol = (z) =>
    `<div class="arch-zone zone-${z}"><div class="az-head zt-line zt-${z}">${ZONES[z].label}</div>${
      NODES.filter((n) => n.zone === z).map((n) =>
        `<button class="anode an-${z}${n.keep ? ' keep' : ' repl'}" data-id="${n.id}"><span class="an-title">${n.title}</span><span class="an-role">${n.role}</span></button>`
      ).join('')
    }</div>`;

  root.innerHTML = `
    <div class="arch-map pipe-map">
      <div class="arch-cols">
        ${zoneCol('cat')}
        ${zoneCol('imos')}
        <div class="arch-zone-stack">${zoneCol('show')}${zoneCol('make')}</div>
        <svg class="arch-deps" aria-hidden="true"></svg>
      </div>
    </div>`;

  let drawer = document.getElementById('pipeline-drawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'pipeline-drawer';
    drawer.hidden = true;
    document.body.appendChild(drawer);
  }

  const cols = root.querySelector('.arch-cols');
  const svg = root.querySelector('.arch-deps');
  const NS = 'http://www.w3.org/2000/svg';

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
      return orthSide(pa.right, pa.cy, pb.right, pb.cy, Math.max(pa.right, pb.right) + 26);
    }
    const rightward = pb.cx > pa.cx;
    const x1 = rightward ? pa.right : pa.left;
    const x2 = rightward ? pb.left : pb.right;
    return orthH(x1, pa.cy, x2, pb.cy);
  }

  function drawDeps() {
    svg.innerHTML = `<defs>
      <marker id="pe-faint" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 1 L8 4.5 L0 8 z" fill="rgba(179,80,42,.5)"/></marker>
      <marker id="pe-hot" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 1 L8 4.5 L0 8 z" fill="#b3502a"/></marker>
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
      <div class="dr-tags"><span class="zone-tag zt-${n.zone}">${ZONE_RU[n.zone]}</span><span class="dr-iter">${n.keep ? 'оставляем' : 'мигрируем'}</span></div>
      <h3>${n.title}</h3>
      <p class="dr-hook">${n.role}</p>
      <p class="dr-note">${n.plain}</p>
      ${conns.length ? `<div class="dr-deps"><span class="dr-deps-h">Связи:</span>${
        conns.map((c) => `<button class="dr-dep" data-id="${c.id}">${c.dir} ${node(c.id).title}<span class="dd-label">${c.label}</span></button>`).join('')
      }</div>` : ''}
      ${n.note ? `<div class="dr-block"><span class="dr-h">Что с этим в миграции</span><p>${n.note}</p></div>` : ''}
      <a class="dr-doc" href="#/migration">Подробно о миграции →</a>`;
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

  svg.setAttribute('class', 'arch-deps mode-always');
  drawDeps();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDeps);
  requestAnimationFrame(drawDeps);
  setTimeout(drawDeps, 400);
  window.addEventListener('resize', drawDeps);
  root._drawPipe = drawDeps;
}
