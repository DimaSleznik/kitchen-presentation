# 02 — Legacy Configuration Model (Häcker Küchen: imos / IDM / Navigram)

**Scope:** Reverse-engineering of the configuration / options layer that feeds the target
**rules** layer (and partly **commerce**). Read-only analysis. No HK files modified.

**Files analyzed (primary):**
`featureList.json`, `optionMapping.json`, `itemFlexMapping.json`, `optionDebugList.json`.
**Cross-referenced (join targets, sampled only):**
`optionGcodeMapping.json`, `priceDefinition.json`, `itemsSearchInfo.json`,
`baseshape1high.nfx`, `0071_3_0_1_n6dn_D_D_2026_1_20251127093637.xml`.

**Environment:** Python 3.14.2 available; used for sampling. `jq` not required. All files
UTF-8, all human labels **German only** (`text.DE`), field/key names English. Console default
codepage is cp1251 — must force `PYTHONIOENCODING=utf-8` to print umlauts (data itself is clean UTF-8).

---

## 0. TL;DR entity model

```
FEATURE (characteristic, numeric id e.g. 105 "Front-Kombination")
  └─ has OPTIONS  (option key e.g. "N288" → label, rank, optional valid_until / style)
        the option KEY is the OPTION VALUE; there is no separate value-id table

RESTRICTION (rule, id e.g. 1 / 358 / 1001)
  ├─ type 0 = combinatorial compatibility between options of 2–3 features (allow/deny lists)
  └─ type 1 = parametric range check (MAX_W / MAX_H / MAX_D against a dimension)

STYLE  = a fully pre-resolved option set per model family (AURA, SCALA, …) = "factory preset"

FLEX (in itemFlexMapping) = parametric GEOMETRY recipe for a cabinet, resolved by item attributes
        → NOT feature-flexibility. It is dimensional/part flexibility (imos parts + Navigram category).

optionMapping = the BINDING layer: per geometry archetype, maps (feature → option value)
        → [material_key, imos_DSL_script] that mutates the parametric model.
```

**Join spine (the crux):** the numeric **feature id** + the **option value** is the universal key.
It appears identically in `featureList` (definition), `optionMapping` (geometry/material binding),
`optionGcodeMapping` (CNC), `priceDefinition` (price), and the per-model `styles` rows. Items join
to geometry/flex by a **4-attribute tuple** (`CARCASE_BASIC_SHAPE_NO, TK_TYPE, TK_CLASS, TK_FRONT_APPEARANCE`),
not by the feature/option key.

---

## 1. Provenance & format

| File | Root | Top-level keys | Notes |
|---|---|---|---|
| `featureList.json` (1.57 MB) | object | `features`, `styles`, `combined`, `restrictions`, `restrictionRef` | The configuration dictionary + the rules. |
| `optionMapping.json` (2.70 MB) | object | 131 keys = **geometry archetype names** (`baseshape27floor`, `unifront`, `worktop`, `nq200`…) | Option→material/script binding per geometry. |
| `itemFlexMapping.json` (513 KB) | object | `formule`, `data` | `formule` = column schema; `data` = nested decision tree → flex/geometry. |
| `optionDebugList.json` (16 KB) | object | feature-id → array of option values | Flat enumeration of allowed option values per feature. **Rosetta stone for option keys.** |

**Tooling/version hints.** Scripts inside `optionMapping` (`setlabel(...)`, `dragcomponentatom()`,
`att()`, `model()`, `rank()`, `contiguouscontaineratom()`) and the `.nfx` syntax
(`subscribe(...)`, `hold(x.nfx)`, `emptyspace()`) are the **imos parametric DSL** (imos iX / netfabb-style
`.nfx` "net" files). The XML is **IDM / BMEcat-style catalog**: root `T_NEW_CATALOG MAJOR=3 MINOR=0
REVISION=1`, schema `IDM_3_0_1.xsd`, `MANUFACTURER_ID=71` (Häcker), `CATALOG_ID=N2026`,
catalog name "concept130 2026 national", `ISO_LANGUAGE_ID=DE`, `CURRENCY_KEY=EUR`,
`FILE_RELEASE_DATE=2025-11-27`. So: **imos = geometry/scripts (.nfx + optionMapping)**,
**IDM = catalog/items/prices (XML + itemsSearchInfo + priceDefinition)**,
**Navigram = 3D models referenced by `navCategory`** in itemFlexMapping.

---

## 2. Entity model (real field names + trimmed records)

### 2.1 FEATURE — `featureList.features[<featureId>]`
A configurable **characteristic** of the kitchen. 75 features. Numeric string ids (`"1"`,`"105"`,`"303"`…).

Fields: `type` (K|U|P), `rank` (sort), `text.DE` (label), `options` (map of option value → option object).

```json
"304": { "type": "K", "rank": "4", "text": {"DE": "Grifflage"},
  "options": {
    "0": {"rank": 0, "text": {"DE": "autom. Anordnung des Knopfes"}},
    "A": {"rank": 0, "text": {"DE": "waagerecht/waagerecht (A)"}},
    "Z": {"rank": 0, "text": {"DE": "ohne Bohrung mit Griff (Z)"}}
  }}
```

**`type` semantics** (inferred from the German labels — confirm with SME):
- **K** (42 feats) — *main / "Kombination"* selector: the primary characteristic. Labels end in
  `-Kombination` or name a domain (Front-Kombination 105, Korpus-Kombination 201, Griff-Kombination 303,
  Glas-Ausführung 150, Sockelhöhe 402, Arbeitsplatten… 600). These are what the user picks first.
- **U** (7 feats) — *Ausführung / finish-execution* sub-characteristic that resolves a material family
  (Front-Ausführung 100, Front-Farbe-1 101, Korpus-Farbe 202/203/205, Griff-Ausführung 300, Griff-Farbe 301).
- **P** (26 feats) — *property / paired-parameter*: secondary colours & sub-options dependent on a K/U
  (Glas-Farbe 151, Jalousie-Farbe 161, Oberboden-Ausführung 510, Spülen-Farbe 851, Stützfuß 932…).
  Many are the "-Farbe" partner of a "-Ausführung".
  **NOTE:** treat K/U/P as a *display/dependency grouping*, not as a hard constraint — the actual
  constraints live in `restrictions`. (Open question for SME.)

### 2.2 OPTION VALUE — `features[<id>].options[<optionKey>]`
The **option value is the map key itself** (e.g. `"N288"`, `"373"`, `"AURA"`, `"A106"`). There is **no
separate numeric value-id** — the string key *is* the join token. 3,476 option values total.

Option object fields (frequency / 3476):
| field | count | meaning |
|---|---|---|
| `rank` | 3476 | sort order within the feature (mostly 0) |
| `text.DE` | 3476 | German label (e.g. `"SCALA-GL Eukalyptus"`) |
| `valid_until` | **251** | **discontinuation date** (e.g. `"2026-06-30"`) — commerce/lifecycle signal |
| `style` | 24 | **only on feature `1` (Programm/Modellfamilie)** — links the model to its `styles` preset |

```json
// feature 1 "Programm/Modellfamilie", option AURA links to a style preset
"AURA": {"rank": 0, "text": {"DE": "AURA"}, "style": "AURA"}
// feature 101 option with end-of-life date
"17": {"rank": 0, "text": {"DE": "..."}, "valid_until": "2026-06-30"}
```

### 2.3 STYLE — `featureList.styles[<familyCode>]` (24 families, 349 rows)
A **fully pre-resolved option vector** = factory configuration for a model family. Each row is a flat
map `featureId → optionValue` plus a `text.DE` marketing name. The keys are the same numeric feature ids.

```json
"SCALA": [
  {"105":"T121","150":"52","154":"AZ","201":"4233","206":"KU","207":"233","303":"999",
   "401":"373","402":"150","501":"373","601":"174","603":"13","700":"131","750":"130E",
   "961":"0","text":{"DE":"SCALA-GL Eukalyptus"}},
  …
]
```
→ Migration: these are **defaults / valid starting configurations** ("models"). Each row should round-trip
as a complete CPQ default selection. `styles` keys ↔ feature `1` option `style` field.

### 2.4 `combined` — `featureList.combined[<featureId>]`
A **derived/auto-fill table**: for a *driving* option value of one feature, the implied option values of
other features. Keys present: `105`, `201`, `303` (the three big "Kombination" features). For each driving
value it lists `{FEATURE_NO, OPTION_KEY}` pairs to set.

```json
"105": { "N102": [ {"FEATURE_NO":"100","OPTION_KEY":"47"},
                    {"FEATURE_NO":"101","OPTION_KEY":"114"} ], … }
```
→ Reads as: "if Front-Kombination = N102, then Front-Ausführung(100)=47 and Front-Farbe(101)=114."
This is a **composite→component decomposition** (one marketing SKU code expands into its constituent
finish+colour selections). Migration: model as *macro / bundle expansion* rules.

### 2.5 FLEX — `itemFlexMapping`
`formule` is the **column header / lookup path**:
`["CARCASE_BASIC_SHAPE_NO", "TK_TYPE", "TK_CLASS", "TK_FRONT_APPEARANCE", ">=TYPE_NO"]`.
`data` is a **5-level nested dict** keyed in exactly that order (last level `>=TYPE_NO` = a *range/threshold*
match on the article number, ">=" prefix = "greatest key ≤ value" style lookup). The leaf describes the
**parametric geometry**: a `flexInfo` block, plus per-part keys like `WEL8.L` / `WEL8.R` (part code + Left/Right).

```json
// data["0"]["1"]["1"]["1"]  (shape0 / type1 / class1 / front1)
{ "flexInfo": { "setLabels": { "measuringAngle": 1 } },
  "WEL8.L": { "flexInfo": {
      "flexObjectId": "collection",
      "navCategory": "115_139",            // ← Navigram 3D category join
      "categoryHeightType": 0,
      "setLabels": { "hasLongParts": 0 },
      "frontgroups": [],
      "setFlexProperty": { "collection": {
          "b": 3.5, "t": 0.373, "h": 1.825,   // Breite/Tiefe/Höhe (width/depth/height, metres)
          "parameters": "MFR11,50,373,25,966,0,0|AB5037,2600,373,50,900,0,25,0,X|NV50,...|W4091,400,350,910,3100,0,915,0,X,R"
      }}}},
  "WEL8.R": { … mirror, ends ",L" … } }
```
**Decoded:** *flex = how a cabinet's panels/parts scale with its dimensions.* The `parameters` string is a
`|`-separated list of part instances; each part = `PARTCODE, length, depth?, thickness, x, y, z, …, orientation(X/L/R)`.
`navCategory` ties the flex to a Navigram 3D model; `b/t/h` are nominal dimensions. 16 shapes,
105 flex leaves found. **This is geometry data, but it is keyed by the same item attributes the rules use,
so it belongs to the geometry layer while sharing the item join-key with rules.**

### 2.6 optionMapping — the BINDING layer
`optionMapping[<geometryArchetype>][<featureId>][<bindingGroup>][<optionValue>] = [material_key, imos_script]`.
131 archetypes (same vocabulary as `.nfx` files and the XML model nodes). Inner feature ids are the same
numeric ids (201, 203, 402, 501, 962, 207, 105…). Binding groups are **imos label/slot names**:
`bodyfinish`(119), `myfinish`(98), `carcassfinish`/`finhdffinish`(39), `legheight`(36), `channelfinish`,
`frontfinish`, `topthickness`, `drawersystem`, `mygrip`, `grippos`, `cornice`…

```json
"baseshape27floor": { "105": { "myfinish": {
   "N102": ["balticblue_feinstruktur",
            "setlabel(\"walldistance\",0,dragcomponentatom(s()));setlabel(\"frontTypeGroup\",1,rank(att(9,first(model())),contiguouscontaineratom()));"],
   "N103": ["ulme_mocca_vertical", "setlabel(\"walldistance\",0,…);…"]
}}}
```
Element 0 = **material/texture id** (joins to Navigram materials / commerce material codes);
element 1 = **imos DSL action** executed when that option is chosen (sets labels, drags components, swaps fins).
The binding-group names are identical to the `subscribe(bodyfinish=…)`, `interiorwhite=…`, `mygrip=…` labels
inside `baseshape1high.nfx` — confirming `optionMapping` scripts and the `.nfx` model share one label namespace.

---

## 3. Items ↔ options / flex

- **Item identifier:** `TYPE_NO` (internal, e.g. `LADP2538`) and `EDP_NUMBER` (catalog/order number,
  e.g. `ADP2538`) in `itemsSearchInfo.json` (10,234 items). `EDP_NUMBER` ↔ XML `<ARTICLE><SUPPLIER_AID>`.
- **Item → geometry/flex:** via the 4 `formule` attributes carried on every item:
  `CARCASE_BASIC_SHAPE_NO`, `TK_TYPE`, `TK_CLASS`, `TK_FRONT_APPEARANCE`, then `>=TYPE_NO` threshold.
  Verified: all four keys are present on 100 % of items; the 16 shapes used by `itemFlexMapping.data`
  are a subset of the shape values present in `itemsSearchInfo`. So an item resolves to its flex/geometry
  by descending `data[shape][type][class][front][≥typeNo]`.
- **Item → options:** *not direct per-item.* Items don't list option ids. The configurable options are
  driven by **(a)** the global `features`/`restrictions` (which options are valid at all + cross-feature
  compatibility), **(b)** the item's `RESTRICTIONS` field (7,013 items carry it — per-item restriction
  references, almost certainly indices into `featureList.restrictions` / `restrictionRef`), and
  **(c)** `optionMapping` keyed by the item's **geometry archetype** (so the same option behaves differently
  per cabinet shape). Item-level dims `b/t/h` (+ `b1/b2/t1/e/be/te…`) feed the type-1 (MAX_*) range rules.

---

## 4. Rules / constraints (→ target "rules" layer)

All rules live in **`featureList.restrictions`** (227 rules) + **`restrictionRef`** (scoping index).

Restriction object fields (all 227 have all 7):
`type`, `allowed`, `text.DE`, `feature_1`, `feature_2`, `feature_3`, `combi[]`.

| Field | Meaning |
|---|---|
| `type` | `"0"` = combinatorial compatibility (169 rules); `"1"` = parametric range check (58 rules) |
| `allowed` | `true` = whitelist (combo is permitted); `false` = blacklist (combo forbidden). 180 allow / 47 deny |
| `feature_1/2/3` | the features the rule relates (f3 used in only 4 rules; otherwise `null`). Single-feature deny lists set f2=f3=null |
| `combi[]` | array of tuple strings; each tuple `feature;value` segments joined by `|`. **54,536 tuples total** |

**Type 0 examples**
```json
// whitelist: which Fronts(105) are valid per Programm(1)
{"type":"0","allowed":true,"text":{"DE":"Programm/Frontkombination"},
 "feature_1":"1","feature_2":"105","feature_3":null,
 "combi":["1;AURA|105;N151","1;AURA|105;N152", … 349 tuples]}

// blacklist: a single-feature exclusion (no f2/f3)
{"type":"0","allowed":false,"text":{"DE":"nicht f.Geräteschr.m.Ausgl.tür"},
 "feature_1":"1","feature_2":null,"feature_3":null,
 "combi":["1;BRIST","1;HAMPT","1;RAVEN"]}
```

**Type 1 = parametric range** (58 rules). Same `combi` syntax, but the *second* segment is a **magic token**,
not a feature: only **`MAX_W`, `MAX_H`, `MAX_D`** appear (max width / height / depth, in mm). `feature_1`
is the part feature (e.g. 601 worktop, 511/621/551 boards), the value is the part code, and the limit binds
a dimension.
```json
{"type":"1","allowed":true,"text":{"DE":"Längenprüfung AP4060"},
 "feature_1":"601","feature_2":null,"feature_3":null,
 "combi":["601;101|MAX_W;4950","601;106|MAX_W;4950", … ]}
{"text":{"DE":"Längenprüfung NV54"}, …
 "combi":["551;A106|MAX_W;2760|MAX_H;1260","551;A116|MAX_W;2760|MAX_H;1267"]}
```
→ "If part 601/101 is selected, its max producible width is 4950 mm." Häcker calls these *Längenprüfung*
(length checks) — they are **manufacturing/dimension limits**, i.e. valid-size rules. They map cleanly to the
target rules layer's **allowed-ranges**.

**`restrictionRef`** = which restrictions are active in which context:
- `restrictionRef.main` — map `restrictionId → restrictionId` (a set of globally active rule ids).
- `restrictionRef.serie` — per *series/program*: `{"1": {"1":4,"2":1,"3":2,…}}` — for program 1, which rules
  apply (and possibly a priority/variant remap). Plus per-item `RESTRICTIONS` on 7,013 items narrows scope further.

**No explicit `requires`/`default`/`visibility` fields.** Defaults are implicit via `styles` (presets) and
`combined` (auto-fill). "Requires" is expressed indirectly as whitelist intersections. Visibility is implied
by K/U/P grouping + which features have valid options after restriction filtering. **Flag for SME.**

---

## 5. Identifiers & join keys (cross-file key graph)

```
        ┌───────────────────────── featureId (numeric: 1,100,101,105,150,201,303,402,601,…) ─────────────────────────┐
        │                                                                                                            │
        │                 ┌───────── optionValue (string key: N288, 373, AURA, A106, T121, KU, 130E, …) ─────────┐  │
        ▼                 ▼                                                                                       │  │
  featureList.json   ── defines features + option values + RULES (restrictions/restrictionRef) + styles + combined
        │  │  │  │
        │  │  │  └──(featureId, optionValue)──► optionGcodeMapping.json   feature→value→ "gcode(589,0);"  (only feats 105,402,750,755)
        │  │  └─────(featureId, optionValue)──► priceDefinition.json      OPTION_REF [["303","379"]] = [featureId, optionValue] → price
        │  └────────(featureId, optionValue)──► optionMapping.json[geomArchetype][featureId][bindGroup][optionValue]=[materialKey, imosScript]
        └───────────(featureId → optionValue)► styles[] rows  &  combined[] auto-fill   (all use the SAME numeric featureId)

  optionMapping.json keys  = geometryArchetype  (baseshape27floor, unifront, worktop, nq200, …)
        └── SAME vocabulary as the .nfx file names / XML model nodes / itemFlexMapping leaf context

  itemFlexMapping.json
        formule = [CARCASE_BASIC_SHAPE_NO, TK_TYPE, TK_CLASS, TK_FRONT_APPEARANCE, >=TYPE_NO]
        └──join──► itemsSearchInfo.json   (every item carries all 4 attrs + TYPE_NO)   ◄── item identity
                       │  EDP_NUMBER / TYPE_NO  ──join──► XML <ARTICLE> SUPPLIER_AID   (IDM catalog 0071_…xml)
                       │  RESTRICTIONS field    ──ref───► featureList.restrictions / restrictionRef
                       │  PRICE_FEATURE_GROUP_NO ─join──► priceDefinition.featureGroup
                       └  CARCASE_BASIC_SHAPE_NO ─join──► optionMapping geometryArchetype (semantic)
        leaf.flexInfo.navCategory ("115_139") ──join──► Navigram 3D model store
        leaf material ids (balticblue_feinstruktur, ulme_mocca_*) ──join──► Navigram materials / IDM finishes
```

**ID schemes summary**
| Id | Where defined | Joins to |
|---|---|---|
| `featureId` (numeric string) | featureList.features | optionMapping, optionGcodeMapping, priceDefinition (OPTION_REF[0]), styles, combined, optionDebugList |
| `optionValue` (string key) | featureList.features[].options | same set as above (OPTION_REF[1]) |
| `geometryArchetype` (name) | optionMapping keys | .nfx files, XML model nodes, itemFlexMapping context |
| `TYPE_NO` / `EDP_NUMBER` | itemsSearchInfo | XML `<ARTICLE>`, priceDefinition (via groups), flex lookup |
| flex path tuple (shape/type/class/front/typeNo) | itemFlexMapping.formule | itemsSearchInfo item attributes |
| `navCategory` | itemFlexMapping leaf | Navigram |
| material key | optionMapping element[0] | Navigram materials / IDM finish codes |

---

## 6. Cardinalities & scale
- **Features:** 75 (K=42, U=7, P=26).
- **Option values:** 3,476 total (avg ~46/feature). `valid_until` on 251 (lifecycle/EOL).
- **Restrictions:** 227 rules → 54,536 combi tuples. 169 type-0 (combinatorial), 58 type-1 (MAX_* ranges). 180 allow / 47 deny. 3-feature rules: 4.
- **Styles (presets):** 24 families, 349 preset rows.
- **optionMapping:** 131 geometry archetypes × (feature → binding-group → option) bindings (528+ leaf option-bindings sampled; full set larger).
- **itemFlexMapping:** 16 shapes, 105 flex geometry leaves.
- **Items (context):** itemsSearchInfo = 10,234 articles; optionGcodeMapping = 4 features; priceDefinition has featureGroup + priceTypes.

---

## 7. Migration relevance (what an ingestion "port" must capture)

Target = 3 article-keyed layers (geometry / commerce / rules). These files feed **rules** (primary) and
**commerce** (secondary), and `itemFlexMapping` feeds **geometry**.

**RULES layer — port must ingest:**
1. **Feature catalog** (id, type K/U/P, label, rank) and **option-value catalog** (key, label, rank,
   valid_until). Preserve numeric ids verbatim — they are the join spine.
2. **Compatibility rules** (`restrictions` type 0): expand each `combi` tuple into normalized
   (feature,value) constraint rows with `allowed` polarity and `feature_1/2/3` arity. → CPQ
   include/exclude / "valid combination" tables.
3. **Range rules** (`restrictions` type 1): translate `MAX_W/H/D` tuples into allowed-dimension constraints
   per (feature, option). → CPQ numeric constraints / valid-size ranges.
4. **Scoping** (`restrictionRef.main` + `.serie` + per-item `RESTRICTIONS`): which rules apply where.
   Without this you'd over-constrain. **Lossy risk if dropped.**
5. **Presets** (`styles`) → default configurations / "models". **Auto-fill** (`combined`) → bundle/macro
   expansion of composite option codes into components.

**COMMERCE layer:** option→price via `priceDefinition.OPTION_REF` (= [featureId, optionValue]); `valid_until`
= option EOL; material keys in optionMapping = sellable finishes.

**GEOMETRY layer:** `itemFlexMapping` (flex parts, b/t/h, parameters string, navCategory) and
`optionMapping` element[1] (imos scripts) + element[0] (materials). The imos DSL is **executable** — porting
it losslessly means either re-implementing the DSL semantics or capturing the *resulting* geometry deltas.

**Modern representation:** a constraint/CPQ model — Attributes(=features) with Values(=options),
Constraint rules (allow/deny tuples → boolean expressions; MAX_* → numeric bounds), Defaults(=styles),
Derivations(=combined), all scoped per program/series/item. Geometry stays a separate article-keyed layer
linked by the same item attribute tuple + navCategory.

---

## 8. Nuances & gotchas (explicitly wanted)

1. **"Flex" ≠ feature-flexibility.** It is **parametric geometry** (panel parts that scale with cabinet
   dimensions) keyed by item attributes, with a `navCategory` link to Navigram. Easy to misfile under rules;
   it belongs to geometry but shares the item join-key.
2. **No separate value-id.** The option **value IS the dict key** (string). The same literal (e.g. `"373"`,
   `"105"`) means totally different things under different features — *the key is only unique within its
   feature*. Any port that flattens option keys globally will silently merge unrelated options.
3. **Overloaded `combi` strings.** One opaque field encodes the entire rule body as
   `feature;value|feature;value`. Type-1 rules **reuse the same syntax** but inject magic tokens
   `MAX_W/MAX_H/MAX_D` where a feature id would be — a parser must special-case these 3 tokens, or it will
   treat "MAX_W" as a feature.
4. **`allowed` polarity flips meaning.** The same structure is both whitelist and blacklist depending on a
   boolean. Single-feature deny lists have `feature_2=feature_3=null` — don't assume a rule always pairs two features.
5. **imos DSL is live code, not data.** `optionMapping` element[1] is executable imos script
   (`setlabel/dragcomponentatom/att/model/rank`). Its binding-group names (`bodyfinish`, `mygrip`,
   `interiorwhite`…) are shared with the `.nfx` `subscribe(...)` labels — geometry behavior is split across
   two files in one namespace. Lossless migration of behavior is the hardest part.
6. **Geometry-archetype namespace is a third id system** (`baseshape27floor`, `unifront`, `worktop`,
   `nq200`…) distinct from feature ids and item numbers. It is the implicit join between optionMapping, the
   `.nfx` models, and itemFlexMapping, but it is **never stated as an explicit FK** — it's matched by name.
7. **`>=TYPE_NO` threshold lookup.** The last flex level isn't an exact key — the `">="` prefix in `formule`
   implies "match the greatest TYPE_NO ≤ the item's number" (range bucketing by article number). Naive exact-match ingestion will miss rows.
8. **Debug vs prod.** `optionDebugList.json` enumerates *valid option values per feature* as flat arrays —
   it is a debug/QA dump (no labels), useful to cross-check `features[].options` completeness. It includes
   feature 1's program list and is **consistent** with the styles/restrictions vocabulary, but being a debug
   artifact it may be stale relative to prod — verify counts before trusting it as authoritative.
9. **German-only labels, K/U/P unexplained.** All semantics are in `text.DE`; the K/U/P typology and the
   exact algorithm for `>=`, `restrictionRef.serie` remap values, and `combined` precedence are inferred, not documented.
10. **Catalog is dated/regional.** XML = "concept130 2026 national", EUR, DE, valid 2025-10-01, EK-Brutto
    prices ×2 = points. A different catalog/region export would change ids/prices — pin the catalog version on ingest.

---

## 9. Open questions for a Häcker SME
1. Exact meaning of feature `type` **K / U / P** — display grouping, dependency tier, or hard constraint?
2. `restrictionRef.serie` values (`{"1": {"1":4,"2":1,…}}`) — is the value a **priority**, a **variant id**,
   or a **remap** of the rule? And what selects "main" vs a series?
3. Precise semantics of the `>=TYPE_NO` lookup and the part `parameters` string format
   (`PARTCODE,len,?,thick,x,y,z,…,orientation`) — exact column order & units.
4. Is per-item `RESTRICTIONS` an index into `featureList.restrictions`, into `restrictionRef`, or its own list?
5. `combined` precedence: does it override user choices, only pre-fill, and how does it interact with
   `restrictions` (can it set a forbidden value)?
6. Are there `requires`/`default`/`visibility` semantics elsewhere (e.g. in the XML `<FEATURE>` blocks) that
   are *not* in these four JSON files?
7. Authoritative material-key namespace (optionMapping element[0]) → does it map 1:1 to Navigram material ids
   and to IDM finish codes?
8. Is `optionDebugList` generated from the same source as `features[].options`, and is it safe to use for
   validation, or is it a stale snapshot?

---
*Generated read-only via Python sampling of the HK exports; no source files modified.*
