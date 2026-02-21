"""
Patent Text Processing Agents
Real NLP pipeline for entity extraction and relationship analysis
"""

import spacy
import re
import json
import os
from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN, KMeans
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from collections import defaultdict, Counter

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import openai
except ImportError:
    openai = None


@dataclass
class Entity:
    """Extracted entity with metadata"""
    text: str
    type: str
    start: int
    end: int
    confidence: float
    normalized_form: Optional[str] = None
    attributes: Dict = None


@dataclass
class Triplet:
    """Entity-Relation-Entity triplet"""
    subject: Entity
    predicate: str
    object: Entity
    confidence: float
    source_sentence: str
    context: Dict = None


class PatentPreprocessor:
    """Agent 1: Text preprocessing and cleaning"""
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
    
    def preprocess(self, text: str, field_type: str = "abstract") -> Dict[str, any]:
        """Clean and preprocess patent text"""
        
        # Remove patent-specific noise
        text = re.sub(r'Figure\s+\d+[A-Z]*', '', text)  # Remove figure references
        text = re.sub(r'\([0-9,\s]+\)', '', text)  # Remove reference numbers
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        
        doc = self.nlp(text)
        
        # Split into sentences with metadata
        sentences = []
        for sent in doc.sents:
            clean_sent = sent.text.strip()
            if len(clean_sent) > 20:  # Filter very short sentences
                sentences.append({
                    'text': clean_sent,
                    'start': sent.start_char,
                    'end': sent.end_char,
                    'complexity': len([t for t in sent if t.dep_ in ['nsubj', 'dobj', 'pobj']])
                })
        
        return {
            'sentences': sentences,
            'total_length': len(text),
            'sentence_count': len(sentences),
            'field_type': field_type,
            'language': doc.lang_
        }


class EntityExtractionAgent:
    """Agent 2: Extract technical entities from patent text"""
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        
        # Patent-specific entity patterns
        self.patterns = {
            'component': [
                r'\b(?:device|apparatus|system|unit|module|assembly|component|mechanism|structure)\b',
                r'\b\w+(?:\s+\w+){0,2}\s+(?:device|unit|module|system)\b'
            ],
            'process': [
                r'\b(?:method|process|procedure|technique|approach|algorithm|step|operation)\b',
                r'\b(?:processing|manufacturing|producing|generating|controlling|monitoring)\b'
            ],
            'material': [
                r'\b(?:material|substance|compound|element|alloy|polymer|semiconductor|conductor)\b',
                r'\b\w+(?:\s+\w+){0,1}\s+(?:material|layer|coating|film)\b'
            ],
            'application': [
                r'\b(?:application|use|purpose|function|implementation|deployment)\b',
                r'\bused\s+(?:for|in|as|to)\b'
            ]
        }
    
    def extract_entities(self, sentences: List[Dict], config: Dict) -> List[Entity]:
        """Extract entities from preprocessed sentences"""
        entities = []
        min_confidence = config.get('min_confidence', 0.7)
        target_types = config.get('entity_types', ['component', 'process', 'material', 'application'])
        extraction_method = config.get('extraction_method', 'both')
        
        for sent_data in sentences:
            doc = self.nlp(sent_data['text'])
            
            # Apply extraction method based on configuration
            if extraction_method in ['both', 'ner']:
                # Named Entity Recognition
                for ent in doc.ents:
                    if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART', 'EVENT']:
                        entities.append(Entity(
                            text=ent.text,
                            type='system',
                            start=ent.start_char + sent_data['start'],
                            end=ent.end_char + sent_data['start'],
                            confidence=0.8,
                            attributes={'extraction_method': 'ner', 'ner_label': ent.label_}
                        ))
            
            if extraction_method in ['both', 'pattern']:
                # Pattern-based extraction
                for entity_type in target_types:
                    if entity_type in self.patterns:
                        for pattern in self.patterns[entity_type]:
                            matches = re.finditer(pattern, sent_data['text'], re.IGNORECASE)
                            for match in matches:
                                # Calculate confidence based on context
                                confidence = self._calculate_confidence(
                                    match.group(), sent_data['text'], entity_type
                                )
                                
                                if confidence >= min_confidence:
                                    entities.append(Entity(
                                        text=match.group().strip(),
                                        type=entity_type,
                                        start=match.start() + sent_data['start'],
                                        end=match.end() + sent_data['start'],
                                        confidence=confidence,
                                        attributes={'extraction_method': 'pattern'}
                                    ))
        
        # API-based extraction
        if extraction_method == 'claude_api':
            api_entities = self._extract_entities_with_claude(sentences, target_types, min_confidence)
            entities.extend(api_entities)
        elif extraction_method == 'openai_api':
            api_entities = self._extract_entities_with_openai(sentences, target_types, min_confidence)
            entities.extend(api_entities)
        
        return self._deduplicate_entities(entities)
    
    def _calculate_confidence(self, entity_text: str, context: str, entity_type: str) -> float:
        """Calculate confidence score for extracted entity"""
        base_confidence = 0.6
        
        # Boost confidence for longer, more specific terms
        if len(entity_text.split()) > 2:
            base_confidence += 0.2
        
        # Boost for technical terms
        if any(term in entity_text.lower() for term in ['system', 'apparatus', 'method', 'device']):
            base_confidence += 0.1
        
        # Context analysis
        technical_words = ['comprising', 'configured', 'adapted', 'operable', 'wherein']
        if any(word in context.lower() for word in technical_words):
            base_confidence += 0.1
        
        return min(base_confidence, 0.95)
    
    def _deduplicate_entities(self, entities: List[Entity]) -> List[Entity]:
        """Remove duplicate entities"""
        seen = set()
        unique_entities = []
        
        for entity in entities:
            key = (entity.text.lower(), entity.type)
            if key not in seen:
                seen.add(key)
                unique_entities.append(entity)
        
        return unique_entities
    
    def _extract_entities_with_claude(self, sentences: List[Dict], target_types: List[str], min_confidence: float) -> List[Entity]:
        """Extract entities using Claude API"""
        if not anthropic:
            return []
        
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            return []
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            entities = []
            
            # Combine sentences for API call (batch processing)
            text_chunks = []
            for sent_data in sentences[:5]:  # Limit to first 5 sentences for cost control
                text_chunks.append(sent_data['text'])
            
            combined_text = ' '.join(text_chunks)
            if len(combined_text) > 3000:  # Limit text length
                combined_text = combined_text[:3000] + "..."
            
            prompt = f"""
Extract technical entities from this patent text. Return only a JSON list of entities.
Target entity types: {', '.join(target_types)}

Text: {combined_text}

Return JSON format:
[{{"text": "entity_text", "type": "component|process|material|application|system|method", "confidence": 0.8}}]
"""
            
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse response
            response_text = response.content[0].text
            try:
                parsed_entities = json.loads(response_text)
                
                for ent_data in parsed_entities:
                    if ent_data.get('confidence', 0) >= min_confidence:
                        # Find position in original text
                        entity_text = ent_data['text']
                        start_pos = combined_text.lower().find(entity_text.lower())
                        
                        if start_pos != -1:
                            entities.append(Entity(
                                text=entity_text,
                                type=ent_data.get('type', 'system'),
                                start=start_pos,
                                end=start_pos + len(entity_text),
                                confidence=ent_data.get('confidence', 0.8),
                                attributes={'extraction_method': 'claude_api'}
                            ))
            except json.JSONDecodeError:
                pass  # Ignore parsing errors
                
        except Exception as e:
            print(f"Claude API error: {e}")
        
        return entities
    
    def _extract_entities_with_openai(self, sentences: List[Dict], target_types: List[str], min_confidence: float) -> List[Entity]:
        """Extract entities using OpenAI API"""
        if not openai:
            return []
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return []
        
        try:
            client = openai.OpenAI(api_key=api_key)
            entities = []
            
            # Combine sentences for API call (batch processing)
            text_chunks = []
            for sent_data in sentences[:5]:  # Limit to first 5 sentences for cost control
                text_chunks.append(sent_data['text'])
            
            combined_text = ' '.join(text_chunks)
            if len(combined_text) > 3000:  # Limit text length
                combined_text = combined_text[:3000] + "..."
            
            prompt = f"""
Extract technical entities from this patent text. Return only a JSON list of entities.
Target entity types: {', '.join(target_types)}

Text: {combined_text}

Return JSON format:
[{{"text": "entity_text", "type": "component|process|material|application|system|method", "confidence": 0.8}}]
"""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.3
            )
            
            # Parse response
            response_text = response.choices[0].message.content
            try:
                parsed_entities = json.loads(response_text)
                
                for ent_data in parsed_entities:
                    if ent_data.get('confidence', 0) >= min_confidence:
                        # Find position in original text
                        entity_text = ent_data['text']
                        start_pos = combined_text.lower().find(entity_text.lower())
                        
                        if start_pos != -1:
                            entities.append(Entity(
                                text=entity_text,
                                type=ent_data.get('type', 'system'),
                                start=start_pos,
                                end=start_pos + len(entity_text),
                                confidence=ent_data.get('confidence', 0.8),
                                attributes={'extraction_method': 'openai_api'}
                            ))
            except json.JSONDecodeError:
                pass  # Ignore parsing errors
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
        
        return entities


class RelationshipExtractionAgent:
    """Agent 3: Extract relationships between entities"""
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        
        # Relationship patterns for patents
        self.relation_patterns = {
            'comprises': [
                r'comprises?\s+(?:a\s+|an\s+|the\s+)?([^,.;]+)',
                r'including\s+(?:a\s+|an\s+|the\s+)?([^,.;]+)',
                r'containing\s+(?:a\s+|an\s+|the\s+)?([^,.;]+)'
            ],
            'configured_to': [
                r'configured\s+to\s+([^,.;]+)',
                r'adapted\s+to\s+([^,.;]+)',
                r'operable\s+to\s+([^,.;]+)'
            ],
            'controls': [
                r'controls?\s+(?:the\s+)?([^,.;]+)',
                r'regulates?\s+(?:the\s+)?([^,.;]+)',
                r'manages?\s+(?:the\s+)?([^,.;]+)'
            ],
            'operates_with': [
                r'operates?\s+with\s+(?:the\s+)?([^,.;]+)',
                r'works?\s+with\s+(?:the\s+)?([^,.;]+)',
                r'cooperates?\s+with\s+(?:the\s+)?([^,.;]+)'
            ]
        }
    
    def extract_relationships(self, entities: List[Entity], sentences: List[Dict], config: Dict) -> List[Triplet]:
        """Extract relationships between entities"""
        triplets = []
        min_confidence = config.get('confidence_threshold', 0.7)
        target_relations = config.get('relationship_types', ['comprises', 'configured_to', 'controls'])
        extraction_method = config.get('extraction_method', 'both')
        
        # Create entity lookup by sentence
        sentence_entities = defaultdict(list)
        for entity in entities:
            for i, sent in enumerate(sentences):
                if sent['start'] <= entity.start < sent['end']:
                    sentence_entities[i].append(entity)
                    break
        
        # Extract relationships within sentences
        for sent_idx, sent_entities in sentence_entities.items():
            if len(sent_entities) < 2:
                continue
                
            sentence_text = sentences[sent_idx]['text']
            doc = self.nlp(sentence_text)
            
            # Apply extraction method based on configuration
            if extraction_method in ['both', 'dependency_parsing']:
                # Dependency parsing for relationships
                triplets.extend(self._extract_dependency_relations(
                    sent_entities, doc, sentence_text, config
                ))
            
            if extraction_method in ['both', 'pattern_matching']:
                # Pattern-based relationship extraction
                triplets.extend(self._extract_pattern_relations(
                    sent_entities, sentence_text, target_relations, min_confidence
                ))
        
        # API-based extraction
        if extraction_method == 'claude_api':
            api_triplets = self._extract_relationships_with_claude(entities, sentences, target_relations, min_confidence)
            triplets.extend(api_triplets)
        elif extraction_method == 'openai_api':
            api_triplets = self._extract_relationships_with_openai(entities, sentences, target_relations, min_confidence)
            triplets.extend(api_triplets)
        
        return self._filter_triplets(triplets, min_confidence)
    
    def _extract_dependency_relations(self, entities: List[Entity], doc, sentence: str, config: Dict) -> List[Triplet]:
        """Extract relationships using dependency parsing"""
        triplets = []
        
        for token in doc:
            if token.dep_ in ['nsubj', 'nsubjpass']:
                # Find subject-verb-object patterns
                verb = token.head
                objects = [child for child in verb.children if child.dep_ in ['dobj', 'pobj']]
                
                for obj in objects:
                    # Find entities that match subject and object
                    subject_entity = self._find_entity_at_position(entities, token.idx, len(token.text))
                    object_entity = self._find_entity_at_position(entities, obj.idx, len(obj.text))
                    
                    if subject_entity and object_entity:
                        relation = self._normalize_verb(verb.text)
                        triplets.append(Triplet(
                            subject=subject_entity,
                            predicate=relation,
                            object=object_entity,
                            confidence=0.75,
                            source_sentence=sentence,
                            context={'method': 'dependency_parsing', 'verb': verb.text}
                        ))
        
        return triplets
    
    def _extract_pattern_relations(self, entities: List[Entity], sentence: str, target_relations: List[str], min_confidence: float) -> List[Triplet]:
        """Extract relationships using predefined patterns"""
        triplets = []
        
        for relation in target_relations:
            if relation in self.relation_patterns:
                for pattern in self.relation_patterns[relation]:
                    matches = re.finditer(pattern, sentence, re.IGNORECASE)
                    for match in matches:
                        # Find entities near the relationship
                        subject_entities = [e for e in entities if e.end < match.start() and (match.start() - e.end) < 100]
                        object_text = match.group(1).strip()
                        object_entities = [e for e in entities if object_text.lower() in e.text.lower()]
                        
                        if subject_entities and object_entities:
                            subject = max(subject_entities, key=lambda e: e.confidence)
                            object_entity = max(object_entities, key=lambda e: e.confidence)
                            
                            confidence = min(subject.confidence * object_entity.confidence * 0.9, 0.95)
                            if confidence >= min_confidence:
                                triplets.append(Triplet(
                                    subject=subject,
                                    predicate=relation,
                                    object=object_entity,
                                    confidence=confidence,
                                    source_sentence=sentence,
                                    context={'method': 'pattern_matching', 'pattern': pattern}
                                ))
        
        return triplets
    
    def _find_entity_at_position(self, entities: List[Entity], start: int, length: int) -> Optional[Entity]:
        """Find entity at specific text position"""
        for entity in entities:
            if abs(entity.start - start) < 10:  # Allow some flexibility
                return entity
        return None
    
    def _normalize_verb(self, verb: str) -> str:
        """Normalize verb to standard relationship type"""
        verb_lower = verb.lower()
        if verb_lower in ['includes', 'contains', 'has']:
            return 'comprises'
        elif verb_lower in ['controls', 'manages', 'regulates']:
            return 'controls'
        elif verb_lower in ['connects', 'links', 'couples']:
            return 'operates_with'
        else:
            return verb_lower
    
    def _filter_triplets(self, triplets: List[Triplet], min_confidence: float) -> List[Triplet]:
        """Filter and deduplicate triplets"""
        # Remove duplicates
        seen = set()
        filtered = []
        
        for triplet in triplets:
            key = (triplet.subject.text.lower(), triplet.predicate, triplet.object.text.lower())
            if key not in seen and triplet.confidence >= min_confidence:
                seen.add(key)
                filtered.append(triplet)
        
        return filtered
    
    def _extract_relationships_with_claude(self, entities: List[Entity], sentences: List[Dict], target_relations: List[str], min_confidence: float) -> List[Triplet]:
        """Extract relationships using Claude API"""
        if not anthropic:
            return []
        
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            return []
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            triplets = []
            
            # Prepare entity context
            entity_texts = [f"{e.text} ({e.type})" for e in entities[:10]]  # Limit entities
            
            # Combine sentences for API call
            text_chunks = []
            for sent_data in sentences[:5]:  # Limit sentences for cost control
                text_chunks.append(sent_data['text'])
            
            combined_text = ' '.join(text_chunks)
            if len(combined_text) > 2500:  # Leave room for entities
                combined_text = combined_text[:2500] + "..."
            
            prompt = f"""
Extract relationships between entities in this patent text.
Entities found: {', '.join(entity_texts)}
Target relationship types: {', '.join(target_relations)}

Text: {combined_text}

Return JSON format:
[{{"subject": "entity1", "predicate": "comprises|configured_to|controls|operates_with", "object": "entity2", "confidence": 0.8}}]
"""
            
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse response
            response_text = response.content[0].text
            try:
                parsed_triplets = json.loads(response_text)
                
                for triplet_data in parsed_triplets:
                    if triplet_data.get('confidence', 0) >= min_confidence:
                        # Find matching entities
                        subject_entity = self._find_entity_by_text(entities, triplet_data.get('subject', ''))
                        object_entity = self._find_entity_by_text(entities, triplet_data.get('object', ''))
                        
                        if subject_entity and object_entity:
                            triplets.append(Triplet(
                                subject=subject_entity,
                                predicate=triplet_data.get('predicate', 'related_to'),
                                object=object_entity,
                                confidence=triplet_data.get('confidence', 0.8),
                                source_sentence=combined_text[:100],
                                context={'extraction_method': 'claude_api'}
                            ))
            except json.JSONDecodeError:
                pass  # Ignore parsing errors
                
        except Exception as e:
            print(f"Claude API error: {e}")
        
        return triplets
    
    def _extract_relationships_with_openai(self, entities: List[Entity], sentences: List[Dict], target_relations: List[str], min_confidence: float) -> List[Triplet]:
        """Extract relationships using OpenAI API"""
        if not openai:
            return []
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return []
        
        try:
            client = openai.OpenAI(api_key=api_key)
            triplets = []
            
            # Prepare entity context
            entity_texts = [f"{e.text} ({e.type})" for e in entities[:10]]  # Limit entities
            
            # Combine sentences for API call
            text_chunks = []
            for sent_data in sentences[:5]:  # Limit sentences for cost control
                text_chunks.append(sent_data['text'])
            
            combined_text = ' '.join(text_chunks)
            if len(combined_text) > 2500:  # Leave room for entities
                combined_text = combined_text[:2500] + "..."
            
            prompt = f"""
Extract relationships between entities in this patent text.
Entities found: {', '.join(entity_texts)}
Target relationship types: {', '.join(target_relations)}

Text: {combined_text}

Return JSON format:
[{{"subject": "entity1", "predicate": "comprises|configured_to|controls|operates_with", "object": "entity2", "confidence": 0.8}}]
"""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.3
            )
            
            # Parse response
            response_text = response.choices[0].message.content
            try:
                parsed_triplets = json.loads(response_text)
                
                for triplet_data in parsed_triplets:
                    if triplet_data.get('confidence', 0) >= min_confidence:
                        # Find matching entities
                        subject_entity = self._find_entity_by_text(entities, triplet_data.get('subject', ''))
                        object_entity = self._find_entity_by_text(entities, triplet_data.get('object', ''))
                        
                        if subject_entity and object_entity:
                            triplets.append(Triplet(
                                subject=subject_entity,
                                predicate=triplet_data.get('predicate', 'related_to'),
                                object=object_entity,
                                confidence=triplet_data.get('confidence', 0.8),
                                source_sentence=combined_text[:100],
                                context={'extraction_method': 'openai_api'}
                            ))
            except json.JSONDecodeError:
                pass  # Ignore parsing errors
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
        
        return triplets
    
    def _find_entity_by_text(self, entities: List[Entity], text: str) -> Optional[Entity]:
        """Find entity by text match"""
        text_lower = text.lower().strip()
        for entity in entities:
            if entity.text.lower().strip() == text_lower:
                return entity
            # Also try partial matches
            if text_lower in entity.text.lower() or entity.text.lower() in text_lower:
                return entity
        return None


class NormalizationAgent:
    """Agent 4: Normalize and cluster similar entities"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    
    def normalize_entities(self, entities: List[Entity], config: Dict) -> List[Entity]:
        """Normalize entity forms and group similar entities"""
        similarity_threshold = config.get('similarity_threshold', 0.85)
        
        # Group entities by type
        entities_by_type = defaultdict(list)
        for entity in entities:
            entities_by_type[entity.type].append(entity)
        
        normalized_entities = []
        for entity_type, type_entities in entities_by_type.items():
            normalized_entities.extend(
                self._normalize_entity_group(type_entities, similarity_threshold)
            )
        
        return normalized_entities
    
    def _normalize_entity_group(self, entities: List[Entity], threshold: float) -> List[Entity]:
        """Normalize entities of the same type"""
        if len(entities) < 2:
            return entities
        
        # Calculate similarity matrix
        texts = [e.text for e in entities]
        try:
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            similarity_matrix = cosine_similarity(tfidf_matrix)
        except:
            # Fallback to string similarity
            return self._normalize_with_string_similarity(entities, threshold)
        
        # Group similar entities
        clusters = []
        visited = set()
        
        for i, entity in enumerate(entities):
            if i in visited:
                continue
                
            cluster = [entity]
            visited.add(i)
            
            for j in range(i + 1, len(entities)):
                if j not in visited and similarity_matrix[i][j] >= threshold:
                    cluster.append(entities[j])
                    visited.add(j)
            
            clusters.append(cluster)
        
        # Select representative entity for each cluster
        normalized = []
        for cluster in clusters:
            # Use the entity with highest confidence as representative
            representative = max(cluster, key=lambda e: e.confidence)
            
            # Create normalized form
            if len(cluster) > 1:
                # Use most common form or shortest technical term
                forms = [e.text for e in cluster]
                representative.normalized_form = min(forms, key=len)
                representative.attributes = representative.attributes or {}
                representative.attributes['variants'] = forms
                representative.attributes['cluster_size'] = len(cluster)
            
            normalized.append(representative)
        
        return normalized
    
    def _normalize_with_string_similarity(self, entities: List[Entity], threshold: float) -> List[Entity]:
        """Fallback normalization using string similarity"""
        from difflib import SequenceMatcher
        
        normalized = []
        seen = set()
        
        for i, entity in enumerate(entities):
            if i in seen:
                continue
                
            similar = [entity]
            seen.add(i)
            
            for j, other in enumerate(entities[i+1:], i+1):
                if j not in seen:
                    similarity = SequenceMatcher(None, entity.text.lower(), other.text.lower()).ratio()
                    if similarity >= threshold:
                        similar.append(other)
                        seen.add(j)
            
            if len(similar) > 1:
                representative = max(similar, key=lambda e: e.confidence)
                representative.normalized_form = representative.text
                representative.attributes = representative.attributes or {}
                representative.attributes['variants'] = [e.text for e in similar]
                normalized.append(representative)
            else:
                normalized.append(entity)
        
        return normalized


class GraphBuilderAgent:
    """Agent 5: Build knowledge graph from entities and relationships"""
    
    def build_graph(self, entities: List[Entity], triplets: List[Triplet], config: Dict) -> Dict:
        """Build knowledge graph structure"""
        
        # Create nodes (entities)
        nodes = {}
        for entity in entities:
            node_id = self._generate_node_id(entity)
            nodes[node_id] = {
                'id': node_id,
                'text': entity.normalized_form or entity.text,
                'type': entity.type,
                'confidence': entity.confidence,
                'degree': 0,
                'importance': 0.0,
                'attributes': entity.attributes or {}
            }
        
        # Create edges (relationships)
        edges = []
        edge_weights = defaultdict(float)
        
        for triplet in triplets:
            subject_id = self._generate_node_id(triplet.subject)
            object_id = self._generate_node_id(triplet.object)
            
            if subject_id in nodes and object_id in nodes:
                edge_key = (subject_id, object_id, triplet.predicate)
                edge_weights[edge_key] += triplet.confidence
                
                edges.append({
                    'id': f"{subject_id}-{triplet.predicate}-{object_id}",
                    'source': subject_id,
                    'target': object_id,
                    'relation': triplet.predicate,
                    'weight': triplet.confidence,
                    'context': triplet.source_sentence[:100]
                })
                
                # Update node degrees
                nodes[subject_id]['degree'] += 1
                nodes[object_id]['degree'] += 1
        
        # Calculate node importance (PageRank-like)
        self._calculate_node_importance(nodes, edges, config)
        
        return {
            'nodes': list(nodes.values()),
            'edges': edges,
            'statistics': {
                'total_nodes': len(nodes),
                'total_edges': len(edges),
                'avg_degree': np.mean([n['degree'] for n in nodes.values()]) if nodes else 0,
                'density': len(edges) / (len(nodes) * (len(nodes) - 1)) if len(nodes) > 1 else 0
            }
        }
    
    def _generate_node_id(self, entity: Entity) -> str:
        """Generate consistent node ID for entity"""
        return f"{entity.type}_{hash(entity.normalized_form or entity.text) % 100000}"
    
    def _calculate_node_importance(self, nodes: Dict, edges: List[Dict], config: Dict):
        """Calculate node importance scores"""
        algorithm = config.get('node_importance_algorithm', 'pagerank')
        
        if algorithm == 'pagerank':
            # Simple PageRank approximation
            for node in nodes.values():
                # Base importance from degree centrality
                node['importance'] = node['degree'] / max(1, len(nodes) - 1)
                
                # Boost for high-confidence entities
                node['importance'] *= (1 + node['confidence'])
                
                # Boost for certain entity types
                if node['type'] in ['system', 'component']:
                    node['importance'] *= 1.2
        else:
            # Degree centrality
            max_degree = max([n['degree'] for n in nodes.values()]) if nodes else 1
            for node in nodes.values():
                node['importance'] = node['degree'] / max_degree


class ClusteringAgent:
    """Agent 6: Cluster patents by similarity"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500, stop_words='english', ngram_range=(1, 2))
    
    def cluster_patents(self, patent_data: List[Dict], config: Dict) -> Dict:
        """Cluster patents based on extracted features"""
        algorithm = config.get('algorithm', 'hierarchical')
        dimensions = config.get('dimensions', ['structural', 'functional'])
        
        # Create feature vectors
        features = []
        for patent in patent_data:
            feature_vector = self._create_feature_vector(patent, dimensions)
            features.append(feature_vector)
        
        if not features:
            return {'clusters': [], 'labels': [], 'statistics': {}}
        
        # Convert to matrix
        try:
            feature_texts = [' '.join(f) for f in features]
            X = self.vectorizer.fit_transform(feature_texts)
        except:
            return {'clusters': [], 'labels': [], 'statistics': {}}
        
        # Apply clustering algorithm
        if algorithm == 'kmeans':
            n_clusters = min(config.get('num_clusters', 5), len(patent_data) // 2)
            clusterer = KMeans(n_clusters=n_clusters, random_state=42)
        else:  # DBSCAN for hierarchical-like clustering
            clusterer = DBSCAN(eps=0.3, min_samples=2)
        
        labels = clusterer.fit_predict(X)
        
        # Group patents by cluster
        clusters = defaultdict(list)
        for i, label in enumerate(labels):
            if label != -1:  # -1 is noise in DBSCAN
                clusters[label].append({
                    'patent_id': patent_data[i]['patent_id'],
                    'patent_data': patent_data[i],
                    'features': features[i]
                })
        
        # Calculate cluster statistics
        statistics = {
            'num_clusters': len(clusters),
            'largest_cluster': max([len(c) for c in clusters.values()]) if clusters else 0,
            'noise_points': sum(1 for l in labels if l == -1),
            'avg_cluster_size': np.mean([len(c) for c in clusters.values()]) if clusters else 0
        }
        
        return {
            'clusters': dict(clusters),
            'labels': labels.tolist(),
            'statistics': statistics
        }
    
    def _create_feature_vector(self, patent: Dict, dimensions: List[str]) -> List[str]:
        """Create feature vector from patent data"""
        features = []
        
        if 'structural' in dimensions:
            # Add structural features (entity types, relationship patterns)
            entities = patent.get('entities', [])
            entity_types = [e.get('type', '') for e in entities]
            features.extend(entity_types)
        
        if 'functional' in dimensions:
            # Add functional features (verbs, processes)
            triplets = patent.get('triplets', [])
            predicates = [t.get('predicate', '') for t in triplets]
            features.extend(predicates)
        
        if 'application' in dimensions:
            # Add application domain features
            text = patent.get('text', '')
            app_keywords = ['method', 'system', 'device', 'process', 'apparatus']
            for keyword in app_keywords:
                if keyword in text.lower():
                    features.append(f"app_{keyword}")
        
        return features


class AgenticPipelineOrchestrator:
    """Main orchestrator for the agentic processing pipeline"""
    
    def __init__(self):
        self.preprocessor = PatentPreprocessor()
        self.entity_agent = EntityExtractionAgent()
        self.relation_agent = RelationshipExtractionAgent()
        self.normalization_agent = NormalizationAgent()
        self.graph_agent = GraphBuilderAgent()
        self.clustering_agent = ClusteringAgent()
    
    def process_patents(self, patents: List[Dict], config: Dict, progress_callback=None) -> Dict:
        """Process patents through the complete pipeline"""
        
        results = {
            'processed_patents': [],
            'all_entities': [],
            'all_triplets': [],
            'knowledge_graph': {},
            'clusters': {},
            'statistics': {}
        }
        
        total_patents = len(patents)
        
        for i, patent in enumerate(patents):
            try:
                # Stage 1: Preprocessing
                if progress_callback:
                    progress_callback(f"Preprocessing patent {i+1}/{total_patents}", (i / total_patents) * 100)
                
                processed_text = self.preprocessor.preprocess(
                    patent.get('abstract', '') + ' ' + patent.get('claims', ''),
                    patent.get('field_type', 'mixed')
                )
                
                # Stage 2: Entity Extraction
                entities = self.entity_agent.extract_entities(
                    processed_text['sentences'], 
                    config.get('entity_extraction', {})
                )
                
                # Stage 3: Relationship Extraction
                triplets = self.relation_agent.extract_relationships(
                    entities, 
                    processed_text['sentences'],
                    config.get('relationship_extraction', {})
                )
                
                # Stage 4: Normalization
                normalized_entities = self.normalization_agent.normalize_entities(
                    entities, 
                    config.get('normalization', {})
                )
                
                # Store patent results
                patent_result = {
                    'patent_id': patent.get('patent_id', f'patent_{i}'),
                    'text': patent.get('abstract', '') + ' ' + patent.get('claims', ''),
                    'entities': [self._entity_to_dict(e) for e in normalized_entities],
                    'triplets': [self._triplet_to_dict(t) for t in triplets],
                    'processing_status': 'completed',
                    'sentences': processed_text['sentences']
                }
                
                results['processed_patents'].append(patent_result)
                results['all_entities'].extend(normalized_entities)
                results['all_triplets'].extend(triplets)
                
            except Exception as e:
                # Handle processing errors gracefully
                results['processed_patents'].append({
                    'patent_id': patent.get('patent_id', f'patent_{i}'),
                    'processing_status': 'failed',
                    'error': str(e)
                })
        
        # Stage 5: Graph Building
        if progress_callback:
            progress_callback("Building knowledge graph...", 90)
        
        results['knowledge_graph'] = self.graph_agent.build_graph(
            results['all_entities'], 
            results['all_triplets'],
            config.get('graph_builder', {})
        )
        
        # Stage 6: Clustering
        if progress_callback:
            progress_callback("Clustering patents...", 95)
        
        results['clusters'] = self.clustering_agent.cluster_patents(
            results['processed_patents'],
            config.get('clustering', {})
        )
        
        # Generate final statistics
        results['statistics'] = self._generate_statistics(results)
        
        if progress_callback:
            progress_callback("Processing complete!", 100)
        
        return results
    
    def _entity_to_dict(self, entity: Entity) -> Dict:
        """Convert Entity to dictionary"""
        return {
            'text': entity.text,
            'type': entity.type,
            'start': entity.start,
            'end': entity.end,
            'confidence': entity.confidence,
            'normalized_form': entity.normalized_form,
            'attributes': entity.attributes or {}
        }
    
    def _triplet_to_dict(self, triplet: Triplet) -> Dict:
        """Convert Triplet to dictionary"""
        return {
            'subject': self._entity_to_dict(triplet.subject),
            'predicate': triplet.predicate,
            'object': self._entity_to_dict(triplet.object),
            'confidence': triplet.confidence,
            'source_sentence': triplet.source_sentence,
            'context': triplet.context or {}
        }
    
    def _generate_statistics(self, results: Dict) -> Dict:
        """Generate comprehensive processing statistics"""
        successful_patents = [p for p in results['processed_patents'] if p.get('processing_status') == 'completed']
        
        return {
            'total_patents_processed': len(results['processed_patents']),
            'successful_patents': len(successful_patents),
            'failed_patents': len(results['processed_patents']) - len(successful_patents),
            'total_entities_extracted': len(results['all_entities']),
            'unique_entities': len(set(e.normalized_form or e.text for e in results['all_entities'])),
            'total_triplets_extracted': len(results['all_triplets']),
            'unique_relationships': len(set(t.predicate for t in results['all_triplets'])),
            'entity_types_distribution': Counter(e.type for e in results['all_entities']),
            'relationship_distribution': Counter(t.predicate for t in results['all_triplets']),
            'avg_entities_per_patent': len(results['all_entities']) / max(1, len(successful_patents)),
            'avg_triplets_per_patent': len(results['all_triplets']) / max(1, len(successful_patents)),
            'processing_success_rate': len(successful_patents) / max(1, len(results['processed_patents']))
        }


# Factory function to create orchestrator
def create_agentic_pipeline() -> AgenticPipelineOrchestrator:
    """Create and return a configured pipeline orchestrator"""
    return AgenticPipelineOrchestrator()