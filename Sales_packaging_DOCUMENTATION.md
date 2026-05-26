# Patent Portfolio Bundling Template — Project Documentation

> **Living document.** This file is updated whenever a feature is added, changed, or removed. See the [Version History](#version-history) section for the changelog.

---

## Table of contents

1. [Overview](#overview)
2. [Version history](#version-history)
3. [File inventory](#file-inventory)
4. [Conceptual framework](#conceptual-framework)
5. [Quick reference — Bundle catalog (summary)](#quick-reference--bundle-catalog-summary)
6. [Sheet-by-sheet reference](#sheet-by-sheet-reference)
7. [Configuration system (v3)](#configuration-system-v3)
8. [Bundle catalog — full detail](#bundle-catalog--full-detail)
9. [Threshold catalog](#threshold-catalog)
10. [Quality gates](#quality-gates)
11. [Bundle composition strategies](#bundle-composition-strategies)
12. [Workflows / how-to guides](#workflows--how-to-guides)
13. [Maintenance notes](#maintenance-notes)
14. [Glossary](#glossary)

---

## Overview

### What this project is

A technical-attribute-based framework, delivered as an Excel workbook, for grouping patents in a portfolio into sellable bundles for **outright sale**. The framework is intentionally limited to **technical aspects only** — no patent valuation, no pricing, no financial modeling. The goal is to decide *which patents belong together* and *why a buyer would want them as a unit*, based on technical attributes alone.

### Problem it solves

A typical patent portfolio shortlisted for sale contains patents with very different characteristics — pioneer patents and improvement patents, broad and narrow claims, strong and weak claims, vulnerable and bulletproof patents, mature and emerging tech areas, multiple jurisdictions, varying remaining terms. Selling them as a single lot is rarely optimal. Selling them one-by-one is slow and leaves volume value on the table. The right answer is **structured bundling** — composing each bundle around a coherent technical narrative that targets a specific buyer profile.

### What it produces

For a given portfolio of patents (entered as rows in a spreadsheet), the framework:
- Scores every patent across 42 technical attributes (Groups A–I)
- Auto-routes each patent into one or more of 33 predefined bundle types based on logical rules
- Quality-scores each resulting bundle on coverage depth, detectability, term, invalidity exposure, continuation-optionality, and more
- Lets you toggle bundles, gates, and thresholds for a given analysis (v3)
- Lets you save and load named configurations as presets (v3)

---

## Version history

### v1 — Foundation
- 7 sheets: README, Attribute Dictionary, Patent Portfolio, Bundle Rules, Bundle Assignment, Bundle Quality Scorecard, Sample Bundles
- 26 technical attributes across 7 groups (A–G)
- 21 bundle types
- 12 sample patents pre-populated
- Bundle Assignment auto-computes TRUE/FALSE qualification per patent per bundle
- Scorecard auto-computes 8 quality metrics per bundle
- Data validation dropdowns on all categorical fields

### v2 — Quality, vulnerability, and market signals
- Added **Group H — Patent Quality & Vulnerability** (10 attributes): claim strength, prior-art exposure, prosecution risk, divided-infringement risk, forward citations, backward citations, litigation/PTAB history, chain-of-title, EoU availability, encumbrance status
- Added **Group I — Market/Buyer Signals** (4 attributes): product-mapping confidence, implementation maturity, adjacent-market re-read, workaround complexity
- Added **12 new bundle types (22–33)**: Anchor-and-Halo, Picket-Fence, Strong-Core+Tail, Continuation-Live, EoU-Backed, Battle-Tested, Clean-Title, High-Citation, Adjacent Re-Read, Salvage Volume, Pre-Expiry, Provenance-Coherent
- Added **5 quality-gate columns** on Bundle Quality Scorecard: Weakest H1, Invalidity Exposure %, EoU-ready %, Survived %, Continuation-optionality %
- Added **Bundle Composition Strategy sheet** documenting 10 compositional approaches (tiered, anchor-first, storyline, complementary-weakness, modular, carve-in/out, reserve, buyer-profile, continuation-optionality, provenance-coherent)
- Populated v1 sample patents with realistic H/I attribute values

### v3 — Pattern A configurability
- New **Configuration sheet** at the front of the workbook with:
  - Active Preset dropdown (pick a preset → everything recomputes)
  - Edit Mode toggle (Yes = use Manual Override values; No = use the preset)
  - Live summary line showing active bundles/gates count
  - Parameter table with 33 bundle toggles, 18 thresholds, 5 gate toggles, each with Active Value / From Preset / Manual Override columns
- New **Presets sheet** with 6 starter presets (All ON, NPE / Counter-Assertion, Operating Company / FTO, Defensive Aggregator, Standards Licensee, EV Powertrain Sale) + 4 empty Custom Preset slots
- **Bundle Assignment formulas rewired** — every per-patent formula wrapped in `IF(<bundle_enabled>="No","",<original_formula>)`. Disabled bundle columns show `[DISABLED]` in header and are grayed out. Disabled cells return blanks (don't inflate per-patent totals).
- **Bundle Quality Scorecard rewired** — disabled bundles show `[DISABLED] <name>` and gray-out the whole row; gate columns disabled the same way.
- **18 thresholds made tunable** — previously hardcoded values are now cell references to the Configuration sheet.
- **README extended** with v3 usage section.

### Future / Planned
- (Open) Optional Python helper script for one-command preset save/load.
- (Open) Carve-in / carve-out flags on the Bundle Assignment sheet (currently documented strategy only).
- (Open) Buyer-profile templates as additional starter presets.

---

## File inventory

| File | Purpose |
|---|---|
| `Patent_Bundling_Template_v3.xlsx` | The active workbook. Always use the latest version. |
| `Patent_Bundling_Template_v2.xlsx` | v2 — kept for reference; does not have configurability. |
| `Patent_Bundling_Template.xlsx` | v1 — original foundation; kept for reference. |
| `DOCUMENTATION.md` | This document. Updated whenever features change. |
| `build_template.py` | Source script for v1. |
| `extend_template.py` | Source script for v2 (extends v1 to v2). |
| `build_v3.py` | Source script for v3 (extends v2 to v3). |

Build scripts are kept because they encode the exact construction logic — if you ever need to extend or modify the template programmatically, edit the appropriate script and rebuild.

---

## Conceptual framework

### The two-stage model

The framework operates in two stages:

**Stage 1 — Score patents on technical attributes.** Each patent in the portfolio is scored across 42 attributes organized into 9 groups (A through I). Some attributes are categorical (e.g., stack layer), some are numeric (e.g., remaining term in years), some are 0–3 ratings (e.g., claim breadth, detectability).

**Stage 2 — Route patents into bundles using rules.** Each of the 33 bundle types has a routing rule expressed in terms of the attributes. For each (patent, bundle) pair, the rule evaluates to TRUE or FALSE. A single patent typically qualifies for multiple bundles — that's by design, because it gives flexibility in how the portfolio is packaged for different buyer types.

### Attribute groups

| Group | Theme | # of attributes | Examples |
|---|---|---|---|
| **A** | Technology Classification | 5 | Primary domain, stack layer, subsystem, use-case |
| **B** | Standards & Ecosystem | 3 | SEP potential, standard tagged, interface role |
| **C** | Claim & Scope | 4 | Claim type, breadth, count, design-around difficulty |
| **D** | Detectability & Enforcement | 3 | External detectability, teardown detectability, reads-on-products |
| **E** | Family & Lifecycle | 5 | Family size, prosecution status, continuation, term, maintenance |
| **F** | Geographic | 3 | Jurisdictions, trilateral coverage, major-market score |
| **G** | Strategic & Thematic | 3 | Convergence theme, generation, cross-industry applicability |
| **H** | Patent Quality & Vulnerability | 10 | Claim strength, prior-art exposure, litigation history, EoU availability |
| **I** | Market/Buyer Signals | 4 | Product-mapping confidence, implementation maturity, adjacent re-read |

See the **Attribute Dictionary** sheet in the workbook for the authoritative list with descriptions and scales.

### Why 33 bundles

The 33 bundle types fall into five conceptual layers:

1. **Technology-anchored bundles (1–8):** Group patents by what they're about technically — domain, SEP, product architecture, stack layer, use-case, manufacturing, materials, algorithms.
2. **Strategic-property bundles (9–17):** Group by enforceable/strategic property — interoperability, generation, claim-type, detectability, geography, family, lifecycle, foundational+improvement, cross-industry.
3. **Theme-and-context bundles (18–21):** Group by thematic or contextual signals — convergent theme, defensive, whitespace, prosecution status.
4. **Composition-pattern bundles (22–25):** Bundles formed by deliberate composition — anchor+halo, picket-fence, strong-core+tail, continuation-live.
5. **Quality/litigation/lifecycle bundles (26–33):** Bundles defined by buyer-facing quality signals — EoU-backed, battle-tested, clean-title, high-citation, adjacent re-read, salvage, pre-expiry, provenance-coherent.

---

## Quick reference — Bundle catalog (summary)

| # | Bundle | Routing in plain English | Primary attributes |
|---|---|---|---|
| 1 | Tech Domain | Same primary domain | A1 |
| 2 | SEP | SEP potential high AND mapped to a standard | B1, B2 |
| 3 | Product Architecture | Spans subsystems of one product | A4 |
| 4 | Stack Layer | Same stack layer | A3 |
| 5 | Use-Case | Same use-case tag | A5 |
| 6 | Manufacturing / Process | Process/fab/manufacturing domain + Method claims | A1, C1 |
| 7 | Materials & Chemistry | Materials/chem domain + Apparatus/Method claims | A1, C1 |
| 8 | Algorithm / Software | App/Middleware/Cloud + Method/CRM | A3, C1 |
| 9 | Interoperability | Interface role high | B3 |
| 10 | Generational Roadmap | Same generation tag | G2 |
| 11 | Claim-Type | Same claim type | C1 |
| 12 | Detectability | Externally or teardown-detectable | D1, D2 |
| 13 | Geographic | Trilateral or shared jurisdiction set | F1, F2 |
| 14 | Family-Tree | Sufficient family size | E1 |
| 15 | Lifecycle / Term | Any patent with known remaining term | E4 |
| 16 | Foundational + Improvement | Pioneer + narrow improvements together | C2 |
| 17 | Cross-Industry | High cross-industry applicability | G3 |
| 18 | Convergent Theme | Shared convergence tag | G1 |
| 19 | Defensive / Counter-Assertion | Reads on known products | D3 |
| 20 | Whitespace / Design-Around | Hard to design around AND in same domain | A1, C4 |
| 21 | Prosecution-Status | Pending or has live continuation | E2, E3 |
| 22 | Anchor-and-Halo | Anchor (strong claim + detectable) with halo | H1, C2, D2 |
| 23 | Picket-Fence | Multiple narrow patents cluster around tech/standard | A1, B2, C4 |
| 24 | Strong-Core + Tail | Mix of strong and weak patents in same domain | H1, A1 |
| 25 | Continuation-Live | Has live continuation | E3 |
| 26 | EoU-Backed | EoU claim chart available | H9 |
| 27 | Battle-Tested | Survived validity challenge | H7 |
| 28 | Clean-Chain-of-Title | Clean ownership AND no encumbrances | H8, H10 |
| 29 | High-Citation | Forward citations above threshold | H5 |
| 30 | Adjacent-Industry Re-Read | Re-read potential AND cross-industry | I3, G3 |
| 31 | Salvage / Volume Lot | Weak claim OR near expiry OR high prior-art risk | H1, E4, H2 |
| 32 | Pre-Expiry / Last-Window | 1–4 years remaining | E4 |
| 33 | Provenance-Coherent | Same domain + same subsystem | A1, A4 |

For the **full routing rule, value proposition, and threshold details for each bundle**, see [Bundle catalog — full detail](#bundle-catalog--full-detail) below.

---

## Sheet-by-sheet reference

The workbook contains 10 sheets in this order (v3):

### 1. README
The first sheet a new user lands on. Contains a project overview, color legend, sheet directory, and basic usage instructions. Updated at each version with an addendum section describing what's new.

### 2. Configuration *(v3 — new)*
The control panel. See [Configuration system (v3)](#configuration-system-v3) for full detail.
- **Editable cells:** Active Preset (B4), Edit Mode (B5), all Manual Override cells (column E)
- **Computed cells:** Active Value (column C), From Preset (column D), Summary line (B6)

### 3. Presets *(v3 — new)*
Parameter × preset matrix. 6 starter presets + 4 empty Custom Preset slots.
- **Editable cells:** any cell in a Custom Preset column (I–L), preset names in row 1
- **Read by:** Configuration sheet (via INDEX/MATCH)

### 4. Attribute Dictionary
Authoritative list of all 42 attributes (A1–I4) with group, code, name, description, scale, and example value.
- **Editable:** No — reference data.

### 5. Patent Portfolio
The master input sheet. One row per patent. 42 attribute columns across groups A–I.
- **Editable cells:** every patent row, every attribute column
- **Pre-populated:** 12 sample patents in rows 3–14
- **Validation:** dropdowns on categorical fields (stack layer, claim type, prosecution status, etc.), integer-only 0–3 bounds on rating fields

### 6. Bundle Rules
Documents all 33 bundle types with: number, name, value proposition, routing rule text, primary attributes used.
- **Editable:** No — reference data. The actual routing logic lives in Bundle Assignment formulas.

### 7. Bundle Assignment
Auto-computed TRUE/FALSE matrix. One row per patent, one column per bundle, plus a Total column at the end (column AJ).
- **All cells are formulas.** Do not edit.
- **Disabled bundle columns** (v3): show `[DISABLED]` in row 2 header and are grayed out via conditional formatting. Cells return blanks instead of TRUE/FALSE.
- **Color coding:** TRUE = green, FALSE = light red, disabled = gray.

### 8. Bundle Quality Scorecard
Auto-aggregated metrics per bundle. One row per bundle, columns for coverage depth, avg detectability, avg term, trilateral %, continuation %, SEP %, pioneer count, strength flag, and 5 gate metrics.
- **All cells are formulas.** Do not edit.
- **Disabled bundles** (v3): show `[DISABLED] <name>` in column B and gray out the whole row.
- **Disabled gates** (v3): show `[DISABLED]` in the column header and gray out that column.
- **Strength flag** (STRONG/MODERATE/WEAK) uses thresholds from Configuration.

### 9. Sample Bundles
Three worked examples (5G SEP cluster, EV powertrain stack, edge AI convergence) showing how real bundles look.
- **Editable:** No — illustrative.

### 10. Bundle Composition Strategy
Reference documentation for the 10 compositional approaches (tiered, anchor-first, storyline, etc.) plus a pre-offering checklist.
- **Editable:** No — reference data.

---

## Configuration system (v3)

### How it works

The Configuration sheet has every parameter (bundle toggle, threshold, or gate toggle) as its own row with four columns:

| Column | Name | Purpose |
|---|---|---|
| A | Parameter | The internal key (e.g., `B2_enabled`, `SEP_B1_cutoff`) |
| B | Description | Human-readable description |
| C | **Active Value** | The value formulas downstream actually read |
| D | From Preset | INDEX/MATCH lookup from the Presets sheet |
| E | Manual Override | Hand-editable cell, used when Edit Mode = Yes |

**Active Value formula:** `=IF($B$5="Yes",E<row>,D<row>)` — switches between manual override and preset lookup based on the Edit Mode cell.

**From Preset formula:** `=INDEX(Presets!$C<row>:$L<row>, MATCH($B$4, Presets!$C$1:$L$1, 0))` — looks up the value for the selected preset.

### Two operating modes

- **Preset mode (Edit Mode = No, default):** Pick a preset from the dropdown (cell B4). All Active Values automatically take the preset's values. Cannot edit individual values directly — but Manual Override values stay in column E waiting.
- **Edit Mode (Edit Mode = Yes):** All Active Values switch to reading from column E (Manual Override). You can hand-edit any value. The selected preset is ignored in this mode.

### Saving a custom configuration as a preset

1. On the Configuration sheet, set Edit Mode (B5) = Yes.
2. Edit any Manual Override values you want.
3. Open the Presets sheet.
4. In any Custom Preset column (I, J, K, or L), enter the values you want for each row.
5. Rename the column header (row 1) to your preset name.
6. Back on Configuration: set Edit Mode = No and select your new preset from the dropdown.

The 4 empty Custom Preset slots default to "All ON, default thresholds" so you can selectively edit only the cells you want changed.

### Extending beyond 10 presets

If you need more than 10 preset columns, add columns M onward on the Presets sheet, then update the data validation source for the Active Preset dropdown on the Configuration sheet (B4) to extend to the new last column.

---

## Bundle catalog — full detail

Authoritative bundle definitions. Each entry lists the bundle number, name, value proposition, routing rule, primary attributes, and any configurable thresholds.

---

### Bundle 1 — Tech Domain
- **Value proposition:** Concentrated coverage in one technical field; useful for entering or fortifying a domain position.
- **Routing rule:** A1 (primary technology domain) is populated. *(In practice, the bundle groups patents that share the same A1 tag.)*
- **Primary attributes:** A1
- **Tunable thresholds:** None

### Bundle 2 — SEP (Standard-Essential)
- **Value proposition:** Bundle of assets every implementer of a standard must license or design around.
- **Routing rule:** B1 ≥ `SEP_B1_cutoff` AND B2 is populated.
- **Primary attributes:** B1, B2
- **Tunable thresholds:** `SEP_B1_cutoff` (default 2)

### Bundle 3 — Product Architecture
- **Value proposition:** "Build a product" kit — full vertical coverage across subsystems of one end-product.
- **Routing rule:** A4 (subsystem) is populated.
- **Primary attributes:** A4
- **Tunable thresholds:** None

### Bundle 4 — Stack Layer
- **Value proposition:** Targets buyers operating at a specific layer of the technology stack.
- **Routing rule:** A3 (stack layer) is populated.
- **Primary attributes:** A3
- **Tunable thresholds:** None

### Bundle 5 — Use-Case
- **Value proposition:** All tools to address one customer problem, even if underlying tech is heterogeneous.
- **Routing rule:** A5 (use-case) is populated.
- **Primary attributes:** A5
- **Tunable thresholds:** None

### Bundle 6 — Manufacturing / Process
- **Value proposition:** Targets fabs, contract manufacturers, and equipment makers needing freedom to operate on production methods.
- **Routing rule:** A1 contains "process", "fab", or "manufac" AND C1 = "Method".
- **Primary attributes:** A1, C1
- **Tunable thresholds:** None

### Bundle 7 — Materials & Chemistry
- **Value proposition:** Focused IP shield around composition, synthesis, and use of a material system.
- **Routing rule:** A1 contains "material", "chem", "battery", "electrolyte", or "polymer" AND C1 ∈ {Apparatus, Method}.
- **Primary attributes:** A1, C1
- **Tunable thresholds:** None

### Bundle 8 — Algorithm / Software
- **Value proposition:** Implementation-agnostic methods deployable across many products.
- **Routing rule:** A3 ∈ {App, Middleware, Cloud} AND C1 ∈ {Method, CRM}.
- **Primary attributes:** A3, C1
- **Tunable thresholds:** None

### Bundle 9 — Interoperability
- **Value proposition:** Critical chokepoints for any player whose product must talk to others.
- **Routing rule:** B3 ≥ `Interface_B3_cutoff`.
- **Primary attributes:** B3
- **Tunable thresholds:** `Interface_B3_cutoff` (default 2)

### Bundle 10 — Generational Roadmap
- **Value proposition:** Buyer picks legacy (cheap defensive) or next-gen (forward-looking offensive).
- **Routing rule:** G2 (generation) is populated.
- **Primary attributes:** G2
- **Tunable thresholds:** None

### Bundle 11 — Claim-Type
- **Value proposition:** Different enforcement profiles; buyers pick by litigation/licensing strategy.
- **Routing rule:** C1 (claim type) is populated.
- **Primary attributes:** C1
- **Tunable thresholds:** None

### Bundle 12 — Detectability
- **Value proposition:** Litigation-ready bundle — infringement is easy to spot.
- **Routing rule:** D1 ≥ `Detect_D1_cutoff` OR D2 ≥ `Detect_D2_cutoff`.
- **Primary attributes:** D1, D2
- **Tunable thresholds:** `Detect_D1_cutoff` (default 2), `Detect_D2_cutoff` (default 2)

### Bundle 13 — Geographic
- **Value proposition:** Aligned with the buyer's market footprint and enforcement venues.
- **Routing rule:** F2 = "Yes" (trilateral coverage).
- **Primary attributes:** F1, F2
- **Tunable thresholds:** None

### Bundle 14 — Family-Tree
- **Value proposition:** Complete families together — parent + continuations + foreign counterparts; avoids fragmented ownership.
- **Routing rule:** E1 ≥ `Family_E1_min`.
- **Primary attributes:** E1
- **Tunable thresholds:** `Family_E1_min` (default 2)

### Bundle 15 — Lifecycle / Term
- **Value proposition:** Long-life = strategic; short-life = immediate licensing.
- **Routing rule:** E4 > 0 (i.e., remaining term known).
- **Primary attributes:** E4
- **Tunable thresholds:** None

### Bundle 16 — Foundational + Improvement
- **Value proposition:** Combines blocking broad claims with defensive narrow follow-ons — design-around becomes hard.
- **Routing rule:** C2 = 3 (pioneer) OR C2 ≤ 1 (improvements).
- **Primary attributes:** C2
- **Tunable thresholds:** None
- **Note:** This rule sweeps in both ends of the claim-breadth spectrum. In practice, you'll want to refine by also requiring shared A1 — see the Bundle Composition Strategy sheet.

### Bundle 17 — Cross-Industry
- **Value proposition:** Maximizes addressable buyer pool — many industries are potential acquirers.
- **Routing rule:** G3 ≥ `CrossIndustry_G3_cutoff`.
- **Primary attributes:** G3
- **Tunable thresholds:** `CrossIndustry_G3_cutoff` (default 2)

### Bundle 18 — Convergent Theme
- **Value proposition:** Aligns with current investment trends; commands attention from active builders.
- **Routing rule:** G1 (convergence theme) is populated.
- **Primary attributes:** G1
- **Tunable thresholds:** None

### Bundle 19 — Defensive / Counter-Assertion
- **Value proposition:** Counter-assertion ammunition — defined by who the patents read on, not just the technology.
- **Routing rule:** D3 ≥ `Defensive_D3_cutoff`.
- **Primary attributes:** D3
- **Tunable thresholds:** `Defensive_D3_cutoff` (default 2)

### Bundle 20 — Whitespace / Design-Around
- **Value proposition:** Closes escape routes around a known core patent or feature.
- **Routing rule:** C4 ≥ `Whitespace_C4_cutoff` AND A1 is populated.
- **Primary attributes:** A1, C4
- **Tunable thresholds:** `Whitespace_C4_cutoff` (default 2)

### Bundle 21 — Prosecution-Status
- **Value proposition:** Pending applications offer claim-tailoring flexibility for buyers targeting a specific product.
- **Routing rule:** E2 = "Pending" OR E3 = "Yes".
- **Primary attributes:** E2, E3
- **Tunable thresholds:** None

### Bundle 22 — Anchor-and-Halo
- **Value proposition:** One or two strong anchor patents fortified by narrower halo patents that close design-around routes. Buyer gets a fortified zone, not a single exposed asset.
- **Routing rule:** H1 ≥ `Anchor_H1_cutoff` AND C2 ≥ 1. *(In practice, the bundle is built around at least one patent satisfying anchor criteria H1=3 AND C2≥2 AND D2≥2, with halo patents sharing the same A1.)*
- **Primary attributes:** H1, C2, D2, A1
- **Tunable thresholds:** `Anchor_H1_cutoff` (default 2)

### Bundle 23 — Picket-Fence / Cluster-Around-Standard
- **Value proposition:** Multiple narrow patents collectively encircling a known commercial technology or specification. The fence is formed by the group, not any one patent.
- **Routing rule:** C4 ≥ 1 AND (A1 populated OR B2 populated).
- **Primary attributes:** A1, B2, C4
- **Tunable thresholds:** None

### Bundle 24 — Strong-Core + Quality-Diluted Tail
- **Value proposition:** A small set of high-quality assets carries the bundle while a tail provides volume and continuation optionality. Tail patents that wouldn't sell alone find a home alongside anchors.
- **Routing rule:** A1 is populated. *(Bundle is the deliberate combination of high-H1 and low-H1 patents in the same A1.)*
- **Primary attributes:** H1, A1
- **Tunable thresholds:** None

### Bundle 25 — Continuation-Live
- **Value proposition:** Buyer can shape future claims to match a specific target product.
- **Routing rule:** E3 = "Yes".
- **Primary attributes:** E3
- **Tunable thresholds:** None

### Bundle 26 — EoU-Backed / Litigation-Ready
- **Value proposition:** Every patent ships with an Evidence-of-Use claim chart already mapped to a named product or standard. Buyer skips claim charting and moves directly to assertion/licensing.
- **Routing rule:** H9 ∈ {"Partial", "Full"}.
- **Primary attributes:** H9
- **Tunable thresholds:** None

### Bundle 27 — Survived-Challenge / Battle-Tested
- **Value proposition:** Reduces buyer's invalidity risk — assets are legally vetted.
- **Routing rule:** H7 = "Survived".
- **Primary attributes:** H7
- **Tunable thresholds:** None

### Bundle 28 — Clean-Chain-of-Title
- **Value proposition:** Transacts faster and with lower legal cost.
- **Routing rule:** H8 = "Clean" AND H10 = "None".
- **Primary attributes:** H8, H10
- **Tunable thresholds:** None

### Bundle 29 — High-Citation / Technical-Influence
- **Value proposition:** Forward citations are a recognized signal of technical importance and point to obvious future target companies.
- **Routing rule:** H5 ≥ `HighCitation_H5_min`.
- **Primary attributes:** H5
- **Tunable thresholds:** `HighCitation_H5_min` (default 15)

### Bundle 30 — Adjacent-Industry Re-Read
- **Value proposition:** Gives the buyer a "second-life" thesis — opens new buyer pools beyond the original target industry.
- **Routing rule:** I3 ≥ 2 AND G3 ≥ 2.
- **Primary attributes:** I3, G3
- **Tunable thresholds:** None *(currently using literal 2; could be made tunable if needed)*

### Bundle 31 — Salvage / Defensive-Volume Lot
- **Value proposition:** Deliberate volume lot of weak, narrow, or near-expiry patents priced for defensive aggregators or counter-assertion stockpilers. Honest about what it is.
- **Routing rule:** H1 ≤ `Salvage_H1_max` OR E4 < `Salvage_E4_max` OR H2 ≤ `Salvage_H2_max`.
- **Primary attributes:** H1, E4, H2
- **Tunable thresholds:** `Salvage_H1_max` (default 1), `Salvage_E4_max` (default 5), `Salvage_H2_max` (default 1)

### Bundle 32 — Pre-Expiry / Last-Window
- **Value proposition:** Buyers running short-cycle licensing campaigns. Short term is a feature for litigation-finance buyers.
- **Routing rule:** `PreExpiry_min_years` ≤ E4 ≤ `PreExpiry_max_years`.
- **Primary attributes:** E4
- **Tunable thresholds:** `PreExpiry_min_years` (default 1), `PreExpiry_max_years` (default 4)

### Bundle 33 — Provenance-Coherent
- **Value proposition:** Shared specifications and consistent terminology reduce claim-construction risk when buyer experts must digest 30+ patents at once.
- **Routing rule:** A1 is populated AND A4 is populated (proxy for common provenance).
- **Primary attributes:** A1, A4
- **Tunable thresholds:** None

---

## Threshold catalog

All 18 tunable thresholds available on the Configuration sheet:

| Threshold key | Default | Used by | What it controls |
|---|---|---|---|
| `SEP_B1_cutoff` | 2 | B2 | Minimum B1 (SEP potential) for SEP bundle qualification |
| `Interface_B3_cutoff` | 2 | B9 | Minimum B3 (interface role) for Interop bundle qualification |
| `Detect_D1_cutoff` | 2 | B12 | Minimum D1 (external detectability) for Detectability bundle |
| `Detect_D2_cutoff` | 2 | B12 | Minimum D2 (teardown detectability) for Detectability bundle |
| `Family_E1_min` | 2 | B14 | Minimum E1 (family size) for Family bundle |
| `CrossIndustry_G3_cutoff` | 2 | B17 | Minimum G3 (cross-industry score) for Cross-Industry bundle |
| `Defensive_D3_cutoff` | 2 | B19 | Minimum D3 (reads on products) for Defensive bundle |
| `Whitespace_C4_cutoff` | 2 | B20 | Minimum C4 (design-around difficulty) for Whitespace bundle |
| `Anchor_H1_cutoff` | 2 | B22 | Minimum H1 (claim strength) to qualify as anchor |
| `HighCitation_H5_min` | 15 | B29 | Minimum H5 (forward citations) for High-Citation bundle |
| `PreExpiry_min_years` | 1 | B32 | Lower bound of pre-expiry window |
| `PreExpiry_max_years` | 4 | B32 | Upper bound of pre-expiry window |
| `Salvage_H1_max` | 1 | B31 | Maximum H1 to qualify as salvage |
| `Salvage_E4_max` | 5 | B31 | Maximum remaining term to qualify as salvage |
| `Salvage_H2_max` | 1 | B31 | Maximum H2 (prior-art exposure) to qualify as salvage |
| `Strength_depth_min` | 4 | Scorecard | Min coverage depth for STRONG strength flag |
| `Strength_detect_min` | 2 | Scorecard | Min avg detectability for STRONG strength flag |
| `Strength_term_min` | 10 | Scorecard | Min avg remaining term for STRONG strength flag |

---

## Quality gates

The Bundle Quality Scorecard sheet has 5 buyer-facing quality columns that can be individually toggled on the Configuration sheet:

| Gate key | Column | What it measures |
|---|---|---|
| `Gate_WeakestH1` | K | Minimum H1 within the bundle. Reveals the bundle's "weakest link" in claim strength. |
| `Gate_InvalidityExposure` | L | % of bundle patents with H2 ≤ 1 (high prior-art risk). Above 30% triggers a quality-filter pass. |
| `Gate_EoUReady` | M | % of bundle patents with H9 ≠ None (i.e., EoU chart available). High = litigation-ready. |
| `Gate_Survived` | N | % of bundle patents with H7 = "Survived" (passed a validity challenge). |
| `Gate_ContOptionality` | O | % of bundle patents with E3 = Yes (live continuation). High = future claim-shaping room. |

When a gate is disabled, its entire column on the Scorecard is grayed out, the header gets a `[DISABLED]` marker, and all cells return blanks.

---

## Bundle composition strategies

These are documented on the **Bundle Composition Strategy** sheet of the workbook. They sit one layer *above* the 33 bundle types — they describe *how to compose, position, and price bundles* once routing rules have produced candidates. Summary:

1. **Tiered structure (Premium / Standard / Lot)** — Three quality tiers from the same pool.
2. **Anchor-first bundling** — Every bundle must have a "lead patent" the buyer latches onto.
3. **Storyline bundling** — Group patents that tell a single technical story.
4. **Complementary-weakness bundling** — Pair patents whose weaknesses cancel.
5. **Modular bundling** — Pre-compose modules that buyers can mix-and-match.
6. **Carve-in vs. carve-out logic** — Explicitly mark which patents are sold only as a unit.
7. **Reserve strategy** — Keep the strongest 1–2 patents out of bundles for individual sale.
8. **Conditional / buyer-profile bundling** — Same patents, different bundle constructions for different buyers.
9. **Continuation-optionality overlay** — Bundles with live continuations marketed as "claim-tailorable".
10. **Provenance-coherent bundling** — Patents from same R&D program or sub-business for narrative coherence.

A **pre-offering checklist** is included on the same sheet — anchor presence, invalidity exposure < 30%, clean chain of title, coherent technical story, EoU charts available for anchors, commercially meaningful size, clear buyer profile.

---

## Workflows / how-to guides

### Workflow 1 — Analyze a new portfolio

1. Open `Patent_Bundling_Template_v3.xlsx`.
2. Go to the **Patent Portfolio** sheet.
3. Replace the 12 sample patents with your own data. Use the dropdowns where provided. Score every attribute you have data for; leave blanks where unknown.
4. Add more rows as needed (copy formulas-and-formatting from row 14 downward).
5. Go to **Bundle Assignment** — review which bundles each patent qualifies for.
6. Go to **Bundle Quality Scorecard** — review aggregate quality metrics per bundle. Look for STRONG flags and high EoU-ready / Survived percentages.
7. Iterate: refine attribute scores, merge small bundles, split large ones.

### Workflow 2 — Configure for a specific buyer

1. Go to **Configuration**.
2. Click cell B4 (Active Preset). Pick one of the 6 starter presets that best matches your buyer type:
   - NPE / litigation buyer → "NPE / Counter-Assertion"
   - Operating company → "Operating Company / FTO"
   - Defensive aggregator (RPX-style) → "Defensive Aggregator"
   - Standards licensee → "Standards Licensee"
   - EV powertrain sale → "EV Powertrain Sale"
3. Look at the **Summary line** (cell B6) to confirm how many bundles and gates are active.
4. Bundle Assignment and Scorecard automatically recompute.
5. Disabled bundles appear grayed out with `[DISABLED]` markers — still visible but not counted.

### Workflow 3 — Fine-tune a preset for one analysis

1. On Configuration, set Edit Mode (B5) to **Yes**.
2. Active Values now read from the Manual Override column (E).
3. Edit any Manual Override cell — flip a toggle to No, change a threshold, etc.
4. Bundle Assignment and Scorecard recompute live.
5. Summary line confirms "EDIT MODE — using Manual Override values".
6. To return to a preset, set Edit Mode back to **No** and pick from the dropdown.

### Workflow 4 — Save a custom configuration as a preset

1. On Configuration, set Edit Mode to Yes and tune all values to your liking.
2. Go to the **Presets** sheet.
3. Pick one of the 4 empty Custom Preset columns (I, J, K, or L).
4. Enter your values row-by-row, matching the values you set on Configuration. (Alternative: copy column C from Configuration and paste-special "values only" into your chosen preset column on Presets — the row order matches.)
5. Click row 1 of the preset column and rename it (e.g., "My EV+AI Sale Q3").
6. Back on Configuration: set Edit Mode = No, and pick your new preset from the dropdown.

### Workflow 5 — Add a new patent attribute

This requires editing the build scripts and regenerating the workbook. Outline:

1. Edit `build_template.py` (or the most recent build script).
2. Add the new attribute to the relevant group's headers and the Attribute Dictionary block.
3. Update any downstream routing rules in Bundle Assignment that should reference the new attribute.
4. Run the build script chain (`build_template.py` → `extend_template.py` → `build_v3.py`).
5. Run the recalc script to verify zero formula errors.
6. Update this documentation accordingly.

### Workflow 6 — Add a new bundle type

1. Edit `build_v3.py` and append a new entry to the `BUNDLES` list (number, name, threshold notes, default-on).
2. Add the routing rule to the `qual_body` function.
3. Add the bundle short name to `bundle_short_names_short`.
4. Update `BUNDLES`-dependent constructs (Bundle Assignment headers, Scorecard rows, Presets sheet bundle rows).
5. Update presets to mark the new bundle on/off in each preset.
6. Rebuild the workbook from scratch (run the build script chain).
7. Update this documentation.

---

## Maintenance notes

### Formula conventions

- **Blue text** = user input cells (hardcoded values).
- **Black text** = formula cells / computed values.
- **Green text** = cross-sheet links (e.g., Bundle Assignment pulling from Patent Portfolio).
- **Gray italic text with `[DISABLED]` marker** = parameter or row turned off via Configuration.

### Conditional formatting layers (Bundle Assignment)

Bundle Assignment cells have layered conditional formatting:
1. **Disabled gray-out** (highest priority, `stopIfTrue=True`): triggered when the row-2 header contains `[DISABLED]`.
2. **TRUE = green** / **FALSE = light red**: applied to enabled cells only (after the disabled rule takes precedence).

### Known limitations

- **Bundle 16 (Foundational + Improvement)** sweeps in both ends of the C2 spectrum and tends to show high invalidity exposure in practice. Refine by adding a shared A1 filter if needed.
- **Bundle 30 (Adjacent Re-Read)** uses literal thresholds (I3 ≥ 2 AND G3 ≥ 2) rather than Configuration-tunable ones. Easy to make tunable later if needed.
- **Picket-Fence (Bundle 23)** routing rule doesn't enforce a minimum bundle size of 4 (the strategy says ≥ 4 patents form a fence). The single-patent test is whether each patent is eligible to be part of a picket-fence; aggregate count is observed on the Scorecard.
- **Continuation availability (E3)** is binary in this model. Real portfolios distinguish "alive continuation," "abandoned continuation," and "no children" — collapse to Yes/No here.
- **No carve-in/carve-out marker** on Bundle Assignment yet — strategy is documented but not encoded as a column. Could be added.
- **Patent Portfolio row capacity** is currently 20 rows (12 samples + 8 blanks). To extend, add rows and copy formulas from the existing patterns. Update Bundle Assignment row count and Scorecard aggregation ranges accordingly.

### When formulas don't recalculate

If you open the file and bundle assignment looks stale:
- In Excel: press F9 or Ctrl+Alt+F9 to force a full recalc.
- In LibreOffice: Tools → Cell Contents → Recalculate Hard (Ctrl+Shift+F9).
- If you've been editing via Python/openpyxl, run `python /mnt/skills/public/xlsx/scripts/recalc.py <file>` to force LibreOffice to compute the cached values.

### Editing the file

- The workbook is fully formula-driven — no macros, no scripting required to use.
- Adding patent rows: extend Patent Portfolio downward, then copy Bundle Assignment row formulas down to match, and extend the SUMPRODUCT ranges in Bundle Quality Scorecard.
- Renaming bundles: the short names appear in `bundle_short_names_short` in `build_v3.py`. Rename there and rebuild. Or rename directly in Bundle Assignment row 2 if you're comfortable with the impact on Scorecard cross-references.

---

## Glossary

| Term | Definition |
|---|---|
| **Anchor patent** | A high-quality patent (typically H1=3, C2≥2, D2≥2) that serves as the lead asset in a bundle. The bundle is built around it. |
| **Battle-tested** | A patent that has survived a validity challenge (IPR, EPO opposition, re-examination). |
| **Carve-in** | Patents that must be sold as a unit and cannot be cherry-picked out of a bundle. |
| **Carve-out** | Patents excluded from a bundle either because they're being held for individual sale or because of encumbrances. |
| **Chain of title** | The sequence of ownership transfers (assignments) from the original inventor(s) to the current owner. A clean chain has all assignments recorded and no gaps. |
| **Claim chart** | A document that maps each element of a patent claim to a corresponding feature in a product or standard. The legal heart of an EoU. |
| **Continuation** | A patent application filed off a parent application, claiming priority to it. Keeps the family "alive" for further claim-shaping. |
| **Defensive aggregator** | A buyer (often a consortium like RPX) that acquires patents to reduce litigation risk for its members. Values volume and broad coverage over individual patent quality. |
| **Divided infringement** | When the acts required to practice a claim are split between multiple parties (e.g., end-user and service provider). Makes the patent harder to enforce. |
| **EoU (Evidence of Use)** | A document mapping a patent's claims to a specific commercial product, demonstrating infringement. Significantly increases bundle value. |
| **Estoppel (file wrapper)** | Limitations on claim scope arising from arguments the patentee made during prosecution. High estoppel reduces enforceability. |
| **FTO (Freedom to Operate)** | The ability to commercialize a product without infringing third-party patents. Operating companies buy patents partly to secure FTO. |
| **Halo patent** | A patent that supports an anchor patent — typically narrower, closing design-around routes around the anchor. |
| **High-Definition (HD) claim chart** | A claim chart that maps every element with maximum granularity, including secondary references. Highest assertion-readiness. |
| **IPR (Inter Partes Review)** | A US PTAB proceeding to challenge patent validity. Surviving an IPR is a strong validity signal. |
| **Maintenance fees** | Periodic fees required to keep a granted patent in force. Missing them causes lapse. |
| **NPE (Non-Practicing Entity)** | An entity that owns patents but doesn't make products. Often a target buyer for assertion-ready bundles. |
| **Picket-fence** | A bundle of multiple narrow patents that collectively encircle a technology or standard. Individual patents are weak; the fence is strong. |
| **Pioneer patent** | A foundational, broad-scope patent that opens a new technology area. High value but also high invalidity risk. |
| **Provisional application** | A US patent filing that secures a priority date without examination. Must be converted to a non-provisional within 12 months. |
| **PTAB** | Patent Trial and Appeal Board — the US patent office tribunal that handles IPRs and other post-grant proceedings. |
| **Salvage lot** | A volume bundle of weak, near-expiry, or otherwise low-individual-value patents priced and marketed as such. |
| **SEP (Standard-Essential Patent)** | A patent that must be infringed to comply with a technical standard (5G NR, Wi-Fi 7, USB-C, etc.). Universally licensable. |
| **Trilateral coverage** | A patent granted in the major three jurisdictions (typically US + EP + at least one of CN/JP/KR). |
| **Whitespace** | The technical area surrounding a known core patent where competitors might design around. A whitespace bundle closes those escape routes. |

---

*Document maintained alongside `Patent_Bundling_Template_v3.xlsx`. Last updated for v3 — Pattern A configurability release.*
