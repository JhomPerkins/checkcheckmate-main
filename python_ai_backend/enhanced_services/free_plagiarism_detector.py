"""
Free Plagiarism Detection System
Uses open-source models for zero-cost plagiarism detection
"""

import json
import logging
from typing import Dict, List, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from difflib import SequenceMatcher
import re

logger = logging.getLogger(__name__)

class FreePlagiarismDetector:
    """Free plagiarism detection using open-source models"""
    
    def __init__(self, llm_system):
        self.llm_system = llm_system
        self.similarity_threshold = 0.7
        
    async def detect_plagiarism(self, content: str, assignment_id: str, student_id: str) -> Dict:
        """Detect plagiarism using free models"""
        try:
            content_hash = self.llm_system.get_content_hash(content)
            
            # Check cache first
            cached_result = self.llm_system.get_cached_result("plagiarism_cache", content_hash)
            if cached_result:
                logger.info("📋 Using cached plagiarism result")
                return cached_result
            
            logger.info(f"🔍 Detecting plagiarism for assignment {assignment_id}")
            
            # Get embedding for the content
            embedding = await self.get_content_embedding(content, content_hash)
            
            # Find similar submissions in database
            similar_submissions = await self.find_similar_submissions(embedding, assignment_id, student_id)
            
            # Calculate similarity scores
            similarity_scores = []
            matches = []
            
            for submission in similar_submissions:
                similarity = await self.calculate_similarity(embedding, submission['embedding'])
                
                if similarity > self.similarity_threshold:
                    similarity_scores.append(similarity)
                    matches.append({
                        'submission_id': submission['id'],
                        'student_id': submission['student_id'],
                        'similarity': similarity,
                        'content_preview': submission['content'][:200] + "..."
                    })
            
            result = {
                'similarity_scores': similarity_scores,
                'matches': matches,
                'highest_similarity': max(similarity_scores) if similarity_scores else 0,
                'is_flagged': len(matches) > 0,
                'detection_method': 'free_llm_embedding'
            }
            
            # Cache the result
            self.llm_system.cache_result("plagiarism_cache", content_hash, result)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error in plagiarism detection: {e}")
            return {
                'similarity_scores': [],
                'matches': [],
                'highest_similarity': 0,
                'is_flagged': False,
                'error': str(e)
            }
    
    async def get_content_embedding(self, content: str, content_hash: str) -> List[float]:
        """Get embedding for content using free model"""
        try:
            # Check cache first
            cached_result = self.llm_system.get_cached_result("embeddings_cache", content_hash)
            if cached_result:
                return cached_result["embedding"]
            
            # Generate embedding using free model
            embedding = self.llm_system.embedding_model.encode(content)
            
            # Cache the embedding
            self.llm_system.cache_result("embeddings_cache", content_hash, {"embedding": embedding.tolist()})
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"❌ Error generating embedding: {e}")
            # Fallback to TF-IDF
            return self.get_tfidf_embedding(content)
    
    def get_tfidf_embedding(self, content: str) -> List[float]:
        """Fallback TF-IDF embedding"""
        try:
            if not hasattr(self.llm_system, 'tfidf_vectorizer'):
                self.llm_system.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
            
            # Fit and transform
            tfidf_matrix = self.llm_system.tfidf_vectorizer.fit_transform([content])
            return tfidf_matrix.toarray()[0].tolist()
            
        except Exception as e:
            logger.error(f"❌ Error with TF-IDF embedding: {e}")
            return [0.0] * 100  # Return zero vector as fallback
    
    async def find_similar_submissions(self, embedding: List[float], assignment_id: str, current_student_id: str) -> List[Dict]:
        """Find similar submissions in database"""
        try:
            # This would query your existing database for similar submissions
            # For now, return empty list - you'll need to implement database query
            # based on your existing schema
            
            # TODO: Implement database query to find submissions with similar embeddings
            # This is where you'd query your Neon database for existing submissions
            
            return []
            
        except Exception as e:
            logger.error(f"❌ Error finding similar submissions: {e}")
            return []
    
    async def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between embeddings"""
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            similarity = cosine_similarity([vec1], [vec2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"❌ Error calculating similarity: {e}")
            return 0.0
    
    def detect_paraphrasing(self, text1: str, text2: str, threshold: float = 0.6) -> bool:
        """Detect potential paraphrasing using sequence matching"""
        try:
            # Clean and normalize texts
            clean_text1 = self.clean_text(text1)
            clean_text2 = self.clean_text(text2)
            
            # Calculate sequence similarity
            similarity = SequenceMatcher(None, clean_text1, clean_text2).ratio()
            
            return similarity > threshold
            
        except Exception as e:
            logger.error(f"❌ Error detecting paraphrasing: {e}")
            return False
    
    def clean_text(self, text: str) -> str:
        """Clean text for comparison"""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.lower().strip())
        # Remove punctuation for better comparison
        text = re.sub(r'[^\w\s]', '', text)
        return text
    
    def detect_ai_generated_content(self, content: str) -> Dict:
        """Detect AI-generated content using heuristics"""
        try:
            # Heuristics for AI-generated content
            ai_indicators = {
                'repetitive_phrases': self.count_repetitive_phrases(content),
                'overly_formal': self.detect_overly_formal_tone(content),
                'lack_of_personal_voice': self.detect_lack_of_personal_voice(content),
                'perfect_grammar': self.check_perfect_grammar(content),
                'generic_transitions': self.count_generic_transitions(content)
            }
            
            # Calculate AI probability score
            ai_score = sum(ai_indicators.values()) / len(ai_indicators)
            
            return {
                'is_ai_generated': ai_score > 0.6,
                'ai_confidence': ai_score,
                'indicators': ai_indicators
            }
            
        except Exception as e:
            logger.error(f"❌ Error detecting AI content: {e}")
            return {'is_ai_generated': False, 'ai_confidence': 0.0, 'indicators': {}}
    
    def count_repetitive_phrases(self, content: str) -> float:
        """Count repetitive phrases (AI tends to repeat)"""
        words = content.lower().split()
        word_counts = {}
        
        for word in words:
            if len(word) > 3:  # Only count longer words
                word_counts[word] = word_counts.get(word, 0) + 1
        
        # Calculate repetition score
        total_words = len(words)
        unique_words = len(word_counts)
        repetition_ratio = (total_words - unique_words) / total_words if total_words > 0 else 0
        
        return min(repetition_ratio, 1.0)
    
    def detect_overly_formal_tone(self, content: str) -> float:
        """Detect overly formal tone (common in AI)"""
        formal_phrases = [
            'furthermore', 'moreover', 'additionally', 'consequently',
            'therefore', 'thus', 'hence', 'in conclusion', 'in summary'
        ]
        
        formal_count = sum(1 for phrase in formal_phrases if phrase in content.lower())
        word_count = len(content.split())
        
        return min(formal_count / max(word_count / 100, 1), 1.0)
    
    def detect_lack_of_personal_voice(self, content: str) -> float:
        """Detect lack of personal voice"""
        personal_indicators = ['i think', 'i believe', 'in my opinion', 'personally', 'i feel']
        personal_count = sum(1 for phrase in personal_indicators if phrase in content.lower())
        
        # Low personal voice indicates AI
        return 1.0 - min(personal_count / max(len(content.split()) / 100, 1), 1.0)
    
    def check_perfect_grammar(self, content: str) -> float:
        """Check for perfect grammar (AI tends to be grammatically perfect)"""
        # Simple grammar check - count common grammar errors
        grammar_errors = 0
        
        # Check for common errors
        if re.search(r'\bi\b', content):  # lowercase 'i'
            grammar_errors += 1
        if re.search(r'\s+[.!?]\s*[a-z]', content):  # missing capitalization
            grammar_errors += 1
        
        # Perfect grammar suggests AI
        return 1.0 - min(grammar_errors / max(len(content.split()) / 50, 1), 1.0)
    
    def count_generic_transitions(self, content: str) -> float:
        """Count generic transition words (AI overuses these)"""
        generic_transitions = [
            'first', 'second', 'third', 'finally', 'in conclusion',
            'to begin with', 'moving on', 'in addition', 'furthermore'
        ]
        
        transition_count = sum(1 for transition in generic_transitions if transition in content.lower())
        sentence_count = len(re.split(r'[.!?]+', content))
        
        return min(transition_count / max(sentence_count / 10, 1), 1.0)
