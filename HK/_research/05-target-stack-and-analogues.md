# Target Stack & Analogues — Replacing the Legacy Kitchen-Manufacturing Stack (imos / IDM / Navigram)

**Research brief for the "Migration & new solutions" presentation tab — Häcker Küchen**
Date: 2026-06-24 · Currency window: 2025–2026 · Audience: non-technical decision-maker + technical reviewers

> **Reading guide.** Facts with a source URL are **[VERIFIED]**. Reasoned conclusions not directly stated by a source are **[INFERENCE]**. Items we could not confirm are **[NEEDS VERIFICATION]**. The single most important correction this research makes: **"IDM" is almost certainly not an imos product — it is an industry data standard (the DCC "Integrated Data Model"). This changes the migration strategy materially** (see §1.2 and §3).

---

## 0. TL;DR for the negotiator

Häcker runs on three legacy pillars: **imos iX** (the CAD/CAM engine that turns a kitchen design into machine-ready production data), **IDM** (the standardized catalog-data format the whole German/EU kitchen industry uses to ship product data to planners and dealers), and **Navigram** (a hosted 3D visualization/configurator service). The plan — own the editor, own the data, own the 3D pipeline — is sound and matches where the industry is heading (browser-native 3D, glTF/GLB, headless commerce). The honest nuance: **the configurator + data layers are very buildable today; the CAM/CNC "last mile" is the hard, decades-of-edge-cases part** and is best de-risked with a hybrid approach rather than rebuilt from zero on day one. IDM is not a cage to escape — it is a bridge to keep, because it is how Häcker's products reach 1000s of dealers.

---

## 1. The legacy stack — what each product actually does, its role, and its lock-in

### 1.1 imos iX (imos editor / iX CAD / iX CAM) — the CAD/CAM production engine

**What it is. [VERIFIED]** imos iX is a professional CAD/CAM suite for the furniture & interior industry from **imos AG** (now part of the **Hettich** group / "imos – Interior Solutions"), running the workflow from design to production. The core editor is **iX CAD** (also an AutoCAD-hosted variant, **iX CAD AC**); the production side is **iX CAM / CAMCenter**.
Sources: https://www.imos3d.com/en/products/design-order/ix-cad-1/ · https://www.capterra.com/p/174584/imos-iX/

**What it does in the pipeline. [VERIFIED]**
- **Parametric, rules-based cabinet modeling** — the "Designer article" handles variable-size constructions from parametric components; "Object Designer" builds 3D from 2D; "Part Designer" assembles parts with snap/identification points. Intelligent libraries for materials, edge-banding, fittings and connectors. https://www.imos3d.com/en/products/design-order/ix-cad-1/
- **Automated connector/hardware logic** — "intelligent system for automated finding and setting of connectors, including the required machining operations." (Same source.)
- **Production output** — cutting lists, production lists, purchased-parts lists, edge/profile output, and a **structured BOM** assigning components to article/item groups; automated drawing output (views, sections, exploded, single-part). (Same source.)
- **CAM / CNC** — iX CAM turns design data into ready-to-run CNC programs (drilling/milling patterns, nesting prep), connecting directly to iX CAD and standardizing output across a mixed machine park. https://www.imos3d.com/en/products/design-order/ · https://imos-ix-camcenter.software.informer.com/
- **Data exchange it already speaks** — exports **glTF/GLB and WRL** (via "VR-Link") and **IFC per BIM Standard 2.0**; barcode/QR; real-time pricing; supplier-data integration; ERP connectors. https://www.imos3d.com/en/products/design-order/ix-cad-1/
- **Integration reach (real-world)** — users report it integrates with Salesforce, Infor LN (ERP), plus ProStream/GTOC/MES for quoting, order booking and tracking. https://www.capterra.com/p/174584/imos-iX/

**Role for a manufacturer like Häcker. [INFERENCE, grounded in the above]** imos is the "single source of geometric + production truth": a parametric kitchen design flows through it to produce the *exact* parts, drillings, edge-banding and nest layouts that drive the factory's CNC machines. This is the system whose **output must be reproduced bit-for-bit** by any replacement, because it directly drives steel.

**Pain points / lock-in.**
- **Proprietary parametric model + rule libraries.** Decades of cabinet logic, connector rules and machine post-processors are encoded in imos's proprietary format; there is no clean open export of the *rules* (only of geometry via glTF/IFC). **[INFERENCE]**
- **Heavyweight, desktop/AutoCAD-rooted, per-seat licensed** — designed around studio/engineering workstations, not web-native sales. **[INFERENCE from product framing on Capterra/vendor pages]**
- **Vendor consolidation risk** — imos is now inside the Hettich (a hardware manufacturer) group, i.e. the tool is owned by a supplier in the same value chain. **[NEEDS VERIFICATION of strategic implications; ownership itself is widely reported]**
- We did **not** find published, quantified complaints about price or lock-in in review sites; treat "expensive / locked-in" as a credible industry-known concern but **[NEEDS VERIFICATION]** for hard figures.

### 1.2 "IDM" — the Integrated Data Model (industry catalog-data standard) — NOT an imos PDM

> **This is the key reframing of the whole brief.**

**Most likely meaning in the Häcker/kitchen context. [VERIFIED]** **IDM = "Integrated Data Model"**, the unified, standardized **catalog-data format** maintained by the **Daten Competence Center e.V. (DCC)** in Herford (managing director **Dr. Olaf Plümer**). It was introduced from **2002** specifically for planning-intensive **kitchen & bath** furniture ("IDM Kitchen/Bath"), then extended to upholstered and residential furniture. The DCC also runs the master-data server **cat(at)web** and owns the international **eCl@ss** classification for furniture (segment 50).
Sources: https://www.dcc-moebel.org/ · https://www.dcc-moebel.org/ueber-uns.html · https://www.dcc-moebel.org/dochtml/IDM_3_0_1_XML_Schema.en/index.html (schema "IDM_3_0_1")

**What IDM carries. [VERIFIED, with one inferred element]** A configurator fed IDM data can render "all details, structures, logics, materials and colors" — i.e. IDM encodes **product structure, configuration rules/logic, materials/finishes**, and (per industry usage) **prices**; geometry is referenced for 3D rendering. https://www.roomle.com/en/blog/idm-importer

**Why it matters commercially. [VERIFIED]** "No fitted kitchen or seating landscape can be sold in Europe today without IDM data." IDM catalogs sit invisibly *behind the planning programs dealers use* — dealers often don't even know it's IDM. https://www.roomle.com/en/blog/idm-importer

**Role for Häcker. [INFERENCE, strongly grounded]** Häcker publishes an **IDM catalog** so that every kitchen studio's planning software (CARAT, KPS, etc.) can plan, price and order Häcker kitchens. IDM is Häcker's **distribution interface to the entire dealer channel**.

**Implication for "leaving the legacy stack." [INFERENCE — decision-critical]** You can replace imos and Navigram. You **cannot simply abandon IDM** without cutting off the dealer channel — IDM is not lock-in to escape, it is a **standard to keep emitting**. The new platform must *continue to publish a conformant IDM catalog* (likely keeping `cat(at)web` as the publishing endpoint). Treat IDM as a **required output format of the new catalog service**, not as a system to be retired.

**Caveat / ambiguity flag. [NEEDS VERIFICATION]** If, inside Häcker, "IDM" colloquially refers to a *specific internal master-data/PDM application* (some shops nickname their data system "IDM"), then the PDM-replacement analysis in §2.2 applies to that app — but the *interface it ultimately feeds* is still the DCC IDM standard. We could not confirm an imos product literally named "IDM"; imos's own master-data tool is **iX Organizer** (order/customer/master-data management). https://www.imos3d.com/en/products/design-order/ix-organizer/

### 1.3 Navigram — hosted 3D visualization / configurator / model storage

**What it is. [VERIFIED]** Navigram is a web-3D visualization & configuration platform for furniture, interior design and real estate (Navigram Planner for online 3D room planning; thousands of manufacturer 3D objects; Collada/SketchUp import; online save/share). Reported customer base of 200+ brands (Vitra, Rolf Benz, Philips et al.). Founded 2000; listed locations vary across sources (Utrecht NL in one profile; "navigram-technologies.com" presents a separate China-facing web-3D/VR arm) — **[NEEDS VERIFICATION]** on exact corporate structure/ownership today.
Sources: https://www.navigram.com/ · https://navigram-planner.software.informer.com/ · https://www.crunchbase.com/organization/navigram · https://www.navigram-technologies.com/nav.html?id=13

**Role for Häcker. [INFERENCE]** Navigram is the **3D-model store + visualization/configurator service** — hosting the 3D catalog and serving interactive/marketing visuals and (web) configuration. It maps directly onto the destination "model storage + configurator" services.

**Pain points / lock-in. [INFERENCE]**
- **Hosted SaaS**: the 3D catalog and viewer live on a third-party platform — limited control of the asset pipeline, the renderer, performance budgets, and the data.
- **Proprietary asset/scene representation** rather than open glTF-first storage you own — exactly the dependency the destination architecture removes by owning **GLB-on-CDN**.

---

## 2. Modern analogues per component (with recommendation for the three.js + services destination)

### 2.1 imos editor → parametric cabinet geometry + CAM/CNC

The replacement splits cleanly into **(A) parametric geometry in the browser** and **(B) the CAM/CNC "last mile."** They have very different difficulty profiles.

#### (A) Parametric geometry — buildable on the chosen three.js stack

| Approach | What it is | Pros | Cons | Fit |
|---|---|---|---|---|
| **three.js / R3F + own parametric layer** (chosen) | Assemble cabinet geometry from templates/params in-browser; meshes only | Full ownership; web-native; AI can fill template params; light client payloads | You build the parametric rules engine; no native B-rep/CAD ops out of the box | **Primary — for the editor/configurator** |
| **OCCT compiled to WASM** (OpenCascade.js, **occt-wasm**, **bitbybit**, **brepjs**, Cascade Studio) | The only full open-source **B-rep CAD kernel**, runnable in-browser | Real solids: booleans, fillets/chamfers, **STEP/IGES** import/export; near-native via WASM; three.js-compatible | ~4 MB+ WASM; CAD complexity; not needed for box furniture rendering | **Add where exact B-rep / STEP is required** (production geometry, complex parts) |
| **FreeCAD / OCCT (server-side, headless)** | Mature OCCT-based parametric CAD, scriptable in Python | Free; battle-tested kernel; open post-processing framework | Desktop-rooted; server-wrap needed; not a web UI | **Server-side geometry/validation service option** |
| **Commercial kernels** (Parasolid, ACIS, C3D) | Industrial B-rep kernels | Robust, supported | Costly licences; re-introduces a kernel dependency | Only if open kernel proves insufficient |

Sources: https://dev.opencascade.org/ · https://ocjs.org/ · https://github.com/andymai/occt-wasm · https://learn.bitbybit.dev/learn/code/common/occt/what-is-occt · https://github.com/zalo/CascadeStudio · https://www.opencascade.com/occt3d-technology/

**Key technical truth. [VERIFIED]** OCCT is "the only open-source full-scale 3D geometry library" and "arguably the only comprehensive open-source B-rep kernel that can be effectively compiled for the web." bitbybit exposes booleans/fillets/B-rep/STEP-IGES via `@bitbybit-dev/occt` with three.js integration. So an open path to *real CAD geometry in the browser* exists — but you use it surgically, not for every cabinet box. https://learn.bitbybit.dev/learn/code/common/occt/what-is-occt

#### (B) CAM / CNC output — the genuinely hard part

| Approach | What it is | Pros | Cons | Fit |
|---|---|---|---|---|
| **Keep / headless-wrap imos CAM (or equivalent)** | Reuse the proven post-processors & nesting via API/batch | Preserves *exact* machine output, decades of edge cases; lowest production risk | Continued (reduced) dependency/cost | **Recommended for cutover & early phases** |
| **Open nesting** — **Deepnest**, **SVGnest**, **OpenNest** | Genetic-algorithm 2D part nesting | Free; SVGnest "performs on-par with commercial"; Deepnest merges common cuts | 2D sheet nesting only; not full machine post-processing | **Own the nesting layer** incrementally |
| **Open post-processing** — FreeCAD Path (Python posts), PyCAM | Transparent, modifiable G-code generation | Fully readable/modifiable posts | Per-machine work; not multi-axis-grade | **Own simple posts**; treat complex/5-axis cautiously |
| **Commercial CAM** (Mastercam et al.) | Industrial post-processor ecosystems | Mature, supported posts | New vendor dependency | Fallback for specific machines |

Sources: https://deepnest.io/ · https://svgnest.com/ · https://github.com/Jack000/SVGnest · https://github.com/petrasvestartas/OpenNest · https://www.mastercam.com/community/blog/post-processing-for-cad-cam-software-your-complete-guide/ · https://cnccode.com/2025/07/20/how-to-build-a-custom-postprocessor-for-cam-software/

**How NC output is generated in modern setups. [VERIFIED/INFERENCE]** Modern pipelines separate **geometry → manufacturing features (drillings, grooves, edge-banding) → nesting → post-processor → machine dialect (G-code or vendor format)**. Post-processors are the dangerous link: "wrong postprocessor output like reversed arc direction or wrong G90/G91 logic can cause crashes or tool breakage," and quality posts matter most on 5-axis. https://cnccode.com/2025/07/20/how-to-build-a-custom-postprocessor-for-cam-software/

**Recommendation (geometry + CAM).** Build the **parametric configurator on three.js**, add **OCCT-WASM** where exact B-rep/STEP is needed, **own the nesting layer** (Deepnest/SVGnest lineage) early, but **keep/headless-wrap the proven CAM post-processors** through cutover and retire them machine-by-machine only after parity is proven (§4). This is the "own the data + configurator, keep CAM where prudent" hybrid.

### 2.2 IDM → modern PIM / PLM / headless commerce / CPQ / rules engine

> Remember (§1.2): IDM-the-standard is an **output to keep**. This section is about the *internal data platform* that produces it — the "catalog" service holding templates/presets/rules/prices.

| Layer | Modern options (2025–26) | Notes |
|---|---|---|
| **Headless commerce backbone** | **commercetools**, Crystallize | API-first; you build the front end (matches owning the editor). https://crystallize.com/blog/ecommerce |
| **PIM (product info)** | BetterCommerce PIM, Akeneo-class, Catsy | Materials, finishes, hardware, media as the catalog source-of-truth. https://www.bettercommerce.io/product/pim |
| **CPQ + rules engine (headless)** | **Logik.io**, **CanvasLogic**, SAP CPQ headless, CanvasLogic | Centralized configuration rules + pricing, embeddable via API/SDK/iframe. https://www.logik.io/headless-cpq · https://canvaslogic.com/headless-cpq/ · https://community.sap.com/t5/financial-management-blog-posts-by-sap/sap-cpq-headless-configurator-configurations-v2-api/ba-p/14297264 |
| **Furniture-native config + commerce** | **Roomle Rubens** | Built from the furniture industry; module/snap logic; ERP/CAD-CAM/PIM connectors; **can import IDM** and re-emit configured data to ERP/e-commerce/CAD-CAM. https://www.roomle.com/configurator.html · https://www.roomle.com/en/blog/idm-importer |

**Mapping to the destination's three article-keyed layers.** The "catalog" service = PIM (geometry templates/presets) + rules/CPQ engine (rules layer) + pricing (commerce layer), article-keyed. **Recommendation:** a **headless PIM + a dedicated rules/CPQ engine**, with a thin **IDM-export adapter** so the dealer channel keeps receiving conformant catalogs. Roomle is the closest furniture-native off-the-shelf comparator and a useful reference even if you build your own.

### 2.3 Navigram → modern 3D asset pipeline & DAM (glTF/GLB on CDN)

| Capability | Modern stack (matches destination) | Direct Navigram-class competitors |
|---|---|---|
| **3D format** | **glTF/GLB** — the de-facto web 3D standard; GLB the default for ~99% of web delivery | — |
| **Geometry compression** | **Draco** (−60–90% mesh) | — |
| **Texture compression** | **KTX2 / Basis Universal** (stays GPU-compressed, ~10× memory) | — |
| **Pipeline tooling** | **glTF-Transform** (`optimize … --texture-compress ktx2 --compress draco`, −70–90% size) | — |
| **Delivery** | **CDN** with edge caching; decoder files on CDN | — |
| **3D DAM / config platforms** | echo3D, AWS VAMS, VNTANA | **3D Cloud**, **Threekit**, **Zakeke**, **Cylindo**, Roomle |

Sources: https://www.khronos.org/blog/introducing-asset-creation-guidelines-2.0-siggraph-2025 · https://www.tripo3d.ai/blog/explore/choosing-the-best-format-for-web-glb-gltf · https://gltf-transform.dev (via search) · https://3dcloud.com/solutions/furniture/ · https://www.vntana.com/roundup/best-3d-viewers/ · https://blog.cylindo.com/the-ultimate-guide-to-3d-product-configurators

**Recommendation.** The destination plan (**own GLB assets, Draco + KTX2, CDN, three.js viewer**) **is exactly the current best practice** per Khronos' 2025 Asset Creation Guidelines 2.0 and the gltf-transform pipeline. Owning this removes Navigram's SaaS/lock-in entirely. Keep a **Threekit / 3D Cloud / Cylindo** comparison only as a build-vs-buy yardstick for time-to-market on rendering/AR features.

---

## 3. Industry data-exchange standards (don't migrate into a new dead-end)

| Standard | Domain | Role for kitchen/furniture | Verdict |
|---|---|---|---|
| **IDM — Integrated Data Model (DCC)** | Kitchen/bath + furniture **catalog & ordering** data, DE/EU | The **manufacturer↔planner/dealer** catalog standard; "can't sell a fitted kitchen in Europe without it." Plus EDI (ORDERS/ORDERS-RSP) and `cat(at)web` master-data server. | **VERIFIED — keep emitting it.** https://www.dcc-moebel.org/ · https://www.dcc-moebel.org/dochtml/IDM_3_0_1_XML_Schema.en/index.html |
| **OFML** (+ OCD, OAM, ODB, OEX) | **Office** furniture, DE | IBA standard (since 1998) for 3D + commercial data; OCD = commercial data, OEX = order data, ODB = geometry/logic; ecosystem around **pCon**. *Office-centric, not kitchen.* | **VERIFIED — adjacent, lower priority for kitchen.** https://en.wikipedia.org/wiki/OFML · https://iba.online/en/knowledge/space-planning/ofml/glossary/ |
| **eCl@ss** | Cross-industry classification | DCC owns furniture segment (50); product classification taxonomy. | **VERIFIED.** https://www.dcc-moebel.org/ueber-uns.html |
| **glTF / GLB** (Khronos) | Web 3D delivery | De-facto web 3D transmission format; Draco/KTX2; Khronos ACG 2.0 (2025) for commerce-ready assets. | **VERIFIED — the destination's runtime 3D format.** https://www.khronos.org/blog/introducing-asset-creation-guidelines-2.0-siggraph-2025 |
| **STEP (ISO 10303)** | Neutral CAD exchange | ISO reference for exact **B-rep** geometry, assemblies, PMI between heterogeneous CAD/CAM; good for long-term archival & manufacturing interchange. | **VERIFIED — the lossless intermediate for production geometry.** https://en.wikipedia.org/wiki/ISO_10303 · https://www.cadinterop.com/en/formats/neutral-format/step.html |
| **IFC (ISO 16739)** | Building/AEC | Architectural/construction data; imos already exports "IFC per BIM 2.0." Manufacturing↔AEC mapping is imperfect. | **VERIFIED — useful for built-in/AEC handoff, not core production.** https://en.wikipedia.org/wiki/Industry_Foundation_Classes |
| **Dealer planning software** (CARAT, KPS designstudio) | Consumes IDM | CARAT = "market leader for professional kitchen planning"; KPS for studios. They read Häcker's IDM. | **VERIFIED — the channel IDM feeds.** https://www.carat.de/ · context: https://systemhaus.com/software-fuer-kuechenplaner/hcker-kchenplaner |

**Net guidance.** Anchor the new platform on **three open, non-proprietary formats** so you never re-enter a dead-end: **glTF/GLB** (web runtime), **STEP** (lossless production geometry / archival), and **IDM** (mandatory channel/catalog output). OFML/IFC are situational. This combination means "own platform" without "own silo."

---

## 4. "Guaranteed migration" — how to actually de-risk and *verify* it

A guarantee is only credible if it's **measured**. The proven patterns (from CAD/PDM/ERP migrations) that turn "trust us" into "here's the parity report":

1. **Golden-file / round-trip validation. [VERIFIED pattern]** For a representative corpus of real orders, generate the production artifacts (cut lists, drillings, edge-banding, **nest layouts, G-code**) from *both* the legacy stack and the new one, and **diff the outputs, not just the inputs** — "comparing outputs not just transactions." Any cabinet whose new NC output differs from imos's is a defect until explained. https://sysgenpro.com/implementation/finance-erp-migration-from-legacy-systems-how-to-reduce-reconciliation-and-reporting-disruption

2. **Dual-run / parallel run with reconciliation. [VERIFIED]** "Parallel running — operating both old and new systems simultaneously — is the single most effective risk mitigation strategy." Run new alongside imos, **reconcile continuously**, and **log every change to explain detected differences**. Keep both live until parity holds over a defined window. https://pretius.com/blog/phased-legacy-modernization · https://vantagepoint.io/blog/sf/legacy-system-migration-a-phased-approach-to-minimize-risk-and-downtime

3. **Phased, reversible cutover (no big bang). [VERIFIED]** "Replace whole-system cutover with a series of small, reversible module releases, each validated in parallel before it takes traffic." Ladder per module: **read-only shadow → shadow writes → canary 1–5% → full cutover → retire legacy for that slice**, rollback preserved at each step. Move **low-risk data first** (reference/master data), production NC **last**. https://pretius.com/blog/phased-legacy-modernization

4. **Automated parity / regression testing. [VERIFIED pattern]** Reconstruct state at multiple dates and compare old vs new platform; run reconciliation jobs continuously; **keep validating 60–90 days post-cutover** before declaring a slice done. https://sysgenpro.com/... (as above) · https://catsy.com/blog/pdm-migration-checklist/

5. **Lossless intermediate formats. [VERIFIED/INFERENCE]** Use **STEP** for exact geometry transfer/archival and **IDM** for catalog/order data, so migration is auditable against open standards rather than a black-box re-import. https://www.cadinterop.com/en/formats/neutral-format/step.html

**What "guaranteed migration" should mean contractually. [INFERENCE]** Not "it'll feel the same," but: *for the agreed corpus of N real kitchens, the new platform reproduces legacy production output within an agreed tolerance (ideally byte-identical NC for the same machines), proven by an automated parity harness, during a dual-run window, with rollback available per slice.* That is a guarantee you can show the negotiator.

---

## 5. Build-vs-buy & honest risks

**The hard truth about CAD/CAM. [VERIFIED reasoning]** "Most kernels assume clean, well-prepared input… in practice that's rare — sloppy STEP files, wrong edge orientations, overlapping curves." Kernel/behavior peculiarities make swaps hard; **post-processor errors can crash machines or break tools.** These are exactly the **decades of edge cases** baked into imos that a green-field editor will not have on day one. https://transmagic.com/which-geometric-modeling-kernel/ · https://cnccode.com/2025/07/20/how-to-build-a-custom-postprocessor-for-cam-software/

| Risk | Severity | Mitigation |
|---|---|---|
| **Re-implementing parametric cabinet logic** (connectors, machining rules, edge cases) | High | Phase it; encode rules as data; validate against golden files (§4); keep imos as oracle during dual-run |
| **Machine post-processors / NC parity** | **Highest** (touches physical machines) | **Keep/headless-wrap proven CAM** through cutover; own nesting first; retire posts machine-by-machine only after byte-parity |
| **Geometry kernel gaps in-browser** | Medium | Use **OCCT-WASM** for exact B-rep where needed; STEP as exchange; don't force every part through it |
| **Losing the dealer channel** | High (commercial) | **Keep emitting IDM** + EDI; `cat(at)web` publishing as a required output |
| **Underestimating asset pipeline** | Medium | Standardize on glTF-Transform/Draco/KTX2/CDN early (well-trodden, low-risk) |
| **Owning rules/CPQ correctness** | Medium | Adopt a headless rules/CPQ engine rather than hand-rolling pricing logic |

**Recommended posture: hybrid, not heroic.**
- **Own immediately (low risk, high leverage):** the **configurator** (three.js/R3F), the **data layers** (PIM + rules/CPQ + pricing, article-keyed), and the **3D asset pipeline** (GLB/Draco/KTX2/CDN). These are where ownership pays off fastest and the technology is mature.
- **Wrap, then gradually own (high risk):** **CAM/CNC** — keep proven post-processors behind an API during cutover; bring nesting and simple posts in-house first; only displace machine posts once parity is proven per machine.
- **Always keep:** **IDM/EDI** publishing (channel) and **STEP** (lossless geometry interchange).

---

## 6. Benefits of moving — for a non-technical reader (with honest trade-offs)

1. **Own your data and your customer relationship.** Product, pricing and 3D data live in *your* platform, not rented from a CAD vendor or a hosted configurator. *Trade-off: you now carry the responsibility (and cost) of running and securing that platform.*
2. **Web-native sales, everywhere.** A browser-based 3D configurator lets dealers and customers design and visualize Häcker kitchens on any device with no install — modernizing the whole sales funnel. *Trade-off: matching the depth of a 20-year-old desktop engine in a browser takes staged delivery.*
3. **Lower lock-in and vendor leverage.** Built on **open standards** (glTF, STEP, IDM) instead of one proprietary format, so Häcker is no longer dependent on a single supplier's roadmap or per-seat licensing. *Trade-off: open building blocks need more in-house integration than an all-in-one suite.*
4. **Scalability and cost shape that fits the business.** Cloud asset delivery (CDN) and headless services scale with demand instead of seat licenses; you pay for what you use. *Trade-off: cloud spend must be actively managed.*
5. **Customization without waiting in a vendor queue.** New cabinet types, finishes, rules and sales features can be added on Häcker's schedule, not the CAD vendor's release cycle. *Trade-off: you own the bugs as well as the features.*
6. **AI that accelerates, safely.** AI fills template parameters under strict rules (it does **not** invent geometry), speeding up configuration while production stays deterministic and machine-safe. *Trade-off: requires disciplined guardrails so AI never reaches raw geometry/NC.*
7. **One coherent data model across sales → production.** The same article-keyed data drives the showroom render, the price, the rules and the factory output — fewer translation losses between systems. *Trade-off: that single model must be migrated and proven equivalent to imos first.*
8. **A future-proof channel.** By continuing to publish the **IDM** standard, the new platform keeps every existing dealer/planner integration working — modernization without breaking distribution. *Trade-off: IDM conformance is a hard requirement, not optional.*

---

## 7. Confidence ledger — verified vs uncertain

**Verified (sourced):**
- imos iX capabilities, variants (iX CAD/AC, iX CAM), data exports (glTF/GLB, IFC), iX Organizer as master-data tool. (imos3d.com, Capterra)
- **IDM = DCC "Integrated Data Model"**, kitchen/bath origin (2002), Dr. Plümer, `cat(at)web`, eCl@ss segment 50, "can't sell a fitted kitchen in Europe without IDM." (dcc-moebel.org, roomle.com)
- OFML/OCD/OEX/ODB scope and office-centricity; pCon ecosystem. (Wikipedia, IBA)
- OCCT as the lone full open B-rep kernel; OCCT-WASM via bitbybit/occt-wasm/OpenCascade.js; three.js compatibility; STEP/IGES IO. (dev.opencascade.org, bitbybit, ocjs.org)
- Open nesting (Deepnest/SVGnest/OpenNest) and post-processor risk realities. (deepnest.io, svgnest.com, cnccode.com)
- glTF/GLB + Draco + KTX2 + gltf-transform + CDN as current best practice; Khronos ACG 2.0 (2025). (khronos.org, tripo3d)
- STEP vs IFC roles; STEP as lossless manufacturing/archival exchange. (Wikipedia, cadinterop)
- Migration de-risking patterns: golden-file/output diffing, parallel run + reconciliation, phased reversible cutover, 60–90 day post-cutover validation. (pretius, vantagepoint, sysgenpro, catsy)
- Dealer planning landscape (CARAT market leader, KPS designstudio). (carat.de, systemhaus.com)

**Needs verification / uncertain:**
- **Whether Häcker's "IDM" is the DCC standard, an internal app nicknamed "IDM," or both.** Strong inference points to the DCC standard as the binding external interface; an internal PDM app may also exist. **Confirm with Häcker.**
- Exact imos pricing and documented lock-in complaints (no hard figures found).
- imos↔Hettich ownership *strategic implications* (ownership reported; implications inferred).
- Navigram's current corporate structure/ownership and exact technical model representation (sources conflict on geography; two "navigram" web presences exist).
- Whether Häcker's production runs **G-code** vs a **vendor machine format** (e.g. Homag/WEEKE woodWOP-style) — this materially affects post-processor strategy and the parity test. **Confirm the machine park.**
- Precisely which fields/prices IDM carries in Häcker's catalogs (schema is public — IDM_3_0_1 — but Häcker's profile of it is not).

---

### Appendix — primary sources (most load-bearing)
- imos iX CAD (capabilities, formats): https://www.imos3d.com/en/products/design-order/ix-cad-1/
- imos iX Organizer (master data): https://www.imos3d.com/en/products/design-order/ix-organizer/
- DCC (IDM standard, about): https://www.dcc-moebel.org/ · https://www.dcc-moebel.org/ueber-uns.html
- DCC IDM 3.0.1 XML schema: https://www.dcc-moebel.org/dochtml/IDM_3_0_1_XML_Schema.en/index.html
- Roomle IDM importer (IDM = industry standard, configurable from IDM): https://www.roomle.com/en/blog/idm-importer
- OFML: https://en.wikipedia.org/wiki/OFML · https://iba.online/en/knowledge/space-planning/ofml/glossary/
- OCCT: https://dev.opencascade.org/ · bitbybit OCCT: https://learn.bitbybit.dev/learn/code/common/occt/what-is-occt · occt-wasm: https://github.com/andymai/occt-wasm
- Nesting: https://deepnest.io/ · https://svgnest.com/ · https://github.com/petrasvestartas/OpenNest
- Post-processors: https://cnccode.com/2025/07/20/how-to-build-a-custom-postprocessor-for-cam-software/
- glTF asset pipeline: https://www.khronos.org/blog/introducing-asset-creation-guidelines-2.0-siggraph-2025
- STEP / IFC: https://en.wikipedia.org/wiki/ISO_10303 · https://www.cadinterop.com/en/formats/neutral-format/step.html
- Migration patterns: https://pretius.com/blog/phased-legacy-modernization · https://sysgenpro.com/implementation/finance-erp-migration-from-legacy-systems-how-to-reduce-reconciliation-and-reporting-disruption
- Kitchen planning channel: https://www.carat.de/
