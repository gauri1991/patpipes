"""
Export functionality for patent analysis results
Supports CSV, JSON, Excel formats
"""

import csv
import json
import pandas as pd
from io import StringIO, BytesIO
from typing import List, Dict, Optional
from django.http import HttpResponse
from django.utils import timezone
from django.db import models

from ..models import ProcessingPipeline, PatentEntityExtraction, PatentTriplet


class ResultsExporter:
    """Export pipeline results in various formats"""
    
    def __init__(self, pipeline: ProcessingPipeline):
        self.pipeline = pipeline
        self.dataset = pipeline.dataset
    
    def export_csv(self, include_entities: bool = True, include_triplets: bool = True) -> HttpResponse:
        """Export results as CSV file"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="pipeline_{self.pipeline.id}_results.csv"'
        
        output = StringIO()
        
        if include_entities:
            output.write("=== ENTITIES ===\n")
            entities_csv = self._export_entities_csv()
            output.write(entities_csv)
            output.write("\n\n")
        
        if include_triplets:
            output.write("=== TRIPLETS ===\n")
            triplets_csv = self._export_triplets_csv()
            output.write(triplets_csv)
        
        response.write(output.getvalue())
        return response
    
    def export_json(self, include_metadata: bool = True) -> HttpResponse:
        """Export results as JSON file"""
        response = HttpResponse(content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="pipeline_{self.pipeline.id}_results.json"'
        
        data = {
            'pipeline_info': {
                'id': str(self.pipeline.id),
                'dataset_name': self.dataset.name,
                'start_time': self.pipeline.start_time.isoformat() if self.pipeline.start_time else None,
                'end_time': self.pipeline.end_time.isoformat() if self.pipeline.end_time else None,
                'current_stage': self.pipeline.current_stage,
                'total_patents': self.pipeline.total_patents,
                'processed_patents': self.pipeline.processed_patents
            } if include_metadata else {},
            'entities': self._get_entities_data(),
            'triplets': self._get_triplets_data(),
            'statistics': self._get_statistics(),
            'exported_at': timezone.now().isoformat()
        }
        
        response.write(json.dumps(data, indent=2, default=str))
        return response
    
    def export_excel(self) -> HttpResponse:
        """Export results as Excel file with multiple sheets"""
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="pipeline_{self.pipeline.id}_results.xlsx"'
        
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Pipeline info sheet
            pipeline_info = pd.DataFrame([{
                'Pipeline ID': str(self.pipeline.id),
                'Dataset Name': self.dataset.name,
                'Start Time': self.pipeline.start_time,
                'End Time': self.pipeline.end_time,
                'Status': self.pipeline.current_stage,
                'Total Patents': self.pipeline.total_patents,
                'Processed Patents': self.pipeline.processed_patents,
                'Failed Patents': self.pipeline.failed_patents,
                'Total Entities': self.pipeline.total_entities,
                'Total Triplets': self.pipeline.total_triplets
            }])
            pipeline_info.to_excel(writer, sheet_name='Pipeline Info', index=False)
            
            # Entities sheet
            entities_df = pd.DataFrame(self._get_entities_data())
            if not entities_df.empty:
                entities_df.to_excel(writer, sheet_name='Entities', index=False)
            
            # Triplets sheet
            triplets_df = pd.DataFrame(self._get_triplets_data())
            if not triplets_df.empty:
                triplets_df.to_excel(writer, sheet_name='Triplets', index=False)
            
            # Statistics sheet
            stats = self._get_statistics()
            if stats:
                stats_df = pd.DataFrame([
                    {'Metric': k, 'Value': v} for k, v in stats.items()
                ])
                stats_df.to_excel(writer, sheet_name='Statistics', index=False)
        
        response.write(output.getvalue())
        return response
    
    def _export_entities_csv(self) -> str:
        """Export entities as CSV string"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'Patent ID', 'Entity Text', 'Entity Type', 'Normalized Form',
            'Confidence Score', 'Source Field', 'Extraction Method',
            'Start Position', 'End Position', 'Attributes'
        ])
        
        # Data rows
        entities = PatentEntityExtraction.objects.filter(
            patent_record__dataset=self.dataset
        ).select_related('patent_record')
        
        for entity in entities:
            writer.writerow([
                entity.patent_record.patent_id,
                entity.entity_text,
                entity.entity_type,
                entity.normalized_form or '',
                entity.confidence_score,
                entity.source_field,
                entity.extraction_method,
                entity.start_position,
                entity.end_position,
                json.dumps(entity.attributes) if entity.attributes else ''
            ])
        
        return output.getvalue()
    
    def _export_triplets_csv(self) -> str:
        """Export triplets as CSV string"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'Patent ID', 'Subject Text', 'Subject Type', 'Predicate',
            'Object Text', 'Object Type', 'Confidence Score',
            'Source Sentence', 'Context'
        ])
        
        # Data rows
        triplets = PatentTriplet.objects.filter(
            patent_record__dataset=self.dataset
        ).select_related('patent_record', 'subject_entity', 'object_entity')
        
        for triplet in triplets:
            writer.writerow([
                triplet.patent_record.patent_id,
                triplet.subject_entity.entity_text,
                triplet.subject_entity.entity_type,
                triplet.predicate,
                triplet.object_entity.entity_text,
                triplet.object_entity.entity_type,
                triplet.confidence_score,
                triplet.source_sentence,
                json.dumps(triplet.context_data) if triplet.context_data else ''
            ])
        
        return output.getvalue()
    
    def _get_entities_data(self) -> List[Dict]:
        """Get entities data as list of dictionaries"""
        entities = PatentEntityExtraction.objects.filter(
            patent_record__dataset=self.dataset
        ).select_related('patent_record')
        
        return [
            {
                'patent_id': e.patent_record.patent_id,
                'entity_text': e.entity_text,
                'entity_type': e.entity_type,
                'normalized_form': e.normalized_form,
                'confidence_score': e.confidence_score,
                'source_field': e.source_field,
                'extraction_method': e.extraction_method,
                'start_position': e.start_position,
                'end_position': e.end_position,
                'attributes': e.attributes
            } for e in entities
        ]
    
    def _get_triplets_data(self) -> List[Dict]:
        """Get triplets data as list of dictionaries"""
        triplets = PatentTriplet.objects.filter(
            patent_record__dataset=self.dataset
        ).select_related('patent_record', 'subject_entity', 'object_entity')
        
        return [
            {
                'patent_id': t.patent_record.patent_id,
                'subject_text': t.subject_entity.entity_text,
                'subject_type': t.subject_entity.entity_type,
                'predicate': t.predicate,
                'object_text': t.object_entity.entity_text,
                'object_type': t.object_entity.entity_type,
                'confidence_score': t.confidence_score,
                'source_sentence': t.source_sentence,
                'triplet_display': f"{t.subject_entity.entity_text} → {t.predicate} → {t.object_entity.entity_text}",
                'context_data': t.context_data
            } for t in triplets
        ]
    
    def _get_statistics(self) -> Dict:
        """Get processing statistics"""
        entities = PatentEntityExtraction.objects.filter(patent_record__dataset=self.dataset)
        triplets = PatentTriplet.objects.filter(patent_record__dataset=self.dataset)
        
        return {
            'total_entities': entities.count(),
            'unique_entities': entities.values('normalized_form').distinct().count(),
            'entities_by_type': dict(entities.values_list('entity_type').annotate(count=models.Count('id'))),
            'total_triplets': triplets.count(),
            'unique_relationships': triplets.values('predicate').distinct().count(),
            'relationships_by_type': dict(triplets.values_list('predicate').annotate(count=models.Count('id'))),
            'avg_confidence_entities': entities.aggregate(avg=models.Avg('confidence_score'))['avg'],
            'avg_confidence_triplets': triplets.aggregate(avg=models.Avg('confidence_score'))['avg'],
            'processing_date': timezone.now().isoformat()
        }


def create_exporter(pipeline_id: str) -> Optional[ResultsExporter]:
    """Factory function to create results exporter"""
    try:
        pipeline = ProcessingPipeline.objects.get(id=pipeline_id)
        return ResultsExporter(pipeline)
    except ProcessingPipeline.DoesNotExist:
        return None