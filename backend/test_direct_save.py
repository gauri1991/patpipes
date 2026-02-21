#!/usr/bin/env python
"""Test entity creation directly"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import PatentDataset, PatentRecord, PatentEntityExtraction
from django.contrib.auth import get_user_model

User = get_user_model()

# Get a patent record
dataset = PatentDataset.objects.filter(patent_records__isnull=False).first()
patent_record = dataset.patent_records.first()

print(f"Using patent: {patent_record.patent_id}")

# Try to create an entity
try:
    entity = PatentEntityExtraction.objects.create(
        patent_record=patent_record,
        entity_text="test entity",
        entity_type="component",
        normalized_form="test entity",  # Explicitly set
        source_field="abstract",
        source_text="This is a test context",
        confidence_score=0.8,
        extraction_method="hybrid",
        extraction_agent="test",
        position_start=0,
        position_end=10
    )
    print(f"✓ Entity created: {entity.id}")
except Exception as e:
    print(f"✗ Error creating entity: {e}")
    
    # Check model fields
    print("\nChecking field requirements:")
    for field in PatentEntityExtraction._meta.fields:
        if not field.blank and not field.null and not field.has_default():
            print(f"  - {field.name}: required (not null, not blank, no default)")