/* ============================================================================
   PHASES — «Фазы»: вертикальная лента карточек, по одной на фазу.
   Дизайн «журнальный сплит»: слева цветной корешок (что это / сколько длится),
   справа — кто что делает + КРУПНО «результат фазы».
   Цветовой код корешка: демо-фаза — терракота, подготовительная — дуб.
   Данные берём из board.js (ITERATIONS · TASKS · LANES); тексты — через i18n-хелперы.
   ========================================================================== */

import { ITERATIONS, TASKS, LANES } from './board.js';
import { t, trIter, trLane, trTask, trOutcome } from './i18n.js';
import { exportPhasesPDF, exportPhasesPPTX } from './exporters.js';
import logoUrl from './primeas-logo.png';

const laneById = Object.fromEntries(LANES.map((l) => [l.id, l]));

/* «Фронты работ» — четыре направления, которые собираются в один продукт.
   Иконки совпадают с ролями борды: редактор=◢, движок=◇, модели=▤, ИИ=✦. */
const FRONTS = [
  { ic: '◐', k: 'editor' },  // Редактор каталога
  { ic: '◢', k: 'planner' }, // Планировщик
  { ic: '▤', k: 'data' },    // Сервис данных и моделей
  { ic: '✦', k: 'ai' },      // ИИ-модуль
];

/* Фирменное лого внизу каждой печатной страницы. На экране скрыто;
   в печати — flow-элемент, прижатый к низу страницы-слайда (не position:fixed,
   чтобы не «плавал» и не залезал на контент при разной высоте карточек). */
const BRAND = `<div class="ph-brand" aria-hidden="true"><img src="${logoUrl}" alt="PRIMEAS"></div>`;

function frontsBand() {
  const cells = FRONTS.map((f, i) => `
    <div class="ph-front">
      <span class="ph-front-ic">${f.ic}</span>
      <b>${t(`phases.fronts.${f.k}.t`)}</b>
      <span class="ph-front-s">${t(`phases.fronts.${f.k}.s`)}</span>
    </div>
    <span class="ph-op${i === FRONTS.length - 1 ? ' eq' : ''}">${i === FRONTS.length - 1 ? '=' : '+'}</span>`).join('');
  return `<div class="ph-fronts">
    <span class="ph-fronts-h">${t('phases.fronts.h')}</span>
    <div class="ph-fronts-row">
      ${cells}
      <div class="ph-goal">
        <span class="ph-goal-star">★</span>
        <b>${t('phases.fronts.goal.t')}</b>
        <span class="ph-goal-s">${t('phases.fronts.goal.s')}</span>
      </div>
    </div>
  </div>`;
}

/* Развёрнутый «результат фазы» — главный смысл страницы (русский источник).
   Экспортируется: используется и здесь, и в экспортёрах как ru-исходник. */
export const OUTCOME = {
  i0: 'Заложена техническая основа продукта: определена целевая архитектура, развёрнуты сервисы каталога и хранения данных, настроено автоматическое тестирование. Реальный каталог Häcker в отраслевом стандарте IDM — более 10 000 позиций с ценами и допустимыми размерами — загружен в систему; спроектированы интерфейсы планировщика и редактора каталога, а также контур работы ИИ. Это фундамент, на котором строятся все видимые возможности следующих фаз.',
  i1: 'Каталог сохраняет привычный вид, но переведён на единый слой шаблонов: геометрия и детали поступают из одной точки, а данные и 3D-ресурсы отдаются сервисами отдельно от приложения. Каталог работает плавно, отделки переключаются мгновенно, материалы заданы единым набором. Параллельно начато обучение собственной модели визуализации. Тесты подтверждают: внутренний переход не изменил каталог для пользователя.',
  i2: 'Параметрический конфигуратор нижних шкафов работает вживую: пользователь изменяет ширину, число ящиков и сторону петли — и модуль мгновенно перестраивается на экране, без отдельных файлов под каждый вариант. Геометрия соответствует реальным заводским формам Häcker, а корректность размеров подтверждена автоматическими проверками. Работоспособность гибридного подхода доказана на наиболее сложном семействе шкафов.',
  i3: 'Каталог представлен готовыми товарами-пресетами, которые добавляются в проект одним действием; конфигурацию можно собирать вручную или через ассистента — по запросу он достраивает проект строго в рамках правил (размеры, шаг сетки, совместимость фасада и корпуса). Движок правил выступает источником истины: недопустимая конфигурация невозможна ни для пользователя, ни для ИИ. Первые реальные конфигурации проверены: размеры, цена и состав корректны.',
  i4: 'Каталог становится полным: навесные, высокие и угловые шкафы — кухню можно собрать целиком. Пользователь задаёт нестандартный размер под свою стену и сразу видит его допустимость, а модуль перестраивается под новое значение. Любая конфигурация остаётся в пределах правил, а геометрия — точной и согласованной с реальными формами Häcker.',
  i5: 'Каталог наполняется быстрее: ИИ готовит черновики товаров из прайс-листа под проверку специалиста, а каждый шкаф получает фотореалистичное превью, сформированное собственной моделью в едином фирменном стиле. Геометрия остаётся точной, визуализация выполняется ИИ. Готовый проект отображается целиком и выгружается одним файлом — для просмотра, обмена или дальнейшей работы.',
};

/* «Дополнительные платежи» — смета сторонних сервисов (API, рендеры, хостинг).
   Данные нейтральны к языку; описания и «хром» — через i18n (t). */
export const EXTRA = [
  { kind: 'group', item: 'LLM API Integration', choose: true, dk: 'llm' },
  { kind: 'item', item: 'Groq API', pay: 'token', dk: 'groq' },
  { kind: 'item', item: 'OpenAI API', pay: 'token', dk: 'openai' },
  { kind: 'group', item: 'AI Renders', choose: true },
  { kind: 'item', item: 'AI Integration', pay: 'payg', dk: 'airender' },
  { kind: 'item', item: 'GPU instance', pay: 'year', dk: 'gpu' },
  { kind: 'group', item: 'Hosting' },
  { kind: 'item', item: 'Server hosting', pay: 'year', price: '0' },
  { kind: 'item', item: 'DNS hosting', pay: 'year', price: '0' },
  { kind: 'item', item: 'SSL Certificates', pay: 'year', price: '0' },
  { kind: 'item', item: 'Google Play Developer account', pay: 'once', price: '25', dk: 'gplay' },
  { kind: 'item', item: 'Apple Developer account', pay: 'year', price: '100', dk: 'apple' },
  { kind: 'total', pay: 'once', price: '25' },
  { kind: 'total', pay: 'year', price: '100' },
];

function extraPayments() {
  const rows = EXTRA.map((r, i) => {
    const n = i + 1;
    const desc = r.dk ? t(`ex.${r.dk}.d`) : '';
    if (r.kind === 'group') {
      return `<tr class="ex-grp"><td class="ex-n">${n}</td>
        <td class="ex-it">${r.item}${r.choose ? ` <span class="ex-choose">${t('ex.choose')}</span>` : ''}</td>
        <td class="ex-de">${desc}</td><td class="ex-pa"></td><td class="ex-pr"></td></tr>`;
    }
    if (r.kind === 'total') {
      return `<tr class="ex-tot"><td class="ex-n"></td>
        <td class="ex-totl" colspan="2">${t('ex.total')}</td>
        <td class="ex-pa">${t(`ex.pay.${r.pay}`)}</td><td class="ex-pr">${r.price}</td></tr>`;
    }
    return `<tr><td class="ex-n">${n}</td>
      <td class="ex-it">${r.item}</td>
      <td class="ex-de">${desc}</td>
      <td class="ex-pa">${r.pay ? t(`ex.pay.${r.pay}`) : ''}</td>
      <td class="ex-pr">${r.price !== undefined ? r.price : ''}</td></tr>`;
  }).join('');
  return `<section class="ph-extra reveal">
    <div class="ex-head">
      <div class="eyebrow">${t('ex.eyebrow')}</div>
      <h2>${t('ex.h')}</h2>
      <p class="ex-lede">${t('ex.lede')}</p>
    </div>
    <table class="ex-table">
      <thead><tr>
        <th class="ex-n">#</th><th class="ex-it">${t('ex.col.item')}</th>
        <th class="ex-de">${t('ex.col.desc')}</th><th class="ex-pa">${t('ex.col.pay')}</th>
        <th class="ex-pr">${t('ex.col.price')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${BRAND}
  </section>`;
}

export function mountPhases(root) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';

  const cards = ITERATIONS.map((it, idx) => {
    const tasks = TASKS.filter((x) => x.iter === it.id);
    const minis = tasks.map((x) => {
      const lane = laneById[x.lane];
      const pts = trTask(x, 'points');
      const body = Array.isArray(pts) && pts.length
        ? `<ul class="ph-mini-pts">${pts.map((p) => `<li>${p}</li>`).join('')}</ul>`
        : `<span class="ph-mini-blurb">${trTask(x, 'hook')}</span>`;
      return `<div class="ph-mini">
        <span class="ph-mini-role"><span class="ph-ic">${lane.icon}</span>${trLane(lane)}</span>
        <b>${trTask(x, 'title')}</b>
        ${body}
      </div>`;
    }).join('');

    const num = String(idx).padStart(2, '0');
    const delay = Math.min(idx, 4) * 70;
    return `<div class="ph-slide reveal" style="transition-delay:${delay}ms">
      <article class="ph-card${it.demo ? ' demo' : ''}">
      <div class="ph-rail">
        <span class="ph-num">${num}</span>
        <div class="ph-railband">
          <h2 class="ph-title">${trIter(it, 'sub')}</h2>
          <span class="ph-weeks">${trIter(it, 'name')} · ${trIter(it, 'weeks')}</span>
          <p class="ph-why">${trIter(it, 'why')}</p>
        </div>
        <span class="ph-flag">${it.demo ? t('phases.flag.demo') : t('phases.flag.internal')}</span>
      </div>
      <div class="ph-main">
        <p class="ph-subh">${t('phases.subh')}</p>
        <div class="ph-grid">${minis}</div>
        <div class="ph-out">
          <span class="ph-out-label">${t('phases.result')}</span>
          <p>${trOutcome(it.id, OUTCOME[it.id] || it.output)}</p>
        </div>
      </div>
      </article>
      ${BRAND}
    </div>`;
  }).join('');

  root.innerHTML = `<div class="wrap ph-wrap">
    <header class="ph-head reveal">
      <div class="ph-headtop">
        <div class="eyebrow">${t('phases.eyebrow')}</div>
        <div class="ph-export">
          <span class="ph-export-label">${t('phases.export.label')}</span>
          <button class="ph-exp-btn" data-exp="pdf" type="button">${t('phases.export.pdf')}</button>
          <button class="ph-exp-btn" data-exp="pptx" type="button">${t('phases.export.pptx')}</button>
        </div>
      </div>
      <h1>${t('phases.h1a')}<em>${t('phases.h1em')}</em></h1>
      <p class="lede">${t('phases.lede')}</p>
      ${frontsBand()}
      ${BRAND}
    </header>
    <div class="ph-list">${cards}</div>
    ${extraPayments()}
    <div class="ph-foot reveal">${t('phases.foot')}</div>
  </div>`;

  root.querySelectorAll('.ph-exp-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.exp === 'pdf') exportPhasesPDF();
    else exportPhasesPPTX();
  }));
}
