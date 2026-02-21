#!/usr/bin/env python
"""
Simple script to create sample data
Run with: python create_sample_data.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

# Now import models after Django setup
from domains.projects.models import Project, ProjectMember, ProjectTask, ProjectMilestone

User = get_user_model()

# Project type data
PROJECT_TYPES = [
    {'id': 'prior-art-patentability', 'name': 'Prior Art Search - Patentability'},
    {'id': 'prior-art-validity', 'name': 'Prior Art Search - Validity'},
    {'id': 'prior-art-invalidity', 'name': 'Prior Art Search - Invalidity'},
    {'id': 'freedom-to-operate', 'name': 'Freedom to Operate Search'},
    {'id': 'infringement-search', 'name': 'Infringement Search'},
    {'id': 'state-of-art', 'name': 'State of Art Search'},
    {'id': 'patent-portfolio-analysis', 'name': 'Patent Portfolio Analysis'},
    {'id': 'patent-drafting-utility', 'name': 'Patent Drafting - Utility'},
    {'id': 'patent-drafting-provisional', 'name': 'Patent Drafting - Provisional'},
    {'id': 'patent-illustration', 'name': 'Patent Illustration'},
    {'id': 'patent-proofreading', 'name': 'Patent Proofreading'},
]

def create_users():
    """Create sample users with different roles"""
    users_data = [
        # Managers
        {'username': 'john_manager', 'email': 'john.smith@patentpro.com', 'first_name': 'John', 'last_name': 'Smith', 'role': 'manager'},
        {'username': 'sarah_manager', 'email': 'sarah.johnson@patentpro.com', 'first_name': 'Sarah', 'last_name': 'Johnson', 'role': 'manager'},
        
        # Supervisors
        {'username': 'mike_supervisor', 'email': 'mike.wilson@patentpro.com', 'first_name': 'Mike', 'last_name': 'Wilson', 'role': 'supervisor'},
        {'username': 'lisa_supervisor', 'email': 'lisa.brown@patentpro.com', 'first_name': 'Lisa', 'last_name': 'Brown', 'role': 'supervisor'},
        
        # Lead Attorneys
        {'username': 'david_attorney', 'email': 'david.lee@patentpro.com', 'first_name': 'David', 'last_name': 'Lee', 'role': 'lead_attorney'},
        {'username': 'anna_attorney', 'email': 'anna.garcia@patentpro.com', 'first_name': 'Anna', 'last_name': 'Garcia', 'role': 'lead_attorney'},
        
        # Attorneys
        {'username': 'robert_attorney', 'email': 'robert.taylor@patentpro.com', 'first_name': 'Robert', 'last_name': 'Taylor', 'role': 'attorney'},
        {'username': 'emily_attorney', 'email': 'emily.davis@patentpro.com', 'first_name': 'Emily', 'last_name': 'Davis', 'role': 'attorney'},
        
        # Paralegals
        {'username': 'james_paralegal', 'email': 'james.miller@patentpro.com', 'first_name': 'James', 'last_name': 'Miller', 'role': 'paralegal'},
        {'username': 'maria_paralegal', 'email': 'maria.rodriguez@patentpro.com', 'first_name': 'Maria', 'last_name': 'Rodriguez', 'role': 'paralegal'},
        
        # Analysts
        {'username': 'alex_analyst', 'email': 'alex.anderson@patentpro.com', 'first_name': 'Alex', 'last_name': 'Anderson', 'role': 'analyst'},
        {'username': 'katie_analyst', 'email': 'katie.thomas@patentpro.com', 'first_name': 'Katie', 'last_name': 'Thomas', 'role': 'analyst'},
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
                'is_active': True,
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {user.username} ({user.role})")
        users.append(user)
    
    return users

def create_projects(users):
    """Create 15 sample projects"""
    project_data = [
        {
            'name': 'Smart IoT Home Security System',
            'description': 'Comprehensive prior art search for innovative IoT-based home security system with ML-powered threat detection.',
            'type': 'prior-art-patentability',
            'client': 'SmartHome Solutions',
            'budget': 15000,
            'priority': 'high',
        },
        {
            'name': 'Biodegradable Food Packaging',
            'description': 'Patent validity search for eco-friendly packaging materials made from agricultural waste.',
            'type': 'prior-art-validity',
            'client': 'GreenEnergy Inc',
            'budget': 8000,
            'priority': 'medium',
        },
        {
            'name': 'AI-Powered Medical Diagnosis Tool',
            'description': 'Freedom to operate analysis for AI diagnostic system in European markets.',
            'type': 'freedom-to-operate',
            'client': 'BioMed Solutions',
            'budget': 25000,
            'priority': 'urgent',
        },
        {
            'name': 'Electric Vehicle Battery Management',
            'description': 'Infringement search for advanced battery management system patents.',
            'type': 'infringement-search',
            'client': 'AutoTech Industries',
            'budget': 12000,
            'priority': 'high',
        },
        {
            'name': 'Cancer Treatment Drug Compound',
            'description': 'State of art search for novel pharmaceutical compounds in oncology.',
            'type': 'state-of-art',
            'client': 'PharmaCorp Ltd',
            'budget': 35000,
            'priority': 'urgent',
        },
        {
            'name': 'Blockchain Data Storage System',
            'description': 'Patent portfolio analysis for decentralized storage technology.',
            'type': 'patent-portfolio-analysis',
            'client': 'DataDriven Systems',
            'budget': 20000,
            'priority': 'medium',
        },
        {
            'name': 'Quantum Encryption Device',
            'description': 'Utility patent drafting for quantum cryptography hardware.',
            'type': 'patent-drafting-utility',
            'client': 'CyberSecure Inc',
            'budget': 18000,
            'priority': 'high',
        },
        {
            'name': 'Nano-coating Material',
            'description': 'Provisional patent application for self-healing nano-coating technology.',
            'type': 'patent-drafting-provisional',
            'client': 'NanoTech Materials',
            'budget': 7000,
            'priority': 'medium',
        },
        {
            'name': 'Drone Navigation System',
            'description': 'Patent illustration services for autonomous drone navigation patents.',
            'type': 'patent-illustration',
            'client': 'AeroSpace Dynamics',
            'budget': 5000,
            'priority': 'low',
        },
        {
            'name': 'Quantum Computing Algorithm',
            'description': 'Patent proofreading for quantum algorithm patent applications.',
            'type': 'patent-proofreading',
            'client': 'QuantumCompute Ltd',
            'budget': 3000,
            'priority': 'medium',
        },
        {
            'name': 'Renewable Energy Harvester',
            'description': 'Prior art patentability search for multi-source energy harvesting device.',
            'type': 'prior-art-patentability',
            'client': 'Renewable Power Systems',
            'budget': 10000,
            'priority': 'high',
        },
        {
            'name': 'Cardiac Monitoring Implant',
            'description': 'Prior art invalidity search challenging competitor medical device patents.',
            'type': 'prior-art-invalidity',
            'client': 'MedDevice Corp',
            'budget': 15000,
            'priority': 'urgent',
        },
        {
            'name': 'Robotic Surgery Assistant',
            'description': 'Freedom to operate analysis for robotic surgical systems.',
            'type': 'freedom-to-operate',
            'client': 'AI Robotics Inc',
            'budget': 22000,
            'priority': 'high',
        },
        {
            'name': 'Solar Panel Efficiency Enhancement',
            'description': 'State of art search for photovoltaic efficiency improvement technologies.',
            'type': 'state-of-art',
            'client': 'CleanTech Innovations',
            'budget': 12000,
            'priority': 'medium',
        },
        {
            'name': 'Water Purification System',
            'description': 'Patent portfolio analysis for water treatment and purification technologies.',
            'type': 'patent-portfolio-analysis',
            'client': 'TechInnovate Corp',
            'budget': 16000,
            'priority': 'low',
        }
    ]

    projects = []
    for i, data in enumerate(project_data):
        # Calculate dates
        start_date = timezone.now().date() - timedelta(days=random.randint(1, 90))
        duration = random.randint(10, 60)
        target_date = start_date + timedelta(days=duration)
        
        # Set status based on progress
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

        project = Project.objects.create(
            name=data['name'],
            description=data['description'],
            type=data['type'],
            status=status,
            priority=data['priority'],
            client_name=data['client'],
            client_email=f"contact@{data['client'].lower().replace(' ', '').replace('.', '')}.com",
            budget=data['budget'],
            actual_cost=data['budget'] * random.uniform(0.7, 1.2),
            currency='USD',
            start_date=start_date,
            target_date=target_date,
            progress_percentage=progress,
            tags=['patent', 'research', data['type']],
            created_by=random.choice(users)
        )
        projects.append(project)
        print(f"Created project: {project.name}")

    return projects

def assign_project_members(projects, users):
    """Assign users to projects based on roles"""
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

        # Create project members based on project priority
        members_to_add = []
        
        # Always add a manager or supervisor
        managers = users_by_role.get('manager', []) + users_by_role.get('supervisor', [])
        if managers:
            members_to_add.append((random.choice(managers), 'admin'))

        # Add lead attorney as member
        if project.lead_attorney:
            members_to_add.append((project.lead_attorney, 'lead_attorney'))

        # Add additional team members based on project priority
        if project.priority in ['high', 'urgent']:
            # Add analysts for research-heavy projects
            analysts = users_by_role.get('analyst', [])
            if analysts:
                members_to_add.append((random.choice(analysts), 'viewer'))
            
            # Add paralegal for documentation
            paralegals = users_by_role.get('paralegal', [])
            if paralegals:
                members_to_add.append((random.choice(paralegals), 'paralegal'))

        # Create ProjectMember objects
        for user, role in members_to_add:
            member, created = ProjectMember.objects.get_or_create(
                project=project,
                user=user,
                defaults={
                    'role': role,
                    'permissions': ['view'] if role == 'viewer' else ['view', 'edit']
                }
            )
            if created:
                print(f"  Added {user.username} ({role}) to {project.name}")

def create_tasks_and_milestones(projects, users):
    """Create tasks and milestones for projects"""
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
        'Coordinate with inventors'
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
        project_members = ProjectMember.objects.filter(project=project)
        if not project_members:
            continue

        # Create tasks
        num_tasks = random.randint(3, 6)
        for i in range(num_tasks):
            task = ProjectTask.objects.create(
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

        # Create milestones
        num_milestones = random.randint(2, 4)
        for i in range(num_milestones):
            milestone_date = project.start_date + timedelta(
                days=int((project.target_date - project.start_date).days * (i + 1) / num_milestones)
            )
            ProjectMilestone.objects.create(
                project=project,
                title=random.choice(milestone_templates),
                description=f'Milestone for {project.name}',
                target_date=milestone_date,
                is_completed=milestone_date < timezone.now().date(),
                importance=random.choice(['low', 'medium', 'high']),
                created_by=project.created_by
            )

def main():
    print("Creating sample data for Patent Analytics Platform...")
    
    with transaction.atomic():
        print("\n1. Creating users...")
        users = create_users()
        
        print(f"\n2. Creating 15 projects...")
        projects = create_projects(users)
        
        print(f"\n3. Assigning project members...")
        assign_project_members(projects, users)
        
        print(f"\n4. Creating tasks and milestones...")
        create_tasks_and_milestones(projects, users)
    
    print(f"\n✅ Successfully created:")
    print(f"   - {len(users)} users with various roles")
    print(f"   - {len(projects)} projects with different types")
    print(f"   - Project assignments based on roles")
    print(f"   - Tasks and milestones for each project")
    print(f"\nSample login credentials:")
    print(f"   Manager: john_manager / password123")
    print(f"   Attorney: david_attorney / password123") 
    print(f"   Analyst: alex_analyst / password123")

if __name__ == '__main__':
    main()