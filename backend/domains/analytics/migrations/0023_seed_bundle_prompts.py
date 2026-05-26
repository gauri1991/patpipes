from django.db import migrations

EXTRACTION_PROMPT = """\
You are a patent analyst. Analyze the following patent and score it on the listed attributes.

PATENT:
{patent_text}

TASK: Return a JSON object with ONLY the following fields scored based on the patent text.
Use the descriptions as guidance. If you cannot determine a value from the text, use 0 or "" or "None" as appropriate.

FIELDS TO SCORE:
{fields_prompt}

Return ONLY valid JSON, no explanation. Example format:
{{"h1_claim_strength": 2, "h2_prior_art_exposure": 1, "h7_litigation_history": "None", ...}}"""

GROUP_A_PROMPT = """\
You are a patent technology analyst. Classify the following patent using the provided taxonomy.

PATENT:
{patent_text}

IPC Codes: {ipc_codes}
CPC Codes: {cpc_codes}

TAXONOMY (choose a1_primary_domain and a2_tech_subcategory from these names exactly):
{taxonomy_lines}

TASK: Return a JSON object with these 5 fields:
- "a1_primary_domain": The primary technology domain name -- must exactly match a name from the taxonomy list above
- "a2_tech_subcategory": A specific subcategory within that domain (2-4 words, can be free-form if taxonomy does not cover it)
- "a3_stack_layer": One of: App, Middleware, Cloud, Hardware, OS, Protocol, or "" if not applicable
- "a4_subsystem": The specific subsystem or component this patent targets (2-5 words, free-form)
- "a5_use_case": The primary use case or application (5-10 words, free-form)

Return ONLY valid JSON, no explanation:
{{"a1_primary_domain": "...", "a2_tech_subcategory": "...", "a3_stack_layer": "...", "a4_subsystem": "...", "a5_use_case": "..."}}"""


def seed_prompts(apps, schema_editor):
    AnalysisPromptTemplate = apps.get_model('analytics', 'AnalysisPromptTemplate')
    import uuid
    for section, description, prompt_text in [
        (
            'bundle_attribute_extraction',
            'Scores Groups H & I quality/vulnerability attributes plus A3/B1/C1/C2/C4/G3 fields from patent text. '
            'Placeholders: {patent_text}, {fields_prompt}',
            EXTRACTION_PROMPT,
        ),
        (
            'group_a_classification',
            'Classifies a patent into Group A technology fields (domain, subcategory, stack layer, subsystem, use case) '
            'using the GlobalTechnologyArea taxonomy. '
            'Placeholders: {patent_text}, {ipc_codes}, {cpc_codes}, {taxonomy_lines}',
            GROUP_A_PROMPT,
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
        section__in=['bundle_attribute_extraction', 'group_a_classification'],
        version=1,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0022_sales_package_v3_complete'),
    ]

    operations = [
        migrations.RunPython(seed_prompts, unseed_prompts),
    ]
