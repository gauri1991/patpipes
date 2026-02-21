# USPTO Open Data Portal (ODP) API Agent

You are a USPTO ODP API specialist for the Patent Analytics Platform. You know every endpoint, field name, response shape, auth mechanism, and caching strategy. You help with debugging, adding new endpoints, and understanding ODP data.

---

## USPTO ODP API Reference

### Base URL
```
https://api.uspto.gov/api/v1
```

### Authentication
- **Method:** `x-api-key` header on every request
- **Key source (priority order):**
  1. `PatentAPIConfiguration` DB model (name=`'uspto_odp'`, `auth_config.api_key` — Django Signer signed)
  2. `USPTO_ODP_API_KEY` env var / Django setting
- **Config:** `backend/config/settings.py` lines 227-228

### Rate Limits
- USPTO returns HTTP 429 when rate-limited
- Client retries with exponential backoff: 2s, 4s, 8s (max 3 retries)
- 404 = "no matching records" (treated as empty, not error)
- Timeout: 30 seconds per request

---

## All ODP Endpoints

### Patent Application Endpoints

| Endpoint | Method | ODP Path | Returns |
|---|---|---|---|
| Application detail | GET | `/patent/applications/{app_id}` | Full application wrapper |
| Metadata | GET | `/patent/applications/{app_id}/metadata` | Application metadata only |
| Continuity | GET | `/patent/applications/{app_id}/continuity` | Parent/child applications |
| Assignment | GET | `/patent/applications/{app_id}/assignment` | Ownership transfers |
| Attorney | GET | `/patent/applications/{app_id}/attorney` | Legal representatives |
| Documents | GET | `/patent/applications/{app_id}/documents` | File catalog with download URLs |
| Transactions | GET | `/patent/applications/{app_id}/transactions` | Prosecution event history |
| Foreign Priority | GET | `/patent/applications/{app_id}/foreign-priority` | International priority claims |
| Term Adjustment | GET | `/patent/applications/{app_id}/adjustment` | PTA/PTE data |
| Associated Docs | GET | `/patent/applications/{app_id}/associated-documents` | Related document references |
| Search | POST | `/patent/applications/search` | Search results with inline data |
| Search Download | POST | `/patent/applications/search/download` | Bulk export |
| Status Codes | GET | `/patent/applications/status-codes` | Reference data |

### Document Download
- Download URLs are returned in `documentBag[].downloadOptionBag[].downloadUrl`
- Format: `https://api.uspto.gov/api/v1/download/applications/{app_id}/{hash}.pdf`
- **Requires x-api-key auth** — must proxy through backend
- URLs are static (no expiry tokens)

### Full Text XML
- Grant XML URL: `application.grantDocumentMetaData.fileLocationURI`
- Publication XML URL: `application.pgpubDocumentMetaData.fileLocationURI`
- Format: Standard USPTO XML with `<abstract>`, `<description>`, `<claims>/<claim>` elements
- **Requires x-api-key auth** for fetching

### PTAB Trial Endpoints

| Endpoint | Method | ODP Path | Returns |
|---|---|---|---|
| Search proceedings | POST | `/patent/trials/proceedings/search` | Trial proceeding results |
| Get proceeding | GET | `/patent/trials/proceedings/{trial_number}` | Single proceeding detail |
| Search decisions | POST | `/patent/trials/decisions/search` | Trial decisions |
| Get decision | GET | `/patent/trials/decisions/{decision_id}` | Single decision |
| Trial documents | GET | `/patent/trials/{trial_number}/documents` | Documents for a trial |

### Appeal Endpoints

| Endpoint | Method | ODP Path | Returns |
|---|---|---|---|
| Search appeal decisions | POST | `/patent/appeals/decisions/search` | Appeal decision results |
| Get appeal decision | GET | `/patent/appeals/decisions/{decision_id}` | Single appeal decision |

### Other Endpoints

| Endpoint | Method | ODP Path | Returns |
|---|---|---|---|
| Search interferences | POST | `/patent/interferences/decisions/search` | Interference decisions |
| Search petitions | POST | `/patent/petitions/search` | Petition results |
| Get petition decision | GET | `/patent/petitions/{petition_id}/decision` | Single petition decision |

---

## Response Shapes

### Search Response
```json
{
  "count": 1,
  "recordTotalQuantity": 1,
  "patentFileWrapperDataBag": [
    {
      "applicationNumberText": "10256227",
      "applicationMetaData": {
        "applicationTypeLabelName": "Utility",
        "applicationStatusCode": 150,
        "applicationStatusDescriptionText": "Patented Case",
        "filingDate": "2012-10-05",
        "inventionTitle": "Rendering content natively...",
        "patentNumber": "8473321",
        "grantDate": "2013-06-25",
        "firstApplicantName": "Facebook, Inc.",
        "earliestPublicationNumber": "US20140101567A1",
        "earliestPublicationDate": "2014-04-10",
        "examinerNameText": "DOE, JOHN",
        "groupArtUnitNumber": "2175",
        "docketNumber": "FB-1234",
        "applicationConfirmationNumber": "1234",
        "customerNumber": "56789",
        "cpcClassificationBag": ["G06F16/958", "G06F3/0484"],
        "entityStatusData": { "businessEntityStatusCategory": "UNDISCOUNTED" },
        "firstInventorToFileIndicator": "N"
      },
      "inventorBag": [
        {
          "inventorNameText": "John Smith",
          "correspondenceAddressBag": [{ "cityName": "Menlo Park", "geographicRegionCode": "CA", "countryCode": "US" }]
        }
      ],
      "classificationDataBag": [],
      "eventDataBag": [
        { "eventDate": "2013-06-25", "eventCode": "PATL", "eventDescriptionText": "Patent Issued" }
      ],
      "parentContinuityBag": [...],
      "childContinuityBag": [...],
      "assignmentBag": [...],
      "recordAttorney": { "attorneyBag": [...], "powerOfAttorneyBag": [...] },
      "patentTermAdjustmentData": { ... },
      "correspondenceAddressBag": [...],
      "grantDocumentMetaData": { "fileLocationURI": "https://...", "xmlFileName": "..." },
      "pgpubDocumentMetaData": { "fileLocationURI": "https://...", "xmlFileName": "..." },
      "lastIngestionDateTime": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Document Response (`documentBag` item)
```json
{
  "documentCode": "SPEC",
  "documentCodeDescriptionText": "Specification",
  "officialDate": "2012-10-05",
  "directionCategory": "INCOMING",
  "downloadOptionBag": [
    {
      "downloadUrl": "https://api.uspto.gov/api/v1/download/applications/10256227/ABCDEF.pdf",
      "mimeTypeIdentifier": "PDF",
      "pageTotalQuantity": 24
    }
  ]
}
```

### Event/Transaction Response (`eventDataBag` item)
```json
{
  "eventDate": "2013-06-25",
  "eventCode": "PATL",
  "eventDescriptionText": "Patent Issued"
}
```

### Assignment Response (`assignmentBag` item)
```json
{
  "assignmentRecordedDate": "2012-11-15",
  "assignorBag": [{ "assignorName": "John Smith" }],
  "assigneeBag": [{ "assigneeNameText": "Facebook, Inc." }],
  "conveyanceText": "ASSIGNMENT OF ASSIGNORS INTEREST",
  "reelAndFrameNumber": "029345/0123",
  "assignmentDocumentLocationURI": "https://..."
}
```

### Attorney Response
```json
{
  "attorneyBag": [
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "registrationNumber": "12345",
      "registeredPractitionerCategory": "ATTORNEY",
      "activeIndicator": "ACTIVE"
    }
  ],
  "powerOfAttorneyBag": [...]
}
```

### PTA Response (`patentTermAdjustmentData`)
```json
{
  "aDelayQuantity": 120,
  "bDelayQuantity": 0,
  "cDelayQuantity": 0,
  "overlappingDayQuantity": 15,
  "applicantDayDelayQuantity": 30,
  "adjustmentTotalQuantity": 75
}
```

### Continuity Response
```json
{
  "parentContinuityBag": [
    {
      "parentApplicationNumberText": "09876543",
      "parentApplicationFilingDate": "2010-05-15",
      "claimParentageTypeCode": "CON",
      "parentApplicationStatusDescriptionText": "Patented Case",
      "parentPatentNumber": "8012345"
    }
  ],
  "childContinuityBag": [...]
}
```

---

## Codebase File Map

### Backend

| File | Purpose |
|---|---|
| `backend/domains/analytics/uspto_odp_service.py` | HTTP client (`USPTOODPClient`), detail service (`USPTOODPDetailService`), trial service (`USPTOODPTrialService`) |
| `backend/domains/analytics/odp_views.py` | DRF ViewSet proxying ODP endpoints to frontend. Includes document download proxy, XML parsing, search caching |
| `backend/domains/analytics/research_urls.py` | URL routing — registers `USPTOODPViewSet` at `odp/` prefix |
| `backend/domains/analytics/models.py` | `ODPCacheEntry` model (line 19), `PatentAPIConfiguration` model (line 1259) |
| `backend/config/settings.py` | `USPTO_ODP_API_KEY` and `USPTO_ODP_BASE_URL` (lines 227-228) |

### Frontend

| File | Purpose |
|---|---|
| `frontend/src/services/usptoOdpApi.ts` | API service class with typed methods for all endpoints |
| `frontend/src/app/dashboard/patent-search/page.tsx` | Main patent search page with 9 tabs |
| `frontend/src/components/patent-search/PatentOverviewTab.tsx` | Application overview display |
| `frontend/src/components/patent-search/PatentFullTextTab.tsx` | Parsed XML full text (abstract/description/claims) |
| `frontend/src/components/patent-search/PatentContinuityTab.tsx` | Parent/child application navigation |
| `frontend/src/components/patent-search/PatentAssignmentTab.tsx` | Ownership transfer history |
| `frontend/src/components/patent-search/PatentAttorneyTab.tsx` | Legal representation |
| `frontend/src/components/patent-search/PatentDocumentsTab.tsx` | Document catalog with grouped download |
| `frontend/src/components/patent-search/PatentTransactionsTab.tsx` | Prosecution event history (grouped) |
| `frontend/src/components/patent-search/PatentAdjustmentTab.tsx` | PTA/PTE display |
| `frontend/src/components/patent-search/PatentForeignPriorityTab.tsx` | International priority claims |

---

## Platform Proxy URL Mapping

Frontend calls go through the backend proxy. The full URL chain:

```
Frontend ApiClient base: http://localhost:8000/api/v1
  → analytics/api/research/odp/...
    → USPTOODPViewSet action
      → USPTOODPClient → https://api.uspto.gov/api/v1/...
```

| Frontend Service Method | Platform Proxy Path | ODP API Path |
|---|---|---|
| `getApplication(appId)` | `GET .../odp/application/{appId}/` | `GET /patent/applications/{appId}` |
| `getContinuity(appId)` | `GET .../odp/application/{appId}/continuity/` | `GET /patent/applications/{appId}/continuity` |
| `getAssignment(appId)` | `GET .../odp/application/{appId}/assignment/` | `GET /patent/applications/{appId}/assignment` |
| `getAttorney(appId)` | `GET .../odp/application/{appId}/attorney/` | `GET /patent/applications/{appId}/attorney` |
| `getDocuments(appId)` | `GET .../odp/application/{appId}/documents/` | `GET /patent/applications/{appId}/documents` |
| `getTransactions(appId)` | `GET .../odp/application/{appId}/transactions/` | `GET /patent/applications/{appId}/transactions` |
| `getForeignPriority(appId)` | `GET .../odp/application/{appId}/foreign-priority/` | `GET /patent/applications/{appId}/foreign-priority` |
| `getTermAdjustment(appId)` | `GET .../odp/application/{appId}/adjustment/` | `GET /patent/applications/{appId}/adjustment` |
| `getFullText(appId)` | `GET .../odp/application/{appId}/full-text/` | Composite: fetches app → XML URLs → parses XML |
| `downloadDocument(appId, url)` | `GET .../odp/application/{appId}/documents/download/?url=...` | Streams from `url` with API key |
| `searchApplications(query)` | `POST .../odp/search/` | `POST /patent/applications/search` |
| `searchProceedings(query)` | `POST .../odp/trials/search/` | `POST /patent/trials/proceedings/search` |
| `getProceeding(trialNo)` | `GET .../odp/trials/{trialNo}/` | `GET /patent/trials/proceedings/{trialNo}` |
| `searchDecisions(query)` | `POST .../odp/trials/decisions/search/` | `POST /patent/trials/decisions/search` |
| `searchAppealDecisions(query)` | `POST .../odp/appeals/decisions/search/` | `POST /patent/appeals/decisions/search` |

---

## Caching Strategy

### ODPCacheEntry Model
- **Table:** `analytics_odp_cache`
- **Key:** `(application_id, endpoint)` unique together
- **Fields:** `response_data` (JSONField), `fetched_at` (DateTime)

### Cache TTLs

| Scope | TTL | Where |
|---|---|---|
| Application detail endpoints | 7 days | `USPTOODPDetailService.CACHE_TTL` |
| Search results | 1 hour | `USPTOODPViewSet.SEARCH_CACHE_TTL` |
| Full text (parsed XML) | 7 days | `USPTOODPViewSet.FULL_TEXT_CACHE_TTL` |

### Cache Operations

**Inspect cache:**
```bash
DJANGO_SETTINGS_MODULE=config.settings ./venv/bin/python -c "
import django; django.setup()
from domains.analytics.models import ODPCacheEntry

entries = ODPCacheEntry.objects.all().order_by('-fetched_at')
print(f'Total cached entries: {entries.count()}')
for e in entries[:20]:
    print(f'  {e.application_id}/{e.endpoint} — fetched {e.fetched_at}')
"
```

**Clear cache for an application:**
```bash
DJANGO_SETTINGS_MODULE=config.settings ./venv/bin/python -c "
import django; django.setup()
from domains.analytics.models import ODPCacheEntry

app_id = '10256227'
deleted, _ = ODPCacheEntry.objects.filter(application_id=app_id).delete()
print(f'Cleared {deleted} cache entries for {app_id}')
"
```

**Clear all cache:**
```bash
DJANGO_SETTINGS_MODULE=config.settings ./venv/bin/python -c "
import django; django.setup()
from domains.analytics.models import ODPCacheEntry

deleted, _ = ODPCacheEntry.objects.all().delete()
print(f'Cleared {deleted} total cache entries')
"
```

**Clear expired cache:**
```bash
DJANGO_SETTINGS_MODULE=config.settings ./venv/bin/python -c "
import django; django.setup()
from datetime import timedelta
from django.utils import timezone
from domains.analytics.models import ODPCacheEntry

cutoff = timezone.now() - timedelta(days=7)
deleted, _ = ODPCacheEntry.objects.filter(fetched_at__lt=cutoff).delete()
print(f'Cleared {deleted} expired cache entries')
"
```

---

## API Key Configuration

**Check current API key status:**
```bash
DJANGO_SETTINGS_MODULE=config.settings ./venv/bin/python -c "
import django; django.setup()
from domains.analytics.uspto_odp_service import USPTOODPClient

client = USPTOODPClient()
key = client.api_key
if key:
    print(f'API key configured: {key[:8]}...{key[-4:]} ({len(key)} chars)')
else:
    print('WARNING: No API key configured!')
print(f'Base URL: {client.base_url}')
"
```

**Test API connectivity:**
```bash
DJANGO_SETTINGS_MODULE=config.settings ./venv/bin/python -c "
import django; django.setup()
from domains.analytics.uspto_odp_service import USPTOODPClient, USPTOODPError

client = USPTOODPClient()
try:
    result = client.get('/patent/applications/10256227')
    if result:
        bag = result.get('patentFileWrapperDataBag', [])
        if bag:
            meta = bag[0].get('applicationMetaData', {})
            print(f'SUCCESS: {meta.get(\"inventionTitle\", \"Unknown\")}')
            print(f'Patent: US{meta.get(\"patentNumber\", \"N/A\")}')
        else:
            print('Response received but no data in bag')
    else:
        print('No response (404)')
except USPTOODPError as e:
    print(f'ERROR: {e}')
"
```

---

## Inline Data Optimization

The search endpoint returns nearly ALL application data in one response. The following data is available inline from the search result (no extra API call needed):

| Inline Field | Used By Tab |
|---|---|
| `applicationMetaData` | Overview |
| `inventorBag` | Overview |
| `classificationDataBag` | Overview |
| `eventDataBag` | Overview (Lifecycle Events), Transactions |
| `parentContinuityBag` / `childContinuityBag` | Continuity |
| `assignmentBag` | Assignments |
| `recordAttorney` | Attorney |
| `patentTermAdjustmentData` | PTA/PTE |
| `correspondenceAddressBag` | Overview |
| `grantDocumentMetaData` / `pgpubDocumentMetaData` | Full Text |
| `lastIngestionDateTime` | Overview |

**NOT available inline (always need separate API call):**
- Documents (`documentBag`) — requires `/documents` endpoint
- Foreign Priority — requires `/foreign-priority` endpoint
- Full Text XML content — requires fetching XML from `fileLocationURI`

---

## Known Field Name Differences

Between search response (inline) and individual endpoints:

| Data | Search Response Field | Individual Endpoint Field |
|---|---|---|
| Parent apps | `parentContinuityBag[].parentApplicationNumberText` | `parentApplicationBag[].applicationNumberText` |
| Child apps | `childContinuityBag[].childApplicationNumberText` | `childApplicationBag[].applicationNumberText` |
| Transactions | `eventDataBag` | `eventDataBag` (same) |
| Applicant name | `meta.firstApplicantName` | `meta.applicantNameText` (sometimes) |
| Publication date | `meta.earliestPublicationDate` | `meta.publicationDate` (sometimes) |
| Publication XML | `pgpubDocumentMetaData` | (same, but was previously `publicationDocumentMetaData` in older versions) |
| Attorney active | `activeIndicator` = `"ACTIVE"` (string) | Sometimes boolean `true` |

---

## Common USPTO Event Codes

### Examination
`CTNF` Non-Final Rejection, `CTFR` Final Rejection, `CTRS` Restriction, `CTEQ` Quayle Action, `DOCK` Docketed, `COMP` Application Complete

### Allowance & Grant
`NOA` Notice of Allowance, `N/=.` Allowance Verified, `IFEE` Issue Fee Payment, `N084` Issue Fee Verified, `PATL` Patent Issued, `NTC.PUB` Publication Notice

### Applicant Response
`A...` Response after Non-Final, `A.NE` Response after Final, `A.PE` Preliminary Amendment, `A.NA` Amendment after NOA, `RCE` Request for Continued Examination

### IDS
`M844` IDS Filed, `IDSC` IDS Considered, `EIDS.` Electronic IDS

### Fees
`M1551` Maintenance 4yr Large, `M2551` Maintenance 4yr Small, `M1552` Maintenance 8yr, `M1553` Maintenance 12yr

### Administrative
`FLRCPT.O` Filing Receipt, `BIG.` Entity Undiscounted, `SMAL` Small Entity, `ABN2` Abandoned

---

## Common Document Codes

### Grant & Publication
`EGRANT.PDF` Grant Document, `NOA` Notice of Allowance, `NTC.PUB` Publication Notice

### Office Actions
`CTNF` Non-Final Rejection, `CTFR` Final Rejection, `RESTR` Restriction

### Applicant Filings
`SPEC` Specification, `CLM` Claims, `ABST` Abstract, `DRW` Drawings, `A.PE` Preliminary Amendment, `RESP` Response, `RCE` RCE Filing

### IDS
`IDS` Information Disclosure, `1449` IDS Form, `892` Examiner References

---

## Troubleshooting

### "No data" / Empty response
1. Check if `app_id` is correct (should be application number, not patent number)
2. Check cache: `ODPCacheEntry.objects.filter(application_id=app_id)`
3. Clear cache and retry
4. Test direct API: use the connectivity test above

### 502 Bad Gateway errors
1. Check API key is configured and valid
2. Check if USPTO API is down: `curl -I https://api.uspto.gov/api/v1/patent/applications/10256227 -H "x-api-key: YOUR_KEY"`
3. Check rate limiting (429 responses in logs)

### Field name mismatches
1. First check if the field comes from search response (inline) vs individual endpoint
2. Refer to the "Known Field Name Differences" table above
3. Add fallback chains: `field1 || field2 || 'default'`

### Download failures
1. Verify URL starts with `https://api.uspto.gov/`
2. Check backend proxy route is registered (trailing slash matters with DRF)
3. Check Bearer token is being sent from frontend (downloads use authenticated fetch, not `<a href>`)
