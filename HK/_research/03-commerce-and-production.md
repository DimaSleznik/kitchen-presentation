# 03 — Commerce Layer & Production Link (Data-Archaeology Report)

**Scope:** reverse-engineering of two legacy artifacts from a Häcker Küchen export off the
imos / IDM / Navigram stack:

- `priceDefinition.json` (~2.17 MB) — the **commerce / pricing model**.
- `optionGcodeMapping.json` (~9.7 KB) — the **option → CNC G-code link** (production link, highest migration risk).

All findings are read-only. Sibling files (`featureList.json`, `optionMapping.json`,
`optionDebugList.json`, `itemFlexMapping.json`) were inspected **only** to decode join keys and id
semantics; they are not the subject of this report.

> **TL;DR of the two files**
> - `priceDefinition.json` is **not** a price list. It contains **price-key structure only**:
>   it maps option combinations to *indices* (`PRICE_FIELD` + `SUPPLIER_PRICE_GROUP`) into an
>   external price table (IDM). **No money, no currency, no dates** are in the file.
> - `optionGcodeMapping.json` maps `(featureGroup, option) → gcode(program#, param)` — a
>   **macro/subprogram call with a numeric parameter**, not raw G-code text, not a file path.
>   The parameter usually encodes a **dimension in metres** (e.g. `0.08` = 80 mm) or a thickness.
> - **Join key for both files is the pair `(feature_group_id, option_id)`** — identical id space
>   to `featureList.json`, `optionMapping.json`, `optionDebugList.json`.

---

## 0. Environment / format facts

| Property | priceDefinition.json | optionGcodeMapping.json |
|---|---|---|
| Format | JSON object (UTF-8, no BOM) | JSON object (UTF-8) |
| Top-level type | `dict` with 2 keys: `featureGroup`, `priceTypes` | `dict`, 4 keys: `105`, `402`, `750`, `755` |
| Size | 2,171,527 chars | 9,719 bytes |
| Language(s) | **`DE` only** (all `text.DE`) | none (no human text) |
| Currency | **none** (no `EUR`/`€`/`Währung`) | n/a |
| Validity / dates | **none in this file** (validity lives in `featureList.json` as option-level `valid_until`, e.g. `"2026-06-30"`) | none |
| Tool/version hints | none embedded (no `imos`/`IDM`/`version` strings) | none |
| Article/SKU keys | **none** — pricing is catalog-global by feature/option, not per article | none |

Python 3.14 is available (`python` and `python3`); `jq` is **not** installed. Console default
encoding is cp1251 — parsing scripts must force UTF-8 (`PYTHONIOENCODING=utf-8 python -X utf8`) or
German umlauts crash.

---

## 1. `priceDefinition.json` — Commerce layer

### 1.1 Top-level structure

```
{
  "featureGroup": { "<groupId>": { ...pricing rule... }, ... },   // 48 groups
  "priceTypes":   { "<priceTypeId>": { ...dimension semantics... }, ... }  // 19 types
}
```

- **`featureGroup`** = 48 priceable "things" (handles, side panels, shelves, glass wall cabinets,
  worktops, plinths…). Each is a *pricing rule* over one or two configuration features.
- **`priceTypes`** = 19 reusable **dimension/unit semantics** describing *how* a measured price is
  scaled (per piece, per 100 mm, per 1 mm, etc.). See §1.5.

### 1.2 Anatomy of a `featureGroup`

Example — group `904` "Oberschrank mit Glastür II" (wall cabinet with glass door, the largest group, 7868 rows):

```json
"904": {
  "ADDITIONAL_PRICE": "false",
  "PRICE_CALC_METHOD": "3",
  "text": { "DE": "Oberschrank mit Glastür II" },
  "FEATURE_NO_1": "105",          // primary feature driving price
  "FEATURE_NO_2": "150",          // secondary feature (2-D price matrix)
  "FINISH": [                      // the price-row array (always called FINISH)
    { "OPTION_REF": [["105","N102"],["150","3"]], "PRICE_FIELD":"1", "SUPPLIER_PRICE_GROUP":"1" },
    { "OPTION_REF": [["105","N113"],["150","3"]], "PRICE_FIELD":"1", "SUPPLIER_PRICE_GROUP":"1" },
    ...
  ]
}
```

Fields:

| Field | Meaning (reconstructed) |
|---|---|
| `text.DE` | Human label of the priceable group (German). |
| `FEATURE_NO_1` | Primary feature id whose option selects a price. |
| `FEATURE_NO_2` | Optional secondary feature id → forms a 2-D price matrix. 32/48 groups have it. |
| `ADDITIONAL_PRICE` | `"true"`/`"false"`. `true` (6 groups) = surcharge/Mehrpreis added on top of base; `false` (42) = this defines the item's own price line. |
| `PRICE_CALC_METHOD` | `"3"` (45 groups, the normal case), `"2"`, `"1"`, `"0"` — see §1.4. |
| `FINISH` | Array of **price rows** (the name is legacy; it is just the row list). |

**Price row** (one entry of `FINISH`):

| Field | Meaning |
|---|---|
| `OPTION_REF` | List of `[featureId, optionId]` pairs identifying the option combination this row prices. 1 pair (single feature) or 2 pairs (matrix). |
| `PRICE_FIELD` | **Index into the external price table** (a column/field number). 155 distinct values (`"1"`…). Not a price. |
| `SUPPLIER_PRICE_GROUP` | **Supplier price-group key** into the external table (a row/tier). 163 distinct values. Not a price. |

### 1.3 How a configured product's price is computed (reconstruction)

1. The configurator resolves the chosen options for each feature (e.g. front `105 = N102`,
   glass `150 = 3`).
2. For each relevant `featureGroup`, it finds the `FINISH` row whose `OPTION_REF` matches the
   chosen `(feature, option)` combination.
3. That row yields **`SUPPLIER_PRICE_GROUP` + `PRICE_FIELD`** — a *coordinate*, not a value. The
   actual monetary amount is looked up in an **external supplier/price table (IDM master data)**
   keyed by that coordinate (and presumably by validity date / catalog version held in IDM).
4. The `PRICE_CALC_METHOD` and the group's `priceType` (dimension semantics, §1.5) decide whether
   that looked-up amount is a flat piece price or is scaled by width/depth/height and rounded.
5. `ADDITIONAL_PRICE=true` groups (Mehrpreis — e.g. group 1 "Mehrpreispfl. Griffe" = surcharge-eligible
   handles, group 4 "Korpus innen/außen lackiert") add a **surcharge** on top of the base item price.

> **Pricing logic in one line:** price = lookup(SUPPLIER_PRICE_GROUP, PRICE_FIELD) in an external
> table, optionally scaled by dimension per the group's priceType and rounded, with surcharge groups
> stacking on top. **This file is the key map; the price values are NOT here.**

#### Single-feature vs matrix rows (real examples)

Surcharge handles (group 1, `FEATURE_NO_1=303`, single dim):
```json
{ "OPTION_REF": [["303","379"]], "PRICE_FIELD":"1",  "SUPPLIER_PRICE_GROUP":"1" }
{ "OPTION_REF": [["303","112"]], "PRICE_FIELD":"2",  "SUPPLIER_PRICE_GROUP":"2" }
{ "OPTION_REF": [["303","550"]], "PRICE_FIELD":"3",  "SUPPLIER_PRICE_GROUP":"3" }
```
Side panels "Wangen" (group 2, `FEATURE_NO_1=520`, `FEATURE_NO_2=521`, 2-D matrix of finish × colour):
```json
{ "OPTION_REF": [["520","KU"],["521","102"]], "PRICE_FIELD":"1", "SUPPLIER_PRICE_GROUP":"1" }
```

### 1.4 `PRICE_CALC_METHOD` distribution

| Value | Count | Self-described by sentinel groups |
|---|---|---|
| `3` | 45 | normal feature-matrix lookup |
| `2` | 1 | group 10 `text="price dependent on range"` |
| `1` | 1 | group 9998 `text="price independent of range"` |
| `0` | 1 | group 9999 `text="price on demand"` (0 rows) |

(Two sentinel groups `9998`/`9999` carry no/empty `FINISH` and act as global flags: price
independent-of-range, and price-on-demand.)

### 1.5 `priceTypes` (19) — dimension & unit semantics

These define **how a price scales with size**. Examples:

```json
"20":  {"WIDTH_X":"false","DEPTH_Y":"false","HEIGHT_Z":"false","BASIC_UNIT":"0",
        "ROUNDING_UNIT":"0","BASIC_PRICE_DEPENDENT":"false","text":{"DE":"Stückpreis PGunab"}}   // per-piece, PG-independent
"30":  {"WIDTH_X":"true", ... "BASIC_UNIT":"100","ROUNDING_UNIT":"100", "text":{"DE":"Je 100 mm PGunab"}}  // per 100 mm width
"31":  { ... "BASIC_UNIT":"1000","ROUNDING_UNIT":"1000", "text":{"DE":"Je 1000 mm PGunab"}}             // per 1000 mm
"32":  { ... "BASIC_UNIT":"1",   "ROUNDING_UNIT":"1",    "text":{"DE":"Je 1 mm PGunab"}}                // per 1 mm
```

| Field | Meaning |
|---|---|
| `WIDTH_X` / `DEPTH_Y` / `HEIGHT_Z` | which dimension(s) the price scales with (`"true"`/`"false"`). |
| `BASIC_UNIT` | quantisation unit in mm (`0`=per piece, `100`, `1000`, `1`). |
| `ROUNDING_UNIT` | rounding granularity in mm. |
| `BASIC_PRICE_DEPENDENT` | whether it stacks on/derives from a base price. |
| `text.DE` | label, e.g. "Stückpreis PGunab" (piece price, price-group-independent), "Je 100 mm". |

> **Gotcha:** `priceTypes` are **not referenced by id from inside `featureGroup`** in this file —
> there is no `PRICE_TYPE` field on the groups. The binding of a featureGroup to its priceType is
> *implicit / external* (it lives in IDM, or is keyed by `SUPPLIER_PRICE_GROUP` in the price table).
> This is an open question for the SME (see §6).

### 1.6 Identifiers / how rows key back to the catalog

- Rows key back via `OPTION_REF = [[featureId, optionId], ...]`.
- `featureId` and `optionId` are exactly the ids in **`featureList.json`** (`features.<id>.options.<optId>`).
  Verified: feature `105` = "Front-Kombination", option `N102` = "SCALA Balticblau
  Melaminharzbeschichtung"; feature `150` = "Glas-Ausführung"; `303` = "Griff-Kombination"; `520/521`
  = "Wangen/Riegel-Ausführung/-Farbe"; `600` = "Arbeitsplatten-Ausführung"; `750` =
  "Arbeitsplatten-Form".
- `PRICE_FIELD` and `SUPPLIER_PRICE_GROUP` are foreign keys into the **external price table** (not present here).

### 1.7 Cardinality

- **48** featureGroups, **19** priceTypes.
- **23,661** price rows total (count of `OPTION_REF`).
- Highly skewed: group `904` alone = 7,868 rows; `906` = 4,499; `920` = 3,966; `925` = 1,594;
  `923` = 1,546; `911` = 954. Many small groups (2–60 rows). The big groups are all the
  glass/front cabinet families driven by `FEATURE_NO_1=105` (front decor) × `FEATURE_NO_2=150` (glass)
  or `×500/520`.

### 1.8 The 48 featureGroups (summary table)

| grp | DE text | F1 | F2 | rows | calc | addPrice |
|---|---|---|---|---|---|---|
| 1 | Mehrpreispfl. Griffe | 303 | – | 54 | 3 | true |
| 2 | Wangen | 520 | 521 | 205 | 3 | false |
| 3 | Überbauböden | 510 | 511 | 131 | 3 | false |
| 4 | Korpus Innen/Außen lackiert | 208 | – | 21 | 3 | true |
| 5 | Regalborde | 514 | 515 | 198 | 3 | false |
| 6 | Nischenverkleidung | 550 | 551 | 283 | 3 | false |
| 7 | Regale | 500 | 501 | 152 | 3 | false |
| 8 | Aufpreis Schubkast./Auszug | 700 | – | 3 | 3 | true |
| 9 | Profilwangen | 562 | 563 | 39 | 3 | false |
| 10 | price dependent on range | 1 | – | 24 | **2** | false |
| 11 | SK-Seiten | 206 | 207 | 66 | 3 | false |
| 12 | Tiefenpassstück | 936 | 937 | 65 | 3 | false |
| 14 | Passleisten | 206 | 207 | 24 | 3 | false |
| 16 | Deckenblende | 506 | 507 | 145 | 3 | false |
| 18 | Wandabschlussprofil | 650 | 651 | 61 | 3 | false |
| 20 | mit Antirutschmatten | 961 | – | 3 | 3 | true |
| 21 | Nischenelem.Sockel (S) | 400 | 401 | 148 | 3 | false |
| 22 | Kranzprofile | 502 | 503 | 49 | 3 | false |
| 23 | Dekorative Nischenverkleidung | 550 | 551 | 5 | 3 | false |
| 25 | mit Federdruckverschluss | 964 | – | 2 | 3 | true |
| 26 | Kehlleisten-Beleuchtungsprofil | 966 | – | 4 | 3 | true |
| 32 | Lichtleisten | 504 | 505 | 50 | 3 | false |
| 75 | Abdeckböden | 620 | 621 | 205 | 3 | false |
| 141 | Einlegeboden | 208 | – | 30 | 3 | false |
| 146 | ADKP.. | 502 | 503 | 40 | 3 | false |
| 149 | Stützfuß, SO692 | 932 | 933 | 23 | 3 | false |
| 150 | Innenorga Schubkasten | 959 | – | 5 | 3 | false |
| 152 | Kehlleiste | 962 | – | 23 | 3 | false |
| 153 | Nischenausstattung | 561 | – | 2 | 3 | false |
| 154 | Spülen | 851 | – | 29 | 3 | false |
| 903 | Oberschrank m.Glas Bristol | 105 | 150 | 63 | 3 | false |
| 904 | Oberschrank mit Glastür II | 105 | 150 | **7868** | 3 | false |
| 906 | Oberschrank mit Glastür I | 105 | 150 | 4499 | 3 | false |
| 910 | Climber | 939 | 161 | 2 | 3 | false |
| 911 | SlightLift | 939 | 161 | 954 | 3 | false |
| 918 | Rollladenschränke | 939 | 161 | 530 | 3 | false |
| 920 | Falttürenschrank, unten Glas | 105 | 150 | 3966 | 3 | false |
| 923 | Regale mit Front | 105 | 500 | 1546 | 3 | false |
| 924 | Auszugsregale | 105 | 500 | 105 | 3 | false |
| 925 | Durchgangstüren | 105 | 520 | 1594 | 3 | false |
| 926 | Sockel/Deckenblende frontbünd. | 520 | 521 | 164 | 3 | false |
| 936 | APL-Farben Preisgruppen | 600 | 601 | 116 | 3 | false |
| 937 | APL-Bearbeitungen | 750 | – | 14 | 3 | false |
| 938 | Wangenumbau | 956 | – | 112 | 3 | false |
| 940 | Barplatte/Stützwange | 520 | 521 | 32 | 3 | false |
| 950 | Qanto mit APL | 750 | 600 | 6 | 3 | false |
| 9998 | price independent of range | – | – | 1 | **1** | false |
| 9999 | price on demand | – | – | 0 | **0** | false |

(APL = Arbeitsplatte = worktop; SK = Schubkasten = drawer.)

---

## 2. `optionGcodeMapping.json` — the production link (analysed deeply)

### 2.1 Exact structure

Two-level dict: **feature_group_id → option_id → G-code macro string**.

```
{
  "105": { "N102":"gcode(589,0);", ..., "T102":"gcode(589,0.015);", ... },  // front decor
  "402": { "80":"gcode(520,0.08)", "90":"gcode(520,0.09)", ..., "300":"gcode(520,0.3)" }, // plinth height
  "750": { "150":"gcode(522, 0.038)", "110E":"gcode(522, 0.025)", ..., "PP":"gcode(522, 0.08)" }, // worktop edge form
  "755": { "10":"gcode(526, 0.01)", "16":"gcode(526, 0.016)", "25":"gcode(526, 0.025)", "50":"gcode(526, 0.05)" } // cover-board form
}
```

Only **4 feature groups** carry G-code:

| group | featureList meaning (DE) | feature type | #options w/ gcode | program # | param meaning |
|---|---|---|---|---|---|
| **105** | Front-Kombination (front decor) | K | ~360 (N* + T*) | **589** | `0` for N-codes, `0.015` for T-codes (≈ edge/trim thickness 15 mm) |
| **402** | Sockelhöhe (plinth height 80–300 mm) | K | 23 | **520** | plinth height in **metres** (`80`→`0.08` … `300`→`0.3`) |
| **750** | Arbeitsplatten-Form (worktop edge profile) | K | 15 | **522** | edge thickness/radius in metres (e.g. `0.038`, `0.025`, `0.08`) |
| **755** | Abdeckböden-Form (cover-board edge form) | K | 4 | **526** | radius in metres (`10`→`0.01` … `50`→`0.05`) |

### 2.2 What the "G-code" payload actually is

It is **NOT** raw multi-line G-code, **NOT** a file path, **NOT** an ISO `N…G…` block.
It is a **single macro / subprogram call** in imos's NC-macro syntax:

```
gcode( <programNumber> , <parameter> )
```

- `<programNumber>` (589, 520, 522, 526) = an **imos/CNC subprogram (machining macro) number** — a
  pre-defined drilling/milling/edge operation living in the post-processor / machine library, **not**
  in this export.
- `<parameter>` = a single numeric argument fed to that macro. Empirically it is a **dimension in
  metres** (plinth height, edge thickness, board radius) — i.e. the *parametrisation* of the operation.

Real examples (trimmed):
```
group 402 option "80"   → "gcode(520,0.08)"      // plinth 80 mm  → macro 520 with depth/height 0.08 m
group 750 option "150"  → "gcode(522, 0.038)"    // worktop form "doppelrund 4cm" → macro 522, 0.038 m
group 755 option "25"   → "gcode(526, 0.025)"    // cover-board form 25 → macro 526, 0.025 m (25 mm)
group 105 option "N102" → "gcode(589,0);"        // front decor balticblue → macro 589, 0 (no extra depth)
group 105 option "T102" → "gcode(589,0.015);"    // matching T-variant → macro 589, 0.015 m (15 mm trim)
```

> **Syntax inconsistency (real, flag it):** group 105 strings end with a trailing `;` and have **no
> space** after the comma; groups 402/750/755 have **no** trailing `;`. Groups 750/755 have a **space**
> after the comma (`gcode(522, 0.038)`); 402 has none (`gcode(520,0.08)`). These are textual macro
> strings that were presumably concatenated into an NC program by imos, so whitespace/`;` differences
> are tolerated by the consumer but are a parsing hazard for a naive importer (see §5).

### 2.3 The `N…`/`T…` prefix in group 105

Group 105's option ids come in two parallel families: `N102…N881` and `T102…T881` (same numeric
tails). In `featureList.json` feature 105 the options are the `N…` set (front decor variants). The
`T…` variants are a **second machining variant of the same decor** (the `T*` rows carry param
`0.015` ≈ a 15 mm element/trim, vs `0` for `N*`). So the same physical decor can resolve to two
different machining parametrisations depending on construction context. **Not all `N*` ids have a `T*`
twin** (the lists differ slightly), which is itself a data-quality flag.

### 2.4 Option → physical machining operation (reconstructed chain)

```
                 priceDefinition.json                         optionGcodeMapping.json
                 (commerce / SKU key)                         (production link)
                         ▲                                            ▲
                         │  OPTION_REF [[feat,opt],…]                 │  feat → opt → gcode(prog,param)
                         │                                            │
   ┌─────────────────────┴──────────────┐         ┌──────────────────┴───────────────────┐
   │  user picks options in configurator │         │                                       │
   └─────────────────────┬──────────────┘         │                                       │
                         ▼                                                                 ▼
   feature 402 "Sockelhöhe" = option "80"  ───────────────────────►  "gcode(520,0.08)"
                         │                                                                 │
                         │ (parallel)                                                      ▼
                         ▼                                                  imos resolves macro #520
   optionMapping.json["sidepanelfrontlike"]["402"]["legheight"]["80"]      with parameter 0.08 m
        = ["=optionToMM",""]   (imos formula: convert option→mm)                          │
                         │                                                                 ▼
                         ▼                                                  post-processor emits the
   imos parametric model gets leg height = 80 mm                            ISO/native NC block for that
   (geometry), AND the machining macro 520 is invoked at 0.08 m            drilling/milling op on the part
                                                                                          │
                                                                                          ▼
                                                                        CNC machine at factory runs program #520
                                                                        (the actual drill/mill cycle for the plinth)
```

So a selected option turns into a physical operation by: **(a)** `optionMapping.json` feeds the imos
**geometry/parametric** model (via imos script like `=optionToMM`, `wtf150`, `setlabel(...)`), and
**(b)** `optionGcodeMapping.json` feeds the **machining** side — it names the CNC subprogram and the
metric parameter. imos's post-processor expands `gcode(prog,param)` into the machine's real NC code.
**The expansion table (what program 520/522/526/589 actually do) is NOT in this export** — it lives in
the imos post-processor / machine configuration. That is the single biggest production-link risk.

### 2.5 Join keys for the production link

- Top-level keys `105/402/750/755` = **feature_group_id** — same space as `featureList.json.features`
  and `priceDefinition.featureGroup.FEATURE_NO_*`.
- Inner keys (`N102`, `80`, `150`, `110E`, `PP`, `G1265`…) = **option_id** — same space as
  `featureList.features.<id>.options.*`, `optionMapping.json[*].<group>.<sub>.<optionId>`, and
  `optionDebugList.json[<group>]`.
- **Verified identical** against `optionMapping.json` (e.g. group 105/N102 = "balticblue_feinstruktur"
  there, with imos script) and `optionDebugList.json` (group 105 lists exactly the N*/T* ids).
- **No item/article ids** in `optionGcodeMapping.json` — the machining link is **catalog-global per
  option**, independent of which cabinet article uses it.

---

## 3. Cross-file join-key summary

| From | Field | To | Field | Confirmed |
|---|---|---|---|---|
| priceDefinition `FINISH[].OPTION_REF` | `[featureId, optionId]` | featureList `features.<id>.options.<id>` | id pair | ✅ (105/N102 etc.) |
| optionGcodeMapping | top key = featureId, inner key = optionId | featureList `features` | id pair | ✅ |
| optionGcodeMapping | `(featureId, optionId)` | optionMapping `[ctx].<featureId>.<sub>.<optionId>` | id pair | ✅ (105/N102, 402/80, 750/150) |
| optionGcodeMapping | `(featureId, optionId)` | optionDebugList `[<featureId>]` | option list | ✅ |
| priceDefinition `PRICE_FIELD`+`SUPPLIER_PRICE_GROUP` | coordinate | **external IDM price table** | row/column | ❗ external, not in export |
| optionGcodeMapping `gcode(prog,param)` | `prog#` | **imos post-processor / machine library** | subprogram | ❗ external, not in export |
| priceDefinition | (none) | article id | – | n/a — pricing is catalog-global, no article key |

**The universal join key across the catalog is the pair `(feature_group_id, option_id)`.**
priceDefinition and optionGcodeMapping never reference each other directly; they are joined *through*
the shared feature/option id space (and, where the same feature is both priced and machined — 105,
750 — that feature is the explicit overlap between commerce and production).

---

## 4. Migration relevance

### 4.1 priceDefinition (commerce)

What an ingestion port MUST capture:
1. The **48 featureGroups** with `FEATURE_NO_1/2`, `ADDITIONAL_PRICE`, `PRICE_CALC_METHOD`, label.
2. Every **price row**: the `OPTION_REF` combination → `(SUPPLIER_PRICE_GROUP, PRICE_FIELD)` coordinate.
3. The **19 priceTypes** (dimension/unit/rounding semantics).
4. The fact that **monetary values are external** — the port is *incomplete* without the IDM price
   table that `(SUPPLIER_PRICE_GROUP, PRICE_FIELD)` resolves against, plus the (external) binding of
   each group/coordinate to its priceType and validity window.

Modern representation (CPQ/commerce layer):
- Model each `featureGroup` as a **price rule / price-matrix** on the article-config layer.
- Represent rows as a **lookup table keyed by an option tuple** → price-coordinate; resolve the
  coordinate to a money amount via a separate **price book** table (so you can swap catalogs/validity).
- Keep `priceType` as a reusable **unit-of-measure + rounding policy** attached to each rule.
- Map `ADDITIONAL_PRICE=true` groups to **surcharge/modifier** price components that stack on a base.
- `PRICE_CALC_METHOD` 0/1/2/9998/9999 sentinels → explicit enum: `on_demand`, `range_independent`,
  `range_dependent`, `matrix`.

Verification (round-trip): for a sample of configured products, compute price in the new engine and
compare to legacy imos/IDM totals **to the cent** across a matrix of front-decor × size × surcharges.
Because money is external, you must verify against the *combined* (priceDefinition + IDM table) result,
not against this file alone.

### 4.2 optionGcodeMapping (production link — highest risk)

What the port MUST capture (lossless):
1. The full `(featureId, optionId) → gcode(prog, param)` mapping — **all 4 groups, all options,
   including the `N*`/`T*` duality and the exact `prog#` and `param`**.
2. The macro **program numbers** (589/520/522/526) as opaque-but-stable references, **plus a
   companion capture of the imos post-processor definitions of those programs** (NOT in this export —
   must be requested) so the operation is reconstructable on the new infra.
3. The **parameter unit convention** (metres; e.g. 0.08 = 80 mm) — must be recorded explicitly or the
   numbers are meaningless.

Modern representation:
- Store the link as a **machining-operation reference** under the geometry/production concern,
  keyed by `(feature, option)`: `{ program: 520, param_m: 0.08, raw: "gcode(520,0.08)" }`. Keep the
  **raw string verbatim** alongside the parsed form (lossless escape hatch).
- Keep program numbers as references into a **separate machining-program registry** that you populate
  from the imos post-processor; do NOT inline-expand to ISO G-code at import time (you'd bake in the
  current machine's assumptions).

Verification (round-trip): for each option, re-emit `gcode(prog,param)` from the parsed model and
assert **byte-equality modulo whitespace/`;`** against the original; and, end-to-end, post-process a
sample config through both old and new pipelines and diff the produced NC programs. **Losing this map
means a configured product can no longer be manufactured** — treat 100% coverage (every option in
featureList that ever reaches a machine has either a defined gcode mapping or an explicit "no machining"
record) as an acceptance gate.

---

## 5. Nuances & gotchas (read before porting)

1. **priceDefinition contains NO prices.** Only `(SUPPLIER_PRICE_GROUP, PRICE_FIELD)` coordinates into
   an external IDM table. Currency, amounts, validity dates are all absent. A "price port" that reads
   only this file is silently 50% incomplete.
2. **`FINISH` is a misnomer** — it is the generic *price-row array*, not a finishing/decor concept.
   Don't model it as "finish".
3. **priceType binding is implicit.** `featureGroup` has no `PRICE_TYPE` field; the 19 priceTypes are
   not referenced by id from the groups. The group→priceType link is external (IDM / price table). Open
   question.
4. **G-code payload is a macro call, not real G-code.** `gcode(prog,param)` references a CNC subprogram
   whose body is in the imos post-processor — **not in this export**. Without those program definitions
   the manufacturing semantics are unknown. This is the #1 production-link risk.
5. **The gcode `param` is a dimension in metres** (plinth `80`→`0.08`, board `25`→`0.025`). Magic
   numeric — units are nowhere stated in the file; capture the convention explicitly or numbers become
   meaningless. Watch for the metre/mm trap.
6. **Inconsistent macro string formatting**: group 105 uses trailing `;` and no space after comma
   (`gcode(589,0);`); groups 750/755 use a space and no `;` (`gcode(522, 0.038)`); 402 uses neither.
   A regex importer must tolerate optional space and optional trailing `;`.
7. **`N*` vs `T*` duality in group 105**: the same front decor has two machining variants (param `0`
   vs `0.015`). The two lists are **not perfectly symmetric** (some N ids lack a T twin) — do not assume
   a 1:1 pairing; preserve both sets verbatim.
8. **Only 4 of 75 features have machining mappings** (105 front, 402 plinth height, 750 worktop edge,
   755 cover-board edge). Everything else is presumably standard geometry with no option-driven NC, OR
   the export is partial. Confirm with SME that no machining-relevant option is missing (silent gaps =
   un-manufacturable configs).
9. **Heterogeneous option-id shapes** in the same id space: numeric (`80`, `150`), N/T-prefixed
   (`N102`,`T102`), alpha-suffixed (`110E`,`130R`), and pure-alpha (`PP`,`G1265`,`KU`). Treat option ids
   as **opaque strings**, never integers.
10. **`optionDebugList.json` is a debug leftover** (flat group→option arrays, redundant with
    featureList) — a sign the export tooling dumps internal scaffolding. Likely safe to ignore for
    migration but indicates the export is a developer dump, not a clean interchange format.
11. **German-only labels** (`text.DE`). No multilingual data here; localisation must come from
    elsewhere or be added.
12. **Massive row skew** in priceDefinition (group 904 = 7,868 of 23,661 rows). Bulk-load accordingly;
    a few front-decor×glass families dominate.

---

## 6. Open questions for a Häcker SME

1. **Where is the actual price table** that `(SUPPLIER_PRICE_GROUP, PRICE_FIELD)` resolves to (IDM
   export name/format)? Is it date/catalog-versioned? Per region/customer?
2. **How is a featureGroup bound to its `priceType`** (one of the 19)? It is not in this file — where?
3. **What do CNC programs 589 / 520 / 522 / 526 actually do?** Provide the imos post-processor /
   machine-library definitions (the macro bodies). Without them the production link is a dangling
   reference.
4. **Confirm the `gcode` parameter unit is metres** and what the parameter means per program (depth?
   thickness? radius? height?).
5. **Why only 4 features have machining mappings** — is option-driven NC genuinely limited to front
   decor, plinth height, and the two edge-profile features, or is `optionGcodeMapping.json` a partial
   export? Are there other machining triggers (e.g. hinge boring, hardware) handled outside option
   mappings?
6. **`N*` vs `T*` in group 105** — what construction context selects the `T` (param 0.015) variant vs
   the `N` variant, and why do the id sets differ?
7. **`ADDITIONAL_PRICE=true` semantics** — confirm these are additive surcharges (Mehrpreis) over a base
   item price, and how the base is determined.
8. **Sentinel groups** `9998` (range-independent), `9999` (price-on-demand), and group `10` (range-
   dependent) — confirm their runtime behaviour and how the configurator uses `PRICE_CALC_METHOD`.

---

## 7. File inventory referenced (context only)

| File | Role (inferred) | Layer |
|---|---|---|
| `priceDefinition.json` | **price-key structure** (this report) | commerce |
| `optionGcodeMapping.json` | **option→CNC macro link** (this report) | production (under geometry) |
| `featureList.json` | feature/option dictionary + labels + `valid_until` | rules/catalog |
| `optionMapping.json` | option → imos parametric script/macro, per construction context | geometry/rules |
| `optionDebugList.json` | debug dump: group→option id lists | (scaffolding) |
| `itemFlexMapping.json` | article shape/geometry: `flexObjectId`, dims `b/t/h` (m), `setLabels` | geometry |
| `itemsSearchInfo.json` | (not inspected) article search metadata | catalog |
| `*.xml` (92 MB) | (not inspected) likely full imos/Navigram model export | geometry |
