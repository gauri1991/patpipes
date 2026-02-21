"""
Simple script to create sample patent data using Django ORM
Run with: ./venv/bin/python manage.py shell < create_sample_simple.py
"""

# Create sample organization and user  
from domains.accounts.models import Organization, User
from domains.prosecution.models import PatentApplication, Claim

# Create organization
org, created = Organization.objects.get_or_create(
    name="Demo Patent Firm",
    defaults={
        'email': 'contact@demopatentfirm.com',
        'subscription_plan': 'professional',
        'is_active': True
    }
)

# Create user
user, created = User.objects.get_or_create(
    username="patent_attorney", 
    defaults={
        'email': 'attorney@demopatentfirm.com',
        'first_name': 'Jane',
        'last_name': 'Smith',
        'organization': org,
        'is_active': True
    }
)

if created:
    user.set_password('demo123')
    user.save()

# Create sample patent application
app = PatentApplication.objects.create(
    id=1,
    title="Machine Learning System for Automated Patent Analysis",
    application_number="US17/123456",
    status="draft",
    application_type="utility", 
    priority_level="high",
    jurisdiction="US",
    abstract="A comprehensive patent analytics system leveraging machine learning to analyze patent portfolios and provide actionable insights.",
    background="Traditional patent analysis methods are time-consuming and fail to identify patterns in large datasets.",
    summary="The invention provides an AI-powered patent analytics platform with automated classification and analysis capabilities.", 
    detailed_description="The system comprises machine learning modules for patent classification, natural language processing for text analysis, and workflow management tools.",
    organization=org,
    created_by=user
)

# Create sample claims
claims_text = [
    "A patent analytics system comprising: a) a machine learning engine; b) a natural language processor; c) a workflow manager.",
    "The system of claim 1, wherein the machine learning engine uses neural networks.",
    "The system of claim 1, wherein the natural language processor extracts technical concepts.",
    "A method for analyzing patents using machine learning algorithms.",
    "The method of claim 4, comprising generating insights from patent data."
]

for i, text in enumerate(claims_text, 1):
    Claim.objects.create(
        application=app,
        claim_number=i,
        claim_type="independent" if i in [1, 4] else "dependent", 
        claim_text=text,
        is_main_claim=i == 1,
        dependencies=[] if i in [1, 4] else [1] if i < 4 else [4]
    )

print(f"✅ Created patent application: {app.title}")
print(f"✅ Created {claims_text.__len__()} claims")  
print(f"🎉 Access at: http://localhost:3000/dashboard/prosecution/drafting/1")