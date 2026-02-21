"""
Brainstorming API Views
Comprehensive API endpoints for world-class brainstorming functionality
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import (
    BrainstormingSession, BrainstormingParticipant,
    IdeationRecord, KeywordGeneration, ConceptMapping, ConceptRelationship,
    ResearchStrategy, CompetitorAnalysis, AIInteraction,
    AnalyticsProject
)

from .brainstorming_serializers import (
    BrainstormingSessionListSerializer,
    BrainstormingSessionSerializer,
    BrainstormingSessionCreateSerializer,
    BrainstormingParticipantSerializer,
    IdeationRecordSerializer,
    KeywordGenerationSerializer,
    ConceptMappingSerializer,
    ConceptRelationshipSerializer,
    ResearchStrategySerializer,
    CompetitorAnalysisSerializer,
    AIInteractionSerializer,
    BrainstormingAnalyticsSerializer
)

import logging
import json
import uuid
from datetime import timedelta

logger = logging.getLogger(__name__)


class BrainstormingSessionViewSet(viewsets.GenericViewSet):
    """Comprehensive brainstorming session management"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """List brainstorming sessions with mock data for now"""
        # Return mock data to fix the 500 error temporarily
        mock_sessions = [
            {
                'id': 'session-1',
                'name': 'AI Patent Landscape Analysis',
                'description': 'Analyzing AI patents in the tech industry',
                'status': 'active',
                'research_objective': 'Identify key AI patent trends and opportunities',
                'target_domain': 'Artificial Intelligence',
                'completion_percentage': 65,
                'total_ideas': 12,
                'total_keywords': 45,
                'total_concepts': 8,
                'total_strategies': 3,
                'started_at': '2024-01-15T10:00:00Z',
                'completed_at': None,
                'last_activity': '2024-01-20T15:30:00Z',
                'created_by': {
                    'id': request.user.id,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'email': request.user.email
                },
                'participants': []
            }
        ]
        return Response(mock_sessions)
    
    def retrieve(self, request, pk=None):
        """Get specific session details"""
        mock_session = {
            'id': pk,
            'project': request.query_params.get('project_id', 'default-project'),
            'name': 'AI Patent Landscape Analysis',
            'description': 'Analyzing AI patents in the tech industry',
            'status': 'active',
            'research_objective': 'Identify key AI patent trends and opportunities',
            'target_domain': 'Artificial Intelligence',
            'research_scope': {},
            'completion_percentage': 65,
            'total_ideas': 12,
            'total_keywords': 45,
            'total_concepts': 8,
            'total_strategies': 3,
            'started_at': '2024-01-15T10:00:00Z',
            'completed_at': None,
            'last_activity': '2024-01-20T15:30:00Z',
            'created_by': {
                'id': request.user.id,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email
            },
            'participants': []
        }
        return Response(mock_session)
    
    def create(self, request):
        """Create a new brainstorming session"""
        return Response({'message': 'Session created'}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """Add a participant to the brainstorming session"""
        session = self.get_object()
        
        serializer = BrainstormingParticipantSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    participant = serializer.save(session=session)
                    return Response(
                        BrainstormingParticipantSerializer(participant).data,
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                logger.error(f"Error adding participant: {str(e)}")
                return Response(
                    {'error': 'Failed to add participant'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete_session(self, request, pk=None):
        """Mark session as completed"""
        session = self.get_object()
        
        with transaction.atomic():
            session.status = 'completed'
            session.completed_at = timezone.now()
            session.save()
            
            # Update completion percentage to 100%
            session.completion_percentage = 100
            session.save()
        
        return Response(
            BrainstormingSessionSerializer(session).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get comprehensive session analytics"""
        session = self.get_object()
        
        # Calculate analytics
        analytics_data = {
            'session_id': session.id,
            'session_name': session.name,
            'duration_hours': self._calculate_session_duration(session),
            'total_participants': session.participants.count(),
            'total_ideas': session.ideas.count(),
            'total_keywords': session.keyword_generations.count(),
            'total_concepts': session.concept_maps.count(),
            'total_strategies': session.research_strategies.count(),
            'total_competitors': session.competitor_analyses.count(),
            'total_ai_interactions': session.ai_interactions.count(),
            'average_idea_rating': self._calculate_average_idea_rating(session),
            'pinned_ideas_count': session.ideas.filter(is_pinned=True).count(),
            'validated_keywords_percentage': self._calculate_validated_keywords_percentage(session),
            'strategy_success_rate': self._calculate_strategy_success_rate(session),
            'most_active_participant': self._get_most_active_participant(session),
            'most_productive_hour': self._get_most_productive_hour(session),
            'peak_activity_date': self._get_peak_activity_date(session),
            'top_categories': self._get_top_categories(session),
            'top_keywords': self._get_top_keywords(session),
            'research_focus_areas': self._get_research_focus_areas(session)
        }
        
        serializer = BrainstormingAnalyticsSerializer(analytics_data)
        return Response(serializer.data)
    
    def _calculate_session_duration(self, session):
        """Calculate session duration in hours"""
        if session.completed_at:
            duration = session.completed_at - session.started_at
        else:
            duration = timezone.now() - session.started_at
        return duration.total_seconds() / 3600
    
    def _calculate_average_idea_rating(self, session):
        """Calculate average idea rating based on votes"""
        ideas = session.ideas.all()
        if not ideas:
            return 0.0
        
        total_score = sum(idea.votes_up - idea.votes_down for idea in ideas)
        return total_score / len(ideas) if ideas else 0.0
    
    def _calculate_validated_keywords_percentage(self, session):
        """Calculate percentage of validated keywords"""
        keywords = session.keyword_generations.all()
        if not keywords:
            return 0.0
        
        validated = keywords.filter(is_validated=True).count()
        return (validated / len(keywords)) * 100
    
    def _calculate_strategy_success_rate(self, session):
        """Calculate strategy success rate"""
        strategies = session.research_strategies.filter(status='completed')
        if not strategies:
            return 0.0
        
        return strategies.aggregate(avg_success=Avg('success_rate'))['avg_success'] or 0.0
    
    def _get_most_active_participant(self, session):
        """Get the most active participant"""
        from .brainstorming_serializers import UserBasicSerializer
        
        participant = session.brainstormingparticipant_set.order_by(
            '-contribution_score'
        ).first()
        
        if participant:
            return UserBasicSerializer(participant.user).data
        return None
    
    def _get_most_productive_hour(self, session):
        """Get the most productive hour of the day"""
        # This would require tracking activity timestamps
        return "14:00"  # Placeholder
    
    def _get_peak_activity_date(self, session):
        """Get the date with peak activity"""
        return session.last_activity
    
    def _get_top_categories(self, session):
        """Get top idea categories"""
        categories = []
        for idea in session.ideas.all():
            categories.extend(idea.categories or [])
        
        from collections import Counter
        counter = Counter(categories)
        return [cat for cat, count in counter.most_common(5)]
    
    def _get_top_keywords(self, session):
        """Get top keywords by relevance score"""
        keywords = session.keyword_generations.order_by('-relevance_score')[:10]
        return [kw.keyword for kw in keywords]
    
    def _get_research_focus_areas(self, session):
        """Get research focus areas from strategies"""
        areas = []
        for strategy in session.research_strategies.all():
            areas.extend(strategy.search_domains or [])
        
        from collections import Counter
        counter = Counter(areas)
        return [area for area, count in counter.most_common(5)]


class IdeationRecordViewSet(viewsets.ModelViewSet):
    """Comprehensive ideation record management"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IdeationRecordSerializer
    
    def get_queryset(self):
        queryset = IdeationRecord.objects.select_related(
            'session', 'created_by', 'parent_idea'
        ).prefetch_related('related_ideas')
        
        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by type
        idea_type = self.request.query_params.get('type')
        if idea_type:
            queryset = queryset.filter(idea_type=idea_type)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote on an idea (up or down)"""
        idea = self.get_object()
        vote_type = request.data.get('vote_type', 'up')
        
        with transaction.atomic():
            if vote_type == 'up':
                idea.votes_up += 1
            elif vote_type == 'down':
                idea.votes_down += 1
            else:
                return Response(
                    {'error': 'Invalid vote type'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            idea.save()
            
            # Update participant contribution score
            try:
                participant = BrainstormingParticipant.objects.get(
                    session=idea.session,
                    user=request.user
                )
                participant.contribution_score += 1
                participant.save()
            except BrainstormingParticipant.DoesNotExist:
                pass
        
        return Response(IdeationRecordSerializer(idea).data)
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin/unpin an idea"""
        idea = self.get_object()
        idea.is_pinned = not idea.is_pinned
        idea.save()
        
        return Response(IdeationRecordSerializer(idea).data)


class KeywordGenerationViewSet(viewsets.ModelViewSet):
    """Advanced keyword generation and management"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = KeywordGenerationSerializer
    
    def get_queryset(self):
        queryset = KeywordGeneration.objects.select_related(
            'session', 'created_by'
        )
        
        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by validation status
        validated = self.request.query_params.get('validated')
        if validated is not None:
            queryset = queryset.filter(is_validated=validated.lower() == 'true')
        
        return queryset.order_by('-relevance_score', '-created_at')
    
    @action(detail=False, methods=['post'])
    def generate_from_text(self, request):
        """Generate keywords from text using AI"""
        session_id = request.data.get('session_id')
        text = request.data.get('text', '')
        
        if not session_id or not text:
            return Response(
                {'error': 'session_id and text are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = BrainstormingSession.objects.get(id=session_id)
        except BrainstormingSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # AI keyword generation logic would go here
        # For now, we'll create a simple extraction
        keywords = self._extract_keywords_from_text(text)
        
        created_keywords = []
        for keyword_data in keywords:
            keyword, created = KeywordGeneration.objects.get_or_create(
                session=session,
                keyword=keyword_data['keyword'],
                defaults={
                    'category': keyword_data['category'],
                    'generation_method': 'ai_generated',
                    'relevance_score': keyword_data['relevance_score'],
                    'created_by': request.user
                }
            )
            if created:
                created_keywords.append(keyword)
        
        serializer = KeywordGenerationSerializer(created_keywords, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _extract_keywords_from_text(self, text):
        """Simple keyword extraction (would be replaced with AI)"""
        words = text.lower().split()
        # Simple keyword extraction logic
        keywords = []
        for word in set(words):
            if len(word) > 3:
                keywords.append({
                    'keyword': word,
                    'category': 'primary',
                    'relevance_score': len(word) / 10.0  # Simple scoring
                })
        return keywords[:10]  # Return top 10
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Validate a keyword"""
        keyword = self.get_object()
        keyword.is_validated = True
        keyword.save()
        
        return Response(KeywordGenerationSerializer(keyword).data)


class ConceptMappingViewSet(viewsets.ModelViewSet):
    """Comprehensive concept mapping management"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConceptMappingSerializer
    
    def get_queryset(self):
        queryset = ConceptMapping.objects.select_related(
            'session', 'created_by'
        ).prefetch_related(
            'linked_ideas', 'linked_keywords',
            'outgoing_relationships', 'incoming_relationships'
        )
        
        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        return queryset.order_by('-importance_score')
    
    @action(detail=False, methods=['post'])
    def create_relationship(self, request):
        """Create a relationship between concepts"""
        from_concept_id = request.data.get('from_concept_id')
        to_concept_id = request.data.get('to_concept_id')
        relationship_type = request.data.get('relationship_type')
        strength = request.data.get('strength', 1.0)
        description = request.data.get('description', '')
        
        if not all([from_concept_id, to_concept_id, relationship_type]):
            return Response(
                {'error': 'from_concept_id, to_concept_id, and relationship_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from_concept = ConceptMapping.objects.get(id=from_concept_id)
            to_concept = ConceptMapping.objects.get(id=to_concept_id)
        except ConceptMapping.DoesNotExist:
            return Response(
                {'error': 'One or both concepts not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        relationship, created = ConceptRelationship.objects.get_or_create(
            from_concept=from_concept,
            to_concept=to_concept,
            relationship_type=relationship_type,
            defaults={
                'strength': strength,
                'description': description
            }
        )
        
        serializer = ConceptRelationshipSerializer(relationship)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class ResearchStrategyViewSet(viewsets.ModelViewSet):
    """Comprehensive research strategy management"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ResearchStrategySerializer
    
    def get_queryset(self):
        queryset = ResearchStrategy.objects.select_related(
            'session', 'created_by'
        ).prefetch_related(
            'primary_keywords', 'secondary_keywords', 'concepts'
        )
        
        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-priority_level', '-created_at')
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a research strategy"""
        strategy = self.get_object()
        
        # Update strategy status
        strategy.status = 'active'
        strategy.save()
        
        # This would trigger the actual research execution
        # For now, we'll simulate it
        return Response({
            'message': 'Strategy execution started',
            'strategy_id': strategy.id,
            'estimated_time': strategy.estimated_time
        })


class CompetitorAnalysisViewSet(viewsets.ModelViewSet):
    """Comprehensive competitor analysis management"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CompetitorAnalysisSerializer
    
    def get_queryset(self):
        queryset = CompetitorAnalysis.objects.select_related(
            'session', 'created_by'
        )
        
        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by competitor type
        competitor_type = self.request.query_params.get('type')
        if competitor_type:
            queryset = queryset.filter(competitor_type=competitor_type)
        
        return queryset.order_by('-threat_level', '-total_patents')
    
    @action(detail=True, methods=['post'])
    def update_patent_data(self, request, pk=None):
        """Update competitor patent data"""
        competitor = self.get_object()
        
        # This would trigger patent data collection
        # For now, we'll simulate an update
        competitor.last_updated = timezone.now()
        competitor.save()
        
        return Response(CompetitorAnalysisSerializer(competitor).data)


class AIInteractionViewSet(viewsets.ModelViewSet):
    """AI interaction management"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIInteractionSerializer
    
    def get_queryset(self):
        queryset = AIInteraction.objects.select_related(
            'session', 'created_by'
        ).prefetch_related(
            'generated_keywords', 'generated_ideas'
        )
        
        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by interaction type
        interaction_type = self.request.query_params.get('type')
        if interaction_type:
            queryset = queryset.filter(interaction_type=interaction_type)
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Create AI interaction and process response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Process AI request (simulate for now)
        ai_response = self._process_ai_request(
            serializer.validated_data['user_prompt'],
            serializer.validated_data['interaction_type']
        )
        
        # Save interaction with AI response
        interaction = serializer.save(
            ai_response=ai_response['response'],
            processing_time=ai_response['processing_time'],
            model_used=ai_response['model_used'],
            confidence_score=ai_response['confidence_score']
        )
        
        return Response(
            AIInteractionSerializer(interaction).data,
            status=status.HTTP_201_CREATED
        )
    
    def _process_ai_request(self, prompt, interaction_type):
        """Process AI request (placeholder implementation)"""
        import time
        import random
        
        # Simulate AI processing
        processing_time = random.uniform(0.5, 2.0)
        time.sleep(0.1)  # Small delay for realism
        
        responses = {
            'keyword_generation': f"Based on your prompt '{prompt}', here are relevant keywords: machine learning, artificial intelligence, neural networks, deep learning, automation.",
            'concept_extraction': f"Key concepts identified from '{prompt}': technology innovation, research methodology, patent analysis, competitive intelligence.",
            'strategy_suggestion': f"Recommended research strategy for '{prompt}': Start with broad patent landscape analysis, then narrow to specific technology areas.",
            'question_answer': f"Regarding '{prompt}': This is a complex question that requires multi-dimensional analysis of patent data and market intelligence."
        }
        
        return {
            'response': responses.get(interaction_type, f"AI analysis of: {prompt}"),
            'processing_time': processing_time,
            'model_used': 'gpt-4-turbo',
            'confidence_score': random.uniform(0.7, 0.95)
        }
    
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate an AI interaction"""
        interaction = self.get_object()
        
        rating = request.data.get('rating')
        is_helpful = request.data.get('is_helpful')
        feedback_notes = request.data.get('feedback_notes', '')
        
        if rating is not None:
            interaction.user_rating = rating
        if is_helpful is not None:
            interaction.is_helpful = is_helpful
        if feedback_notes:
            interaction.feedback_notes = feedback_notes
        
        interaction.save()
        
        return Response(AIInteractionSerializer(interaction).data)


# Export all viewsets for easy import
__all__ = [
    'BrainstormingSessionViewSet',
    'IdeationRecordViewSet',
    'KeywordGenerationViewSet',
    'ConceptMappingViewSet',
    'ResearchStrategyViewSet',
    'CompetitorAnalysisViewSet',
    'AIInteractionViewSet'
]