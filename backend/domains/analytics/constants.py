"""
Analytics domain constants.
Centralizes magic numbers and thresholds used across algorithm modules.
"""

# ── FTO Analysis ──────────────────────────────────────────────────────
FTO_MAX_PATENTS = 200
FTO_MAX_CLAIMS_PER_PATENT = 10
FTO_RISK_THRESHOLD_HIGH = 70
FTO_RISK_THRESHOLD_MEDIUM = 40
FTO_RISK_THRESHOLD_LOW = 10

# Risk scoring weights (points)
FTO_WEIGHT_ACTIVE_STATUS = 30
FTO_WEIGHT_EXPIRED_STATUS = 5
FTO_WEIGHT_CLAIMS_HIGH = 25    # >20 claims
FTO_WEIGHT_CLAIMS_MED = 15     # >10 claims
FTO_WEIGHT_CLAIMS_LOW = 10     # >0 claims
FTO_WEIGHT_CITATIONS_HIGH = 25  # >50 citations
FTO_WEIGHT_CITATIONS_MED = 15   # >20 citations
FTO_WEIGHT_CITATIONS_LOW = 10   # >5 citations
FTO_WEIGHT_KEYWORD_OVERLAP = 20

# ── White Space Analysis ──────────────────────────────────────────────
WHITESPACE_TOP_CPCS = 15
WHITESPACE_TOP_ASSIGNEES = 10
WHITESPACE_BARRIER_HIGH_PCT = 10
WHITESPACE_BARRIER_MEDIUM_PCT = 3
WHITESPACE_MAX_EXPIRED_RESULTS = 50
WHITESPACE_MAX_OPPORTUNITIES = 20

# Opportunity scoring weights (out of 100)
WHITESPACE_DENSITY_WEIGHT = 40
WHITESPACE_VELOCITY_WEIGHT = 20  # neutral default
WHITESPACE_BARRIER_WEIGHT = 40

# ── Trends Analysis ───────────────────────────────────────────────────
TRENDS_FORECAST_WINDOW = 6   # months of history for forecasting
TRENDS_MATURITY_GROWING_THRESHOLD = 0.9   # ratio of recent/max
TRENDS_MATURITY_MATURE_THRESHOLD = 0.5

# ── Patent Search ─────────────────────────────────────────────────────
MAX_SEARCH_RESULTS = 10_000
