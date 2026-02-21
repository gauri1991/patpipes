#!/usr/bin/env python
"""
Script to parse claims text and store structured claims data in the database.
This includes identifying independent vs dependent claims and their references.
"""

import os
import sys
import django
import json
import re
from typing import List, Dict, Any

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import PatentRecord
from django.db import transaction


def analyze_claim(claim_text: str) -> Dict[str, Any]:
    """
    Analyze a single claim to determine if it's independent or dependent.
    """
    # Strong patterns that definitively indicate a dependent claim
    strong_dependency_patterns = [
        r'\bof claim\s+(\d+)',
        r'\baccording to claim\s+(\d+)',
        r'\bas claimed in claim\s+(\d+)',
        r'\bas defined in claim\s+(\d+)',
        r'\bof any of claims\s+([\d\s,and-]+)',
        r'\bof claims\s+([\d\s,and-]+)',
        r'\bof any preceding claim',
        r'\bof the preceding claim',
        r'\bfurther comprising',
        r'\bfurther including'
    ]
    
    is_dependent = False
    references = []
    
    # Check for strong dependency patterns
    for pattern in strong_dependency_patterns:
        matches = re.finditer(pattern, claim_text, re.IGNORECASE)
        for match in matches:
            is_dependent = True
            if match.groups() and match.group(1):
                # Extract claim numbers
                claim_refs = re.findall(r'\d+', match.group(1))
                references.extend(claim_refs)
            elif 'preceding claim' in pattern or 'comprising' in pattern or 'including' in pattern:
                # These patterns don't have numbered groups
                pass
    
    # Additional check: if claim starts with method/composition language, likely independent
    independent_indicators = [
        r'^A method',
        r'^A composition',
        r'^A device',
        r'^A system',
        r'^An apparatus',
        r'^A compound',
        r'^A pharmaceutical',
        r'^A process'
    ]
    
    has_independent_indicator = any(
        re.match(pattern, claim_text.strip(), re.IGNORECASE) 
        for pattern in independent_indicators
    )
    
    # If it has independent indicators and no strong dependencies, mark as independent
    if has_independent_indicator and not is_dependent:
        is_dependent = False
    
    # Remove duplicates from references
    references = list(set(references))
    
    return {
        'is_dependent': is_dependent,
        'references': references
    }


def parse_claims_text(claims_text: str) -> List[Dict[str, Any]]:
    """
    Parse full claims text into individual claims with structure.
    """
    if not claims_text:
        return []
    
    # Remove common prefixes
    clean_text = re.sub(r'^We claim:\s*\n?\s*', '', claims_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'^The invention claimed is:\s*\n?\s*', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'^What is claimed is:\s*\n?\s*', '', clean_text, flags=re.IGNORECASE)
    
    claims = []
    
    # Try different splitting patterns
    claim_patterns = [
        r'\|\s*(\d+)\.\s*',  # | 1. format
        r'\n\s*(\d+)\.\s*',  # newline + number format
        r'^\s*(\d+)\.\s*'    # start of line + number format
    ]
    
    for pattern in claim_patterns:
        parts = re.split(pattern, clean_text)
        if len(parts) > 2:  # Found at least one claim
            claims = []
            for i in range(1, len(parts), 2):
                if i + 1 < len(parts):
                    claim_number = parts[i]
                    claim_text = parts[i + 1].strip()
                    if claim_number and claim_text:
                        analysis = analyze_claim(claim_text)
                        claims.append({
                            'number': claim_number,
                            'text': claim_text,
                            'type': 'dependent' if analysis['is_dependent'] else 'independent',
                            'references': analysis['references']
                        })
            break  # Use the first pattern that works
    
    # If no pattern worked, try line-by-line parsing
    if not claims:
        lines = clean_text.split('\n')
        current_claim = ''
        current_number = ''
        
        for line in lines:
            trimmed_line = line.strip()
            claim_match = re.match(r'^(\d+)\.\s*(.*)$', trimmed_line)
            
            if claim_match:
                # Save previous claim if exists
                if current_number and current_claim:
                    analysis = analyze_claim(current_claim.strip())
                    claims.append({
                        'number': current_number,
                        'text': current_claim.strip(),
                        'type': 'dependent' if analysis['is_dependent'] else 'independent',
                        'references': analysis['references']
                    })
                
                # Start new claim
                current_number = claim_match.group(1)
                current_claim = claim_match.group(2)
            elif current_number:
                # Continue current claim
                current_claim += ' ' + trimmed_line
        
        # Add the last claim
        if current_number and current_claim:
            analysis = analyze_claim(current_claim.strip())
            claims.append({
                'number': current_number,
                'text': current_claim.strip(),
                'type': 'dependent' if analysis['is_dependent'] else 'independent',
                'references': analysis['references']
            })
    
    return claims


def process_all_records():
    """
    Process all patent records to parse and store claims structure.
    """
    print("Starting claims structure parsing for all records...")
    
    # Get all records with claims
    records = PatentRecord.objects.exclude(claims='')
    total_records = records.count()
    print(f"Found {total_records} records with claims to process")
    
    processed_count = 0
    independent_total = 0
    dependent_total = 0
    
    with transaction.atomic():
        for i, record in enumerate(records.iterator(chunk_size=100)):
            if record.claims:
                # Parse claims structure
                claims_structure = parse_claims_text(record.claims)
                
                # Count independent and dependent claims
                independent_count = len([c for c in claims_structure if c['type'] == 'independent'])
                dependent_count = len([c for c in claims_structure if c['type'] == 'dependent'])
                
                # Update record
                record.claims_structure = claims_structure
                record.independent_claims_count = independent_count
                record.dependent_claims_count = dependent_count
                record.save(update_fields=['claims_structure', 'independent_claims_count', 'dependent_claims_count'])
                
                processed_count += 1
                independent_total += independent_count
                dependent_total += dependent_count
            
            # Progress reporting
            if (i + 1) % 100 == 0:
                print(f"Processed {i + 1}/{total_records} records...")
    
    print(f"\n=== Processing Complete ===")
    print(f"Records processed: {processed_count}")
    print(f"Total independent claims: {independent_total}")
    print(f"Total dependent claims: {dependent_total}")
    print(f"Average independent claims per patent: {independent_total / processed_count:.1f}")
    print(f"Average dependent claims per patent: {dependent_total / processed_count:.1f}")


if __name__ == '__main__':
    process_all_records()