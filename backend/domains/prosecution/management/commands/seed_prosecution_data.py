"""
Management command: seed_prosecution_data

Creates 15 realistic US patent applications spanning all status types and
application types so the prosecution UI analytics, timeline, and docket
views have representative data to display.

Usage:
    python manage.py seed_prosecution_data
    python manage.py seed_prosecution_data --clear  # wipe seed apps first
"""

from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from domains.accounts.models import Organization, User
from domains.attorney.models import Attorney
from domains.prosecution.models import (
    Claim,
    OfficeAction,
    PatentApplication,
    ProsecutionDeadline,
    ProsecutionEvent,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def d(year, month, day):
    return date(year, month, day)


def _add_event(app, event_type, title, event_date, description='', is_completed=True,
               is_urgent=False, metadata=None, user=None):
    ProsecutionEvent.objects.get_or_create(
        application=app,
        event_type=event_type,
        event_date=event_date,
        defaults=dict(
            title=title,
            description=description,
            is_completed=is_completed,
            is_urgent=is_urgent,
            metadata=metadata or {},
            handled_by=user,
        ),
    )


def _add_claim(app, num, claim_type, text):
    Claim.objects.get_or_create(
        application=app,
        claim_number=num,
        defaults=dict(claim_type=claim_type, claim_text=text),
    )


def _add_deadline(app, deadline_type, title, due_date, priority='high',
                  description='', is_completed=False):
    ProsecutionDeadline.objects.get_or_create(
        application=app,
        deadline_type=deadline_type,
        title=title,
        defaults=dict(
            due_date=due_date,
            priority=priority,
            description=description,
            is_completed=is_completed,
        ),
    )


# ---------------------------------------------------------------------------
# Application definitions
# ---------------------------------------------------------------------------

APPLICATIONS = [

    # ── 1. Draft / Utility ──────────────────────────────────────────────────
    dict(
        title='Transformer-Based Document Summarization Using Hierarchical Attention',
        application_number='US18/412,301',
        attorney_key='bo_zeng',
        application_type='utility',
        jurisdiction='US',
        status='draft',
        priority_level='medium',
        technology_area='Artificial Intelligence',
        inventors=['Chen, Wei', 'Patel, Ananya'],
        assignees=['Luminara AI, Inc.'],
        ipc_classes=['G06F 40/56', 'G06N 3/04'],
        keywords=['transformer', 'NLP', 'attention mechanism', 'summarization'],
        abstract=(
            'A system and method for abstractive text summarization using a '
            'hierarchical attention transformer architecture. The system processes '
            'long documents by first encoding paragraph-level representations and '
            'then applying cross-attention across hierarchical levels to generate '
            'concise, faithful summaries.'
        ),
        filing_date=None,
        priority_date=None,
        events=[],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A computer-implemented system for document summarization comprising: '
             'a hierarchical encoder configured to generate paragraph-level and '
             'document-level representations from an input document; '
             'a cross-attention module configured to align hierarchical representations '
             'using multi-head attention; and '
             'a decoder configured to generate an abstractive summary based on the '
             'aligned representations.'),
            (2, 'dependent',
             'The system of claim 1, wherein the hierarchical encoder comprises a '
             'stack of transformer layers with local and global attention heads.'),
            (3, 'independent',
             'A computer-implemented method for document summarization comprising: '
             'encoding an input document into hierarchical representations at '
             'paragraph and document levels; applying cross-attention across '
             'hierarchical levels; and decoding an abstractive summary.'),
        ],
    ),

    # ── 2. Filed / Utility ──────────────────────────────────────────────────
    dict(
        title='Wearable Cardiac Monitor with AI-Driven Arrhythmia Detection',
        application_number='US17/923,874',
        attorney_key='harris_wolin',
        application_type='utility',
        jurisdiction='US',
        status='filed',
        priority_level='high',
        technology_area='Medical Devices',
        inventors=['Kim, Jae-Won', 'Ramirez, Elena', 'Thompson, Marcus R.'],
        assignees=['CardioSense Technologies, Inc.'],
        ipc_classes=['A61B 5/0402', 'A61B 5/363', 'G16H 50/20'],
        keywords=['wearable', 'ECG', 'arrhythmia', 'deep learning', 'cardiac monitoring'],
        abstract=(
            'A wearable cardiac monitor that acquires continuous electrocardiogram '
            'signals from a chest-worn patch and applies a convolutional neural network '
            'to classify arrhythmia events in real time. The device transmits '
            'classified events and raw ECG segments to a cloud platform for physician '
            'review, with battery life exceeding 14 days on a single charge.'
        ),
        filing_date=d(2022, 11, 15),
        priority_date=d(2022, 11, 15),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2022, 11, 15),
                 description='Utility application filed with USPTO, filing receipt received.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A wearable cardiac monitoring device comprising: '
             'a flexible substrate configured to adhere to a patient\'s chest; '
             'one or more electrodes configured to acquire electrocardiogram signals; '
             'a processor configured to execute a convolutional neural network to '
             'classify cardiac arrhythmias from the acquired signals in real time; and '
             'a wireless transceiver configured to transmit classified arrhythmia '
             'events to a remote server.'),
            (2, 'dependent',
             'The device of claim 1, wherein the convolutional neural network is '
             'trained on a dataset of labeled ECG recordings comprising at least '
             'five arrhythmia classes.'),
            (3, 'dependent',
             'The device of claim 1, further comprising a rechargeable battery '
             'configured to power the device for at least 14 days.'),
            (4, 'independent',
             'A method for cardiac arrhythmia detection comprising: '
             'acquiring electrocardiogram signals via skin-contact electrodes; '
             'processing the signals using a convolutional neural network executing '
             'on a wearable processor; classifying the processed signals into '
             'arrhythmia categories; and transmitting classification results wirelessly.'),
        ],
    ),

    # ── 3. Pending / Utility ────────────────────────────────────────────────
    dict(
        title='Solid-State Lithium-Sulfur Battery with Ceramic Electrolyte Separator',
        application_number='US17/655,041',
        attorney_key='prestin',
        application_type='utility',
        jurisdiction='US',
        status='pending',
        priority_level='high',
        technology_area='Energy Storage',
        inventors=['Zhang, Hui', 'Okonkwo, Emeka', 'Lindstrom, Britta'],
        assignees=['VoltCore Materials LLC'],
        ipc_classes=['H01M 10/0562', 'H01M 4/38', 'H01M 50/411'],
        keywords=['solid-state battery', 'lithium-sulfur', 'ceramic separator',
                  'energy density', 'solid electrolyte'],
        abstract=(
            'A solid-state lithium-sulfur battery cell incorporating a ceramic '
            'electrolyte separator that suppresses polysulfide shuttle and enables '
            'stable cycling at high sulfur loading. The separator comprises a '
            'garnet-type LLZO ceramic membrane functionalized with a lithiophilic '
            'coating to reduce interfacial resistance.'
        ),
        filing_date=d(2022, 3, 8),
        priority_date=d(2022, 3, 8),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2022, 3, 8),
                 description='Application filed, filing receipt issued March 10, 2022.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A solid-state electrochemical cell comprising: '
             'a lithium metal anode; '
             'a sulfur-carbon composite cathode having a sulfur loading of at least '
             '5 mg/cm²; '
             'a ceramic electrolyte separator comprising a garnet-type Li₇La₃Zr₂O₁₂ '
             'membrane; and '
             'a lithiophilic interfacial coating disposed between the anode and '
             'the ceramic electrolyte separator.'),
            (2, 'dependent',
             'The electrochemical cell of claim 1, wherein the lithiophilic '
             'interfacial coating comprises a ZnO or SnO₂ layer having a '
             'thickness of 1–50 nm.'),
            (3, 'dependent',
             'The electrochemical cell of claim 1, wherein the ceramic electrolyte '
             'separator has an ionic conductivity of at least 10⁻³ S/cm at 25°C.'),
            (4, 'independent',
             'A method of fabricating a solid-state lithium-sulfur cell comprising: '
             'sintering a garnet-type Li₇La₃Zr₂O₁₂ ceramic into a dense membrane; '
             'depositing a lithiophilic coating on a surface of the membrane; '
             'assembling the coated membrane between a lithium metal anode and a '
             'sulfur-carbon composite cathode.'),
        ],
    ),

    # ── 4. Under Examination / Utility ──────────────────────────────────────
    dict(
        title='Distributed Ledger System for Immutable Supply Chain Provenance',
        application_number='US17/512,883',
        attorney_key='marian',
        application_type='utility',
        jurisdiction='US',
        status='under_examination',
        priority_level='medium',
        technology_area='Blockchain / Distributed Systems',
        inventors=['Nakamura, Yuki', 'Osei, Kwame', 'Bergström, Lars'],
        assignees=['ChainTrace, Inc.'],
        ipc_classes=['G06F 21/64', 'H04L 9/00', 'G06Q 10/083'],
        keywords=['blockchain', 'supply chain', 'provenance', 'smart contract', 'IoT'],
        abstract=(
            'A supply chain provenance system using a permissioned distributed ledger '
            'to record immutable custody transfer events for physical goods. IoT '
            'sensor nodes sign transfer events with hardware-backed keys and submit '
            'transactions to the ledger via a gateway service, enabling end-to-end '
            'traceability from raw material to consumer.'
        ),
        filing_date=d(2021, 10, 27),
        priority_date=d(2021, 10, 27),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2021, 10, 27),
                 description='Application filed electronically via EFS-Web.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A supply chain provenance system comprising: '
             'a plurality of IoT sensor nodes each configured to generate signed '
             'custody transfer records using a hardware security module; '
             'a permissioned distributed ledger configured to store the custody '
             'transfer records as immutable transactions; '
             'a smart contract engine configured to validate transfer records and '
             'enforce provenance rules; and '
             'a query interface configured to retrieve an auditable chain of custody '
             'for a specified goods identifier.'),
            (2, 'dependent',
             'The system of claim 1, wherein the permissioned distributed ledger '
             'implements a Byzantine fault-tolerant consensus protocol.'),
            (3, 'dependent',
             'The system of claim 1, wherein each IoT sensor node comprises a '
             'hardware security module storing a private key certified by a '
             'certificate authority.'),
            (4, 'independent',
             'A method for supply chain provenance tracking comprising: '
             'generating a signed custody transfer record at an IoT sensor node; '
             'submitting the record to a permissioned distributed ledger; '
             'validating the record via a smart contract; and '
             'storing the validated record as an immutable transaction.'),
        ],
    ),

    # ── 5. Office Action (Non-Final) / Utility ───────────────────────────────
    dict(
        title='Adaptive Noise Cancellation System for Bone Conduction Headsets',
        application_number='US17/341,557',
        attorney_key='prestin',
        application_type='utility',
        jurisdiction='US',
        status='office_action',
        priority_level='critical',
        technology_area='Consumer Electronics / Acoustics',
        inventors=['Park, Seung-Hyun', 'Delacroix, Isabelle', 'Washington, Curtis'],
        assignees=['AuraSound Holdings, LLC'],
        ipc_classes=['H04R 1/10', 'H04R 3/00', 'G10K 11/178'],
        keywords=['bone conduction', 'noise cancellation', 'ANC', 'adaptive filter', 'headset'],
        abstract=(
            'An active noise cancellation system for bone conduction audio devices '
            'that uses a dual-microphone adaptive filter to cancel ambient acoustic '
            'noise while preserving bone-conducted speech signals. The system adapts '
            'filter coefficients in real time using a modified least mean squares '
            'algorithm optimized for low-latency embedded processing.'
        ),
        filing_date=d(2021, 6, 3),
        priority_date=d(2021, 6, 3),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2021, 6, 3),
                 description='Application filed electronically.'),
            dict(event_type='office_action_received',
                 title='Non-Final Office Action Received',
                 event_date=d(2023, 2, 14),
                 description='Non-Final Office Action mailed February 14, 2023. '
                             'Rejections under §103 and §112(b).'),
        ],
        office_actions=[
            dict(
                action_type='non_final',
                mailing_date=d(2023, 2, 14),
                response_due_date=d(2023, 5, 14),
                examiner_name='Johnson, Robert T.',
                examiner_phone='571-272-4000',
                art_unit='2817',
                response_status='pending',
                summary=(
                    'Claims 1-12 are rejected. Claims 1-8 stand rejected under '
                    '35 U.S.C. §103 as obvious over Park et al. (US 10,244,308) '
                    'in view of Chen et al. (US 9,819,987). Claims 9-12 stand '
                    'rejected under 35 U.S.C. §112(b) as indefinite for use of '
                    'the term "substantially similar" without adequate definition '
                    'in the specification.'
                ),
                rejections=[
                    dict(
                        rejection_type='103',
                        affected_claims='1-8',
                        prior_art='Park et al., US 10,244,308; Chen et al., US 9,819,987',
                        notes='Examiner argues the adaptive filter of Park combined '
                              'with the dual-mic arrangement of Chen renders the '
                              'claims obvious.',
                        argument='',
                    ),
                    dict(
                        rejection_type='112b',
                        affected_claims='9-12',
                        prior_art='',
                        notes='Term "substantially similar frequency response" '
                              'is indefinite.',
                        argument='',
                    ),
                ],
            ),
        ],
        deadlines=[
            dict(
                deadline_type='office_action_response',
                title='Response to Non-Final Office Action',
                due_date=d(2023, 5, 14),
                priority='critical',
                description='3-month statutory period from February 14, 2023 mailing date.',
            ),
        ],
        claims=[
            (1, 'independent',
             'An active noise cancellation system for a bone conduction headset comprising: '
             'a first microphone configured to capture ambient acoustic noise; '
             'a second microphone positioned to capture a reference noise signal; '
             'an adaptive filter configured to generate an anti-noise signal by '
             'processing the reference noise signal using least mean squares coefficients '
             'updated in real time; and '
             'a bone conduction transducer configured to deliver audio output '
             'combined with the anti-noise signal to a user.'),
            (2, 'dependent',
             'The system of claim 1, wherein the adaptive filter updates filter '
             'coefficients at a rate of at least 16,000 times per second.'),
            (3, 'dependent',
             'The system of claim 1, wherein the first and second microphones are '
             'arranged in a gradient configuration to enhance directional noise pickup.'),
            (4, 'independent',
             'A method for active noise cancellation in a bone conduction device '
             'comprising: capturing ambient noise via a first microphone; '
             'capturing a reference signal via a second microphone; '
             'computing an adaptive filter output using real-time coefficient updates; '
             'combining the adaptive filter output with audio content; and '
             'delivering the combined signal via a bone conduction transducer.'),
        ],
    ),

    # ── 6. Office Action (Final) / Utility ──────────────────────────────────
    dict(
        title='CRISPR-Based Nucleic Acid Delivery Platform Using Lipid Nanoparticles',
        application_number='US16/988,214',
        attorney_key='harris_wolin',
        application_type='utility',
        jurisdiction='US',
        status='office_action',
        priority_level='critical',
        technology_area='Biotechnology',
        inventors=['Osei, Akua Mensah', 'Ferreira, Gabriela', 'Li, Xiaoming'],
        assignees=['GenEdit Therapeutics, Inc.'],
        ipc_classes=['C12N 15/11', 'A61K 47/69', 'C12N 9/22'],
        keywords=['CRISPR', 'gene editing', 'lipid nanoparticle', 'Cas9', 'delivery'],
        abstract=(
            'A lipid nanoparticle formulation for in vivo delivery of CRISPR-Cas9 '
            'ribonucleoprotein complexes. The nanoparticle comprises an ionizable '
            'lipid, a helper lipid, cholesterol, and a PEGylated lipid optimized '
            'for endosomal escape and hepatic targeting, achieving greater than '
            '80% editing efficiency in mouse liver.'
        ),
        filing_date=d(2020, 8, 11),
        priority_date=d(2020, 8, 11),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2020, 8, 11),
                 description='Application filed with sequence listing.'),
            dict(event_type='office_action_received',
                 title='Non-Final Office Action — Round 1',
                 event_date=d(2021, 9, 20),
                 description='Non-Final OA mailed, §101 and §103 rejections.'),
            dict(event_type='response_filed', title='Amendment After Non-Final OA',
                 event_date=d(2021, 12, 19),
                 description='Response filed with claim amendments and arguments.'),
            dict(event_type='office_action_received',
                 title='Final Office Action Received',
                 event_date=d(2022, 5, 10),
                 description='Final Office Action mailed May 10, 2022.'),
        ],
        office_actions=[
            dict(
                action_type='final',
                mailing_date=d(2022, 5, 10),
                response_due_date=d(2022, 8, 10),
                examiner_name='Williams, Sarah K.',
                examiner_phone='571-272-6000',
                art_unit='1634',
                response_status='in_progress',
                summary=(
                    'Claims 1-20 are finally rejected. Claims 1-15 rejected under '
                    '35 U.S.C. §101 as directed to a product of nature (naturally '
                    'occurring nucleic acids). Claims 1-20 rejected under 35 U.S.C. '
                    '§103 as obvious over Hou et al. (US 2021/0087555) in view of '
                    'Kulkarni et al. (Nature Nanotechnology, 2018).'
                ),
                rejections=[
                    dict(
                        rejection_type='101',
                        affected_claims='1-15',
                        prior_art='',
                        notes='Examiner contends the ribonucleoprotein complex '
                              'is a naturally occurring product.',
                        argument='Claims amended to recite specific synthetic guide '
                                 'RNA modifications not found in nature.',
                    ),
                    dict(
                        rejection_type='103',
                        affected_claims='1-20',
                        prior_art='Hou et al., US 2021/0087555; Kulkarni et al., '
                                  'Nature Nanotechnology 13, 98–105 (2018)',
                        notes='Ionizable lipid molar ratio argued to be obvious '
                              'design choice.',
                        argument='',
                    ),
                ],
            ),
        ],
        deadlines=[
            dict(
                deadline_type='office_action_response',
                title='Response to Final Office Action',
                due_date=d(2022, 8, 10),
                priority='critical',
                description='Final OA dated May 10, 2022. Statutory 3-month period expired.',
            ),
        ],
        claims=[
            (1, 'independent',
             'A lipid nanoparticle composition comprising: '
             'a CRISPR-Cas9 ribonucleoprotein complex comprising a synthetic '
             'single guide RNA incorporating at least two 2\'-O-methyl modifications; '
             'an ionizable lipid present at 40–50 mol%; '
             'a neutral helper lipid present at 10–20 mol%; '
             'cholesterol present at 30–40 mol%; and '
             'a PEGylated lipid present at 1–3 mol%.'),
            (2, 'dependent',
             'The composition of claim 1, wherein the ionizable lipid has a pKa '
             'between 6.2 and 6.8.'),
            (3, 'independent',
             'A method of editing a gene in a hepatic cell comprising: '
             'administering the lipid nanoparticle composition of claim 1 '
             'intravenously to a subject; and '
             'achieving at least 70% editing efficiency in hepatic cells as '
             'measured by next-generation sequencing.'),
        ],
    ),

    # ── 7. Allowed / Utility ─────────────────────────────────────────────────
    dict(
        title='Multi-Modal Robotic Manipulation System Using Tactile Feedback',
        application_number='US16/741,902',
        attorney_key='prestin',
        application_type='utility',
        jurisdiction='US',
        status='allowed',
        priority_level='high',
        technology_area='Robotics',
        inventors=['Hernandez, Carlos A.', 'Tanaka, Hiroshi', 'Dubois, Marie-Claire'],
        assignees=['RoboGrasp Technologies, Inc.'],
        ipc_classes=['B25J 9/16', 'B25J 13/08', 'G06N 3/04'],
        keywords=['robot', 'tactile feedback', 'manipulation', 'reinforcement learning',
                  'grasping'],
        abstract=(
            'A robotic manipulation system that integrates tactile sensor arrays '
            'with a deep reinforcement learning controller to achieve dexterous '
            'object grasping and manipulation. The system learns grasp policies '
            'from tactile feedback without requiring object 3D models, enabling '
            'generalization to novel objects.'
        ),
        filing_date=d(2020, 1, 14),
        priority_date=d(2020, 1, 14),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2020, 1, 14), description=''),
            dict(event_type='office_action_received',
                 title='Non-Final Office Action',
                 event_date=d(2021, 3, 22), description='§103 rejection over prior art.'),
            dict(event_type='response_filed', title='Response to Non-Final OA',
                 event_date=d(2021, 6, 22),
                 description='Amendment and arguments submitted.'),
            dict(event_type='allowance_received', title='Notice of Allowance',
                 event_date=d(2023, 9, 5),
                 description='All claims allowed. Issue fee due within 3 months.'),
        ],
        office_actions=[],
        deadlines=[
            dict(
                deadline_type='fee_payment',
                title='Issue Fee Payment',
                due_date=date.today() + timedelta(days=45),
                priority='critical',
                description='Issue fee due 3 months from Notice of Allowance '
                            'dated September 5, 2023.',
            ),
        ],
        claims=[
            (1, 'independent',
             'A robotic manipulation system comprising: '
             'a robotic arm comprising a plurality of articulated joints; '
             'a tactile sensor array disposed on an end effector of the robotic arm, '
             'configured to generate tactile signals in response to contact forces; '
             'a reinforcement learning controller configured to receive the tactile '
             'signals and output joint torque commands to achieve a target grasp '
             'configuration; and '
             'a reward function module configured to evaluate grasp success based '
             'on contact area and slip detection metrics.'),
            (2, 'dependent',
             'The system of claim 1, wherein the tactile sensor array comprises '
             'piezoresistive sensing elements arranged in a grid pattern with a '
             'spatial resolution of at least 5 mm.'),
            (3, 'independent',
             'A method for robotic object grasping comprising: '
             'receiving tactile signals from a sensor array on a robotic end effector; '
             'processing the tactile signals using a deep neural network to predict '
             'grasp stability; adjusting joint positions based on the predicted '
             'stability; and iterating until a stable grasp is achieved.'),
        ],
    ),

    # ── 8. Granted / Utility ─────────────────────────────────────────────────
    dict(
        title='Quantum Key Distribution System over Standard Fiber-Optic Networks',
        application_number='US16/234,119',
        attorney_key='marian',
        patent_number='US11,842,305',
        application_type='utility',
        jurisdiction='US',
        status='granted',
        priority_level='high',
        technology_area='Quantum Communications',
        inventors=['Sato, Kenji', 'Müller, Franz', 'Nguyen, Thi Lan'],
        assignees=['QuantumLink Communications, Inc.'],
        ipc_classes=['H04B 10/70', 'H04L 9/08'],
        keywords=['quantum key distribution', 'QKD', 'fiber optic', 'quantum cryptography'],
        abstract=(
            'A quantum key distribution system compatible with existing telecom fiber '
            'infrastructure. The system uses wavelength-multiplexed channels to '
            'transmit quantum and classical signals simultaneously over the same '
            'fiber, with a novel photon-pair source achieving a secret key rate of '
            '1 Mbps at 100 km distance.'
        ),
        filing_date=d(2018, 12, 11),
        priority_date=d(2018, 12, 11),
        grant_date=d(2023, 12, 12),
        patent_number_field='US11,842,305',
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2018, 12, 11), description=''),
            dict(event_type='office_action_received',
                 title='Non-Final Office Action',
                 event_date=d(2020, 4, 7), description='§102 and §103 rejections.'),
            dict(event_type='response_filed', title='Response to Non-Final OA',
                 event_date=d(2020, 7, 7), description='Claim amendments filed.'),
            dict(event_type='allowance_received', title='Notice of Allowance',
                 event_date=d(2023, 9, 18), description='All claims allowed.'),
            dict(event_type='fee_paid', title='Issue Fee Paid',
                 event_date=d(2023, 10, 15),
                 description='Issue fee paid. Patent expected to issue December 2023.'),
            dict(event_type='patent_granted', title='Patent Granted',
                 event_date=d(2023, 12, 12),
                 description='US 11,842,305 issued December 12, 2023.'),
        ],
        office_actions=[],
        deadlines=[
            dict(
                deadline_type='maintenance_fee',
                title='3.5-Year Maintenance Fee',
                due_date=d(2027, 6, 12),
                priority='medium',
                description='First maintenance fee window: 3–3.5 years from issue date.',
            ),
        ],
        claims=[
            (1, 'independent',
             'A quantum key distribution system comprising: '
             'a quantum transmitter configured to generate entangled photon pairs '
             'at a wavelength of 1,550 nm using a spontaneous parametric '
             'down-conversion source; '
             'a wavelength division multiplexer configured to combine a quantum '
             'channel and a classical channel onto a single-mode optical fiber; '
             'a quantum receiver configured to detect individual photons using '
             'superconducting nanowire single-photon detectors; and '
             'a key reconciliation module configured to generate a shared secret '
             'key from correlated photon detection events.'),
            (2, 'dependent',
             'The system of claim 1, wherein the quantum and classical channels '
             'are separated by at least 100 GHz in frequency to minimize '
             'cross-channel interference.'),
            (3, 'independent',
             'A method for quantum key distribution over a fiber-optic network '
             'comprising: generating entangled photon pairs; multiplexing the '
             'quantum channel with a classical channel; transmitting the multiplexed '
             'signal over existing telecom fiber; detecting photon arrival events; '
             'and performing key reconciliation and privacy amplification.'),
        ],
    ),

    # ── 9. Abandoned / Utility ───────────────────────────────────────────────
    dict(
        title='Perovskite-Silicon Tandem Solar Cell with Interfacial Stability Enhancement',
        application_number='US16/103,782',
        attorney_key='marian',
        application_type='utility',
        jurisdiction='US',
        status='abandoned',
        priority_level='low',
        technology_area='Clean Energy / Photovoltaics',
        inventors=['Johansson, Erik', 'Patel, Deepika'],
        assignees=['SunLayer Energy, Inc.'],
        ipc_classes=['H01L 31/0725', 'H01L 31/04', 'C01G 5/00'],
        keywords=['perovskite', 'tandem solar cell', 'silicon', 'stability', 'PCE'],
        abstract=(
            'A perovskite-silicon tandem solar cell in which a self-assembled '
            'monolayer of a carbazole derivative is deposited at the perovskite/'
            'hole-transport-layer interface to suppress non-radiative recombination. '
            'The device achieves a certified power conversion efficiency of 29.3% '
            'with improved stability under damp-heat conditions.'
        ),
        filing_date=d(2018, 8, 14),
        priority_date=d(2018, 8, 14),
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2018, 8, 14), description=''),
            dict(event_type='office_action_received',
                 title='Non-Final Office Action',
                 event_date=d(2019, 11, 5), description='§103 and §101 rejections.'),
            dict(event_type='abandonment', title='Application Abandoned',
                 event_date=d(2020, 5, 6),
                 description='Application abandoned for failure to respond to '
                             'the Non-Final Office Action within the statutory period.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A tandem photovoltaic device comprising: '
             'a silicon bottom subcell; '
             'a perovskite top subcell comprising a methylammonium lead iodide '
             'absorber layer; '
             'a self-assembled monolayer of a carbazole-based hole-selective '
             'molecule disposed between the perovskite absorber and a hole '
             'transport layer; and '
             'a transparent recombination junction connecting the subcells.'),
            (2, 'independent',
             'A method for fabricating a perovskite-silicon tandem solar cell '
             'comprising: depositing a self-assembled monolayer of a '
             'carbazole derivative on a perovskite surface; and '
             'annealing the device to promote monolayer ordering.'),
        ],
    ),

    # ── 10. PCT / Filed ──────────────────────────────────────────────────────
    dict(
        title='Photovoltaic Inverter with Grid-Forming Control for Islanded Microgrids',
        application_number='PCT/US2023/081445',
        attorney_key='prestin',
        application_type='pct',
        jurisdiction='PCT',
        status='filed',
        priority_level='high',
        technology_area='Power Electronics / Clean Energy',
        inventors=['Vasquez, Juan Carlos', 'Singh, Amarjit', 'Kowalczyk, Tomasz'],
        assignees=['GridForm Power Systems, Inc.'],
        ipc_classes=['H02M 7/537', 'H02J 3/38', 'H02J 13/00'],
        keywords=['grid-forming inverter', 'microgrid', 'droop control', 'virtual oscillator'],
        abstract=(
            'A single-phase and three-phase grid-forming photovoltaic inverter '
            'employing a virtual oscillator control algorithm to autonomously '
            'regulate voltage and frequency in islanded microgrids. The inverter '
            'achieves seamless transition between grid-connected and islanded '
            'modes without a dedicated mode-detection circuit.'
        ),
        filing_date=d(2023, 12, 14),
        priority_date=d(2023, 12, 14),
        events=[
            dict(event_type='application_filed', title='PCT Application Filed',
                 event_date=d(2023, 12, 14),
                 description='PCT application filed with USPTO as receiving office.'),
        ],
        office_actions=[],
        deadlines=[
            dict(
                deadline_type='filing_deadline',
                title='National Phase Entry Deadline (30 months)',
                due_date=d(2026, 6, 14),
                priority='high',
                description='Standard 30-month national phase entry deadline from '
                            'PCT filing date.',
            ),
        ],
        claims=[
            (1, 'independent',
             'A grid-forming photovoltaic inverter comprising: '
             'a DC-AC power conversion stage configured to convert DC power from '
             'a photovoltaic array to AC power; '
             'a virtual oscillator controller configured to generate reference '
             'voltage and frequency setpoints that emulate synchronous machine '
             'dynamics without a physical rotating mass; and '
             'an island detection module configured to detect disconnection from '
             'a utility grid within one AC cycle.'),
            (2, 'dependent',
             'The inverter of claim 1, wherein the virtual oscillator controller '
             'implements a Van der Pol oscillator model to provide inherent '
             'power-frequency droop characteristics.'),
            (3, 'independent',
             'A method for islanded microgrid control using a grid-forming '
             'photovoltaic inverter comprising: '
             'computing a virtual oscillator output representing a reference '
             'AC voltage waveform; driving a PWM modulator based on the '
             'virtual oscillator output; and transitioning between grid-connected '
             'and islanded operation without mode switching logic.'),
        ],
    ),

    # ── 11. Pending / Utility (EP national phase of #8) ─────────────────────
    dict(
        title='Quantum Key Distribution over Fiber-Optic Networks — European National Phase',
        application_number='US17/819,330',
        attorney_key='marian',
        application_type='utility',
        jurisdiction='EP',
        status='pending',
        priority_level='medium',
        technology_area='Quantum Communications',
        inventors=['Sato, Kenji', 'Müller, Franz', 'Nguyen, Thi Lan'],
        assignees=['QuantumLink Communications, Inc.'],
        ipc_classes=['H04B 10/70', 'H04L 9/08'],
        keywords=['quantum key distribution', 'QKD', 'EPO', 'fiber optic'],
        abstract=(
            'European regional phase of PCT application PCT/US2019/065891. '
            'A quantum key distribution system using wavelength-multiplexed '
            'quantum and classical channels over standard telecom fiber.'
        ),
        filing_date=d(2022, 6, 11),
        priority_date=d(2018, 12, 11),
        events=[
            dict(event_type='continuation_filed',
                 title='National Phase Entry — Europe (EPO)',
                 event_date=d(2022, 6, 11),
                 description='European regional phase entry from PCT/US2019/065891.',
                 metadata={
                     'direction': 'from_parent',
                     'continuation_type': 'national_phase',
                     'parent_application_number': 'PCT/US2019/065891',
                 }),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A quantum key distribution system comprising: '
             'a quantum transmitter configured to generate entangled photon pairs; '
             'a wavelength division multiplexer configured to combine a quantum '
             'channel and a classical channel onto a single optical fiber; and '
             'a quantum receiver configured to perform photon detection and '
             'key reconciliation.'),
        ],
    ),

    # ── 12. Divisional / Pending ─────────────────────────────────────────────
    dict(
        title='Locking Mechanism for an Expandable Interbody Spinal Fusion Implant',
        application_number='US18/101,557',
        attorney_key='harris_wolin',
        application_type='divisional',
        jurisdiction='US',
        status='pending',
        priority_level='medium',
        technology_area='Medical Devices / Orthopedics',
        inventors=['Reyes, Alejandro M.', 'Hoffmann, Klaus'],
        assignees=['SpinalForm Devices, LLC'],
        ipc_classes=['A61F 2/44', 'A61F 2/30'],
        keywords=['spinal fusion', 'interbody implant', 'TLIF', 'expandable', 'locking'],
        abstract=(
            'A locking mechanism for an expandable interbody spinal fusion device. '
            'A threaded expansion rod engages a ratchet latch assembly that '
            'incrementally expands the implant height from 8 mm to 16 mm under '
            'surgeon control, with a release prevention feature that locks the '
            'implant at any expanded height to prevent subsidence.'
        ),
        filing_date=d(2023, 1, 30),
        priority_date=d(2020, 6, 15),
        events=[
            dict(event_type='continuation_filed',
                 title='Divisional Application Filed',
                 event_date=d(2023, 1, 30),
                 description='Divisional filed from parent US16/902,447.',
                 metadata={
                     'direction': 'from_parent',
                     'continuation_type': 'divisional',
                     'parent_application_number': 'US16/902,447',
                 }),
            dict(event_type='application_filed', title='Divisional Filing Receipt',
                 event_date=d(2023, 1, 30), description='Filing receipt received.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'An expandable interbody spinal implant comprising: '
             'a superior endplate and an inferior endplate; '
             'an expansion mechanism configured to translate rotational motion of '
             'a driver tool into linear separation of the superior and inferior '
             'endplates; and '
             'a ratchet latch assembly configured to lock the implant at a selected '
             'expanded height and prevent reduction of the height after locking.'),
            (2, 'dependent',
             'The implant of claim 1, wherein the ratchet latch assembly comprises '
             'a pawl element biased against a ratchet rack by a spring element.'),
            (3, 'independent',
             'A method of implanting an expandable interbody device comprising: '
             'inserting the implant in a collapsed configuration into an intervertebral '
             'disc space; rotating a driver tool to expand the implant to a target '
             'height; and engaging a locking mechanism to prevent reduction of '
             'the expanded height.'),
        ],
    ),

    # ── 13. Design / Granted ─────────────────────────────────────────────────
    dict(
        title='Ornamental Design for a Wearable Health Monitoring Tracker',
        application_number='US29/845,221',
        attorney_key='prestin',
        patent_number='USD1,012,887',
        application_type='design',
        jurisdiction='US',
        status='granted',
        priority_level='low',
        technology_area='Consumer Electronics',
        inventors=['Kim, Jae-Won', 'Ramirez, Elena'],
        assignees=['CardioSense Technologies, Inc.'],
        ipc_classes=['D14-01'],
        keywords=['design patent', 'wearable', 'tracker', 'ornamental design'],
        abstract=(
            'The ornamental design for a wearable health monitoring tracker, '
            'as shown and described.'
        ),
        filing_date=d(2022, 3, 8),
        priority_date=d(2022, 3, 8),
        grant_date=d(2023, 5, 16),
        patent_number_field='USD1,012,887',
        events=[
            dict(event_type='application_filed', title='Design Application Filed',
                 event_date=d(2022, 3, 8), description=''),
            dict(event_type='patent_granted', title='Design Patent Granted',
                 event_date=d(2023, 5, 16),
                 description='USD 1,012,887 issued May 16, 2023.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'The ornamental design for a wearable health monitoring tracker, '
             'as shown and described.'),
        ],
    ),

    # ── 14. CIP / Under Examination ──────────────────────────────────────────
    dict(
        title='AI-Enhanced Cardiac Monitor with Integrated Sleep Staging and Apnea Detection',
        application_number='US18/244,901',
        attorney_key='bo_zeng',
        application_type='cip',
        jurisdiction='US',
        status='under_examination',
        priority_level='high',
        technology_area='Medical Devices',
        inventors=['Kim, Jae-Won', 'Ramirez, Elena', 'Thompson, Marcus R.',
                   'Oyelaran, Tunde'],
        assignees=['CardioSense Technologies, Inc.'],
        ipc_classes=['A61B 5/0402', 'A61B 5/363', 'A61B 5/00', 'G16H 50/20'],
        keywords=['cardiac monitor', 'sleep staging', 'sleep apnea', 'ECG', 'PPG',
                  'deep learning', 'CIP'],
        abstract=(
            'A continuation-in-part of US17/923,874, this application extends the '
            'wearable cardiac monitoring platform to include photoplethysmography-based '
            'sleep staging and respiratory effort detection using a novel '
            'multi-task deep learning model trained on polysomnography-correlated data.'
        ),
        filing_date=d(2023, 9, 14),
        priority_date=d(2022, 11, 15),
        events=[
            dict(event_type='continuation_filed',
                 title='CIP Filed from US17/923,874',
                 event_date=d(2023, 9, 14),
                 description='Continuation-in-part filed adding sleep staging claims.',
                 metadata={
                     'direction': 'from_parent',
                     'continuation_type': 'cip',
                     'parent_application_number': 'US17/923,874',
                 }),
            dict(event_type='application_filed',
                 title='CIP Filing Receipt',
                 event_date=d(2023, 9, 14), description='Filing receipt issued.'),
        ],
        office_actions=[],
        deadlines=[],
        claims=[
            (1, 'independent',
             'A wearable health monitoring device comprising: '
             'one or more ECG electrodes configured to acquire electrocardiogram signals; '
             'a photoplethysmography sensor configured to acquire blood volume pulse signals; '
             'a multi-task deep learning model configured to simultaneously classify '
             'cardiac arrhythmias from the ECG signals and sleep stages from the '
             'photoplethysmography signals; and '
             'a wireless transceiver configured to transmit classification results '
             'to a remote clinical platform.'),
            (2, 'dependent',
             'The device of claim 1, wherein the multi-task deep learning model '
             'is trained on paired ECG and PPG recordings from polysomnography studies.'),
            (3, 'dependent',
             'The device of claim 1, further configured to detect respiratory effort '
             'and generate obstructive sleep apnea alerts.'),
            (4, 'independent',
             'A method for simultaneous cardiac and sleep monitoring comprising: '
             'acquiring ECG and photoplethysmography signals from a wearable device; '
             'processing the signals through a multi-task neural network; and '
             'outputting concurrent arrhythmia classifications and sleep stage labels.'),
        ],
    ),

    # ── 15. Granted / Utility (older, maintenance fee due) ───────────────────
    dict(
        title='Thermal Interface Material for Three-Dimensionally Packaged Semiconductor Modules',
        application_number='US15/887,334',
        attorney_key='bo_zeng',
        patent_number='US10,971,438',
        application_type='utility',
        jurisdiction='US',
        status='granted',
        priority_level='medium',
        technology_area='Semiconductor Packaging',
        inventors=['Watanabe, Mitsuru', 'Goldstein, Aaron', 'Priya, Shashank'],
        assignees=['ThermalBond Semiconductor Materials, Inc.'],
        ipc_classes=['H01L 23/373', 'C09K 5/14', 'H01L 25/065'],
        keywords=['thermal interface material', '3D IC', 'semiconductor', 'indium alloy',
                  'heat dissipation'],
        abstract=(
            'A compliant thermal interface material for use between stacked die in '
            '3D integrated circuit packages. The material comprises an indium-bismuth '
            'alloy matrix reinforced with vertically aligned carbon nanotube pillars, '
            'achieving a thermal conductivity of 45 W/m·K at a bond-line thickness '
            'of 20 µm.'
        ),
        filing_date=d(2018, 2, 2),
        priority_date=d(2018, 2, 2),
        grant_date=d(2021, 4, 6),
        patent_number_field='US10,971,438',
        events=[
            dict(event_type='application_filed', title='Utility Application Filed',
                 event_date=d(2018, 2, 2), description=''),
            dict(event_type='office_action_received',
                 title='Non-Final Office Action',
                 event_date=d(2019, 6, 18), description='§103 rejection.'),
            dict(event_type='response_filed',
                 title='Response to Non-Final OA',
                 event_date=d(2019, 9, 18), description='Arguments filed, no amendments.'),
            dict(event_type='allowance_received', title='Notice of Allowance',
                 event_date=d(2021, 1, 7), description='All claims allowed.'),
            dict(event_type='fee_paid', title='Issue Fee Paid',
                 event_date=d(2021, 2, 15), description=''),
            dict(event_type='patent_granted', title='Patent Granted',
                 event_date=d(2021, 4, 6),
                 description='US 10,971,438 issued April 6, 2021.'),
        ],
        office_actions=[],
        deadlines=[
            dict(
                deadline_type='maintenance_fee',
                title='7.5-Year Maintenance Fee',
                due_date=d(2028, 10, 6),
                priority='critical',
                description='Maintenance fee due: 7–7.5 years from issue date '
                            '(April 6, 2021). Large entity fee: $3,600.',
            ),
        ],
        claims=[
            (1, 'independent',
             'A thermal interface material comprising: '
             'an indium-bismuth alloy matrix having a composition of 60-70 wt% '
             'indium and 30-40 wt% bismuth; '
             'a plurality of vertically aligned carbon nanotube pillars embedded '
             'in the alloy matrix, wherein the carbon nanotube pillars have an '
             'aspect ratio of at least 10:1; and '
             'wherein the thermal interface material has a thermal conductivity '
             'of at least 40 W/m·K.'),
            (2, 'dependent',
             'The thermal interface material of claim 1, wherein the vertically '
             'aligned carbon nanotube pillars have a diameter of 5-50 nm and '
             'are present at a volume fraction of 10-30%.'),
            (3, 'independent',
             'A three-dimensionally packaged semiconductor module comprising: '
             'a first semiconductor die; a second semiconductor die stacked on '
             'the first semiconductor die; and the thermal interface material '
             'of claim 1 disposed between the first and second semiconductor dies.'),
        ],
    ),
]


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Seed the prosecution module with 15 realistic US patent applications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all seed applications (identified by their application numbers) '
                 'before re-seeding.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        # ── Org ─────────────────────────────────────────────────────────────
        org, _ = Organization.objects.get_or_create(
            name='Demo Organization',
            defaults=dict(
                email='demo@example.com',
                subscription_plan='basic',
                is_active=True,
            ),
        )

        # ── Attorney users linked to real attorney-network entries ───────────
        # Each tuple: (attorney_network_id, username, first, last, email)
        ATTORNEY_SPECS = [
            ('d5829d1f-3814-412d-a451-34afbedc1648', 'atty_bo_zeng',
             'Bo', 'Zeng', 'bo.zeng@patpipes.com'),
            ('1f5835ea-2539-40fa-ad68-a530532dc3fc', 'atty_harris_wolin',
             'Harris', 'Wolin', 'harris.wolin@patpipes.com'),
            ('f7720f03-6f7e-4c12-9902-14057656e665', 'atty_prestin',
             'Prestin', 'Van Mieghem', 'prestin.vanmieghem@patpipes.com'),
            ('cdd4399f-da64-4e78-8ed4-68510b2c8492', 'atty_marian',
             'Marian', 'Silberstein', 'marian.silberstein@patpipes.com'),
        ]

        KEY_MAP = {
            'bo_zeng': None,
            'harris_wolin': None,
            'prestin': None,
            'marian': None,
        }
        key_names = list(KEY_MAP.keys())

        for i, (net_id, username, first, last, email) in enumerate(ATTORNEY_SPECS):
            atty_user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=email,
                    first_name=first,
                    last_name=last,
                    organization=org,
                    is_active=True,
                    status='active',
                ),
            )
            # Link to attorney network entry if not already linked
            try:
                atty_record = Attorney.objects.get(id=net_id)
                if atty_record.user is None:
                    atty_record.user = atty_user
                    atty_record.save(update_fields=['user'])
            except Attorney.DoesNotExist:
                pass
            KEY_MAP[key_names[i]] = atty_user
            verb = 'Created' if created else 'Found'
            self.stdout.write(f'  {verb} attorney user: {first} {last}')

        # Fallback user (Sarah Winters — existing demo_user)
        fallback_user, _ = User.objects.get_or_create(
            username='demo_user',
            defaults=dict(
                email='demo@example.com',
                first_name='Sarah',
                last_name='Winters',
                organization=org,
                is_active=True,
            ),
        )

        # ── Optional clear ───────────────────────────────────────────────────
        if options['clear']:
            app_numbers = [a['application_number'] for a in APPLICATIONS]
            deleted, _ = PatentApplication.objects.filter(
                application_number__in=app_numbers,
            ).delete()
            self.stdout.write(self.style.WARNING(
                f'Cleared {deleted} existing seed application(s).'
            ))

        # ── Seed each application ────────────────────────────────────────────
        for spec in APPLICATIONS:
            atty_key = spec.get('attorney_key', '')
            atty_user = KEY_MAP.get(atty_key) or fallback_user
            defaults = dict(
                application_type=spec['application_type'],
                jurisdiction=spec['jurisdiction'],
                status=spec['status'],
                priority_level=spec['priority_level'],
                technology_area=spec.get('technology_area', ''),
                inventors=spec.get('inventors', []),
                assignees=spec.get('assignees', []),
                ipc_classes=spec.get('ipc_classes', []),
                keywords=spec.get('keywords', []),
                abstract=spec.get('abstract', ''),
                organization=org,
                attorney=atty_user,
            )
            if spec.get('filing_date'):
                defaults['filing_date'] = spec['filing_date']
            if spec.get('priority_date'):
                defaults['priority_date'] = spec['priority_date']
            if spec.get('grant_date'):
                defaults['grant_date'] = spec['grant_date']
            if spec.get('patent_number') or spec.get('patent_number_field'):
                defaults['patent_number'] = (
                    spec.get('patent_number') or spec.get('patent_number_field')
                )

            app, created = PatentApplication.objects.get_or_create(
                application_number=spec['application_number'],
                defaults=dict(title=spec['title'], **defaults),
            )

            if not created:
                self.stdout.write(f'  — Already exists: {spec["application_number"]}')
                continue

            # Claims
            for (num, claim_type, text) in spec.get('claims', []):
                _add_claim(app, num, claim_type, text)

            # Prosecution events
            for ev in spec.get('events', []):
                _add_event(
                    app=app,
                    event_type=ev['event_type'],
                    title=ev['title'],
                    event_date=ev['event_date'],
                    description=ev.get('description', ''),
                    metadata=ev.get('metadata', {}),
                    user=atty_user,
                )

            # Office actions
            for oa_spec in spec.get('office_actions', []):
                OfficeAction.objects.get_or_create(
                    application=app,
                    action_type=oa_spec['action_type'],
                    mailing_date=oa_spec['mailing_date'],
                    defaults=dict(
                        response_due_date=oa_spec['response_due_date'],
                        examiner_name=oa_spec.get('examiner_name', ''),
                        examiner_phone=oa_spec.get('examiner_phone', ''),
                        art_unit=oa_spec.get('art_unit', ''),
                        response_status=oa_spec.get('response_status', 'pending'),
                        summary=oa_spec.get('summary', ''),
                        rejections=oa_spec.get('rejections', []),
                        response_strategy='',
                    ),
                )

            # Deadlines
            for dl_spec in spec.get('deadlines', []):
                _add_deadline(
                    app=app,
                    deadline_type=dl_spec['deadline_type'],
                    title=dl_spec['title'],
                    due_date=dl_spec['due_date'],
                    priority=dl_spec.get('priority', 'high'),
                    description=dl_spec.get('description', ''),
                )

            self.stdout.write(self.style.SUCCESS(
                f'  ✓ Created [{spec["status"]:>18}]  {spec["application_number"]}  '
                f'{spec["title"][:60]}'
            ))

        self.stdout.write(self.style.SUCCESS('\nDone — prosecution seed data applied.'))
