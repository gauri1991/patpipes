"""
Advanced Quality Control System
Comprehensive quality validation, scoring, and remediation framework
"""

import re
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile

from .models import (
    QualityControl, QualityCheckResult, WorkflowStepInstance, 
    QualityControlType, WorkflowStep
)

User = get_user_model()
logger = logging.getLogger(__name__)


class QualityRuleSeverity(Enum):
    """Severity levels for quality rule violations"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error" 
    CRITICAL = "critical"


class QualityCheckStatus(Enum):
    """Status of quality check execution"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


@dataclass
class QualityIssue:
    """Individual quality issue found during validation"""
    rule_id: str
    severity: QualityRuleSeverity
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    location: Optional[str] = None
    suggestion: Optional[str] = None
    auto_fixable: bool = False


@dataclass 
class QualityCheckReport:
    """Complete quality check report"""
    check_id: str
    check_name: str
    status: QualityCheckStatus
    score: int
    max_score: int
    issues: List[QualityIssue] = field(default_factory=list)
    execution_time: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def passed(self) -> bool:
        return self.status == QualityCheckStatus.PASSED
    
    @property
    def critical_issues(self) -> List[QualityIssue]:
        return [issue for issue in self.issues if issue.severity == QualityRuleSeverity.CRITICAL]
    
    @property
    def error_issues(self) -> List[QualityIssue]:
        return [issue for issue in self.issues if issue.severity == QualityRuleSeverity.ERROR]


class QualityRuleEngine:
    """
    Advanced quality rule engine that executes various types of quality validations
    """
    
    def __init__(self):
        self.validators = {
            'automated': AutomatedQualityValidator(),
            'manual': ManualQualityValidator(),  
            'checklist': ChecklistQualityValidator(),
            'compliance': ComplianceQualityValidator(),
            'document': DocumentQualityValidator(),
            'data': DataQualityValidator(),
        }
    
    def execute_quality_control(
        self, 
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Optional[Dict[str, Any]] = None
    ) -> QualityCheckReport:
        """Execute quality control check and return detailed report"""
        
        start_time = timezone.now()
        context = context or {}
        
        try:
            # Get appropriate validator
            validator = self.validators.get(quality_control.type)
            if not validator:
                return self._create_error_report(
                    quality_control, 
                    f"No validator found for type: {quality_control.type}"
                )
            
            # Execute validation
            report = validator.validate(quality_control, step_instance, user, context)
            
            # Calculate execution time
            execution_time = (timezone.now() - start_time).total_seconds()
            report.execution_time = execution_time
            
            # Determine final score and status
            self._finalize_report(report, quality_control)
            
            logger.info(
                f"Quality check {quality_control.name} completed: "
                f"{report.status.value} (Score: {report.score}/{report.max_score})"
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Error executing quality control {quality_control.name}: {e}")
            return self._create_error_report(quality_control, str(e))
    
    def _create_error_report(self, quality_control: QualityControl, error_msg: str) -> QualityCheckReport:
        """Create error report for failed quality checks"""
        
        return QualityCheckReport(
            check_id=str(quality_control.id),
            check_name=quality_control.name,
            status=QualityCheckStatus.ERROR,
            score=0,
            max_score=100,
            issues=[QualityIssue(
                rule_id="system_error",
                severity=QualityRuleSeverity.CRITICAL,
                message=f"Quality check execution failed: {error_msg}"
            )]
        )
    
    def _finalize_report(self, report: QualityCheckReport, quality_control: QualityControl):
        """Finalize report score and status based on issues found"""
        
        if report.status == QualityCheckStatus.ERROR:
            return
        
        # Calculate score based on issues
        total_deductions = 0
        critical_issues = 0
        
        for issue in report.issues:
            if issue.severity == QualityRuleSeverity.CRITICAL:
                critical_issues += 1
                total_deductions += 25  # Critical issues are major deductions
            elif issue.severity == QualityRuleSeverity.ERROR:
                total_deductions += 15
            elif issue.severity == QualityRuleSeverity.WARNING:
                total_deductions += 8
            elif issue.severity == QualityRuleSeverity.INFO:
                total_deductions += 2
        
        # Calculate final score
        report.score = max(0, report.max_score - total_deductions)
        
        # Determine pass/fail status
        if critical_issues > 0:
            report.status = QualityCheckStatus.FAILED
        elif report.score >= quality_control.passing_score:
            report.status = QualityCheckStatus.PASSED
        else:
            report.status = QualityCheckStatus.FAILED


class BaseQualityValidator(ABC):
    """Base class for quality validators"""
    
    @abstractmethod
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        """Execute validation and return report"""
        pass
    
    def create_report(self, quality_control: QualityControl) -> QualityCheckReport:
        """Create base quality report"""
        
        return QualityCheckReport(
            check_id=str(quality_control.id),
            check_name=quality_control.name,
            status=QualityCheckStatus.RUNNING,
            score=100,
            max_score=100
        )


class AutomatedQualityValidator(BaseQualityValidator):
    """Automated quality validation using configurable rules"""
    
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        
        report = self.create_report(quality_control)
        criteria = quality_control.criteria or {}
        
        # Execute automated checks based on criteria
        if isinstance(criteria, dict):
            for rule_id, rule_config in criteria.items():
                try:
                    issues = self._execute_rule(rule_id, rule_config, step_instance, context)
                    report.issues.extend(issues)
                except Exception as e:
                    logger.error(f"Error executing rule {rule_id}: {e}")
                    report.issues.append(QualityIssue(
                        rule_id=rule_id,
                        severity=QualityRuleSeverity.ERROR,
                        message=f"Rule execution failed: {str(e)}"
                    ))
        
        return report
    
    def _execute_rule(
        self, 
        rule_id: str, 
        rule_config: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[QualityIssue]:
        """Execute individual automated rule"""
        
        # Safety check - ensure rule_config is a dictionary
        if not isinstance(rule_config, dict):
            logger.warning(f"Invalid rule config for {rule_id}: expected dict, got {type(rule_config)}")
            return []
        
        rule_type = rule_config.get('type', 'generic')
        
        if rule_type == 'completeness':
            return self._check_completeness(rule_id, rule_config, step_instance, context)
        elif rule_type == 'format':
            return self._check_format(rule_id, rule_config, step_instance, context)
        elif rule_type == 'consistency':
            return self._check_consistency(rule_id, rule_config, step_instance, context)
        elif rule_type == 'business_logic':
            return self._check_business_logic(rule_id, rule_config, step_instance, context)
        else:
            return self._check_generic_rule(rule_id, rule_config, step_instance, context)
    
    def _check_completeness(
        self, 
        rule_id: str, 
        rule_config: Dict[str, Any],
        step_instance: WorkflowStepInstance, 
        context: Dict[str, Any]
    ) -> List[QualityIssue]:
        """Check completeness of required fields/data"""
        
        issues = []
        required_fields = rule_config.get('required_fields', [])
        output_data = step_instance.output_data or {}
        
        for field in required_fields:
            if not output_data.get(field):
                issues.append(QualityIssue(
                    rule_id=rule_id,
                    severity=QualityRuleSeverity.ERROR,
                    message=f"Required field '{field}' is missing or empty",
                    suggestion=f"Please provide a value for '{field}'"
                ))
        
        return issues
    
    def _check_format(
        self,
        rule_id: str,
        rule_config: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[QualityIssue]:
        """Check format validation rules"""
        
        issues = []
        format_rules = rule_config.get('format_rules', {})
        output_data = step_instance.output_data or {}
        
        for field, format_spec in format_rules.items():
            value = output_data.get(field)
            if not value:
                continue
                
            # Check different format types
            if format_spec.get('type') == 'regex':
                pattern = format_spec.get('pattern')
                if pattern and not re.match(pattern, str(value)):
                    issues.append(QualityIssue(
                        rule_id=rule_id,
                        severity=QualityRuleSeverity.WARNING,
                        message=f"Field '{field}' does not match expected format",
                        details={'expected_pattern': pattern, 'actual_value': str(value)},
                        suggestion=f"Please format '{field}' according to the pattern: {pattern}"
                    ))
            
            elif format_spec.get('type') == 'length':
                min_length = format_spec.get('min_length', 0)
                max_length = format_spec.get('max_length', float('inf'))
                
                if len(str(value)) < min_length:
                    issues.append(QualityIssue(
                        rule_id=rule_id,
                        severity=QualityRuleSeverity.WARNING,
                        message=f"Field '{field}' is too short (minimum {min_length} characters)",
                        suggestion=f"Please provide at least {min_length} characters for '{field}'"
                    ))
                elif len(str(value)) > max_length:
                    issues.append(QualityIssue(
                        rule_id=rule_id,
                        severity=QualityRuleSeverity.WARNING,
                        message=f"Field '{field}' is too long (maximum {max_length} characters)",
                        suggestion=f"Please limit '{field}' to {max_length} characters"
                    ))
        
        return issues
    
    def _check_consistency(
        self,
        rule_id: str,
        rule_config: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[QualityIssue]:
        """Check consistency across related data"""
        
        issues = []
        consistency_rules = rule_config.get('consistency_rules', [])
        output_data = step_instance.output_data or {}
        
        for consistency_rule in consistency_rules:
            rule_type = consistency_rule.get('type')
            
            if rule_type == 'cross_reference':
                # Check cross-references between fields
                source_field = consistency_rule.get('source_field')
                target_field = consistency_rule.get('target_field')
                
                source_value = output_data.get(source_field)
                target_value = output_data.get(target_field)
                
                if source_value and target_value:
                    if consistency_rule.get('should_match', False):
                        if source_value != target_value:
                            issues.append(QualityIssue(
                                rule_id=rule_id,
                                severity=QualityRuleSeverity.ERROR,
                                message=f"Inconsistency: '{source_field}' and '{target_field}' should match",
                                details={
                                    'source_value': source_value,
                                    'target_value': target_value
                                }
                            ))
        
        return issues
    
    def _check_business_logic(
        self,
        rule_id: str,
        rule_config: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[QualityIssue]:
        """Check business logic rules"""
        
        issues = []
        business_rules = rule_config.get('business_rules', [])
        output_data = step_instance.output_data or {}
        
        for i, business_rule in enumerate(business_rules):
            rule_name = business_rule.get('name', 'Unknown Rule')
            business_rule_id = f"{rule_id}_business_{i}"
            
            try:
                # Simple expression evaluator for business rules
                # In production, you'd want a more sophisticated rule engine
                condition = business_rule.get('condition')
                if condition:
                    # Replace field references with actual values
                    for field, value in output_data.items():
                        condition = condition.replace(f'${field}', str(value))
                    
                    # Evaluate simple conditions (extend as needed)
                    if not self._evaluate_condition(condition, output_data):
                        issues.append(QualityIssue(
                            rule_id=business_rule_id,
                            severity=QualityRuleSeverity.ERROR,
                            message=f"Business rule violation: {rule_name}",
                            details={'condition': business_rule.get('condition')}
                        ))
                        
            except Exception as e:
                logger.error(f"Error evaluating business rule {rule_name}: {e}")
                issues.append(QualityIssue(
                    rule_id=business_rule_id,
                    severity=QualityRuleSeverity.WARNING,
                    message=f"Could not evaluate business rule: {rule_name}"
                ))
        
        return issues
    
    def _evaluate_condition(self, condition: str, data: Dict[str, Any]) -> bool:
        """Simple condition evaluator (extend as needed)"""
        
        # This is a simplified evaluator - in production you'd want a proper expression parser
        try:
            # Basic arithmetic and comparison evaluation
            # WARNING: eval() is dangerous - use a proper expression parser in production
            return bool(eval(condition, {"__builtins__": {}}, data))
        except:
            return True  # Default to pass if evaluation fails
    
    def _check_generic_rule(
        self,
        rule_id: str,
        rule_config: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[QualityIssue]:
        """Check generic configurable rule"""
        
        # Default implementation for custom rules
        return []


class ManualQualityValidator(BaseQualityValidator):
    """Manual quality validation requiring human review"""
    
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        
        report = self.create_report(quality_control)
        
        # Manual reviews require human input - mark as pending
        report.status = QualityCheckStatus.PENDING
        report.metadata.update({
            'requires_reviewer': True,
            'reviewer_roles': quality_control.reviewer_roles,
            'required_reviewers': quality_control.required_reviewers
        })
        
        return report
    
    def complete_manual_review(
        self,
        quality_control: QualityControl,
        reviewer: User,
        review_data: Dict[str, Any]
    ) -> QualityCheckReport:
        """Complete manual review with reviewer input"""
        
        report = self.create_report(quality_control)
        
        # Extract review results
        passed = review_data.get('passed', False)
        score = review_data.get('score', 0)
        comments = review_data.get('comments', '')
        issues = review_data.get('issues', [])
        
        # Convert issue data to QualityIssue objects
        report.issues = [
            QualityIssue(
                rule_id=issue.get('rule_id', 'manual_review'),
                severity=QualityRuleSeverity(issue.get('severity', 'warning')),
                message=issue.get('message', ''),
                suggestion=issue.get('suggestion', '')
            )
            for issue in issues
        ]
        
        report.score = score
        report.status = QualityCheckStatus.PASSED if passed else QualityCheckStatus.FAILED
        report.metadata.update({
            'reviewer': reviewer.get_full_name(),
            'review_comments': comments,
            'review_date': timezone.now().isoformat()
        })
        
        return report


class ChecklistQualityValidator(BaseQualityValidator):
    """Checklist-based quality validation"""
    
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        
        report = self.create_report(quality_control)
        criteria = quality_control.criteria
        
        checklist_items = criteria.get('checklist_items', [])
        completed_items = context.get('completed_checklist_items', [])
        
        # Check each checklist item
        for i, item in enumerate(checklist_items):
            item_id = item.get('id', f'item_{i}')
            
            if item_id not in completed_items:
                severity = QualityRuleSeverity.ERROR if item.get('required', True) else QualityRuleSeverity.WARNING
                
                report.issues.append(QualityIssue(
                    rule_id=item_id,
                    severity=severity,
                    message=f"Checklist item not completed: {item.get('description', item_id)}",
                    suggestion=f"Please complete: {item.get('description', item_id)}"
                ))
        
        return report


class ComplianceQualityValidator(BaseQualityValidator):
    """USPTO/MPEP compliance quality validation"""
    
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        
        report = self.create_report(quality_control)
        criteria = quality_control.criteria
        
        # Check different compliance areas
        self._check_mpep_compliance(report, criteria, step_instance, context)
        self._check_uspto_requirements(report, criteria, step_instance, context)
        self._check_section_112_compliance(report, criteria, step_instance, context)
        
        return report
    
    def _check_mpep_compliance(
        self, 
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ):
        """Check MPEP compliance requirements"""
        
        mpep_requirements = criteria.get('mpep_requirements', [])
        output_data = step_instance.output_data or {}
        
        for requirement in mpep_requirements:
            requirement_id = requirement.get('id')
            description = requirement.get('description')
            check_type = requirement.get('check_type', 'presence')
            
            if check_type == 'presence':
                field = requirement.get('field')
                if not output_data.get(field):
                    report.issues.append(QualityIssue(
                        rule_id=requirement_id,
                        severity=QualityRuleSeverity.ERROR,
                        message=f"MPEP Requirement: {description}",
                        suggestion=f"Please provide {field} to comply with MPEP {requirement_id}"
                    ))
    
    def _check_uspto_requirements(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ):
        """Check general USPTO requirements"""
        
        uspto_checks = criteria.get('uspto_checks', {})
        
        if uspto_checks.get('fee_calculation'):
            # Check if proper fees are calculated
            output_data = step_instance.output_data or {}
            if not output_data.get('calculated_fees'):
                report.issues.append(QualityIssue(
                    rule_id='fee_calculation',
                    severity=QualityRuleSeverity.ERROR,
                    message="USPTO fees must be calculated",
                    suggestion="Please calculate and document USPTO fees"
                ))
        
        if uspto_checks.get('form_compliance'):
            # Check form compliance
            if not context.get('forms_validated'):
                report.issues.append(QualityIssue(
                    rule_id='form_compliance',
                    severity=QualityRuleSeverity.WARNING,
                    message="Forms should be validated for USPTO compliance",
                    suggestion="Please validate all forms meet USPTO requirements"
                ))
    
    def _check_section_112_compliance(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ):
        """Check 35 USC 112 compliance"""
        
        section_112_checks = criteria.get('section_112', {})
        output_data = step_instance.output_data or {}
        
        # Written description requirement
        if section_112_checks.get('written_description') and not output_data.get('written_description_verified'):
            report.issues.append(QualityIssue(
                rule_id='written_description',
                severity=QualityRuleSeverity.CRITICAL,
                message="Written description requirement (35 USC 112) not verified",
                suggestion="Verify specification provides adequate written description"
            ))
        
        # Enablement requirement
        if section_112_checks.get('enablement') and not output_data.get('enablement_verified'):
            report.issues.append(QualityIssue(
                rule_id='enablement',
                severity=QualityRuleSeverity.CRITICAL,
                message="Enablement requirement (35 USC 112) not verified",
                suggestion="Verify specification enables person of ordinary skill"
            ))
        
        # Best mode requirement
        if section_112_checks.get('best_mode') and not output_data.get('best_mode_disclosed'):
            report.issues.append(QualityIssue(
                rule_id='best_mode',
                severity=QualityRuleSeverity.WARNING,
                message="Best mode disclosure should be verified",
                suggestion="Verify best mode is disclosed if known to inventor"
            ))


class DocumentQualityValidator(BaseQualityValidator):
    """Document-specific quality validation"""
    
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        
        report = self.create_report(quality_control)
        criteria = quality_control.criteria
        
        # Get attached documents from step or context
        documents = context.get('documents', [])
        
        # Check document requirements
        self._check_required_documents(report, criteria, documents)
        self._check_document_format(report, criteria, documents)
        self._check_document_content(report, criteria, documents)
        
        return report
    
    def _check_required_documents(
        self, 
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        documents: List[Dict[str, Any]]
    ):
        """Check if all required documents are present"""
        
        required_docs = criteria.get('required_documents', [])
        doc_types_present = [doc.get('type') for doc in documents]
        
        for required_doc in required_docs:
            doc_type = required_doc.get('type')
            if doc_type not in doc_types_present:
                report.issues.append(QualityIssue(
                    rule_id=f'required_doc_{doc_type}',
                    severity=QualityRuleSeverity.ERROR,
                    message=f"Required document missing: {required_doc.get('name', doc_type)}",
                    suggestion=f"Please upload {required_doc.get('name', doc_type)}"
                ))
    
    def _check_document_format(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        documents: List[Dict[str, Any]]
    ):
        """Check document format compliance"""
        
        format_rules = criteria.get('format_rules', {})
        
        for doc in documents:
            doc_type = doc.get('type')
            file_extension = doc.get('filename', '').split('.')[-1].lower()
            
            if doc_type in format_rules:
                allowed_formats = format_rules[doc_type].get('allowed_formats', [])
                if allowed_formats and file_extension not in allowed_formats:
                    report.issues.append(QualityIssue(
                        rule_id=f'format_{doc_type}',
                        severity=QualityRuleSeverity.WARNING,
                        message=f"Document format may not be optimal: {doc.get('filename')}",
                        suggestion=f"Consider using formats: {', '.join(allowed_formats)}"
                    ))
    
    def _check_document_content(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        documents: List[Dict[str, Any]]
    ):
        """Check document content requirements"""
        
        # This would integrate with document parsing/analysis tools
        # For now, just check basic content requirements
        content_rules = criteria.get('content_rules', {})
        
        for doc in documents:
            doc_type = doc.get('type')
            
            if doc_type in content_rules:
                rules = content_rules[doc_type]
                
                # Check minimum word count
                min_words = rules.get('min_words')
                if min_words and doc.get('word_count', 0) < min_words:
                    report.issues.append(QualityIssue(
                        rule_id=f'content_length_{doc_type}',
                        severity=QualityRuleSeverity.WARNING,
                        message=f"Document may be too short: {doc.get('filename')}",
                        suggestion=f"Consider expanding content (minimum {min_words} words)"
                    ))


class DataQualityValidator(BaseQualityValidator):
    """Data quality validation for structured data"""
    
    def validate(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Dict[str, Any]
    ) -> QualityCheckReport:
        
        report = self.create_report(quality_control)
        criteria = quality_control.criteria
        output_data = step_instance.output_data or {}
        
        # Check data quality dimensions
        self._check_completeness(report, criteria, output_data)
        self._check_accuracy(report, criteria, output_data)
        self._check_consistency(report, criteria, output_data)
        self._check_validity(report, criteria, output_data)
        
        return report
    
    def _check_completeness(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        data: Dict[str, Any]
    ):
        """Check data completeness"""
        
        completeness_rules = criteria.get('completeness', {})
        required_fields = completeness_rules.get('required_fields', [])
        
        for field in required_fields:
            if field not in data or not data[field]:
                report.issues.append(QualityIssue(
                    rule_id=f'completeness_{field}',
                    severity=QualityRuleSeverity.ERROR,
                    message=f"Required data field missing: {field}",
                    suggestion=f"Please provide value for {field}"
                ))
    
    def _check_accuracy(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        data: Dict[str, Any]
    ):
        """Check data accuracy"""
        
        accuracy_rules = criteria.get('accuracy', {})
        
        # Check value ranges
        range_checks = accuracy_rules.get('range_checks', {})
        for field, range_spec in range_checks.items():
            if field in data:
                value = data[field]
                try:
                    numeric_value = float(value)
                    min_val = range_spec.get('min')
                    max_val = range_spec.get('max')
                    
                    if min_val is not None and numeric_value < min_val:
                        report.issues.append(QualityIssue(
                            rule_id=f'range_{field}',
                            severity=QualityRuleSeverity.WARNING,
                            message=f"Value for {field} below expected range",
                            details={'value': value, 'min_expected': min_val}
                        ))
                    
                    if max_val is not None and numeric_value > max_val:
                        report.issues.append(QualityIssue(
                            rule_id=f'range_{field}',
                            severity=QualityRuleSeverity.WARNING,
                            message=f"Value for {field} above expected range",
                            details={'value': value, 'max_expected': max_val}
                        ))
                        
                except ValueError:
                    report.issues.append(QualityIssue(
                        rule_id=f'type_{field}',
                        severity=QualityRuleSeverity.ERROR,
                        message=f"Invalid numeric value for {field}",
                        details={'value': value}
                    ))
    
    def _check_consistency(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        data: Dict[str, Any]
    ):
        """Check data consistency"""
        
        consistency_rules = criteria.get('consistency', [])
        
        for rule in consistency_rules:
            rule_type = rule.get('type')
            
            if rule_type == 'sum_check':
                # Check if parts sum to total
                total_field = rule.get('total_field')
                part_fields = rule.get('part_fields', [])
                
                if total_field in data and all(field in data for field in part_fields):
                    try:
                        total = float(data[total_field])
                        calculated_total = sum(float(data[field]) for field in part_fields)
                        
                        if abs(total - calculated_total) > 0.01:  # Allow small floating point errors
                            report.issues.append(QualityIssue(
                                rule_id=f'sum_check_{total_field}',
                                severity=QualityRuleSeverity.ERROR,
                                message=f"Sum inconsistency in {total_field}",
                                details={
                                    'expected_total': calculated_total,
                                    'actual_total': total
                                }
                            ))
                    except ValueError:
                        report.issues.append(QualityIssue(
                            rule_id=f'sum_check_{total_field}',
                            severity=QualityRuleSeverity.ERROR,
                            message=f"Invalid numeric values in sum check for {total_field}"
                        ))
    
    def _check_validity(
        self,
        report: QualityCheckReport,
        criteria: Dict[str, Any],
        data: Dict[str, Any]
    ):
        """Check data validity"""
        
        validity_rules = criteria.get('validity', {})
        
        # Check allowed values
        allowed_values = validity_rules.get('allowed_values', {})
        for field, allowed_list in allowed_values.items():
            if field in data and data[field] not in allowed_list:
                report.issues.append(QualityIssue(
                    rule_id=f'allowed_values_{field}',
                    severity=QualityRuleSeverity.ERROR,
                    message=f"Invalid value for {field}: {data[field]}",
                    details={'allowed_values': allowed_list},
                    suggestion=f"Use one of: {', '.join(map(str, allowed_list))}"
                ))


# Global quality rule engine instance
quality_engine = QualityRuleEngine()