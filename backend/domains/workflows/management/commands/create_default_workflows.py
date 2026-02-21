"""
Management command to create default workflow templates
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from domains.workflows.models import WorkflowTemplate, WorkflowStep, QualityControl

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default workflow templates for patent processes'

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

        self.stdout.write('Creating default workflow templates...')

        # 1. Patent Drafting Workflow
        patent_drafting = self.create_patent_drafting_workflow(admin_user)
        self.stdout.write(
            self.style.SUCCESS(f"Created: {patent_drafting.name}")
        )

        # 2. Prior Art Search Workflow
        prior_art_search = self.create_prior_art_search_workflow(admin_user)
        self.stdout.write(
            self.style.SUCCESS(f"Created: {prior_art_search.name}")
        )

        # 3. Freedom to Operate Workflow
        fto_workflow = self.create_fto_workflow(admin_user)
        self.stdout.write(
            self.style.SUCCESS(f"Created: {fto_workflow.name}")
        )

        self.stdout.write(
            self.style.SUCCESS('Successfully created default workflow templates')
        )

    def create_patent_drafting_workflow(self, admin_user):
        """Create patent drafting workflow template"""
        template = WorkflowTemplate.objects.create(
            name="Patent Drafting - Utility Patent",
            description="Comprehensive utility patent application drafting workflow with quality controls",
            category="Patent Drafting",
            version="1.0",
            estimated_duration=30,
            auto_assign=True,
            require_sequential=True,
            allow_parallel=False,
            quality_threshold=85,
            require_approval=True,
            min_role_level="attorney",
            color="#F97316",
            icon="FileText",
            display_order=1,
            created_by=admin_user
        )

        # Step 1: Prior Art Review
        step1 = WorkflowStep.objects.create(
            workflow_template=template,
            name="Prior Art Review",
            description="Review existing prior art and assess patentability",
            step_type="manual",
            order=1,
            is_required=True,
            estimated_duration=3,
            estimated_hours=24,
            assigned_role="attorney",
            quality_criteria={
                "completeness": "All relevant prior art references reviewed",
                "analysis": "Patentability assessment documented",
                "documentation": "Prior art references properly cited"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        # Step 2: Claims Drafting
        WorkflowStep.objects.create(
            workflow_template=template,
            name="Claims Drafting",
            description="Draft independent and dependent claims",
            step_type="manual",
            order=2,
            is_required=True,
            estimated_duration=5,
            estimated_hours=40,
            assigned_role="attorney",
            quality_criteria={
                "clarity": "Claims are clear and definite",
                "scope": "Appropriate claim scope defined",
                "support": "Claims supported by specification"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        # Step 3: Specification Drafting
        WorkflowStep.objects.create(
            workflow_template=template,
            name="Specification Drafting",
            description="Draft detailed description and background",
            step_type="manual",
            order=3,
            is_required=True,
            estimated_duration=7,
            estimated_hours=56,
            assigned_role="attorney",
            quality_criteria={
                "enablement": "Sufficient disclosure for enablement",
                "best_mode": "Best mode disclosed if applicable",
                "written_description": "Adequate written description"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        # Step 4: Drawings Review
        WorkflowStep.objects.create(
            workflow_template=template,
            name="Drawings Review",
            description="Review and approve technical drawings",
            step_type="review",
            order=4,
            is_required=True,
            estimated_duration=2,
            estimated_hours=8,
            assigned_role="paralegal",
            quality_criteria={
                "accuracy": "Drawings accurately represent invention",
                "compliance": "Drawings comply with USPTO requirements",
                "labeling": "All elements properly labeled"
            },
            created_by=admin_user
        )

        # Step 5: Final Review
        WorkflowStep.objects.create(
            workflow_template=template,
            name="Final Review & Quality Check",
            description="Comprehensive final review before filing",
            step_type="quality_gate",
            order=5,
            is_required=True,
            estimated_duration=2,
            estimated_hours=12,
            assigned_role="lead_attorney",
            quality_criteria={
                "completeness": "All sections complete",
                "consistency": "Claims and specification consistent",
                "formalities": "All formalities addressed"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        # Quality Control for overall template
        QualityControl.objects.create(
            name="MPEP Compliance Check",
            description="Verify compliance with Manual of Patent Examining Procedure",
            type="compliance",
            workflow_template=template,
            criteria={
                "section_112": "35 USC 112 compliance verified",
                "formalities": "All USPTO formalities addressed",
                "fee_calculation": "Correct fees calculated"
            },
            passing_score=90,
            is_required=True,
            is_blocking=True,
            reviewer_roles=["lead_attorney"],
            created_by=admin_user
        )

        return template

    def create_prior_art_search_workflow(self, admin_user):
        """Create prior art search workflow template"""
        template = WorkflowTemplate.objects.create(
            name="Prior Art Search - Patentability",
            description="Comprehensive prior art search for patentability assessment",
            category="Search Services",
            version="1.0",
            estimated_duration=7,
            auto_assign=True,
            require_sequential=True,
            allow_parallel=False,
            quality_threshold=80,
            require_approval=True,
            min_role_level="paralegal",
            color="#3B82F6",
            icon="Search",
            display_order=2,
            created_by=admin_user
        )

        # Search steps
        WorkflowStep.objects.create(
            workflow_template=template,
            name="Search Strategy Development",
            description="Develop comprehensive search strategy",
            step_type="manual",
            order=1,
            is_required=True,
            estimated_duration=1,
            estimated_hours=4,
            assigned_role="paralegal",
            quality_criteria={
                "keywords": "Comprehensive keyword list developed",
                "classifications": "Relevant patent classifications identified",
                "databases": "Appropriate databases selected"
            },
            created_by=admin_user
        )

        WorkflowStep.objects.create(
            workflow_template=template,
            name="Patent Database Search",
            description="Execute search across patent databases",
            step_type="manual",
            order=2,
            is_required=True,
            estimated_duration=2,
            estimated_hours=12,
            assigned_role="paralegal",
            quality_criteria={
                "coverage": "All major patent databases searched",
                "documentation": "Search queries properly documented",
                "results": "Relevant results identified and captured"
            },
            created_by=admin_user
        )

        WorkflowStep.objects.create(
            workflow_template=template,
            name="Non-Patent Literature Search",
            description="Search technical and scientific literature",
            step_type="manual",
            order=3,
            is_required=True,
            estimated_duration=2,
            estimated_hours=10,
            assigned_role="paralegal",
            quality_criteria={
                "journals": "Relevant technical journals searched",
                "conferences": "Conference proceedings reviewed",
                "standards": "Industry standards considered"
            },
            created_by=admin_user
        )

        WorkflowStep.objects.create(
            workflow_template=template,
            name="Results Analysis",
            description="Analyze search results for relevance",
            step_type="manual",
            order=4,
            is_required=True,
            estimated_duration=2,
            estimated_hours=12,
            assigned_role="attorney",
            quality_criteria={
                "relevance": "Results properly categorized by relevance",
                "analysis": "Patentability analysis conducted",
                "recommendations": "Clear recommendations provided"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        return template

    def create_fto_workflow(self, admin_user):
        """Create Freedom to Operate workflow template"""
        template = WorkflowTemplate.objects.create(
            name="Freedom to Operate Analysis",
            description="Comprehensive FTO analysis for product commercialization",
            category="Legal Analysis",
            version="1.0",
            estimated_duration=14,
            auto_assign=True,
            require_sequential=True,
            allow_parallel=True,
            quality_threshold=85,
            require_approval=True,
            min_role_level="attorney",
            color="#EF4444",
            icon="Shield",
            display_order=3,
            created_by=admin_user
        )

        # FTO Analysis steps
        WorkflowStep.objects.create(
            workflow_template=template,
            name="Product Feature Analysis",
            description="Detailed analysis of product features and functionality",
            step_type="manual",
            order=1,
            is_required=True,
            estimated_duration=2,
            estimated_hours=16,
            assigned_role="attorney",
            quality_criteria={
                "completeness": "All product features identified",
                "technical_detail": "Sufficient technical detail captured",
                "documentation": "Feature analysis properly documented"
            },
            created_by=admin_user
        )

        WorkflowStep.objects.create(
            workflow_template=template,
            name="Patent Landscape Search",
            description="Comprehensive search of relevant patent landscape",
            step_type="manual",
            order=2,
            is_required=True,
            estimated_duration=5,
            estimated_hours=35,
            assigned_role="paralegal",
            is_parallel=True,
            quality_criteria={
                "coverage": "Comprehensive patent landscape covered",
                "active_patents": "All active patents identified",
                "geographic_scope": "Relevant jurisdictions covered"
            },
            created_by=admin_user
        )

        WorkflowStep.objects.create(
            workflow_template=template,
            name="Infringement Risk Assessment",
            description="Assess potential infringement risks",
            step_type="manual",
            order=3,
            is_required=True,
            estimated_duration=4,
            estimated_hours=30,
            assigned_role="attorney",
            quality_criteria={
                "claim_analysis": "Detailed claim analysis conducted",
                "risk_assessment": "Risk levels properly assessed",
                "evidence": "Analysis supported by evidence"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        WorkflowStep.objects.create(
            workflow_template=template,
            name="Mitigation Strategy Development",
            description="Develop strategies to mitigate identified risks",
            step_type="manual",
            order=4,
            is_required=True,
            estimated_duration=3,
            estimated_hours=20,
            assigned_role="attorney",
            quality_criteria={
                "options": "Multiple mitigation options identified",
                "feasibility": "Feasibility of options assessed",
                "recommendations": "Clear recommendations provided"
            },
            required_approvals=1,
            approver_roles=["lead_attorney"],
            created_by=admin_user
        )

        # Quality control for high-risk assessments
        QualityControl.objects.create(
            name="High-Risk Patent Review",
            description="Additional review for high-risk patent situations",
            type="expert_review",
            workflow_template=template,
            criteria={
                "expert_review": "High-risk patents reviewed by expert",
                "second_opinion": "Second opinion obtained if necessary",
                "documentation": "All findings properly documented"
            },
            passing_score=85,
            is_required=True,
            is_blocking=True,
            reviewer_roles=["lead_attorney"],
            required_reviewers=2,
            created_by=admin_user
        )

        return template