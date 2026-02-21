"""
Intelligent Column Mapping Service
Provides fuzzy matching and intelligent mapping for Excel column names to PatentRecord fields
"""

import re
import json
import logging
from typing import Dict, List, Tuple, Optional, Any
from difflib import SequenceMatcher
from dataclasses import dataclass
from django.db import transaction
from django.contrib.auth import get_user_model

try:
    from rapidfuzz import fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False

from .models import ColumnMappingRule, DatasetColumnMapping, PatentDataset, DynamicPatentField

logger = logging.getLogger(__name__)
User = get_user_model()


@dataclass
class ColumnMatch:
    """Represents a potential column mapping match"""
    source_column: str
    target_field: str
    confidence_score: float
    mapping_rule: Optional[ColumnMappingRule]
    is_core_field: bool
    suggested_field_type: str = 'CharField'
    sample_values: List[Any] = None
    
    def __post_init__(self):
        if self.sample_values is None:
            self.sample_values = []


@dataclass
class MappingResult:
    """Results of column mapping analysis"""
    matches: List[ColumnMatch]
    unmapped_columns: List[str]
    conflicts: List[Dict[str, Any]]
    confidence_threshold: float = 70.0
    
    @property
    def high_confidence_matches(self) -> List[ColumnMatch]:
        return [m for m in self.matches if m.confidence_score >= 90]
    
    @property
    def medium_confidence_matches(self) -> List[ColumnMatch]:
        return [m for m in self.matches if 70 <= m.confidence_score < 90]
    
    @property
    def low_confidence_matches(self) -> List[ColumnMatch]:
        return [m for m in self.matches if m.confidence_score < 70]


class IntelligentColumnMappingService:
    """
    Intelligent column mapping service with fuzzy matching and learning capabilities
    """
    
    # Core PatentRecord fields that should not be created dynamically
    CORE_PATENT_FIELDS = {
        'id', 'dataset', 'row_number', 'patent_id', 'title', 'abstract', 
        'assignee', 'inventor', 'filing_date', 'publication_date', 'grant_date',
        'ipc_classification', 'cpc_classification', 'uspc_classification',
        'country_code', 'jurisdiction', 'patent_type', 'legal_status',
        'claims_count', 'forward_citations', 'backward_citations',
        'raw_data', 'parsing_notes', 'created_at', 'updated_at'
    }
    
    # Built-in mapping patterns for common variations
    BUILTIN_PATTERNS = {
        'patent_id': [
            'patent number', 'patent no', 'patent id', 'application number', 
            'application no', 'app no', 'pub no', 'publication number', 
            'patent_number', 'patent_no', 'app_no', 'application_number'
        ],
        'title': [
            'title', 'patent title', 'invention title', 'patent_title', 
            'invention_title', 'name', 'patent name'
        ],
        'abstract': [
            'abstract', 'summary', 'description', 'brief description',
            'patent abstract', 'invention summary'
        ],
        'assignee': [
            'assignee', 'owner', 'applicant', 'company', 'organization',
            'patent owner', 'patent assignee', 'current assignee',
            'assignee_name', 'owner_name', 'applicant_name'
        ],
        'inventor': [
            'inventor', 'inventors', 'inventor name', 'inventor names',
            'inventor_name', 'inventor_names', 'author', 'authors',
            'creator', 'creators'
        ],
        'filing_date': [
            'filing date', 'application date', 'priority date', 'filed date',
            'filing_date', 'application_date', 'priority_date', 'date filed',
            'app_date', 'file_date'
        ],
        'publication_date': [
            'publication date', 'published date', 'pub date', 'publish date',
            'publication_date', 'published_date', 'pub_date', 'date_published'
        ],
        'grant_date': [
            'grant date', 'granted date', 'issue date', 'issued date',
            'grant_date', 'granted_date', 'issue_date', 'issued_date',
            'patent_date', 'date_granted', 'date_issued'
        ],
        'country_code': [
            'country', 'country code', 'jurisdiction', 'territory',
            'country_code', 'jurisdiction_code', 'filing_country',
            'patent_country', 'cc', 'ctry'
        ],
        'patent_type': [
            'patent type', 'type', 'kind', 'patent kind', 'document type',
            'patent_type', 'kind_code', 'document_type', 'doc_type'
        ],
        'ipc_classification': [
            'ipc', 'ipc class', 'ipc classification', 'international patent class',
            'ipc_class', 'ipc_classification', 'ipc_code', 'int_class'
        ],
        'cpc_classification': [
            'cpc', 'cpc class', 'cpc classification', 'cooperative patent class',
            'cpc_class', 'cpc_classification', 'cpc_code'
        ],
        'uspc_classification': [
            'uspc', 'us class', 'us classification', 'united states patent class',
            'uspc_class', 'uspc_classification', 'us_class', 'class'
        ],
        'legal_status': [
            'legal status', 'status', 'patent status', 'current status',
            'legal_status', 'patent_status', 'status_code'
        ],
        'claims_count': [
            'claims', 'claim count', 'number of claims', 'claims count',
            'claims_count', 'claim_count', 'num_claims', 'no_claims'
        ],
        'forward_citations': [
            'forward citations', 'cited by', 'citations forward',
            'forward_citations', 'cited_by_count', 'citations_received'
        ],
        'backward_citations': [
            'backward citations', 'references', 'citations backward', 'prior art',
            'backward_citations', 'references_count', 'citations_made'
        ]
    }
    
    def __init__(self):
        self.confidence_threshold = 70.0
        self._initialize_builtin_rules()
    
    def _initialize_builtin_rules(self):
        """Initialize built-in mapping rules if they don't exist"""
        try:
            for target_field, patterns in self.BUILTIN_PATTERNS.items():
                rule, created = ColumnMappingRule.objects.get_or_create(
                    target_field=target_field,
                    defaults={
                        'column_patterns': patterns,
                        'field_type': self._get_default_field_type(target_field),
                        'field_params': self._get_default_field_params(target_field),
                        'confidence_level': 'high',
                        'is_core_field': True,
                        'is_active': True
                    }
                )
                if created:
                    logger.info(f"Created built-in mapping rule for {target_field}")
        except Exception as e:
            logger.error(f"Error initializing built-in rules: {e}")
    
    def _get_default_field_type(self, field_name: str) -> str:
        """Get default Django field type for a patent field"""
        field_type_mapping = {
            'filing_date': 'DateField',
            'publication_date': 'DateField', 
            'grant_date': 'DateField',
            'claims_count': 'IntegerField',
            'forward_citations': 'IntegerField',
            'backward_citations': 'IntegerField',
            'title': 'TextField',
            'abstract': 'TextField',
            'assignee': 'TextField',
            'inventor': 'TextField',
        }
        return field_type_mapping.get(field_name, 'CharField')
    
    def _get_default_field_params(self, field_name: str) -> dict:
        """Get default field parameters for a patent field"""
        if field_name in ['title', 'abstract', 'assignee', 'inventor']:
            return {'blank': True}
        elif 'date' in field_name:
            return {'null': True, 'blank': True}
        elif 'count' in field_name or 'citations' in field_name:
            return {'null': True, 'blank': True}
        else:
            return {'max_length': 255, 'blank': True}
    
    def analyze_columns(
        self, 
        column_names: List[str], 
        sample_data: Optional[Dict[str, List[Any]]] = None,
        dataset: Optional[PatentDataset] = None
    ) -> MappingResult:
        """
        Analyze column names and provide intelligent mapping suggestions
        
        Args:
            column_names: List of column names from uploaded file
            sample_data: Sample values for each column for type inference
            dataset: Dataset for project-specific rules
            
        Returns:
            MappingResult with matches, conflicts, and unmapped columns
        """
        matches = []
        unmapped_columns = []
        conflicts = []
        
        # Get active mapping rules
        rules = ColumnMappingRule.objects.filter(is_active=True)
        
        for column_name in column_names:
            best_match = self._find_best_match(column_name, rules, sample_data)
            
            if best_match and best_match.confidence_score >= self.confidence_threshold:
                matches.append(best_match)
            else:
                # Try to create dynamic field suggestion
                dynamic_match = self._suggest_dynamic_field(column_name, sample_data)
                if dynamic_match:
                    matches.append(dynamic_match)
                else:
                    unmapped_columns.append(column_name)
        
        # Check for conflicts (multiple columns mapping to same field)
        conflicts = self._detect_conflicts(matches)
        
        return MappingResult(
            matches=matches,
            unmapped_columns=unmapped_columns,
            conflicts=conflicts,
            confidence_threshold=self.confidence_threshold
        )
    
    def _find_best_match(
        self, 
        column_name: str, 
        rules: List[ColumnMappingRule],
        sample_data: Optional[Dict[str, List[Any]]] = None
    ) -> Optional[ColumnMatch]:
        """Find the best matching rule for a column name"""
        best_match = None
        best_score = 0.0
        
        for rule in rules:
            score = self._calculate_match_score(column_name, rule.column_patterns)
            
            if score > best_score:
                best_score = score
                sample_values = sample_data.get(column_name, []) if sample_data else []
                
                best_match = ColumnMatch(
                    source_column=column_name,
                    target_field=rule.target_field,
                    confidence_score=score,
                    mapping_rule=rule,
                    is_core_field=rule.is_core_field,
                    suggested_field_type=rule.field_type,
                    sample_values=sample_values[:10]  # Limit sample size
                )
        
        return best_match
    
    def _calculate_match_score(self, column_name: str, patterns: List[str]) -> float:
        """Calculate confidence score for column name against patterns"""
        column_clean = self._clean_column_name(column_name)
        best_score = 0.0
        
        for pattern in patterns:
            pattern_clean = self._clean_column_name(pattern)
            
            # Exact match
            if column_clean == pattern_clean:
                return 100.0
            
            # Fuzzy string similarity - use rapidfuzz if available for better performance
            if RAPIDFUZZ_AVAILABLE:
                similarity = fuzz.ratio(column_clean, pattern_clean) / 100.0
            else:
                similarity = SequenceMatcher(None, column_clean, pattern_clean).ratio()
            fuzzy_score = similarity * 100
            
            # Keyword matching bonus
            if self._contains_keywords(column_clean, pattern_clean):
                fuzzy_score *= 1.2
            
            # Length penalty for very different lengths
            len_diff = abs(len(column_clean) - len(pattern_clean))
            if len_diff > 5:
                fuzzy_score *= 0.9
            
            best_score = max(best_score, min(fuzzy_score, 100.0))
        
        return best_score
    
    def _clean_column_name(self, name: str) -> str:
        """Clean and normalize column name for matching"""
        # Convert to lowercase
        clean = name.lower()
        
        # Replace common separators with spaces
        clean = re.sub(r'[_\-\.\s]+', ' ', clean)
        
        # Remove special characters
        clean = re.sub(r'[^\w\s]', '', clean)
        
        # Remove extra whitespace
        clean = ' '.join(clean.split())
        
        return clean.strip()
    
    def _contains_keywords(self, column: str, pattern: str) -> bool:
        """Check if column contains key words from pattern"""
        column_words = set(column.split())
        pattern_words = set(pattern.split())
        
        # Check for any word overlap
        return bool(column_words & pattern_words)
    
    def _suggest_dynamic_field(
        self, 
        column_name: str, 
        sample_data: Optional[Dict[str, List[Any]]] = None
    ) -> Optional[ColumnMatch]:
        """Suggest creating a dynamic field for unmapped columns"""
        field_name = self._generate_field_name(column_name)
        
        # Skip if it would conflict with core fields
        if field_name in self.CORE_PATENT_FIELDS:
            return None
        
        sample_values = sample_data.get(column_name, []) if sample_data else []
        field_type = self._infer_field_type(sample_values)
        
        return ColumnMatch(
            source_column=column_name,
            target_field=field_name,
            confidence_score=60.0,  # Medium-low confidence for dynamic fields
            mapping_rule=None,
            is_core_field=False,
            suggested_field_type=field_type,
            sample_values=sample_values[:10]
        )
    
    def _generate_field_name(self, column_name: str) -> str:
        """Generate a valid Django field name from column name"""
        # Clean the name
        field_name = self._clean_column_name(column_name)
        
        # Replace spaces with underscores
        field_name = field_name.replace(' ', '_')
        
        # Ensure it starts with letter or underscore
        if field_name and not (field_name[0].isalpha() or field_name[0] == '_'):
            field_name = 'field_' + field_name
        
        # Truncate if too long
        if len(field_name) > 60:
            field_name = field_name[:60]
        
        # Ensure uniqueness by adding suffix if needed
        base_name = field_name
        counter = 1
        while field_name in self.CORE_PATENT_FIELDS:
            field_name = f"{base_name}_{counter}"
            counter += 1
        
        return field_name
    
    def _infer_field_type(self, sample_values: List[Any]) -> str:
        """Infer Django field type from sample values"""
        if not sample_values:
            return 'CharField'
        
        # Filter out None/empty values for analysis
        non_empty = [v for v in sample_values if v is not None and str(v).strip()]
        if not non_empty:
            return 'CharField'
        
        # Check for dates
        date_patterns = [
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',  # YYYY-MM-DD or YYYY/MM/DD
            r'\d{1,2}[-/]\d{1,2}[-/]\d{4}',  # MM/DD/YYYY or DD/MM/YYYY
            r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',  # ISO datetime
        ]
        date_count = sum(1 for v in non_empty[:10] 
                        if any(re.match(pattern, str(v)) for pattern in date_patterns))
        if date_count >= len(non_empty) * 0.8:
            return 'DateField'
        
        # Check for integers
        int_count = 0
        float_count = 0
        for v in non_empty[:10]:
            try:
                float_val = float(str(v))
                if float_val.is_integer():
                    int_count += 1
                else:
                    float_count += 1
            except (ValueError, TypeError):
                pass
        
        if int_count >= len(non_empty) * 0.8:
            return 'IntegerField'
        elif (int_count + float_count) >= len(non_empty) * 0.8:
            return 'FloatField'
        
        # Check for boolean values
        bool_count = sum(1 for v in non_empty[:10] 
                        if str(v).lower() in ['true', 'false', 'yes', 'no', '1', '0', 't', 'f'])
        if bool_count >= len(non_empty) * 0.8:
            return 'BooleanField'
        
        # Check for long text (potential TextField)
        avg_length = sum(len(str(v)) for v in non_empty[:10]) / len(non_empty)
        if avg_length > 255:
            return 'TextField'
        
        return 'CharField'
    
    def _detect_conflicts(self, matches: List[ColumnMatch]) -> List[Dict[str, Any]]:
        """Detect conflicts where multiple columns map to the same field"""
        field_mappings = {}
        conflicts = []
        
        for match in matches:
            if match.target_field in field_mappings:
                # Conflict detected
                existing_match = field_mappings[match.target_field]
                conflict = {
                    'target_field': match.target_field,
                    'conflicting_columns': [existing_match.source_column, match.source_column],
                    'confidence_scores': [existing_match.confidence_score, match.confidence_score],
                    'suggested_resolution': 'manual_review'
                }
                conflicts.append(conflict)
            else:
                field_mappings[match.target_field] = match
        
        return conflicts
    
    @transaction.atomic
    def apply_mappings(
        self, 
        dataset: PatentDataset, 
        mappings: List[ColumnMatch],
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Apply confirmed column mappings to a dataset
        
        Args:
            dataset: Target dataset
            mappings: List of confirmed column mappings
            user: User applying the mappings
            
        Returns:
            Dictionary with application results
        """
        results = {
            'applied_mappings': 0,
            'dynamic_fields_created': 0,
            'errors': [],
            'created_fields': [],
            'migration_applied': False,
            'migration_name': None
        }
        
        # Clear existing mappings for this dataset
        DatasetColumnMapping.objects.filter(dataset=dataset).delete()
        
        dynamic_fields_to_migrate = []
        
        for mapping in mappings:
            try:
                # Create dynamic field if needed
                if not mapping.is_core_field:
                    dynamic_field = self._create_or_update_dynamic_field(
                        mapping.target_field,
                        mapping.suggested_field_type,
                        mapping.source_column,
                        dataset
                    )
                    if dynamic_field and not dynamic_field.migration_applied:
                        dynamic_fields_to_migrate.append(dynamic_field)
                        results['dynamic_fields_created'] += 1
                        results['created_fields'].append({
                            'field_name': dynamic_field.field_name,
                            'display_name': dynamic_field.display_name,
                            'field_type': dynamic_field.field_type
                        })
                
                # Create dataset mapping record
                DatasetColumnMapping.objects.create(
                    dataset=dataset,
                    mapping_rule=mapping.mapping_rule,
                    source_column=mapping.source_column,
                    target_field=mapping.target_field,
                    confidence_score=mapping.confidence_score,
                    status='confirmed' if mapping.confidence_score >= 90 else 'pending',
                    sample_values=mapping.sample_values,
                    reviewed_by=user
                )
                
                results['applied_mappings'] += 1
                
            except Exception as e:
                error_msg = f"Error applying mapping {mapping.source_column} -> {mapping.target_field}: {str(e)}"
                results['errors'].append(error_msg)
                logger.error(error_msg)
        
        # Apply dynamic field migrations if needed
        if dynamic_fields_to_migrate:
            try:
                from .dynamic_migration_service import dynamic_migration_service
                migration_result = dynamic_migration_service.generate_and_apply_migration(dynamic_fields_to_migrate)
                
                if migration_result[0]:  # Success
                    results['migration_applied'] = True
                    results['migration_name'] = migration_result[1]
                    logger.info(f"Applied migration {migration_result[1]} for {len(dynamic_fields_to_migrate)} dynamic fields")
                else:
                    error_msg = "Failed to apply database migration for dynamic fields"
                    results['errors'].append(error_msg)
                    logger.error(error_msg)
                    
            except ImportError:
                logger.warning("Dynamic migration service not available, skipping auto-migration")
            except Exception as e:
                error_msg = f"Error applying dynamic field migration: {str(e)}"
                results['errors'].append(error_msg)
                logger.error(error_msg)
        
        return results
    
    def _create_or_update_dynamic_field(
        self, 
        field_name: str, 
        field_type: str, 
        source_column: str,
        dataset: PatentDataset
    ) -> Optional[DynamicPatentField]:
        """Create or update a dynamic field definition"""
        try:
            field, created = DynamicPatentField.objects.get_or_create(
                field_name=field_name,
                defaults={
                    'field_type': field_type,
                    'field_params': self._get_dynamic_field_params(field_type),
                    'display_name': source_column,
                    'description': f'Auto-created from column: {source_column}',
                    'is_active': True,
                    'migration_applied': False
                }
            )
            
            # Add dataset to the usage tracking
            field.datasets_using.add(dataset)
            
            return field
            
        except Exception as e:
            logger.error(f"Error creating dynamic field {field_name}: {e}")
            return None
    
    def _get_dynamic_field_params(self, field_type: str) -> dict:
        """Get appropriate parameters for dynamic field types"""
        params = {'null': True, 'blank': True}
        
        if field_type == 'CharField':
            params['max_length'] = 255
        elif field_type == 'DecimalField':
            params.update({'max_digits': 10, 'decimal_places': 2})
        
        return params
    
    def get_mapping_suggestions(
        self, 
        dataset: PatentDataset, 
        column_names: List[str],
        sample_data: Optional[Dict[str, List[Any]]] = None
    ) -> MappingResult:
        """
        Get mapping suggestions for a specific dataset
        Convenience method that includes dataset-specific logic
        """
        return self.analyze_columns(column_names, sample_data, dataset)


# Global service instance
column_mapping_service = IntelligentColumnMappingService()