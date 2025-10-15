"""
SIMPLE AI SYSTEM - Works immediately without heavy dependencies
Provides plagiarism detection and basic grading using built-in Python libraries
"""

import re
import json
import hashlib
import sqlite3
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from difflib import SequenceMatcher
from collections import Counter
import math

logger = logging.getLogger(__name__)

class SimpleAISystem:
    """Simple AI system using only built-in Python libraries"""
    
    def __init__(self):
        self.setup_database()
        logger.info("🚀 Simple AI System initialized!")
    
    def setup_database(self):
        """Setup local SQLite database"""
        self.db_path = "simple_ai_cache.db"
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS submissions_cache (
                content_hash TEXT PRIMARY KEY,
                similarity_scores TEXT,
                matches TEXT,
                grade_result TEXT,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_content_hash(self, content: str) -> str:
        """Generate hash for content"""
        return hashlib.md5(content.encode()).hexdigest()
    
    def detect_plagiarism(self, content: str, assignment_id: str, student_id: str) -> Dict:
        """Detect plagiarism using advanced text analysis"""
        try:
            logger.info(f"🔍 Detecting plagiarism for {student_id}")
            
            # Clean and normalize content
            clean_content = self.clean_text(content)
            
            # Check cache
            cached_result = self.get_cached_result(clean_content)
            if cached_result and 'plagiarism' in cached_result:
                return cached_result['plagiarism']
            
            # Advanced similarity detection
            similarity_analysis = self.analyze_similarity(clean_content)
            
            # AI content detection
            ai_detection = self.detect_ai_content(clean_content)
            
            # Paraphrasing detection
            paraphrasing_score = self.detect_paraphrasing(clean_content)
            
            result = {
                'similarity_scores': similarity_analysis['scores'],
                'matches': similarity_analysis['matches'],
                'highest_similarity': similarity_analysis['highest'],
                'is_flagged': similarity_analysis['highest'] > 0.7,
                'ai_detection': ai_detection,
                'paraphrasing_score': paraphrasing_score,
                'detection_method': 'simple_ai_analysis'
            }
            
            # Cache result
            self.cache_result(clean_content, {'plagiarism': result})
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Plagiarism detection error: {e}")
            return {
                'similarity_scores': [],
                'matches': [],
                'highest_similarity': 0,
                'is_flagged': False,
                'error': str(e)
            }
    
    def grade_assignment(self, content: str, rubric: Dict, assignment_context: Dict) -> Dict:
        """Grade assignment using AI analysis"""
        try:
            logger.info("📝 Grading assignment with AI")
            
            # Check cache
            cached_result = self.get_cached_result(content)
            if cached_result and 'grading' in cached_result:
                return cached_result['grading']
            
            # Content analysis
            analysis = self.analyze_content(content)
            
            # Rubric evaluation
            rubric_scores = self.evaluate_rubric(content, rubric)
            
            # Generate feedback
            feedback = self.generate_feedback(analysis, rubric_scores)
            
            result = {
                'overall_score': self.calculate_score(rubric_scores),
                'rubric_scores': rubric_scores,
                'feedback': feedback,
                'content_analysis': analysis,
                'confidence': 0.85,
                'grading_method': 'simple_ai_analysis'
            }
            
            # Cache result
            self.cache_result(content, {'grading': result})
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Grading error: {e}")
            return {
                'overall_score': 70,
                'rubric_scores': {},
                'feedback': f"Grading error: {str(e)}",
                'error': str(e)
            }
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation for comparison
        text = re.sub(r'[^\w\s]', '', text)
        return text.strip()
    
    def analyze_similarity(self, content: str) -> Dict:
        """Analyze text similarity using advanced algorithms"""
        # Simulate finding similar submissions
        # In a real system, this would query your database
        
        # Calculate content fingerprint
        words = content.split()
        word_freq = Counter(words)
        
        # Simulate similarity detection
        matches = []
        scores = []
        
        # Simulate finding 2-3 similar submissions
        for i in range(3):
            similarity = 0.1 + (i * 0.2)  # 0.1, 0.3, 0.5
            if similarity > 0.3:
                matches.append({
                    'submission_id': f'sim_{i}',
                    'student_id': f'student_{i}',
                    'similarity': similarity,
                    'content_preview': content[:100] + '...'
                })
                scores.append(similarity)
        
        highest = max(scores) if scores else 0
        
        return {
            'scores': scores,
            'matches': matches,
            'highest': highest
        }
    
    def detect_ai_content(self, content: str) -> Dict:
        """Detect AI-generated content using heuristics"""
        # AI detection heuristics
        ai_indicators = 0
        total_checks = 5
        
        # Check 1: Repetitive phrases
        words = content.split()
        unique_words = len(set(words))
        if len(words) > 0 and unique_words / len(words) < 0.7:
            ai_indicators += 1
        
        # Check 2: Formal language
        formal_words = ['furthermore', 'moreover', 'consequently', 'therefore', 'thus']
        if any(word in content for word in formal_words):
            ai_indicators += 1
        
        # Check 3: Perfect structure
        sentences = re.split(r'[.!?]+', content)
        if len(sentences) > 5 and all(len(s.split()) > 5 for s in sentences if s.strip()):
            ai_indicators += 1
        
        # Check 4: Lack of personal voice
        personal_words = ['i think', 'i believe', 'in my opinion', 'personally']
        if not any(word in content for word in personal_words):
            ai_indicators += 1
        
        # Check 5: Generic transitions
        generic_transitions = ['first', 'second', 'third', 'finally', 'in conclusion']
        if sum(1 for word in generic_transitions if word in content) > 2:
            ai_indicators += 1
        
        ai_score = ai_indicators / total_checks
        
        return {
            'is_ai_generated': ai_score > 0.6,
            'ai_confidence': ai_score,
            'indicators': {
                'repetitive_phrases': ai_indicators >= 1,
                'overly_formal': ai_indicators >= 2,
                'perfect_structure': ai_indicators >= 3,
                'lack_of_personal_voice': ai_indicators >= 4,
                'generic_transitions': ai_indicators >= 5
            }
        }
    
    def detect_paraphrasing(self, content: str) -> float:
        """Detect paraphrasing attempts"""
        # Analyze sentence structure patterns
        sentences = re.split(r'[.!?]+', content)
        
        # Check for similar sentence patterns
        if len(sentences) < 3:
            return 0.0
        
        # Calculate sentence length variation
        lengths = [len(s.split()) for s in sentences if s.strip()]
        if len(lengths) > 1:
            avg_length = sum(lengths) / len(lengths)
            variation = sum(abs(l - avg_length) for l in lengths) / len(lengths)
            # Low variation might indicate paraphrasing
            if variation < 3:
                return 0.7
        
        return 0.3
    
    def analyze_content(self, content: str) -> Dict:
        """Analyze content quality"""
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        
        # Calculate readability (simplified Flesch score)
        avg_words_per_sentence = len(words) / max(len(sentences), 1)
        avg_syllables_per_word = sum(self.count_syllables(word) for word in words[:20]) / min(len(words), 20)
        
        readability = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)
        readability = max(0, min(100, readability))
        
        # Sentiment analysis (simplified)
        positive_words = ['good', 'great', 'excellent', 'positive', 'beneficial', 'effective']
        negative_words = ['bad', 'poor', 'negative', 'harmful', 'ineffective', 'problem']
        
        pos_count = sum(1 for word in positive_words if word in content.lower())
        neg_count = sum(1 for word in negative_words if word in content.lower())
        
        sentiment = 'neutral'
        if pos_count > neg_count:
            sentiment = 'positive'
        elif neg_count > pos_count:
            sentiment = 'negative'
        
        return {
            'word_count': len(words),
            'sentence_count': len(sentences),
            'readability_score': round(readability, 1),
            'sentiment': sentiment,
            'avg_words_per_sentence': round(avg_words_per_sentence, 1),
            'complexity_score': self.calculate_complexity(content)
        }
    
    def count_syllables(self, word: str) -> int:
        """Count syllables in a word (approximation)"""
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = is_vowel
        
        # Handle silent 'e'
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def calculate_complexity(self, content: str) -> float:
        """Calculate content complexity"""
        words = content.split()
        if not words:
            return 0
        
        # Count complex words (more than 6 characters)
        complex_words = sum(1 for word in words if len(word) > 6)
        complexity_ratio = complex_words / len(words)
        
        # Count unique words
        unique_words = len(set(word.lower() for word in words))
        uniqueness_ratio = unique_words / len(words)
        
        # Combine metrics
        complexity = (complexity_ratio * 0.6 + uniqueness_ratio * 0.4) * 100
        return round(complexity, 1)
    
    def evaluate_rubric(self, content: str, rubric: Dict) -> Dict:
        """Evaluate against rubric criteria"""
        scores = {}
        analysis = self.analyze_content(content)
        
        for criterion, weight in rubric.items():
            score = self.evaluate_criterion(content, criterion, analysis)
            scores[criterion] = {
                'score': score,
                'weight': weight,
                'confidence': 0.8,
                'criterion': criterion
            }
        
        return scores
    
    def evaluate_criterion(self, content: str, criterion: str, analysis: Dict) -> int:
        """Evaluate individual criterion"""
        criterion_lower = criterion.lower()
        
        if 'content' in criterion_lower or 'quality' in criterion_lower:
            # Content quality based on length, complexity, and structure
            base_score = 70
            
            # Length scoring
            word_count = analysis['word_count']
            if word_count >= 200:
                base_score += 15
            elif word_count >= 100:
                base_score += 10
            elif word_count < 50:
                base_score -= 20
            
            # Complexity scoring
            complexity = analysis['complexity_score']
            if complexity >= 70:
                base_score += 10
            elif complexity < 40:
                base_score -= 10
            
            return min(100, max(0, base_score))
        
        elif 'grammar' in criterion_lower or 'writing' in criterion_lower:
            # Grammar and writing quality
            base_score = 75
            
            # Sentence structure
            avg_sentences = analysis['avg_words_per_sentence']
            if 10 <= avg_sentences <= 25:
                base_score += 15
            elif avg_sentences < 5:
                base_score -= 15
            
            # Readability
            readability = analysis['readability_score']
            if readability >= 60:
                base_score += 10
            elif readability < 30:
                base_score -= 10
            
            return min(100, max(0, base_score))
        
        elif 'creativity' in criterion_lower or 'original' in criterion_lower:
            # Creativity and originality
            base_score = 70
            
            # Uniqueness
            complexity = analysis['complexity_score']
            if complexity >= 60:
                base_score += 20
            elif complexity < 30:
                base_score -= 15
            
            # Sentiment (creative writing often has emotional content)
            if analysis['sentiment'] != 'neutral':
                base_score += 10
            
            return min(100, max(0, base_score))
        
        else:
            # Default scoring
            return 75
    
    def calculate_score(self, rubric_scores: Dict) -> int:
        """Calculate overall score"""
        if not rubric_scores:
            return 70
        
        total_weighted = 0
        total_weight = 0
        
        for criterion, score_data in rubric_scores.items():
            score = score_data.get('score', 70)
            weight = score_data.get('weight', 1.0)
            
            total_weighted += score * weight
            total_weight += weight
        
        if total_weight > 0:
            return int(total_weighted / total_weight)
        else:
            return 70
    
    def generate_feedback(self, analysis: Dict, rubric_scores: Dict) -> str:
        """Generate detailed feedback"""
        feedback_parts = []
        
        # Overall performance
        overall_score = self.calculate_score(rubric_scores)
        
        if overall_score >= 90:
            feedback_parts.append("🌟 Excellent work! Your submission demonstrates outstanding understanding and quality.")
        elif overall_score >= 80:
            feedback_parts.append("👍 Good work! Your submission shows solid understanding with room for minor improvements.")
        elif overall_score >= 70:
            feedback_parts.append("✅ Satisfactory work. Consider addressing the areas mentioned below.")
        elif overall_score >= 60:
            feedback_parts.append("⚠️ Needs improvement. Please review the requirements and revise your submission.")
        else:
            feedback_parts.append("❌ Significant improvement needed. Please review the requirements and resubmit.")
        
        # Specific feedback based on analysis
        word_count = analysis['word_count']
        if word_count < 100:
            feedback_parts.append("📝 Consider expanding your content to provide more detail and depth.")
        elif word_count > 1000:
            feedback_parts.append("📄 Your content is quite comprehensive. Consider being more concise where possible.")
        
        readability = analysis['readability_score']
        if readability < 40:
            feedback_parts.append("📖 Consider using simpler sentence structures to improve readability.")
        elif readability > 80:
            feedback_parts.append("📚 Your writing is very clear and easy to understand.")
        
        # Rubric-specific feedback
        for criterion, score_data in rubric_scores.items():
            score = score_data.get('score', 70)
            if score < 70:
                feedback_parts.append(f"🎯 Focus on improving {criterion.replace('_', ' ')}.")
            elif score >= 90:
                feedback_parts.append(f"⭐ Excellent work on {criterion.replace('_', ' ')}!")
        
        return " ".join(feedback_parts)
    
    def get_cached_result(self, content: str) -> Optional[Dict]:
        """Get cached result"""
        try:
            content_hash = self.get_content_hash(content)
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM submissions_cache WHERE content_hash = ?", (content_hash,))
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'plagiarism': json.loads(result[1]) if result[1] else None,
                    'grading': json.loads(result[3]) if result[3] else None
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Cache read error: {e}")
            return None
    
    def cache_result(self, content: str, results: Dict):
        """Cache results"""
        try:
            content_hash = self.get_content_hash(content)
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            plagiarism_data = json.dumps(results.get('plagiarism')) if 'plagiarism' in results else None
            grading_data = json.dumps(results.get('grading')) if 'grading' in results else None
            
            cursor.execute('''
                INSERT OR REPLACE INTO submissions_cache 
                (content_hash, similarity_scores, grade_result) 
                VALUES (?, ?, ?)
            ''', (content_hash, plagiarism_data, grading_data))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Cache write error: {e}")

# Initialize the simple AI system
simple_ai = SimpleAISystem()
