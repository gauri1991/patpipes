"""
Django Management Command to populate sample data
Creates users, project types, and projects with realistic data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
import random
import uuid

from domains.projects.models.project_types import ProjectType, DEFAULT_PROJECT_TYPES

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate the database with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean existing data before populating',
        )

    def handle(self, *args, **options):
        # Import models here to avoid circular imports
        from domains.projects.models import (
            Project, ProjectMember, ProjectTask, ProjectMilestone, 
            ProjectFile, TaskComment
        )
        # Store as class attributes for use in methods
        self.Project = Project
        self.ProjectMember = ProjectMember
        self.ProjectTask = ProjectTask
        self.ProjectMilestone = ProjectMilestone
        self.ProjectFile = ProjectFile
        self.TaskComment = TaskComment

        if options['clean']:
            self.stdout.write('Cleaning existing data...')
            self.clean_data()

        with transaction.atomic():
            self.stdout.write('Creating project types...')
            project_types = self.create_project_types()
            
            self.stdout.write('Creating users...')
            users = self.create_users()
            
            self.stdout.write('Creating projects...')
            projects = self.create_projects(project_types, users)
            
            self.stdout.write('Creating project assignments...')
            self.assign_projects_to_users(projects, users)
            
            self.stdout.write('Creating project tasks and milestones...')
            self.create_project_content(projects, users)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with:\n'
                f'- {len(users)} users\n'
                f'- {len(project_types)} project types\n'
                f'- {len(projects)} projects\n'
                f'- Tasks, milestones, and other project content'
            )
        )

    def clean_data(self):
        """Clean existing sample data"""
        self.ProjectTask.objects.all().delete()
        self.ProjectMilestone.objects.all().delete()
        self.ProjectMember.objects.all().delete()
        self.Project.objects.all().delete()
        ProjectType.objects.all().delete()
        # Don't delete superuser, but clean other test users
        User.objects.filter(is_superuser=False).delete()

    def create_project_types(self):
        """Create all default project types"""
        project_types = []
        for i, type_data in enumerate(DEFAULT_PROJECT_TYPES):
            project_type, created = ProjectType.objects.get_or_create(
                name=type_data['name'],
                defaults={
                    **type_data,
                    'display_order': i,
                    'is_active': True
                }
            )
            project_types.append(project_type)
        return project_types

    def create_users(self):
        """Create users with different roles"""
        users_data = [
            # Managers
            {
                'username': 'john_manager',
                'email': 'john.smith@patentpro.com',
                'first_name': 'John',
                'last_name': 'Smith',
                'role': 'manager',
                'is_staff': True
            },
            {
                'username': 'sarah_manager',
                'email': 'sarah.johnson@patentpro.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'manager',
                'is_staff': True
            },
            
            # Supervisors
            {
                'username': 'mike_supervisor',
                'email': 'mike.wilson@patentpro.com',
                'first_name': 'Mike',
                'last_name': 'Wilson',
                'role': 'supervisor',
                'is_staff': True
            },
            {
                'username': 'lisa_supervisor',
                'email': 'lisa.brown@patentpro.com',
                'first_name': 'Lisa',
                'last_name': 'Brown',
                'role': 'supervisor',
                'is_staff': True
            },
            
            # Lead Attorneys
            {
                'username': 'david_attorney',
                'email': 'david.lee@patentpro.com',
                'first_name': 'David',
                'last_name': 'Lee',
                'role': 'lead_attorney'
            },
            {
                'username': 'anna_attorney',
                'email': 'anna.garcia@patentpro.com',
                'first_name': 'Anna',
                'last_name': 'Garcia',
                'role': 'lead_attorney'
            },
            
            # Attorneys
            {
                'username': 'robert_attorney',
                'email': 'robert.taylor@patentpro.com',
                'first_name': 'Robert',
                'last_name': 'Taylor',
                'role': 'attorney'
            },
            {
                'username': 'emily_attorney',
                'email': 'emily.davis@patentpro.com',
                'first_name': 'Emily',
                'last_name': 'Davis',
                'role': 'attorney'
            },
            
            # Paralegals
            {
                'username': 'james_paralegal',
                'email': 'james.miller@patentpro.com',
                'first_name': 'James',
                'last_name': 'Miller',
                'role': 'paralegal'
            },
            {
                'username': 'maria_paralegal',
                'email': 'maria.rodriguez@patentpro.com',
                'first_name': 'Maria',
                'last_name': 'Rodriguez',
                'role': 'paralegal'
            },
            
            # Analysts
            {
                'username': 'alex_analyst',
                'email': 'alex.anderson@patentpro.com',
                'first_name': 'Alex',
                'last_name': 'Anderson',
                'role': 'analyst'
            },
            {
                'username': 'katie_analyst',
                'email': 'katie.thomas@patentpro.com',
                'first_name': 'Katie',
                'last_name': 'Thomas',
                'role': 'analyst'
            },
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                    'is_staff': user_data.get('is_staff', False),
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')  # Default password for all test users
                user.save()
            users.append(user)
        
        return users

    def create_projects(self, project_types, users):
        """Create 15 sample projects with realistic data"""
        companies = [
            'TechInnovate Corp', 'BioMed Solutions', 'GreenEnergy Inc',
            'AutoTech Industries', 'PharmaCorp Ltd', 'DataDriven Systems',
            'CyberSecure Inc', 'NanoTech Materials', 'AeroSpace Dynamics',
            'QuantumCompute Ltd', 'SmartHome Solutions', 'CleanTech Innovations',
            'MedDevice Corp', 'AI Robotics Inc', 'Renewable Power Systems'
        ]

        project_templates = [
            {
                'name': 'Smart IoT Home Security System',
                'description': 'Comprehensive prior art search for innovative IoT-based home security system with ML-powered threat detection.',
                'type': 'prior-art-patentability',
                'client': 'SmartHome Solutions',
                'budget': 15000,
                'priority': 'high',
                'complexity': 'high'
            },
            {
                'name': 'Biodegradable Food Packaging',
                'description': 'Patent validity search for eco-friendly packaging materials made from agricultural waste.',
                'type': 'prior-art-validity',
                'client': 'GreenEnergy Inc',
                'budget': 8000,
                'priority': 'medium',
                'complexity': 'medium'
            },
            {
                'name': 'AI-Powered Medical Diagnosis Tool',
                'description': 'Freedom to operate analysis for AI diagnostic system in European markets.',
                'type': 'freedom-to-operate',
                'client': 'BioMed Solutions',
                'budget': 25000,
                'priority': 'urgent',
                'complexity': 'high'
            },
            {
                'name': 'Electric Vehicle Battery Management',
                'description': 'Infringement search for advanced battery management system patents.',
                'type': 'infringement-search',
                'client': 'AutoTech Industries',
                'budget': 12000,
                'priority': 'high',
                'complexity': 'medium'
            },
            {
                'name': 'Cancer Treatment Drug Compound',
                'description': 'State of art search for novel pharmaceutical compounds in oncology.',
                'type': 'state-of-art',
                'client': 'PharmaCorp Ltd',
                'budget': 35000,
                'priority': 'urgent',
                'complexity': 'high'
            },
            {
                'name': 'Blockchain Data Storage System',
                'description': 'Patent portfolio analysis for decentralized storage technology.',
                'type': 'patent-portfolio-analysis',
                'client': 'DataDriven Systems',
                'budget': 20000,
                'priority': 'medium',
                'complexity': 'high'
            },
            {
                'name': 'Quantum Encryption Device',
                'description': 'Utility patent drafting for quantum cryptography hardware.',
                'type': 'patent-drafting-utility',
                'client': 'CyberSecure Inc',
                'budget': 18000,
                'priority': 'high',
                'complexity': 'high'
            },
            {
                'name': 'Nano-coating Material',
                'description': 'Provisional patent application for self-healing nano-coating technology.',
                'type': 'patent-drafting-provisional',
                'client': 'NanoTech Materials',
                'budget': 7000,
                'priority': 'medium',
                'complexity': 'medium'
            },
            {
                'name': 'Drone Navigation System',
                'description': 'Patent illustration services for autonomous drone navigation patents.',
                'type': 'patent-illustration',
                'client': 'AeroSpace Dynamics',
                'budget': 5000,
                'priority': 'low',
                'complexity': 'low'
            },
            {
                'name': 'Quantum Computing Algorithm',
                'description': 'Patent proofreading for quantum algorithm patent applications.',
                'type': 'patent-proofreading',
                'client': 'QuantumCompute Ltd',
                'budget': 3000,
                'priority': 'medium',
                'complexity': 'low'
            },
            {
                'name': 'Renewable Energy Harvester',
                'description': 'Prior art patentability search for multi-source energy harvesting device.',
                'type': 'prior-art-patentability',
                'client': 'Renewable Power Systems',
                'budget': 10000,
                'priority': 'high',
                'complexity': 'medium'
            },
            {
                'name': 'Cardiac Monitoring Implant',
                'description': 'Prior art invalidity search challenging competitor medical device patents.',
                'type': 'prior-art-invalidity',
                'client': 'MedDevice Corp',
                'budget': 15000,
                'priority': 'urgent',
                'complexity': 'high'
            },
            {
                'name': 'Robotic Surgery Assistant',
                'description': 'Freedom to operate analysis for robotic surgical systems.',
                'type': 'freedom-to-operate',
                'client': 'AI Robotics Inc',
                'budget': 22000,
                'priority': 'high',
                'complexity': 'high'
            },
            {
                'name': 'Solar Panel Efficiency Enhancement',
                'description': 'State of art search for photovoltaic efficiency improvement technologies.',
                'type': 'state-of-art',
                'client': 'CleanTech Innovations',
                'budget': 12000,
                'priority': 'medium',
                'complexity': 'medium'
            },
            {
                'name': 'Water Purification System',
                'description': 'Patent portfolio analysis for water treatment and purification technologies.',
                'type': 'patent-portfolio-analysis',
                'client': 'TechInnovate Corp',
                'budget': 16000,
                'priority': 'low',
                'complexity': 'medium'
            }
        ]

        projects = []
        type_mapping = {pt.name.lower().replace(' ', '-').replace('--', '-'): pt for pt in project_types}
        
        for i, template in enumerate(project_templates):
            # Find matching project type
            project_type = None
            for pt in project_types:
                if template['type'].replace('-', ' ').lower() in pt.name.lower():
                    project_type = pt
                    break
            
            if not project_type:
                project_type = random.choice(project_types)

            # Calculate dates
            start_date = timezone.now().date() - timedelta(days=random.randint(1, 90))
            duration = random.randint(10, 60)
            target_date = start_date + timedelta(days=duration)
            
            # Set status based on timeline
            progress = random.randint(0, 100)
            if progress < 25:
                status = 'draft'
            elif progress < 50:
                status = 'active'
            elif progress < 75:
                status = 'under_review'
            elif progress < 90:
                status = 'filed'
            else:
                status = 'completed'

            project = self.Project.objects.create(
                name=template['name'],
                description=template['description'],
                type=project_type.id,  # Store as string ID
                status=status,
                priority=template['priority'],
                client_name=template['client'],
                client_email=f"contact@{template['client'].lower().replace(' ', '').replace('.', '')}.com",
                budget=template['budget'],
                actual_cost=template['budget'] * random.uniform(0.7, 1.2),
                currency='USD',
                start_date=start_date,
                target_date=target_date,
                progress_percentage=progress,
                tags=[
                    'patent', 'research', 
                    template['complexity'], 
                    project_type.category.lower().replace(' ', '-')
                ],
                created_by=random.choice(users),
                organization='Patent Analytics Pro'
            )
            projects.append(project)

        return projects

    def assign_projects_to_users(self, projects, users):
        """Assign projects to users based on their roles"""
        # Group users by role
        users_by_role = {}
        for user in users:
            role = user.role
            if role not in users_by_role:
                users_by_role[role] = []
            users_by_role[role].append(user)

        for project in projects:
            # Assign project lead (lead attorney or attorney)
            leads = users_by_role.get('lead_attorney', []) + users_by_role.get('attorney', [])
            if leads:
                project.lead_attorney = random.choice(leads)
                project.save()

            # Create project members based on project complexity and type
            members_to_add = []
            
            # Always add a manager or supervisor
            managers = users_by_role.get('manager', []) + users_by_role.get('supervisor', [])
            if managers:
                members_to_add.append((random.choice(managers), 'admin'))

            # Add lead attorney as member
            if project.lead_attorney:
                members_to_add.append((project.lead_attorney, 'lead_attorney'))

            # Add additional team members based on project complexity
            if project.priority in ['high', 'urgent']:
                # Add analysts for research-heavy projects
                analysts = users_by_role.get('analyst', [])
                if analysts:
                    members_to_add.append((random.choice(analysts), 'viewer'))
                
                # Add paralegal for documentation
                paralegals = users_by_role.get('paralegal', [])
                if paralegals:
                    members_to_add.append((random.choice(paralegals), 'paralegal'))

            # Add another attorney for complex projects
            if 'high' in project.tags:
                attorneys = users_by_role.get('attorney', [])
                if attorneys and project.lead_attorney not in attorneys:
                    available_attorneys = [a for a in attorneys if a != project.lead_attorney]
                    if available_attorneys:
                        members_to_add.append((random.choice(available_attorneys), 'attorney'))

            # Create ProjectMember objects
            for user, role in members_to_add:
                self.ProjectMember.objects.get_or_create(
                    project=project,
                    user=user,
                    defaults={
                        'role': role,
                        'permissions': self.get_role_permissions(role)
                    }
                )

    def get_role_permissions(self, role):
        """Get permissions for a role"""
        permissions_map = {
            'admin': ['view', 'edit', 'delete', 'manage_tasks', 'manage_files', 'manage_members', 'manage_timeline'],
            'lead_attorney': ['view', 'edit', 'manage_tasks', 'manage_files', 'manage_timeline'],
            'attorney': ['view', 'edit', 'manage_tasks', 'manage_files'],
            'paralegal': ['view', 'edit', 'manage_tasks', 'manage_files'],
            'viewer': ['view'],
        }
        return permissions_map.get(role, ['view'])

    def create_project_content(self, projects, users):
        """Create tasks, milestones, and other project content"""
        task_templates = [
            'Conduct preliminary patent search',
            'Analyze prior art references',
            'Prepare search strategy document',
            'Review technical specifications',
            'Draft patent claims',
            'Create technical drawings',
            'File patent application',
            'Respond to office actions',
            'Prepare client report',
            'Coordinate with inventors',
            'Review competitor patents',
            'Update patent database'
        ]

        milestone_templates = [
            'Search strategy approved',
            'Prior art analysis completed',
            'Draft patent ready for review',
            'Client approval received',
            'Patent application filed',
            'Final report delivered'
        ]

        for project in projects:
            project_members = self.ProjectMember.objects.filter(project=project)
            if not project_members:
                continue

            # Create tasks
            num_tasks = random.randint(3, 8)
            for i in range(num_tasks):
                task = self.ProjectTask.objects.create(
                    project=project,
                    title=random.choice(task_templates),
                    description=f'Task description for {project.name}',
                    status=random.choice(['todo', 'in_progress', 'review', 'done']),
                    priority=random.choice(['low', 'medium', 'high']),
                    assigned_to=random.choice(project_members).user,
                    due_date=project.target_date - timedelta(days=random.randint(1, 30)),
                    estimated_hours=random.randint(4, 40),
                    progress_percentage=random.randint(0, 100),
                    created_by=project.created_by
                )

                # Add some task comments
                if random.choice([True, False]):
                    self.TaskComment.objects.create(
                        task=task,
                        content=f'Progress update on {task.title}',
                        author=random.choice(project_members).user
                    )

            # Create milestones
            num_milestones = random.randint(2, 4)
            for i in range(num_milestones):
                milestone_date = project.start_date + timedelta(
                    days=int((project.target_date - project.start_date).days * (i + 1) / num_milestones)
                )
                self.ProjectMilestone.objects.create(
                    project=project,
                    title=random.choice(milestone_templates),
                    description=f'Milestone for {project.name}',
                    target_date=milestone_date,
                    is_completed=milestone_date < timezone.now().date(),
                    importance=random.choice(['low', 'medium', 'high']),
                    created_by=project.created_by
                )