/* ============================================================================
   i18n — состояние языка + словарь UI + оверлеи перевода данных.
   Русский — ИСТОЧНИК (строки лежат в board.js / phases.js). EN/DE — оверлеи здесь.
   Хелперы при lang==='ru' берут исходник, иначе — перевод (с откатом на русский).
   Переводы EN/DE сгенерированы и вставляются в UI.en/de и DATA.en/de ниже.
   ========================================================================== */

const LANGS = ['ru', 'en', 'de'];
export const LANG_LABELS = { ru: 'RU', en: 'EN', de: 'DE' };

let lang = (() => {
  try { const s = localStorage.getItem('kp-lang'); if (LANGS.includes(s)) return s; } catch (e) { /* no-op */ }
  return 'ru';
})();

export const getLang = () => lang;

export function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  lang = l;
  try { localStorage.setItem('kp-lang', l); } catch (e) { /* no-op */ }
  document.documentElement.setAttribute('lang', l);
  window.dispatchEvent(new CustomEvent('kp-langchange', { detail: { lang: l } }));
}

/* ── UI-строки (хром страниц + навигация). RU — полный, EN/DE заполняются. ── */
const UI = {
  ru: {
    'nav.overview': 'Обзор', 'nav.migration': 'Миграция', 'nav.phases': 'Фазы',
    'nav.board': 'План работ', 'nav.arch': 'Как устроено', 'nav.docs': 'Документы',

    'phases.eyebrow': 'План работ · по фазам · результат каждого этапа',
    'phases.h1a': 'Своя платформа кухонь — ',
    'phases.h1em': 'планировщик и каталог для пользователей',
    'phases.lede': 'Каждая карточка — одна фаза. Слева — её суть и сроки; справа — кто и что делает и, главное, <b>конкретный результат к концу фазы</b>. Значок ★ отмечает фазы с демонстрируемым вживую результатом.',
    'phases.fronts.h': 'Фронты работ — что строим',
    'phases.fronts.editor.t': 'Редактор каталога', 'phases.fronts.editor.s': 'модели, правила, цены',
    'phases.fronts.planner.t': 'Планировщик', 'phases.fronts.planner.s': 'приложение для пользователя',
    'phases.fronts.data.t': 'Сервис данных и моделей', 'phases.fronts.data.s': 'каталог и 3D на CDN',
    'phases.fronts.ai.t': 'ИИ-модуль', 'phases.fronts.ai.s': 'ассистент и превью',
    'phases.fronts.goal.t': 'Платформа кухонь', 'phases.fronts.goal.s': 'единый собственный продукт',
    'phases.subh': 'Кто что делает',
    'phases.result': 'Результат фазы →',
    'phases.flag.demo': '★ Демонстрируемый результат',
    'phases.flag.internal': 'Подготовительный этап',
    'phases.foot': 'Полный горизонт — около 9 месяцев (≈ 38 недель) силами небольшой команды. Детальная доска с ролями и зависимостями — на вкладке <a href="#/board">«План работ»</a>.',
    'phases.export.label': 'Экспорт:',
    'phases.export.pdf': 'Скачать PDF',
    'phases.export.pptx': 'Скачать PPTX',

    'ex.eyebrow': 'Смета · сторонние сервисы · периодические платежи',
    'ex.h': 'Дополнительные платежи',
    'ex.lede': 'Внешние сервисы и платформы, оплачиваемые отдельно от разработки: API-модели, ИИ-рендеры, хостинг и аккаунты публикации. Стоимость API и рендеров зависит от объёма использования.',
    'ex.meta.project': 'Проект', 'ex.meta.company': 'Компания', 'ex.meta.manager': 'Менеджер проекта', 'ex.meta.date': 'Дата',
    'ex.col.item': 'Позиция', 'ex.col.desc': 'Описание', 'ex.col.pay': 'Оплата', 'ex.col.price': 'Цена, EUR',
    'ex.choose': '(выберите один)', 'ex.total': 'Итого',
    'ex.pay.token': 'за токены', 'ex.pay.payg': 'по факту', 'ex.pay.year': 'в год', 'ex.pay.once': 'разово',
    'ex.llm.d': 'Стоимость зависит от объёма и выбранной модели. ~$0.4–$10 за 1 млн токенов. Ожидаемый объём ~150–300 млн токенов/мес.',
    'ex.groq.d': 'Быстрый и недорогой инференс для базовых моделей (LLaMA 3 70B / GPT-OSS-20B).',
    'ex.openai.d': 'Продвинутые рассуждения и качественный структурированный вывод; для сложных агентных задач (GPT-4o / GPT-4o-mini).',
    'ex.airender.d': 'Платформа img2img-рендеринга (Flux-2-Pro / ControlNet); стоимость зависит от объёма и модели.',
    'ex.gpu.d': 'Для дообучения и хостинга собственной модели рендера.',
    'ex.gplay.d': 'Для публикации мобильного приложения, если потребуется.',
    'ex.apple.d': 'Для публикации мобильного приложения, если потребуется.',

    'board.intro.h1': 'План работ — что делаем и в каком порядке',
    'board.intro.p': 'Слева направо — <b>фазы</b> проекта. Строки — <b>роли</b> команды. Карточки в одной колонке выполняются <b>параллельно</b>; значок <span class="stopper-key">⛔</span> и стрелки — <b>зависимости</b> (стоперы: сначала одно, затем другое). Внизу каждой фазы — <b>результат фазы</b>.<br>Наведите на карточку для краткой подсказки; нажмите — для подробного описания и ссылки на документ.<br><b>Полный горизонт</b> — около 9 месяцев (≈ 38 недель) силами небольшой команды; самое продолжительное и рисковое — перенос геометрии и команд для станков (ЧПУ).',
    'board.intro.plateCaption': 'Как читать эту доску',
    'board.corner': 'роли \\ фазы',
    'board.toolbar.depsLabel': 'Стрелки-зависимости',
    'board.toolbar.select': 'при выборе',
    'board.toolbar.always': 'всегда',
    'board.toolbar.zoom': 'Масштаб',
    'board.toolbar.fit': 'уместить всё',
    'board.toolbar.hint': 'тащи — двигать · колесо — масштаб',
    'board.lane.result': 'Результат',
    'board.badge.demo': '★ демонстрация',
    'board.badge.internal': 'подготовка',
    'board.parking.h2': 'За горизонтом (на потом)',
    'board.drawer.deps': '⛔ Сначала нужно закрыть:',
    'board.drawer.demoResult': 'Демонстрируемый результат фазы',
    'board.drawer.result': 'Результат фазы',
    'board.drawer.details': 'Детали (для технарей)',
    'board.drawer.doc': 'Открыть подробный документ →',
    'board.drawer.close': 'закрыть',

    'export.coverTitle': 'План работ по фазам',
    'export.coverSubtitle': 'Параметрический планнер кухонь · Häcker',
    'export.phaseWord': 'Фаза',
  },
  en: {},
  de: {},
};

/* ── Оверлеи перевода ДАННЫХ (lanes/iter/outcome/tasks/parking) для en/de ── */
const DATA = {
  en: { lanes: {}, iter: {}, outcome: {}, tasks: {}, parking: [] },
  de: { lanes: {}, iter: {}, outcome: {}, tasks: {}, parking: [] },
};

/* ── нормализация экранирования из машинного перевода ──
   UI-строки содержат настоящие теги (<b>, <a>, <br>) — переводчик отдал их как
   &lt;b&gt;, разэкранируем в реальные теги. В data-строках (notes) литерал «<100»
   должен остаться сущностью &lt;100 для innerHTML — переводчик удвоил до &amp;lt;,
   возвращаем к &lt; через разворот &amp;. */
const unescUI = (s) => (typeof s === 'string'
  ? s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : s);
const unescData = (s) => (typeof s === 'string' ? s.replace(/&amp;/g, '&') : s);

function mapStrings(obj, fn) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) return obj.map((x) => mapStrings(x, fn));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k in obj) out[k] = mapStrings(obj[k], fn);
    return out;
  }
  return obj;
}

function applyTranslations(code, payload) {
  if (!payload) return;
  if (payload.ui) UI[code] = mapStrings(payload.ui, unescUI);
  DATA[code] = {
    lanes: mapStrings(payload.lanes || {}, unescData),
    iter: mapStrings(payload.iter || {}, unescData),
    outcome: mapStrings(payload.outcome || {}, unescData),
    tasks: mapStrings(payload.tasks || {}, unescData),
    parking: mapStrings(payload.parking || [], unescData),
  };
}

/* ── публичные хелперы ── */
export function t(key) {
  return (UI[lang] && UI[lang][key]) || UI.ru[key] || key;
}
export function trTask(task, field) {
  if (lang === 'ru') return task[field];
  const o = DATA[lang].tasks[task.id];
  return (o && o[field]) || task[field];
}
export function trIter(it, field) {
  if (lang === 'ru') return it[field];
  const o = DATA[lang].iter[it.id];
  return (o && o[field]) || it[field];
}
export function trLane(lane) {
  if (lang === 'ru') return lane.label;
  return DATA[lang].lanes[lane.id] || lane.label;
}
export function trOutcome(iterId, ruText) {
  if (lang === 'ru') return ruText;
  return (DATA[lang].outcome && DATA[lang].outcome[iterId]) || ruText;
}
export function trParking(index, field, ruText) {
  if (lang === 'ru') return ruText;
  const p = DATA[lang].parking[index];
  return (p && p[field]) || ruText;
}

/* ── переводы (заполняются в i18n-data.js, импортируется ради side-effect) ── */
import { EN, DE } from './i18n-data.js';
applyTranslations('en', EN);
applyTranslations('de', DE);
