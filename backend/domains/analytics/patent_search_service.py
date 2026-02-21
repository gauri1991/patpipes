"""
Patent Search Service
Integrates with multiple patent databases and APIs for patent research
"""

import requests
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlencode
import time
import logging

from django.conf import settings
from .models import ResearchQuery, ResearchResult

logger = logging.getLogger(__name__)


class PatentSearchError(Exception):
    """Custom exception for patent search errors"""
    pass


class BasePatentAPI:
    """Base class for patent API integrations"""
    
    def __init__(self):
        self.base_url = ""
        self.api_key = None
        self.rate_limit_delay = 1.0  # seconds between requests
        self.max_results_per_request = 100
    
    def search(self, query_params: Dict) -> Tuple[List[Dict], int]:
        """
        Execute patent search
        Returns: (results, total_count)
        """
        raise NotImplementedError("Subclasses must implement search method")
    
    def _make_request(self, url: str, params: Dict = None) -> requests.Response:
        """Make HTTP request with error handling and rate limiting"""
        time.sleep(self.rate_limit_delay)
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise PatentSearchError(f"API request failed: {str(e)}")


class USPTOPatentsViewAPI(BasePatentAPI):
    """USPTO PatentsView API integration"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://search.patentsview.org/api/v1/patent"
        self.rate_limit_delay = 0.5  # USPTO allows 2 requests per second
        self.max_results_per_request = 1000
    
    def search(self, query_params: Dict) -> Tuple[List[Dict], int]:
        """
        Search USPTO PatentsView API
        
        Args:
            query_params: Dictionary with search parameters
                - keywords: search terms
                - assignees: list of assignee names
                - inventors: list of inventor names  
                - ipc_classes: list of IPC classification codes
                - cpc_classes: list of CPC classification codes
                - date_range: dict with from_date and to_date
                - additional_filters: any other filters
        
        Returns:
            Tuple of (patent_list, total_count)
        """
        
        # Build USPTO search query
        search_criteria = self._build_search_criteria(query_params)
        
        # API request parameters
        api_params = {
            "q": json.dumps(search_criteria),
            "f": json.dumps([
                "patent_id", "patent_title", "patent_abstract", 
                "assignee_organization", "inventor_first_name", "inventor_last_name",
                "patent_date", "app_date", "ipc_class", "cpc_class", 
                "patent_num_cited_by_us_patents"
            ]),
            "o": json.dumps({"per_page": self.max_results_per_request, "page": 1}),
            "s": json.dumps([{"patent_date": "desc"}])
        }
        
        try:
            response = self._make_request(self.base_url, api_params)
            data = response.json()
            
            if not data.get('patents'):
                return [], 0
            
            patents = []
            for patent_data in data['patents']:
                processed_patent = self._process_uspto_patent(patent_data)
                patents.append(processed_patent)
            
            total_count = data.get('total_patent_count', len(patents))
            
            return patents, total_count
            
        except Exception as e:
            logger.error(f"USPTO search failed: {e}")
            raise PatentSearchError(f"USPTO search failed: {str(e)}")
    
    def _build_search_criteria(self, query_params: Dict) -> Dict:
        """Build USPTO API search criteria from query parameters"""
        criteria = {"_and": []}
        
        # Keywords search
        if query_params.get('keywords'):
            keywords = query_params['keywords'].strip()
            if keywords:
                criteria["_and"].append({
                    "_text_any": {
                        "patent_title": keywords,
                        "patent_abstract": keywords
                    }
                })
        
        # Assignee search
        if query_params.get('assignees'):
            assignee_conditions = []
            for assignee in query_params['assignees']:
                if assignee.strip():
                    assignee_conditions.append({
                        "assignee_organization": assignee.strip()
                    })
            if assignee_conditions:
                criteria["_and"].append({"_or": assignee_conditions})
        
        # Inventor search
        if query_params.get('inventors'):
            inventor_conditions = []
            for inventor in query_params['inventors']:
                if inventor.strip():
                    # Split name if it contains space
                    name_parts = inventor.strip().split()
                    if len(name_parts) >= 2:
                        inventor_conditions.append({
                            "_and": [
                                {"inventor_first_name": name_parts[0]},
                                {"inventor_last_name": name_parts[-1]}
                            ]
                        })
                    else:
                        inventor_conditions.append({
                            "_or": [
                                {"inventor_first_name": inventor.strip()},
                                {"inventor_last_name": inventor.strip()}
                            ]
                        })
            if inventor_conditions:
                criteria["_and"].append({"_or": inventor_conditions})
        
        # IPC Classification
        if query_params.get('ipc_classes'):
            ipc_conditions = []
            for ipc in query_params['ipc_classes']:
                if ipc.strip():
                    ipc_conditions.append({"ipc_class": ipc.strip()})
            if ipc_conditions:
                criteria["_and"].append({"_or": ipc_conditions})
        
        # CPC Classification
        if query_params.get('cpc_classes'):
            cpc_conditions = []
            for cpc in query_params['cpc_classes']:
                if cpc.strip():
                    cpc_conditions.append({"cpc_class": cpc.strip()})
            if cpc_conditions:
                criteria["_and"].append({"_or": cpc_conditions})
        
        # Date range
        if query_params.get('date_range'):
            date_range = query_params['date_range']
            date_condition = {}
            
            if date_range.get('from_date'):
                date_condition["gte"] = date_range['from_date']
            if date_range.get('to_date'):
                date_condition["lte"] = date_range['to_date']
            
            if date_condition:
                criteria["_and"].append({"patent_date": date_condition})
        
        # If no criteria specified, return empty search (matches nothing)
        if not criteria["_and"]:
            criteria = {"patent_id": "NEVER_MATCHES_ANYTHING"}
        
        return criteria
    
    def _process_uspto_patent(self, patent_data: Dict) -> Dict:
        """Process USPTO patent data into standardized format"""
        
        # Extract inventors
        inventors = []
        if patent_data.get('inventors'):
            for inv in patent_data['inventors']:
                inventor_name = f"{inv.get('inventor_first_name', '')} {inv.get('inventor_last_name', '')}".strip()
                if inventor_name:
                    inventors.append(inventor_name)
        
        # Extract assignee
        assignee = ""
        if patent_data.get('assignees'):
            assignee = patent_data['assignees'][0].get('assignee_organization', '')
        
        # Extract classifications
        ipc_classes = []
        if patent_data.get('ipcs'):
            ipc_classes = [ipc.get('ipc_class', '') for ipc in patent_data['ipcs']]
        
        cpc_classes = []
        if patent_data.get('cpcs'):
            cpc_classes = [cpc.get('cpc_class', '') for cpc in patent_data['cpcs']]
        
        # Convert dates
        publication_date = None
        if patent_data.get('patent_date'):
            try:
                publication_date = datetime.strptime(patent_data['patent_date'], '%Y-%m-%d').date()
            except:
                pass
        
        application_date = None
        if patent_data.get('app_date'):
            try:
                application_date = datetime.strptime(patent_data['app_date'], '%Y-%m-%d').date()
            except:
                pass
        
        return {
            'patent_id': patent_data.get('patent_id', ''),
            'publication_number': patent_data.get('patent_number', ''),
            'application_number': patent_data.get('application_number', ''),
            'title': patent_data.get('patent_title', ''),
            'abstract': patent_data.get('patent_abstract', ''),
            'assignee': assignee,
            'inventors': inventors,
            'ipc_classes': ipc_classes,
            'cpc_classes': cpc_classes,
            'publication_date': publication_date,
            'application_date': application_date,
            'priority_date': None,  # Not available in USPTO data
            'jurisdiction': 'US',
            'relevance_score': None,  # Will be computed later
            'raw_data': patent_data
        }


class USPTOOpenDataAPI(BasePatentAPI):
    """USPTO Open Data Portal (ODP) API integration — applications filed 2001+"""

    def __init__(self):
        super().__init__()
        from .uspto_odp_service import USPTOODPClient
        self.client = USPTOODPClient()
        self.base_url = self.client.base_url
        self.rate_limit_delay = 0.3
        self.max_results_per_request = 100  # ODP caps at 100 per page

    def search(self, query_params: Dict) -> Tuple[List[Dict], int]:
        """Search ODP patent applications via POST /patent/applications/search"""
        body = self._build_search_body(query_params)

        try:
            data = self.client.post('/patent/applications/search', body)

            # ODP returns None on 404 (no matching records)
            if data is None:
                return [], 0

            results = data.get('patentFileWrapperDataBag', data.get('patentApplications', []))
            total_count = data.get('count', data.get('recordTotalQuantity', len(results)))

            patents = [self._normalize_odp_result(r) for r in results]
            return patents, total_count

        except Exception as e:
            logger.error('USPTO ODP search failed: %s', e)
            raise PatentSearchError(f'USPTO ODP search failed: {e}')

    # ------------------------------------------------------------------

    def _build_search_body(self, query_params: Dict) -> Dict:
        """Map platform search params to ODP POST body."""
        body: Dict = {}

        # Keywords → q (free-text)
        keywords = (query_params.get('keywords') or '').strip()
        if keywords:
            body['q'] = keywords

        # Filters
        filters_list: List[Dict] = []

        # Assignees
        assignees = query_params.get('assignees') or []
        assignee_vals = [a.strip() for a in assignees if a.strip()]
        if assignee_vals:
            filters_list.append({
                'field': 'applicationMetaData.applicantBag',
                'operator': 'in',
                'values': assignee_vals,
            })

        # IPC classes
        ipc = query_params.get('ipc_classes') or []
        ipc_vals = [c.strip() for c in ipc if c.strip()]
        if ipc_vals:
            filters_list.append({
                'field': 'classificationDataBag.ipcClassificationDataBag.ipcClassificationText',
                'operator': 'in',
                'values': ipc_vals,
            })

        # CPC classes
        cpc = query_params.get('cpc_classes') or []
        cpc_vals = [c.strip() for c in cpc if c.strip()]
        if cpc_vals:
            filters_list.append({
                'field': 'classificationDataBag.cpcClassificationDataBag.cpcClassificationText',
                'operator': 'in',
                'values': cpc_vals,
            })

        if filters_list:
            body['filters'] = filters_list

        # Date range → rangeFilters
        date_range = query_params.get('date_range') or {}
        range_filters: List[Dict] = []
        if date_range.get('from_date') or date_range.get('to_date'):
            rf: Dict = {'field': 'applicationMetaData.filingDate'}
            if date_range.get('from_date'):
                rf['valueFrom'] = date_range['from_date']
            if date_range.get('to_date'):
                rf['valueTo'] = date_range['to_date']
            range_filters.append(rf)
        if range_filters:
            body['rangeFilters'] = range_filters

        # Pagination
        body['pagination'] = {
            'offset': 0,
            'limit': self.max_results_per_request,
        }

        return body

    # ------------------------------------------------------------------

    def _normalize_odp_result(self, raw: Dict) -> Dict:
        """Convert an ODP application object to the platform's standard format."""
        meta = raw.get('applicationMetaData', {})

        # Inventors — objects with firstName/lastName/inventorNameText
        inventors = []
        for inv in meta.get('inventorBag', []):
            if isinstance(inv, str):
                name = inv
            else:
                name = inv.get('inventorNameText', '')
                if not name:
                    first = inv.get('firstName', '')
                    last = inv.get('lastName', '')
                    name = f'{first} {last}'.strip()
            if name:
                inventors.append(name)

        # Assignee — use firstApplicantName or first from applicantBag
        assignee = meta.get('firstApplicantName', '')
        if not assignee:
            applicants = meta.get('applicantBag', [])
            if applicants:
                first = applicants[0]
                assignee = first if isinstance(first, str) else first.get('applicantNameText', first.get('nameText', ''))

        # Filing date
        application_date = None
        app_date_str = meta.get('filingDate', '')
        if app_date_str:
            try:
                application_date = datetime.strptime(app_date_str[:10], '%Y-%m-%d').date()
            except Exception:
                pass

        # Publication date from publicationCategoryBag
        publication_date = None
        for pc in meta.get('publicationCategoryBag', []):
            pdate = pc.get('publicationDate', '') if isinstance(pc, dict) else ''
            if pdate:
                try:
                    publication_date = datetime.strptime(pdate[:10], '%Y-%m-%d').date()
                    break
                except Exception:
                    pass

        # USPC class (ODP doesn't return IPC/CPC in search results, only uspcSymbolText)
        ipc_classes: List[str] = []
        cpc_classes: List[str] = []
        uspc = meta.get('uspcSymbolText', '')
        if uspc:
            ipc_classes.append(uspc)

        app_num = raw.get('applicationNumberText', '')

        return {
            'patent_id': app_num,
            'publication_number': '',
            'application_number': app_num,
            'title': meta.get('inventionTitle', ''),
            'abstract': '',
            'assignee': assignee,
            'inventors': inventors,
            'ipc_classes': ipc_classes,
            'cpc_classes': cpc_classes,
            'publication_date': publication_date,
            'application_date': application_date,
            'priority_date': None,
            'jurisdiction': 'US',
            'relevance_score': None,
            'raw_data': raw,
        }


class GooglePatentsAPI(BasePatentAPI):
    """Google Patents Public Datasets BigQuery integration (placeholder)"""

    def __init__(self):
        super().__init__()
        self.base_url = "https://patents.google.com"  # Placeholder

    def search(self, query_params: Dict) -> Tuple[List[Dict], int]:
        """Google Patents search - to be implemented"""
        # This would integrate with Google Patents Public Datasets via BigQuery
        # For now, return empty results
        return [], 0


class PatentSearchService:
    """Main service for patent search operations"""
    
    def __init__(self):
        self.apis = {
            'uspto': USPTOPatentsViewAPI(),
            'uspto_odp': USPTOOpenDataAPI(),
            'google_patents': GooglePatentsAPI(),
        }
    
    def execute_search(self, research_query: ResearchQuery) -> Dict:
        """
        Execute a research query and save results
        
        Returns:
            Dictionary with search results and statistics
        """
        try:
            # Mark query as running
            research_query.status = 'running'
            research_query.last_executed_at = datetime.now(timezone.utc)
            research_query.save()
            
            # Get the appropriate API
            api = self.apis.get(research_query.api_source)
            if not api:
                raise PatentSearchError(f"Unsupported API source: {research_query.api_source}")
            
            # Prepare search parameters
            search_params = {
                'keywords': research_query.keywords,
                'assignees': research_query.assignees,
                'inventors': research_query.inventors,
                'ipc_classes': research_query.ipc_classes,
                'cpc_classes': research_query.cpc_classes,
                'date_range': research_query.date_range,
                'geographic_scope': research_query.geographic_scope,
                'additional_filters': research_query.additional_filters
            }
            
            start_time = time.time()
            
            # Execute search
            patents, total_count = api.search(search_params)
            
            execution_time = time.time() - start_time
            
            # Save results
            created_results = []
            for patent_data in patents:
                result, created = ResearchResult.objects.get_or_create(
                    query=research_query,
                    patent_id=patent_data['patent_id'],
                    defaults={
                        'publication_number': patent_data['publication_number'],
                        'application_number': patent_data['application_number'],
                        'title': patent_data['title'],
                        'abstract': patent_data['abstract'],
                        'assignee': patent_data['assignee'],
                        'inventors': patent_data['inventors'],
                        'ipc_classes': patent_data['ipc_classes'],
                        'cpc_classes': patent_data['cpc_classes'],
                        'publication_date': patent_data['publication_date'],
                        'application_date': patent_data['application_date'],
                        'priority_date': patent_data['priority_date'],
                        'jurisdiction': patent_data['jurisdiction'],
                        'relevance_score': patent_data['relevance_score'],
                        'raw_data': patent_data['raw_data']
                    }
                )
                if created:
                    created_results.append(result)
            
            # Update query statistics
            research_query.status = 'completed'
            research_query.total_results = total_count
            research_query.processed_results = len(created_results)
            research_query.execution_time = execution_time
            research_query.error_message = ''
            research_query.save()
            
            return {
                'success': True,
                'total_results': total_count,
                'processed_results': len(created_results),
                'execution_time': execution_time,
                'new_patents': len(created_results)
            }
            
        except Exception as e:
            # Mark query as failed
            research_query.status = 'failed'
            research_query.error_message = str(e)
            research_query.retry_count += 1
            research_query.save()
            
            logger.error(f"Patent search failed for query {research_query.id}: {e}")
            
            return {
                'success': False,
                'error': str(e),
                'total_results': 0,
                'processed_results': 0
            }
    
    def get_available_apis(self) -> List[Dict]:
        """Get list of available patent APIs"""
        return [
            {'key': 'uspto', 'name': 'USPTO PatentsView API', 'description': 'US Patent and Trademark Office database'},
            {'key': 'uspto_odp', 'name': 'USPTO Open Data Portal', 'description': 'USPTO ODP — applications filed 2001+ with detailed prosecution data'},
            {'key': 'google_patents', 'name': 'Google Patents', 'description': 'Google Patents Public Datasets (coming soon)'},
        ]
    
    def estimate_search_results(self, api_source: str, query_params: Dict) -> int:
        """Estimate the number of results for a search (for planning purposes)"""
        # This would implement a lightweight search to estimate results
        # For now, return a placeholder
        return 0