# Roadmap: Планировщик кухни

Мастер-план реализации прототипа. Задачи разбиты на **фазы** — каждая фаза даёт рабочий инкремент, который можно показать.

**Связанные документы:**
- [architecture.md](architecture.md) — структура папок, стек, поток данных
- [kitchen-data-model.md](kitchen-data-model.md) — иерархия кухни, AI-контракт
- [room-plan-and-3d-schema.md](room-plan-and-3d-schema.md) — геометрия комнаты, 2D→3D
- [2d-mode-requirements.md](2d-mode-requirements.md) — требования к 2D-режиму
- [mobile-first.md](mobile-first.md) — мобильная ориентация
- [editor-ux.md](editor-ux.md) — UX-стратегия: 3D-редактор, а не веб-UI
- [tdd.md](tdd.md) — TDD-процесс

**Принципы:**
- Каждая фаза — **вертикальный срез** (данные + UI + тесты)
- TDD: тест → реализация → рефакторинг
- Mobile first: проверка на телефоне после каждой фазы

**Текущий фокус:** 3D-редактор кухни. 2D-редактор комнаты (Фаза 4) отложен — используем **мок-данные** готовой планировки.

---

## Фаза 0: Фундамент (Bootstrap)

**Цель:** рабочий репозиторий с инфраструктурой, можно запустить `npm run dev` и видеть пустой редактор.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | Vite + React + TypeScript (strict) | `vite.config.ts`, `tsconfig.json` | `npm run dev` работает |
| ✅ | Tailwind CSS v4 + `cn()` | `@tailwindcss/vite`, `shared/lib/cn.ts` | Классы применяются |
| ✅ | Структура папок | `app/`, `entities/`, `features/`, `scene/`, `shared/` | Соответствует architecture.md |
| ✅ | Vitest + Testing Library | `vite.config.ts`, тест-заглушка | `npm test` проходит |
| ✅ | Playwright (e2e) | `playwright.config.ts`, `e2e/smoke.spec.ts` | Smoke-тест открывает страницу |
| ✅ | ESLint + Prettier | `eslint.config.js` | `npm run lint` без ошибок |
| ✅ | `.env.example` + типобезопасный env | `shared/config/env.ts` | Тест на валидацию env |
| ✅ | README | `README.md` | Инструкции: dev, test, e2e |

**Результат фазы:** Пустая страница с заголовком "Kitchen Planner", тесты зелёные.

---

## Фаза 1: Контракты данных (Schemas)

**Цель:** zod-схемы всех сущностей, типы, начальный слепок. Можно писать тесты на данные.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | Единицы измерения | `shared/lib/units.ts` | Функции `mmToMeters`, `metersToMm` + тесты |
| ✅ | Генерация ID | `shared/lib/ids.ts` | `createEntityId()` + fallback без `randomUUID` |
| ✅ | **Room schema** | `entities/room/model/schema.ts` | zod: segments, openings, utilities + тесты |
| ✅ | **Kitchen schema** | `entities/kitchen/model/schema.ts` | zod: runs, rows, modules + тесты |
| ✅ | **Module roles** | `entities/kitchen/model/roles.ts` | Enum `ModuleRole` + типы |
| ✅ | **Constraints** | `entities/kitchen/model/constraints.ts` | Правила размещения (типы, не логика) |
| ✅ | **Snapshot schema** | `entities/snapshot/model/schema.ts` | zod: `KitchenSnapshot` = room + kitchen + meta |
| ✅ | Миграции версий | `entities/snapshot/model/migrate.ts` | `migrateSnapshot(data)` + тест v0→v1 |
| ✅ | Семантическая валидация | `entities/snapshot/model/validate.ts` | `validateKitchenSemantics()` + тесты |
| ✅ | **Catalog schema** | `entities/catalog/model/schema.ts` | zod: SKU, габариты, палитра |
| ✅ | Мок каталога | `shared/mocks/catalog.ts` | 10 модулей разных ролей |
| ✅ | **Мок комнаты** | `shared/mocks/room.ts` | 4 стены, окно, дверь, 5 утилит |
| ✅ | **Мок слепка** | `shared/mocks/snapshot.ts` | L-образная кухня: 2 runs, 8 модулей |

**Результат фазы:** Все схемы с тестами, мок-комната для 3D-редактора готова.

---

## Фаза 2: Состояние (Store + Query)

**Цель:** Zustand-стор со слепком, TanStack Query для каталога. Данные живут в памяти.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | QueryClient + провайдеры | `app/providers/` | `AppProviders.tsx` оборачивает приложение |
| ✅ | **Editor store** | `features/editor-shell/model/editor-store.ts` | `snapshot`, `viewMode`, `selection` |
| ✅ | Действия стора: snapshot | Там же | `setSnapshot`, `replaceSnapshot` (для AI) |
| ✅ | Действия стора: room | Там же | `addSegment`, `updateSegment`, `removeSegment` |
| ✅ | Действия стора: kitchen | Там же | `addRun`, `addModule`, `updateModule`, `removeModule` |
| ✅ | Селекторы | Там же | `useSelectedModule`, `useCurrentRun`, и т.д. |
| ✅ | Тесты стора | `*.test.ts` рядом | Действия и селекторы без WebGL |
| ✅ | useQuery каталога | `features/catalog-picker/api/catalog-queries.ts` | Загрузка мока, loading/error состояния |
| ✅ | Undo/Redo | `editor-store.ts` | `undo()`, `redo()`, стек истории |

**Результат фазы:** Стор работает, можно программно менять слепок, Query отдаёт каталог.

---

## Фаза 3: Оболочка редактора (Shell)

**Цель:** Базовый UI: layout, панели, переключатель режимов. Mobile-first.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | Корневой layout | `features/editor-shell/ui/EditorShell.tsx` | Header + main + панели |
| 3.2 | ~~Переключатель Plan/3D~~ | — | Отложено (пока только 3D) |
| ✅ | Панель каталога | `features/catalog-picker/ui/CatalogPanel.tsx` | Список модулей из Query |
| ✅ | Панель свойств | `features/editor-shell/ui/PropertiesPanel.tsx` | Показывает selected module |
| ✅ | Safe area + touch targets | Все панели | Минимум 44×44 px, отступы iOS |
| ✅ | Скелетоны/ошибки | `shared/ui/` | Компоненты Skeleton, ErrorMessage |
| ✅ | Адаптивность | CSS/Tailwind | Работает на 375px ширины |
| ✅ | E2E: shell | `e2e/shell.spec.ts` | Переключение табов работает |

**Результат фазы:** UI-оболочка, можно переключать Plan/3D (пока пустые области).

---

## Фаза 4: План 2D (Room Editor) — ⏸️ ОТЛОЖЕНО

> **Статус:** Отложено на будущее. Сейчас используем мок-данные комнаты (готовая планировка).
> Когда понадобится редактирование комнаты — вернуться к этой фазе.
> Требования к 2D-режиму: [2d-mode-requirements.md](2d-mode-requirements.md)

<details>
<summary>Задачи (свёрнуто)</summary>

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| 4.1 | SVG-канвас плана | `features/plan-editor/ui/PlanCanvas.tsx` | Рендер viewBox, pan/zoom |
| 4.2 | Сетка | `features/plan-editor/lib/grid-lines.ts` | Адаптивная сетка от viewBox |
| 4.3 | Режимы: Draw/Pan/Select | `features/plan-editor/model/` | Состояние режима в сторе |
| 4.4 | Черчение сегментов | `features/plan-editor/ui/` | Клик → клик = сегмент |
| 4.5 | Snap к сетке и вершинам | `features/plan-editor/lib/snap.ts` | Функции + тесты |
| 4.6 | Ортогональный режим (Shift) | Там же | Привязка к 90° |
| 4.7 | Подписи длин стен | `features/plan-editor/ui/WallLabels.tsx` | Читаемый шрифт |
| 4.8 | HUD: живая длина при рисовании | `features/plan-editor/ui/DraftLengthHud.tsx` | Показывает мм |
| 4.9 | Точный ввод длины | Там же | Input + Apply |
| 4.10 | Выделение сегмента | `features/plan-editor/ui/` | Клик по стене = select |
| 4.11 | Редактирование длины | `features/plan-editor/ui/` | Изменение выбранного сегмента |
| 4.12 | Удаление сегмента | Там же | Delete/Backspace |
| 4.13 | **Проёмы: данные** | `entities/room/model/schema.ts` | `openings[]` в схеме |
| 4.14 | **Проёмы: UI** | `features/plan-editor/ui/OpeningTool.tsx` | Добавление окна/двери на стену |
| 4.15 | Проёмы: отображение | `features/plan-editor/ui/OpeningMarkers.tsx` | Визуализация на плане |
| 4.16 | Тесты геометрии | `features/plan-editor/lib/*.test.ts` | snap, пересечения, длины |
| 4.17 | E2E: рисование стены | `e2e/plan-editor.spec.ts` | Нарисовать прямоугольник |

**Результат фазы:** Можно нарисовать комнату с окнами/дверями на плане.

</details>

---

## Фаза 5: Сцена 3D (Room)

**Цель:** Отображение комнаты в 3D из данных плана.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | Canvas + провайдеры | `scene/canvas/SceneCanvas.tsx` | R3F Canvas, Suspense |
| ✅ | Маппинг 2D→3D | `entities/room/lib/plan-to-3d.ts` | Функции + тесты |
| ✅ | Пол | `scene/room/Floor.tsx` | Меш из bbox сегментов |
| ✅ | Стены | `scene/room/Walls.tsx` | Меши из сегментов |
| ✅ | Проёмы (визуально) | `scene/room/WallOpenings.tsx` | Glass-tinted boxes + door frames |
| 5.6 | Камеры: plan (ortho) | `scene/cameras/PlanCamera.tsx` | Вид сверху |
| ✅ | Камеры: 3D (perspective) | `scene/cameras/SceneCameras.tsx` | OrbitControls + GizmoHelper |
| 5.8 | Переключение камер | `scene/cameras/ViewCameras.tsx` | По viewMode из стора |
| ✅ | Touch-friendly controls | Камеры | Orbit/pan/zoom пальцем |
| ✅ | Освещение | `scene/lights/SceneLights.tsx` | Ambient + directional + hemisphere |
| ✅ | Согласование единиц | `entities/room/lib/plan-to-3d.ts` | mm в данных → meters в Three |
| ✅ | E2E: 3D комната | `e2e/scene-room.spec.ts` | Canvas присутствует, toolbar видим |

**Результат фазы:** Нарисованная комната видна в 3D.

---

## Фаза 6: Кухонный гарнитур — 3D визуализация (Kitchen 3D)

**Цель:** Отображение кухни в 3D из данных слепка: модули, столешница, фартук, цоколь, hover/selection.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | **3D: KitchenScene** | `scene/kitchen/KitchenScene.tsx` | Контейнер всех runs |
| ✅ | **3D: KitchenRun** | `scene/kitchen/KitchenRunGroup.tsx` | Линия мебели |
| ✅ | **3D: ModuleRow** | `scene/kitchen/ModuleRow.tsx` | Ряд модулей |
| ✅ | **3D: KitchenModule** | `scene/kitchen/KitchenModule.tsx` | Меш модуля + hover + outline |
| ✅ | **3D: Countertop** | `scene/kitchen/CountertopMesh.tsx` | Столешница поверх baseRow |
| ✅ | **3D: Backsplash** | `scene/kitchen/BacksplashMesh.tsx` | Фартук между рядами |
| ✅ | **3D: Plinth** | `scene/kitchen/PlinthMesh.tsx` | Цоколь под baseRow |
| ✅ | Выбор модуля в 3D | `scene/kitchen/` | Клик → selection в сторе + outline |
| ✅ | Панель свойств модуля | `features/editor-shell/ui/` | Габариты, role, finishId |

**Результат фазы:** Кухня из мок-данных видна в 3D с интерактивным выбором модулей.

---

## Фаза 7: Сборка кухни (Kitchen Assembly) — итерация 1

**Цель:** Интерактивная сборка кухни в 3D — добавление, перемещение, удаление модулей через in-scene контролы (gizmo, DnD, action buttons). Подход: **3D-редактор**, а не веб-UI с превью. См. [editor-ux.md](editor-ux.md).

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | Добавление Run | `features/kitchen-editor/` | Кнопка "Add kitchen line" |
| ✅ | Привязка Run к стене | Там же | Выбор wallSegmentId |
| ✅ | Каталог → добавление модуля (click) | `features/catalog-picker/ui/` | Клик по SKU → модуль в сцене |
| ✅ | Каталог → DnD (ghost mesh) | `scene/kitchen/GhostModule.tsx` | Ghost снэпится к run, row line подсвечивается |
| ✅ | Добавление модуля в Row | `features/kitchen-editor/` | Модуль появляется в нужном ряду (base/wall/tall) |
| ✅ | 3D gizmo для перемещения | `scene/kitchen/DragGizmo.tsx` | Стрелки вдоль run, orbit отключается при drag |
| ✅ | Row lines подсветка | `scene/kitchen/RowLines.tsx` | Линия на высоте ряда при select / DnD |
| ✅ | In-scene actions (delete, color) | `scene/kitchen/ModuleActions.tsx` | Html overlay кнопки рядом с модулем |
| ✅ | Верхний ряд (wallRow) | `features/kitchen-editor/` | Wall cabinets на правильной высоте |
| ✅ | Удаление модуля / Run | Там же + scene | Delete в сцене и панели |
| ✅ | Выбор цвета/отделки | `features/catalog-picker/ui/` | Палитра по SKU, in-scene picker |
| 7.12 | E2E: сборка кухни | `e2e/kitchen-assembly.spec.ts` | Добавить run + шкаф, drag, виден в 3D |

**Результат фазы:** Можно собрать кухню через 3D-взаимодействие: DnD из каталога, gizmo-перемещение, in-scene actions. E2E — следующий шаг.

---

## Фаза 8: Collision Constraints & Cross-Run Flow

**Цель:** Корректная обработка коллизий между модулями, связь runs через углы, перенос модулей между стенками. Алгоритмическая система constraints вместо физики (модули — интервалы на 1D-оси run).

**Философия:**
- Модули на run — интервалы `[offsetMm, offsetMm + widthMm]`
- Runs на соседних стенках связаны через углы (run chain)
- Push-механика: толкаешь модуль — он толкает соседей
- Overflow: модуль, не влезающий на стену, переносится на соседнюю через угол

### Этап A: Базовые коллизии и push (внутри одного run)

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | **Interval collision detection** | `entities/kitchen/lib/interval-collision.ts` | `checkOverlap(modules, newOffset, width)` + тесты |
| ✅ | **Wall bounds clamping** | `entities/kitchen/lib/wall-bounds.ts` | `clampToWall(run, offset, width)` — не выходить за `[startOffsetMm, endOffsetMm]` + тесты |
| ✅ | **Push algorithm** | `entities/kitchen/lib/push-modules.ts` | `pushModules(modules, targetIdx, deltaOffset)` → новые offsets + overflow list + тесты |
| ✅ | **Module drag** | `scene/kitchen/DragGizmo.tsx` | Drag одного модуля: стрелки (вдоль стены) + центр (свободный drag на любую стену) |
| ✅ | **Drop at ghost position** | `scene/canvas/SceneCanvas.tsx` | Drop модуля в позицию ghost, а не в конец ряда |

### Этап B: Cross-run flow (перенос между стенками)

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | **Run chain model** | `entities/kitchen/lib/run-chain.ts` | `buildRunChain(runs, segments)` → связанные runs по углам + тесты |
| ✅ | **Cross-run overflow lib** | `entities/kitchen/lib/cross-run-transfer.ts` | Функция переноса overflow-модулей + тесты |
| ✅ | **Multi-run drop zones** | `scene/kitchen/GhostModule.tsx` | При drag показывать зоны всех runs |
| ✅ | **Unified selection drag** | `scene/kitchen/SelectionDragGizmo.tsx` | Единый gizmo для module/row/run: общая логика collision, push, transfer, free-drag |

### Этап C: Углы и проёмы

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | **Corner module linking** | `entities/kitchen/lib/corner-link.ts` | Corner занимает место на двух runs + тесты |
| ✅ | **Corner collision lib** | `entities/kitchen/lib/corner-collision.ts` | Детекция коллизий в углу + тесты |
| ✅ | **Corner as anchor** | `scene/kitchen/DragGizmo.tsx` | Corner не переносится при push (isCorner check) |
| ✅ | **Opening collision lib** | `entities/kitchen/lib/opening-collision.ts` | Модуль не пересекает проём (дверь/окно) + тесты |
| ✅ | **Opening block in UI** | `scene/kitchen/DragGizmo.tsx` | Блокировка размещения + visual feedback (blocked color) |

### Этап D: Визуальная обратная связь и E2E

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | **Collision visual feedback** | `scene/kitchen/DragGizmo.tsx` | Подсветка blocked state (красный gizmo при границе/проёме) |
| ✅ | **Undo for batch/transfer** | `editor-store.ts` | Undo корректно откатывает batch/transfer операции |
| 8.19 | **E2E: push & overflow** | `e2e/collision.spec.ts` | Drag → push neighbour → overflow transfer |
| 8.20 | **E2E: cross-run drag** | `e2e/cross-run.spec.ts` | Drag модуль на другую стену |

**Результат фазы:** Модули корректно взаимодействуют друг с другом и со стенами. Push-механика для каскадного сдвига. Перенос между стенками через drag или overflow. Угловые модули связывают runs.

---

## Фаза 9: AI-чат

**Цель:** Интеграция AI-помощника. Команды меняют слепок. Голосовой ввод через Web Speech API.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| ✅ | UI чата | `features/ai-chat/ui/ChatPanel.tsx` | Панель сообщений + input + mic |
| ✅ | Состояние чата | `features/ai-chat/model/chat-store.ts` | Массив сообщений, isProcessing, error |
| ✅ | zod-схемы AI | `features/ai-chat/model/schema.ts` | ChatMessage, AIResponse |
| ✅ | useMutation: отправка | `features/ai-chat/api/chat-mutation.ts` | Отправка snapshot + message |
| ✅ | Mock endpoint | `features/ai-chat/api/mock-handler.ts` | Имитация AI (мойка, плита, шкаф) |
| ✅ | Обработка ответа | `features/ai-chat/` | zod.safeParse → replaceSnapshot |
| ✅ | Ошибки AI | `features/ai-chat/ui/ChatPanel.tsx` | Показ ошибки, стор не трогать |
| ✅ | Предупреждения | `features/ai-chat/ui/ChatPanel.tsx` | warnings как system message |
| ✅ | **Speech Recognition** | `features/ai-chat/lib/use-speech-recognition.ts` | Web Speech API (ru-RU), mic button |
| ✅ | i18n ключи | `shared/i18n/locales/*.ts` | chat.* ключи (en/de) |
| ✅ | E2E: AI команда | `e2e/ai-chat.spec.ts` | "Добавь мойку" → появляется |

**Результат фазы:** AI может менять кухню по команде. Голосовой ввод работает в Chrome/Edge.

---

## Фаза 10: Полировка и демо

**Цель:** Финальная полировка, демо-сценарий, чеклист.

| # | Задача | Файлы/Область | Критерий готовности |
|---|--------|---------------|---------------------|
| 10.1 | Демо-сценарий | `docs/demo-scenario.md` | 5-7 шагов от открытия до ценности |
| 10.2 | Чеклист mobile | `docs/mobile-first.md` | Все пункты пройдены |
| 10.3 | Онбординг (P2) | `features/onboarding/` | Overlay для первого запуска |
| 10.4a | **Rule engine** | `features/validation/lib/rule-engine.ts` | `checkPlacementRules(snapshot)` интерпретирует `PLACEMENT_RULES`: near-opening, needs-utility, not-near-role + тесты |
| 10.4b | **Module link checker** | `features/validation/lib/link-checker.ts` | `checkModuleLinks(snapshot)` по `MODULE_LINKS` + тесты |
| 10.4c | Валидация дизайна UI | `features/validation/ui/` | Список предупреждений в панели |
| 10.5 | Список объектов | `features/editor-shell/ui/` | Дерево runs/modules |
| 10.6 | Производительность | Профилирование | 60fps на среднем телефоне |
| 10.7 | Финальные тесты | `e2e/` | Критический путь без падений |
| 10.8 | README для демо | `README.md` | Как запустить и показать |

**Результат фазы:** Готовый прототип для показа.

---

## Вне прототипа (Backlog)

| Задача | Почему не сейчас |
|--------|------------------|
| Сохранение/загрузка проекта | Требует бэкенда или IndexedDB |
| Экспорт GLB/PDF | Дополнительная библиотека |
| Полный каталог ритейлера | Интеграция с реальным API |
| Трапециевидные угловые модули | Сложная геометрия (базовые углы в Фазе 8) |
| Внутреннее наполнение (ящики) | Усложняет модель |
| Undo/redo (если не в фазе 2) | Можно добавить позже |
| PWA / offline | После стабилизации |

---

## Зависимости между фазами

```
Фаза 0 (Bootstrap)
    │
    ▼
Фаза 1 (Schemas + Mocks) ──── мок комнаты вместо 2D-редактора
    │
    ▼
Фаза 2 (Store)
    │
    ├──────────────┐
    ▼              ▼
Фаза 3 (Shell)  Фаза 5 (3D Room) ← используем мок-данные
    │              │
    └──────────────┘
           │
           ▼
     Фаза 6 (Kitchen 3D) ← визуализация из мок-данных
           │
           ▼
     Фаза 7 (Assembly) ← UI сборки кухни
           │
           ▼
     Фаза 8 (Collision & Cross-Run) ← коллизии, push, перенос между стенами
           │
           ▼
     Фаза 9 (AI)
           │
           ▼
     Фаза 10 (Polish)
           │
           ▼
    [Фаза 4 (2D)] ← позже, если нужно редактирование комнаты
```

**Текущий путь:** Фазы 0–3, 5–9 завершены. AI-чат с голосовым вводом реализован. Осталось: E2E тесты Phase 8 (8.19, 8.20), Phase 10 (полировка). Фаза 4 (2D-редактор) отложена.

---

## Журнал прогресса

| Дата | Фаза | Что сделано |
|------|------|-------------|
| 2026-03-24 | 0 | Bootstrap: Vite 8 + React 18 + TS strict, Tailwind v4, Vitest 4, Playwright, ESLint 9, Prettier, env, README |
| 2026-03-24 | 1 | Контракты: zod-схемы room/kitchen/snapshot/catalog, roles, constraints, migrations, semantic validation, моки (14 файлов, 84 теста) |
| 2026-03-24 | 2 | Состояние: Zustand store (immer) + undo/redo, TanStack Query каталога, AppProviders, селекторы (7 файлов, 52 теста) |
| 2026-03-25 | 3 | Оболочка: EditorShell (header + main + tab-панели), CatalogPanel, PropertiesPanel, Skeleton, ErrorMessage, safe area, mobile-first 375px, E2E (12 файлов, 161 тест) |
| 2026-03-25 | 5+6 | 3D сцена: R3F Canvas + OrbitControls + GizmoHelper, план→3D маппинг (18 тестов), комната (пол/стены/проёмы), кухня (модули/столешница/фартук/цоколь), hover + tooltip, selection outline, Grid + размеры стен + маркеры утилит, SceneToolbar (20 файлов, 208 тестов) |
| 2026-03-25 | 7 | Сборка кухни (итерация 1): in-scene UI (ModuleActions, info label), DnD из каталога (GhostModule + dnd-store), 3D gizmo-стрелки для перемещения (DragGizmo), row lines на высоте ряда (RowLines), click/DnD добавление модулей, delete/color in-scene, undo при drag. UX-документ: docs/editor-ux.md, правило: kitchen-3d-editor-ux.mdc |
| 2026-03-26 | 8 | Collision Constraints: lib-функции (interval-collision, wall-bounds, push-modules, run-chain, cross-run-transfer, corner-link, corner-collision, opening-collision) + UI-интеграция в DragGizmo (push с cascade, auto-transfer overflow, drag-to-wall, corner anchor, opening block, visual feedback). Осталось: Row/Run drag, E2E. |
| 2026-03-27 | 9 | AI-чат: zod-схемы (ChatMessage, AIResponse), chat-store (Zustand), useSpeechRecognition (Web Speech API, ru-RU), chat-mutation (TanStack Query), mock-handler, ChatPanel UI с mic button, i18n (en/de), интеграция в EditorShell, E2E тесты (8 файлов, 52 теста) |

---

*Документ обновляется по мере продвижения. При завершении задачи — ставить ✅ вместо номера.*
