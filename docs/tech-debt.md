# Техдолг прототипа: инвентаризация и приоритеты

> Честный список того, что стоит привести в порядок, **по реальному коду** (а не
> общие советы). Для планирования: с серьёзностью, грубой оценкой усилий и связью
> с задачами по каталогу/AI.
>
> ⚠️ Числа (размеры файлов, счётчики импортов) получены автоматическим обзором
> кодовой базы — точные значения стоит сверить перед тем, как закладывать в спринт.
> Оценки усилий — грубый порядок (идеальные человеко-дни одного разработчика).
>
> Связанные доки: [catalog-architecture.md](catalog-architecture.md) ·
> [roadmap-product.md](roadmap-product.md) · [architecture.md](architecture.md)

---

## TL;DR — топ-10 по приоритету

Ранжировано по «насколько блокирует развитие × риск × усилия».

| # | Долг | Серьёзность | Усилия | Связь |
|---|---|:---:|:---:|---|
| 1 | Каталог захардкожен, нет API-слоя и версионирования | 🔴 high | ~5–8 дн | [catalog-arch §1,§6](catalog-architecture.md#1-проблема-почему-один-glb-на-sku-не-масштабируется) |
| 2 | Фриз компиляции шейдеров лечится воркэраундом, не корнем | 🔴 high | ~3–5 дн | [catalog-arch §5](catalog-architecture.md#5-как-это-рендерится-и-почему-это-лечит-наш-фриз) |
| 3 | Связанность `scene/` ↔ `features/` нарушает границу слоёв | 🔴 high | ~4–6 дн | [architecture.md](architecture.md) |
| 4 | `orchestrator.tsx` ~1849 строк, 0 тестов (god-файл демо) | 🔴 high | ~4–5 дн | — |
| 5 | AI-transition + reveal: сложность, untracked `reveal/`, прогрев не внедрён | 🟠 med | ~4–6 дн | [memory: shader-prewarm spec] |
| 6 | Хрупкие тесты: SKU-строки захардкожены в 14+ файлах | 🟠 med | ~2–3 дн | #1 |
| 7 | `trunk-branch.ts` ~838 строк, 48 констант (роутинг коммуникаций) | 🟠 med | ~3–4 дн | — |
| 8 | Тонкое покрытие тестами R3F-слоя (`scene/`, меши, камеры) | 🟠 med | ~4–6 дн | — |
| 9 | `editor-store` разрастается (~60 действий, 5 слайсов) | 🟡 watch | ~2–3 дн | — |
| 10 | Пробелы в E2E: Phase 8 (8.19/8.20), Phase 10, нет мульти-шаговых сценариев | 🟠 med | ~4–5 дн | [roadmap.md](roadmap.md) |

---

## 1. Каталог — захардкоженность 🔴

Главный долг, он же — повод для всей работы по [catalog-architecture.md](catalog-architecture.md).

| Находка | Серьёзность | Где |
|---|:---:|---|
| 61 SKU захардкожены в одном файле ~900 строк, по статичному GLB на каждый | high | [`src/shared/mocks/catalog.ts`](../src/shared/mocks/catalog.ts) |
| Нет API-шлюза — `useQuery` просто возвращает `MOCK_CATALOG`; есть `TODO(#phase-8)` про реальный API | high | [`src/features/catalog-picker/api/catalog-queries.ts:9`](../src/features/catalog-picker/api/catalog-queries.ts) |
| Отделки дублируются в каждой записи через массив `CABINET_FINISHES` | med | `catalog.ts` + [`src/shared/mocks/materials-catalog.ts`](../src/shared/mocks/materials-catalog.ts) |
| Нет версионирования схемы каталога — нельзя аккуратно добавить поле/снять SKU | med | [`src/entities/catalog/model/schema.ts`](../src/entities/catalog/model/schema.ts) |
| Скрипты `export-catalog-json` / `validate-models` / `validate-catalog-bounds` существуют, но непонятно, в CI ли они | low | `scripts/` |

**Лечится** переходом к модели «шаблон + пресеты» (см. catalog-architecture §6): текущий `CatalogItem` становится частным случаем `static-mesh`-шаблона, появляется единая точка получения геометрии и слой данных, отделённый от движка.

---

## 2. Фриз компиляции шейдеров — лечится симптоматически 🔴

Известная проблема (см. memory `shader-compile-freeze-transitions`): синхронная компиляция WebGL-программ даёт фриз 1–2 с на переходах/загрузке.

| Находка | Серьёзность | Где |
|---|:---:|---|
| Воркэраунд-семафор ограничивает число одновременных парсов GLB (`MAX_CONCURRENT_MODULE_GLB_LOADS=3`), но **не устраняет корень** | high | [`src/scene/kitchen/lib/module-load-semaphore.ts`](../src/scene/kitchen/lib/module-load-semaphore.ts), [`hooks/use-module-load-slot`](../src/scene/kitchen/hooks/) |
| Троттлинг по уникальным URL зависит от времени жизни кэша drei и точного совпадения URL — хрупко | med | там же |
| Спека прогрева шейдеров есть, внедрение неясно | med | [`docs/superpowers/specs/2026-06-21-shader-prewarm-ai-transition-design.md`](superpowers/specs/2026-06-21-shader-prewarm-ai-transition-design.md) |

**Корневое лечение** (ровно то, что даёт переход к параметрике, catalog-arch §5): малая фиксированная палитра общих `MeshStandardMaterial`, плейсхолдер-текстуры вместо `null`, прогрев `compileAsync` перед показом. Полевой кейс: 3.5 с → 0.85 с.

---

## 3. Связанность слоёв `scene/` ↔ `features/` 🔴

`architecture.md` декларирует: `scene/` — только R3F, `features/` — только DOM, без взаимных «залезаний во внутренности». Обзор показал расхождение:

| Находка | Серьёзность | Детали |
|---|:---:|---|
| ~98 импортов `useEditorStore` внутри `src/scene/` | med | Сцена напрямую читает/пишет UI-состояние вместо props/контекста |
| ~28 импортов внутренностей `scene/` в `src/features/` | high | Напр. `features/ai-chat` тянет `useAiTransitionStore`; `features/demo-scenario/orchestrator` дёргает `setCameraState` из canvas-lib |
| Камера-мост экспортирует императивный API в features | med | [`src/scene/canvas/lib/camera-bridge.ts`](../src/scene/canvas/lib/) — используют demo/day-cycle/render-mode |

**Риск:** труднее тестировать, раздувается бандл, ломается изоляция DOM/WebGL. **Лечение:** ESLint-boundaries (упоминаются в architecture.md §5) + инъекция зависимостей/контекст вместо прямых импортов.

---

## 4. God-файлы и крупные модули 🔴🟠

Топ кандидатов на декомпозицию (размеры — из обзора, сверить):

| Файл | ~строк | Проблема |
|---|---:|---|
| [`features/demo-scenario/lib/orchestrator.tsx`](../src/features/demo-scenario/lib/) | ~1849 | God-компонент: камера + чат + render-mode + стор + installation в одном файле, **0 тестов**. Единая точка отказа демо. |
| [`entities/kitchen/lib/run-to-3d.ts`](../src/entities/kitchen/lib/run-to-3d.ts) | ~1379 | Ядро «данные → 3D», хорошо покрыто тестами, но плотное. |
| [`features/installation-plan/lib/routing/trunk-branch.ts`](../src/features/installation-plan/lib/routing/) | ~838 | Роутинг коммуникаций (DIN), 48 хардкод-констант, вложенные if/else. Трудно расширять. |
| [`features/editor-shell/ui/InstallationPanel.tsx`](../src/features/editor-shell/ui/) | ~687 | UI + состояние + PDF-экспорт в одном. |
| [`scene/kitchen/meshes/ModuleGLBModel.tsx`](../src/scene/kitchen/meshes/) | ~549 | Загрузка GLB + материалы + dissolve + outline, **без тестов**. |

**Лечение:** для `orchestrator.tsx` — вынести FSM в отдельную машину (XState уже используется в demo-machine) + адаптеры для камеры/чата/стора, добавить тесты *до* рефактора. Для `trunk-branch.ts` — вынести правила/константы в данные.

---

## 5. AI-transition + reveal — сложность и незавершённость 🟠

Активная подсистема переходов при AI-патче. Хорошо спроектирована, но:

| Находка | Серьёзность | Где |
|---|:---:|---|
| Untracked папка `reveal/` (новый event-driven scheduler) — не в git на момент обзора | med | `src/scene/shared/reveal/` (`reveal-scheduler.ts` ~277, `use-reveal-ticket.ts` ~161) |
| Reveal-scheduler слабо покрыт (1 тест-файл); хук интеграции почти не тестируется | med | там же |
| Тайминги размазаны по 3 местам: `ai-transition-config`, reveal-scheduler, `sequenced-transition` — сложно рассуждать о сквозном тайминге | med | `src/scene/shared/ai-transition/`, `reveal/` |
| Прогрев/preload шейдеров по спеке не внедрён (см. #2) | med | — |

`ai-transition-store.ts` (~620 строк) — по сути машина состояний внутри Zustand-стора; кандидат на вынос в XState.

> Примечание: судя по git-статусу, по `ai-transition` сейчас идёт активная работа и есть незакоммиченная папка `reveal/` — стоит закоммитить/прибраться, чтобы зафиксировать состояние.

---

## 6. Покрытие тестами — где тонко 🟠

Общая картина здоровая: ~232 тест-файла на ~797 исходников, 12 e2e. Сильно покрыто `entities/kitchen/lib` и `entities/room/lib` (чистые функции). Тонко:

| Область | Сигнал |
|---|---|
| `scene/` R3F-компоненты (меши, камеры) | ⚠️ `ModuleGLBModel.tsx` ~549 строк — без тестов; меши покрыты базово |
| `features/demo-scenario` | ⚠️ `orchestrator.tsx` без тестов |
| `entities/snapshot/model` (migrate/validate) | ⚠️ тонко |
| E2E мульти-шаговые сценарии | ⚠️ нет (drag → undo → AI-чат → render) |
| Roadmap-задачи | Phase 8 E2E 8.19/8.20 и Phase 10 — заявлены, но отсутствуют ([roadmap.md](roadmap.md)) |

---

## 7. Состояние и архитектура стора 🟡

- **`editor-store`** — ~60 действий в 5 слайсах (snapshot/history/selection/placement/ui-settings). Пока не запах, но близко к пределу одного стора; следить, при росте >1000 строк — делить по доменам (Scene vs UI).
- **Undo/Redo** — ручной стек, лимит `MAX_UNDO_HISTORY=50`; drag-drop размещения, судя по обзору, **не** трекаются — проверить.
- **XState** используется только в `demo-machine.ts` (~481 строк) — остальное на Zustand. Несогласованность подходов; кандидаты на машины: ai-transition, reveal.

---

## 8. Прочие запахи 🟡

| Находка | Серьёзность | Где |
|---|:---:|---|
| Разбросанные fallback `widthMm ?? 600` | med | `scene/kitchen/AppliancesInScene.tsx:183`, `KitchenModule.tsx:155`, `use-module-drag.ts` (неск.) — лечится требованием non-null в схеме + общей константой |
| Нет поля `schemaVersion` в данных слепка (миграции есть, версии в данных нет) | med | [`entities/snapshot/model/`](../src/entities/snapshot/model/) |
| `@deprecated` помеченное, но непонятно, мигрированы ли потребители | low | `scene/lights/lib/center-top-point-light.ts:3`, `features/kitchen-editor/model/dnd-store.ts:28` |
| Дублирование паттернов применения отделки | med | `ModuleGLBModel`, `PaintableFinishSurfaceMaterial`, `CountertopMesh` |
| Императивный swap текстуры с пометкой «TODO if regression returns» | med | `scene/kitchen/KitchenRunGroup.tsx:97` |

---

## Как это встраивается в роадмап

Долг **не закрывается отдельным спринтом** — он вплетён в продуктовые фазы (см. [roadmap-product.md](roadmap-product.md)):

- Долг #1, #6 (каталог, хрупкие тесты) закрывается **в ходе** перехода к параметрике (фазы каталога).
- Долг #2 (шейдеры) закрывается **вместе** с переходом на палитру материалов параметрики.
- Долг #3, #4 (границы слоёв, god-файлы) — отдельный «фундаментный» рефактор перед масштабированием.
- Долг #5, #8, #10 (transitions, тесты, E2E) — фоновая линия «стабилизация».

> **Принцип:** не «неделя на техдолг», а «каждая продуктовая фаза оставляет код чище, чем взяла».
