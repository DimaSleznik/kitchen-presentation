# Модель данных кухонного планнера

Детальный анализ требований к структуре данных для планировщика кухни с AI-интеграцией. Документ описывает **иерархию сущностей**, **семантику для AI**, **ограничения** и **контракт JSON-слепка**.

**Связанные документы:** [architecture.md](architecture.md), [room-plan-and-3d-schema.md](room-plan-and-3d-schema.md), [roadmap.md](roadmap.md) (план реализации по фазам).

---

## 1. Почему кухня — не просто "модули на полу"

Кухонный гарнитур — это **система связанных элементов**, а не набор независимых объектов:

| Обычная мебель | Кухня |
|----------------|-------|
| Шкаф стоит где угодно | Модуль привязан к **линии** вдоль стены |
| Каждый объект независим | Столешница — **общая** на весь нижний ряд |
| Позиция (x, y, z) | Позиция = **offset вдоль линии** + привязка к ряду |
| Материал на объекте | Материал фасадов/столешницы — на **уровне линии или проекта** |
| Нет зависимостей | Плита требует вытяжку, мойка требует сифон |

**Вывод:** плоский список `placement.modules[]` недостаточен. Нужна **иерархическая модель**.

---

## 2. Иерархия сущностей

```
KitchenSnapshot (корень)
│
├── room (геометрия комнаты)
│   ├── wallSegments[] — стены
│   ├── openings[] — двери, окна
│   └── utilities[] — коммуникации (вода, газ, электрика)
│
├── kitchen (кухонный гарнитур)
│   │
│   ├── runs[] — линии мебели (вдоль стен)
│   │   ├── id, wallSegmentId, startOffsetMm, endOffsetMm
│   │   ├── baseRow (нижний ряд)
│   │   │   ├── modules[] — модули с позицией вдоль линии
│   │   │   └── countertop — столешница (материал, свес)
│   │   ├── wallRow (верхний ряд)
│   │   │   ├── modules[]
│   │   │   └── heightFromFloorMm — высота установки
│   │   ├── tallRow (колонны/пеналы) — опционально
│   │   ├── backsplash — фартук (материал, высота)
│   │   └── plinth — цоколь
│   │
│   ├── islands[] — острова (отдельно стоящие)
│   │   └── ... (аналогично run, но без привязки к стене)
│   │
│   └── appliances[] — крупная отдельностоящая техника
│       └── fridge, dishwasher (если не встроенные)
│
└── meta
    ├── version — версия схемы
    └── projectDefaults — глобальные настройки
```

---

## 3. Линия мебели (Run) — ключевая сущность

**Run** — непрерывный ряд кухонной мебели вдоль стены. Это основная единица организации.

### 3.1. Почему линия, а не отдельные модули

| Аспект | Без линий | С линиями |
|--------|-----------|-----------|
| Столешница | Отдельный объект на каждом модуле | Один объект на всю линию |
| Выравнивание | Ручное для каждого модуля | Автоматическое внутри линии |
| AI-команды | "Сдвинь модуль X на 100мм" | "Вставь модуль между мойкой и плитой" |
| Угловые кухни | Сложная логика пересечения | Две линии + угловой модуль |

### 3.2. Структура Run

```typescript
interface KitchenRun {
  id: string;
  
  // Привязка к геометрии комнаты
  wallSegmentId: string;        // к какой стене привязана линия
  startOffsetMm: number;        // отступ от начала стены
  endOffsetMm: number;          // отступ от конца стены (или автовычисление)
  
  // Ряды модулей
  baseRow: ModuleRow;           // нижний ряд (всегда)
  wallRow?: ModuleRow;          // верхний ряд (опционально)
  tallRow?: ModuleRow;          // колонны/пеналы (опционально)
  
  // Общие элементы линии
  countertop?: Countertop;      // столешница для baseRow
  backsplash?: Backsplash;      // фартук между рядами
  plinth?: Plinth;              // цоколь под baseRow
}
```

### 3.3. Конфигурации кухни через линии

| Конфигурация | Структура runs[] |
|--------------|------------------|
| **I-образная** | 1 линия вдоль одной стены |
| **L-образная** | 2 линии + угловой модуль |
| **U-образная** | 3 линии + 2 угловых модуля |
| **П-образная** | 3 линии вдоль трёх стен |
| **Параллельная** | 2 линии на противоположных стенах |
| **С островом** | 1+ линия + island[] |

---

## 4. Модуль (Module) — единица мебели

### 4.1. Базовая структура

```typescript
interface KitchenModule {
  id: string;
  catalogId: string;            // SKU из каталога
  
  // Позиция внутри линии (не глобальная!)
  offsetMm: number;             // смещение от начала линии
  
  // Семантика для AI
  role: ModuleRole;             // функциональная роль
  
  // Размеры (могут переопределять каталог)
  widthMm?: number;             // если отличается от каталога
  heightMm?: number;
  depthMm?: number;
  
  // Внешний вид
  finishId?: string;            // материал фасада
  handleId?: string;            // тип ручки
  
  // Связи
  linkedModuleId?: string;      // связанный модуль (плита → вытяжка)
  
  // Встроенная техника
  builtInAppliance?: BuiltInAppliance;
}
```

### 4.2. Функциональные роли (ModuleRole)

**Критично для AI.** Команда "поменяй мойку на шкаф" требует понимания роли, а не catalogId.

```typescript
type ModuleRole =
  // Мокрая зона
  | 'sink'              // шкаф под мойку
  | 'sink-corner'       // угловой под мойку
  | 'dishwasher'        // посудомоечная машина (встроенная)
  
  // Зона готовки
  | 'cooktop'           // варочная панель
  | 'oven'              // духовой шкаф
  | 'oven-cooktop'      // комбо (плита)
  | 'microwave'         // микроволновка (встроенная)
  | 'hood'              // вытяжка
  
  // Хранение — нижний ряд
  | 'base-cabinet'      // обычный шкаф
  | 'base-drawer'       // шкаф с ящиками
  | 'base-corner'       // угловой шкаф
  | 'base-corner-carousel' // угловой с каруселью
  
  // Хранение — верхний ряд
  | 'wall-cabinet'      // навесной шкаф
  | 'wall-corner'       // угловой навесной
  | 'wall-open'         // открытая полка
  | 'wall-glass'        // со стеклом
  
  // Колонны
  | 'tall-pantry'       // пенал для хранения
  | 'tall-oven'         // пенал под духовку
  | 'tall-fridge'       // пенал под холодильник
  
  // Специальные
  | 'filler'            // филлер (заполнитель зазора)
  | 'end-panel'         // торцевая панель
  | 'end-shelf'         // торцевая полка (открытая);
```

### 4.3. Стандартные размеры (сетка)

Кухонные модули имеют **стандартизированные ширины** для совместимости:

```typescript
const STANDARD_WIDTHS_MM = [
  150,   // филлеры
  200,   // узкие филлеры/бутылочницы
  300,   // узкие шкафы
  400,   // шкафы
  450,   // шкафы
  500,   // шкафы
  600,   // стандарт (мойка, плита)
  800,   // широкие шкафы
  900,   // угловые
  1000,  // широкие
  1200,  // двойные
];

const STANDARD_HEIGHTS_MM = {
  base: 720,          // корпус нижнего ряда
  baseTotal: 850,     // с цоколем и столешницей
  wall: [600, 720, 900], // навесные
  tall: [2100, 2200],    // колонны
};

const STANDARD_DEPTHS_MM = {
  base: 560,          // нижний ряд (корпус)
  baseWithCounter: 600, // со столешницей
  wall: 320,          // верхний ряд
  tall: 560,          // колонны
};
```

---

## 5. Столешница, фартук, цоколь

Эти элементы **не являются модулями** — это атрибуты линии или ряда.

### 5.1. Столешница (Countertop)

```typescript
interface Countertop {
  materialId: string;           // материал (ДСП, камень, дерево)
  thicknessMm: number;          // 28, 38, 40 мм
  overhangFrontMm: number;      // свес спереди (обычно 30-50)
  overhangSidesMm: number;      // свес по бокам
  
  // Вырезы
  cutouts: CountertopCutout[];  // под мойку, варочную панель
}

interface CountertopCutout {
  moduleId: string;             // для какого модуля вырез
  type: 'sink' | 'cooktop';
  // Размеры вычисляются из модуля или задаются вручную
  widthMm?: number;
  depthMm?: number;
}
```

### 5.2. Фартук (Backsplash)

```typescript
interface Backsplash {
  materialId: string;           // плитка, стекло, панель
  heightMm: number;             // высота (расстояние между рядами)
  
  // Может иметь вырезы под розетки, рейлинги
  features?: BacksplashFeature[];
}
```

### 5.3. Цоколь (Plinth)

```typescript
interface Plinth {
  materialId: string;           // обычно в цвет фасадов
  heightMm: number;             // 100, 120, 150 мм
  recessMm: number;             // заглубление (обычно 50-80)
}
```

---

## 6. Коммуникации и ограничения

### 6.1. Точки коммуникаций

AI должен знать, где находятся подключения, чтобы корректно отвечать на "перенеси мойку".

```typescript
interface UtilityPoint {
  id: string;
  type: 'water-cold' | 'water-hot' | 'drain' | 'gas' | 'electrical' | 'ventilation';
  
  // Позиция на плане
  positionMm: Vec2;
  
  // К какой стене относится (опционально)
  wallSegmentId?: string;
  
  // Для электрики — мощность
  powerWatts?: number;
}
```

### 6.2. Правила размещения (Constraints)

Набор правил для валидации и подсказок AI:

```typescript
interface PlacementConstraints {
  // Минимальные расстояния
  minGapBetweenAppliancesMm: number;  // 50 мм между техникой
  
  // Правила зон
  rules: PlacementRule[];
}

interface PlacementRule {
  id: string;
  description: string;          // для AI и UI
  
  // Условие и следствие
  condition: RuleCondition;
  consequence: 'error' | 'warning' | 'info';
}

// Примеры правил:
const PLACEMENT_RULES: PlacementRule[] = [
  {
    id: 'cooktop-not-near-window',
    description: 'Плита не должна быть ближе 300мм к окну',
    condition: { moduleRole: 'cooktop', nearOpening: 'window', maxDistanceMm: 300 },
    consequence: 'warning',
  },
  {
    id: 'sink-needs-drain',
    description: 'Мойка должна быть в пределах 1500мм от слива',
    condition: { moduleRole: 'sink', needsUtility: 'drain', maxDistanceMm: 1500 },
    consequence: 'error',
  },
  {
    id: 'fridge-not-near-cooktop',
    description: 'Холодильник не рядом с плитой (минимум 300мм)',
    condition: { moduleRole: 'tall-fridge', notNearRole: 'cooktop', minDistanceMm: 300 },
    consequence: 'warning',
  },
];
```

---

## 7. Связанные элементы

Некоторые модули **требуют** или **рекомендуют** наличие других:

```typescript
interface ModuleLink {
  sourceRole: ModuleRole;       // что размещаем
  targetRole: ModuleRole;       // что нужно
  relation: 'requires' | 'recommends';
  spatialRule: 'above' | 'below' | 'adjacent' | 'same-column';
}

const MODULE_LINKS: ModuleLink[] = [
  { sourceRole: 'cooktop', targetRole: 'hood', relation: 'requires', spatialRule: 'above' },
  { sourceRole: 'sink', targetRole: 'dishwasher', relation: 'recommends', spatialRule: 'adjacent' },
  { sourceRole: 'oven', targetRole: 'cooktop', relation: 'recommends', spatialRule: 'above' },
];
```

---

## 8. Полная схема JSON-слепка

### 8.1. Корень

```typescript
interface KitchenSnapshot {
  version: number;              // версия схемы (для миграций)
  
  room: RoomData;               // геометрия комнаты
  kitchen: KitchenData;         // гарнитур
  
  meta: {
    createdAt: string;
    updatedAt: string;
    projectName?: string;
  };
}
```

### 8.2. Пример JSON

```json
{
  "version": 1,
  "room": {
    "wallHeightMm": 2700,
    "wallThicknessMm": 100,
    "segments": [
      { "id": "wall-1", "a": { "x": 0, "y": 0 }, "b": { "x": 4000, "y": 0 } },
      { "id": "wall-2", "a": { "x": 4000, "y": 0 }, "b": { "x": 4000, "y": 3000 } },
      { "id": "wall-3", "a": { "x": 4000, "y": 3000 }, "b": { "x": 0, "y": 3000 } },
      { "id": "wall-4", "a": { "x": 0, "y": 3000 }, "b": { "x": 0, "y": 0 } }
    ],
    "openings": [
      {
        "id": "window-1",
        "kind": "window",
        "wallSegmentId": "wall-3",
        "offsetMm": 1500,
        "widthMm": 1200,
        "heightMm": 1400,
        "sillHeightMm": 900
      }
    ],
    "utilities": [
      { "id": "drain-1", "type": "drain", "positionMm": { "x": 800, "y": 50 }, "wallSegmentId": "wall-1" },
      { "id": "water-1", "type": "water-cold", "positionMm": { "x": 800, "y": 50 }, "wallSegmentId": "wall-1" },
      { "id": "gas-1", "type": "gas", "positionMm": { "x": 2500, "y": 50 }, "wallSegmentId": "wall-1" }
    ]
  },
  "kitchen": {
    "runs": [
      {
        "id": "run-1",
        "wallSegmentId": "wall-1",
        "startOffsetMm": 0,
        
        "baseRow": {
          "heightFromFloorMm": 0,
          "modules": [
            {
              "id": "mod-1",
              "catalogId": "base-sink-600",
              "role": "sink",
              "offsetMm": 500,
              "widthMm": 600,
              "finishId": "white-matt"
            },
            {
              "id": "mod-2",
              "catalogId": "dishwasher-integrated-600",
              "role": "dishwasher",
              "offsetMm": 1100,
              "widthMm": 600,
              "finishId": "white-matt"
            },
            {
              "id": "mod-3",
              "catalogId": "base-drawer-600",
              "role": "base-drawer",
              "offsetMm": 1700,
              "widthMm": 600,
              "finishId": "white-matt"
            },
            {
              "id": "mod-4",
              "catalogId": "cooktop-gas-600",
              "role": "cooktop",
              "offsetMm": 2300,
              "widthMm": 600,
              "finishId": "white-matt",
              "linkedModuleId": "mod-hood"
            }
          ]
        },
        
        "wallRow": {
          "heightFromFloorMm": 1400,
          "modules": [
            {
              "id": "mod-wall-1",
              "catalogId": "wall-cabinet-600",
              "role": "wall-cabinet",
              "offsetMm": 500,
              "widthMm": 600,
              "heightMm": 720,
              "finishId": "white-matt"
            },
            {
              "id": "mod-hood",
              "catalogId": "hood-600",
              "role": "hood",
              "offsetMm": 2300,
              "widthMm": 600,
              "linkedModuleId": "mod-4"
            }
          ]
        },
        
        "countertop": {
          "materialId": "quartz-white",
          "thicknessMm": 38,
          "overhangFrontMm": 40,
          "overhangSidesMm": 20,
          "cutouts": [
            { "moduleId": "mod-1", "type": "sink" },
            { "moduleId": "mod-4", "type": "cooktop" }
          ]
        },
        
        "backsplash": {
          "materialId": "tile-white-subway",
          "heightMm": 550
        },
        
        "plinth": {
          "materialId": "white-matt",
          "heightMm": 100,
          "recessMm": 60
        }
      }
    ],
    "islands": [],
    "appliances": [
      {
        "id": "fridge-1",
        "catalogId": "fridge-side-by-side",
        "role": "fridge",
        "positionMm": { "x": 3500, "y": 100 },
        "rotationRad": 0
      }
    ]
  },
  "meta": {
    "createdAt": "2026-03-24T10:00:00Z",
    "updatedAt": "2026-03-24T10:00:00Z"
  }
}
```

---

## 9. AI-контракт

### 9.1. Входные данные для AI

```typescript
interface AIRequest {
  message: string;              // команда пользователя
  snapshot: KitchenSnapshot;    // текущее состояние
  catalog: CatalogSummary;      // доступные модули (сокращённо)
  materials: MaterialPalette;   // доступные материалы
}
```

### 9.2. Выходные данные от AI

```typescript
interface AIResponse {
  snapshot: KitchenSnapshot;    // ПОЛНЫЙ обновлённый слепок
  explanation?: string;         // пояснение для пользователя
  warnings?: string[];          // предупреждения (нарушения правил)
}
```

### 9.3. Примеры AI-команд и их обработка

| Команда пользователя | Что делает AI |
|---------------------|---------------|
| "Поменяй мойку на шкаф с ящиками" | Находит `module` с `role: 'sink'`, меняет `catalogId` и `role` на `'base-drawer'`, **удаляет cutout** из столешницы |
| "Сделай плиту ближе к окну" | Находит `module` с `role: 'cooktop'`, увеличивает `offsetMm`, проверяет правило `cooktop-not-near-window` |
| "Замени столешницу на дерево" | Меняет `countertop.materialId` в нужном `run` |
| "Добавь верхние шкафы" | Создаёт `wallRow` в `run`, добавляет модули с ролями `wall-cabinet` |
| "Поставь холодильник в угол" | Находит `appliances[]` с `role: 'fridge'`, меняет `positionMm` |
| "Сделай L-образную кухню" | Добавляет второй `run` на перпендикулярной стене + угловой модуль |

### 9.4. Стабильность ID

**Правила для AI:**

1. **Не менять `id`** существующих сущностей без явного удаления
2. **Генерировать новые `id`** для новых элементов (формат: `uuid` или `<type>-<seq>`)
3. **Не дублировать `id`** в одном слепке
4. **При замене модуля** — можно сохранить `id`, если это "тот же слот"

---

## 10. Валидация (zod)

### 10.1. Уровни валидации

```typescript
// 1. Структурная валидация (zod)
const kitchenSnapshotSchema = z.object({
  version: z.literal(1),
  room: roomDataSchema,
  kitchen: kitchenDataSchema,
  meta: metaSchema,
});

// 2. Семантическая валидация (бизнес-логика)
function validateKitchenSemantics(snapshot: KitchenSnapshot): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Проверка связей
  for (const run of snapshot.kitchen.runs) {
    for (const mod of run.baseRow.modules) {
      if (mod.linkedModuleId && !findModuleById(snapshot, mod.linkedModuleId)) {
        errors.push({ moduleId: mod.id, message: 'Linked module not found' });
      }
    }
  }
  
  // Проверка правил размещения
  for (const rule of PLACEMENT_RULES) {
    const violations = checkRule(snapshot, rule);
    if (violations.length > 0) {
      (rule.consequence === 'error' ? errors : warnings).push(...violations);
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```

### 10.2. Обработка невалидного ответа AI

```typescript
async function handleAIResponse(response: unknown): Promise<void> {
  // 1. Структурная валидация
  const parsed = kitchenSnapshotSchema.safeParse(response);
  if (!parsed.success) {
    showError('AI вернул некорректные данные');
    return; // НЕ обновляем стор
  }
  
  // 2. Валидация catalogId
  const unknownCatalogIds = findUnknownCatalogIds(parsed.data, catalog);
  if (unknownCatalogIds.length > 0) {
    showWarning(`Неизвестные модули: ${unknownCatalogIds.join(', ')}`);
    // Можно продолжить с fallback-отображением
  }
  
  // 3. Семантическая валидация
  const semantics = validateKitchenSemantics(parsed.data);
  if (!semantics.valid) {
    showError('Конфигурация нарушает правила');
    return;
  }
  
  // 4. Обновление стора
  setSnapshot(parsed.data);
}
```

---

## 11. Миграции версий

При изменении схемы:

```typescript
function migrateSnapshot(data: unknown): KitchenSnapshot {
  const version = (data as any)?.version;
  
  switch (version) {
    case undefined:
    case 0:
      // Старый формат без версии — мигрируем
      return migrateV0toV1(data);
    case 1:
      return kitchenSnapshotSchema.parse(data);
    default:
      throw new Error(`Unknown schema version: ${version}`);
  }
}
```

---

## 12. Упрощения для прототипа (v0)

Для MVP можно временно упростить:

| Полная модель | Упрощение v0 |
|---------------|--------------|
| Множество runs | Один run |
| Угловые модули с логикой | Обычные модули, без угловой геометрии |
| Utilities с позициями | Без коммуникаций, без валидации |
| Полная валидация правил | Только структурная (zod) |
| Внутреннее наполнение | Модуль как единое целое |
| Связи модулей | Без автоматических связей |

**Но сохранить с самого начала:**
- Иерархию `run → row → module`
- Семантические роли (`role`)
- Столешницу как атрибут линии
- Стабильные `id`
- Формат AI-контракта

---

## 13. Открытые вопросы

- [ ] Формат угловых модулей (трапеция, диагональ, карусель)
- [ ] Как хранить "занятость" позиций в линии (overlap detection)
- [ ] Детализация внутреннего наполнения (ящики, полки)
- [ ] Интеграция с реальным каталогом (SKU → габариты, опции)
- [ ] Мультипроектность (несколько комнат?)

---

## Журнал решений

| Дата | Решение |
|------|---------|
| 2026-03-24 | Иерархия: run → row → module. Столешница — атрибут run. |
| 2026-03-24 | Семантические роли модулей (role) обязательны для AI. |
| 2026-03-24 | Позиция модуля — offsetMm вдоль линии, не глобальная. |
