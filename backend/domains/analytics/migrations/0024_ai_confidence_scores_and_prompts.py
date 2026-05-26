from django.db import migrations, models

# ---------------------------------------------------------------------------
# Grouped prompt texts from AI_Prompts_for_Attribute_Scoring.md (Section 1)
# Placeholders replace the <fill in> markers from the MD.
# ---------------------------------------------------------------------------

PROMPT_B2_STANDARDS = """\
You are scoring a patent on standards-essentiality and interoperability. Read the inputs and return JSON.

TITLE: {title}
ABSTRACT: {abstract}
INDEPENDENT_CLAIM_1: {independent_claim_1}
INDEPENDENT_CLAIM_OTHERS: {independent_claim_others}
BACKGROUND_OR_FIELD: {background_or_field}

IMPORTANT: You cannot verify SSO declarations. Treat B1 and B3 as inferred-from-text indicators that MUST be verified against the ETSI IPR database, IEEE-SA, or ITU declarations before being trusted.

ATTRIBUTES TO SCORE:

b1_sep_potential — integer 0-3. Rubric:
- 3: Claim language directly mirrors a normative spec section of a known standard (3GPP, IEEE 802.x, ITU, USB, Bluetooth, H.26x).
- 2: Claim reads on a specific clause of a known standard but the mapping is inferential, not literal.
- 1: Standard-adjacent — claim involves a standardized technology area but normative essentiality is debatable.
- 0: No standard tie evident from the claim.

b2_standard_tagged — string. If b1_sep_potential >= 2, name the specific standard(s) the claim plausibly maps to. Be specific (e.g., "3GPP TS 38.211 (5G NR PHY)", "IEEE 802.11be (Wi-Fi 7)", "USB PD 3.1"). If b1 = 0 or 1, output "". Always flag this output as "REQUIRES VERIFICATION" in the justification.

b3_interface_role — integer 0-3. Rubric:
- 3: Claim sits at a mandatory interface between two systems (wire protocol, connector pinout, RPC format, handshake).
- 2: Claim covers a widely-used interoperability mechanism that is de-facto standard but not technically mandatory.
- 1: Claim involves an interface but the interface is internal to one product.
- 0: No interface dimension in the claim.

Return ONLY valid JSON. Each field must be an object with "value", "confidence" (0-100), "justification" (one sentence):
{{"b1_sep_potential": {{"value": 1, "confidence": 70, "justification": "..."}}, "b2_standard_tagged": {{"value": "", "confidence": 0, "justification": "REQUIRES VERIFICATION"}}, "b3_interface_role": {{"value": 0, "confidence": 80, "justification": "..."}}}}"""

PROMPT_B3_CLAIM_ANALYSIS = """\
You are scoring a patent on claim type, breadth, and design-around difficulty. Read the inputs and return JSON.

INDEPENDENT_CLAIM_1: {independent_claim_1}
INDEPENDENT_CLAIM_OTHERS: {independent_claim_others}

ATTRIBUTES TO SCORE:

c1_claim_type — exactly one of: Apparatus, Method, System, CRM, Design. Pick the dominant independent claim type.
- Apparatus: "an apparatus comprising...", "a device comprising..."
- Method: "a method comprising the steps of..."
- System: "a system for X comprising..."
- CRM: "a non-transitory computer-readable medium storing instructions..."
- Design: design patents (D-numbered, drawings only)

c2_breadth — integer 0-3.
- 3 (pioneer/foundational): Few elements, abstract/general language, broad genus.
- 2 (broad): Moderate element count, some structural narrowing.
- 1 (narrow): Many specific element constraints, specific value ranges.
- 0 (very narrow/picture claim): Tied to one specific implementation.

c4_design_around_difficulty — integer 0-3.
- 3 (hard): Claim covers a broad genus AND captures the natural/efficient approach; alternatives would be commercially undesirable.
- 2: Covers main routes but leaves specific alternatives available.
- 1: Claim is one of several obvious alternatives — competitor can switch with modest redesign.
- 0: Trivial workaround exists.

Return ONLY valid JSON. Each field must be an object with "value", "confidence" (0-100), "justification" (one sentence):
{{"c1_claim_type": {{"value": "Method", "confidence": 90, "justification": "..."}}, "c2_breadth": {{"value": 2, "confidence": 75, "justification": "..."}}, "c4_design_around_difficulty": {{"value": 1, "confidence": 65, "justification": "..."}}}}"""

PROMPT_B4_DETECTABILITY = """\
You are scoring a patent on infringement detectability. Read the inputs and return JSON.

TITLE: {title}
ABSTRACT: {abstract}
INDEPENDENT_CLAIM_1: {independent_claim_1}

ATTRIBUTES TO SCORE:

d1_external_detectability — integer 0-3. Ask: can infringement be confirmed by observing the product WITHOUT opening it?
- 3: Visible in UI, marketed feature, public spec sheet, or measurable from outputs (e.g., a specific protocol behavior on the wire).
- 2: Detectable from network traffic capture or external instrumentation.
- 1: Detectable only with significant external testing.
- 0: Requires teardown or internal access.

d2_teardown_detectability — integer 0-3. Ask: if I tear down the product, can I see the claimed element?
- 3: Visible in standard teardown (circuit traces, chip die markings, mechanical components).
- 2: Detectable with electrical probing or chip-level reverse engineering.
- 1: Detectable only with deep RE (decapping, firmware dump).
- 0: Process-internal — no teardown reveals it (e.g., a manufacturing process step).
Defaults: apparatus and chip-layout claims usually score 2-3; pure-software-method claims usually 0-1.

Return ONLY valid JSON. Each field must be an object with "value", "confidence" (0-100), "justification" (one sentence):
{{"d1_external_detectability": {{"value": 1, "confidence": 70, "justification": "..."}}, "d2_teardown_detectability": {{"value": 2, "confidence": 75, "justification": "..."}}}}"""

PROMPT_B5_THEMES = """\
You are scoring a patent on convergence themes, technology generation, and cross-industry applicability. Read the inputs and return JSON.

TITLE: {title}
ABSTRACT: {abstract}
INDEPENDENT_CLAIM_1: {independent_claim_1}
BACKGROUND_OR_FIELD: {background_or_field}

ATTRIBUTES TO SCORE:

g1_convergence_theme — comma-separated tags from this fixed dictionary ONLY (use only tags from this list; if none fit, return ""):
"AI+healthcare", "Edge AI", "AR/VR", "AI+chip-design", "Robotics+CV", "Quantum", "Sustainability+materials", "AI+industrial", "Web3", "Spatial computing", "AI+security", "AI+finance"
Up to 2 tags. Only tag if the patent clearly fits.

g2_generation_tag — exactly one of: Legacy, Current, Next-gen, or "" (empty) if the technology doesn't have a clean generation mapping.
- Legacy: tied to a superseded generation still in service but on decline (e.g., 4G LTE in 2026, USB 2.0)
- Current: tied to the dominant deployed generation (5G NR, USB 3.x, Wi-Fi 6)
- Next-gen: tied to the emerging or pre-deployment generation (6G research, Wi-Fi 8, USB4 v2)
- "": for non-generation-tagged tech (materials, basic algorithms, mechanical systems)

g3_cross_industry_applicability — integer 0-3. Count plausible target industries from this fixed list:
Consumer Electronics, Automotive, Healthcare, Industrial/Manufacturing, Telecom, Energy, Aerospace, FinTech, AgTech, Defense
- 3: 4+ industries; 2: 3 industries; 1: 2 industries; 0: single industry only

Return ONLY valid JSON. Each field must be an object with "value", "confidence" (0-100), "justification" (one sentence):
{{"g1_convergence_theme": {{"value": "", "confidence": 50, "justification": "..."}}, "g2_generation_tag": {{"value": "Current", "confidence": 80, "justification": "..."}}, "g3_cross_industry_applicability": {{"value": 2, "confidence": 75, "justification": "..."}}}}"""

PROMPT_B6_CLAIM_QUALITY = """\
You are scoring a patent on claim language quality and infringement-actor risk. Read the inputs and return JSON.

INDEPENDENT_CLAIM_1: {independent_claim_1}
INDEPENDENT_CLAIM_OTHERS: {independent_claim_others}

ATTRIBUTES TO SCORE:

h1_claim_strength — integer 0-3.
- 3: Clean, definite claim language; clear antecedent basis for all terms; structurally clean; dependent claims (if listed) provide layered fallbacks.
- 2: Minor ambiguity but enforceable. One term might invite claim construction dispute.
- 1: Vague terms, weak antecedent basis, multiple ambiguous limitations.
- 0: Ambiguous, indefinite, or internally inconsistent.
Specifically check for: antecedent basis violations, functional language without sufficient structure, relative terms without baselines, open-ended ranges.

h4_divided_infringement_risk — integer 0-3. Identify who performs each step/action.
- 3: All claim steps performed by a single actor. Apparatus claims default to 3.
- 2: Claim steps performed by a single actor with minor user interaction.
- 1: Claim steps require two parties (e.g., client + server with no clear "single mastermind").
- 0: Explicit multi-party performance with no joint enterprise — high enforcement risk.

Return ONLY valid JSON. Each field must be an object with "value", "confidence" (0-100), "justification" (one sentence):
{{"h1_claim_strength": {{"value": 2, "confidence": 80, "justification": "..."}}, "h4_divided_infringement_risk": {{"value": 3, "confidence": 85, "justification": "..."}}}}"""

PROMPT_B7_MARKET_SIGNALS = """\
You are scoring a patent on market-facing signals: implementation maturity, adjacent-market re-read, and workaround complexity. Read the inputs and return JSON.

TITLE: {title}
ABSTRACT: {abstract}
INDEPENDENT_CLAIM_1: {independent_claim_1}
BACKGROUND_OR_FIELD: {background_or_field}

ATTRIBUTES TO SCORE:

i2_implementation_maturity — exactly one of: "Idea-only", "Prototyped", "Productized".
- Idea-only: Specification describes a concept with no working example, no experimental data, no specific embodiment.
- Prototyped: Specification or background references a working prototype, lab demo, or research publication.
- Productized: Specification names a commercial product, or there is external evidence a product implementing this exists.
Note: You cannot verify productization from external sources. If marking "Productized" based on text alone, flag verification needed.

i3_adjacent_market_reread — integer 0-3.
- 3: Claim language is industry-agnostic AND clearly reads on 2+ adjacent industries beyond the target.
- 2: Re-read plausible in one adjacent industry with no claim contortion.
- 1: Re-read possible but requires aggressive interpretation.
- 0: Claim language ties it tightly to one industry.

i4_workaround_complexity — integer 0-3. Engineering effort to ship a non-infringing alternative.
- 3: Deep redesign — claim covers the natural/efficient approach; alternatives are expensive or technically inferior.
- 2: Significant redesign — alternatives exist but are commercially undesirable.
- 1: Minor redesign — straightforward alternative available.
- 0: Trivial workaround — designers can easily substitute.

Return ONLY valid JSON. Each field must be an object with "value", "confidence" (0-100), "justification" (one sentence):
{{"i2_implementation_maturity": {{"value": "Prototyped", "confidence": 70, "justification": "..."}}, "i3_adjacent_market_reread": {{"value": 2, "confidence": 75, "justification": "..."}}, "i4_workaround_complexity": {{"value": 2, "confidence": 70, "justification": "..."}}}}"""


def seed_prompts(apps, schema_editor):
    AnalysisPromptTemplate = apps.get_model('analytics', 'AnalysisPromptTemplate')
    import uuid
    for section, description, prompt_text in [
        (
            'group_b_standards',
            'Standards & Ecosystem — scores B1, B2 (requires SSO verification), B3. '
            'Placeholders: {title}, {abstract}, {independent_claim_1}, {independent_claim_others}, {background_or_field}',
            PROMPT_B2_STANDARDS,
        ),
        (
            'group_c_claim_analysis',
            'Claim Analysis — scores C1 (claim type), C2 (breadth), C4 (design-around difficulty). '
            'Placeholders: {independent_claim_1}, {independent_claim_others}',
            PROMPT_B3_CLAIM_ANALYSIS,
        ),
        (
            'group_d_detectability',
            'Detectability — scores D1 (external) and D2 (teardown). '
            'Placeholders: {title}, {abstract}, {independent_claim_1}',
            PROMPT_B4_DETECTABILITY,
        ),
        (
            'group_g_themes',
            'Themes & Generation — scores G1 (convergence theme), G2 (generation tag), G3 (cross-industry). '
            'Placeholders: {title}, {abstract}, {independent_claim_1}, {background_or_field}',
            PROMPT_B5_THEMES,
        ),
        (
            'group_h_quality',
            'Claim Quality — scores H1 (claim strength) and H4 (divided infringement risk). '
            'Placeholders: {independent_claim_1}, {independent_claim_others}',
            PROMPT_B6_CLAIM_QUALITY,
        ),
        (
            'group_i_market',
            'Market Signals — scores I2 (implementation maturity), I3 (adjacent market re-read), I4 (workaround complexity). '
            'Placeholders: {title}, {abstract}, {independent_claim_1}, {background_or_field}',
            PROMPT_B7_MARKET_SIGNALS,
        ),
    ]:
        if not AnalysisPromptTemplate.objects.filter(section=section, version=1).exists():
            AnalysisPromptTemplate.objects.create(
                id=uuid.uuid4(),
                section=section,
                category='general',
                version=1,
                prompt_text=prompt_text,
                description=description,
                is_active=True,
            )


def unseed_prompts(apps, schema_editor):
    AnalysisPromptTemplate = apps.get_model('analytics', 'AnalysisPromptTemplate')
    AnalysisPromptTemplate.objects.filter(
        section__in=[
            'group_b_standards', 'group_c_claim_analysis', 'group_d_detectability',
            'group_g_themes', 'group_h_quality', 'group_i_market',
        ],
        version=1,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0023_seed_bundle_prompts'),
    ]

    operations = [
        migrations.AddField(
            model_name='patentbundleattributes',
            name='ai_confidence_scores',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(seed_prompts, unseed_prompts),
    ]
