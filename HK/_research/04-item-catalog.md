# 04 — Item / Product Catalog: `itemsSearchInfo.json`

Reverse-engineering report. **Read-only analysis; nothing modified.**
Source: `C:\UnityProject\kitchen-presentation\HK\itemsSearchInfo.json` (~6.44 MB, 6,442,808 bytes).
Manufacturer: **Häcker Küchen** (IDM MANUFACTURER_ID = 71). Catalog: **"concept130 2026 national"**, valid from 2025-10-01, data version 2025-11-27.

---

## 0. TL;DR

`itemsSearchInfo.json` is a flat **array of 10,234 catalog item records**, one per Häcker article (`TYPE_NO`). It is a **denormalized, search-optimized projection of the IDM master catalog XML** (`0071_..._20251127093637.xml`, a BMEcat-style `T_NEW_CATALOG` / `IDM_3_0_1.xsd` export). The projection keeps only the fields a configurator's search/placement UI needs (id, classification, German display text, dimension envelopes, price-group pointer, option restrictions) and **drops** the real price values, weights, volumes, catalog pages, hinge/construction details that live in the XML.

The **article number `TYPE_NO`** is the spine: 100% unique here, present on every sibling-file join, and matches **99.9%** of `<ITEM TYPE_NO=...>` article records in the master XML. `PRICE_FEATURE_GROUP_NO` joins 41/41 into `priceDefinition.json`. The composite key `(CARCASE_BASIC_SHAPE_NO, TK_TYPE, TK_CLASS, TK_FRONT_APPEARANCE, >=TYPE_NO)` joins into `itemFlexMapping.json` (its `formule` literally names these five fields). Option/feature files (`featureList`, `optionMapping`, `optionGcodeMapping`, `optionDebugList`) are keyed by a separate **feature-id → option-code** space (e.g. `105 → N105`), linked to items through `RESTRICTIONS` codes (185/185 resolve into `featureList.restrictions`).

---

## 1. Provenance & format

| Property | Value |
|---|---|
| Root shape | **JSON array** (`list`) of objects |
| Record count | **10,234** |
| Element type | `dict` (flat, one level + small nested dim/equipment objects) |
| Distinct keys across all records | **29** |
| Encoding | UTF-8; non-ASCII emitted as `\uXXXX` escapes (e.g. `für` = "für"). German umlauts throughout. |
| Language | **German only (DE)**. No EN strings. `PRODUCT_GROUP` and `FULL_TEXT` are German. |
| Text markup | `FULL_TEXT` is HTML-ish, **wrapped in `<![CDATA[...]]>`** in 10,234/10,234 records, with `<br>` line breaks — copied verbatim from the XML's multi-line `<TEXT>` blocks. |
| Tool/version hints | None inside this file. Provenance is inferred from the sibling XML header: `T_NEW_CATALOG MAJOR="3" MINOR="0" REVISION="1"`, `xsi:noNamespaceSchemaLocation="IDM_3_0_1.xsd"`, `MANUFACTURER_ID=71`, `CATALOG_ID=N2026`, `CURRENCY_KEY=EUR`, `COUNTRY_ID=DE`. This is the **IDM (master-data) export**; the JSON is the imos/editor-side search index derived from it. |

---

## 2. What is an "item"?

An item = **one orderable Häcker catalog article / position**, identified by `TYPE_NO`. It is the granular "you can put this on an order line" unit, **not** a high-level product family and **not** a low-level CNC part.

Items span the full catalog spectrum:
- **Cabinets / carcases** ("Unter-/Hochschränke Systemat", "Oberschränke Systemat") — configurable bodies with dimension ranges.
- **Fronts / doors / panels** ("Fronten mit Griff", "Glastüren mit Griff", "Landhaus Paneele") — carry `FRONT_DIVISION_DEF`.
- **Shelves, side panels, cornices** ("Wangen", "Regalböden", "Kehlleisten", "Sichtseiten").
- **Appliances & sinks** ("Elektrogeräte", "Spülen/Mischbatterie Edelstahl", "Einbauspülen") — bought-in trade goods (`PRICE_FEATURE_GROUP_NO=9998`).
- **Hardware / accessories / services** ("Diverses": carrying rails, drip trays, bevels, tongue-and-groove joints).

So "item" mixes **sellable SKUs**, **configurable product types** (with `b/h/t` ranges + option restrictions), and **trade goods**. Configurability is expressed by: dimension ranges (`from/to/step`), `PRICE_FIELD` (multiple price columns), `RESTRICTIONS` (allowed options), and `TK_EQUIPMENT`/`hasEquipment` (internal fittings). The article number is the constant; the configuration is layered on top via the option/price/flex files.

---

## 3. Item record fields

**Universal fields (present in all 10,234):**

| Field | Type | Meaning (inferred) | Example |
|---|---|---|---|
| `TYPE_NO` | string | **Primary article id / spine.** Often `EDP_NUMBER` with an optional family prefix (L, V, 5, W, …). 100% unique. | `"LADP2538"`, `"EBR6056"`, `"NV51"` |
| `EDP_NUMBER` | string | Electronic Data Processing / order number (Bestellnummer). 100% unique. Equal to `TYPE_NO` in 3,621 cases; a suffix of it in 3,676. | `"ADP2538"` |
| `TK_TYPE` | string(enum, 25 vals) | imos "Typenkatalog" type class (kind of element: 1,2 cabinets dominate; 38 shelf; 5 panel; 26 appliance…). | `"21"`,`"2"` |
| `TK_CLASS` | string(enum, 17 vals) | imos sub-class (1 = standard; 40 = trade good; 16,8…). | `"1"`,`"40"` |
| `PRODUCT_GROUP` | string(135 vals) | German marketing/grouping name = taxonomy leaf (see §4). | `"Oberschränke Systemat"` |
| `SHORT_TEXT` | string | Short description. **Empty in all 10,234 records** (carried but unused in this export). | `""` |
| `FULL_TEXT` | string (CDATA+HTML) | German description, multi-line `<br>`, in `<![CDATA[…]]>`. Display/search text. | `<![CDATA[Abdeckboden 2.5cm<br>3-seitig profiliert…]]>` |
| `FRONT_DIVISION_DEF` | string | Front split/division definition (front layout cells); non-empty for 5,891 (fronts/panels). | `"Z2655[1]"`, `""` |
| `TK_FRONT_APPEARANCE` | int/string(28 vals) | Front-appearance code (grain direction / handle style group). | `0`,`1`,`"21"` |
| `PRICE_FEATURE_GROUP_NO` | string(41 vals) | **FK → `priceDefinition.json` featureGroup.** `9998` = net/trade-good group. | `"7"`,`"10"`,`"9998"` |
| `PRICE_FIELD` | int[] | Which price columns/levels apply (price-grid column ids). | `[1,2,3,4,5,6,7,8]`, `[1]` |

**Frequent optional fields:**

| Field | Count | Meaning | Example |
|---|---|---|---|
| `CARCASE_BASIC_SHAPE_NO` | 9,046 | Basic carcase shape id (geometry primitive); `0` flat, `1` standard box, `99x` special. | `"1"` |
| `b` / `h` / `t` | 9,011 / 8,981 / 9,025 | **Dimension envelopes** width/height/depth (Breite/Höhe/Tiefe), each an object `{value, from, to, step}` (mm). `step=0` ⇒ fixed; nonzero ⇒ configurable range. | `{"value":"600","from":"100","to":"600","step":"1"}` |
| `TK_EQUIPMENT` | 8,547 | Map of equipment-slot → flag (`{"0":1}` default; `{"31":1}`, `{"18":1,"24":1}`…). Internal fittings present. | `{"0":1}` |
| `RESTRICTIONS` | 7,013 | Array of option-restriction codes (FK → `featureList.restrictions`), e.g. `[null,"50"]`. Drives which feature options are allowed. | `[null,"51"]` |
| `hasEquipment` | 3,927 | Boolean flag (alt/legacy form of equipment presence). | `true` |

**Extended/secondary dimensions (rare; 566 records total):** `b1,b2,b3,b4`, `t1,t2,t3`, `e` (Einbaumaß/cut-out), `a`, `be`, `te` — extra dimension slots for sinks, hobs, corner units, cut-outs. Each same `{value,from,to,step}` shape.

### Trimmed real examples

**(a) Cornice / cover board (fixed-ish):**
```json
{"TYPE_NO":"LADP2538","EDP_NUMBER":"ADP2538","TK_TYPE":"21","TK_CLASS":"1",
 "PRODUCT_GROUP":"Oberschrankregale Landhaus","SHORT_TEXT":"",
 "FULL_TEXT":"<![CDATA[Abdeckboden 2.5cm<br>3-seitig profiliert<br>für Aufsatzschränke]]>",
 "FRONT_DIVISION_DEF":"","TK_FRONT_APPEARANCE":0,"PRICE_FEATURE_GROUP_NO":"7",
 "PRICE_FIELD":[4,7],"TK_EQUIPMENT":{"0":1},"CARCASE_BASIC_SHAPE_NO":"1",
 "b":{"value":"2600","from":"100","to":"2600","step":"1"},
 "h":{"value":"25","from":"25","to":"25","step":0},
 "t":{"value":"383","from":"201","to":"383","step":"1"}}
```

**(b) Configurable shelf board (range width & depth):**
```json
{"TYPE_NO":"EBR6056","EDP_NUMBER":"EBR6056","TK_TYPE":"38","TK_CLASS":"1",
 "PRODUCT_GROUP":"Regalböden Systemat 25mm",
 "FULL_TEXT":"<![CDATA[Einlegeboden für Regale <br>variabel bis 60cm…]]>",
 "PRICE_FEATURE_GROUP_NO":"5","PRICE_FIELD":[1,2,4,6,10,11,12,14],
 "TK_EQUIPMENT":{"0":1},"CARCASE_BASIC_SHAPE_NO":"0",
 "b":{"value":"600","from":"100","to":"600","step":"1"},
 "h":{"value":"16","from":"16","to":"16","step":0},
 "t":{"value":"541","from":"100","to":"541","step":"1"}}
```

**(c) Trade-good sink with extended dim `e` (cut-out):**
```json
{"TYPE_NO":"ES400","EDP_NUMBER":"ES400","TK_TYPE":"29","TK_CLASS":"1",
 "PRODUCT_GROUP":"Diverses",
 "FULL_TEXT":"<![CDATA[Unterbauspüle Franke<br>…Edelstahl poliert…]]>",
 "TK_FRONT_APPEARANCE":"21","PRICE_FEATURE_GROUP_NO":"9998","PRICE_FIELD":[1],
 "hasEquipment":true,"CARCASE_BASIC_SHAPE_NO":"994",
 "b":{"value":"540","from":"540","to":"540","step":0},
 "e":{"value":"190", …}}
```

> **No direct geometry-asset reference in the item record.** There is **no** `.nfx` filename, no Navigram id, no model-file path field inside `itemsSearchInfo.json`. Geometry is linked indirectly: `CARCASE_BASIC_SHAPE_NO` + `TK_TYPE` etc. resolve through `itemFlexMapping.json` to a `navCategory` (e.g. `"115_139"`) and a `flexObjectId` ("collection") plus a `parameters` string of part primitives (`MFR11,50,373,25,…`). The standalone `baseshape1high.nfx` is a base-shape geometry template, not per-article. So the geometry binding is **shape-class → flex template → Navigram category**, not a per-item asset id.

---

## 4. Scale & taxonomy

- **10,234 items.**
- **`PRODUCT_GROUP`: 135 distinct values** — the visible taxonomy. It is **flat in the JSON** (single string per item, no parent pointer), but the strings encode a 2–3 level hierarchy by naming convention, e.g.:
  - Programme/system: `Unter-, Hochschränke Systemat`, `Oberschränke Systemat`, `…Systemat ART` (ART = a sub-line/variant).
  - Material/thickness: `Wangen Systemat 50mm / 25mm / 16mm / 10mm`, `Regalböden Systemat 25mm`.
  - Family: `… Landhaus` (country style).
- **Top groups:** `Unter-/Hochschr.mit SK/AZ Sys.` (1,042), `Unter-, Hochschränke Systemat` (996), `…m.SK/AZ Sy.ART` (736), `Elektrogeräte` (712), `Diverses` (708), `…Syst.ART` (658), `Spülen/Mischbatterie Edelstahl` (251), `Oberschränke Systemat` (222). ("SK/AZ" = Schubkasten/Auszug = drawer/pull-out.)
- The **richer hierarchy lives in the XML**: `<PRODUCT_GROUPS><PRODUCT_GROUP>` nodes carry `<FEATURE_CLASS_REF FEATURE_CLASS_NO="49"/>` and contain `<ITEMS><ITEM>`. So PRODUCT_GROUP ↔ a `FEATURE_CLASS_NO` (geometry/feature class) in the master — that mapping is **not** present in this JSON (lossy for taxonomy lineage).
- Secondary classification axes: `TK_TYPE` (25 vals) and `TK_CLASS` (17 vals) — the imos type-catalog dimensions, orthogonal to `PRODUCT_GROUP`.

---

## 5. The article-number spine & cross-file key graph

`TYPE_NO` is the primary key. Verified joins:

```
                         ┌─────────────────────────────────────────────────────────┐
                         │  itemsSearchInfo.json  (10,234 records, key = TYPE_NO)    │
                         │  TYPE_NO · EDP_NUMBER · TK_TYPE · TK_CLASS ·              │
                         │  CARCASE_BASIC_SHAPE_NO · TK_FRONT_APPEARANCE ·          │
                         │  PRICE_FEATURE_GROUP_NO · PRICE_FIELD · RESTRICTIONS      │
                         └─────────────────────────────────────────────────────────┘
        TYPE_NO (article)         │                    │  PRICE_FEATURE_GROUP_NO        │ RESTRICTIONS[ ] codes
        ───────────────────────────┘                    └──────────────┐                └──────────────┐
        │                                                              │                               │
        ▼  (exact, 99.9%: 10,221/10,234)                               ▼ (41/41 exact)                 ▼ (185/185 exact)
┌───────────────────────────────────┐            ┌──────────────────────────────┐   ┌──────────────────────────────────────┐
│ MASTER XML  T_NEW_CATALOG          │            │ priceDefinition.json         │   │ featureList.json                      │
│ 0071_..._20251127093637.xml        │            │  featureGroup{ "7": {...} }  │   │  features{ "105": {options{N105…}}}   │
│ <ITEM TYPE_NO="LADP2538">          │            │  ADDITIONAL_PRICE,           │   │  restrictions{ "50": {feature_1,     │
│   <EDP_NUMBER>ADP2538</EDP_NUMBER> │            │  PRICE_CALC_METHOD,          │   │     feature_2, combi[ "1;AURA|105;…"]}│
│   <PRICE_FEATURE_GROUP_BASE_PRICE  │            │  FINISH[ OPTION_REF,         │   │  styles · combined · restrictionRef   │
│     _REF PRICE_FEATURE_GROUP_NO=7> │            │    PRICE_FIELD,              │   └──────────────────────────────────────┘
│     <ITEM_PRICE><PRICE_FIELD>4     │            │    SUPPLIER_PRICE_GROUP ] }  │             │ feature-id (105) + option-code (N105)
│       <PRICE>1800</PRICE> …        │            │  priceTypes{…}               │             │ shared key space
│   <WEIGHT>10</WEIGHT><VOLUME>1>    │            └──────────────────────────────┘             ▼
│   <CATALOG_PAGE>5/11</CATALOG_PAGE>│              (PRICE_FIELD columns ←→ items.PRICE_FIELD)  ┌───────────────────────────────────────┐
│   <CARCASE_BASIC_SHAPE_NO=1> …     │                                                          │ optionMapping.json (feat→opt→[style,    │
└───────────────────────────────────┘                                                          │   imos-macro])                          │
        │ composite key                                                                         │ optionGcodeMapping.json (feat→opt→gcode)│
        ▼ (CARCASE_BASIC_SHAPE_NO, TK_TYPE, TK_CLASS, TK_FRONT_APPEARANCE, >=TYPE_NO)           │ optionDebugList.json (feat→[opt codes]) │
┌──────────────────────────────────────────────────────────────────────┐                       └───────────────────────────────────────┘
│ itemFlexMapping.json                                                   │
│  "formule":["CARCASE_BASIC_SHAPE_NO","TK_TYPE","TK_CLASS",             │
│             "TK_FRONT_APPEARANCE",">=TYPE_NO"]                          │
│  data[shape][tk_type][tk_class][front_app][TYPE_NO] = {                 │
│     flexInfo:{ flexObjectId:"collection",                              │
│                navCategory:"115_139",   ← Navigram geometry category   │
│                setFlexProperty:{collection:{b,t,h,parameters:"MFR11,…"}}│
│  }  (2,491 leaf keys; 1,640 exact TYPE_NO, rest >= range thresholds)    │
└──────────────────────────────────────────────────────────────────────┘
```

**Join cheat-sheet (field → target):**

| From (items field) | To (file.path) | Cardinality | Verified |
|---|---|---|---|
| `TYPE_NO` | master XML `<ITEM TYPE_NO=…>` | 1:1 article | **10,221/10,234 = 99.9%** match (13 missing: `EM600`–`EM605`, `MP-FAST`, and trailing-slash placeholders `GFESP/`, `KFR760AB/`…) |
| `PRICE_FEATURE_GROUP_NO` | `priceDefinition.json` → `featureGroup[key]` | many:1 | **41/41** distinct values resolve |
| `PRICE_FIELD[ ]` | `priceDefinition.json` `FINISH[].PRICE_FIELD` / XML `<ITEM_PRICE><PRICE_FIELD>` | column ids | structurally consistent |
| `(CARCASE_BASIC_SHAPE_NO, TK_TYPE, TK_CLASS, TK_FRONT_APPEARANCE, >=TYPE_NO)` | `itemFlexMapping.json` → `data[…][TYPE_NO]` | composite | `formule` declares exactly these 5 fields; 1,640 exact-TYPE_NO leaves + range (`>=`) thresholds. **Not every item has a flex entry** (flex = items needing geometry parameterisation). |
| `RESTRICTIONS[ ]` (non-null codes) | `featureList.json` → `restrictions[code]` | many:many | **185/185** distinct codes resolve |
| (indirect) flex `navCategory` | Navigram 3D store (external) | — | category id only; actual model not in these files |

**Feature/option sub-graph** (does **not** key on TYPE_NO): `featureList.features[FEATURE_NO].options[OPTION_KEY]` is the master option dictionary (e.g. `105` "Front-Kombination" → `N105` "quarzgrau"). The same `feature → option` keys index `optionMapping.json` (→ `[styleName, imos macro string]`), `optionGcodeMapping.json` (→ `gcode(589,0);` CNC macro), and `optionDebugList.json` (→ flat list of valid option codes per feature). Items connect to this sub-graph **only through `RESTRICTIONS`** (which options are legal for the article) and through the price `OPTION_REF` pairs in `priceDefinition.json` (`["303","379"]` = feature 303, option 379).

---

## 6. Search / index semantics — this is a derived projection

The name "searchInfo" is accurate: this file is the **denormalized search/placement index** the editor loads to let a planner find and drop an article. What is effectively indexed per item:
- **Identity:** `TYPE_NO`, `EDP_NUMBER` (both searchable order ids).
- **Free-text:** `FULL_TEXT` (German description) — the keyword search corpus. (`SHORT_TEXT` reserved but empty here.)
- **Faceted attributes:** `PRODUCT_GROUP` (category facet), `TK_TYPE`/`TK_CLASS` (type facets), dimension envelopes `b/h/t` (size filtering), `TK_FRONT_APPEARANCE`.
- **Constraints for the placement engine:** `RESTRICTIONS`, `TK_EQUIPMENT`/`hasEquipment`, `CARCASE_BASIC_SHAPE_NO`, `FRONT_DIVISION_DEF`, `PRICE_FEATURE_GROUP_NO`/`PRICE_FIELD` (so the UI can price/configure without re-reading the 93 MB XML).

**This is a projection, not source-of-truth.** Proof: the XML `<ITEM>` for the same `TYPE_NO` carries fields this JSON omits — actual `<PRICE>1800</PRICE>` values, `<WEIGHT>`, `<VOLUME>`, `<CATALOG_PAGE>5/11`, `<HINGE>`, `<CONSTRUCTION_ID>`, `<CALC_GROUP_REF>`, `<VAT_ID_REF>`, `<EXCHANGE_ID_REF>`, full multilingual `<PRODUCT_GROUP_TEXT>` with `<FEATURE_CLASS_REF>`. The JSON has **no price numbers at all** — only the *pointer* (`PRICE_FEATURE_GROUP_NO` + `PRICE_FIELD` columns). **Migrating this file alone ≠ migrating the catalog.** It is one of several derived views generated from the IDM master (the XML) for the configurator runtime.

---

## 7. Migration relevance

**Target model = three article-keyed layers (geometry / commerce / rules), spine = article number.** `TYPE_NO` is that spine, and it is clean (100% unique, 99.9% reconcilable to master). Mapping:

| Target layer | Source in this ecosystem | Notes |
|---|---|---|
| **Catalog/SKU spine** | `itemsSearchInfo.TYPE_NO` + `EDP_NUMBER`, name `FULL_TEXT`, taxonomy `PRODUCT_GROUP` | Use as the article registry; but treat the **XML `<ITEM>` as source-of-truth** and this JSON as a validation/search overlay. |
| **Commerce** | `PRICE_FEATURE_GROUP_NO`/`PRICE_FIELD` (pointer) → `priceDefinition.json` (rules) → XML `<ITEM_PRICE><PRICE>` (actual numbers) | **Prices are NOT in this file.** Port must read priceDefinition + XML to get values. |
| **Geometry** | `CARCASE_BASIC_SHAPE_NO`/`TK_TYPE`/… → `itemFlexMapping.json` (`navCategory`, `parameters`) → Navigram + `.nfx` | Item→geometry is **indirect via flex**; capture the flex `parameters` strings and `navCategory` ids. |
| **Rules** | `RESTRICTIONS` → `featureList.restrictions` (`combi[]` allow/deny), `TK_EQUIPMENT` | Option legality + equipment. Configurable dims (`from/to/step`) are also rules. |

**An ingestion "port" for *this* file must capture (lossless):** the full record incl. all 29 keys, the **CDATA-preserved** `FULL_TEXT` (line breaks are meaningful), the `{value,from,to,step}` semantics for every dimension slot (incl. the rare `b1..b4,t1..t3,e,a,be,te`), `PRICE_FIELD` as an *ordered set of column ids*, `RESTRICTIONS` arrays **including the leading `null`** (positional — element 0 null seems to be a slot placeholder), and `TK_EQUIPMENT` as a slot-map (not a scalar).

**Lossy / risky if you port only this file:**
- No prices, weights, volumes, hinge/construction, catalog page, VAT, multilingual text → must come from XML/priceDefinition.
- No explicit geometry asset id → must come from flex + Navigram.
- No PRODUCT_GROUP→FEATURE_CLASS lineage → only the leaf label survives.
- 13 articles don't reconcile to the XML article list — investigate before declaring "lossless/verifiable".

---

## 8. Nuances & gotchas

1. **Projection, not master.** `itemsSearchInfo.json` is a denormalized search view of the IDM XML; same `TYPE_NO` order, but stripped of prices/weights/etc. Do not treat it as source-of-truth for commerce or geometry.
2. **Two id fields, both unique, subtly different.** `TYPE_NO` = imos type id (may carry a family prefix L/V/5/W); `EDP_NUMBER` = order number. Equal in 3,621/10,234, prefix-related in 3,676, *unrelated-looking* in the rest. Join on **`TYPE_NO`**, but keep `EDP_NUMBER` for ERP/ordering.
3. **`RESTRICTIONS` arrays are positional and start with `null`** (e.g. `[null,"50"]`, `[null,"51","3"]`). The leading `null` is a fixed slot — do not "clean" it out; the index of each code matters.
4. **Dimensions are 4-field objects with mixed types.** `step` is `"1"` (string) when configurable but `0` (int) when fixed; `value/from/to` are strings (mm). Numeric parsing must tolerate string↔int and `step==0 ⇒ non-configurable`. Rare extra slots `b1..b4,t1..t3,e,a,be,te` (566 records) easily missed.
5. **`PRICE_FEATURE_GROUP_NO=9998` is a magic value** = net/trade-good (Elektrogeräte, sinks, Diverses) — 2,420 records. These have trivial `PRICE_FIELD=[1]` and are bought-in, not manufactured; price logic differs.
6. **Geometry is indirect.** No per-item model id/filename. Item→geometry only resolves through `itemFlexMapping` (`navCategory` + `parameters` part-list) and Navigram. The lone `baseshape1high.nfx` is a generic template, not article-bound.
7. **`SHORT_TEXT` empty everywhere; `FULL_TEXT` is CDATA+HTML German.** Encoding is `\uXXXX`-escaped UTF-8 (umlauts). Locale = DE/EUR only — multilingual/multi-currency is absent and would have to come from other catalog exports.
8. **Flex join uses a `>=TYPE_NO` range, not pure equality.** `itemFlexMapping.formule` ends with `>=TYPE_NO`; only 1,640 of 2,491 flex leaves are exact `TYPE_NO`, the rest act as **threshold buckets** over the sorted article space. A naïve equality join will silently miss matches.
9. **`TK_TYPE`/`TK_CLASS`/`TK_FRONT_APPEARANCE` mix int and string** across records (e.g. `TK_FRONT_APPEARANCE` is `0` int or `"21"` string). Normalize types before keying.

---

## 9. Open questions for a Häcker / imos SME

1. **`TYPE_NO` vs `EDP_NUMBER`** — exact rule for the prefix (L/V/5/W…)? Is `EDP_NUMBER` the ERP order key and `TYPE_NO` the editor key? Which is authoritative for migration identity?
2. **The 13 unreconciled articles** (`EM600`–`EM605`, `MP-FAST`, `GFESP/`, `KFR760AB/`, `KFR580AB/`…) — are the trailing-`/` ones template/placeholder stubs? Are EM6xx in a separate appliance catalog block? Are they orderable?
3. **`RESTRICTIONS` leading `null`** — what does slot 0 represent? Are positions fixed-semantic (slot1 = front program, slot2 = …)?
4. **`TK_TYPE` / `TK_CLASS` / `CARCASE_BASIC_SHAPE_NO` code books** — need the enumerations (we see the ids, not their meanings). Especially the `99x` carcase shapes (992/994/995/996) used by sinks/appliances.
5. **`PRICE_FIELD` columns** — what do columns 1–24 mean (size tiers? finish groups? supplier price groups)? How do `items.PRICE_FIELD` and `priceDefinition FINISH[].PRICE_FIELD` combine to a single price?
6. **`navCategory` (e.g. `115_139`)** — how does it resolve to a concrete Navigram 3D model / `.nfx`? Is the `parameters` string in flex sufficient to rebuild geometry, or only an index?
7. **Is `itemsSearchInfo.json` regenerated deterministically from the XML?** If so, we can treat the XML as the single source-of-truth and discard this file post-migration (keeping only the index spec).
8. **`TK_EQUIPMENT` slot map** — what are slots (0,18,19,24,27,31,41…)? Internal pull-outs/fittings? Where are their geometries/prices?
9. **`FRONT_DIVISION_DEF` grammar** (e.g. `Z2655[1]`) — front-cell division syntax; how does it map to the XML `<FRONT_CELL>` / `<FRONT_TYPE>` structures?

---

### Appendix — counts at a glance
- Records: **10,234** · distinct keys: **29** · universal keys: **11**
- `TYPE_NO` unique: **10,234/10,234** · `EDP_NUMBER` unique: **10,234/10,234**
- `PRODUCT_GROUP` distinct: **135**
- `TK_TYPE` distinct: **25** · `TK_CLASS` distinct: **17** · `PRICE_FEATURE_GROUP_NO` distinct: **41** · `CARCASE_BASIC_SHAPE_NO` distinct: **18** · `TK_FRONT_APPEARANCE` distinct: **28**
- Have any of b/h/t: **9,046** · have extended dims: **566** · have `RESTRICTIONS`: **7,013** · have `TK_EQUIPMENT`: **8,547** · `FRONT_DIVISION_DEF` non-empty: **5,891**
- Cross-file: TYPE_NO→XML **99.9%** (10,221) · PRICE_FEATURE_GROUP_NO→priceDefinition **41/41** · RESTRICTIONS→featureList.restrictions **185/185** · flex composite key declared by `formule`.
