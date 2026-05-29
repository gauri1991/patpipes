"""
File Processing Services for Analytics
Handles parsing of uploaded patent datasets (Excel, CSV, etc.)
"""

import pandas as pd
import logging
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

from .models import PatentDataset, PatentRecord, DatasetColumnMapping
from .column_mapping_service import column_mapping_service

logger = logging.getLogger(__name__)

# Matches bare patent/publication numbers like "US8806222", "EP1234567B1", "8806222".
_PATENT_NUMBER_RE = re.compile(r'^[A-Z]{0,2}[-\s]?\d{5,}(?:[-\s]?[A-Z]\d?)?$', re.IGNORECASE)


def _looks_like_patent_number(value: Any) -> bool:
    """True when a cell/header value looks like a bare patent number."""
    if value is None:
        return False
    return bool(_PATENT_NUMBER_RE.match(str(value).strip().replace(',', '')))


class PatentFileProcessor:
    """Process uploaded patent files and extract records"""
    
    
    def __init__(self, dataset: PatentDataset):
        self.dataset = dataset
        self.processing_log = []
        
    def process_file(self) -> Dict[str, Any]:
        """Main entry point to process uploaded file"""
        try:
            if not self.dataset.data_file:
                raise ValueError("No file attached to dataset")
            
            file_path = self.dataset.data_file.path
            file_extension = Path(file_path).suffix.lower()
            
            self.log(f"Starting processing of {file_extension} file: {file_path}")
            
            # Read file based on extension
            if file_extension in ['.xlsx', '.xls']:
                df = self.read_excel_file(file_path)
            elif file_extension == '.csv':
                df = self.read_csv_file(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            # Process the dataframe
            result = self.process_dataframe(df)
            
            # Update dataset statistics
            self.update_dataset_stats(result)
            
            return result
            
        except Exception as e:
            error_msg = f"Failed to process file: {str(e)}"
            self.log(error_msg, level='error')
            self.dataset.processing_status = 'failed'
            self.dataset.processing_log = self.processing_log
            self.dataset.save()
            raise
    
    def read_excel_file(self, file_path: str) -> pd.DataFrame:
        """Read Excel file with error handling"""
        try:
            # Try reading with different engines
            try:
                df = pd.read_excel(file_path, engine='openpyxl')
            except:
                df = pd.read_excel(file_path, engine='xlrd')

            if self._is_headerless_patent_list(df):
                self.log("Detected headerless single-column patent list — re-reading without header")
                try:
                    df = pd.read_excel(file_path, engine='openpyxl', header=None, names=['patent number'])
                except:
                    df = pd.read_excel(file_path, engine='xlrd', header=None, names=['patent number'])

            self.log(f"Successfully read Excel file: {len(df)} rows, {len(df.columns)} columns")
            return df
            
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")
    
    def read_csv_file(self, file_path: str) -> pd.DataFrame:
        """Read CSV file with encoding detection"""
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, encoding=encoding)
                if self._is_headerless_patent_list(df):
                    self.log("Detected headerless single-column patent list — re-reading without header")
                    df = pd.read_csv(file_path, encoding=encoding, header=None, names=['patent number'])
                self.log(f"Successfully read CSV file with {encoding} encoding: {len(df)} rows, {len(df.columns)} columns")
                return df
            except UnicodeDecodeError:
                continue

        raise ValueError("Failed to read CSV file with any supported encoding")

    @staticmethod
    def _is_headerless_patent_list(df: pd.DataFrame) -> bool:
        """A single-column file whose 'header' is itself a patent number means the
        source had no header row — pandas consumed the first data value as the column
        name. Detect that so we can re-read with header=None and keep every patent."""
        return df.shape[1] == 1 and _looks_like_patent_number(df.columns[0])
    
    def process_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Process dataframe and create patent records"""
        # Clean column names
        df.columns = df.columns.str.strip().str.lower()
        original_columns = df.columns.tolist()
        
        self.log(f"Original columns: {original_columns}")
        
        # Use intelligent column mapping service
        sample_data = self.extract_sample_data(df)
        mapping_result = column_mapping_service.analyze_columns(
            list(df.columns), sample_data, self.dataset
        )
        
        # Apply high and medium confidence mappings automatically
        auto_mappings = mapping_result.high_confidence_matches + mapping_result.medium_confidence_matches
        if auto_mappings:
            apply_result = column_mapping_service.apply_mappings(
                self.dataset, auto_mappings
            )
            self.log(f"Applied {apply_result['applied_mappings']} column mappings")
            if apply_result['dynamic_fields_created'] > 0:
                self.log(f"Created {apply_result['dynamic_fields_created']} dynamic fields")
        
        # Get final column mapping from database
        column_mapping = self.get_applied_column_mapping()
        self.log(f"Final column mapping: {column_mapping}")
        
        # Process records
        processed_count = 0
        skipped_count = 0
        error_count = 0
        
        # Clear existing records for this dataset
        PatentRecord.objects.filter(dataset=self.dataset).delete()
        
        for idx, row in df.iterrows():
            try:
                # Convert row to dict and handle empty cells
                row_data = {}
                for col in df.columns:
                    value = row[col]
                    # Convert NaN to "NA"
                    if pd.isna(value) or value == '':
                        row_data[col] = 'NA'
                    else:
                        row_data[col] = str(value).strip()
                
                # Create patent record
                record = self.create_patent_record(row_data, column_mapping, idx + 2)  # +2 because header is row 1
                if record:
                    processed_count += 1
                else:
                    skipped_count += 1
                    
            except Exception as e:
                error_count += 1
                self.log(f"Error processing row {idx + 2}: {str(e)}", level='error')
        
        result = {
            'total_rows': len(df),
            'processed_count': processed_count,
            'skipped_count': skipped_count,
            'error_count': error_count,
            'original_columns': original_columns,
            'column_mapping': column_mapping,
            'processing_log': self.processing_log
        }
        
        self.log(f"Processing completed: {processed_count} records processed, {skipped_count} skipped, {error_count} errors")
        return result
    
    def extract_sample_data(self, df: pd.DataFrame) -> Dict[str, List[Any]]:
        """Extract sample data for intelligent type inference"""
        sample_data = {}
        sample_size = min(10, len(df))
        
        for col in df.columns:
            # Get non-null sample values
            sample_values = df[col].dropna().head(sample_size).tolist()
            sample_data[col] = sample_values
        
        return sample_data
    
    def get_applied_column_mapping(self) -> Dict[str, str]:
        """Get column mapping from database for this dataset"""
        mapping = {}
        
        dataset_mappings = DatasetColumnMapping.objects.filter(
            dataset=self.dataset,
            status__in=['confirmed', 'pending']
        )
        
        for dm in dataset_mappings:
            mapping[dm.source_column] = dm.target_field
        
        return mapping
    
    def create_patent_record(self, row_data: Dict[str, str], column_mapping: Dict[str, str], row_number: int) -> Optional[PatentRecord]:
        """Create PatentRecord from row data"""
        try:
            record = PatentRecord(
                dataset=self.dataset,
                row_number=row_number,
                raw_data=row_data
            )
            
            # Map standardized fields
            for file_col, standard_field in column_mapping.items():
                value = row_data.get(file_col, 'NA')
                if value and value != 'NA':
                    if standard_field in ['filing_date', 'publication_date', 'grant_date']:
                        # Parse dates
                        parsed_date = self.parse_date(value)
                        setattr(record, standard_field, parsed_date)
                    elif standard_field in ['claims_count', 'forward_citations', 'backward_citations']:
                        # Parse integers
                        parsed_int = self.parse_integer(value)
                        setattr(record, standard_field, parsed_int)
                    else:
                        # String fields
                        setattr(record, standard_field, value)
            
            record.save()
            return record
            
        except Exception as e:
            self.log(f"Failed to create record for row {row_number}: {str(e)}", level='error')
            return None
    
    def parse_date(self, date_str: str) -> Optional[datetime.date]:
        """Parse date string with multiple format support"""
        if not date_str or date_str == 'NA':
            return None
        
        # Common date formats
        date_formats = [
            '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
            '%m-%d-%Y', '%d-%m-%Y', '%Y.%m.%d', '%m.%d.%Y',
            '%b %d, %Y', '%B %d, %Y', '%d %b %Y', '%d %B %Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        
        self.log(f"Could not parse date: {date_str}", level='warning')
        return None
    
    def parse_integer(self, int_str: str) -> Optional[int]:
        """Parse integer string"""
        if not int_str or int_str == 'NA':
            return None
        
        try:
            # Remove any non-numeric characters except minus sign
            clean_str = re.sub(r'[^\d-]', '', str(int_str))
            return int(clean_str) if clean_str else None
        except ValueError:
            return None
    
    def update_dataset_stats(self, result: Dict[str, Any]):
        """Update dataset with processing results"""
        self.dataset.total_patents = result['processed_count']
        self.dataset.processed_patents = result['processed_count']
        self.dataset.processing_status = 'completed'
        self.dataset.processing_progress = 100
        self.dataset.processing_log = self.processing_log
        
        # Store processing metadata in raw_data
        self.dataset.raw_data = {
            'processing_summary': result,
            'processed_at': datetime.now().isoformat()
        }
        
        self.dataset.save()
        
    def log(self, message: str, level: str = 'info'):
        """Add log entry"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'message': message
        }
        self.processing_log.append(log_entry)
        
        # Also log to Django logger
        if level == 'error':
            logger.error(f"Dataset {self.dataset.id}: {message}")
        elif level == 'warning':
            logger.warning(f"Dataset {self.dataset.id}: {message}")
        else:
            logger.info(f"Dataset {self.dataset.id}: {message}")


def process_patent_dataset(dataset_id: str) -> Dict[str, Any]:
    """
    Process a patent dataset file - main entry point for external usage
    """
    try:
        dataset = PatentDataset.objects.get(id=dataset_id)
        processor = PatentFileProcessor(dataset)
        
        # Update status to processing
        dataset.processing_status = 'processing'
        dataset.processing_progress = 0
        dataset.save()
        
        # Process the file
        result = processor.process_file()
        
        return {
            'success': True,
            'dataset_id': dataset_id,
            'result': result
        }
        
    except PatentDataset.DoesNotExist:
        return {
            'success': False,
            'error': f'Dataset {dataset_id} not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }