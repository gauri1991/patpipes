"""
Brainstorming URL Configuration
URL routing for world-class brainstorming functionality
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .brainstorming_views import (
    BrainstormingSessionViewSet,
    IdeationRecordViewSet,
    KeywordGenerationViewSet,
    ConceptMappingViewSet,
    ResearchStrategyViewSet,
    CompetitorAnalysisViewSet,
    AIInteractionViewSet
)

# Create router and register viewsets
brainstorming_router = DefaultRouter()

# Core brainstorming functionality
brainstorming_router.register(
    r'sessions', 
    BrainstormingSessionViewSet, 
    basename='brainstorming-sessions'
)

brainstorming_router.register(
    r'ideation', 
    IdeationRecordViewSet, 
    basename='brainstorming-ideation'
)

brainstorming_router.register(
    r'keywords', 
    KeywordGenerationViewSet, 
    basename='brainstorming-keywords'
)

brainstorming_router.register(
    r'concepts', 
    ConceptMappingViewSet, 
    basename='brainstorming-concepts'
)

brainstorming_router.register(
    r'strategies', 
    ResearchStrategyViewSet, 
    basename='brainstorming-strategies'
)

brainstorming_router.register(
    r'competitors', 
    CompetitorAnalysisViewSet, 
    basename='brainstorming-competitors'
)

brainstorming_router.register(
    r'ai-interactions', 
    AIInteractionViewSet, 
    basename='brainstorming-ai'
)

urlpatterns = [
    path('', include(brainstorming_router.urls)),
]

# Generate API endpoint documentation
"""
Generated API Endpoints:

SESSION MANAGEMENT:
- GET    /api/analytics/brainstorming/sessions/              # List all sessions
- POST   /api/analytics/brainstorming/sessions/              # Create new session
- GET    /api/analytics/brainstorming/sessions/{id}/         # Get session details
- PUT    /api/analytics/brainstorming/sessions/{id}/         # Update session
- DELETE /api/analytics/brainstorming/sessions/{id}/         # Delete session
- POST   /api/analytics/brainstorming/sessions/{id}/add_participant/     # Add participant
- POST   /api/analytics/brainstorming/sessions/{id}/complete_session/    # Complete session
- GET    /api/analytics/brainstorming/sessions/{id}/analytics/           # Session analytics

IDEATION MANAGEMENT:
- GET    /api/analytics/brainstorming/ideation/              # List ideas
- POST   /api/analytics/brainstorming/ideation/              # Create new idea
- GET    /api/analytics/brainstorming/ideation/{id}/         # Get idea details
- PUT    /api/analytics/brainstorming/ideation/{id}/         # Update idea
- DELETE /api/analytics/brainstorming/ideation/{id}/         # Delete idea
- POST   /api/analytics/brainstorming/ideation/{id}/vote/    # Vote on idea
- POST   /api/analytics/brainstorming/ideation/{id}/pin/     # Pin/unpin idea

KEYWORD GENERATION:
- GET    /api/analytics/brainstorming/keywords/              # List keywords
- POST   /api/analytics/brainstorming/keywords/              # Create keyword
- GET    /api/analytics/brainstorming/keywords/{id}/         # Get keyword details
- PUT    /api/analytics/brainstorming/keywords/{id}/         # Update keyword
- DELETE /api/analytics/brainstorming/keywords/{id}/         # Delete keyword
- POST   /api/analytics/brainstorming/keywords/generate_from_text/       # AI keyword generation
- POST   /api/analytics/brainstorming/keywords/{id}/validate/            # Validate keyword

CONCEPT MAPPING:
- GET    /api/analytics/brainstorming/concepts/              # List concepts
- POST   /api/analytics/brainstorming/concepts/              # Create concept
- GET    /api/analytics/brainstorming/concepts/{id}/         # Get concept details
- PUT    /api/analytics/brainstorming/concepts/{id}/         # Update concept
- DELETE /api/analytics/brainstorming/concepts/{id}/         # Delete concept
- POST   /api/analytics/brainstorming/concepts/create_relationship/      # Create concept relationship

RESEARCH STRATEGIES:
- GET    /api/analytics/brainstorming/strategies/            # List strategies
- POST   /api/analytics/brainstorming/strategies/            # Create strategy
- GET    /api/analytics/brainstorming/strategies/{id}/       # Get strategy details
- PUT    /api/analytics/brainstorming/strategies/{id}/       # Update strategy
- DELETE /api/analytics/brainstorming/strategies/{id}/       # Delete strategy
- POST   /api/analytics/brainstorming/strategies/{id}/execute/           # Execute strategy

COMPETITOR ANALYSIS:
- GET    /api/analytics/brainstorming/competitors/           # List competitor analyses
- POST   /api/analytics/brainstorming/competitors/           # Create competitor analysis
- GET    /api/analytics/brainstorming/competitors/{id}/      # Get competitor details
- PUT    /api/analytics/brainstorming/competitors/{id}/      # Update competitor analysis
- DELETE /api/analytics/brainstorming/competitors/{id}/      # Delete competitor analysis
- POST   /api/analytics/brainstorming/competitors/{id}/update_patent_data/ # Update patent data

AI INTERACTIONS:
- GET    /api/analytics/brainstorming/ai-interactions/       # List AI interactions
- POST   /api/analytics/brainstorming/ai-interactions/       # Create AI interaction
- GET    /api/analytics/brainstorming/ai-interactions/{id}/  # Get interaction details
- PUT    /api/analytics/brainstorming/ai-interactions/{id}/  # Update interaction
- DELETE /api/analytics/brainstorming/ai-interactions/{id}/  # Delete interaction
- POST   /api/analytics/brainstorming/ai-interactions/{id}/rate/          # Rate interaction

QUERY PARAMETERS:
- session_id: Filter by brainstorming session
- project_id: Filter by project
- status: Filter by status
- type: Filter by type/category
- validated: Filter by validation status (true/false)

EXAMPLE USAGE:
- GET /api/analytics/brainstorming/sessions/?project_id=123
- GET /api/analytics/brainstorming/ideation/?session_id=456&type=concept
- GET /api/analytics/brainstorming/keywords/?session_id=456&validated=true
- POST /api/analytics/brainstorming/keywords/generate_from_text/
"""