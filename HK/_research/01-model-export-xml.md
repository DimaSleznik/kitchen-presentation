# Data Archaeology — Häcker Küchen legacy export: the 92 MB XML + `.nfx`

**Analyst note (READ FIRST — corrects the brief's premise):** The brief assumed the 92 MB XML
is "the geometry+production payload" — *one exported kitchen scene* from **imos**. **It is not.**
The XML is an **IDM catalog export** (the master-data/commerce/rules layer — the thing the brief
calls "IDM"), **not** a geometry/scene file. It contains **zero 3D geometry, zero machining
coordinates, zero G-code**. The actual parametric geometry lives in **imos `.nfx` scripts**
(of which `baseshape1high.nfx` is one) and in the sibling `itemFlexMapping.json`. Production
"G-code" hooks live in `optionGcodeMapping.json`. This re-framing changes the whole migration
map, so it is documented carefully below.

Files analysed (all in `C:\UnityProject\kitchen-presentation\HK\`):
- `0071_3_0_1_n6dn_D_D_2026_1_20251127093637.xml` — 92,795,077 bytes, **2,029,029 lines**.
- `baseshape1high.nfx` — 6,444 bytes, 49 lines (read in full).
- Sibling catalog JSONs (present in same dir, used for cross-checking join keys):
  `featureList.json`, `itemFlexMapping.json`, `itemsSearchInfo.json`, `optionDebugList.json`,
  `optionGcodeMapping.json`, `optionMapping.json`, `priceDefinition.json`.

---

## 1. Provenance & format

**Root element & schema (line 1, verbatim):**
```xml
<T_NEW_CATALOG MAJOR="3" MINOR="0" REVISION="1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="IDM_3_0_1.xsd">
```

- **Format: IDM 3.0.1** — *Integriertes Datenmodell*, the German furniture-industry
  master-data exchange standard published by the **DCC (Daten Competence Center Möbel,
  dcc-moebel.org)**. Schema: `IDM_3_0_1.xsd` (referenced, not embedded). Confirmed against
  the official DCC schema docs (`dcc-moebel.org/dochtml/IDM_3_0_1_XML_Schema.en/`) and the
  Roomle IDM importer docs (`docs-v1.roomle.com/idm/IDMFormat.html`), both of which describe
  the exact `T_NEW_CATALOG` → `CATALOG` / `SUPPLIER` / `FEATURE_DEFINITION` / `PRICE_DEFINITION`
  structure seen here.
- IDM is a furniture-trade descendant of BMEcat. It is the **interchange/catalog** layer that
  imos/IDM-Editor (and configurators like Carat/KPS, Roomle, etc.) read. It is **not** an
  imos-native geometry format.
- **This is NOT a single kitchen scene.** It is the **entire `concept130 2026 national` price
  list / catalog** for manufacturer 71 (Häcker, brand "concept130"). One file = thousands of
  orderable article types, their option logic, and their prices.

**Catalog identification header (lines 3–18):**
```xml
<MANUFACTURER_ID>71</MANUFACTURER_ID>     <!-- Häcker = supplier 71 -->
<CATALOG_ID>N2026</CATALOG_ID>
<MAJOR_NO>2026</MAJOR_NO> <MINOR_NO>4</MINOR_NO>
<FILE_RELEASE_DATE>2025-11-27T09:36:37</FILE_RELEASE_DATE>  <!-- matches filename timestamp -->
<ISO_LANGUAGE_ID>DE</ISO_LANGUAGE_ID>
<CURRENCY_KEY>EUR</CURRENCY_KEY> <COUNTRY_ID>DE</COUNTRY_ID>
<PRODUCT_BRANDNAME>2</PRODUCT_BRANDNAME> <PRICE_ID>3</PRICE_ID> <VAT>0</VAT>
...
<CATALOG_NAME>...<TEXT>concept130 2026 national</TEXT>...
<DATA_VERSION>2025-11-27</DATA_VERSION>
<VALID_FROM_DATE>2025-10-01</VALID_FROM_DATE>
```
The **filename decodes** as: `0071` = manufacturer 71; `3_0_1` = IDM schema version; `n6dn`
catalog/variant token; `D_D` = language/country DE/DE; `2026_1`; `20251127093637` = release
timestamp (matches `FILE_RELEASE_DATE`).

**Encoding:** UTF-8, **no BOM, no `<?xml ?>` declaration** (file begins directly with `<T_NEW_CATALOG`).
Verified: the `ü` in "übergreif." is bytes `C3 BC` = canonical UTF-8. German umlauts appear as raw
multibyte UTF-8 throughout. **No XML namespaces** other than the `xsi` hint (it's
`noNamespaceSchemaLocation`, i.e. the catalog body is in the empty/default namespace).

**Tool signature:** No embedded "generator" comment/PI. Provenance is established purely by the
schema reference + DCC vocabulary. The producing tool is whatever Häcker uses to publish IDM
(their IDM master-data system / "IDM Editor"); the consumer side is imos + configurators.

---

## 2. Top-level structure

`T_NEW_CATALOG` → single `CATALOG` → these direct child sections (counts of the `<TAG` opener
at indent level 2, i.e. direct children of `CATALOG`):

| Section (in document order)        | Role                                                            |
|------------------------------------|----------------------------------------------------------------|
| `CATALOG_IDENTIFICATION`           | manufacturer/catalog/version/lang/currency (see §1)            |
| `CATALOG_NAME`, `CATALOG_INFO`     | catalog title + legal/pricing preamble text (German)          |
| `DATA_VERSION`, `VALID_FROM_DATE`, `FILE_ID`, `CATALOG_MARK`, `FILLING_LEVEL`, `PRICING_TERMS` | catalog meta |
| `CONTACT_SUPPLIER`, `CONTACT_PERSON`, `GLN_NO`, `BRANCH_ID`, `EDI_INFO`(×3) | supplier/EDI admin |
| `FRONTS_HANDLE_POSITIONS`          | symbolic handle-orientation tables per front type (line 162)    |
| `GROUP_TITLES`                     | option-group title text refs (line 316)                        |
| **`SERIE SERIE_NO="0"`** (line 572) and **`SERIE SERIE_NO="2"`** (line 124602) | **the article catalog** — by far the bulk (lines 572 → ~1.62M) |
| `RESTRICTIONS` (line 1620381)      | global option-compatibility rules                              |
| `FEATURE_CLASSES` (1620419)        | feature-class definitions (variant axes grouped)              |
| `FEATURES` (1621194)               | `COMBINED_FEATURE` composite options                          |
| `OPTION_DEFINITION` (1650300)      | per-`STYLE` defaults (front depth/distance, default opt-groups)|
| `RESTRICTIONS` (1651294)           | (second) restriction set — option combinations                |
| `PRICE_FEATURE_GROUPS` (1889480)   | price-feature-group → surcharge logic                         |
| `SET_OF_EXCHANGE_IDS` (2028594)    | exchange/tausch ids                                            |
| `VALUE_ADDED_TAXES` (2028624)      | VAT table                                                     |
| `MERCHANDISE_GROUP` ×3 (B/N/R)     | merchandise groups                                            |
| `PRICE_TYPES` (2028738)            | price-type definitions                                        |
| `SET_OF_BLOCK_RULES` (2028977)     | block/value-calculation rules (Verrechnung) — file tail       |

Inside a `SERIE` the hierarchy is:
`SERIE → PRODUCT_GROUPS → PRODUCT_GROUP → ITEMS → ITEM` (articles are **nested under product
groups inside a series**, not a flat list).

**Most-frequent elements across the whole file** (top of `grep | sort | uniq -c`):

| count   | tag                       | meaning |
|---------|---------------------------|---------|
| 172,351 | `OPTION_REF`              | references an option (FEATURE_NO + OPTION_KEY) inside rules/prices |
| 153,690 | `PRICE_FIELD`             | which price column a price applies to |
| 130,510 | `PRICE`                   | a price value (integer, see §6) |
| 130,510 | `ITEM_PRICE`              | price entry (PRICE_FIELD + PRICE) |
| 54,008  | `OPTION_COMBINATION`      | a tuple of OPTION_REFs (the unit of a rule) |
| 48,191  | `TEXT`                    | localized text leaf |
| 45,699  | `ITEM_REF`                | reference to an item (in prices/option groups) |
| 37,449  | `br`                      | literal `<br>` line-break **inside CDATA** product text (not real markup) |
| 33,611  | `TEXT_LINE`               | a sequence-numbered text line |
| 28,672  | `BASIC_SHAPE_PARAMETER`   | a dimension param (b/h/t) with nominal + from/to/step |
| 25,895  | `LANGUAGE`                | language wrapper (always `DE` here) |
| 23,180  | `FINISH` / `SUPPLIER_PRICE_GROUP` | finish/price-group rows in price logic |
| 21,764  | `FRONT_CELL` / `FRONT_CELL_NO` / `MOUNTING_HEIGHT_FROM`/`_TO` | front-division cells |
| 13,608  | `ITEM_INFORMATION` / `CLASS` | item info + classification |
| 10,927  | `HINGE` / `CONSTRUCTION_ID`  | per-item hinge flag / construction id |
| **10,227** | **`ITEM` / `EDP_NUMBER` / `TYPE_KEY` / `ITEM_IDENTIFICATION`** | **≈ 10,227 article types in this catalog** |
| 9,041   | `CARCASE_BASIC_SHAPE` / `BASIC_SHAPE_PARAMETERS` / `BASIC_PROFILE` | per-item abstract shape envelope |
| 8,345 / 8,223 | `HANDLE_POSITION_1` / `HANDLE_ORIENTATION_1` | per-item handle placement (symbolic) |

So the file is **~10,227 article types**, dominated by **pricing** (`PRICE*`, `OPTION_REF`,
`ITEM_PRICE`) and **option/rule logic** (`OPTION_COMBINATION`, `RESTRICTION_REF`,
`COMBINED_FEATURE`). Geometry is represented only abstractly (`BASIC_SHAPE_PARAMETER`).

---

## 3. How one article is represented (representative `ITEM`)

Representative example — `TYPE_NO="LADP2538"` (an "Abdeckboden 2.5cm, 3-seitig profiliert"),
SERIE 0, lines ~590–650 (trimmed):

```xml
<ITEM SERIE_NO="0" TYPE_NO="LADP2538">
  <PRICE_FEATURE_GROUP_BASE_PRICE_REF PRICE_FEATURE_GROUP_NO="7">
    <ITEM_PRICE><PRICE_FIELD>4</PRICE_FIELD><PRICE>1800</PRICE></ITEM_PRICE>
    <ITEM_PRICE><PRICE_FIELD>7</PRICE_FIELD><PRICE>1800</PRICE></ITEM_PRICE>
  </PRICE_FEATURE_GROUP_BASE_PRICE_REF>
  <PRICE_TYPE_REF PRICE_TYPE_NO="30"/>
  <CALC_GROUP_REF CALC_GROUP_NO="11"/>
  <EXCHANGE_ID_REF EXCHANGE_ID_NO="1"/>
  <ADDITIONAL_ITEMS/>
  <HINGE>N</HINGE>
  <EDP_NUMBER>ADP2538</EDP_NUMBER>           <!-- orderable article no. (TYPE_NO = L + EDP) -->
  <ITEM_IDENTIFICATION>K</ITEM_IDENTIFICATION>
  <CATALOG_PAGE>5/11</CATALOG_PAGE>
  <VAT_ID_REF VAT_NO="1"/>
  <WEIGHT>10</WEIGHT> <VOLUME>1</VOLUME>      <!-- logistics, NOT geometry -->
  <CONSTRUCTION_ID>N</CONSTRUCTION_ID>
  <RANGE_DEPENDENT>false</RANGE_DEPENDENT>
  <EX_FACTORY_MODIFICATION>1</EX_FACTORY_MODIFICATION>
  <BASIC_PROFILE>
    <CARCASE_BASIC_SHAPE CARCASE_BASIC_SHAPE_NO="1">
      <BASIC_SHAPE_PARAMETERS>
        <BASIC_SHAPE_PARAMETER BASIC_SHAPE_NAME="b" BASIC_SHAPE_NOMINAL_VALUE="2600"
                               BASIC_SHAPE_FROM="100" BASIC_SHAPE_TO="2600" BASIC_SHAPE_STEP_SIZE="1"/>
        <BASIC_SHAPE_PARAMETER BASIC_SHAPE_NAME="h" BASIC_SHAPE_NOMINAL_VALUE="25"/>
        <BASIC_SHAPE_PARAMETER BASIC_SHAPE_NAME="t" BASIC_SHAPE_NOMINAL_VALUE="383"
                               BASIC_SHAPE_FROM="201" BASIC_SHAPE_TO="383" BASIC_SHAPE_STEP_SIZE="1"/>
      </BASIC_SHAPE_PARAMETERS>
    </CARCASE_BASIC_SHAPE>
  </BASIC_PROFILE>
  <ITEM_TEXT>
    <SHORT_TEXT>...<TEXT>Abdeckboden 2.5cm</TEXT>...<TEXT>3-seitig profiliert</TEXT>...</SHORT_TEXT>
    <FULL_TEXT>...<TEXT><![CDATA[Abdeckboden 2.5cm<br>3-seitig profiliert<br>für Aufsatzschränke]]></TEXT>...</FULL_TEXT>
  </ITEM_TEXT>
  <TYPE_KEY><TK_TYPE>21</TK_TYPE><TK_CLASS>1</TK_CLASS></TYPE_KEY>
  <CLASSIFICATION>
    <OTHER_CATEGORISATION CATEGORY_ID="1"><CATEGORY_CODE>06017250220</CATEGORY_CODE></OTHER_CATEGORISATION>
  </CLASSIFICATION>
</ITEM>
```

What an ITEM actually carries:
- **Identity:** `TYPE_NO` (catalog type, here `LADP2538`), `EDP_NUMBER` (orderable EDP article no.,
  here `ADP2538` — note `TYPE_NO` = locale-prefix `L` + EDP), `ITEM_IDENTIFICATION` (`K` = Korpus/carcass kind).
- **"Geometry" = abstract envelope only:** `BASIC_PROFILE → CARCASE_BASIC_SHAPE (NO=n) →
  BASIC_SHAPE_PARAMETER` with `b`/`h`/`t` (**b**reite/width, **h**öhe/height, **t**iefe/depth)
  giving a nominal value plus an allowed `FROM`/`TO` range + `STEP_SIZE` (**all in millimetres**).
  This is the **size envelope & valid-size rule**, not a shape: there are **no panels, no
  thickness-per-board, no positions, no transforms, no vertices, no edges**.
- **Commerce:** `PRICE_FEATURE_GROUP_BASE_PRICE_REF` with `ITEM_PRICE`(`PRICE_FIELD`,`PRICE`),
  plus `PRICE_TYPE_REF`, `CALC_GROUP_REF`, `EXCHANGE_ID_REF`, `VAT_ID_REF`. (Some items also
  carry `PRICE_MINIMUM_BASIC` / `BASIC_PRICE_UNIT`, e.g. type `NV54`.)
- **Classification:** `TYPE_KEY` (`TK_TYPE`,`TK_CLASS` — and elsewhere `TK_FRONT_APPEARANCE`,
  `TK_SHAPE`, `TK_EQUIPMENT`), `CLASSIFICATION/OTHER_CATEGORISATION/CATEGORY_CODE` (a
  numeric merchandise taxonomy code).
- **Logistics:** `WEIGHT`, `VOLUME` (NOT geometry — shipping figures).
- **Construction hints (flags, not geometry):** `HINGE` (N/L/R…), `CONSTRUCTION_ID`,
  `EX_FACTORY_MODIFICATION`, `RANGE_DEPENDENT`.
- **Optional front layout:** `FRONT_DIVISIONS → FRONT_GROUP → FRONT_DIVISION
  (FRONT_DIVISION_DEF e.g. "Z2655[1]") → FRONT_CELL (FRONT_CELL_NO, FRONT_TYPE code,
  MOUNTING_HEIGHT_FROM/TO)`. This describes *how the front is split into cells* and the front
  TYPE codes — still symbolic, in mm heights, **not 3D**.

**Materials / edge-banding / hardware / drillings / CNC ops: NOT present per-item as data.**
Words like *Bohrung* (drilling), *Kantenbelegung* (edge-banding), *Scharnier* (hinge),
*Beschlag* (fitting) occur **only inside `<TEXT>`/CDATA human descriptions** (verified: e.g.
`<TEXT>Bohrung Ø 5.1-10cm für</TEXT>`, `<TEXT>mit Kantenbelegung</TEXT>`, `Matrix geschliffen`
is a *surface finish*, "Meshgewebe" is an appliance grease-filter spec). They are **not**
machinable geometry. Material/finish *selection* is handled as **options** (see §5), with the
actual material/decor catalog living in the sibling `featureList.json` / `optionMapping.json`.

---

## 4. Production / CNC data

**There is no machining, NC, drilling-coordinate or G-code data in the XML. None.** Targeted
case-insensitive scans over the full 2.03 M lines: `gcode`/`g-code` = 0; `transform`/`vertex`/
`vertices`/`polygon` = 0; `matrix` = 1 (a *finish* name "Matrix geschliffen"); `mesh` = 3 (all
the word "Meshgewebe" inside appliance descriptions); `bohr` = 1294 and `kante` = 1739 but
**100% inside descriptive `<TEXT>`** (manually verified). `step`/`iges` hits are pure substring
false-positives (e.g. `STEP_SIZE`, German words).

**Where production data actually is (sibling file): `optionGcodeMapping.json`.** This is the
only artefact tying options to machining, and it does **not** contain real G-code/coordinates —
it contains **imos macro calls**: `gcode(<featureId>, <param>)`. Structure: 4 price/feature
groups (`105`, `402`, `750`, `755`) → option key → a call string. Distinct calls observed:
`gcode(589,0);` (×195), `gcode(589,0.015);` (×154), `gcode(522,0.038)`, `gcode(522,0.025)`,
`gcode(520,0.08…0.16)`, etc. Interpretation: **`589`/`522`/`520` are imos machining-feature
IDs** (e.g. a drilling/groove/edge operation) and the second argument is a **parameter in
metres** (0.015 m = 15 mm). The **real CNC G-code is generated inside imos at production time**
from these feature IDs + the part parameters; the catalog only stores the *hook* (which feature
to invoke for which option). **For a "guaranteed/lossless" migration this is a red flag (§9/§10):
the authoritative machining program is NOT in any of these files — it is produced by the imos
runtime/post-processor, which is exactly what is being decommissioned.**

The actual **part-build recipe** (closest thing to geometry/production in the dataset) lives in
`itemFlexMapping.json` → `setFlexProperty.collection.parameters` — pipe-delimited imos object
instructions, e.g.:
```
MFR11,50,373,25,966,0,0 | MFR11,50,373,25,1788,0,0 | AB5037,2600,373,50,900,0,25,0,X | NV50,260,...
```
Each token = `<imos-object/part-code>,<numbers>` where the numbers are dimensions/positions in
mm (e.g. `AB5037` ≈ an Abdeckboden 2600×373×50 placed at x=900 …). These map to the **same imos
object names** used in the `.nfx` scripts (`carcassvent`, `unifront`, `drawerbox`, etc.). This is
the bridge from catalog article → concrete part list, but it is still a *recipe for imos to
execute*, not baked geometry.

---

## 5. Identifiers & join keys

Article / item identifiers (in XML):
- **`TYPE_NO`** (on `<ITEM>`, e.g. `LADP2538`, `LSZ260`, `NV54`) — primary catalog type key.
- **`EDP_NUMBER`** (e.g. `ADP2538`) — orderable EDP article number. `TYPE_NO` ≈ locale-prefix + EDP.
- **`MANUFACTURER_ID` = 71** (Häcker), **`CATALOG_ID` = N2026**.
- **`TYPE_KEY`** = (`TK_TYPE`, `TK_CLASS`, `TK_FRONT_APPEARANCE`, `TK_SHAPE`, `TK_EQUIPMENT`)
  — the classification tuple used by imos/flex mapping.
- **`CARCASE_BASIC_SHAPE_NO`** — which basic-shape template the item uses (joins to geometry/flex).
- **`CATEGORY_CODE`** (in `OTHER_CATEGORISATION`) — merchandise taxonomy code (e.g. `06017250220`).

Option / rule / price reference keys (in XML):
- **`FEATURE_NO`** + **`OPTION_KEY`** (the `<OPTION_REF>` pair — the atom of every rule & price;
  e.g. `FEATURE_NO="1" OPTION_KEY="AURA"`, `FEATURE_NO="105" OPTION_KEY="N151"`).
- **`STYLE_NO`** (program/model family, e.g. `AURA`,`SCALA`,`BRIST`), **`FEATURE_CLASS_NO`**,
  **`COMBINED_FEATURE`** (FEATURE_NO+OPTION_KEY composite),
  **`DEFAULT_OPTION_GROUP_NO`**, **`OPTION_GROUP`/`OPTIONAL_ITEM_GROUP`**, **`GROUP_TITLE_REF`**.
- **`RESTRICTION_NO`**, **`RESTRICTION_REF`**, `VALIDATION_TYPE`, `FEATURE_1_NO`/`FEATURE_2_NO`.
- Price keys: **`PRICE_FEATURE_GROUP_NO`**, **`PRICE_FIELD`**, **`PRICE_TYPE_NO`**,
  **`CALC_GROUP_NO`**, **`SUPPLIER_PRICE_GROUP`**, **`EXCHANGE_ID_NO`**, **`VAT_NO`**,
  **`ADDITIONAL_PRICE_GROUP`**, **`PRICE_FEATURE_GROUP_REF`**.
- Front keys: **`FRONT_TYPE`** code, `FRONT_DIVISION_DEF`, `FRONT_CELL_NO`, `HANDLE_ORIENTATION_NO`.

**Which sibling files these join to (verified by cross-checking values):**

| XML key | Sibling file & field | Evidence |
|---|---|---|
| `TYPE_NO` (`LADP2538`) | **`itemsSearchInfo.json`** `TYPE_NO` (+ `EDP_NUMBER`, `TK_TYPE`, `TK_CLASS`, `PRODUCT_GROUP`, `SHORT_TEXT`, `FULL_TEXT`, `CARCASE_BASIC_SHAPE_NO`, `b`) | `LADP2538` present verbatim in both files |
| `CARCASE_BASIC_SHAPE_NO` + `TK_TYPE` + `TK_CLASS` + `TK_FRONT_APPEARANCE` + `TYPE_NO` | **`itemFlexMapping.json`** — its `"formule":["CARCASE_BASIC_SHAPE_NO","TK_TYPE","TK_CLASS","TK_FRONT_APPEARANCE",">=TYPE_NO"]` is literally this composite key; leaves carry `flexObjectId`, `navCategory`, `setFlexProperty.collection.{b,t,h,parameters}` | exact field-name match |
| `FEATURE_NO` + `OPTION_KEY`; `STYLE_NO` | **`featureList.json`** (`features`,`styles`,`combined`,`restrictions`,`restrictionRef`) and **`optionMapping.json`** (`unifront`→style→`myfrontstyle`→option arrays) | feature/option/style keys match (e.g. AURA/BALI/SCALA, N1xx) |
| `RESTRICTION_*`, `OPTION_COMBINATION` | **`featureList.json`** `restrictions`/`restrictionRef`; **`optionDebugList.json`** (feature→option-key lists) | option-key lists (N102…) match COMBINED_FEATURE keys |
| `PRICE_FEATURE_GROUP_NO`, `OPTION_REF`, `PRICE_FIELD`, `SUPPLIER_PRICE_GROUP` | **`priceDefinition.json`** (`featureGroup`→`FINISH`→`OPTION_REF`/`PRICE_FIELD`/`SUPPLIER_PRICE_GROUP`) | same field vocabulary |
| feature-group + option-key (groups 105/402/750/755) | **`optionGcodeMapping.json`** (feature→option→`gcode(...)`) and **`optionDebugList.json`** | group `105` + option `N1xx` present in both |
| imos object names (`carcassvent`,`unifront`,`drawerbox`,`base4feet`,`interiorhigh`…) | **`.nfx` scripts** and `itemFlexMapping.parameters` part codes | shared imos identifiers |
| `featureGroup`/flex collection params | **`itemFlexMapping.json`** `setFlexProperty.collection.parameters` (`MFR11,…|AB5037,…|NV50,…`) | part codes feed imos |

So the seven JSONs are clearly a **pre-digested projection of this IDM catalog** (one per
concern: search/index, flex-geometry mapping, features, options, option-debug, gcode hooks,
prices), almost certainly produced by the same pipeline that consumes the IDM XML.

---

## 6. Units, coordinate system, conventions, languages

- **Linear units in the XML: millimetres (mm), integer.** `BASIC_SHAPE_PARAMETER` values
  (b=2600, t=383, h=25) and `MOUNTING_HEIGHT_*` are mm. (Cross-check: the `.nfx` and
  `itemFlexMapping` use **metres** — e.g. `0.6, 0.56, 2.035` m and `gcode(...,0.015)` = 15 mm —
  so **unit scale differs between layers: IDM = mm, imos NFX/flex = m**. Watch this in migration.)
- **Prices: integer minor units / catalog points**, e.g. `<PRICE>1800</PRICE>` = 18.00 EUR
  (i.e. price ×100). `CURRENCY_KEY=EUR`. The catalog preamble even states the point factors
  ("Preis * 2 = Punkte", "* 1.8"). Confirm exact scale with an SME (could be eurocent or "points").
- **No coordinate system / no transforms.** Geometry placement is only in the imos flex
  `parameters` strings (mm, relative offsets) and in `.nfx` (object combination), not here. The
  "b/h/t" axes are width/height/depth, **not** an XYZ world frame.
- **Dimension axis naming:** `b`=Breite/width, `h`=Höhe/height, `t`=Tiefe/depth (German initials).
- **Handle convention (symbolic):** `FRONTS_HANDLE_POSITIONS` uses `ORIENTATION` ∈ {H,V}
  (horizontal/vertikal) and `POSITION` ∈ {M,A} (Mitte/Außen = middle/edge) per `FRONT_TYPE_CODE`
  (A, GT, J, K, R, S, T, …). Plus per-item `HANDLE_ORIENTATION_1`/`HANDLE_POSITION_1`.
- **Language: German only.** Every `<LANGUAGE ISO_LANGUAGE_ID="DE">`; `FALL_BACK_LANGUAGE` present.
  Catalog/legal/product text all German (incl. `<![CDATA[…<br>…]]>` multi-line descriptions).
- **Booleans** as `true`/`false` text; many flags as single letters (`HINGE` N, `ITEM_IDENTIFICATION` K).

---

## 7. Static vs parametric — and what `.nfx` adds

**The data model is parametric, but split across layers — and the XML holds only the *outer*
parametric envelope, not the build logic:**

- **IDM XML = parametric *constraints* + commerce + rules, NO build logic.** Per item it gives
  the **valid size envelope** (`b/h/t` nominal + FROM/TO/STEP) and the **option/restriction
  rules** (which programs/fronts/decors/equipment combine — `RESTRICTIONS`, `OPTION_COMBINATION`,
  `COMBINED_FEATURE`) and **price formulas** (`PRICE_FEATURE_GROUPS`, surcharges). It is **not
  baked geometry** (no meshes) and **not the construction program** either — it never says how
  to build a cabinet, only *what is orderable, in what sizes, at what price, with what options*.
- **The construction logic is in imos `.nfx`** (and the derived `itemFlexMapping.parameters`).
  `baseshape1high.nfx` (49 lines, read fully) is an **imos parametric base-shape script** —
  a small functional/dataflow program. It:
  - **assembles sub-objects** via `hold(...)` includes: `hold(carcassvent.nfx)`,
    `hold(base4feet.nfx)` — i.e. NFX files reference *other* NFX files (a dependency graph).
  - **wires parameters across parts** via `subscribe(default, target.attr, …)` (a publish/
    subscribe binding of one value to many part attributes) — e.g. body/side/HDF finishes,
    interior-white flags, shelf/divider counts, drawer system, ventilation, lighting, gripless.
  - **does parametric transforms**: `position(base,0,0,0,0,0,-100)`, `size(shiftedsupport,
    0.6,0.56,0.1,1)`, `combine(support,carcass)` — i.e. it *computes* placement/size (here in
    **metres**: 0.6×0.56×2.035 m carcass).
  - **carries finishes with full descriptors**: `default|1|1|15071483|general_glossy`,
    `geburstet3|0.1|0.1|16777215|metal_steel` (the integer is an **RGB/decor colour packed as
    decimal** — e.g. 16777215 = 0xFFFFFF = white; plus a material class token).
  - **embeds rule micro-code** in `DRAWCODE=xif(...)` expressions — deeply nested,
    multiply-escaped imos formula language (`label`, `genatt`, `settextatt`, `componentatom`,
    `sm`, `concat`, `string(...)`) implementing surcharge flags and front-offset propagation.
  - **ends with `RESULT=configurator(cabinet, mysetsize, b, t, h, legheight, …)`** — the
    object returned to imos, parameterised by ~35 named inputs. `mysetsize=setsize(0,0.6,0.56,
    2.035,0,…)` sets default dimensions.
  So **`.nfx` is the actual parametric construction recipe** (the "how a cabinet is built"
  the target's *geometry* layer needs), and IDM is the catalog/commerce/rules skin over it.

**Conclusion:** the product is **fully parametric**, but **no single file is self-contained**.
IDM (this XML) + imos NFX library + the flex-mapping JSON are three interlocking layers; you
cannot reconstruct a buildable cabinet from the XML alone.

---

## 8. Migration relevance — mapping onto the target layers

Target layers were: **geometry** (how a cabinet is built; production/CNC under it),
**commerce** (price/SKU), **rules** (valid sizes & option compatibility).

| Target layer | What in THIS dataset feeds it | Source |
|---|---|---|
| **Commerce** (price/SKU) | `TYPE_NO`/`EDP_NUMBER` = SKU; `ITEM_PRICE`(PRICE_FIELD,PRICE), `PRICE_TYPE`, `CALC_GROUP`, `PRICE_FEATURE_GROUPS` surcharge logic, `EXCHANGE_ID`, `VAT`, `SET_OF_BLOCK_RULES` | **XML** (+ `priceDefinition.json`, `itemsSearchInfo.json`) |
| **Rules** (valid sizes + option compatibility) | `BASIC_SHAPE_PARAMETER` FROM/TO/STEP = valid-size rules; `RESTRICTIONS`/`OPTION_COMBINATION`/`COMBINED_FEATURE`/`FEATURE_CLASSES`/`OPTION_DEFINITION` = option compatibility; `FRONT_DIVISIONS`, handle-position tables | **XML** (+ `featureList.json`, `optionMapping.json`, `optionDebugList.json`) |
| **Geometry** (how it's built) | **NOT in the XML.** Comes from imos **`.nfx`** scripts (construction recipe) + `itemFlexMapping.json` `parameters` (part list per configured size). XML only supplies the size *envelope* + `CARCASE_BASIC_SHAPE_NO` join. | **`.nfx`** + `itemFlexMapping.json` |
| **Production / CNC** (under geometry) | **NOT in the XML.** Hooks only: `optionGcodeMapping.json` `gcode(<featureId>,<param>)`; the executable G-code is produced by the imos post-processor at runtime. | `optionGcodeMapping.json` + **imos runtime (not exported!)** |

**What an ingestion "port" (parser/adapter) for THIS format must handle:**
1. **Stream, don't DOM-load.** 92 MB / 2.03 M lines per catalog; use SAX/StAX/`iterparse` or
   xmlReader, releasing each `<ITEM>`/`<RESTRICTION>` after processing.
2. **No XML declaration / no namespace** — set encoding=UTF-8 explicitly; validate against
   `IDM_3_0_1.xsd` (fetch from dcc-moebel.org and pin the version).
3. **Nested catalog model**: `SERIE → PRODUCT_GROUP → ITEM`; resolve all the `*_REF` indirections
   (price-feature-group, calc-group, exchange-id, vat, restriction, feature-class, group-title).
4. **CDATA text with literal `<br>`**: treat `FULL_TEXT` as rich text; the 37k `<br>` are content.
5. **Two unit regimes**: keep IDM mm vs imos-m straight; normalise to one internal unit.
6. **Prices are integers ×100 / "points"** with multiple `PRICE_FIELD` columns + min-price units.
7. **Option/rule algebra**: model `OPTION_REF` = (FEATURE_NO, OPTION_KEY); rules are sets of
   `OPTION_COMBINATION`s with a `VALIDATION_TYPE`; `COMBINED_FEATURE` expands composite options.
8. **Cross-file join** to the seven JSONs on the keys in §5 (esp. the `itemFlexMapping` formule).
9. **Bridge to imos**: parse `.nfx` (a real DSL — `hold/subscribe/position/size/combine/
   configurator` + escaped `xif/xdo` formula language) and the flex `parameters` part strings.

**What MUST be preserved for lossless migration (from the XML):** every `TYPE_NO`+`EDP_NUMBER`;
the full `BASIC_SHAPE_PARAMETER` set incl. FROM/TO/STEP (these *are* the size rules); the complete
price block per item incl. all PRICE_FIELDs, PRICE_TYPE/CALC_GROUP/PRICE_FEATURE_GROUP/EXCHANGE/
VAT and the surcharge logic + block rules; every RESTRICTION / OPTION_COMBINATION / COMBINED_FEATURE
/ OPTION_DEFINITION default; FRONT_DIVISIONS & handle tables; CATEGORY_CODE/TYPE_KEY; all German
text verbatim (CDATA incl. `<br>`); catalog header (manufacturer, valid-from, currency, version).

**Sensible export targets:** commerce/rules → **a neutral article-keyed JSON** (your three-layer
store) — straightforward, since the data is already symbolic. Geometry → must first be
**evaluated from imos** (NFX is not directly renderable); once evaluated per configuration,
export **glTF/GLB** for view and **STEP/IFC** for CAD, and a **neutral production JSON** (parts +
operations) derived from the imos part list + `gcode(...)` hooks. **The XML alone cannot produce
any 3D export** — it's the catalog skin, not the model.

---

## 9. Nuances & gotchas (we explicitly want these)

1. **The biggest one — wrong-file assumption.** This XML is **IDM catalog master-data, not an
   imos geometry/scene export.** Any plan that treats it as "the model" will silently lose all
   geometry/CNC. Geometry = imos `.nfx`; CNC = imos runtime. **Confirm where the real 3D/Navigram
   models and imos project files live — they are not in this dataset.**
2. **G-code is not exported.** `optionGcodeMapping.json` holds imos *feature IDs* (`gcode(589,…)`),
   not toolpaths. The authoritative CNC program is generated by the imos post-processor being
   decommissioned. A "guaranteed lossless" CNC migration is **impossible from these files alone**
   — you must either re-derive machining in the new editor or extract it from imos before sunset.
3. **Unit-scale mismatch across layers:** IDM = **mm (integer)**, imos NFX & flex = **metres
   (float)**. Easy to introduce 1000× errors when joining catalog ↔ geometry.
4. **Prices are scaled integers** (×100) with **multiple PRICE_FIELD columns** and a points
   factor described only in prose in `CATALOG_INFO`. Misreading the scale corrupts every price.
5. **Rules are combinatorial and huge:** 172k `OPTION_REF`, 54k `OPTION_COMBINATION`. Restrictions
   appear in **two** places (global `RESTRICTIONS` near line 1.62 M *and* the set at 1.65 M) plus
   per-item `RESTRICTION_REF`, plus `OPTION_DEFINITION` defaults, plus `SET_OF_BLOCK_RULES`. The
   rule engine is distributed; don't assume one table.
6. **`COMBINED_FEATURE`** means options can be *composite* (option N105 = features 100/101 with
   specific keys). The new rules layer must support derived/composite options, not flat enums.
7. **`.nfx` embeds an escaped imos macro language** (`DRAWCODE=xif(...)` with up to 5 levels of
   `\"` escaping). This is Turing-ish glue (surcharge flags, front-offset propagation). Parsing it
   faithfully is non-trivial and is **logic, not data** — high risk for "lossless".
8. **NFX has a dependency graph** (`hold(carcassvent.nfx)`, `hold(base4feet.nfx)`, and
   `subscribe(...)` into dozens of named part attributes across many interior variants). You need
   the **whole `.nfx` library**, not one file, to resolve any single cabinet.
9. **Finish/colour packing:** finishes appear as `name|p1|p2|RGBdecimal|materialclass`
   (e.g. `…|16777215|general_glossy`, `…|16777215|metal_steel`). RGB is decimal-packed; material
   class is a token — must be decoded and mapped to the new material catalog.
10. **Two `SERIE`s only (0 and 2)** but 10,227 items; SERIE 0 = "übergreif. Artikel/Handelsware"
    (cross-program/merchandise incl. third-party appliances, e.g. Blaupunkt cooktops with long
    spec text). Appliances are catalog items too — decide if they migrate as SKUs vs. modelled.
11. **`WEIGHT`/`VOLUME` are logistics, not geometry** — don't mistake them for size.
12. **`FRONT_DIVISION_DEF` codes** (e.g. `Z2655[1]`, `MFR11`, `AB5037`) are opaque imos part/
    layout codes; their meaning lives in imos/IDM master tables not fully present here.
13. **No referential-integrity guarantees** in the file: all the `*_REF NO=` joins are by integer
    id into sibling sections/files; a port must validate that every ref resolves (orphans likely).

---

## 10. Open questions for a Häcker SME

1. **Where is the real geometry/scene data?** Is there an imos-native project export (the actual
   3D model), and where do Navigram's served models come from? These files don't contain it.
2. **Is the imos `.nfx` library exportable in full**, with all `hold()` dependencies, for every
   article family — and is its macro/formula language documented anywhere we can license/parse?
3. **CNC/G-code:** can imos export *evaluated* machining (toolpaths / WoodWOP / BTL/BTLx / native
   NC) per part, before the post-processor is retired? What do feature IDs `589/522/520/...` mean?
4. **Price scale:** is `<PRICE>` eurocents, or "points"? Confirm the ×2 / ×1.8 points factors and
   which `PRICE_FIELD` columns are authoritative for which channel.
5. **Exact semantics of `TYPE_KEY` (`TK_TYPE`/`TK_CLASS`/`TK_FRONT_APPEARANCE`/`TK_SHAPE`/
   `TK_EQUIPMENT`)** and `CARCASE_BASIC_SHAPE_NO` — these are the join into geometry/flex.
6. **Are the seven sibling JSONs the canonical runtime projection** of this IDM file (i.e. is IDM
   the single source of truth, JSON = build output), or are any maintained independently?
7. **`CATEGORY_CODE` taxonomy** (e.g. `06017250220`) — which classification standard?
8. **Locale scope:** is non-DE data ever present, or is German the only language to support?
9. **How are materials/decors keyed** end-to-end (the `15071483`/`16054520` ids in `.nfx`,
   the finish tokens, and IDM options) — is there a master material catalog to migrate alongside?
10. **Block/value-calculation rules (`SET_OF_BLOCK_RULES`, "Verrechnung")** — confirm these affect
    final order pricing and must be reproduced in the commerce layer.

---

### Appendix A — commands used (read-only sampling; file never modified)
`head/tail` (envelope); `grep -oE '<tag' | sort | uniq -c | sort -rn` (tag freq);
`grep -nE '^    <'` (section boundaries); `sed -n 'a,bp'` (200-line windows);
case-insensitive keyword scans for geometry/CNC terms; `xxd` (UTF-8 byte check);
`python` (3.14.2) `json` for the sibling JSONs only. `jq` not used (not assumed installed).

### Appendix B — at-a-glance
- Format: **IDM 3.0.1** (`T_NEW_CATALOG`, DCC Möbel), UTF-8, no decl/namespace.
- = **Häcker (mfr 71) "concept130 2026 national" price-list/catalog**, **~10,227 article types**,
  German only, EUR, valid from 2025-10-01, released 2025-11-27.
- Content weight: **pricing + option/rule logic + abstract size envelopes.** **No 3D, no CNC.**
- Geometry/CNC live **outside**: imos `.nfx` (recipe) + `itemFlexMapping.json` (part list) +
  `optionGcodeMapping.json` (machining hooks) + the imos runtime (not exported).
