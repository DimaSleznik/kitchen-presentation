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

const laneById = Object.fromEntries(LANES.map((l) => [l.id, l]));

/* Развёрнутый «результат фазы» — главный смысл страницы (русский источник).
   Экспортируется: используется и здесь, и в экспортёрах как ru-исходник. */
export const OUTCOME = {
  i0: 'Заложена техническая основа продукта: определена целевая архитектура, развёрнуты сервисы каталога и хранения данных, настроено автоматическое тестирование. Реальный каталог Häcker — более 10 000 позиций с ценами и допустимыми размерами — загружен в систему; спроектированы интерфейс редактора и контур работы ИИ. Это фундамент, на котором строятся все видимые возможности следующих фаз.',
  i1: 'Каталог сохраняет привычный вид, но переведён на единый слой шаблонов: геометрия и детали поступают из одной точки, а данные и 3D-ресурсы отдаются сервисами отдельно от приложения. Каталог работает плавно, отделки переключаются мгновенно, материалы заданы единым набором. Параллельно начато обучение собственной модели визуализации. Тесты подтверждают: внутренний переход не изменил каталог для пользователя.',
  i2: 'Параметрический конфигуратор нижних шкафов работает вживую: пользователь изменяет ширину, число ящиков и сторону петли — и модуль мгновенно перестраивается на экране, без отдельных файлов под каждый вариант. Геометрия соответствует заводским формам Häcker, перенесённым из прежнего редактора, а корректность размеров подтверждена автоматическими проверками. Работоспособность гибридного подхода доказана на наиболее сложном семействе шкафов.',
  i3: 'Каталог представлен готовыми товарами-пресетами, которые добавляются в проект одним действием; конфигурацию можно собирать вручную или через ассистента — по запросу он достраивает проект строго в рамках правил (размеры, шаг сетки, совместимость фасада и корпуса). Движок правил выступает источником истины: недопустимая конфигурация невозможна ни для пользователя, ни для ИИ. Первые реальные заказы сходятся с прежней системой по размерам, цене и составу.',
  i4: 'Каталог становится полным: навесные, высокие и угловые шкафы — кухню можно собрать целиком. Пользователь задаёт нестандартный размер под свою стену и сразу видит его допустимость, а модуль перестраивается под новое значение. Для производства ключевое: команды управления станками перенесены из прежнего редактора и сверены один к одному — завод получает идентичные детали. Перенос без потерь подтверждён, а не заявлен.',
  i5: 'Каталог наполняется быстрее: ИИ готовит черновики товаров из прайс-листа под проверку специалиста, а каждый шкаф получает фотореалистичное превью, сформированное собственной моделью в едином фирменном стиле. Геометрия остаётся точной, визуализация выполняется ИИ. Готовый проект отображается целиком и выгружается одним файлом — для просмотра, обмена или передачи в производство.',
};

export function mountPhases(root) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';

  const cards = ITERATIONS.map((it, idx) => {
    const tasks = TASKS.filter((x) => x.iter === it.id);
    const minis = tasks.map((x) => {
      const lane = laneById[x.lane];
      return `<div class="ph-mini">
        <span class="ph-mini-role"><span class="ph-ic">${lane.icon}</span>${trLane(lane)}</span>
        <b>${trTask(x, 'title')}</b>
        <span class="ph-mini-blurb">${trTask(x, 'hook')}</span>
      </div>`;
    }).join('');

    const num = String(idx).padStart(2, '0');
    const delay = Math.min(idx, 4) * 70;
    return `<article class="ph-card${it.demo ? ' demo' : ''} reveal" style="transition-delay:${delay}ms">
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
    </article>`;
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
    </header>
    <div class="ph-list">${cards}</div>
    <div class="ph-foot reveal">${t('phases.foot')}</div>
  </div>`;

  root.querySelectorAll('.ph-exp-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.exp === 'pdf') exportPhasesPDF();
    else exportPhasesPPTX();
  }));
}
