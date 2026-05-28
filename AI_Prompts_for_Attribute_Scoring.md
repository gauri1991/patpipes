# AI Prompts for Patent Attribute Scoring

> Companion to `Patent_Bundling_Template_v4.xlsx`. Prompts for scoring the 20 attributes that AI handles reliably (plus B2 with verification). Skip H6 — that's just counting; use the spreadsheet or PatentsView for it.

---

## Table of contents

1. [How to use this file](#how-to-use-this-file)
2. [Which attributes are covered](#which-attributes-are-covered)
3. [The common input bundle](#the-common-input-bundle)
4. [Section 1 — Grouped prompts (Option B)](#section-1--grouped-prompts-option-b)
5. [Section 2 — Individual prompts (Option A)](#section-2--individual-prompts-option-a)
6. [Section 3 — Calibration and limits](#section-3--calibration-and-limits)

---

## How to use this file

- **Grouped prompts (Option B)** are for daily scoring work. One prompt scores 2-5 related attributes for one patent. You'll run roughly 8 prompts per patent, get back JSON, and paste the values into your Patent Portfolio sheet.
- **Individual prompts (Option A)** are for when you want maximum precision on a single attribute, want to debug a disagreement, or want to spot-check a grouped-prompt output.
- All prompts target ChatGPT, Copilot, or Claude equivalently. They use plain text, no model-specific syntax.
- Every prompt expects the same input bundle (defined below) and returns structured JSON.
- Prompts include the rubric inline — no need to keep flipping to another reference.
- Every prompt asks for a confidence score (0-100) and a short justification. Use confidence < 60 as a flag to review manually.

### Recommended workflow

1. Gather the input bundle for one patent (see next section).
2. For grouped prompts: run them in order; paste the JSON outputs into the Patent Portfolio sheet column by column.
3. For any field where the grouped prompt gave low confidence, run the corresponding individual prompt to get a more focused answer.
4. Always double-check rubric-scored fields (H1, C4, I3, I4) against your team's calibration on 5-10 sample patents before scoring at portfolio scale.

---

## Which attributes are covered

**Covered by these prompts (20 attributes):**

| Group | Attributes |
|---|---|
| A — Technology Classification | A1, A2, A3, A4, A5 |
| B — Standards & Ecosystem | B1, B2*, B3 |
| C — Claim & Scope | C1, C2, C4 |
| D — Detectability | D1, D2 |
| G — Strategic & Thematic | G1, G2, G3 |
| H — Quality & Vulnerability | H1, H4 |
| I — Market / Buyer Signals | I2, I3, I4 |

*B2 requires verification against an SSO database (ETSI, IEEE, ITU) after AI scoring.

**Not covered (need authoritative data sources or internal records):**

| Why excluded | Attributes |
|---|---|
| Counting (use spreadsheet or PatentsView) | C3, H6 |
| Database lookup (need current world state) | E1, E2, E3, E4, E5, F1, F2, F3, H5, H7, H8 |
| Targeted research (AI will hallucinate) | D3, H2, H3, I1 |
| Internal artifact check | H9, H10 |

---

## The common input bundle

For every prompt below, you'll need this minimal input bundle for the patent. Gather it once per patent.

```
PATENT_ID:        [Application or grant number]
TITLE:            [Full title]
ABSTRACT:         [Full abstract text]
INDEPENDENT_CLAIM_1: [Full text of independent claim 1]
INDEPENDENT_CLAIM_OTHERS: [Optional — claims 2+ if there are multiple independent claims]
BACKGROUND_OR_FIELD: [The "Field of the Invention" and/or "Background" paragraphs from the spec]
CPC_PRIMARY:      [Primary CPC classification, if available]
CPC_OTHERS:       [Secondary CPC classifications, comma-separated, if available]
```

Some prompts (e.g., I2 — Implementation maturity) need additional snippets from the specification; those are flagged per prompt.

A few prompts will ask for the "target industry" context — that's what the patent was originally drafted for (e.g., automotive, consumer electronics, telecom). If unknown, leave blank and the prompt will infer from the abstract.

---

## Section 1 — Grouped prompts (Option B)

Eight grouped prompts cover all 20 attributes. Run in this order for one patent.

### Prompt B1 — Technology Classification (scores A1, A2, A3, A4, A5)

```
You are scoring a patent on five technology-classification attributes. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
BACKGROUND_OR_FIELD: <fill in>
CPC_PRIMARY: <fill in, or "unknown">
CPC_OTHERS: <fill in, or "unknown">

ATTRIBUTES TO SCORE:

A1. Primary technology domain — a short human-readable tag (2-5 words) describing the main technical field. Examples: "Wireless PHY", "Battery cell chemistry", "Computer vision algorithm", "Power electronics". Derive from CPC_PRIMARY plus claim language. If CPC is unknown, infer from the claim.

A2. Secondary domains — comma-separated short tags (2-4 words each) for cross-applicable technical areas the patent also touches. Examples: "MIMO, beamforming"; "Edge inference, model quantization". Derive from CPC_OTHERS plus abstract/claim keywords.

A3. Stack layer — exactly one of: Hardware, Firmware, OS, Middleware, App, Cloud, UI. Pick where the novelty of independent claim 1 lives. Rubric:
- Hardware: physical device, circuit, or material composition
- Firmware: low-level code embedded in hardware
- OS: kernel/driver level
- Middleware: protocol stacks, libraries, frameworks
- App: end-user application logic
- Cloud: server-side service or backend
- UI: visual interface or interaction pattern

A4. Product subsystem — short tag naming the subsystem of an end-product this covers (e.g., "battery pack", "traction inverter", "vision pipeline", "RF frontend"). Derive from claim + background.

A5. Use-case — phrase the real-world problem as a customer-facing problem (e.g., "indoor positioning", "battery fast-charging", "fraud detection in payments"). Derive from background section.

OUTPUT FORMAT (strict JSON, no prose around it):

{
  "A1": {"value": "<string>", "confidence": <0-100>, "justification": "<one sentence>"},
  "A2": {"value": "<comma-separated string>", "confidence": <0-100>, "justification": "<one sentence>"},
  "A3": {"value": "<one of the 7 enum values>", "confidence": <0-100>, "justification": "<one sentence>"},
  "A4": {"value": "<string>", "confidence": <0-100>, "justification": "<one sentence>"},
  "A5": {"value": "<string>", "confidence": <0-100>, "justification": "<one sentence>"}
}

Score conservatively. If confidence < 60 for any field, set the value but mark it for review in the justification.
```

### Prompt B2 — Standards & Interface (scores B1, B2, B3)

```
You are scoring a patent on standards-essentiality and interoperability. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
INDEPENDENT_CLAIM_OTHERS: <fill in or "none">
BACKGROUND_OR_FIELD: <fill in>

IMPORTANT: You cannot verify SSO declarations. Treat B1 and B2 as inferred-from-text indicators that MUST be verified against the ETSI IPR database, IEEE-SA, or ITU declarations before being trusted.

ATTRIBUTES TO SCORE:

B1. SEP potential — integer 0-3. Rubric:
- 3: Claim language directly mirrors a normative spec section of a known standard (3GPP, IEEE 802.x, ITU, USB, Bluetooth, H.26x). Use phrases from the claim that match canonical standard language.
- 2: Claim reads on a specific clause of a known standard but the mapping is inferential, not literal.
- 1: Standard-adjacent — claim involves a standardized technology area but normative essentiality is debatable.
- 0: No standard tie evident from the claim.

B2. Standard tagged — string. If B1 >= 2, name the specific standard(s) the claim plausibly maps to. Be specific (e.g., "3GPP TS 38.211 (5G NR PHY)", "IEEE 802.11be (Wi-Fi 7)", "USB PD 3.1"). If B1 = 0 or 1, output "". Always flag this output as "REQUIRES VERIFICATION against the SSO database" in the justification.

B3. Interface role — integer 0-3. Rubric:
- 3: Claim sits at a mandatory interface between two systems (wire protocol, connector pinout, RPC format, handshake).
- 2: Claim covers a widely-used interoperability mechanism that is de-facto standard but not technically mandatory.
- 1: Claim involves an interface but the interface is internal to one product.
- 0: No interface dimension in the claim.

OUTPUT FORMAT:

{
  "B1": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence>"},
  "B2": {"value": "<string or empty>", "confidence": <0-100>, "justification": "<one sentence ending with verification note if B1>=2>"},
  "B3": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence>"}
}
```

### Prompt B3 — Claim Analysis (scores C1, C2, C4)

```
You are scoring a patent on claim type, breadth, and design-around difficulty. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
INDEPENDENT_CLAIM_OTHERS: <fill in or "none">

ATTRIBUTES TO SCORE:

C1. Claim type — exactly one of: Apparatus, Method, System, CRM, Design. Pick the dominant independent claim type. Rubric:
- Apparatus: "an apparatus comprising...", "a device comprising..."
- Method: "a method comprising the steps of..."
- System: "a system for X comprising..."
- CRM: "a non-transitory computer-readable medium storing instructions that, when executed..."
- Design: design patents (D-numbered, drawings only)
If mixed, pick the type most likely to be enforceable against the named target products.

C2. Claim breadth — integer 0-3. Rubric (read independent claim 1):
- 3 (pioneer/foundational): Few elements, abstract/general language, no narrowing wherein clauses, broad genus.
- 2 (broad): Moderate element count, some structural narrowing.
- 1 (narrow): Many specific element constraints, specific value ranges, named structural features.
- 0 (very narrow/picture claim): Tied to one specific implementation.
Rule of thumb: shorter independent claims with fewer limitations are usually broader.

C4. Design-around difficulty — integer 0-3. Rubric:
- 3 (hard): Claim covers a broad genus AND the language captures the natural/efficient approach; alternatives would be commercially undesirable.
- 2: Covers main routes but leaves specific alternatives available.
- 1: Claim is one of several obvious alternatives — competitor can switch with modest redesign.
- 0: Trivial workaround exists.
This requires engineering judgment; mark confidence < 70 if you cannot confidently identify obvious alternatives.

OUTPUT FORMAT:

{
  "C1": {"value": "<one of 5 enum values>", "confidence": <0-100>, "justification": "<one sentence>"},
  "C2": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence noting element count>"},
  "C4": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence noting alternative approaches you considered>"}
}
```

### Prompt B4 — Detectability (scores D1, D2)

```
You are scoring a patent on infringement detectability. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
TITLE: <fill in>
ABSTRACT: <fill in>

ATTRIBUTES TO SCORE:

D1. External detectability — integer 0-3. Ask: can infringement be confirmed by observing the product WITHOUT opening it? Rubric:
- 3: Visible in UI, marketed feature, public spec sheet, or measurable from outputs (e.g., a specific protocol behavior on the wire).
- 2: Detectable from network traffic capture or external instrumentation.
- 1: Detectable only with significant external testing.
- 0: Requires teardown or internal access.

D2. Teardown detectability — integer 0-3. Ask: if I tear down the product, can I see the claimed element? Rubric:
- 3: Visible in standard teardown (circuit traces, chip die markings, mechanical components).
- 2: Detectable with electrical probing or chip-level reverse engineering.
- 1: Detectable only with deep RE (decapping, firmware dump).
- 0: Process-internal — no teardown reveals it (e.g., a manufacturing process step).
Defaults: apparatus and chip-layout claims usually score 2-3; pure-software-method claims usually 0-1.

OUTPUT FORMAT:

{
  "D1": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence>"},
  "D2": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence>"}
}
```

### Prompt B5 — Themes & Generation (scores G1, G2, G3)

```
You are scoring a patent on convergence themes, technology generation, and cross-industry applicability. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
BACKGROUND_OR_FIELD: <fill in>

ATTRIBUTES TO SCORE:

G1. Convergence theme — comma-separated tags from this fixed dictionary (use only tags from this list; if none fit, return ""):
"AI+healthcare", "Edge AI", "AR/VR", "AI+chip-design", "Robotics+CV", "Quantum", "Sustainability+materials", "AI+industrial", "Web3", "Spatial computing", "AI+security", "AI+finance"

G2. Generation — exactly one of: Legacy, Current, Next-gen, or "" (empty) if the technology doesn't have a clean generation mapping. Rubric:
- Legacy: tied to a superseded generation still in service but on decline (e.g., 4G LTE in 2026, USB 2.0)
- Current: tied to the dominant deployed generation (5G NR, USB 3.x, Wi-Fi 6)
- Next-gen: tied to the emerging or pre-deployment generation (6G research, Wi-Fi 8, USB4 v2)
- "": for non-generation-tagged tech (materials, basic algorithms, mechanical systems)

G3. Cross-industry applicability — integer 0-3. Rubric (count plausible target industries from this list: Consumer Electronics, Automotive, Healthcare, Industrial/Manufacturing, Telecom, Energy, Aerospace, FinTech, AgTech, Defense):
- 3: Reads plausibly on products in 4+ industries
- 2: 3 industries
- 1: 2 industries
- 0: Single industry only

OUTPUT FORMAT:

{
  "G1": {"value": "<comma-separated tags or empty>", "confidence": <0-100>, "justification": "<one sentence>"},
  "G2": {"value": "<one of 4 values>", "confidence": <0-100>, "justification": "<one sentence>"},
  "G3": {"value": <0-3>, "confidence": <0-100>, "justification": "<list the industries you identified>"}
}
```

### Prompt B6 — Claim Quality (scores H1, H4)

```
You are scoring a patent on claim language quality and infringement-actor risk. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
INDEPENDENT_CLAIM_OTHERS: <fill in or "none">
DEPENDENT_CLAIM_COUNT: <number, if known>

ATTRIBUTES TO SCORE:

H1. Claim strength rating — integer 0-3. Rubric:
- 3: Claim language clean and definite, all key terms have clear antecedent basis, language is structurally clean, no obvious ambiguities, dependent claims (if listed) appear to provide layered fallbacks.
- 2: Minor ambiguity but enforceable. One term might invite claim construction dispute.
- 1: Vague terms, weak antecedent basis, multiple ambiguous limitations.
- 0: Ambiguous, indefinite, internally inconsistent.
This is preliminary — final score requires patent counsel review. Mark confidence appropriately.

H4. Divided infringement risk — integer 0-3. Read the independent claim and identify who performs each step/action. Rubric:
- 3: All claim steps performed by a single actor. Apparatus claims default to 3.
- 2: Claim steps performed by a single actor with minor user interaction.
- 1: Claim steps require two parties (e.g., client + server with no clear "single mastermind").
- 0: Explicit multi-party performance with no joint enterprise — high enforcement risk.

OUTPUT FORMAT:

{
  "H1": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; list any specific ambiguous terms>"},
  "H4": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; list the actors you identified>"}
}
```

### Prompt B7 — Market Signals (scores I2, I3, I4)

```
You are scoring a patent on market-facing signals: implementation maturity, adjacent-market re-read, and workaround complexity. Read the inputs and return JSON.

INPUTS:
PATENT_ID: <fill in>
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
BACKGROUND_OR_FIELD: <fill in>
SPECIFICATION_HAS_WORKING_EXAMPLES: <Yes/No/Unknown — whether the spec includes a Detailed Description with working examples, experimental data, or named embodiments>
TARGET_INDUSTRY: <fill in if known; if not, leave blank>

ATTRIBUTES TO SCORE:

I2. Implementation maturity — exactly one of: "Idea-only", "Prototyped", "Productized". Rubric:
- Idea-only: Specification describes a concept with no working example, no experimental data, no specific embodiment.
- Prototyped: Specification or background references a working prototype, lab demo, or research publication; specific embodiment described.
- Productized: Specification names a commercial product, or you have external knowledge that a product implementing this exists.
Note: AI cannot verify productization from external sources. If marking "Productized" based on text alone, flag this in justification — verify against product databases before finalizing.

I3. Adjacent-market re-read — integer 0-3. Rubric:
- 3: Claim language is industry-agnostic AND clearly reads on 2+ adjacent industries beyond the target.
- 2: Re-read plausible in one adjacent industry with no claim contortion.
- 1: Re-read possible but requires aggressive interpretation.
- 0: Claim language ties it to one industry.
Horizontal technologies (sensing, networking, AI methods) typically score 2-3.

I4. Workaround complexity — integer 0-3. Ask: how much engineering effort would a competitor need to ship a non-infringing alternative? Rubric:
- 3: Deep redesign — claim covers the natural/efficient approach; alternatives are expensive or technically inferior.
- 2: Significant redesign — alternatives exist but are commercially undesirable.
- 1: Minor redesign — straightforward alternative is available.
- 0: Trivial workaround — designers can easily substitute.
Note: I4 correlates with C4 but considered separately because C4 is about claim language whereas I4 is about commercial impact. They may differ.

OUTPUT FORMAT:

{
  "I2": {"value": "<one of 3 enum values>", "confidence": <0-100>, "justification": "<one sentence; note any verification required>"},
  "I3": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; list adjacent industries you considered>"},
  "I4": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; describe the alternatives you considered>"}
}
```

### Prompt B8 — Standards verification helper (post-process B2)

```
You previously scored B1 (SEP potential) and B2 (standard tagged) for a patent. This prompt helps you verify the B2 inference against publicly known standards. Use this BEFORE trusting B2 in production data.

INPUTS:
PATENT_ID: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
B2_PROPOSED: <the standard name your earlier prompt proposed>

TASK:
1. Identify the specific clause(s) of B2_PROPOSED that the claim language plausibly maps to. Be precise (e.g., "3GPP TS 38.211 §7.4.1.1" rather than just "3GPP 5G NR").
2. Identify the canonical phrases from the standard that should appear in any patent claim that is essential to that clause.
3. Check whether INDEPENDENT_CLAIM_1 contains language consistent with those canonical phrases.
4. Recommend whether B2 should be trusted as-is, narrowed, broadened, or rejected.

OUTPUT FORMAT:

{
  "verdict": "<one of: confirm | narrow | broaden | reject>",
  "recommended_B2_value": "<string — what B2 should be set to after verification>",
  "specific_clauses": ["<clause id>", "..."],
  "rationale": "<2-3 sentences>",
  "next_step": "<what database to consult: ETSI IPR / IEEE-SA / ITU / IETF / other>"
}

IMPORTANT: You cannot access the ETSI IPR database directly. This is a reasoning aid, not a verification. The recommended next step is to look up the patent family in the named database and confirm whether a declaration exists.
```

---

## Section 2 — Individual prompts (Option A)

One prompt per attribute. Use these when you want a focused, deep score for a single field, or when a grouped prompt returned low confidence.

### A1 — Primary technology domain

```
You are tagging a patent's primary technology domain. Output a short human-readable tag (2-5 words) suitable for grouping patents by technical field.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
CPC_PRIMARY: <fill in or "unknown">

EXAMPLES OF GOOD OUTPUT VALUES:
"Wireless PHY", "Battery cell chemistry", "Computer vision algorithm", "Power electronics", "Semiconductor process", "Industrial AI", "Robotics SW", "Thermal management"

RULES:
- Prefer the CPC main code mapping if CPC is known.
- Reuse tags across a portfolio rather than coining new ones for every patent.
- 2-5 words; no abbreviations longer than 4 characters; no jargon.

OUTPUT FORMAT:

{
  "A1": {"value": "<string>", "confidence": <0-100>, "justification": "<one sentence>"}
}
```

### A2 — Secondary domains

```
You are tagging a patent's secondary technology domains — cross-applicable technical areas it touches beyond the primary domain.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
A1_VALUE: <the primary domain tag, from earlier scoring>
CPC_OTHERS: <fill in or "unknown">

RULES:
- 2-5 tags, comma-separated.
- Each tag 2-4 words.
- Examples: "MIMO, beamforming"; "Edge inference, model quantization"; "Solid-state, ionics".
- Do not repeat the A1 tag.

OUTPUT FORMAT:

{
  "A2": {"value": "<comma-separated tags>", "confidence": <0-100>, "justification": "<one sentence>"}
}
```

### A3 — Stack layer

```
You are picking the stack layer where the novelty of independent claim 1 lives.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
BACKGROUND_OR_FIELD: <fill in>

RUBRIC (pick exactly one):
- Hardware: physical device, circuit, or material composition
- Firmware: low-level code embedded in hardware
- OS: kernel/driver level
- Middleware: protocol stacks, libraries, frameworks
- App: end-user application logic
- Cloud: server-side service or backend
- UI: visual interface or interaction pattern

If the claim mixes layers, pick where the novelty lives, not where the support sits.

OUTPUT FORMAT:

{
  "A3": {"value": "<one of 7 enum values>", "confidence": <0-100>, "justification": "<one sentence pointing to the claim language that drove the decision>"}
}
```

### A4 — Product subsystem

```
You are tagging which subsystem of an end-product the patent covers.

INPUTS:
TITLE: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
BACKGROUND_OR_FIELD: <fill in>
TARGET_INDUSTRY: <fill in if known, else blank>

RULES:
- Output a short tag (2-4 words) naming the subsystem.
- Examples for EV: "battery cell", "battery pack", "BMS", "traction inverter", "thermal mgmt", "charging port", "motor", "regen brake controller".
- Examples for wireless: "RF frontend", "baseband processor", "WLAN module".
- Examples for software: "vision pipeline", "inference engine", "navigation stack".
- Reuse tags across a portfolio.

OUTPUT FORMAT:

{
  "A4": {"value": "<string>", "confidence": <0-100>, "justification": "<one sentence>"}
}
```

### A5 — Use-case

```
You are phrasing the use-case as a customer-facing problem.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
BACKGROUND_OR_FIELD: <fill in>

RULES:
- Phrase as a problem someone in a market would describe (e.g., "indoor positioning", "battery fast-charging", "fraud detection in payments", "low-latency video streaming").
- 2-5 words.
- Avoid technology jargon — use the problem language a buyer would search for.

OUTPUT FORMAT:

{
  "A5": {"value": "<string>", "confidence": <0-100>, "justification": "<one sentence quoting the problem statement in the background>"}
}
```

### B1 — SEP potential

```
You are scoring SEP (standard-essential patent) potential 0-3.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>

RUBRIC:
- 3: Claim language directly mirrors a normative spec section of a known standard (3GPP, IEEE 802.x, ITU, USB, Bluetooth, H.26x). Cite the matching phrase.
- 2: Claim reads on a specific clause of a known standard but the mapping is inferential.
- 1: Standard-adjacent — claim involves a standardized area but essentiality is debatable.
- 0: No standard tie evident.

IMPORTANT: You cannot verify SSO declarations. This is a text-inference signal only.

OUTPUT FORMAT:

{
  "B1": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; if >=2, identify the matching standard clause or canonical phrase>"}
}
```

### B2 — Standard tagged

```
You are naming the specific standard(s) the patent plausibly maps to. Run this only if B1 >= 2.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
B1_VALUE: <integer 0-3>

RULES:
- Be specific: "3GPP TS 38.211 (5G NR PHY)" not just "5G".
- If multiple standards could apply, list all separated by " | ".
- If B1 < 2, output "".

VERIFICATION REQUIRED: Whatever you output MUST be verified against the relevant SSO database (ETSI IPR for 3GPP, IEEE-SA for 802.x, ITU for H.26x, IETF for RFCs) before being trusted.

OUTPUT FORMAT:

{
  "B2": {"value": "<string or empty>", "confidence": <0-100>, "justification": "<one sentence>", "verification_needed": true}
}
```

### B3 — Interface role

```
You are scoring the patent's role as an interface/interoperability technology, 0-3.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
ABSTRACT: <fill in>

RUBRIC:
- 3: Claim sits at a mandatory interface between two systems (wire protocol, connector pinout, RPC format, handshake protocol).
- 2: Claim covers a widely-used interoperability mechanism that is de-facto standard but not technically mandatory.
- 1: Claim involves an interface but the interface is internal to one product.
- 0: No interface dimension.

OUTPUT FORMAT:

{
  "B3": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; identify the interface if any>"}
}
```

### C1 — Claim type

```
You are classifying the dominant independent claim type.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
INDEPENDENT_CLAIM_OTHERS: <fill in or "none">

RUBRIC (pick exactly one):
- Apparatus: "an apparatus comprising...", "a device comprising..."
- Method: "a method comprising the steps of..."
- System: "a system for X comprising..."
- CRM: "a non-transitory computer-readable medium storing instructions that, when executed..."
- Design: design patents (D-numbered, drawings only)

If multiple independent claim types exist, pick the most enforceable type given the likely target products.

OUTPUT FORMAT:

{
  "C1": {"value": "<one of 5 enum values>", "confidence": <0-100>, "justification": "<one sentence quoting the preamble>"}
}
```

### C2 — Claim breadth

```
You are scoring independent claim 1's breadth, 0-3.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>

RUBRIC:
- 3 (pioneer/foundational): Few elements, abstract/general language, no narrowing wherein clauses, broad genus.
- 2 (broad): Moderate element count, some structural narrowing.
- 1 (narrow): Many specific element constraints, specific value ranges, named structural features.
- 0 (very narrow/picture claim): Tied to one specific implementation, many "wherein" clauses.

Rule of thumb: shorter independent claims with fewer limitations are usually broader.

OUTPUT FORMAT:

{
  "C2": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence; state your element count and any wherein-clause count>"}
}
```

### C4 — Design-around difficulty

```
You are scoring how hard it would be to design around the patent, 0-3.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
INDEPENDENT_CLAIM_OTHERS: <fill in or "none">
DEPENDENT_CLAIM_TEXT: <fill in if available — covers variants>
ABSTRACT: <fill in>

RUBRIC:
- 3 (hard): Independent claim covers a broad genus AND captures the natural/efficient approach; obvious alternatives would be commercially inferior.
- 2: Covers main routes but leaves specific alternatives.
- 1: Claim is one of several obvious alternatives — competitor can switch with modest redesign.
- 0: Trivial workaround exists.

This requires engineering judgment. Identify 2-3 plausible design-around routes in the justification.

OUTPUT FORMAT:

{
  "C4": {"value": <0-3>, "confidence": <0-100>, "justification": "<list the design-around routes you considered and why they would or would not work>"}
}
```

### D1 — External detectability

```
You are scoring external (no-teardown) detectability of infringement, 0-3.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
ABSTRACT: <fill in>

RUBRIC:
- 3: Visible in UI, marketed feature, public spec sheet, or measurable from outputs (e.g., a specific protocol behavior on the wire).
- 2: Detectable from network traffic capture or external instrumentation.
- 1: Detectable only with significant external testing.
- 0: Requires teardown or internal access.

OUTPUT FORMAT:

{
  "D1": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence on what external observation would reveal>"}
}
```

### D2 — Teardown detectability

```
You are scoring teardown / reverse-engineering detectability, 0-3.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
ABSTRACT: <fill in>
C1_VALUE: <the claim type, if already known>

RUBRIC:
- 3: Visible in standard teardown (circuit traces, chip die markings, mechanical components).
- 2: Detectable with electrical probing or chip-level reverse engineering.
- 1: Detectable only with deep RE (decapping, firmware dump).
- 0: Process-internal — no teardown reveals it (e.g., a manufacturing process step).

Defaults: Apparatus and chip-layout claims usually 2-3. Pure-software-method claims usually 0-1.

OUTPUT FORMAT:

{
  "D2": {"value": <0-3>, "confidence": <0-100>, "justification": "<one sentence on what would be visible at teardown>"}
}
```

### G1 — Convergence theme

```
You are tagging the patent with convergence themes from a fixed dictionary.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>

DICTIONARY (use only these tags; if none fit, return ""):
"AI+healthcare", "Edge AI", "AR/VR", "AI+chip-design", "Robotics+CV", "Quantum", "Sustainability+materials", "AI+industrial", "Web3", "Spatial computing", "AI+security", "AI+finance"

RULES:
- Up to 2 tags, comma-separated.
- Only tag if the patent clearly fits — do not stretch.
- Return "" if no clear fit.

OUTPUT FORMAT:

{
  "G1": {"value": "<comma-separated tags or empty>", "confidence": <0-100>, "justification": "<one sentence>"}
}
```

### G2 — Generation

```
You are tagging the technology generation the patent maps to.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
BACKGROUND_OR_FIELD: <fill in>

RUBRIC (pick exactly one):
- Legacy: tied to a superseded generation still in service but on decline (e.g., 4G LTE in 2026, USB 2.0)
- Current: tied to the dominant deployed generation (5G NR, USB 3.x, Wi-Fi 6)
- Next-gen: tied to the emerging or pre-deployment generation (6G research, Wi-Fi 8, USB4 v2)
- "": for non-generation-tagged tech (materials, basic algorithms, mechanical systems)

OUTPUT FORMAT:

{
  "G2": {"value": "<one of 4 values>", "confidence": <0-100>, "justification": "<one sentence; cite the spec/generation marker you used>"}
}
```

### G3 — Cross-industry applicability

```
You are scoring how many distinct industries the patent could plausibly read on, 0-3.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>

INDUSTRY LIST (count from this fixed list):
Consumer Electronics, Automotive, Healthcare, Industrial/Manufacturing, Telecom, Energy, Aerospace, FinTech, AgTech, Defense

RUBRIC:
- 3: 4+ industries plausible
- 2: 3 industries
- 1: 2 industries
- 0: Single industry only

A "plausible" read means the claim could read on a real product in that industry without claim contortion.

OUTPUT FORMAT:

{
  "G3": {"value": <0-3>, "confidence": <0-100>, "justification": "<list the industries you counted as plausible>"}
}
```

### H1 — Claim strength rating

```
You are scoring claim language quality 0-3. This is a preliminary score; final value requires patent counsel.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
INDEPENDENT_CLAIM_OTHERS: <fill in or "none">
DEPENDENT_CLAIM_COUNT: <number, if known>

RUBRIC:
- 3: Clean, definite claim language; clear antecedent basis for all terms; structurally clean; dependent claims appear to provide layered fallbacks.
- 2: Minor ambiguity but enforceable. One term might invite claim construction dispute.
- 1: Vague terms, weak antecedent basis, multiple ambiguous limitations.
- 0: Ambiguous, indefinite, or internally inconsistent.

Specifically check for:
- Antecedent basis violations ("the X" appearing before "an X" was introduced)
- Functional language without sufficient structure (means-plus-function risk)
- Relative terms without baselines ("substantially", "about", "approximately")
- Open-ended ranges
- Inconsistency between preamble and body

OUTPUT FORMAT:

{
  "H1": {"value": <0-3>, "confidence": <0-100>, "justification": "<list any specific issues found, or confirm clean>", "issues_flagged": ["<issue 1>", "..."]}
}
```

### H4 — Divided infringement risk

```
You are scoring divided-infringement risk 0-3. Read independent claim 1, identify each actor.

INPUTS:
INDEPENDENT_CLAIM_1: <fill in>
C1_VALUE: <claim type, if known>

RUBRIC:
- 3: All claim steps performed by a single actor. Apparatus claims default to 3.
- 2: Claim steps performed by a single actor with minor user interaction.
- 1: Claim steps require two parties (e.g., client + server with no clear "single mastermind").
- 0: Explicit multi-party performance with no joint enterprise — high enforcement risk.

For each step/action in the claim, identify WHO performs it (device, server, user, network element, third-party service).

OUTPUT FORMAT:

{
  "H4": {"value": <0-3>, "confidence": <0-100>, "justification": "<list the actors and which steps each performs>", "actors": ["<actor 1>", "..."]}
}
```

### I2 — Implementation maturity

```
You are scoring whether the patent's invention is at idea, prototype, or product stage.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
SPECIFICATION_EXCERPTS: <Detailed Description, Examples, Embodiments section if available>
ANY_KNOWN_PRODUCT_REFERENCE: <if you've separately found a press release, paper, or product page mentioning this work, paste a one-line reference; otherwise leave blank>

RUBRIC (pick exactly one):
- Idea-only: Specification describes a concept with no working example, no experimental data, no specific embodiment.
- Prototyped: Specification or background references a working prototype, lab demo, or research publication; specific embodiment with measurable detail described.
- Productized: Specification names a commercial product, OR there is external evidence (passed in via ANY_KNOWN_PRODUCT_REFERENCE) that a product implementing this exists.

NOTE: You cannot search external sources to confirm productization. If marking "Productized" based on text alone, flag verification needed in the justification.

OUTPUT FORMAT:

{
  "I2": {"value": "<one of 3 enum values>", "confidence": <0-100>, "justification": "<one sentence quoting evidence from the spec or external reference>", "verification_needed": <true/false>}
}
```

### I3 — Adjacent-market re-read

```
You are scoring whether the claim can be re-mapped to industries beyond the target, 0-3.

INPUTS:
TITLE: <fill in>
ABSTRACT: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
TARGET_INDUSTRY: <fill in if known>

RUBRIC:
- 3: Claim language is industry-agnostic AND clearly reads on 2+ adjacent industries beyond the target.
- 2: Re-read plausible in one adjacent industry with no claim contortion.
- 1: Re-read possible but requires aggressive interpretation.
- 0: Claim language ties it tightly to one industry.

Horizontal technologies (sensing, networking, AI methods, materials science) typically score 2-3.

For your justification, name the adjacent industries you considered and explain whether each re-read works.

OUTPUT FORMAT:

{
  "I3": {"value": <0-3>, "confidence": <0-100>, "justification": "<list adjacent industries and whether the claim reads on them>", "adjacent_industries": ["<industry 1>", "..."]}
}
```

### I4 — Workaround complexity

```
You are scoring the engineering effort needed to ship a non-infringing competing product, 0-3.

INPUTS:
TITLE: <fill in>
INDEPENDENT_CLAIM_1: <fill in>
ABSTRACT: <fill in>
TARGET_INDUSTRY: <fill in if known>

RUBRIC:
- 3: Deep redesign — claim covers the natural/efficient approach; alternatives are expensive or technically inferior.
- 2: Significant redesign — alternatives exist but are commercially undesirable (e.g., 20%+ performance loss, major BOM cost increase).
- 1: Minor redesign — straightforward alternative is available with acceptable trade-offs.
- 0: Trivial workaround — designers can easily substitute.

Note: I4 differs from C4. C4 is about claim language; I4 is about commercial impact. A patent with a broad claim (high C4) but with a cheap alternative path (low I4) is common.

Identify 2-3 alternative engineering approaches and assess each.

OUTPUT FORMAT:

{
  "I4": {"value": <0-3>, "confidence": <0-100>, "justification": "<describe the alternatives you considered and their commercial cost>", "alternatives_considered": ["<approach 1>", "..."]}
}
```

---

## Section 3 — Calibration and limits

### When to trust AI output

- **Trust high-confidence rubric scores** (confidence ≥ 75) for these fields: A1, A2, A3, A4, A5, C1, G1, G2.
- **Always second-check** these fields, even at high confidence: H1, C4, I4 — they require domain judgment that AI approximates rather than possesses.
- **Always verify before relying on** B1, B2 — SEP claims must be confirmed against SSO databases.
- **Never accept blindly** I2 = Productized — verify against external product evidence.

### Calibration protocol

Before using these prompts at portfolio scale:

1. Pick 5 representative patents from your portfolio.
2. Have 2-3 team members score those 5 patents manually using the same rubrics.
3. Run the AI prompts on the same 5 patents.
4. Compare the AI output against the team consensus. Identify systematic biases (e.g., "AI scores claim breadth high by default", "AI under-flags ambiguous language in H1").
5. Add the biases to your prompt context as additional instructions before scoring the rest of the portfolio.

### What AI can't do here

- Pull family data, citation counts, or jurisdictions (use patent database APIs)
- Look up litigation outcomes, PTAB decisions, or maintenance status (use Lex Machina / Darts-IP / USPTO Patent Center)
- Search for prior art (LLMs hallucinate references)
- Read file wrappers reliably (use a patent attorney)
- Check internal records (claim charts, encumbrances, chain of title)

### Token economy

Each grouped prompt + a typical patent input bundle runs about 1500-2500 tokens of input. Output is 200-400 tokens. On a 50-patent portfolio, all 8 grouped prompts × 50 patents ≈ 800K-1.2M tokens total. Budget accordingly; consider batching multiple patents in one call for cost efficiency once you trust the prompts.

### Output schema discipline

All prompts return JSON. If you're processing programmatically:

- Validate that all required keys exist.
- Validate enum values match the rubric exactly (no synonyms).
- Validate integer scores are in 0-3 range.
- Flag any item with confidence < 60 for manual review.

A simple validation regex for the grouped output: each top-level key matches `^[A-I][1-9]$`, each value is an object with keys `value`, `confidence`, `justification`.

---

*Companion to `Patent_Bundling_Template_v4.xlsx` and `DOCUMENTATION.md`. Update this file when attribute definitions change in the workbook.*
