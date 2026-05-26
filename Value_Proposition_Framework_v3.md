# Value Proposition Framework for Sales Packages — v3

> **Companion to** `Patent_Bundling_Template_v4.xlsx`, `DOCUMENTATION.md`, `Attribute_Derivation_Procedure.docx`, and `AI_Prompts_for_Attribute_Scoring.md`.
>
> **Purpose.** Once the bundling framework has produced a clean technical bundle (routed by attributes, quality-scored on the Scorecard), this document defines how to translate that bundle into a buyer-facing sales narrative — the IAM Market-style listing that a broker publishes to attract qualified buyers, and the deeper marketing materials that follow.
>
> **What v3 adds beyond v2.** v2 was structurally accurate (block-library, four patterns, attribute-to-copy mapping) but treated the listing in isolation. v3 expands the framework outward to cover (a) the marketing-material hierarchy from one-line teaser to full claim-chart package, (b) the buyer-archetype layer that determines language register and emphasis, (c) the market-context library that surfaces non-attribute facts in a controlled way, (d) signal-strength taxonomy distinguishing what we can claim explicitly vs implicitly, (e) language register and tone calibration, (f) a workflow-checklist with quality gates, and (g) extended exemplar library and counter-examples.
>
> **Research base.** v3 incorporates findings from the Richardson Oliver Insights brokered patent market reports (2022, 2023), academic studies on patent buyer behavior (Fischer & Henkel, Kwon & Drev, Méniére et al.), industry guidance on EoU and claim charts, and a survey of broker marketing materials beyond DynaIP including ICEBERG IP Group, Tangible IP, and Vitek IP.

---

## Table of contents

### Part I — Foundation

1. [The bridge — from attributes to narrative](#1-the-bridge--from-attributes-to-narrative)
2. [What the market actually looks like](#2-what-the-market-actually-looks-like)
3. [The marketing-material hierarchy](#3-the-marketing-material-hierarchy)

### Part II — Buyer-facing logic

4. [Buyer archetypes and what each one reads for](#4-buyer-archetypes-and-what-each-one-reads-for)
5. [Signal-strength taxonomy](#5-signal-strength-taxonomy)
6. [Market context — how to source it, how to use it](#6-market-context--how-to-source-it-how-to-use-it)

### Part III — The listing template

7. [Structural variation across the corpus](#7-structural-variation-across-the-corpus)
8. [The block library — required vs conditional](#8-the-block-library--required-vs-conditional)
9. [Four canonical listing patterns](#9-four-canonical-listing-patterns)
10. [Block-by-block construction guide](#10-block-by-block-construction-guide)
11. [Attribute-to-copy mapping](#11-attribute-to-copy-mapping)
12. [Bundle-type narrative variants](#12-bundle-type-narrative-variants)

### Part IV — Craft

13. [Language register and tone calibration](#13-language-register-and-tone-calibration)
14. [Style rules](#14-style-rules)
15. [Failure modes to avoid](#15-failure-modes-to-avoid)

### Part V — Reference

16. [Worked examples — all six listings, deconstructed](#16-worked-examples--all-six-listings-deconstructed)
17. [Authoring workflow with quality gates](#17-authoring-workflow-with-quality-gates)
18. [Pattern selection decision tree](#18-pattern-selection-decision-tree)
19. [AI prompt for first-draft generation](#19-ai-prompt-for-first-draft-generation)
20. [Glossary](#20-glossary)

---

# PART I — FOUNDATION

## 1. The bridge — from attributes to narrative

The bundling framework stops at the question *"which patents belong together, and why technically?"* It does not answer the question a buyer actually reads on IAM Market: *"why should I, specifically, want this bundle, and what does it let me do that I can't do today?"*

The value-proposition layer is that bridge. It takes four structured inputs and produces tiered marketing output:

| Input | Source in the framework |
|---|---|
| Technical attribute scores (42 attributes, Groups A–I) | Patent Portfolio sheet |
| Bundle routing + composition | Bundle Assignment sheet, Bundle Composition Strategy sheet |
| Quality metrics + gates | Bundle Quality Scorecard sheet |
| Buyer archetype + market context *(new in v3)* | Section 4 archetype dictionary + Section 6 context library |

The output is **tiered** — from a one-paragraph IAM Market listing all the way to a full confidential information memorandum (CIM) with claim charts. Section 3 lays out the hierarchy.

The framework remains **deliberately narrow** on what it asserts: it does not invent claims about market size, growth rates, or competitor positioning that aren't directly supported by attributes you scored or facts you can cite. Where external context appears, it comes from a controlled, sourced library — see Section 6.

---

## 2. What the market actually looks like

Three findings from the broker-market literature shape this framework. They're worth internalizing before drafting.

### 2.1 Most listings don't sell

Across multiple Richardson Oliver Insights reports, the headline number is consistent: roughly **20% of brokered patent packages sell**, give or take a few percentage points across years. Average asking price per asset hovers around $200–350K. Time to close averages ~180 days.

**What this means for the framework.** Every listing competes for scarce buyer attention. A listing is read by a buyer-side analyst who is screening dozens of packages; their default decision is "skip". The listing's job is to survive that scan and earn a longer look. Conciseness, specificity, and clean signal beat completeness every time. Adjectives, hedging, and broad market claims are scan-killers.

### 2.2 Quality artifacts close deals

The same reports note that **packages with claim charts, EoU mapping, and clean diligence-ready documents close at meaningfully higher rates**. The listing itself is one rung on a ladder that includes a teaser, the listing, an NDA-gated CIM, claim charts, and a final diligence package. A great listing without supporting documents stalls; an average listing with strong supporting documents sells.

**What this means for the framework.** The listing should *signal* the existence of supporting documents, not embed them. "Claim charts available" is a powerful three-word phrase in a listing. Section 5 (signal-strength taxonomy) treats this systematically.

### 2.3 Different buyer archetypes value different attributes

Academic research (Fischer & Henkel 2012; Kwon & Drev 2020; Méniére et al.) and broker-tracked data (RPX, Unified Patents) converge on a clear pattern. Different buyer types preferentially purchase patents with measurably different attribute profiles:

- **Operating companies** — broader claim scope, integrated subsystem coverage, current commercial relevance to their product lines
- **NPEs / assertion entities** — narrower scope, hot technology fields, international (triadic) families, strong forward citations, mapped products, longer residual life
- **Defensive aggregators (RPX, AST)** — higher technical merit, longer residual life, narrower scope, clean chain of title, low litigation/PTAB risk
- **Litigation-finance buyers** — short-window enforcement, validity-survived, EoU-ready, high D2 detectability

Distribution across these buyer types has shifted year to year. In 2018, NPEs bought 42%, operating companies 37%, defensive aggregators 19%. In recent years operating companies have held roughly 37–45%, NPEs 20–50%, with the rest split among aggregators and litigation funders.

**What this means for the framework.** The same bundle can be positioned for different archetypes. The two Campbell listings (Data Wallet for identity buyers, Token Mining for DePIN/AI buyers — same underlying patent) demonstrate this at listing scale. The buyer archetype determines which attributes the listing surfaces and which language register it uses. Section 4 codifies the archetypes.

---

## 3. The marketing-material hierarchy

A patent sale isn't sold by a single document. It's sold by a sequence, each step gating the next. The listing is rung 2 of 5.

```
RUNG 1 — Teaser (1 paragraph, non-confidential)
            ↓ buyer notices
RUNG 2 — IAM Market listing (1 page, non-confidential) ← this framework's primary focus
            ↓ buyer clicks Contact
RUNG 3 — Non-confidential offering presentation
            (5–10 slides, no claim charts, no EoU specifics)
            ↓ NDA signed
RUNG 4 — Confidential Information Memorandum (CIM)
            (20–40 pages, detailed attribute analysis, mapped products)
            ↓ buyer indicates interest
RUNG 5 — Diligence package
            (claim charts, EoU evidence, file wrappers, assignments)
```

The block-and-pattern logic of v2 covers Rung 2 specifically. v3 expands the framework to support drafting Rungs 1, 3, and the executive summary of Rung 4 — all from the same attribute inputs.

### Rung 1 — Teaser (1 paragraph)

A teaser is what brokers send in cold-outreach emails to potential buyers, often before the public listing goes live. It is a single paragraph, 50–80 words, non-confidential, intended to whet appetite.

**Teaser template:**

```
[Broker] is representing [N] [US patents/assets] in [domain]
covering [one-line technical core]. The portfolio is positioned
for [primary buyer archetype] in [industry/segment].
[Single strongest quality signal — e.g., "EoU charts available",
"family includes live continuation", "validity-survived in PTAB"].
Available for sale; further details under NDA.
```

**Source attributes:** A1, A5 → domain + core. Buyer-archetype tag → positioning. Strongest H9/H7/E3 signal → quality phrase.

### Rung 2 — IAM Market listing (the primary focus of this framework)

Covered in Parts III and IV.

### Rung 3 — Non-confidential offering presentation

A 5–10 slide PDF deck. Same content as the listing, but expanded with:
- One slide per feature bullet (with diagrams where available)
- A "buyer fit" slide naming 3–5 target archetypes and the use case for each
- A "package summary" slide listing assets, family count, jurisdictions, remaining term
- A redacted "supporting materials" slide indicating what's available under NDA (claim charts: yes/no; file wrappers: yes/no; assignment chain: yes/no)

The deck is a controlled expansion of the listing — every sentence in the deck must trace back to either an attribute or a sourced market-context fact.

### Rung 4 — Confidential Information Memorandum (CIM)

A 20–40 page document released under NDA. Structure:

1. Executive summary (1 page) — *generated from listing + scorecard*
2. Asset list with full bibliography (1–3 pages)
3. Technical overview (3–5 pages) — *expansion of Block 2 + Block 3*
4. Claim landscape (2–4 pages) — independent claims summary, claim-breadth profile
5. Quality & vulnerability assessment (2–4 pages) — *direct rendering of Group H attributes*
6. Detectability & evidence-of-use (2–4 pages) — D1/D2/D3 + I1 with named products
7. Geographic coverage (1 page) — F1/F2 map and table
8. Lifecycle & continuation optionality (1–2 pages) — E1–E5 + continuation status
9. Market context & buyer fit (2–4 pages) — *expansion of Section 6 context*
10. Process and next steps (1 page) — bidding timeline, contact

This framework supports drafting the executive summary and the buyer-fit section directly from the workbook. The rest is a known templated structure documented in industry sources.

### Rung 5 — Diligence package

Patent-counsel work, not copywriting. Out of scope for this framework.

### Where this framework's outputs map

| Rung | Length | Built from | Framework section |
|---|---|---|---|
| 1 — Teaser | 50–80 words | A1, A5, archetype tag, strongest quality signal | Section 3.1 template |
| 2 — Listing | 120–350 words | Full attribute set + scorecard + pattern selection | Parts III–IV |
| 3 — Offering deck | 5–10 slides | Listing + per-bullet expansion + context library | Implied template (Section 17 step) |
| 4 — CIM exec summary | 1 page | Scorecard + listing + market context | Implied template (Section 17 step) |
| 4 — CIM buyer-fit | 2–4 pages | Archetype × attribute table from Section 4 | Section 4 |
| 5 — Diligence pkg | N/A | Counsel-prepared | Out of scope |

---

# PART II — BUYER-FACING LOGIC

## 4. Buyer archetypes and what each one reads for

A listing is read differently by different buyer types. The same sentence that excites an operating company's IP strategist ("integrated subsystem coverage across the EV powertrain") may leave an NPE-side analyst cold. The buyer archetype determines emphasis, language register, and which attributes the listing surfaces first.

This section codifies seven archetypes synthesized from the broker-market literature. Each archetype has (a) a profile, (b) the attributes they *over-weight* in screening, (c) the language register they expect, and (d) the failure mode they're scanning for.

### 4.1 The seven archetypes

| Archetype | Who they are | Primary motive |
|---|---|---|
| **OC-DEF** Operating company, defensive | Established product company building FTO around current and next-gen products | Reduce litigation exposure, secure design freedom |
| **OC-OFF** Operating company, offensive | Operating company building counter-assertion arsenal against named competitors | Cross-license leverage, deterrence |
| **OC-EXP** Operating company, market-expansion | Operating company entering an adjacent market or category | Buy fastest path to credible IP position in a new space |
| **NPE-LIC** NPE, licensing-focused | Licensing entity assembling a target list and willing-licensee program | Recurring royalty stream |
| **NPE-LIT** NPE, litigation-focused | Patent assertion entity ready to file | Settlement / damages from named targets |
| **DEF-AGG** Defensive aggregator (RPX, AST, others) | Pooled-fund buyer keeping patents out of NPE hands | Membership-funded patent pre-emption |
| **LIT-FIN** Litigation finance | Investors funding enforcement campaigns | ROI from a 1–4 year enforcement window |

A typical bundle will plausibly attract 2–3 archetypes. The listing should be drafted with one *primary* archetype in mind and a secondary in peripheral vision. Trying to write for all seven simultaneously produces vague copy.

### 4.2 What each archetype over-weights

| Archetype | Attribute groups they weight heaviest | Specific attributes that move them |
|---|---|---|
| **OC-DEF** | A (domain coverage), F (geo), E (term), H8/H10 (clean title) | A1, A2 spanning their product map; F2 trilateral; H8 clean title; H10 unencumbered; long E4 |
| **OC-OFF** | D (detectability), I1 (product-mapping), D3 (reads-on) | D1 ≥ 2; D3 ≥ 2 (specifically reads on named competitor); H1 ≥ 2; H9 EoU available |
| **OC-EXP** | A2 (secondary domains), G3 (cross-industry), G1 (convergence theme), C2 (breadth) | A2 broad; G3 ≥ 2; C2 ≥ 2; existing product references for credibility |
| **NPE-LIC** | D (detectability), I1 (product map), I2 (mature), E (term), H9 (EoU) | D1+D2 high; I1 high; E4 ≥ 5 years; H9 = Yes |
| **NPE-LIT** | D (highest detectability), H7 (battle-tested), F2 (trilateral), H9 (EoU) | D2 ≥ 3; H7 = Survived; H9 = Yes; F2 = Yes |
| **DEF-AGG** | H (quality across the board), C2 (narrow scope ok), E4 (long term), G3 (relevant to many members) | H1 ≥ 2; H2 low exposure; clean title; longer remaining term; broad applicability |
| **LIT-FIN** | E4 (short window OK), H9 (EoU), I1 (mapped), D2 (provable) | E4 1–4 years acceptable; H9 = Yes; mapped products; clean detectability |

### 4.3 Language register per archetype

| Archetype | Voice they expect | Words/phrases that work | Words/phrases that don't |
|---|---|---|---|
| **OC-DEF** | Strategic, integrative | "freedom to operate", "subsystem coverage", "design-around closure" | "litigation-ready", "assertion ammunition" |
| **OC-OFF** | Direct, named-target | "reads on identified products", "counter-assertion", "competitive overlap" | "passive licensing", "industry-wide" |
| **OC-EXP** | Forward-looking, category | "category entry", "adjacent-market re-read", "white-space coverage" | "narrow incumbent", "legacy enforcement" |
| **NPE-LIC** | Monetization-focused | "licensing-ready", "EoU charts available", "willing-licensee program" | "defensive shield", "long-term portfolio insurance" |
| **NPE-LIT** | Litigation-explicit | "validity-tested", "PTAB-survived", "mapped to commercial products" | "design-around", "FTO", "strategic horizon" |
| **DEF-AGG** | Risk-managed, broad-relevance | "broad applicability", "clean title", "low invalidity exposure" | "single-target reads", "narrow assertion play" |
| **LIT-FIN** | ROI-oriented, time-boxed | "remaining enforcement window", "mapped target products", "EoU ready" | "long horizon", "strategic positioning" |

### 4.4 What each archetype is scanning for as a deal-killer

This is the buyer's screen-for-rejection list. Listings that don't pre-empt these get filed under "skip".

| Archetype | Top deal-killer (one signal) | What the listing should pre-empt |
|---|---|---|
| **OC-DEF** | Encumbrances or unclear chain of title | State H8 = Clean and H10 = No encumbrances |
| **OC-OFF** | Doesn't actually read on a real product | State D3 ≥ 2 and signal mapped products |
| **OC-EXP** | Too narrow to support category positioning | State C2 ≥ 2 and surface A2 breadth |
| **NPE-LIC** | No claim charts, no mapped products | State H9 = Yes (claim charts available) |
| **NPE-LIT** | Validity-exposed | State H7 = Survived where applicable; emphasize H2 low exposure |
| **DEF-AGG** | High invalidity exposure or messy title | State H2 low + H8/H10 clean |
| **LIT-FIN** | Term too short OR no EoU | State E4 ≥ 1.5 years AND H9 = Yes |

### 4.5 Archetype selection logic

Pick the primary archetype using the bundle's dominant attributes:

```
IF bundle has high D2 + H9 + H7=Survived
    → NPE-LIT or LIT-FIN primary
ELSE IF bundle has high D3 (reads-on) + named-product mapping
    → OC-OFF or NPE-LIC primary
ELSE IF bundle spans broad A1/A2 with G3 high
    → OC-EXP primary
ELSE IF bundle has clean H8/H10 + broad H1 + long E4
    → DEF-AGG primary
ELSE IF bundle has integrated A4 subsystem coverage + clean title
    → OC-DEF primary
ELSE
    → OC-DEF default
```

The same bundle scored differently against archetypes will produce different listings, deliberately. This is the value-proposition layer's most useful flexibility.

---

## 5. Signal-strength taxonomy

Not all evidence in a listing carries equal weight. v3 introduces a four-tier taxonomy for what kinds of claims can appear in a listing, what level of substantiation each requires, and how to phrase them.

### 5.1 The four tiers

| Tier | What it is | Substantiation required | Phrasing form |
|---|---|---|---|
| **T1 — Verifiable patent facts** | Things on the patent itself: claim count, family size, jurisdiction, term, prosecution status | None — public record | Stated as plain fact: "7-asset portfolio", "10 years remaining term", "filed in US, EU, JP" |
| **T2 — Workbook-scored attributes** | Attributes scored on the framework with a defined rubric: claim breadth, detectability, design-around difficulty, etc. | Internal score + rubric-traceable | Stated as feature: "broad foundational claims", "infringement detectable from teardown" |
| **T3 — Diligence-grade assertions** | Claims requiring documentation: EoU available, validity-survived, clean chain of title, no encumbrances | Document exists and will be delivered under NDA | Stated with a verifiable hedge: "claim charts available", "validity-tested", "clean chain of title" |
| **T4 — Market context** | Industry trends, regulatory tailwinds, adoption signals from outside the patent | Cited external source, dated | Stated with a contextual frame: "diagnosed cases of X are increasing in the US" |

### 5.2 Rule: never mix tiers in a single sentence

A single sentence should not mix T2 (scored attributes) with T4 (market context) without a clear separator. Mixing them blurs whether the buyer is reading a fact about the patents or a fact about the market.

**Bad:** "These foundational patents address the fast-growing $50B cardiac care market."
- Mixes T2 ("foundational") with un-cited T4 (market size)

**Good:** "These broad foundational claims [T2] target conduction system pacing, which is becoming the standard of care for affected patients [T4, cited]."
- Clean separator; T2 and T4 are clearly delineated

### 5.3 Tier-by-tier phrasing library

**T1 examples (verifiable patent facts):**
- "7 US patents and 1 US application"
- "Family includes [N] members across [M] jurisdictions"
- "Filed in US, EU, JP, KR, CN"
- "Average remaining term of [X] years"

**T2 examples (workbook-scored, rubric-traceable):**
- "Broad foundational claims" (C2 = 3)
- "Infringement detectable from product teardown" (D2 ≥ 2)
- "Difficult to design around" (C4 ≥ 2)
- "Reads on identified commercial products" (D3 ≥ 2)

**T3 examples (diligence-grade, document-backed):**
- "Claim charts available" (H9 = Yes)
- "Validity-tested" (H7 = Survived)
- "Clean chain of title" (H8 = Clean)
- "Unencumbered" (H10 = None)
- "Live continuation provides claim-tailoring flexibility" (E3 = Yes)

**T4 examples (market context, cited):**
- "[Standard] adoption is accelerating across [industry]"
- "Diagnosed cases of [condition] are growing in the [region]"
- "[Regulation] takes effect in [year]"
- "[Technology] is becoming standard practice in [domain]"

### 5.4 What this taxonomy fixes

In v2, all phrasing was treated as equivalent — every sentence sat at the same level of substantiation. v3 makes the substantiation visible. This matters because:

1. Buyers' analysts triage by signal strength. A T3 claim ("EoU charts available") is worth more than a T2 claim ("highly detectable") because it implies a deliverable, not just a score.
2. T4 (market context) is the easiest place to lose credibility. Forcing every T4 claim through a citation discipline (Section 6) prevents broker-puffery.
3. When generating with AI (Section 19), the model needs to know which tier each phrase sits in to avoid fabricating T4 facts.

### 5.5 Tier coverage by bundle

A strong listing typically has: 1–2 T1 facts, 3–6 T2 attributes, 1–3 T3 signals, and 0–1 T4 statements. Listings that go heavy on T4 (more than one) start to read as marketing. Listings without any T3 lose buyer trust — there's no signal that supporting documents exist.

---

## 6. Market context — how to source it, how to use it

T4 (market context) is the highest-risk tier because it's the easiest to fabricate and the most credibility-destroying when wrong. v3 introduces a controlled approach.

### 6.1 The market context library

Maintain a separate sheet — call it `Market_Context_Library` — that records every T4 fact ever used in a listing, with:

| Column | Content |
|---|---|
| Fact ID | MCL-001, MCL-002, ... |
| Domain tag | Maps to A1 / G1 (e.g., "cardiac rhythm management", "Web3 / DePIN") |
| Statement | The exact sentence used |
| Source | URL, document title, page number |
| Source date | When the fact was first cited |
| Last verified | Date of most recent re-check |
| Used in listings | Listing IDs that reference this fact |

When drafting Block 4 of a Pattern A listing, you pull from MCL, not from memory. When MCL has nothing for the bundle's domain, *don't write Block 4*. This is the discipline that prevents broker-puffery.

### 6.2 What qualifies as a T4 fact

- Regulatory action with a date (FDA approval, EU directive effective date, FCC ruling)
- Standards body decision with a date (3GPP release date, IEEE 802 amendment)
- Major industry adoption signal with a citation (e.g., a Tier-1 OEM publicly committing to a technology)
- Publicly reported clinical guideline change (with citation to the guideline document)
- Government program with budget (e.g., IRA funding for X, EU green deal funding for Y)

### 6.3 What does NOT qualify as a T4 fact

- "Growing market" (without specific data)
- "$XB market" (unless sourced from a named, dated report)
- "Increasing demand" (without quantification)
- "Industry trend toward X" (without specific evidence)
- "Many players are looking at X" (rumor)

If you're tempted to use any of these, omit Block 4 entirely. The bundle is better served by tight T2/T3 content than by weak T4 content.

### 6.4 How T4 facts integrate into the listing

The Brugada listing's two-clause T4 model:
> "...conduction system pacing is fast becoming the standard of care. With diagnosed cases of Brugada syndrome increasing in the US, this represents a growing, underserved patient population."

Each clause is a T4 statement. Each should be backed by an MCL entry. If one of the two clauses can't be sourced, use only the other (still allowed). If neither can be sourced, omit Block 4 — and reconsider whether Pattern A is right for this bundle (Pattern A typically needs Block 4 to land its strategic positioning).

### 6.5 T4 facts as positioning, not selling

T4 is not the place to make the bundle sound bigger than it is. T4 is the place to tell the buyer *why now is the right time* to consider this domain at all. The bundle then earns its place within that "why now" via T2/T3.

---

# PART III — THE LISTING TEMPLATE

## 7. Structural variation across the corpus

A six-listing comparison (the v2 corpus, retained):

| Listing | Assets | Prose words | Block 1 buyer-profile triplet | Block 3 bullet count | Block 4 market hook | Block 5 buyer-value close | Primary archetype (v3) |
|---|---|---|---|---|---|---|---|
| Brugada Pacing | 7 | ~210 | Yes (explicit triplet) | 3 | **Yes** | Full prose, three-pronged | OC-EXP / OC-DEF |
| Data Wallet | 1 | ~180 | Yes (explicit triplet) | 3 + close-tag | No | Compressed one-liner | OC-EXP |
| Token Mining | 1 | ~210 | Yes (explicit triplet) | 3 + close-tag | No | Compressed one-liner | OC-EXP / NPE-LIC |
| Delta Power Converter | 6 | ~170 | Yes (explicit triplet) | 4 (incl. problem-bullet) | No | Absent | OC-DEF |
| Static Dissipation | 1 | ~180 | No (description only) | 3 | No | Absent | OC-EXP (niche) |
| Robotic Solar | 7 | ~120 | No (description only) | 4 | No | Absent | OC-DEF |

Patterns visible in the data:

- **Block 1 buyer-profile triplet** is the strongest distinguisher between premium-positioning and matter-of-fact listings.
- **Block 4 (market hook) is rare** — only Brugada uses it, and only because it has a clinical/regulatory T4 anchor.
- **Block 5 (buyer-value close) has three modes**: full prose, compressed one-liner, or absent.
- **Bullet count is 3 or 4**, with the 4th bullet typically a problem-statement, configuration extension, or compressed close.
- **Prose length range is 120–350 words.**
- **The primary archetype is identifiable in every case** and aligns with which attributes the listing surfaces first.

---

## 8. The block library — required vs conditional

### Required blocks (universal across all six listings)

| # | Block | Function |
|---|---|---|
| H | **Header** | Listing ID, name, broker, date, status, transaction types |
| 1 | **Opener** | Sets exclusivity ("pleased to exclusively present...") and asset count |
| 3 | **Feature block** | 3–4 capability bullets (the technical sell) |
| 6 | **CTA + boilerplate** | "More information available upon request..." plus broker contact |
| 7 | **Meta tags** | Industries, Technologies, Transactions |

### Conditional blocks (use when bundle profile supports)

| # | Block | Trigger condition |
|---|---|---|
| 1b | **Buyer-profile triplet** | When three distinct buyer profiles can be named credibly. Skip if narrow/niche with one buyer type. |
| 2 | **Technical core sentence** | When the bundle is composition-coherent. Skip when Block 3 carries the description. |
| 4 | **Market / timing hook** | Only when a T4 (cited market-context) fact exists in MCL for the bundle's domain. |
| 5 | **Buyer-value close** | Three modes: full prose (Pattern A), compressed one-liner (Pattern B), or omit. |

### Bullet variants (mix-and-match within Block 3)

| Variant | What it's for | Source attributes |
|---|---|---|
| **Capability bullet** | "What it does + buyer benefit" — the default | H1, C2, D2 |
| **Problem-statement bullet** | "Industry pain this solves" — when C4 / I4 are high | C4, I4 |
| **Mechanism bullet** | "How it works technically" — when audience is engineering-buyer | C1, A3, A4 |
| **Configuration bullet** | "Multiple options / variants supported" — when bundle has breadth | A2, E1 |
| **Compressed close tag** | The 4th bullet in Campbell-style listings — replaces Block 5 | Three buyer outcomes |

---

## 9. Four canonical listing patterns

### Pattern A — Strategic flagship (Brugada model)

**When to use.** Multi-asset bundle (4+ patents), Anchor-and-Halo or Provenance-Coherent composition, high H1 + strong I2, **AND** a T4 fact exists in MCL for the domain.
**Primary archetype:** typically OC-EXP, OC-DEF, or NPE-LIC.
**Block sequence:** H → 1 → 1b → 2 → 3 (3 capability bullets) → 4 → 5 (full prose) → 6 → 7
**Target length:** 250–350 words of prose.
**Voice:** Strategic, future-positioning. Bundle as a category-defining acquisition.

### Pattern B — Compressed strategic (Campbell model)

**When to use.** Single-asset listing with broad addressable buyer set (Web3, AI, platform tech, anything with multiple credible industry applications).
**Primary archetype:** typically OC-EXP, OC-OFF, or NPE-LIC.
**Block sequence:** H → 1 → 1b → 3 (3 capability bullets + compressed close tag as 4th item) → 6 → 7
**Target length:** 180–220 words of prose.
**Voice:** Strategic but compact.
**Distinguishing feature.** Patent number inline in Block 1, not on a separate headline line.

### Pattern C — Technical-spec (Delta / Robotic Solar model)

**When to use.** Multi-asset bundle where engineering specifics are the sell. Buyer is a domain operator who reads spec and recognizes value without strategic framing.
**Primary archetype:** typically OC-DEF or OC-OFF.
**Block sequence:** H → 1 (with or without buyer triplet) → 3 (3–4 capability bullets, often including a problem-statement bullet) → 6 → 7
**Target length:** 120–200 words of prose.
**Voice:** Engineering-descriptive. Spec carries the weight.
**Distinguishing feature.** Block 3 often closes with a problem-statement bullet.

### Pattern D — Single-asset narrow (Static Dissipation model)

**When to use.** Single-asset listing with narrow positioning (one industry, one tech tag). Often consumer products, niche industrial tech, or applied chemistry.
**Primary archetype:** typically OC-DEF (narrow product line) or OC-EXP (niche entry).
**Block sequence:** H → 1 (description-only opener) → 2 (sets technical scope) → 3 (3 capability bullets) → 6 → 7
**Target length:** 150–200 words of prose.
**Voice:** Descriptive, technical-precise. Sold on craftsmanship and specificity.

### Pattern selection at a glance

| Bundle profile | Pattern |
|---|---|
| 4+ assets, healthcare/medical, regulatory tailwind in MCL | **A — Strategic flagship** |
| 4+ assets, standards-driven (SEP, interop), MCL has standards-adoption fact | **A — Strategic flagship** |
| 1 asset, broad cross-industry positioning (Web3, AI, platform) | **B — Compressed strategic** |
| 1 asset, multiple distinct buyer profiles credibly nameable | **B — Compressed strategic** |
| Multi-asset, engineering-focused, problem-solving | **C — Technical-spec** |
| Multi-asset, full-feature system, no MCL anchor | **C — Technical-spec** |
| 1 asset, single industry, one specific application | **D — Single-asset narrow** |

Section 18 has the full decision tree.

---

## 10. Block-by-block construction guide

### Block H — Header

**Required across all patterns.**

```
[LISTING_ID] [PORTFOLIO_NAME] – [N] assets
Listed by: [BROKER_NAME] on [DATE]
AVAILABLE
[TRANSACTION_TYPES]
```

For multi-asset listings (Patterns A, C), add:
```
[PARENT_PROGRAM_NAME] ([PATENT_LIST])
```

For single-asset listings (Patterns B, D), patent number goes inline in Block 1.

### Block 1 — Opener

**Variant 1a — Exclusive-presentation opener** (Patterns A, B, C):
> "[Broker] is pleased to exclusively present the [Name] IP for sale on a private placement basis."

Single-asset listings: append patent number inline.
> "...present the [Name] IP (US12345678) for sale on a private basis."

**Variant 1b — Descriptive opener** (Pattern D, occasional C):
> "[N] US patents and [M] US applications related to [DESCRIPTION]."
or
> "[Broker] is pleased to present the [Name] IP for Sale on a private placement basis. This IP covers [CORE_DESCRIPTION]."

### Block 1b — Buyer-profile triplet (CONDITIONAL)

**Use when:** Three distinct buyer profiles can be named (typical for Patterns A and B).

**Format:**
> "This is a strategic [N]-patent asset for companies [active in / operating in / building] [PROFILE_1], [PROFILE_2], or [PROFILE_3]."

**Optional follow-up (Campbell pattern):**
> "This patent is highly relevant for companies [VERB] [SPECIFIC_USE_1], [SPECIFIC_USE_2], or [SPECIFIC_USE_3]."

**Buyer profile sourcing:**

| Profile slot | Source |
|---|---|
| Slot 1 — most-obvious | A1 → industry-level descriptor |
| Slot 2 — adjacent / subsystem | A4 (subsystem) or A2 (secondary domains) |
| Slot 3 — differentiated angle | Highest scorer among {G1, B3, C4, I3} |

**Archetype alignment:** the buyer triplet should be consistent with the primary archetype. An OC-OFF-targeted listing names competitor-overlap profiles; an OC-EXP-targeted listing names category-entry profiles.

### Block 2 — Technical core sentence (CONDITIONAL)

**Use when:** Multi-asset bundle needs a single-sentence framing; or single-asset narrow listing needs to establish technical scope.
**Skip when:** Single-asset broad listings (Pattern B).

**Format options:**
> "This portfolio covers [CORE_TECHNICAL_DESCRIPTION], with [KEY_DIFFERENTIATING_FEATURE]." *(Pattern A)*
> "This patent details [APPARATUS_AND_METHOD] to [OUTCOME]." *(Pattern C)*
> "The patented technology introduces [SPECIFIC_INNOVATION], enabling [SPECIFIC_OUTCOME]." *(Pattern D)*

Source: A1 + A4 + A5 → core; highest of C2/C4/I2 → differentiator.

### Block 3 — Feature bullets (REQUIRED — 3 to 4 bullets)

**Standard three-bullet selection (Patterns A, D, and sometimes C):**

| Bullet slot | Source signal | What it accomplishes |
|---|---|---|
| Bullet 1 | Highest H1 + highest D2 patent | "Detectability + strength" |
| Bullet 2 | Highest C2 (pioneer) or highest C4 (whitespace) patent | "Defensibility" |
| Bullet 3 | Newest patent (highest E4) or live continuation (E3=Yes) | "Future optionality" |

**Four-bullet variant (Patterns B, C):**

| 4th bullet type | When to use | Source |
|---|---|---|
| **Problem-statement** | Bundle solves a known engineering pain | High C4 + high I4 |
| **Configuration breadth** | Bundle offers many implementation variants | High A2 + high E1 |
| **Compressed close-tag** | Pattern B — replaces full Block 5 | "A strategic asset for [3 uses]" |

**Format:**
```
[CAPABILITY_NAME] — [PLAIN-ENGLISH MECHANISM], [BUYER OUTCOME].
```

~25–35 words per bullet.

### Block 4 — Market / timing hook (CONDITIONAL — RARE)

**Use only when:** A T4-qualified fact exists in MCL for the bundle's domain.

**Two-clause pattern:**
> "This portfolio directly aligns with [TREND]: [INDUSTRY_DIRECTION]. With [MARKET_DEMAND_SIGNAL], this represents a [MARKET_DESCRIPTOR]."

If only one clause has MCL support, use one. If neither does, omit Block 4.

### Block 5 — Buyer-value close (CONDITIONAL — THREE MODES)

**Mode 5A — Full prose** (Pattern A only):
> "Acquiring this IP positions your company [POSITION], with protected, [CREDIBILITY] technology that can accelerate [PRODUCT], strengthen your [DEFENSIVE], and open [REVENUE]."

Three outcomes, in order: product → defensive → revenue. Verbs: *accelerate / strengthen / open*.

**Mode 5B — Compressed close-tag** (Pattern B, as last bullet of Block 3):
> "A strategic asset for [USE_1], [USE_2], or [USE_3] in the [DOMAIN_1], [DOMAIN_2], and [DOMAIN_3] sectors."

**Mode 5C — Omit** (Patterns C, D): No buyer-value close.

### Block 6 — Call-to-action

Three lines, always:
```
More information available upon request.
Package data provided by [DATA_SOURCE].
[BROKER_NAME]: Contact Us
```

Pattern C listings often add a "Documents" sub-block (Asset List - SPIF PDF) before contact.

### Block 7 — Meta tags

| Field | Source | Tag count |
|---|---|---|
| Industries | Derived from A1, A2, G3 | 1–5 |
| Technologies | Derived from A1, A3, A4 | 1–4 |
| Transactions | "LICENCE \| SALE" or "SALE" only | 1–2 |

**Tag count = positioning ambition, not asset count.** Narrow specialist = 1–2 industries. Broad cross-industry = 4–5 industries.

---

## 11. Attribute-to-copy mapping

(Stable across v1, v2, v3 — this section is the lookup layer.)

### Group A — Tech/Market Mapping

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| A1 — Primary domain | populated | "covers [DOMAIN_NAME]" | T1 |
| A2 — Secondary domains | ≥2 secondary tags | "with applicability across [DOMAINS]" | T1/T2 |
| A3 — Stack layer | "Hardware" | "implementation-grade hardware coverage" | T2 |
| A3 — Stack layer | "App/Cloud" | "software-deployable across product lines" | T2 |
| A4 — Subsystem | populated | "spans [SUBSYSTEM] design" | T2 |
| A5 — Use-case | populated | "addresses the problem of [USE_CASE]" | T2 |

### Group B — Standards / Interop

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| B1 — SEP potential | 3 | "essential to [STANDARD]" | T2/T3 |
| B1 — SEP potential | 2 | "with strong standard-essentiality potential" | T2 |
| B2 — Mapped standard | populated | "directly mapped to [STANDARD]" | T2/T3 |
| B3 — Interface role | 3 | "covers a critical interoperability chokepoint" | T2 |

### Group C — Claim Structure

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| C1 — Claim type | "Apparatus" | "device-level coverage" | T1 |
| C1 — Claim type | "Method" | "process-level coverage, implementation-agnostic" | T1/T2 |
| C2 — Claim breadth | 3 | "pioneer-class broad claims" | T2 |
| C2 — Claim breadth | 2 | "broad foundational claims" | T2 |
| C2 — Claim breadth | ≤1 | "tightly drafted, hard to invalidate" | T2 |
| C4 — Design-around difficulty | 3 | "no commercially viable workaround" | T2 |
| C4 — Design-around difficulty | 2 | "difficult to design around" | T2 |

### Group D — Detectability

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| D1 — External detectability | 3 | "infringement detectable from product spec alone" | T2 |
| D2 — Teardown detectability | 3 | "infringement provable from teardown" | T2 |
| D3 — Reads on products | 3 | "reads on identified commercial products" | T2/T3 |

### Group E — Lifecycle / Family

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| E1 — Family size | ≥3 | "supported by a [N]-member patent family" | T1 |
| E2 — Prosecution status | "Pending" | "with pending applications for claim tailoring" | T1 |
| E3 — Live continuation | "Yes" | "with live continuation flexibility" | T1/T3 |
| E4 — Remaining term | >12 years | "long remaining term — strategic horizon" | T1 |
| E4 — Remaining term | 5–12 years | "substantial enforcement runway" | T1 |
| E4 — Remaining term | <5 years | "immediate licensing window" | T1 |

### Group F — Geographic

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| F2 — Trilateral | "Yes" | "US, EU, and Asia coverage" | T1 |
| F1 — Jurisdictions | ≥5 | "filed in [N] jurisdictions" | T1 |

### Group G — Market / Trend

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| G1 — Convergence theme | populated | "aligned with the [THEME] convergence" | T2/T4 |
| G2 — Generation | "Next-gen" | "next-generation positioning" | T2 |
| G3 — Cross-industry | 3 | "applicable across [N]+ industries" | T2 |

### Group H — Quality / Vulnerability

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| H1 — Claim strength | 3 | "high claim strength" | T2 |
| H5 — Forward citations | high | "highly cited foundational asset" | T1 |
| H7 — Litigation history | "Survived" | "validity-tested" | T3 |
| H8 — Chain of title | "Clean" | "clean chain of title" | T3 |
| H9 — EoU available | "Yes" | "claim charts available" | T3 |
| H10 — Encumbrances | "None" | "unencumbered" | T3 |

### Group I — Market signals

| Attribute | Score signal | Default copy phrase | Tier |
|---|---|---|---|
| I1 — Product-mapping confidence | High | "mapped to identified products" | T2/T3 |
| I2 — Implementation maturity | "Productized" | "clinically/commercially validated" | T2 |
| I3 — Adjacent re-read | 3 | "with re-read potential into adjacent markets" | T2 |
| I4 — Workaround complexity | 3 | "no economic workaround" | T2 |

---

## 12. Bundle-type narrative variants

| Bundle type | Preferred pattern | Primary archetype | Block 1 buyer hook | Block 5 mode |
|---|---|---|---|---|
| 1 — Tech Domain | C or D | OC-DEF | "active in [domain]" | Omit (5C) |
| 2 — SEP | A | NPE-LIC | "implementers of [standard]" | Full prose (5A) |
| 3 — Product Architecture | A or C | OC-DEF | "building [product]" | Full or omit |
| 12 — Detectability | A | NPE-LIT or LIT-FIN | "litigation-ready buyers" | Full prose (5A) |
| 16 — Foundational + Improvement | A | OC-DEF | "established players" | Full prose (5A) |
| 19 — Defensive / Counter-Assertion | A | OC-OFF | "facing assertion risk" | Full prose (5A) |
| 22 — Anchor-and-Halo | A | OC-DEF or OC-OFF | "strategic acquirers" | Full prose (5A) |
| 23 — Picket-Fence | A or C | OC-DEF | "operators around [standard]" | Full or omit |
| 25 — Continuation-Live | B | OC-EXP | "shaping claims to a product" | Compressed (5B) |
| 26 — EoU-Backed | A | NPE-LIC | "monetization-ready buyers" | Full prose (5A) |
| 27 — Battle-Tested | A | NPE-LIT or LIT-FIN | "litigation buyers needing certainty" | Full prose (5A) |
| 29 — High-Citation | A | DEF-AGG or OC-EXP | "category-defining acquirers" | Full prose (5A) |
| 32 — Pre-Expiry | C | LIT-FIN | "litigation-finance buyers" | Omit (5C) |
| 33 — Provenance-Coherent | A or C | DEF-AGG or OC-DEF | "buyers digesting at scale" | Pattern-dependent |

---

# PART IV — CRAFT

## 13. Language register and tone calibration

The IAM listing voice is institutional, third-person, broker-as-narrator. Within that voice, register flexes by archetype (Section 4.3). v3 codifies the register dimensions explicitly.

### 13.1 The register dial

Five dimensions, each with a low / mid / high setting:

| Dimension | Low | Mid | High |
|---|---|---|---|
| **Formality** | Casual phrasing | Standard broker register | Banker-formal ("private placement basis") |
| **Specificity** | Generic domain terms | Named subsystems / methods | Specific numeric claims, named products |
| **Strategic framing** | Pure description | Light positioning ("strategic asset") | Heavy positioning ("category-defining") |
| **Time orientation** | Present-only | Mix of present and forward | Future-leaning ("ahead of the curve") |
| **Buyer-direct address** | Third-person only | Light ("for companies that...") | Direct ("acquiring this IP positions your company...") |

### 13.2 Register settings by pattern and archetype

| Pattern | Archetype | Formality | Specificity | Strategic | Time | Direct |
|---|---|---|---|---|---|---|
| A | OC-EXP | High | Mid | High | High | High |
| A | OC-DEF | High | High | Mid | Mid | High |
| A | NPE-LIC | High | High | Mid | Mid | Mid |
| B | OC-EXP | Mid-High | Mid | High | High | Mid |
| C | OC-DEF | Mid | High | Low | Present | Low |
| C | OC-OFF | Mid-High | High | Mid | Present | Mid |
| D | OC-EXP (niche) | Mid | High | Low | Present | Low |

The two Campbell listings (Pattern B for the same patent) demonstrate the register dial: the Data Wallet listing tilts toward OC-EXP (privacy / identity); the Token Mining listing tilts toward OC-OFF / NPE-LIC (monetization). Specific phrase differences: "consent-driven data ecosystems" (OC-EXP register) vs "tokenized incentive ecosystems" (NPE-LIC register).

### 13.3 Words and phrases by register tier

**High formality / banker-formal:**
- "pleased to exclusively present"
- "private placement basis"
- "strategic seven-patent asset"
- "directly aligns with"
- "positions your company"

**Mid formality / broker-standard:**
- "pleased to present"
- "highly relevant for"
- "the IP includes"
- "the patent details"
- "the combined patents offer"

**Low formality / descriptive:**
- "this IP covers"
- "related to"
- "designed to"
- "addresses"

### 13.4 Phrase pairs that flip register

| Same fact, formal version | Same fact, technical version |
|---|---|
| "Validity-tested in inter partes review" | "Survived PTAB IPR" |
| "Claim charts available under NDA" | "EoU available" |
| "Long enforcement horizon" | "10+ years remaining term" |
| "Clear strategic acquisition opportunity" | "OC-DEF target acquisition" |
| "Implementation-grade hardware coverage" | "Apparatus claims, Hardware stack layer" |

The formal version goes in the listing. The technical version goes in the CIM. The framework outputs the formal version by default; if the buyer profile (Pattern C, OC-OFF) calls for technical register, swap.

---

## 14. Style rules

These hold across all patterns. Apply strictly.

1. **Active voice, third-person, broker-as-narrator.**
2. **Patent numbers in one location only.** Multi-asset → headline line. Single-asset → inline in Block 1.
3. **Specific over generic.** Always.
4. **No adjectives without substance.** Banned: innovative, cutting-edge, revolutionary, best-in-class, paradigm-shifting, game-changing, world-leading, breakthrough, novel (unless from claim language).
5. **Three is the magic number.** Buyer profiles, buyer-value outcomes, sectors in compressed close. Bullets can be 3 or 4.
6. **No pricing, no valuation, no comps.**
7. **One T4 hook maximum.** When Block 4 is used, it's 1–2 sentences and each statement is MCL-backed.
8. **Tier discipline.** Never mix T2 (scored) with T4 (market) in a single sentence without a clear separator.
9. **End on capability, not claim language.**
10. **No emoji, no exclamation marks, no bold in prose.**
11. **Em dashes for in-bullet definitions only.**
12. **Pattern-match opener language to the broker's signature.**
13. **Archetype consistency.** Once you've picked the primary archetype, every block aligns with its register and emphasis. Don't drift.
14. **T3 signals earn their words.** "Claim charts available" deserves to be a sentence on its own. Don't bury it.
15. **No filler clauses.** Cut "designed to", "intended to", "aims to" — replace with active verbs.

---

## 15. Failure modes to avoid

| Failure mode | What it looks like | Why it fails |
|---|---|---|
| **Wrong pattern** | Full prose Block 5 on a single-asset narrow listing | Reads as overreach; buyer trust drops |
| **Wrong archetype** | OC-OFF register on a DEF-AGG bundle | Talks past the buyer; gets skipped |
| **Patent-by-patent summary** | "US10335600 covers X. US10493284 covers Y..." | Bundle should be a single proposition |
| **Vague buyer profile** | "useful for technology companies" | Routes to nobody |
| **Claim-language dump** | Quoting independent claims verbatim | Reads as legal text |
| **Unsupported T4** | "$50B market growing at 30% CAGR" without MCL entry | Buyer's analyst flags as puffery |
| **Adjective inflation** | "Revolutionary breakthrough innovative" | Burns trust |
| **Tier mixing** | T2 scored attribute mixed with un-cited T4 in one sentence | Blurs what's a patent fact vs market claim |
| **Hidden weakness** | Omits short term or invalidity exposure | Found in diligence, deal dies |
| **Too long for pattern** | Pattern C running 350 words | Engineering buyer wants spec density |
| **No timing hook when MCL has one** | Healthcare listing without Block 4 when MCL has a clinical fact | Loses the easy strategic anchor |
| **Forced timing hook without MCL** | Generic "growing market" filler in Block 4 | Weakens overall credibility |
| **Wrong primary attribute featured** | Lead bullet is a low-H1 patent | Strongest patent must anchor |
| **Mixing transaction modes in prose** | "for license, sale, or strategic partnership" | Confuses positioning; meta-tag handles this |
| **Generic close-tag triplet** | "great for product, defense, and revenue" | Triplet must name specific sectors |
| **Missing T3 signals** | Listing with no claim-charts / no clean-title mention when both exist | Throws away easy buyer-trust wins |
| **Buried T3 signals** | "Among other features, claim charts are available" | T3 deserves a sentence of its own |

---

# PART V — REFERENCE

## 16. Worked examples — all six listings, deconstructed

(Stable from v2; reproduced here with archetype tags from v3.)

### Example 1 — Brugada Pacing System (Pattern A — Strategic flagship; Primary archetype: OC-EXP / OC-DEF)

| Block | Exemplar text | Attribute(s) sourced | Tier |
|---|---|---|---|
| H | "ROI-26-0256 Brugada Syndrome Pacing System – 7 assets" | Listing ID, count | T1 |
| Headline | "NewStim Brugada Syndrome Pacing System (US10335600...)" | Parent program + portfolio enum | T1 |
| 1 + 1b | "...present the NewStim Brugada Syndrome Pacing System IP Portfolio for sale on a private placement basis. This is a strategic seven-patent asset for companies active in cardiac rhythm management, implantable devices, or conduction system pacing." | A1 (cardiac), A4 (implantable devices), G1 (conduction system pacing) | T1+T2 |
| 2 | "This portfolio covers a clinically validated method for detecting and treating Brugada syndrome through targeted endocardial stimulation at the para-Hisian region..." | A5, C1, I2, C4 | T2 |
| 3.1 | "Real-time Brugada detection and therapy delivery — diagnostic module..." | D2 + I2 | T2 |
| 3.2 | "Conduction system pacing via para-Hisian placement..." | C2 + C4 | T2 |
| 3.3 | "Multimodal pacing modes — the portfolio's latest patent..." | E4 + E3 + I3 | T2 |
| 4 | "...conduction system pacing is fast becoming the standard of care. With diagnosed cases of Brugada syndrome increasing in the US..." | G1 + G2 + MCL entry | T4 |
| 5 | "Acquiring this IP positions your company ahead of the curve... accelerate product development, strengthen your defensive IP position, and open new revenue streams..." | C2+I2 → D3+H1 → D1+H9 | T2 |
| 6, 7 | Standard | A1, A3, A4 → tags | T1 |

### Example 2 — Data Wallet (Pattern B — Compressed strategic; Primary archetype: OC-EXP)

Same archetype/tier deconstruction as v2 — see Section 10 of v2 (preserved). Key insight: Block 5 compressed close ("strategic asset for product expansion, portfolio defense, or licensing") is the OC-EXP outcomes triplet.

### Example 3 — Token Mining (Pattern B; Primary archetype: NPE-LIC + OC-EXP hybrid)

Same patent as Example 2, **different archetype primary**. Buyer triplet aims at DePIN/AI-data licensing buyers. Block 5 compressed close uses "market leadership, licensing, or defensive positioning" — note "licensing" is more explicit than Example 2's "portfolio defense", which is the NPE-LIC tilt.

### Example 4 — Delta Power Converter (Pattern C — Technical-spec; Primary archetype: OC-DEF)

All four bullets are mechanism bullets. Engineering register. No Block 5. The 4th bullet is the problem-statement closer.

### Example 5 — Static Dissipation (Pattern D — Single-asset narrow; Primary archetype: OC-EXP niche)

No buyer triplet. Block 2 carries the framing. All three bullets are configuration bullets. Numeric specificity ("between 0.0001% and 10.0%") is the credibility signal.

### Example 6 — Robotic Solar (Pattern C minimal; Primary archetype: OC-DEF)

The floor of what works. Descriptive opener, no exclusive-presentation language, 4 mechanism bullets, no Block 5. ~120 words.

---

## 17. Authoring workflow with quality gates

Eight steps, each with a quality gate.

### Step 1 — Lock the bundle
- Open `Patent_Bundling_Template_v4.xlsx`.
- Confirm bundle on Bundle Assignment.
- Read Bundle Quality Scorecard row.

**Gate 1:** Does the Scorecard show STRONG or MODERATE? If WEAK across the board, consider whether the bundle should be sold at all. Stop and reconsider before drafting marketing copy.

### Step 2 — Select the primary archetype
- Apply the Section 4.5 selection logic.
- Cross-check by reading the matching archetype's deal-killer (Section 4.4) — does the bundle pre-empt it?

**Gate 2:** Is there a clear primary archetype? If three or more archetypes seem equally plausible, the bundle is unfocused — sub-bundle it or reconsider composition before drafting.

### Step 3 — Select the pattern
- Use Section 18's decision tree.
- Confirm by reading the matching exemplar.

**Gate 3:** Does the bundle have an MCL entry for its domain? If considering Pattern A, an MCL fact is required. If none, drop to Pattern C.

### Step 4 — Identify the dominant bundle type
- Look at fired routing rules.
- Pick the most narratively dominant bundle type.
- Confirm pattern alignment via Section 12.

### Step 5 — Draft Block 1 (and 1b if pattern requires)
- Variant 1a or 1b based on pattern.
- Three buyer profiles using Section 10's sourcing rules and Section 4.3's archetype register.

**Gate 5:** Read Block 1 aloud. Does it pass the "five-second test"? A buyer-side analyst skimming should know within five seconds: what domain, how many assets, who's it for.

### Step 6 — Draft Block 2 if pattern requires
- Skip for Pattern B.
- Format per pattern.

### Step 7 — Pick and draft the bullets
- 3 bullets for Patterns A and D; 3–4 for B and C.
- Use standard capability-bullet selection for first three.
- 4th bullet from problem-statement / configuration / close-tag based on bundle profile.

**Gate 7:** Each bullet must trace to a specific patent or set of patents. If you can't say which patent backs a bullet, the bullet isn't earning its place.

### Step 8 — Decide on Block 4
- Skip unless MCL has an entry.
- If using, cite the MCL ID in a comment for traceability.

### Step 9 — Decide on Block 5 mode
- Pattern A → Full prose (5A).
- Pattern B → Compressed close-tag (5B).
- Patterns C and D → Omit (5C).

### Step 10 — Add Blocks 6 and 7
- Boilerplate close.
- Tag count = positioning ambition.

### Step 11 — Run the failure-mode checklist (Section 15)

**Gate 11:** Zero items from the failure-mode list present.

### Step 12 — Apply tier discipline (Section 5.2)
- For each sentence in the listing, label which tier it sits in.
- Verify no tier mixing in a single sentence.
- Verify ≥1 T3 signal exists (claim charts, validity-tested, clean title, or continuation).

**Gate 12:** Listing has 1–2 T1, 3–6 T2, 1–3 T3, 0–1 T4.

### Step 13 — Tighten to pattern target length
- Pattern A: 250–350 words.
- Pattern B: 180–220 words.
- Pattern C: 120–200 words.
- Pattern D: 150–200 words.

### Step 14 — Final review against matching exemplar
- Read the exemplar side-by-side.
- Tone match? Density? Specificity?

**Gate 14:** If the listing reads softer than the exemplar, it's likely under-substantiated. If harder, the register is off.

### Step 15 — (Optional) Build Rung 3 deck and Rung 4 exec summary
- Use the listing as the seed.
- Per-bullet expansion for the deck.
- Add CIM exec summary skeleton (Section 3.4 structure).

---

## 18. Pattern selection decision tree

```
START
  │
  ├── Step A: How many assets in the bundle?
  │     │
  │     ├── 1 asset
  │     │     │
  │     │     ├── Can three credible buyer profiles be named?
  │     │     │     │
  │     │     │     ├── YES → Pattern B candidate (Compressed strategic)
  │     │     │     │
  │     │     │     └── NO → Pattern D (Single-asset narrow)
  │     │     │
  │     │     └── (default) Pattern B
  │     │
  │     └── 2+ assets → continue to Step B
  │
  ├── Step B: Is there an MCL entry for the bundle's domain?
  │     │
  │     ├── YES → continue to Step C (Pattern A possible)
  │     │
  │     └── NO → Pattern C (Technical-spec)
  │
  ├── Step C: Does the bundle have one of:
  │     - Anchor-and-Halo composition
  │     - Battle-Tested / EoU-Backed quality
  │     - Strong I2 (productized) + H1 ≥ 3
  │     ?
  │     │
  │     ├── YES → Pattern A (Strategic flagship)
  │     │
  │     └── NO → Pattern C (Technical-spec)
  │
  └── END
```

**Pattern-archetype cross-check.** After picking a pattern, verify it aligns with the primary archetype chosen in Step 2 of the workflow:

| Pattern | Compatible archetypes | Incompatible archetypes |
|---|---|---|
| A | OC-EXP, OC-DEF, NPE-LIC, DEF-AGG | NPE-LIT (too strategic for litigation-buyer), LIT-FIN |
| B | OC-EXP, OC-OFF, NPE-LIC | DEF-AGG (too compressed) |
| C | OC-DEF, OC-OFF, NPE-LIT, LIT-FIN | OC-EXP (too descriptive) |
| D | OC-EXP (niche), OC-DEF (narrow) | NPE-LIT, NPE-LIC, LIT-FIN, DEF-AGG |

If pattern and archetype are incompatible, revisit one or the other.

---

## 19. AI prompt for first-draft generation

Use this prompt to produce a first draft of a sales-package value proposition, given a bundle row from the Bundle Quality Scorecard, the attribute scores of its constituent patents, a primary archetype, and optional market context.

```
You are a patent broker's copywriter. Produce a sales-package value
proposition in the IAM Market listing style, following the patterns
defined in Value_Proposition_Framework_v3.md.

INPUTS (provided as JSON):
{
  "listing_id": "ROI-26-XXXX",
  "broker_name": "...",
  "portfolio_name": "...",
  "parent_program_name": "...",
  "patent_numbers": ["...", "..."],
  "transaction_types": ["LICENCE", "SALE"],
  "dominant_bundle_type": "...",
  "primary_archetype": "OC-DEF | OC-OFF | OC-EXP | NPE-LIC | NPE-LIT | DEF-AGG | LIT-FIN",
  "secondary_archetype": "...",
  "scorecard_row": {
    "weakest_H1": ..., "invalidity_exposure_pct": ...,
    "eou_ready_pct": ..., "survived_pct": ...,
    "cont_optionality_pct": ..., "strength_flag": "STRONG | MODERATE | WEAK"
  },
  "patent_attributes": [
    { "patent_id": "...", "A1": "...", "A2": [...], "A3": "...",
      "A4": "...", "A5": "...", "B1": ..., "B2": "...", "B3": ...,
      "C1": "...", "C2": ..., "C4": ..., "D1": ..., "D2": ...,
      "D3": ..., "E1": ..., "E2": "...", "E3": "...", "E4": ...,
      "F1": [...], "F2": "...", "G1": "...", "G2": "...",
      "G3": ..., "H1": ..., "H2": ..., "H5": ..., "H7": "...",
      "H8": "...", "H9": "...", "H10": "...",
      "I1": "...", "I2": "...", "I3": ..., "I4": ... }
  ],
  "market_context": [
    {
      "mcl_id": "MCL-XXX",
      "statement": "...",
      "source": "...",
      "date": "..."
    }
  ]  // may be empty array
}

STEP 1 — VERIFY ARCHETYPE-PATTERN COMPATIBILITY.

  Use Section 18 compatibility table. If incompatible, return:
    {"error": "archetype X incompatible with pattern Y", ...}
  and stop.

STEP 2 — SELECT PATTERN via Section 18 decision tree:
    - Multi-asset + MCL entry exists + (Anchor-and-Halo or
      Battle-Tested or H1≥3 with I2='Productized')
        → Pattern A
    - Multi-asset, no MCL or no strong composition
        → Pattern C
    - Single-asset, 3 credible buyer profiles namable
        → Pattern B
    - Single-asset, narrow
        → Pattern D

  Output the selected pattern as the first line:
    PATTERN: [A | B | C | D] — [pattern name]
    ARCHETYPE: [primary archetype code]

STEP 3 — APPLY REGISTER from Section 13.2 based on
  pattern × primary_archetype.

STEP 4 — GENERATE THE LISTING.

  Required blocks: Header, Opener, Bullets (3-4), CTA, Meta tags.

  Conditional blocks per pattern:
    Pattern A: + 1b triplet, + Block 2, + Block 4 (if MCL non-empty),
               + Full prose Block 5
    Pattern B: + 1b triplet (often double), + Block 3 close-tag
               as 4th bullet; patent number INLINE in Block 1
    Pattern C: 1b triplet optional, bullets mechanism-focused,
               often 4th = problem-statement bullet; no Block 5
    Pattern D: NO 1b triplet, Block 2 required, configuration
               bullets, no Block 4, no Block 5

STEP 5 — TIER DISCIPLINE.

  Tag each sentence internally with its tier (T1-T4).
  Ensure:
    - ≥1 T3 signal somewhere in the listing
    - 0-1 T4 statements, each MCL-cited
    - No mixing of T2 and T4 in a single sentence

STEP 6 — APPLY ATTRIBUTE-TO-COPY MAPPING (Section 11).

  For each attribute with the listed score signal, use the
  corresponding copy phrase. Adapt grammar; do not invent claims
  beyond attributes.

STEP 7 — RUN FAILURE-MODE CHECKLIST (Section 15).

  Eliminate any failure-mode patterns. Verify register matches
  Section 13.2 settings for the pattern × archetype combination.

STEP 8 — LENGTH TARGET.

  Pattern A: 250–350 words.
  Pattern B: 180–220 words.
  Pattern C: 120–200 words.
  Pattern D: 150–200 words.

STYLE RULES (strict):
  - Active voice, third-person.
  - Banned adjectives: innovative, cutting-edge, revolutionary,
    best-in-class, paradigm-shifting, game-changing, world-leading,
    breakthrough.
  - No pricing, no valuation.
  - Patent numbers: headline (A, C) or inline Block 1 (B, D).
  - Em dashes inside bullets only.
  - T4 statements only if MCL entry provided.

WHERE INPUTS MISSING:
  - Null attribute → skip its copy phrase; do not invent.
  - Empty market_context AND Pattern A would otherwise apply
    → drop to Pattern C and re-run.
  - Archetype-pattern incompatible → return error, do not proceed.

OUTPUT FORMAT:

  Line 1: PATTERN: [pattern letter and name]
  Line 2: ARCHETYPE: [primary archetype code]
  Then blank line.
  Then the listing markdown (Header through Meta tags).
  Then a TIER REPORT section listing each sentence and its tier
  for review purposes.

  No other commentary.
```

---

## 20. Glossary

| Term | Definition |
|---|---|
| **Archetype** | One of seven buyer types: OC-DEF, OC-OFF, OC-EXP, NPE-LIC, NPE-LIT, DEF-AGG, LIT-FIN. Each over-weights different attributes and expects a different language register. |
| **Block library** | The set of nine blocks (H, 1, 1b, 2, 3, 4, 5, 6, 7) from which a listing is composed. Some required, some conditional. |
| **CIM** | Confidential Information Memorandum. Rung 4 of the marketing material hierarchy. Released under NDA. 20–40 pages. |
| **DEF-AGG** | Defensive aggregator (RPX, AST). Buyer archetype: pools member funds to keep patents out of NPE hands. |
| **EoU** | Evidence of Use. Claim chart mapping patent claims to specific product features. A T3 signal when available. |
| **LIT-FIN** | Litigation finance. Buyer archetype: funds enforcement campaigns in exchange for share of damages. |
| **MCL** | Market Context Library. The controlled repository of T4-qualified facts for use in Block 4. |
| **NPE-LIC** | Non-practicing entity, licensing-focused. Buyer archetype: assembles licensing programs. |
| **NPE-LIT** | Non-practicing entity, litigation-focused. Buyer archetype: assertion entity ready to litigate. |
| **OC-DEF** | Operating company, defensive. Buyer archetype: established product company building FTO. |
| **OC-EXP** | Operating company, market-expansion. Buyer archetype: entering an adjacent market. |
| **OC-OFF** | Operating company, offensive. Buyer archetype: counter-assertion arsenal. |
| **Pattern A/B/C/D** | The four canonical listing patterns (Strategic flagship, Compressed strategic, Technical-spec, Single-asset narrow). |
| **Rung** | One step in the marketing material hierarchy (Teaser → Listing → Deck → CIM → Diligence package). |
| **SPIF** | Standard Patent Information Form. A spreadsheet listing assets in a portfolio, commonly attached to multi-asset listings. |
| **T1 / T2 / T3 / T4** | The four substantiation tiers: verifiable patent facts / workbook-scored attributes / diligence-grade assertions / cited market context. |
| **Tier discipline** | The rule that prevents mixing T2 (scored) and T4 (market) in a single sentence without a clear separator. |

---

## Appendix A — Summary of v1 → v2 → v3 changes

| Area | v1 | v2 | v3 |
|---|---|---|---|
| Block count | 7 fixed | 5 required + 4 conditional | Same as v2 |
| Pattern recognition | One template | Four canonical patterns | Same as v2 + archetype overlay |
| Buyer modeling | Implicit | Implicit + buyer triplet in Block 1b | **Seven explicit archetypes** with attribute weights, registers, and deal-killers |
| Market context | Free-form, tagged `[MARKET CONTEXT]` | Same | **Controlled via MCL library** with citation discipline |
| Signal substantiation | Implicit | Implicit | **Four-tier taxonomy** (T1 verifiable / T2 scored / T3 diligence / T4 market) with tier-mixing rule |
| Marketing-material hierarchy | Listing only | Listing only | **5-rung hierarchy** (Teaser → Listing → Deck → CIM → Diligence) with framework supporting Rungs 1, 2, 3, and CIM exec summary |
| Language register | Single voice | Single voice | **Register dial** with five dimensions × pattern × archetype settings |
| Workflow | 10 steps | 11 steps | **15 steps with explicit quality gates** at steps 1, 2, 3, 5, 7, 11, 12, 14 |
| Failure modes | 10 modes | 13 modes | **17 modes** including tier mixing, missing T3, buried T3, archetype mismatch |
| AI prompt | Pattern selection + listing | Pattern selection + listing | **Archetype compatibility + tier discipline + tier report** |
| Exemplar corpus | 1 (Brugada) | 6 (DynaIP / ROI 2026) | Same 6, with archetype tagging |
| Glossary | Absent | Absent | **20-term glossary** |
| Research base | One exemplar | Six exemplars | Six exemplars + broker market reports + academic buyer-behavior literature + industry guidance on EoU/CIMs |

---

## Appendix B — When to update this framework

Trigger conditions for v4 or revision:

1. **New patterns observed.** If more than two listings in the corpus follow a structure that doesn't fit Patterns A–D, define a new pattern.
2. **Archetype shift in the market.** Annual broker reports (Richardson Oliver Insights, IAM) show buyer-share shifts year over year. If a new archetype emerges or an existing one materially changes profile, update Section 4.
3. **New T3 signal types.** If a new diligence-grade artifact becomes standard (e.g., AI-prepared claim charts with novel verification), add to the T3 phrasing library.
4. **MCL library growth.** Periodically review MCL entries — facts go stale. Refresh or retire facts older than 18 months.
5. **Failure modes encountered.** Every listing that fails to attract interest in 90 days should be retrospectively reviewed against this framework. Patterns of failure not covered in Section 15 trigger new entries.
6. **Workbook attribute changes.** Any change to the 42 attributes in `Patent_Bundling_Template_v4.xlsx` requires a corresponding update to Section 11.

---

*Companion to `Patent_Bundling_Template_v4.xlsx`, `DOCUMENTATION.md`, `Attribute_Derivation_Procedure.docx`, and `AI_Prompts_for_Attribute_Scoring.md`. Update this file when patterns, archetypes, tiers, or block library evolve.*
