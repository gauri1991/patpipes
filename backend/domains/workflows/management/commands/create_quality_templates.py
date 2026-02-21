"""
Management command to create default quality control templates and presets
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from domains.workflows.models import QualityControl, WorkflowTemplate, WorkflowStep

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default quality control templates and presets'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-user',
            type=str,
            help='Username of admin user to assign as creator (default: admin)',
            default='admin'
        )

    def handle(self, *args, **options):
        try:
            admin_user = User.objects.get(username=options['admin_user'])
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"Admin user '{options['admin_user']}' not found")
            )
            return

        self.stdout.write('Creating quality control templates...')

        # Create patent-specific quality controls
        self.create_patent_quality_controls(admin_user)
        
        # Create general workflow quality controls
        self.create_general_quality_controls(admin_user)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created quality control templates')
        )

    def create_patent_quality_controls(self, admin_user):
        """Create patent-specific quality controls"""
        
        try:
            patent_template = WorkflowTemplate.objects.get(name="Patent Drafting - Utility Patent")
        except WorkflowTemplate.DoesNotExist:
            self.stdout.write("Patent drafting template not found, skipping patent quality controls")
            return

        # 1. Claims Quality Control
        claims_step = patent_template.steps.filter(name__icontains="Claims").first()
        if claims_step:
            QualityControl.objects.get_or_create(
                name="Patent Claims Quality Check",
                workflow_step=claims_step,
                defaults={
                    'description': 'Comprehensive quality check for patent claims',
                    'type': 'automated',
                    'criteria': {
                        'completeness': {
                            'required_fields': [
                                'independent_claims',
                                'dependent_claims',
                                'claim_numbering'
                            ]
                        },
                        'format_rules': {
                            'independent_claims': {
                                'type': 'length',
                                'min_length': 50,
                                'max_length': 500
                            },
                            'claim_numbering': {
                                'type': 'regex',
                                'pattern': r'^\d+\.\s'
                            }
                        },
                        'business_rules': [
                            {
                                'name': 'Independent Claims Present',
                                'condition': 'len(independent_claims) > 0'
                            },
                            {
                                'name': 'Claim Count Reasonable',
                                'condition': 'len(independent_claims) + len(dependent_claims) <= 20'
                            }
                        ]
                    },
                    'passing_score': 85,
                    'is_required': True,
                    'is_blocking': True,
                    'reviewer_roles': ['attorney', 'lead_attorney'],
                    'created_by': admin_user
                }
            )
            self.stdout.write("Created Claims Quality Control")

        # 2. MPEP Compliance Control
        final_step = patent_template.steps.filter(name__icontains="Final").first()
        if final_step:
            QualityControl.objects.get_or_create(
                name="MPEP Section 112 Compliance",
                workflow_step=final_step,
                defaults={
                    'description': '35 USC 112 compliance validation',
                    'type': 'compliance',
                    'criteria': {
                        'section_112': {
                            'written_description': True,
                            'enablement': True,
                            'best_mode': True
                        },
                        'mpep_requirements': [
                            {
                                'id': '2161',
                                'description': 'Three Separate Requirements for Adequate Disclosure',
                                'check_type': 'presence',
                                'field': 'written_description_verified'
                            },
                            {
                                'id': '2164',
                                'description': 'The Enablement Requirement',
                                'check_type': 'presence',
                                'field': 'enablement_verified'
                            }
                        ],
                        'uspto_checks': {
                            'fee_calculation': True,
                            'form_compliance': True
                        }
                    },
                    'passing_score': 95,
                    'is_required': True,
                    'is_blocking': True,
                    'reviewer_roles': ['lead_attorney'],
                    'required_reviewers': 1,
                    'created_by': admin_user
                }
            )
            self.stdout.write("Created MPEP 112 Compliance Control")

        # 3. Prior Art Review Quality Control
        prior_art_step = patent_template.steps.filter(name__icontains="Prior Art").first()
        if prior_art_step:
            QualityControl.objects.get_or_create(
                name="Prior Art Search Quality Check",
                workflow_step=prior_art_step,
                defaults={
                    'description': 'Quality validation for prior art search and analysis',
                    'type': 'checklist',
                    'criteria': {
                        'checklist_items': [
                            {
                                'id': 'search_strategy',
                                'description': 'Search strategy documented and comprehensive',
                                'required': True
                            },
                            {
                                'id': 'keyword_coverage',
                                'description': 'Relevant keywords and classifications used',
                                'required': True
                            },
                            {
                                'id': 'database_coverage',
                                'description': 'Multiple databases searched (USPTO, EPO, etc.)',
                                'required': True
                            },
                            {
                                'id': 'relevance_analysis',
                                'description': 'Prior art references analyzed for relevance',
                                'required': True
                            },
                            {
                                'id': 'patentability_assessment',
                                'description': 'Patentability assessment completed',
                                'required': True
                            },
                            {
                                'id': 'documentation',
                                'description': 'Search results properly documented',
                                'required': False
                            }
                        ]
                    },
                    'passing_score': 80,
                    'is_required': True,
                    'is_blocking': False,
                    'reviewer_roles': ['attorney', 'lead_attorney'],
                    'created_by': admin_user
                }
            )
            self.stdout.write("Created Prior Art Search Quality Control")

        # 4. Document Quality Control
        spec_step = patent_template.steps.filter(name__icontains="Specification").first()
        if spec_step:
            QualityControl.objects.get_or_create(
                name="Specification Document Quality",
                workflow_step=spec_step,
                defaults={
                    'description': 'Document quality validation for patent specification',
                    'type': 'document',
                    'criteria': {
                        'required_documents': [
                            {
                                'type': 'specification',
                                'name': 'Patent Specification',
                                'required': True
                            },
                            {
                                'type': 'abstract',
                                'name': 'Patent Abstract',
                                'required': True
                            }
                        ],
                        'format_rules': {
                            'specification': {
                                'allowed_formats': ['pdf', 'docx', 'doc'],
                                'max_size_mb': 50
                            }
                        },
                        'content_rules': {
                            'specification': {
                                'min_words': 1000,
                                'required_sections': [
                                    'background',
                                    'summary',
                                    'detailed_description',
                                    'claims'
                                ]
                            },
                            'abstract': {
                                'min_words': 50,
                                'max_words': 150
                            }
                        }
                    },
                    'passing_score': 85,
                    'is_required': True,
                    'is_blocking': True,
                    'auto_remediate': False,
                    'reviewer_roles': ['paralegal', 'attorney'],
                    'created_by': admin_user
                }
            )
            self.stdout.write("Created Specification Document Quality Control")

    def create_general_quality_controls(self, admin_user):
        """Create general quality controls applicable to any workflow"""
        
        # 1. Completeness Check Template
        QualityControl.objects.get_or_create(
            name="General Completeness Check",
            workflow_template=None,  # Template for reuse
            workflow_step=None,
            defaults={
                'description': 'Generic completeness validation for any workflow step',
                'type': 'automated',
                'criteria': {
                    'completeness': {
                        'required_fields': [
                            'status',
                            'completion_notes',
                            'quality_verified'
                        ]
                    },
                    'business_rules': [
                        {
                            'name': 'Status Valid',
                            'condition': 'status in ["completed", "reviewed", "approved"]'
                        },
                        {
                            'name': 'Notes Present',
                            'condition': 'len(completion_notes or "") >= 10'
                        }
                    ]
                },
                'passing_score': 75,
                'is_required': True,
                'is_blocking': False,
                'auto_remediate': True,
                'created_by': admin_user
            }
        )
        self.stdout.write("Created General Completeness Check Template")

        # 2. Data Quality Validation Template
        QualityControl.objects.get_or_create(
            name="Data Quality Validation",
            workflow_template=None,
            workflow_step=None,
            defaults={
                'description': 'Data quality validation for structured data',
                'type': 'data',
                'criteria': {
                    'completeness': {
                        'required_fields': ['title', 'description', 'status']
                    },
                    'accuracy': {
                        'range_checks': {
                            'priority_score': {'min': 1, 'max': 10},
                            'completion_percentage': {'min': 0, 'max': 100}
                        }
                    },
                    'consistency': [
                        {
                            'type': 'sum_check',
                            'total_field': 'total_hours',
                            'part_fields': ['research_hours', 'drafting_hours', 'review_hours']
                        }
                    ],
                    'validity': {
                        'allowed_values': {
                            'status': ['draft', 'in_progress', 'review', 'completed'],
                            'priority': ['low', 'medium', 'high', 'urgent']
                        }
                    }
                },
                'passing_score': 80,
                'is_required': False,
                'is_blocking': False,
                'auto_remediate': True,
                'created_by': admin_user
            }
        )
        self.stdout.write("Created Data Quality Validation Template")

        # 3. Manual Review Template
        QualityControl.objects.get_or_create(
            name="Expert Manual Review",
            workflow_template=None,
            workflow_step=None,
            defaults={
                'description': 'Manual expert review for complex quality validation',
                'type': 'manual',
                'criteria': {
                    'review_checklist': [
                        'Technical accuracy verified',
                        'Legal compliance confirmed',
                        'Client requirements met',
                        'Industry standards followed'
                    ]
                },
                'passing_score': 85,
                'is_required': False,
                'is_blocking': True,
                'reviewer_roles': ['lead_attorney', 'supervisor'],
                'required_reviewers': 1,
                'created_by': admin_user
            }
        )
        self.stdout.write("Created Expert Manual Review Template")

        # 4. Time and Effort Validation
        QualityControl.objects.get_or_create(
            name="Time and Effort Validation",
            workflow_template=None,
            workflow_step=None,
            defaults={
                'description': 'Validate time tracking and effort reporting',
                'type': 'automated',
                'criteria': {
                    'completeness': {
                        'required_fields': ['actual_hours', 'start_time', 'end_time']
                    },
                    'business_rules': [
                        {
                            'name': 'Reasonable Hours',
                            'condition': 'actual_hours >= 0.5 and actual_hours <= 24'
                        },
                        {
                            'name': 'Time Sequence Valid',
                            'condition': 'end_time > start_time'
                        }
                    ],
                    'format_rules': {
                        'actual_hours': {
                            'type': 'regex',
                            'pattern': r'^\d+(\.\d{1,2})?$'
                        }
                    }
                },
                'passing_score': 90,
                'is_required': False,
                'is_blocking': False,
                'auto_remediate': True,
                'on_fail_actions': [
                    {
                        'type': 'notify',
                        'recipients': ['assigned_user', 'supervisor'],
                        'message': 'Time tracking validation failed'
                    }
                ],
                'created_by': admin_user
            }
        )
        self.stdout.write("Created Time and Effort Validation Template")

        # 5. Client Deliverable Quality
        QualityControl.objects.get_or_create(
            name="Client Deliverable Quality Check",
            workflow_template=None,
            workflow_step=None,
            defaults={
                'description': 'Quality validation for client-facing deliverables',
                'type': 'manual',
                'criteria': {
                    'quality_dimensions': [
                        'Professional presentation',
                        'Technical accuracy',
                        'Clear communication',
                        'Complete coverage of requirements',
                        'Proper formatting and structure'
                    ],
                    'client_requirements': {
                        'format_compliance': True,
                        'branding_compliance': True,
                        'deadline_met': True
                    }
                },
                'passing_score': 90,
                'is_required': True,
                'is_blocking': True,
                'reviewer_roles': ['lead_attorney', 'manager'],
                'required_reviewers': 1,
                'on_pass_actions': [
                    {
                        'type': 'notify',
                        'recipients': ['client_contact'],
                        'message': 'Deliverable ready for review'
                    }
                ],
                'on_fail_actions': [
                    {
                        'type': 'reassign',
                        'target_role': 'lead_attorney',
                        'reason': 'Client deliverable quality issues'
                    }
                ],
                'created_by': admin_user
            }
        )
        self.stdout.write("Created Client Deliverable Quality Check Template")