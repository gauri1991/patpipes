from django.db import migrations

BUNDLE_TYPES = [
    (1,  'TECH_DOMAIN',       'Technology Domain',
     'Concentrated coverage in one technical field.',
     'A1 populated', 1),
    (2,  'SEP',               'Standards-Essential Patents',
     'Bundle every implementer of a standard must license.',
     'B1 >= sep_b1_cutoff AND B2 populated', 1),
    (3,  'PRODUCT_ARCH',      'Product Architecture',
     '"Build a product" kit — full vertical coverage across subsystems.',
     'A4 populated', 1),
    (4,  'STACK_LAYER',       'Stack Layer',
     'Targets buyers operating at a specific technology stack layer.',
     'A3 populated', 1),
    (5,  'USE_CASE',          'Use-Case',
     'All tools to address one customer problem.',
     'A5 populated', 1),
    (6,  'MANUFACTURING',     'Manufacturing / Process',
     'Targets fabs, contract manufacturers, and equipment makers.',
     'A1 contains "process/fab/manufac" AND C1=Method', 1),
    (7,  'MATERIALS_CHEM',    'Materials & Chemistry',
     'Focused IP shield around composition, synthesis, and use of a material system.',
     'A1 contains "material/chem/battery/electrolyte/polymer" AND C1 in {Apparatus,Method}', 1),
    (8,  'ALGO_SOFTWARE',     'Algorithm / Software',
     'Implementation-agnostic methods deployable across many products.',
     'A3 in {App,Middleware,Cloud} AND C1 in {Method,CRM}', 1),
    (9,  'INTEROPERABILITY',  'Interoperability',
     'Critical chokepoints for any player whose product must talk to others.',
     'B3 >= interface_b3_cutoff', 2),
    (10, 'GEN_ROADMAP',       'Generational Roadmap',
     'Buyer picks legacy (cheap defensive) or next-gen (forward-looking offensive).',
     'G2 populated', 2),
    (11, 'CLAIM_TYPE',        'Claim-Type',
     'Different enforcement profiles; buyers pick by litigation/licensing strategy.',
     'C1 populated', 2),
    (12, 'DETECTABILITY',     'Detectability',
     'Litigation-ready bundle — infringement is easy to spot.',
     'D1 >= detect_d1_cutoff OR D2 >= detect_d2_cutoff', 2),
    (13, 'GEOGRAPHIC',        'Geographic',
     'Aligned with the buyer\'s market footprint and enforcement venues.',
     'F2 = True (trilateral coverage)', 2),
    (14, 'FAMILY_TREE',       'Family-Tree',
     'Complete families together — avoids fragmented ownership.',
     'E1 >= family_e1_min', 2),
    (15, 'LIFECYCLE',         'Lifecycle / Term',
     'Long-life = strategic; short-life = immediate licensing.',
     'E4 > 0', 2),
    (16, 'FOUNDATIONAL',      'Foundational + Improvement',
     'Broad blocking claims with defensive narrow follow-ons.',
     'C2 = 3 OR C2 <= 1', 2),
    (17, 'CROSS_INDUSTRY',    'Cross-Industry',
     'Maximizes addressable buyer pool — many industries are potential acquirers.',
     'G3 >= cross_industry_g3_cutoff', 2),
    (18, 'CONVERGENT_THEME',  'Convergent Theme',
     'Aligns with current investment trends.',
     'G1 populated', 3),
    (19, 'DEFENSIVE',         'Defensive / Counter-Assertion',
     'Counter-assertion ammunition — defined by who the patents read on.',
     'D3 >= defensive_d3_cutoff', 3),
    (20, 'WHITESPACE',        'Whitespace / Design-Around',
     'Closes escape routes around a known core patent or feature.',
     'C4 >= whitespace_c4_cutoff AND A1 populated', 3),
    (21, 'PROSECUTION',       'Prosecution-Status',
     'Pending applications offer claim-tailoring flexibility.',
     'E2 = Pending OR E3 = True', 3),
    (22, 'ANCHOR_HALO',       'Anchor-and-Halo',
     'One or two strong anchors fortified by narrower halo patents.',
     'H1 >= anchor_h1_cutoff AND C2 >= 1', 4),
    (23, 'PICKET_FENCE',      'Picket-Fence / Cluster-Around-Standard',
     'Multiple narrow patents collectively encircling a known technology.',
     'C4 >= 1 AND (A1 OR B2 populated)', 4),
    (24, 'STRONG_CORE_TAIL',  'Strong-Core + Quality-Diluted Tail',
     'High-quality anchors carry the bundle while a tail provides volume.',
     'A1 populated (deliberate mix of high/low H1 in same A1)', 4),
    (25, 'CONTINUATION_LIVE', 'Continuation-Live',
     'Buyer can shape future claims to match a specific target product.',
     'E3 = True', 4),
    (26, 'EOU_BACKED',        'EoU-Backed / Litigation-Ready',
     'Every patent ships with an Evidence-of-Use claim chart.',
     'H9 in {Partial, Full}', 5),
    (27, 'BATTLE_TESTED',     'Survived-Challenge / Battle-Tested',
     'Reduces buyer\'s invalidity risk — assets are legally vetted.',
     'H7 = Survived', 5),
    (28, 'CLEAN_TITLE',       'Clean-Chain-of-Title',
     'Transacts faster and with lower legal cost.',
     'H8 = Clean AND H10 = None', 5),
    (29, 'HIGH_CITATION',     'High-Citation / Technical-Influence',
     'Forward citations signal technical importance and reveal target companies.',
     'H5 >= high_citation_h5_min', 5),
    (30, 'ADJACENT_REREAD',   'Adjacent-Industry Re-Read',
     'Gives the buyer a "second-life" thesis — opens new buyer pools.',
     'I3 >= 2 AND G3 >= 2', 5),
    (31, 'SALVAGE',           'Salvage / Defensive-Volume Lot',
     'Volume lot of weak, narrow, or near-expiry patents for defensive aggregators.',
     'H1 <= salvage_h1_max OR E4 < salvage_e4_max OR H2 <= salvage_h2_max', 5),
    (32, 'PRE_EXPIRY',        'Pre-Expiry / Last-Window',
     'Buyers running short-cycle licensing campaigns.',
     'pre_expiry_min_years <= E4 <= pre_expiry_max_years', 5),
    (33, 'PROVENANCE',        'Provenance-Coherent',
     'Shared specifications reduce claim-construction risk.',
     'A1 populated AND A4 populated', 5),
]


def seed_bundle_types(apps, schema_editor):
    BundleType = apps.get_model('analytics', 'BundleType')
    for row in BUNDLE_TYPES:
        num, code, name, desc, rule, layer = row
        BundleType.objects.update_or_create(
            id=num,
            defaults=dict(
                code=code,
                name=name,
                description=desc,
                routing_rule_summary=rule,
                display_order=num,
                is_active=True,
            )
        )


def unseed_bundle_types(apps, schema_editor):
    BundleType = apps.get_model('analytics', 'BundleType')
    BundleType.objects.filter(id__in=[r[0] for r in BUNDLE_TYPES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0016_patent_bundle_analysis'),
    ]

    operations = [
        migrations.RunPython(seed_bundle_types, reverse_code=unseed_bundle_types),
    ]
