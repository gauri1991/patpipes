"""
Management command: seed_sales_packages

Creates two sample AnalyticsProjects, each with a PatentDataset, realistic
PatentRecord rows, and a SalesPackage:
  - "5G Communication Technology Portfolio"  — 10 patents, NPE-LIC, license
  - "AI/ML Edge Computing Bundle"            —  5 patents, OC-DEF, sale

Usage:
    python manage.py seed_sales_packages
    python manage.py seed_sales_packages --clear   # wipe seed data first
"""

from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from domains.accounts.models import Organization
from domains.analytics.models import (
    AnalyticsProject,
    PatentDataset,
    PatentRecord,
    SalesPackage,
)

User = get_user_model()

# ---------------------------------------------------------------------------
# Patent definitions
# ---------------------------------------------------------------------------

PATENTS_5G = [
    {
        'patent_id': 'US10412598B2',
        'title': 'Beamforming Method and Apparatus for Massive MIMO in 5G NR',
        'abstract': (
            'A beamforming method for massive multiple-input multiple-output (MIMO) '
            'systems in 5G New Radio (NR) networks, enabling high-throughput '
            'millimeter-wave transmission via codebook-based precoding.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Zhang, Wei; Park, Joon-Ho; Müller, Andreas',
        'filing_date': date(2017, 3, 14),
        'grant_date': date(2019, 9, 10),
        'ipc_classification': 'H04B 7/0456; H04W 16/28',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 43,
        'backward_citations': 28,
        'independent_claims_count': 4,
        'dependent_claims_count': 16,
    },
    {
        'patent_id': 'US10623150B2',
        'title': 'Dynamic Spectrum Sharing between LTE and NR in Sub-6GHz Bands',
        'abstract': (
            'Systems and methods for dynamic spectrum sharing (DSS) that enable '
            'simultaneous LTE and 5G NR operation on the same frequency band '
            'through resource allocation negotiation and interference mitigation.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Kim, Sung-Jin; López, Carlos; Wang, Fang',
        'filing_date': date(2018, 1, 22),
        'grant_date': date(2020, 4, 14),
        'ipc_classification': 'H04W 16/14; H04W 72/04',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 61,
        'backward_citations': 35,
        'independent_claims_count': 3,
        'dependent_claims_count': 12,
    },
    {
        'patent_id': 'US10833797B2',
        'title': 'Channel State Information Feedback Compression Using Deep Learning',
        'abstract': (
            'A neural network-based CSI compression and feedback scheme for '
            'FDD massive MIMO, reducing uplink overhead while maintaining '
            'beamforming gain through learned encoder-decoder architectures.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Chen, Li; Novak, Peter; Yamamoto, Kenji',
        'filing_date': date(2018, 6, 30),
        'grant_date': date(2020, 11, 10),
        'ipc_classification': 'H04B 7/04; G06N 3/04',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 38,
        'backward_citations': 41,
        'independent_claims_count': 5,
        'dependent_claims_count': 20,
    },
    {
        'patent_id': 'US11012283B2',
        'title': 'Ultra-Reliable Low Latency Communication Scheduling for Industrial IoT',
        'abstract': (
            'A scheduling framework for URLLC in 5G NR that minimizes end-to-end '
            'latency for industrial automation applications through mini-slot '
            'transmission and proactive retransmission.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Petrov, Ivan; García, María; Suzuki, Hiroshi',
        'filing_date': date(2019, 2, 8),
        'grant_date': date(2021, 5, 18),
        'ipc_classification': 'H04W 72/12; H04L 5/00',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 27,
        'backward_citations': 22,
        'independent_claims_count': 4,
        'dependent_claims_count': 14,
    },
    {
        'patent_id': 'US11190997B2',
        'title': 'Network Slicing Resource Orchestration for Heterogeneous 5G Services',
        'abstract': (
            'An orchestration framework for 5G network slicing that dynamically '
            'allocates radio and core network resources across eMBB, URLLC, and '
            'mMTC service types using reinforcement learning-based policies.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Hassan, Omar; Lindqvist, Erik; Zhao, Qing',
        'filing_date': date(2019, 7, 19),
        'grant_date': date(2021, 11, 30),
        'ipc_classification': 'H04W 28/02; H04L 12/14',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 52,
        'backward_citations': 31,
        'independent_claims_count': 6,
        'dependent_claims_count': 18,
    },
    {
        'patent_id': 'US11381998B2',
        'title': 'Uplink Power Control Method for Multi-Cell Coordination in 5G',
        'abstract': (
            'A distributed uplink power control method that coordinates interference '
            'across multiple 5G NR cells using message-passing algorithms and '
            'fractional power control with inter-cell signaling.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Fernandez, Luisa; Park, Min-Soo; Okonkwo, Chidi',
        'filing_date': date(2020, 1, 14),
        'grant_date': date(2022, 7, 5),
        'ipc_classification': 'H04W 52/14; H04W 52/24',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 19,
        'backward_citations': 29,
        'independent_claims_count': 3,
        'dependent_claims_count': 11,
    },
    {
        'patent_id': 'US11476900B2',
        'title': 'Reconfigurable Intelligent Surface Assisted Millimeter-Wave Beamforming',
        'abstract': (
            'Reconfigurable intelligent surface (RIS) control methods for passive '
            'beamforming at mmWave frequencies, enabling non-line-of-sight coverage '
            'extension in 5G deployments via phase-shift optimization.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Basar, Ertugrul; Liu, Ying; Schmidt, Klaus',
        'filing_date': date(2020, 5, 29),
        'grant_date': date(2022, 10, 18),
        'ipc_classification': 'H04B 7/0413; H04B 7/04',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 34,
        'backward_citations': 47,
        'independent_claims_count': 5,
        'dependent_claims_count': 17,
    },
    {
        'patent_id': 'US11588532B2',
        'title': 'Integrated Access and Backhaul for 5G Small Cell Deployment',
        'abstract': (
            'An IAB architecture enabling wireless backhaul for small cell networks '
            'in 5G NR, sharing spectrum between access and backhaul links through '
            'time-division multiplexing and topology adaptation.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Giordano, Silvia; Nakamura, Takehiro; Reyes, Juan',
        'filing_date': date(2020, 9, 3),
        'grant_date': date(2023, 2, 21),
        'ipc_classification': 'H04W 84/04; H04B 7/14',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 16,
        'backward_citations': 38,
        'independent_claims_count': 4,
        'dependent_claims_count': 13,
    },
    {
        'patent_id': 'US11770796B2',
        'title': 'Joint Communication and Sensing Waveform Design for 5G/6G',
        'abstract': (
            'Dual-function radar-communication (DFRC) waveform designs using OFDM '
            'modulation for simultaneous high-rate data transmission and environment '
            'sensing in 5G/6G networks, with adaptive precoding for interference mitigation.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Fan, Lei; Morimoto, Akira; Kaltenbach, Julia',
        'filing_date': date(2021, 3, 15),
        'grant_date': date(2023, 9, 26),
        'ipc_classification': 'H04L 27/26; G01S 13/34',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 11,
        'backward_citations': 52,
        'independent_claims_count': 6,
        'dependent_claims_count': 22,
    },
    {
        'patent_id': 'US11943787B2',
        'title': 'Energy-Efficient Base Station Sleep Mode Coordination in Dense Networks',
        'abstract': (
            'Cooperative sleep mode control for base stations in dense 5G networks, '
            'using traffic prediction and user mobility models to activate or deactivate '
            'cells while ensuring seamless coverage and service continuity.'
        ),
        'assignee': 'TeleCore Technologies Inc.',
        'inventor': 'Patel, Rohan; Björnsson, Emil; Sato, Yuki',
        'filing_date': date(2021, 8, 22),
        'grant_date': date(2024, 4, 2),
        'ipc_classification': 'H04W 52/02; H04W 36/22',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 8,
        'backward_citations': 33,
        'independent_claims_count': 4,
        'dependent_claims_count': 15,
    },
]

PATENTS_AI_EDGE = [
    {
        'patent_id': 'US10891540B2',
        'title': 'On-Device Federated Learning with Differential Privacy Guarantees',
        'abstract': (
            'A federated learning framework for IoT edge devices that aggregates '
            'model updates without exposing raw data, using differential privacy '
            'noise injection and secure aggregation protocols.'
        ),
        'assignee': 'EdgeMind Systems LLC',
        'inventor': 'Rao, Priya; Chen, David; Nakagawa, Tomoki',
        'filing_date': date(2019, 4, 11),
        'grant_date': date(2021, 1, 12),
        'ipc_classification': 'G06N 20/00; H04L 9/00',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 72,
        'backward_citations': 39,
        'independent_claims_count': 5,
        'dependent_claims_count': 19,
    },
    {
        'patent_id': 'US11132601B2',
        'title': 'Neural Architecture Search for Resource-Constrained Edge Inference',
        'abstract': (
            'Automated neural architecture search (NAS) methods targeting sub-10ms '
            'inference latency on edge microcontrollers, using multi-objective '
            'optimization balancing accuracy, model size, and energy consumption.'
        ),
        'assignee': 'EdgeMind Systems LLC',
        'inventor': 'Torres, Elena; Kim, Hwan; Bauer, Stefan',
        'filing_date': date(2019, 10, 3),
        'grant_date': date(2021, 9, 28),
        'ipc_classification': 'G06N 3/04; G06F 9/50',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 58,
        'backward_citations': 44,
        'independent_claims_count': 4,
        'dependent_claims_count': 16,
    },
    {
        'patent_id': 'US11341397B2',
        'title': 'Heterogeneous Computing Scheduler for Real-Time AI Inference on Edge SoCs',
        'abstract': (
            'A runtime scheduler for systems-on-chip combining CPU, GPU, and NPU '
            'cores that partitions DNN workloads across heterogeneous compute units '
            'to meet hard real-time deadlines with minimal energy overhead.'
        ),
        'assignee': 'EdgeMind Systems LLC',
        'inventor': 'Vasquez, Rodrigo; Obi, Chukwuemeka; Tanaka, Rina',
        'filing_date': date(2020, 6, 18),
        'grant_date': date(2022, 5, 24),
        'ipc_classification': 'G06F 9/50; G06N 3/063',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 33,
        'backward_citations': 28,
        'independent_claims_count': 3,
        'dependent_claims_count': 14,
    },
    {
        'patent_id': 'US11610086B2',
        'title': 'Quantization-Aware Training for INT4 Neural Network Deployment',
        'abstract': (
            'Training methods enabling 4-bit integer quantization of deep neural '
            'networks with minimal accuracy loss, using learned step-size quantizers '
            'and mixed-precision layer selection to maximize hardware throughput.'
        ),
        'assignee': 'EdgeMind Systems LLC',
        'inventor': 'Park, Ji-Yeon; Magnusson, Lars; Gupta, Arjun',
        'filing_date': date(2021, 1, 27),
        'grant_date': date(2023, 3, 21),
        'ipc_classification': 'G06N 3/04; G06N 3/063',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 24,
        'backward_citations': 51,
        'independent_claims_count': 6,
        'dependent_claims_count': 18,
    },
    {
        'patent_id': 'US11822844B2',
        'title': 'Adaptive Model Caching and Offloading for Multi-Tenant Edge AI Platforms',
        'abstract': (
            'A model management system for multi-tenant edge AI platforms that '
            'dynamically caches, evicts, and offloads neural network models across '
            'edge nodes based on request frequency, SLA requirements, and thermal limits.'
        ),
        'assignee': 'EdgeMind Systems LLC',
        'inventor': 'Hoffman, Claire; Adesanya, Babatunde; Iwata, Shingo',
        'filing_date': date(2021, 9, 14),
        'grant_date': date(2023, 11, 21),
        'ipc_classification': 'G06F 9/50; G06N 20/00',
        'country_code': 'US',
        'patent_type': 'Utility',
        'legal_status': 'Active',
        'forward_citations': 14,
        'backward_citations': 36,
        'independent_claims_count': 5,
        'dependent_claims_count': 20,
    },
]

# ---------------------------------------------------------------------------
# Package definitions
# ---------------------------------------------------------------------------

PACKAGES = [
    {
        'project': {
            'name': '5G Communication Technology Portfolio',
            'description': (
                'Core 5G NR patent portfolio covering beamforming, spectrum management, '
                'URLLC scheduling, network slicing, and RIS-assisted communications. '
                'Priority assets for licensing to major telecom OEMs and network operators.'
            ),
            'status': 'active',
            'priority': 'high',
        },
        'dataset': {
            'name': '5G Portfolio — USPTO Export Q1 2024',
            'description': 'USPTO bulk export of granted 5G communication patents through Q1 2024.',
            'data_source': 'odp_import',
        },
        'patents': PATENTS_5G,
        'package': {
            'name': '5G Core IP Licensing Bundle',
            'description': (
                'Ten granted US patents covering 5G NR beamforming, DSS, URLLC, '
                'network slicing, RIS, IAB, ISAC, and energy management. '
                'Structured for SEP licensing with trilateral coverage in EU and JP.'
            ),
            'transaction_type': 'license',
            'status': 'ready',
            'primary_archetype': 'NPE-LIC',
            'secondary_archetype': 'OC-OFF',
            'listing_pattern': 'A',
            'asking_price': '45000000.00',
            'royalty_rate': '0.0250',
            'buyer_targets': (
                'Ericsson, Nokia Networks, Samsung Networks, Huawei Technologies, '
                'Qualcomm, MediaTek, T-Mobile, Verizon, AT&T'
            ),
            'notes': (
                'Portfolio SEP-declared against 3GPP Release 15/16/17. '
                'Strong prosecution history — no prior IPR challenges. '
                'Trilateral coverage: US + EP + JP for 7 of 10 assets.'
            ),
            'bundle_codes': [
                'SEP', 'HIGH_CITATION', 'BATTLE_TESTED', 'CONTINUATION_LIVE',
                'CONVERGENT_THEME', 'EOU_BACKED', 'LIFECYCLE',
            ],
            'mcl_entries': [
                {
                    'id': '1',
                    'claim': '5G patent licensing market reached $12B in 2023',
                    'source': 'IPlytics Market Report 2024',
                    'tier': 'T4',
                },
                {
                    'id': '2',
                    'claim': 'Global 5G subscriptions exceeded 1.5B by end of 2023',
                    'source': 'Ericsson Mobility Report Q4 2023',
                    'tier': 'T4',
                },
                {
                    'id': '3',
                    'claim': '3GPP 5G NR standard covers over 90,000 declared SEPs as of 2024',
                    'source': 'IPlytics SEP Tracker 2024',
                    'tier': 'T4',
                },
            ],
            'generated_teaser': (
                'Ten granted US patents covering the full 5G NR radio stack — from '
                'massive MIMO beamforming and dynamic spectrum sharing through URLLC '
                'scheduling, network slicing, and reconfigurable intelligent surfaces. '
                'Trilateral US/EP/JP coverage across 7 assets with clean prosecution history '
                'and no prior IPR challenges. Ideal for SEP portfolio licensing to OEMs '
                'and network operators entering Release 15/16/17 commercialization.'
            ),
        },
    },
    {
        'project': {
            'name': 'AI/ML Edge Computing Bundle',
            'description': (
                'Edge AI patent portfolio covering federated learning, neural architecture '
                'search, heterogeneous computing, quantization, and multi-tenant model '
                'management. Defensive aggregation play for edge SoC manufacturers.'
            ),
            'status': 'active',
            'priority': 'medium',
        },
        'dataset': {
            'name': 'Edge AI Patents — Internal Dataset v1',
            'description': 'Curated set of edge AI and ML patents from internal IP audit.',
            'data_source': 'manual_upload',
        },
        'patents': PATENTS_AI_EDGE,
        'package': {
            'name': 'Edge AI Core Technology Package',
            'description': (
                'Five granted US patents covering on-device federated learning, '
                'automated neural architecture search, heterogeneous SoC scheduling, '
                'INT4 quantization-aware training, and adaptive model management. '
                'Outright sale — ideal defensive acquisition for edge SoC vendors.'
            ),
            'transaction_type': 'sale',
            'status': 'draft',
            'primary_archetype': 'OC-DEF',
            'secondary_archetype': 'DEF-AGG',
            'listing_pattern': 'C',
            'asking_price': '18500000.00',
            'buyer_targets': (
                'Arm Holdings, NVIDIA, Qualcomm, Apple, Intel, Renesas Electronics, '
                'NXP Semiconductors, STMicroelectronics'
            ),
            'notes': (
                'All five patents have strong forward citation counts above sector median. '
                'No encumbrances or licensing commitments. '
                'Clean chain of title from individual inventors to EdgeMind Systems LLC.'
            ),
            'bundle_codes': [
                'HIGH_CITATION', 'ALGO_SOFTWARE', 'CLAIM_TYPE', 'DEFENSIVE', 'DETECTABILITY',
            ],
            'mcl_entries': [
                {
                    'id': '1',
                    'claim': 'Edge AI chip market projected to reach $51B by 2030',
                    'source': 'Grand View Research Edge AI Market Report 2023',
                    'tier': 'T4',
                },
                {
                    'id': '2',
                    'claim': 'On-device inference shipments to exceed 1.8B units in 2025',
                    'source': 'ABI Research Edge Intelligence 2024',
                    'tier': 'T4',
                },
            ],
            'generated_teaser': (
                'Five granted US patents at the core of edge AI deployment: federated '
                'learning with differential privacy, hardware-aware NAS, heterogeneous '
                'SoC scheduling, INT4 quantization-aware training, and multi-tenant model '
                'management. Strong forward citations (14–72) across all assets with clean '
                'chain of title. Positioned for defensive acquisition by edge SoC vendors '
                'ahead of the 2025–2026 on-device AI volume ramp.'
            ),
        },
    },
]


class Command(BaseCommand):
    help = 'Seed two sample SalesPackage records (10-patent and 5-patent bundles)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete previously seeded data before re-seeding',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        # ── Org & user ───────────────────────────────────────────────────────
        org, _ = Organization.objects.get_or_create(
            name='Demo Organization',
            defaults=dict(
                email='demo@example.com',
                subscription_plan='basic',
                is_active=True,
            ),
        )

        user, created = User.objects.get_or_create(
            username='demo_user',
            defaults=dict(
                email='demo@example.com',
                first_name='Sarah',
                last_name='Winters',
                organization=org,
                is_active=True,
            ),
        )
        verb = 'Created' if created else 'Found'
        self.stdout.write(f'  {verb} user: {user.get_full_name() or user.username}')

        # ── Optional clear ───────────────────────────────────────────────────
        if options['clear']:
            project_names = [p['project']['name'] for p in PACKAGES]
            deleted, _ = AnalyticsProject.objects.filter(
                name__in=project_names, created_by=user
            ).delete()
            self.stdout.write(self.style.WARNING(
                f'  Deleted existing seed data ({deleted} objects)'
            ))

        # ── Create packages ──────────────────────────────────────────────────
        for spec in PACKAGES:
            proj_spec = spec['project']
            ds_spec = spec['dataset']
            patent_specs = spec['patents']
            pkg_spec = spec['package']

            # Project
            project, proj_created = AnalyticsProject.objects.get_or_create(
                name=proj_spec['name'],
                created_by=user,
                defaults=dict(
                    description=proj_spec['description'],
                    status=proj_spec['status'],
                    priority=proj_spec['priority'],
                    start_date=timezone.now(),
                    analysis_scope={'category': 'sales_package'},
                ),
            )
            action = 'Created' if proj_created else 'Found'
            self.stdout.write(f'  {action} project: {project.name}')

            # Dataset
            dataset, ds_created = PatentDataset.objects.get_or_create(
                project=project,
                name=ds_spec['name'],
                defaults=dict(
                    description=ds_spec['description'],
                    data_source=ds_spec['data_source'],
                    processing_status='completed',
                    processing_progress=100,
                    total_patents=len(patent_specs),
                    processed_patents=len(patent_specs),
                    created_by=user,
                ),
            )
            action = 'Created' if ds_created else 'Found'
            self.stdout.write(f'    {action} dataset: {dataset.name}')

            # PatentRecords
            for row_num, pat in enumerate(patent_specs, start=1):
                _, rec_created = PatentRecord.objects.get_or_create(
                    dataset=dataset,
                    patent_id=pat['patent_id'],
                    defaults=dict(
                        title=pat['title'],
                        abstract=pat['abstract'],
                        assignee=pat['assignee'],
                        inventor=pat['inventor'],
                        filing_date=pat['filing_date'],
                        grant_date=pat['grant_date'],
                        ipc_classification=pat['ipc_classification'],
                        country_code=pat['country_code'],
                        patent_type=pat['patent_type'],
                        legal_status=pat['legal_status'],
                        forward_citations=pat['forward_citations'],
                        backward_citations=pat['backward_citations'],
                        independent_claims_count=pat['independent_claims_count'],
                        dependent_claims_count=pat['dependent_claims_count'],
                        row_number=row_num,
                        raw_data={
                    k: (v.isoformat() if isinstance(v, date) else v)
                    for k, v in pat.items()
                },
                    ),
                )
                status = 'Created' if rec_created else 'Found'
                self.stdout.write(f'      {status} patent: {pat["patent_id"]} — {pat["title"][:60]}')

            # SalesPackage
            pkg, pkg_created = SalesPackage.objects.get_or_create(
                project=project,
                name=pkg_spec['name'],
                defaults=dict(
                    description=pkg_spec['description'],
                    transaction_type=pkg_spec['transaction_type'],
                    status=pkg_spec['status'],
                    primary_archetype=pkg_spec['primary_archetype'],
                    secondary_archetype=pkg_spec['secondary_archetype'],
                    listing_pattern=pkg_spec['listing_pattern'],
                    asking_price=pkg_spec.get('asking_price'),
                    royalty_rate=pkg_spec.get('royalty_rate'),
                    buyer_targets=pkg_spec.get('buyer_targets', ''),
                    notes=pkg_spec.get('notes', ''),
                    bundle_codes=pkg_spec['bundle_codes'],
                    mcl_entries=pkg_spec.get('mcl_entries', []),
                    generated_teaser=pkg_spec.get('generated_teaser', ''),
                    created_by=user,
                ),
            )
            action = 'Created' if pkg_created else 'Found'
            self.stdout.write(self.style.SUCCESS(
                f'    {action} sales package: "{pkg.name}" '
                f'({len(patent_specs)} patents, {pkg.get_transaction_type_display()})'
            ))

        self.stdout.write(self.style.SUCCESS('\nDone. Seeded 2 sales packages.'))
