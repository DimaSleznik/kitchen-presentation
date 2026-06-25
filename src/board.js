/* ============================================================================
   BOARD — «План работ»: флоу разработки в духе Miro, но для НЕтехнического читателя.
   Слева направо: фазы. Строки: роли. Карточки: крупные задачи. Внизу фазы — выхлоп
   («что покажем заказчику»). Наведение — короткая подсказка (hook). Клик — понятное
   объяснение (plain) + детали для технарей (note) + ссылка на документ.
   Всё data-driven. Гранулярность держим ВЕРХНЕУРОВНЕВОЙ: одна понятная задача на роль
   в фазе. Тексты — на бизнес-языке; жаргон — только в блоке «детали».
   ========================================================================== */

import panzoom from 'panzoom';
import { plate } from './plates.js';

export const LANES = [
  { id: 'design', label: 'Дизайн / UX', icon: '◐' },
  { id: 'fe', label: 'Фронтенд', icon: '◢' },
  { id: 'geo', label: '3D / Геометрия', icon: '◇' },
  { id: 'be', label: 'Бэкенд / Данные', icon: '▤' },
  { id: 'ai', label: 'ИИ', icon: '✦' },
  { id: 'qa', label: 'Проверки / Тесты', icon: '✓' },
];

export const ITERATIONS = [
  { id: 'i0', name: 'Фаза 0', sub: 'Фундамент', weeks: 'нед 1–3',
    why: 'Расчистить основание: на чём строим, где данные, какие проверки.',
    output: 'Чистая основа + реальный каталог Häcker уже в базе; авто-проверки на месте.', demo: false },
  { id: 'i1', name: 'Фаза 1', sub: 'Движок шаблонов', weeks: 'нед 3–5',
    why: 'Единая точка геометрии + сервисы каталога/хранения + материалы.',
    output: 'Каталог выглядит как раньше, но геометрия и детали идут через единый слой.', demo: false },
  { id: 'i2', name: 'Фаза 2', sub: 'Живой шкаф', weeks: 'нед 5–8',
    why: 'Доказываем гибрид на самом тяжёлом семействе — нижних шкафах.',
    output: 'Ползунок меняет ширину/ящики/петлю — шкаф перестраивается вживую.', demo: true },
  { id: 'i3', name: 'Фаза 3', sub: 'Каталог + ИИ', weeks: 'нед 8–11',
    why: 'Связываем геометрию с «товаром» и делаем ассистента надёжным.',
    output: 'Каталог = готовые пресеты; ИИ добавляет модули строго по правилам.', demo: true },
  { id: 'i4', name: 'Фаза 4', sub: 'Полный каталог + кастом', weeks: 'нед 11–15',
    why: 'Остальные типы шкафов + нестандартные размеры в рамках правил.',
    output: 'Полный каталог + нестандартные размеры под заказчика.', demo: true },
  { id: 'i5', name: 'Фаза 5', sub: 'ИИ-контент', weeks: 'нед 15–18',
    why: 'ИИ ускоряет наполнение каталога и даёт фотопревью.',
    output: 'Авто-наполнение каталога + фотореалистичные превью.', demo: true },
];

/* parking lot — за горизонтом ближайших фаз */
export const PARKING = [
  { title: 'Внутреннее наполнение шкафов', note: 'полки и выкатные ящики как параметры — после базовой параметрики.', doc: 'kitchen-data-model' },
  { title: 'Аккаунты и сохранение проектов', note: 'отдельный трек; основные сервисы уже в скоупе фаз.', doc: 'backend-services' },
];

/* Крупные задачи: одна понятная на роль в фазе.
   title — человеческий тайтл; hook — подсказка на ховере; plain — объяснение простыми словами;
   note — детали для технарей; plate — плашка-объяснялка; doc — документ; deps[] — стоперы. */
export const TASKS = [
  // ── Фаза 0 — Фундамент ──
  { id: 'cleanup', lane: 'fe', iter: 'i0', title: 'Решение по архитектуре',
    hook: 'Сначала решаем, на чём строить — а не достраиваем поверх прототипа.',
    plain: 'Прототип показал, что идея работает, но это черновик. Прежде чем вкладываться, выбираем: эволюционировать его или собрать чистый каркас. Это решение экономит месяцы переделок позже.',
    note: 'Прототип — референс, не фундамент. Границы клиент ↔ сервисы; если эволюция — границы scene↔features и разбор god-файлов. Это урок прототипа, а не план «достроить поверх».', doc: 'tech-debt' },
  { id: 'data0', lane: 'be', iter: 'i0', title: 'Каркас сервисов и данных',
    hook: 'Готовим место, где будут жить данные каталога и 3D-детали.',
    plain: 'Заводим два сервиса-заглушки с настоящей схемой данных: один про каталог (шаблоны, цены, правила), другой про хранение 3D-моделей. Реальная начинка позже — но фундамент задаём сразу правильно.',
    note: 'Catalog Service (данные) + Model Storage (GLB-ассеты, CDN) — заглушки с реальной схемой. Версионируемая схема template / preset / rule + миграции. Геометрия собирается на клиенте, детали отдаёт бэк в GLB (не OBJ).', doc: 'backend-services' },
  { id: 'testbase', lane: 'qa', iter: 'i0', title: 'Тест-фундамент',
    hook: 'Страховка: авто-проверки, чтобы правки не ломали готовое.',
    plain: 'Ставим систему авто-тестов и удобные «фабрики» тестовых данных. Это ловит поломки до того, как их увидит заказчик, и делает дальнейшие изменения безопасными.',
    note: 'Фабрики тест-фикстур вместо захардкоженных SKU-строк (сейчас в 14+ файлах). Тесты на god-файлы пишем ДО рефактора.', doc: 'tech-debt' },
  { id: 'concept', lane: 'design', iter: 'i0', title: 'Концепт конфигуратора',
    hook: 'Придумываем, как человек будет крутить параметры шкафа.',
    plain: 'Рисуем визуальный язык выбора: ширина, фасад, сторона петли, отделка. Это заготовка под «живой шкаф» из Фазы 2 — чтобы дизайн был готов заранее.',
    note: 'Визуальный язык выбора параметров шкафа: ширина / фасад / сторона петли / отделка. Заготовка под Фазу 2.', doc: 'catalog-architecture' },
  { id: 'hkimport', lane: 'be', iter: 'i0', title: 'Импорт каталога Häcker',
    hook: 'Реальные 10 234 товара, цены и правила — сразу в фундамент, не «на потом».',
    plain: 'Берём настоящий каталог Häcker и кладём его в нашу базу с самого начала: товары, цены, правила, допустимые размеры. Это не отдельная история «когда-нибудь потом» — это основа, на которой растёт весь продукт.',
    note: 'Импорт IDM-каталога (T_NEW_CATALOG / IDM_3_0_1, произв. 71, «concept130 2026»): ~10 234 артикула. Ключ TYPE_NO (сходимость с поиск-индексом 99.9%), универсальная пара (feature, option) → слои commerce/rules. 13 несходящихся артикулов — на ручной разбор. IDM не выкидываем: продолжаем эмитить наружу как канал к дилерам.', plate: 'legacy-stack', doc: 'migration', deps: ['data0'] },
  { id: 'aiarch', lane: 'ai', iter: 'i0', title: 'Архитектура ИИ-слоя',
    hook: 'Закладываем место для ИИ с самого начала, а не прикручиваем потом.',
    plain: 'Сразу проектируем, где и как ИИ подключается к продукту: ассистент, наполнение каталога, генерация картинок. Главный принцип — ИИ предлагает, а правила проверяют. Здесь же «продумываем валидацию», чтобы потом не переделывать.',
    note: 'ИИ-шлюз как точка входа: контракт tool-calling { template_id, parameters }, Structured Outputs, политика «правила — источник истины». Дизайн валидации ответов (rules-engine — финальный судья), границы ответственности ИИ. Заготовка под Фазы 2–5.', plate: 'ai-roles', doc: 'ai-strategy', deps: ['cleanup'] },

  // ── Фаза 1 — Движок шаблонов ──
  { id: 'templates', lane: 'geo', iter: 'i1', title: 'Слой шаблонов',
    hook: 'Единая точка, откуда берётся любая геометрия шкафа.',
    plain: 'Вводим понятие «шаблон». Сегодняшние готовые файлы заворачиваем как простейший шаблон — каталог визуально не меняется, но появляется фундамент, на котором вырастут настоящие параметрические шкафы.',
    note: 'CabinetTemplate — единая точка получения геометрии. Текущие GLB заворачиваем как static-mesh: каталог визуально не меняется, но появляется фундамент для процедурных шаблонов.', doc: 'catalog-architecture', deps: ['cleanup'] },
  { id: 'materials', lane: 'fe', iter: 'i1', title: 'Материалы и отделки',
    hook: 'Один набор материалов на всё — вместо копий под каждый цвет.',
    plain: 'Делаем общую палитру материалов; отделка применяется к геометрии, а не плодит новые файлы. Тяжёлые картинки подгружаем лениво, чтобы ничего не тормозило.',
    note: 'Общая палитра материалов; отделка применяется к геометрии, без N×M вариантов. Тяжёлые ассеты грузим лениво за плейсхолдером.', doc: 'catalog-architecture' },
  { id: 'catalogdata', lane: 'be', iter: 'i1', title: 'Каталог и хранилище деталей',
    hook: 'Контент отделяем от программы: данные и детали — снаружи.',
    plain: 'Сервис каталога отдаёт шаблоны, товары, правила и цены; хранилище раздаёт 3D-детали и текстуры через быструю сеть доставки, а программа их кэширует. Контент можно менять, не трогая код.',
    note: 'Catalog отдаёт шаблоны/пресеты/правила/цены; Model Storage раздаёт GLB-детали и текстуры (Draco/KTX2) через CDN, клиент кэширует. Контент отделён от движка.', doc: 'backend-services', deps: ['data0'] },
  { id: 'airender', lane: 'ai', iter: 'i1', title: 'Своя модель для рендеров (старт)',
    hook: 'Начинаем готовить собственную обученную модель для красивых кухонь-картинок.',
    plain: 'Фотореалистичные превью кухонь лучше делать своей обученной моделью, а не чужой универсальной. Обучение долгое, поэтому стартуем рано: собираем данные (каталог и 3D Häcker) и ставим конвейер обучения. Готовый результат покажем в финальной фазе.',
    note: 'Fine-tune / LoRA на ассетах Häcker (каталог + Navigram 3D как датасет). Пайплайн: сбор/чистка данных → обучение → оценка качества. Рантайм-связка: depth/normal из three.js → своя модель (вместо/поверх generic ControlNet/FLUX на fal.ai).', doc: 'ai-strategy', deps: ['aiarch', 'hkimport'] },

  // ── Фаза 2 — Живой шкаф (демо) ──
  { id: 'procedural', lane: 'geo', iter: 'i2', title: 'Сборка корпуса по размеру',
    hook: 'Сердце гибрида: корпус собирается из панелей под любой размер.',
    plain: 'Программа строит корпус шкафа из панелей по заданным размерам, ставит фурнитуру по стандартной сетке и режет вырезы под мойку/варку. Это чистая функция «параметры → готовый шкаф».',
    note: 'build(): корпус из BoxGeometry-панелей + сетка 32 мм (фурнитура инстансами) + вырезы CSG (мойка/варка). Чистая функция параметры → геометрия. Сердце гибрида.', plate: 'hybrid', doc: 'catalog-architecture', deps: ['templates'] },
  { id: 'paramui', lane: 'fe', iter: 'i2', title: 'Ползунки параметров',
    hook: 'Двигаешь ползунок — шкаф меняется на глазах.',
    plain: 'Простые ползунки: ширина, число ящиков, сторона петли. Меняешь — модуль перестраивается вживую. Это и есть «вау-демо» для заказчика.',
    note: 'Слайдеры: ширина / число ящиков / сторона петли → модуль перестраивается вживую.', doc: 'catalog-architecture', deps: ['templates'] },
  { id: 'configux', lane: 'design', iter: 'i2', title: 'UX конфигуратора',
    hook: 'Делаем так, чтобы крутить параметры было приятно и понятно.',
    plain: 'Продумываем, как человек выбирает параметры и как выглядят карточки каталога — чтобы было интуитивно, без инструкции.',
    note: 'Как пользователь крутит параметры; вид карточек каталога.', doc: 'catalog-architecture', deps: ['concept'] },
  { id: 'geotests', lane: 'qa', iter: 'i2', title: 'Тесты геометрии',
    hook: 'Проверяем размеры шкафа числами — быстро и без 3D.',
    plain: 'Авто-проверки: подаём числа на вход, сверяем размеры и позиции на выходе. Дёшево, надёжно, ловит ошибки сборки сразу.',
    note: 'build() под тестами: числа на вход → размеры/позиции на выход, без WebGL. Дёшево и надёжно.', doc: 'catalog-architecture', deps: ['procedural'] },
  { id: 'hkgeo', lane: 'geo', iter: 'i2', title: '3D-формы из Häcker',
    hook: 'Тяжёлая часть: достаём формы шкафов из старого редактора.',
    plain: 'Формы шкафов Häcker спрятаны как скрипты-логика внутри старого редактора (аймос). Аккуратно переносим их в наш сборщик геометрии и сверяем форму. С этого начинается «тяжёлая» часть миграции.',
    note: 'Геометрия живёт в imos .nfx (DSL hold/subscribe/position/combine/configurator) + itemFlexMapping.parameters; 3D-ассеты — в Navigram (navCategory). Маппинг в CabinetTemplate; сложные/угловые — fallback static-mesh из GLB.', plate: 'migration-easy-hard', doc: 'migration', deps: ['templates', 'hkimport'] },
  { id: 'aivalid', lane: 'ai', iter: 'i2', title: 'Песочница валидации ИИ',
    hook: 'Строим проверку, через которую проходит каждый ответ ИИ.',
    plain: 'Превращаем продуманный в Фазе 0 подход в реальную защиту: каждый ответ ассистента проверяется нашими правилами (размеры, совместимость), а тесты ловят расхождения. Так ИИ становится полезным и безопасным ещё до того, как попадёт в демо.',
    note: 'Harness валидации: rules-engine проверяет { template_id, parameters }; контракт tool-calling под тестами; фикстуры «плохих» ответов; авто-проверка договора ИИ↔правила. Готовит надёжный запуск ассистента в Фазе 3.', plate: 'ai-roles', doc: 'ai-strategy', deps: ['aiarch'] },

  // ── Фаза 3 — Каталог + ИИ (демо) ──
  { id: 'catalogmodel', lane: 'be', iter: 'i3', title: 'Товары, правила и цены',
    hook: 'Товар каталога = шаблон с зафиксированными параметрами.',
    plain: 'Каждый товар — это шаблон + фикс-параметры + отделка + артикул. Движок правил (допустимые размеры, шаг сетки, совместимость фасада и корпуса) — главный судья и источник истины. Цены подключаются отдельно.',
    note: 'SKU = шаблон + фикс-параметры + отделка + артикул (пресет). Движок правил: диапазоны, снап к сетке, совместимость фасад↔корпус — источник истины и финальный валидатор. Прайс — подключаемая заглушка.', plate: 'three-layers', doc: 'catalog-architecture', deps: ['catalogdata', 'procedural'] },
  { id: 'assistant', lane: 'ai', iter: 'i3', title: 'Ассистент (ИИ)',
    hook: 'ИИ добавляет модули, но строго в рамках наших правил.',
    plain: 'Ассистент не «перерисовывает всё заново», а заполняет параметры известного шаблона; наш движок правил проверяет каждый ответ. Так ИИ полезен и при этом не наошибается.',
    note: 'Strict tool-calling: { template_id, parameters } вместо «весь слепок заново». Валидация — нашим движком правил (из песочницы Фазы 2). claude-opus-4-8, Structured Outputs.', plate: 'ai-roles', doc: 'ai-strategy', deps: ['catalogmodel', 'aivalid'] },
  { id: 'assistui', lane: 'fe', iter: 'i3', title: 'Подключение ассистента',
    hook: 'Связываем ответы ИИ и выбор готовых пресетов со сценой.',
    plain: 'Делаем интерфейс выбора готовых вариантов и применяем ответы ассистента прямо на 3D-сцене.',
    note: 'UI выбора пресетов, применение ответов ассистента к сцене.', doc: 'ai-strategy', deps: ['catalogmodel'] },
  { id: 'modeltests', lane: 'qa', iter: 'i3', title: 'Тесты правил и ИИ',
    hook: 'Проверяем, что правила и ответы ИИ всегда согласованы.',
    plain: 'Авто-проверки на допустимые размеры, шаг сетки, совместимость и на «договор» с ассистентом — чтобы ИИ и правила не расходились.',
    note: 'Диапазоны / сетка / совместимость + контракт tool-calling.', doc: 'ai-strategy', deps: ['catalogmodel'] },
  { id: 'hkverify', lane: 'qa', iter: 'i3', title: 'Сверка миграции 1-в-1',
    hook: 'Проверяем, что новое = старое на реальных заказах.',
    plain: 'Гоняем реальные заказы через старую и новую систему и сверяем результат: размеры, цена, состав. Так «гарантированная миграция» становится проверяемой, а не обещанием на словах.',
    note: 'Golden-file diff реальных заказов (раскрой / цена / состав) + параллельный прогон с реконсиляцией. Закрыть 13 несходящихся артикулов до заявления «без потерь». Единицы: каталог мм (целые) ↔ геометрия метры (дробные), множитель ×1000.', plate: 'guaranteed-migration', doc: 'migration', deps: ['hkimport', 'catalogmodel'] },

  // ── Фаза 4 — Полный каталог + кастом (демо) ──
  { id: 'families', lane: 'geo', iter: 'i4', title: 'Остальные типы шкафов',
    hook: 'Расширяем шаблоны на навесные, высокие и угловые шкафы.',
    plain: 'Добавляем шаблоны на другие типы. Самые сложные (угловые) при необходимости остаются готовой моделью — как делают и лидеры рынка.',
    note: 'Шаблоны wall / tall / corner. Угловые — fallback в static-mesh при сложной геометрии (как KD Max).', doc: 'catalog-architecture', deps: ['procedural'] },
  { id: 'custom', lane: 'be', iter: 'i4', title: 'Нестандартные размеры',
    hook: 'Разрешаем нестандартные размеры — но в рамках правил.',
    plain: 'Заказчик может задать свой размер в допустимых пределах; правила следят за корректностью. Решаем и что делать с уже поставленными шкафами при правке шаблона.',
    note: 'Нестандартные размеры в рамках правил + политика «правка шаблона → размещённые экземпляры».', doc: 'catalog-architecture', deps: ['catalogmodel'] },
  { id: 'customui', lane: 'fe', iter: 'i4', title: 'Ввод нестандартных размеров',
    hook: 'Поле ввода размера с живой проверкой по правилам.',
    plain: 'Человек вводит нестандартный размер и сразу видит, допустим ли он — без догадок.',
    note: 'Ввод нестандартных размеров с живой валидацией по правилам.', doc: 'catalog-architecture', deps: ['paramui'] },
  { id: 'e2e', lane: 'qa', iter: 'i4', title: 'Проверка сборки целиком',
    hook: 'Прогоняем сквозной сценарий: от каталога до собранной кухни.',
    plain: 'Авто-тест проходит весь путь — перетащить из каталога, собрать кухню из шаблонов, проверить, что всё сошлось.',
    note: 'Drag из каталога → собрать кухню из шаблонов → проверить сквозной сценарий.', doc: 'roadmap-product' },
  { id: 'hkcnc', lane: 'be', iter: 'i4', title: 'Команды для станков (ЧПУ)',
    hook: 'Самое тяжёлое и последнее: команды станкам — со сверкой byte-to-byte.',
    plain: 'Команды, по которым станки на заводе режут детали, в выгрузке отсутствуют — их надо вынуть из живого старого редактора, пока его не выключили. Переносим их последними и сверяем 1-в-1, чтобы завод получал ровно то же.',
    note: 'optionGcodeMapping = вызовы макросов gcode(prog,param); тела программ — в постпроцессоре imos, не выгружены. Вынуть из живого imos до sunset; byte-level parity перед заменой постов; нестинг свой (Deepnest/SVGnest), посты — в последнюю очередь. Уточнить формат станков (G-код vs Homag/woodWOP).', doc: 'migration', deps: ['hkgeo', 'families'] },

  // ── Фаза 5 — ИИ-контент ──
  { id: 'aicontent', lane: 'ai', iter: 'i5', title: 'ИИ-наполнение и свои фотопревью',
    hook: 'ИИ ускоряет наполнение каталога и делает фотокартинки своей моделью.',
    plain: 'Черновики шаблонов и товаров из прайс-листа (под проверкой человека), плюс фотореалистичные превью по 3D-форме — уже своей обученной моделью из Фазы 1. Геометрия — наша, красивая картинка — за ИИ.',
    note: 'Dev-time: черновики шаблонов/пресетов из прайс-листа (под ревью). Runtime: depth/normal из three.js → своя fine-tune модель (из airender), fallback ControlNet/FLUX на fal.ai. Геометрия — наша, вид — диффузия.', plate: 'ai-roles', doc: 'ai-strategy', deps: ['families', 'airender'] },
  { id: 'batchgen', lane: 'be', iter: 'i5', title: 'Конвейер моделей',
    hook: 'Фабрика: оптимизация деталей, пакетные превью, экспорт.',
    plain: 'Сервис пакетно готовит 3D-детали (сжатие, превью), импортирует данные производителя и по запросу выгружает целую модель кухни в нужном формате.',
    note: 'Конвейер: оптимизация ассетов (Draco/KTX2), пакетные превью, импорт данных производителя, on-demand экспорт целой модели (GLB/STEP).', doc: 'backend-services', deps: ['aicontent'] },
  { id: 'previewstyle', lane: 'design', iter: 'i5', title: 'Стиль фотопревью',
    hook: 'Настраиваем, как именно выглядят сгенерированные картинки.',
    plain: 'Подбираем стиль и настройки генерации, чтобы превью были на бренд и единообразны.',
    note: 'style-prompt на пресет, настройки ControlNet.', doc: 'ai-strategy' },
];

const byId = (id) => TASKS.find((t) => t.id === id);

/* ── render ── */
export function mountBoard(root) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';

  const cols = ITERATIONS.length;
  const html = [];
  html.push(`<div class="board-intro">
    <h1>План работ — что делаем и в каком порядке</h1>
    <p>Слева направо — <b>фазы</b> проекта. Строки — <b>роли</b> команды. Карточки в одной колонке идут
       <b>параллельно</b>; значок <span class="stopper-key">⛔</span> и стрелки — <b>зависимости</b> (стоперы:
       сначала одно, потом другое). Внизу каждой фазы — <b>что покажем заказчику</b>.
       <br>Наведи на карточку — короткая подсказка. <b>Кликни</b> — понятное объяснение и ссылка на документ.</p>
    <div data-plate="read-board" data-caption="Как читать эту доску"></div>
    <div class="board-toolbar">
      <span class="tb-label">Стрелки-зависимости</span>
      <div class="seg"><button class="tb-seg" data-mode="select">при выборе</button><button class="tb-seg" data-mode="always">всегда</button></div>
      <span class="tb-label" style="margin-left:10px">Масштаб</span>
      <div class="seg"><button class="zoom-btn" data-z="out" title="отдалить">−</button><button class="zoom-btn" data-z="in" title="приблизить">+</button></div>
      <button class="zoom-btn fitbtn" data-z="fit" title="показать все фазы">уместить всё</button>
      <span class="tb-hint">тащи — двигать · колесо — масштаб</span>
    </div>
  </div>`);

  html.push(`<div class="board-scroll"><div class="board-grid" style="grid-template-columns:200px repeat(${cols},300px)">`);

  html.push(`<div class="g-corner">роли&nbsp;\\&nbsp;фазы</div>`);
  ITERATIONS.forEach((it) => {
    html.push(`<div class="g-head${it.demo ? ' demo' : ''}">
      <div class="ih-top"><span class="ih-name">${it.name}</span><span class="ih-weeks">${it.weeks}</span></div>
      <div class="ih-sub">${it.sub}</div>
      <div class="ih-why">${it.why}</div>
    </div>`);
  });

  LANES.forEach((lane) => {
    html.push(`<div class="g-lane"><span class="gl-icon">${lane.icon}</span>${lane.label}</div>`);
    ITERATIONS.forEach((it) => {
      const tasks = TASKS.filter((t) => t.lane === lane.id && t.iter === it.id);
      const cell = tasks.map((t) => `
        <button class="task" data-task="${t.id}" data-lane="${lane.id}" title="${(t.hook || '').replace(/"/g, '&quot;')}">
          ${t.deps ? '<span class="t-stop" title="есть зависимость">⛔</span>' : ''}
          <span class="t-title">${t.title}</span>
        </button>`).join('');
      html.push(`<div class="g-cell" data-iter="${it.id}" data-lane="${lane.id}">${cell}</div>`);
    });
  });

  html.push(`<div class="g-lane out"><span class="gl-icon">★</span>Что покажем</div>`);
  ITERATIONS.forEach((it) => {
    html.push(`<div class="g-out${it.demo ? ' demo' : ''}">
      ${it.demo ? '<span class="demo-badge">★ показать заказчику</span>' : '<span class="demo-badge muted">внутренний</span>'}
      <div class="out-text">${it.output}</div>
    </div>`);
  });

  html.push(`<svg class="dep-layer" aria-hidden="true"></svg></div></div>`);

  html.push(`<div class="parking"><h2>За горизонтом (на потом)</h2><div class="park-cards">${
    PARKING.map((p) => `<button class="park" data-doc="${p.doc}"><b>${p.title}</b><span>${p.note}</span></button>`).join('')
  }</div></div>`);

  root.innerHTML = html.join('');

  let drawer = document.getElementById('task-drawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'task-drawer';
    drawer.hidden = true;
    document.body.appendChild(drawer);
  }

  const openTask = (id) => {
    const t = byId(id);
    if (!t) return;
    const lane = LANES.find((l) => l.id === t.lane);
    const it = ITERATIONS.find((i) => i.id === t.iter);
    const deps = (t.deps || []).map(byId).filter(Boolean);
    drawer.innerHTML = `
      <button class="dr-close" aria-label="закрыть">✕</button>
      <div class="dr-tags"><span class="dr-lane">${lane.icon} ${lane.label}</span><span class="dr-iter">${it.name} · ${it.weeks}</span></div>
      <h3>${t.title}</h3>
      ${t.hook ? `<p class="dr-hook">${t.hook}</p>` : ''}
      <p class="dr-note">${t.plain || t.note}</p>
      ${t.plate ? `<div class="dr-plate">${plate(t.plate)}</div>` : ''}
      ${deps.length ? `<div class="dr-deps"><span class="dr-deps-h">⛔ Сначала нужно закрыть:</span>${
        deps.map((d) => `<button class="dr-dep" data-task="${d.id}">${d.title}</button>`).join('')
      }</div>` : ''}
      <div class="dr-demo${it.demo ? '' : ' muted'}"><span class="dr-h">${it.demo ? 'Что покажем заказчику в этой фазе' : 'Внутренний результат фазы'}</span>${it.output}</div>
      ${t.note ? `<div class="dr-block"><span class="dr-h">Детали (для технарей)</span><p>${t.note}</p></div>` : ''}
      ${t.doc ? `<a class="dr-doc" href="#/doc/${t.doc}">Открыть подробный документ →</a>` : ''}`;
    drawer.hidden = false;
    drawer.classList.add('open');
    highlightChain(id);
  };
  const closeDrawer = () => { drawer.classList.remove('open'); drawer.hidden = true; clearHighlight(); };

  root.addEventListener('click', (e) => {
    const task = e.target.closest('.task');
    if (task) { openTask(task.dataset.task); return; }
    const park = e.target.closest('.park');
    if (park) { location.hash = `#/doc/${park.dataset.doc}`; }
  });
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('.dr-close')) { closeDrawer(); return; }
    const dep = e.target.closest('.dr-dep');
    if (dep) openTask(dep.dataset.task);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

  const grid = root.querySelector('.board-grid');
  const svg = root.querySelector('.dep-layer');
  const NS = 'http://www.w3.org/2000/svg';

  let depMode = localStorage.getItem('boardDepMode') === 'always' ? 'always' : 'select';
  const applyMode = () => {
    svg.setAttribute('class', 'dep-layer mode-' + depMode);
    root.querySelectorAll('.tb-seg').forEach((b) => b.classList.toggle('on', b.dataset.mode === depMode));
  };
  root.querySelectorAll('.tb-seg').forEach((b) => b.addEventListener('click', () => {
    depMode = b.dataset.mode; localStorage.setItem('boardDepMode', depMode); applyMode();
  }));

  function pos(el) {
    // offset-based: layout-пиксели относительно grid — не зависят от зума/трансформа panzoom,
    // поэтому стрелки совпадают с карточками при любом масштабе.
    const x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    return { left: x, right: x + w, top: y, bottom: y + h, cx: x + w / 2, midY: y + h / 2 };
  }

  function pathFor(a, b) {
    const pa = pos(a), pb = pos(b);
    if (Math.abs(pa.left - pb.left) < 60) {
      const down = pb.midY > pa.midY;
      const x1 = pa.cx, x2 = pb.cx;
      const y1 = down ? pa.bottom : pa.top;
      const y2 = down ? pb.top - 8 : pb.bottom + 8;
      const my = (y1 + y2) / 2;
      return `M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
    }
    const rightward = pb.cx >= pa.cx;
    const x1 = rightward ? pa.right : pa.left;
    const x2 = rightward ? pb.left - 8 : pb.right + 8;
    const dx = Math.max(34, Math.abs(x2 - x1) * 0.5) * (rightward ? 1 : -1);
    return `M${x1} ${pa.midY} C ${x1 + dx} ${pa.midY}, ${x2 - dx} ${pb.midY}, ${x2} ${pb.midY}`;
  }

  function drawDeps() {
    svg.innerHTML = `<defs>
      <marker id="dep-faint" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 1 L8 4.5 L0 8 z" fill="rgba(179,80,42,.5)"/></marker>
      <marker id="dep-hot" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 1 L8 4.5 L0 8 z" fill="#b3502a"/></marker>
    </defs>`;
    svg.setAttribute('width', grid.scrollWidth);
    svg.setAttribute('height', grid.scrollHeight);
    TASKS.forEach((t) => {
      (t.deps || []).forEach((depId) => {
        const a = root.querySelector(`.task[data-task="${depId}"]`);
        const b = root.querySelector(`.task[data-task="${t.id}"]`);
        if (!a || !b) return;
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', pathFor(a, b));
        p.setAttribute('class', 'dep-path');
        p.dataset.from = depId; p.dataset.to = t.id;
        svg.appendChild(p);
      });
    });
  }

  const chainPaths = (id) => svg.querySelectorAll(`.dep-path[data-to="${id}"], .dep-path[data-from="${id}"]`);
  function showChainArrows(id) {
    svg.querySelectorAll('.dep-path.hot').forEach((p) => p.classList.remove('hot'));
    chainPaths(id).forEach((p) => p.classList.add('hot'));
  }
  function clearArrows() {
    svg.querySelectorAll('.dep-path.hot').forEach((p) => p.classList.remove('hot'));
  }
  function highlightChain(id) {
    root.querySelectorAll('.task').forEach((el) => el.classList.add('dim'));
    const keep = new Set([id, ...((byId(id)?.deps) || [])]);
    TASKS.forEach((t) => { if ((t.deps || []).includes(id)) keep.add(t.id); });
    keep.forEach((k) => root.querySelector(`.task[data-task="${k}"]`)?.classList.remove('dim'));
    showChainArrows(id);
  }
  function clearHighlight() {
    root.querySelectorAll('.task.dim').forEach((el) => el.classList.remove('dim'));
    clearArrows();
  }

  root.addEventListener('mouseover', (e) => {
    const t = e.target.closest('.task');
    if (t && !t.contains(e.relatedTarget) && !drawer.classList.contains('open')) showChainArrows(t.dataset.task);
  });
  root.addEventListener('mouseout', (e) => {
    const t = e.target.closest('.task');
    if (t && !t.contains(e.relatedTarget) && !drawer.classList.contains('open')) clearArrows();
  });

  applyMode();
  drawDeps();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDeps);
  requestAnimationFrame(drawDeps);
  setTimeout(drawDeps, 400);
  window.addEventListener('resize', drawDeps);

  // ── канва с пан/зумом (как стенды): колесо — масштаб, тащить — двигать ──
  const scroller = root.querySelector('.board-scroll');
  grid.classList.add('pz');
  const MAXZOOM = 1.8, MINH = 320;
  const maxH = () => Math.round((window.innerHeight || 800) * 0.82);
  // предел отдаления = масштаб, при котором все фазы влезают по ширине;
  // дальше отдалять нельзя (иначе вокруг борды появляются пустые поля).
  const fitScale = () => {
    const vw = scroller.clientWidth || 800, gw = grid.scrollWidth || 1;
    return Math.min(1, (vw - 4) / gw);
  };
  let pz;
  // высота канвы = высота содержимого НА ТЕКУЩЕМ масштабе → пустот по вертикали нет
  const syncHeight = () => {
    const s = pz ? pz.getTransform().scale : 1;
    scroller.style.height = Math.max(MINH, Math.min(grid.scrollHeight * s, maxH())) + 'px';
  };
  const makePanzoom = () => {
    if (pz) pz.dispose();
    pz = panzoom(grid, {
      maxZoom: MAXZOOM, minZoom: fitScale(), zoomDoubleClickSpeed: 1,
      bounds: true, boundsPadding: 0.05,
      beforeWheel: () => false,            // колесо всегда масштабирует
      beforeMouseDown: (e) => !!e.target.closest('.task'), // клик по карточке не «тащит» холст
    });
    pz.on('transform', syncHeight);
    syncHeight();
  };
  makePanzoom();
  const fitAll = () => { pz.zoomAbs(0, 0, fitScale()); pz.moveTo(0, 0); syncHeight(); drawDeps(); };
  const zoomBy = (factor) => {
    const t = pz.getTransform();
    const cx = (scroller.clientWidth || 600) / 2, cy = (scroller.clientHeight || 300) / 2;
    pz.zoomAbs(cx, cy, Math.max(fitScale(), Math.min(MAXZOOM, t.scale * factor)));
    syncHeight();
  };
  root.querySelectorAll('.zoom-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.z === 'in') zoomBy(1.25);
    else if (b.dataset.z === 'out') zoomBy(0.8);
    else fitAll();
  }));
  // ресайз меняет предел отдаления — пересобираем panzoom и перерисовываем стрелки
  let rzT;
  window.addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => { makePanzoom(); drawDeps(); }, 150);
  });

  root._drawDeps = drawDeps;
}
