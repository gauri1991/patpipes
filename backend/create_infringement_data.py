"""
Create sample data for Infringement Analysis Module
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from domains.infringement.models import (
    InfringementCase,
    ClaimMapping,
    ClaimElement,
    Evidence,
    RiskAssessment,
    DamagesAnalysis,
    ExpertOpinion,
    LitigationStrategy,
    InfringementReport
)
from datetime import date, timedelta
from decimal import Decimal
import random

User = get_user_model()

def create_sample_data():
    # Get or create a user
    user = User.objects.first()
    if not user:
        print("No users found. Please create a user first.")
        return

    print(f"Using user: {user.email}")

    # Sample infringement cases
    cases_data = [
        {
            'case_name': 'SmartPhone X vs Patent US10,123,456',
            'description': 'Analysis of potential patent infringement by SmartPhone X wireless charging technology against our patented wireless charging system with enhanced efficiency.',
            'status': 'active',
            'analysis_type': 'literal',
            'risk_level': 'high',
            'patent_number': 'US10,123,456',
            'patent_title': 'Wireless Charging System with Enhanced Efficiency',
            'patent_abstract': 'A wireless charging system that improves efficiency through novel coil arrangement and power management circuitry. The system includes a transmitter unit with optimized coil geometry and a receiver unit with adaptive power regulation.',
            'accused_product_name': 'SmartPhone X Pro',
            'accused_product_description': 'Latest flagship smartphone featuring wireless charging capabilities with proprietary QuickCharge technology that enables fast wireless charging up to 50W.',
            'accused_party_name': 'TechCorp Inc.',
            'infringement_likelihood': 78,
            'confidence_level': 85,
            'discovery_date': date.today() - timedelta(days=60),
            'analysis_date': date.today() - timedelta(days=30),
        },
        {
            'case_name': 'AI Assistant Pro vs Patent US10,234,567',
            'description': 'Doctrine of Equivalents analysis for AI-powered voice assistant natural language processing capabilities.',
            'status': 'review',
            'analysis_type': 'doe',
            'risk_level': 'medium',
            'patent_number': 'US10,234,567',
            'patent_title': 'Natural Language Processing for Voice Commands',
            'patent_abstract': 'Methods and systems for processing natural language voice commands using machine learning models to understand user intent and execute appropriate actions.',
            'accused_product_name': 'AI Assistant Pro',
            'accused_product_description': 'Advanced AI-powered voice assistant with natural language understanding, context awareness, and multi-turn conversation capabilities.',
            'accused_party_name': 'AI Innovations LLC',
            'infringement_likelihood': 62,
            'confidence_level': 70,
            'discovery_date': date.today() - timedelta(days=90),
            'analysis_date': date.today() - timedelta(days=45),
        },
        {
            'case_name': 'Battery Pack 3000 vs Patent US10,345,678',
            'description': 'Comprehensive infringement analysis of advanced battery management system with AI optimization features.',
            'status': 'completed',
            'analysis_type': 'willful',
            'risk_level': 'critical',
            'patent_number': 'US10,345,678',
            'patent_title': 'Advanced Battery Management with AI Optimization',
            'patent_abstract': 'A battery management system using artificial intelligence to optimize charging cycles, extend battery life, and prevent thermal runaway through predictive analytics.',
            'accused_product_name': 'Battery Pack 3000',
            'accused_product_description': 'High-capacity battery pack with intelligent charging management, thermal monitoring, and AI-based lifecycle optimization.',
            'accused_party_name': 'PowerTech Solutions',
            'infringement_likelihood': 92,
            'confidence_level': 95,
            'discovery_date': date.today() - timedelta(days=120),
            'analysis_date': date.today() - timedelta(days=15),
        },
        {
            'case_name': 'CloudSync Platform vs Patent US10,456,789',
            'description': 'Analysis of cloud synchronization technology for potential contributory infringement.',
            'status': 'active',
            'analysis_type': 'contributory',
            'risk_level': 'medium',
            'patent_number': 'US10,456,789',
            'patent_title': 'Distributed Cloud Synchronization Protocol',
            'patent_abstract': 'A protocol for synchronizing data across distributed cloud nodes with conflict resolution and eventual consistency guarantees.',
            'accused_product_name': 'CloudSync Enterprise',
            'accused_product_description': 'Enterprise cloud synchronization platform enabling real-time data sync across multiple cloud providers with automatic conflict resolution.',
            'accused_party_name': 'CloudWare Systems',
            'infringement_likelihood': 55,
            'confidence_level': 65,
            'discovery_date': date.today() - timedelta(days=45),
            'analysis_date': date.today() - timedelta(days=20),
        },
        {
            'case_name': 'SecureAuth Module vs Patent US10,567,890',
            'description': 'Induced infringement analysis for authentication module integrated into third-party applications.',
            'status': 'draft',
            'analysis_type': 'induced',
            'risk_level': 'low',
            'patent_number': 'US10,567,890',
            'patent_title': 'Multi-Factor Authentication with Biometric Verification',
            'patent_abstract': 'A multi-factor authentication system combining traditional credentials with biometric verification using machine learning-based liveness detection.',
            'accused_product_name': 'SecureAuth SDK',
            'accused_product_description': 'Software development kit providing multi-factor authentication capabilities including fingerprint, face recognition, and behavioral biometrics.',
            'accused_party_name': 'SecureTech Corp',
            'infringement_likelihood': 35,
            'confidence_level': 50,
            'discovery_date': date.today() - timedelta(days=30),
            'analysis_date': None,
        },
    ]

    created_cases = []
    for case_data in cases_data:
        case, created = InfringementCase.objects.get_or_create(
            patent_number=case_data['patent_number'],
            defaults={**case_data, 'created_by': user, 'analyst': user}
        )
        created_cases.append(case)
        action = "Created" if created else "Found existing"
        print(f"{action} case: {case.case_name}")

    # Create claim mappings for each case
    claim_mappings_data = {
        0: [  # SmartPhone X case
            {
                'claim_number': '1',
                'claim_text': 'A wireless charging system comprising: a transmitter unit having a primary coil with optimized geometry; a power management circuit connected to the primary coil; and a control unit configured to regulate power transfer.',
                'claim_type': 'independent',
                'product_feature': 'QuickCharge Transmitter Module',
                'product_feature_description': 'The SmartPhone X Pro includes a proprietary charging pad with a spiral coil design and integrated power management IC that controls charging current based on device feedback.',
                'mapping_type': 'literal',
                'match_confidence': 85,
                'limitations_met': True,
            },
            {
                'claim_number': '2',
                'claim_text': 'The system of claim 1, wherein the primary coil comprises a multi-layer spiral configuration.',
                'claim_type': 'dependent',
                'product_feature': 'Multi-Layer Coil Design',
                'product_feature_description': 'The charging pad uses a 3-layer spiral coil configuration for improved coupling efficiency.',
                'mapping_type': 'literal',
                'match_confidence': 90,
                'limitations_met': True,
            },
            {
                'claim_number': '3',
                'claim_text': 'The system of claim 1, further comprising a thermal management system for preventing overheating.',
                'claim_type': 'dependent',
                'product_feature': 'ThermalGuard System',
                'product_feature_description': 'Integrated thermal sensors and heat dissipation fins with active cooling fan.',
                'mapping_type': 'equivalent',
                'match_confidence': 75,
                'limitations_met': True,
            },
        ],
        1: [  # AI Assistant case
            {
                'claim_number': '1',
                'claim_text': 'A method for processing natural language voice commands comprising: receiving audio input; converting audio to text using speech recognition; analyzing text using a trained neural network; and executing a corresponding action.',
                'claim_type': 'independent',
                'product_feature': 'Voice Processing Pipeline',
                'product_feature_description': 'AI Assistant Pro uses a transformer-based speech recognition model followed by a BERT-based intent classifier.',
                'mapping_type': 'equivalent',
                'match_confidence': 70,
                'limitations_met': False,
            },
            {
                'claim_number': '4',
                'claim_text': 'The method of claim 1, wherein the neural network is trained using supervised learning on labeled voice command data.',
                'claim_type': 'dependent',
                'product_feature': 'ML Training Pipeline',
                'product_feature_description': 'The intent classifier is trained using a combination of supervised and self-supervised learning techniques.',
                'mapping_type': 'similar',
                'match_confidence': 55,
                'limitations_met': False,
            },
        ],
        2: [  # Battery Pack case
            {
                'claim_number': '1',
                'claim_text': 'A battery management system comprising: a plurality of battery cells; monitoring circuits for each cell; an AI processor configured to predict optimal charging parameters; and a control system implementing the predicted parameters.',
                'claim_type': 'independent',
                'product_feature': 'SmartBMS Controller',
                'product_feature_description': 'Battery Pack 3000 includes individual cell monitoring with an embedded ML processor that calculates optimal charge curves.',
                'mapping_type': 'literal',
                'match_confidence': 95,
                'limitations_met': True,
            },
            {
                'claim_number': '2',
                'claim_text': 'The system of claim 1, wherein the AI processor uses a recurrent neural network for prediction.',
                'claim_type': 'dependent',
                'product_feature': 'LSTM Prediction Model',
                'product_feature_description': 'The ML processor runs an LSTM network trained on charging cycle data to predict optimal parameters.',
                'mapping_type': 'literal',
                'match_confidence': 92,
                'limitations_met': True,
            },
            {
                'claim_number': '3',
                'claim_text': 'The system of claim 1, further comprising thermal sensors and a cooling system activated based on AI predictions.',
                'claim_type': 'dependent',
                'product_feature': 'Predictive Thermal Management',
                'product_feature_description': 'Temperature sensors feed data to the ML model which proactively activates cooling before thermal events.',
                'mapping_type': 'literal',
                'match_confidence': 88,
                'limitations_met': True,
            },
        ],
    }

    created_mappings = {}
    for case_idx, mappings in claim_mappings_data.items():
        case = created_cases[case_idx]
        created_mappings[case_idx] = []
        for mapping_data in mappings:
            mapping, created = ClaimMapping.objects.get_or_create(
                case=case,
                claim_number=mapping_data['claim_number'],
                defaults={**mapping_data, 'created_by': user}
            )
            created_mappings[case_idx].append(mapping)
            action = "Created" if created else "Found existing"
            print(f"  {action} claim mapping: Claim {mapping.claim_number}")

    # Create claim elements for detailed analysis
    for case_idx, mappings in created_mappings.items():
        for mapping in mappings:
            # Parse claim into elements (simplified)
            elements_data = [
                {
                    'element_order': 1,
                    'element_text': 'A wireless charging system comprising:' if 'wireless' in mapping.claim_text.lower() else 'A method/system comprising:',
                    'element_type': 'preamble',
                    'accused_feature': 'Product Category',
                    'accused_feature_description': 'The accused product falls within the claimed category.',
                    'meets_limitation': True,
                },
                {
                    'element_order': 2,
                    'element_text': mapping.claim_text.split(';')[0] if ';' in mapping.claim_text else mapping.claim_text[:100],
                    'element_type': 'body',
                    'accused_feature': mapping.product_feature,
                    'accused_feature_description': mapping.product_feature_description[:200],
                    'meets_limitation': mapping.limitations_met,
                    'doe_score': mapping.match_confidence if mapping.mapping_type == 'equivalent' else None,
                },
            ]
            
            for elem_data in elements_data:
                elem, created = ClaimElement.objects.get_or_create(
                    claim_mapping=mapping,
                    element_order=elem_data['element_order'],
                    defaults={**elem_data, 'created_by': user}
                )

    print("Created claim elements")

    # Create evidence for each case
    evidence_data = {
        0: [
            {'title': 'SmartPhone X Pro Product Manual', 'description': 'Official product documentation describing wireless charging specifications and technology.', 'evidence_type': 'product_doc', 'relevance_score': 9},
            {'title': 'QuickCharge Technology Whitepaper', 'description': 'Technical whitepaper from TechCorp describing the QuickCharge wireless charging technology.', 'evidence_type': 'technical_spec', 'relevance_score': 10},
            {'title': 'Charging Pad Teardown Photos', 'description': 'Photographs from product teardown showing internal coil configuration.', 'evidence_type': 'photo', 'relevance_score': 8},
            {'title': 'Marketing Campaign Video', 'description': 'Product launch video highlighting wireless charging features.', 'evidence_type': 'marketing', 'relevance_score': 6},
        ],
        1: [
            {'title': 'AI Assistant SDK Documentation', 'description': 'Developer documentation for the AI Assistant integration SDK.', 'evidence_type': 'technical_spec', 'relevance_score': 8},
            {'title': 'Voice Processing Architecture Diagram', 'description': 'System architecture document showing NLP pipeline.', 'evidence_type': 'technical_spec', 'relevance_score': 7},
        ],
        2: [
            {'title': 'Battery Pack 3000 Technical Specifications', 'description': 'Complete technical specifications including BMS details.', 'evidence_type': 'technical_spec', 'relevance_score': 10},
            {'title': 'PowerTech Patent Application', 'description': 'PowerTech\'s own patent application describing similar technology.', 'evidence_type': 'patent_doc', 'relevance_score': 9},
            {'title': 'BMS Source Code Excerpts', 'description': 'Decompiled firmware showing AI prediction algorithms.', 'evidence_type': 'source_code', 'relevance_score': 10},
            {'title': 'Expert Analysis Report', 'description': 'Technical expert report comparing claimed and accused technologies.', 'evidence_type': 'testimony', 'relevance_score': 9},
        ],
    }

    for case_idx, evidences in evidence_data.items():
        case = created_cases[case_idx]
        for ev_data in evidences:
            evidence, created = Evidence.objects.get_or_create(
                case=case,
                title=ev_data['title'],
                defaults={**ev_data, 'uploaded_by': user, 'date_obtained': date.today() - timedelta(days=random.randint(10, 60))}
            )
            action = "Created" if created else "Found existing"
            print(f"  {action} evidence: {evidence.title}")

    # Create risk assessments
    risk_factors = ['technical', 'legal', 'financial', 'strategic', 'validity', 'enforceability']
    
    for case in created_cases[:3]:  # First 3 cases
        for factor in risk_factors:
            score = random.randint(3, 9)
            assessment, created = RiskAssessment.objects.get_or_create(
                case=case,
                risk_factor=factor,
                defaults={
                    'risk_score': score,
                    'description': f'{factor.title()} risk assessment for {case.case_name}. Analysis indicates {"high" if score >= 7 else "moderate" if score >= 4 else "low"} risk in this area.',
                    'mitigation_strategy': f'Recommended mitigation for {factor} risk: conduct detailed analysis and prepare defense strategy.',
                    'estimated_damages_min': Decimal(str(random.randint(100000, 500000))),
                    'estimated_damages_max': Decimal(str(random.randint(500000, 2000000))),
                    'litigation_cost_estimate': Decimal(str(random.randint(50000, 200000))),
                    'assessed_by': user,
                }
            )

    print("Created risk assessments")

    # Create damages analysis for top cases
    for case in created_cases[:3]:
        damages, created = DamagesAnalysis.objects.get_or_create(
            case=case,
            defaults={
                'damages_theory': random.choice(['lost_profits', 'reasonable_royalty', 'hybrid']),
                'market_size': Decimal(str(random.randint(1000000000, 5000000000))),
                'accused_product_revenue': Decimal(str(random.randint(100000000, 500000000))),
                'accused_product_units': random.randint(1000000, 10000000),
                'profit_margin_percent': Decimal(str(random.randint(15, 35))),
                'royalty_base': Decimal(str(random.randint(50000000, 200000000))),
                'royalty_rate_percent': Decimal(str(random.uniform(2.0, 8.0))),
                'is_willful': case.analysis_type == 'willful',
                'willfulness_multiplier': Decimal('2.0') if case.analysis_type == 'willful' else Decimal('1.0'),
                'estimated_damages_low': Decimal(str(random.randint(5000000, 20000000))),
                'estimated_damages_high': Decimal(str(random.randint(20000000, 100000000))),
                'assumptions': 'Based on comparable licenses and market analysis.',
                'created_by': user,
            }
        )
        action = "Created" if created else "Found existing"
        print(f"{action} damages analysis for: {case.case_name}")

    # Create expert opinions for critical case
    critical_case = created_cases[2]  # Battery Pack case
    experts = [
        {
            'expert_name': 'Dr. Sarah Chen',
            'expert_title': 'Principal Engineer',
            'expert_organization': 'Stanford University',
            'qualifications': 'Ph.D. in Electrical Engineering, 20 years experience in battery technology, 50+ publications.',
            'opinion_type': 'technical',
            'methodology': 'Detailed technical comparison of claimed elements with accused product features.',
            'findings': 'The accused Battery Pack 3000 implements all elements of claims 1-3 of the patent.',
            'conclusion': 'In my opinion, the accused product literally infringes the asserted claims.',
            'opinion_date': date.today() - timedelta(days=10),
        },
        {
            'expert_name': 'Robert Martinez, CPA',
            'expert_title': 'Managing Director',
            'expert_organization': 'Economic Consulting Group',
            'qualifications': 'CPA, MBA, 15 years experience in patent damages analysis.',
            'opinion_type': 'damages',
            'methodology': 'Georgia-Pacific factor analysis combined with comparable license review.',
            'findings': 'Based on market analysis and comparable licenses, a reasonable royalty rate of 5-7% is appropriate.',
            'conclusion': 'Total damages are estimated between $25M and $75M.',
            'opinion_date': date.today() - timedelta(days=5),
        },
    ]

    for expert_data in experts:
        expert, created = ExpertOpinion.objects.get_or_create(
            case=critical_case,
            expert_name=expert_data['expert_name'],
            defaults={**expert_data, 'created_by': user}
        )
        action = "Created" if created else "Found existing"
        print(f"{action} expert opinion: {expert.expert_name}")

    # Create litigation strategy for critical case
    strategy, created = LitigationStrategy.objects.get_or_create(
        case=critical_case,
        defaults={
            'claim_construction_position': 'We propose construing "AI processor" broadly to include any machine learning-based processing unit.',
            'key_claim_terms': [
                {'term': 'AI processor', 'proposed_construction': 'A processing unit capable of executing machine learning algorithms'},
                {'term': 'optimal charging parameters', 'proposed_construction': 'Charging parameters calculated to maximize battery life and safety'},
            ],
            'anticipated_defenses': ['Non-infringement', 'Invalidity based on prior art', 'Inequitable conduct'],
            'invalidity_risks': 'Prior art search identified 3 potentially relevant references that may anticipate claim 1.',
            'strengths': [
                'Strong literal infringement case with clear claim mapping',
                'Multiple pieces of technical evidence',
                'Expert testimony supports infringement theory',
            ],
            'weaknesses': [
                'Prosecution history may limit claim scope',
                'Potential prior art references identified',
            ],
            'opportunities': [
                'Early settlement may be favorable',
                'ITC complaint could provide additional leverage',
            ],
            'threats': [
                'Defendant has significant litigation resources',
                'IPR petition likely',
            ],
            'trial_strategy': 'Present clear technical comparison followed by damages expert testimony. Emphasize willfulness for enhanced damages.',
            'settlement_range_low': Decimal('15000000'),
            'settlement_range_high': Decimal('40000000'),
            'settlement_considerations': 'Licensing agreement may be preferable to litigation. Consider cross-licensing opportunities.',
            'estimated_litigation_cost': Decimal('3500000'),
            'created_by': user,
        }
    )
    action = "Created" if created else "Found existing"
    print(f"{action} litigation strategy for: {critical_case.case_name}")

    # Create some reports
    for case in created_cases[:3]:
        report, created = InfringementReport.objects.get_or_create(
            case=case,
            report_type='preliminary',
            defaults={
                'title': f'Preliminary Analysis - {case.case_name}',
                'status': 'final',
                'summary': f'Preliminary infringement analysis for {case.accused_product_name} against {case.patent_number}.',
                'findings': f'Initial analysis indicates {case.risk_level} risk of infringement.',
                'conclusion': f'Infringement likelihood: {case.infringement_likelihood}%',
                'recommendations': 'Proceed with detailed claim chart analysis.',
                'created_by': user,
            }
        )

    print("\n=== Sample Data Creation Complete ===")
    print(f"Cases: {InfringementCase.objects.count()}")
    print(f"Claim Mappings: {ClaimMapping.objects.count()}")
    print(f"Claim Elements: {ClaimElement.objects.count()}")
    print(f"Evidence: {Evidence.objects.count()}")
    print(f"Risk Assessments: {RiskAssessment.objects.count()}")
    print(f"Damages Analyses: {DamagesAnalysis.objects.count()}")
    print(f"Expert Opinions: {ExpertOpinion.objects.count()}")
    print(f"Litigation Strategies: {LitigationStrategy.objects.count()}")
    print(f"Reports: {InfringementReport.objects.count()}")

if __name__ == '__main__':
    create_sample_data()
