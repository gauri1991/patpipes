from django.core.management.base import BaseCommand
from django.db import transaction

from domains.help.models import HelpCategory, HelpArticle

SEED_DATA = [
    {
        'name': 'Getting Started',
        'slug': 'getting-started',
        'description': 'Learn the basics of the Patent Analytics Platform.',
        'icon': 'Rocket',
        'order': 1,
        'articles': [
            {
                'title': 'Platform Overview',
                'slug': 'platform-overview',
                'order': 1,
                'is_featured': True,
                'tags': ['overview', 'introduction'],
                'excerpt': 'A comprehensive overview of the Patent Analytics Platform and its core capabilities.',
                'content': '''# Platform Overview

Welcome to the **Patent Analytics Platform** — a professional-grade tool for managing patent portfolios, conducting prior art searches, analyzing infringement risks, and tracking prosecution workflows.

## Core Modules

### Portfolio Management
Organize and manage patent portfolios across multiple companies and jurisdictions. Track filing dates, expiration timelines, maintenance fees, and portfolio valuation metrics.

### Prior Art Search
Conduct systematic prior art searches with AI-assisted claim analysis. Map evidence to individual claim elements and generate comprehensive reports.

### Infringement Analysis
Identify and assess potential patent infringement cases. Map claims to accused products, evaluate risk levels, and manage litigation workflows.

### Patent Prosecution
Track patent applications through the prosecution lifecycle — from drafting through office actions and final disposition.

### Analytics & Reporting
Visualize portfolio trends, jurisdiction distributions, filing activity, and competitive landscapes with interactive dashboards.

## Getting Help

Use the search bar above to find answers quickly, or browse categories in the sidebar. If you need further assistance, contact your system administrator.
''',
            },
            {
                'title': 'Quick Start Guide',
                'slug': 'quick-start-guide',
                'order': 2,
                'is_featured': True,
                'tags': ['quickstart', 'setup'],
                'excerpt': 'Get up and running with the platform in under 10 minutes.',
                'content': '''# Quick Start Guide

Follow these steps to start using the platform effectively.

## Step 1: Navigate the Dashboard

After logging in, you'll land on the **Dashboard**. This shows:
- Key portfolio metrics at a glance
- Recent activity across your projects
- Quick action buttons for common tasks
- Upcoming deadlines and reminders

## Step 2: Explore Your Portfolio

Click **Portfolio** in the sidebar to view your patent portfolios. From here you can:
- Browse patents by portfolio
- View patent details, claims, and status
- Filter by jurisdiction, status, or date range

## Step 3: Start a Search

Navigate to **Prior Art** to begin a prior art search:
1. Create a new search project
2. Define your target patent and claims
3. Run searches against patent databases
4. Review and map evidence to claims

## Step 4: Analyze Infringement

Under **Infringement**, you can:
- Create new infringement cases
- Map patent claims to accused products
- Assess risk levels and generate reports

## Tips

- Use keyboard shortcuts for faster navigation
- Set up notifications for deadline reminders
- Export data in CSV or PDF formats from any list view
''',
            },
        ],
    },
    {
        'name': 'Features Guide',
        'slug': 'features-guide',
        'description': 'Detailed guides for each platform feature.',
        'icon': 'BookOpen',
        'order': 2,
        'articles': [
            {
                'title': 'Portfolio Management',
                'slug': 'portfolio-management',
                'order': 1,
                'is_featured': False,
                'tags': ['portfolio', 'patents', 'management'],
                'excerpt': 'Learn how to create, manage, and analyze patent portfolios.',
                'content': '''# Portfolio Management

The portfolio management module allows you to organize patents into logical groups and track key metrics.

## Creating a Portfolio

1. Navigate to **Portfolio** in the sidebar
2. Click **New Portfolio**
3. Fill in the portfolio name, company, and description
4. Assign team members with appropriate access levels

## Managing Patents

Each portfolio contains patents that can be:
- **Added** individually or via bulk import (CSV/Excel)
- **Categorized** by jurisdiction, technology area, or status
- **Tracked** through their lifecycle (pending, granted, expired)

## Portfolio Metrics

The metrics dashboard shows:
- Total patent count by status
- Jurisdiction distribution
- Filing trends over time
- Estimated portfolio valuation
- Upcoming maintenance deadlines

## Access Control

Portfolio access is managed through roles:
- **Owner**: Full control including deletion
- **Editor**: Can add/edit patents and metadata
- **Viewer**: Read-only access to portfolio data
''',
            },
            {
                'title': 'Patent Search',
                'slug': 'patent-search',
                'order': 2,
                'is_featured': True,
                'tags': ['search', 'patents', 'uspto', 'odp', 'prosecution', 'documents'],
                'excerpt': 'Look up any US patent or application using the USPTO Open Data Portal. View full prosecution history, documents, claims, assignments, and more across 9 detailed tabs.',
                'content': '''# Patent Search (USPTO ODP Lookup)

The **Patent Search** page provides direct access to the USPTO Open Data Portal (ODP), allowing you to look up any US patent or application and explore its complete file wrapper data across 9 specialized tabs.

Navigate to **Patent Search** in the sidebar to get started.

---

## Searching for a Patent

Enter a **patent number** or **application number** in the search bar:

| Input Format | Example | What Happens |
|---|---|---|
| Patent number | `US11301943B2` | Searches ODP, resolves to application number |
| Application number | `15060643` | Direct lookup by application ID |

The search bar includes example numbers you can click to try.

### How Search Works

- **Patent number searches** query the ODP search endpoint and resolve to the underlying application number. The full search result is reused directly — no redundant API call is made.
- **Application number searches** call the application detail endpoint directly.
- The URL updates to `?app=<appId>` so results are bookmarkable and shareable.

---

## Results Header

Once a patent is found, a header card displays key information at a glance:

- **Invention Title** — the patent title
- **Application Number** and **Patent Number** (prefixed with "US")
- **Status Badge** — e.g., "Patented Case", "Docketed New Case", "Abandoned"
- **Filing Date** and **Grant Date**
- **Applicant Name**

---

## Tabs Overview

Results are organized into **9 tabs**, each showing a different aspect of the patent file wrapper. Tabs use **lazy loading** — data is only fetched when you first click a tab. Several tabs also use **inline data** from the initial search result to avoid extra API calls.

### 1. Overview

Displays the most important patent metadata in organized cards:

- **Status & Key Dates** — color-coded status indicator (green = granted, blue = pending, yellow = abandoned, red = expired), filing date, effective filing date, publication date, grant date
- **Application Details** — publication number, examiner name, art unit, docket number, confirmation number, customer number, first-inventor-to-file indicator, national stage indicator
- **Inventors** — name and location (city, region, country) for each inventor
- **Applicant** — applicant name with address details
- **Classifications** — CPC and USPC classification codes as badges
- **Invention Title**
- **Correspondence Address** — full mailing address on file
- **Lifecycle Events** — scrollable list of all prosecution events with date, code, and description (sorted newest first)
- **Last Updated** — when USPTO last ingested data for this application

### 2. Continuity

Shows the patent family tree — parent and child applications:

- **Parent Applications** table — application number, filing date, continuity type (e.g., continuation, divisional, CIP), status
- **Child Applications** table — same fields

Application numbers are **clickable** — clicking navigates to that application within Patent Search, allowing you to explore the full family chain without leaving the page.

**Data source:** Uses inline data from search result when available; falls back to the continuity API endpoint.

### 3. Assignments

Displays ownership history and transfer records:

| Column | Description |
|---|---|
| Date | Assignment recorded date |
| Assignor | Previous owner(s) |
| Assignee | New owner(s) |
| Conveyance | Type of transfer (e.g., "ASSIGNMENT OF ASSIGNORS INTEREST") |
| Reel / Frame | USPTO recording reference |
| Link | External link to assignment document (if available) |

**Data source:** Inline from search result or assignment API endpoint.

### 4. Attorney / Agent

Lists legal representatives associated with the application:

- **Power of Attorney** table — attorneys/agents with power of attorney
- **Attorney / Agent of Record** table — currently registered practitioners

Each entry shows: name, registration number, type badge (Attorney or Agent), and status badge (Active or Inactive).

**Data source:** Inline from search result or attorney API endpoint.

### 5. Transactions (Prosecution History)

A comprehensive event log of all prosecution activity, organized into **10 functional categories**:

| Category | What It Covers |
|---|---|
| Allowance & Grant | Notice of allowance, issue fee, publication, patent granted |
| Examination | Office actions (non-final, final), restrictions, examiner activity, abandonments |
| Applicant Response | Amendments, responses to office actions, RCEs |
| IDS & Prior Art | Information disclosure statements, examiner citations |
| Appeals | Appeal briefs, examiner answers, PTAB decisions |
| Fees & Payments | Maintenance fees, issue fees, extension fees |
| Application Processing | Filing receipts, entity status, initial documents |
| PCT & International | 371 completion, international search reports |
| Correspondence | Address changes, missing parts notices |
| Other | Any uncategorized events |

**Controls:**
- **Filter** — text search across event description, code, and date
- **Sort** — toggle between newest-first (default) and oldest-first
- **View toggle** — switch between **Grouped** (collapsible category cards) and **List** (flat chronological view)

The event count badge on each category header shows how many events it contains.

**Data source:** Inline from search result or transactions API endpoint.

### 6. Documents

The complete document file catalog with authenticated download capability:

**Document categories** (8 groups):

| Category | Example Documents |
|---|---|
| Grant & Publication | Grant PDF, issue notification, notice of allowance |
| Office Actions | Non-final rejection, final rejection, restriction requirement |
| Applicant Filings | Specification, claims, abstract, drawings, amendments |
| IDS & References | Information disclosure statements, examiner references |
| Fees & Receipts | Fee payments, receipts |
| Administrative | Filing receipt, bibliographic data, correspondence |
| Examiner Work | Search reports, forward citations, claim analysis |
| Other | Any uncategorized documents |

**Each document shows:**
- Document description and code badge
- Official date (formatted)
- Page count
- **Download buttons** per available format (PDF, XML, etc.)

**Download behavior:**
- Downloads are proxied through the backend (USPTO requires API key authentication)
- Button shows a **spinning progress ring** while downloading
- On completion, a **green checkmark** appears for 1.5 seconds before reverting to the download icon
- Files are saved with descriptive names (e.g., `SPEC_10256227.pdf`)

**Controls:** Same filter, sort, and grouped/list toggle as Transactions.

**Data source:** Always fetched from the documents API endpoint (not available inline).

### 7. Foreign Priority

Shows international priority claims:

| Column | Description |
|---|---|
| Country | Country code of the priority filing |
| Application Number | Foreign application number |
| Filing Date | Priority filing date |

**Data source:** Always fetched from the foreign-priority API endpoint.

### 8. PTA/PTE (Patent Term Adjustment)

Displays Patent Term Adjustment data in a visual grid:

| Metric | Description |
|---|---|
| Category A Delay | USPTO delay in examination (14-month rule) |
| Category B Delay | USPTO delay in overall prosecution (3-year rule) |
| Category C Delay | USPTO delay in interference/appeal |
| Overlap | Days of overlapping delay (subtracted) |
| Applicant Delay | Days of delay caused by the applicant (if applicable) |
| **Total Adjustment** | Net PTA in days (highlighted in primary color) |

**Data source:** Inline from search result or adjustment API endpoint.

### 9. Full Text

Renders the complete patent text inline — parsed from USPTO XML:

- **Abstract** — expanded by default
- **Description** — collapsed by default (can be large)
- **Claims** — collapsed by default, rendered as a numbered list

**Source toggle:** If both a granted patent and a pre-grant publication have text available, a toggle lets you switch between "Grant" and "Publication" views.

**Download links:** Direct XML download links are shown at the top for both grant and publication documents when available.

**Caching:** Parsed full text is cached server-side for 7 days to avoid re-fetching and re-parsing large XML files.

**Data source:** Always fetched from the full-text API endpoint (involves server-side XML parsing).

---

## Performance Optimizations

- **Inline data:** The initial search result includes continuity, assignment, attorney, PTA, and event data. Tabs check for this inline data first, avoiding up to 5 extra API calls per lookup.
- **Lazy tab loading:** Tab content is only fetched when first clicked.
- **Server-side caching:** Search results are cached for 1 hour; full text is cached for 7 days in the database.
- **Streaming downloads:** Document downloads are streamed through the backend in 8KB chunks — no full file buffering.

---

## Data Source

All data comes from the **USPTO Open Data Portal (ODP)** API. This is official USPTO data and includes:
- All US utility, design, and plant patent applications
- Complete prosecution file wrapper data
- Document images (PDF, XML)
- Assignment records
- Patent term adjustment calculations

The platform proxies all requests through the backend, which handles API key authentication, rate limiting (with automatic retry on 429 responses), and response caching.
''',
            },
            {
                'title': 'Infringement Analysis',
                'slug': 'infringement-analysis',
                'order': 3,
                'is_featured': True,
                'tags': ['infringement', 'analysis', 'claims'],
                'excerpt': 'Conduct patent infringement analysis with claim mapping tools.',
                'content': '''# Infringement Analysis

The infringement module helps you identify, assess, and manage potential patent infringement cases.

## Creating a Case

1. Navigate to **Infringement** in the sidebar
2. Click **New Case**
3. Select the patent and accused product/service
4. Begin claim-by-claim analysis

## Claim Mapping

For each independent claim:
1. Break down the claim into individual elements
2. Map each element to features of the accused product
3. Rate the strength of each mapping
4. Document supporting evidence

## Risk Assessment

The platform calculates risk scores based on:
- Number of claims potentially infringed
- Strength of claim mappings
- Available defenses (prior art, design-around)
- Jurisdiction and venue considerations

## Reports

Generate professional reports including:
- Executive summary
- Detailed claim charts
- Risk matrix
- Recommended actions
''',
            },
        ],
    },
    {
        'name': 'API Reference',
        'slug': 'api-reference',
        'description': 'REST API documentation for developers.',
        'icon': 'Code',
        'order': 3,
        'articles': [
            {
                'title': 'REST API Overview',
                'slug': 'rest-api-overview',
                'order': 1,
                'is_featured': False,
                'tags': ['api', 'rest', 'developer'],
                'excerpt': 'Overview of the REST API endpoints and conventions.',
                'content': '''# REST API Overview

The Patent Analytics Platform exposes a RESTful API for programmatic access to all platform features.

## Base URL

```
https://your-domain.com/api/v1/
```

## Response Format

All responses follow a consistent JSON structure:

```json
{
  "id": "uuid",
  "field_name": "value",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

List endpoints return paginated results:

```json
{
  "count": 100,
  "next": "https://api.example.com/resource/?limit=20&offset=20",
  "previous": null,
  "results": [...]
}
```

## Common Parameters

| Parameter | Description |
|-----------|-------------|
| `limit` | Number of results per page (default: 20) |
| `offset` | Number of results to skip |
| `ordering` | Field to sort by (prefix with `-` for descending) |
| `search` | Full-text search query |

## Error Handling

Errors return appropriate HTTP status codes with a JSON body:

```json
{
  "detail": "Error message here"
}
```

| Code | Meaning |
|------|---------|
| 400 | Bad Request — invalid parameters |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 500 | Internal Server Error |
''',
            },
            {
                'title': 'Authentication',
                'slug': 'authentication',
                'order': 2,
                'is_featured': False,
                'tags': ['api', 'auth', 'jwt', 'tokens'],
                'excerpt': 'How to authenticate with the API using JWT tokens.',
                'content': '''# Authentication

The API uses JWT (JSON Web Tokens) for authentication.

## Obtaining Tokens

```bash
POST /api/v1/accounts/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Using Tokens

Include the access token in the `Authorization` header:

```bash
GET /api/v1/patents/portfolios/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Refreshing Tokens

Access tokens expire after 30 minutes. Use the refresh token to obtain a new access token:

```bash
POST /api/v1/accounts/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Token Lifetimes

| Token | Lifetime |
|-------|----------|
| Access | 30 minutes |
| Refresh | 7 days |

## Best Practices

- Store tokens securely (never in plain cookies)
- Implement automatic token refresh in your client
- Revoke refresh tokens on logout
''',
            },
        ],
    },
    {
        'name': 'Integrations',
        'slug': 'integrations',
        'description': 'Connect with external patent databases and services.',
        'icon': 'Plug',
        'order': 4,
        'articles': [
            {
                'title': 'USPTO ODP Setup',
                'slug': 'uspto-odp-setup',
                'order': 1,
                'is_featured': False,
                'tags': ['uspto', 'odp', 'integration'],
                'excerpt': 'Configure the USPTO Open Data Portal integration for patent data retrieval.',
                'content': '''# USPTO ODP Setup

Connect to the USPTO Open Data Portal to import and sync patent data automatically.

## Prerequisites

- A USPTO developer account
- API key from the USPTO developer portal

## Configuration

1. Navigate to **Settings > Integrations**
2. Find **USPTO Open Data Portal**
3. Enter your API credentials:
   - **API Key**: Your USPTO developer API key
   - **Rate Limit**: Requests per minute (default: 60)

## Available Data

The integration provides access to:
- Patent grant full-text data
- Patent application publications
- Patent assignment records
- Patent maintenance fee events
- Classification data (CPC, IPC)

## Sync Options

- **Manual Sync**: Import specific patents by number
- **Bulk Import**: Upload a CSV of patent numbers
- **Auto Sync**: Schedule periodic updates for tracked portfolios

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Rate limit errors | Reduce requests per minute in settings |
| Missing data | Verify patent number format (e.g., US10123456B2) |
| Auth failures | Regenerate your API key on the USPTO portal |
''',
            },
            {
                'title': 'EPO Integration',
                'slug': 'epo-integration',
                'order': 2,
                'is_featured': False,
                'tags': ['epo', 'european', 'integration'],
                'excerpt': 'Set up the European Patent Office integration.',
                'content': '''# EPO Integration

Access European patent data through the EPO Open Patent Services (OPS) API.

## Prerequisites

- An EPO developer account
- Consumer key and secret from the EPO developer portal

## Configuration

1. Navigate to **Settings > Integrations**
2. Find **EPO Open Patent Services**
3. Enter your OAuth credentials:
   - **Consumer Key**: Your EPO consumer key
   - **Consumer Secret**: Your EPO consumer secret

## Available Services

- **Published Data**: Full bibliographic data for EP publications
- **Register Data**: Procedural status and legal events
- **Classification**: CPC classification search
- **Family Data**: Patent family relationships

## Data Mapping

EPO data is automatically mapped to platform fields:

| EPO Field | Platform Field |
|-----------|---------------|
| Publication number | Patent number |
| Applicant | Assignee |
| IPC codes | Classifications |
| Priority date | Priority date |
| Filing date | Filing date |

## Rate Limits

The EPO API has tiered access:
- **Trial**: 30 requests/minute
- **Standard**: 150 requests/minute
- **Premium**: Contact EPO for custom limits
''',
            },
        ],
    },
    {
        'name': 'Admin Guide',
        'slug': 'admin-guide',
        'description': 'System administration and configuration.',
        'icon': 'Shield',
        'order': 5,
        'articles': [
            {
                'title': 'User Management',
                'slug': 'user-management',
                'order': 1,
                'is_featured': False,
                'tags': ['admin', 'users', 'roles'],
                'excerpt': 'Manage users, roles, and permissions in the platform.',
                'content': '''# User Management

Administrators can manage user accounts, assign roles, and configure permissions.

## User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full platform access including user management |
| **Manager** | Team and project management, reporting |
| **Supervisor** | Review and approval workflows |
| **Lead Attorney** | Patent prosecution and legal workflows |
| **Attorney** | Patent drafting and prosecution |
| **Paralegal** | Support tasks and document management |
| **Analyst** | Search, analysis, and reporting |
| **Client** | View-only access to assigned portfolios |

## Creating Users

1. Navigate to **Settings > User Management**
2. Click **Add User**
3. Fill in user details (name, email, role)
4. Set initial password or send invitation email
5. Assign to projects and portfolios as needed

## Managing Permissions

Each role has default permissions that can be customized:
- **Sidebar access**: Which navigation items are visible
- **Feature access**: Which actions users can perform
- **Data access**: Which portfolios/projects are accessible

## Audit Trail

All user actions are logged for compliance:
- Login/logout events
- Data modifications
- Permission changes
- Export activities
''',
            },
            {
                'title': 'System Configuration',
                'slug': 'system-configuration',
                'order': 2,
                'is_featured': False,
                'tags': ['admin', 'config', 'settings'],
                'excerpt': 'Configure platform settings, integrations, and preferences.',
                'content': '''# System Configuration

Configure the platform to match your organization's requirements.

## General Settings

- **Organization Name**: Displayed in the header and reports
- **Default Timezone**: Used for date/time display
- **Date Format**: Choose between US (MM/DD/YYYY) and ISO (YYYY-MM-DD)
- **Currency**: For valuation and cost calculations

## Email Configuration

Configure SMTP settings for notifications:
- Server hostname and port
- Authentication credentials
- TLS/SSL settings
- From address and display name

## Security Settings

- **Session Timeout**: Auto-logout after inactivity (default: 30 min)
- **Password Policy**: Minimum length, complexity requirements
- **Two-Factor Auth**: Enable TOTP-based 2FA for all users
- **IP Allowlist**: Restrict access to specific IP ranges

## Data Retention

Configure how long data is kept:
- **Audit logs**: 1 year (configurable)
- **Deleted items**: 30-day soft-delete window
- **Search history**: 90 days
- **Session data**: 7 days

## Backup & Recovery

The platform supports automated backups:
- Daily database snapshots
- Document storage replication
- Point-in-time recovery options
''',
            },
        ],
    },
    {
        'name': 'FAQ',
        'slug': 'faq',
        'description': 'Frequently asked questions and troubleshooting.',
        'icon': 'HelpCircle',
        'order': 6,
        'articles': [
            {
                'title': 'Common Questions',
                'slug': 'common-questions',
                'order': 1,
                'is_featured': True,
                'tags': ['faq', 'common', 'questions'],
                'excerpt': 'Answers to the most frequently asked questions about the platform.',
                'content': '''# Common Questions

## General

**Q: What browsers are supported?**
A: The platform supports the latest versions of Chrome, Firefox, Safari, and Edge. We recommend Chrome for the best experience.

**Q: Can I access the platform on mobile?**
A: Yes, the platform is fully responsive. While optimized for desktop use, all features are accessible on tablets and smartphones.

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox.

## Data & Privacy

**Q: Where is my data stored?**
A: All data is stored securely on encrypted servers. Contact your administrator for specific infrastructure details.

**Q: Can I export my data?**
A: Yes, most data can be exported in CSV, Excel, or PDF formats from list views and reports.

**Q: Who can see my portfolios?**
A: Only users explicitly granted access to a portfolio can view its contents. Administrators can see all data.

## Features

**Q: How many patents can I manage?**
A: There is no hard limit. The platform is designed to handle portfolios of any size efficiently.

**Q: Can I import patents from a spreadsheet?**
A: Yes, use the bulk import feature under Portfolio > Import. Supported formats include CSV and Excel.

**Q: Does the platform support multiple languages?**
A: Patent data is stored in its original language. The interface is currently available in English.
''',
            },
            {
                'title': 'Troubleshooting',
                'slug': 'troubleshooting',
                'order': 2,
                'is_featured': False,
                'tags': ['faq', 'troubleshooting', 'errors'],
                'excerpt': 'Solutions for common issues and error messages.',
                'content': '''# Troubleshooting

## Login Issues

**Problem: "Invalid credentials" error**
- Verify your email address is correct
- Check caps lock is off
- Try resetting your password
- Contact your administrator if the issue persists

**Problem: "Session expired" messages**
- This is normal after 30 minutes of inactivity
- Simply log in again to resume your work
- Your unsaved work in forms may be lost — save frequently

## Performance

**Problem: Pages loading slowly**
- Check your internet connection
- Clear browser cache and cookies
- Try a different browser
- Disable browser extensions that may interfere

**Problem: Search results taking too long**
- Narrow your search criteria
- Use specific patent numbers when possible
- Large date ranges may slow results

## Data Issues

**Problem: Missing patents after import**
- Check the import log for error details
- Verify patent number formats match expected patterns
- Ensure no duplicate entries exist

**Problem: Charts not displaying**
- Enable JavaScript in your browser
- Disable ad blockers for this site
- Try refreshing the page

## Getting More Help

If you can't resolve your issue:
1. Check if it's a known issue in the release notes
2. Contact your system administrator
3. Submit a support ticket with:
   - Steps to reproduce the issue
   - Browser and OS information
   - Screenshots if applicable
''',
            },
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed help categories and articles with starter content'

    def handle(self, *args, **options):
        with transaction.atomic():
            total_categories = 0
            total_articles = 0

            for cat_data in SEED_DATA:
                articles_data = cat_data.pop('articles')
                category, created = HelpCategory.objects.get_or_create(
                    slug=cat_data['slug'],
                    defaults=cat_data,
                )
                # Restore articles key for idempotency on re-run
                cat_data['articles'] = articles_data
                total_categories += 1

                for art_data in articles_data:
                    HelpArticle.objects.get_or_create(
                        category=category,
                        slug=art_data['slug'],
                        defaults=art_data,
                    )
                    total_articles += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {total_categories} categories and {total_articles} articles.'
        ))
