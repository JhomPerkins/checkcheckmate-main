import re
from typing import Dict, List
from difflib import SequenceMatcher
from collections import Counter
from ..database import db
import logging

logger = logging.getLogger(__name__)

def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate similarity between two texts using sequence matching"""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

def get_ngrams(text: str, n: int = 3) -> List[str]:
    """Extract n-grams from text for deep comparison"""
    words = re.findall(r'\w+', text.lower())
    return [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]

def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculate Jaccard similarity coefficient"""
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    
    if not words1 or not words2:
        return 0.0
    
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0.0

def detect_paraphrasing(text1: str, text2: str, threshold: float = 0.6) -> bool:
    """Detect potential paraphrasing using multiple metrics"""
    ngrams1 = set(get_ngrams(text1, 3))
    ngrams2 = set(get_ngrams(text2, 3))
    
    if not ngrams1 or not ngrams2:
        return False
    
    ngram_overlap = len(ngrams1.intersection(ngrams2)) / min(len(ngrams1), len(ngrams2))
    
    words1 = Counter(re.findall(r'\w+', text1.lower()))
    words2 = Counter(re.findall(r'\w+', text2.lower()))
    
    common_words = set(words1.keys()).intersection(set(words2.keys()))
    frequency_similarity = len(common_words) / max(len(words1), len(words2))
    
    return ngram_overlap > threshold or frequency_similarity > threshold

async def check_plagiarism_with_database(content: str, submission_id: str, student_id: str, assignment_id: str) -> Dict:
    """
    Advanced plagiarism detection using database integration
    """
    if not content or len(content.strip()) < 20:
        return {
            "similarity_score": 0,
            "is_suspicious": False,
            "suspicious_segments": [],
            "matched_sources": [],
            "confidence": 0,
            "analysis": "Content too short for analysis"
        }
    
    try:
        logger.info(f"Starting plagiarism check for submission {submission_id}")
        
        # Get student's previous submissions for self-plagiarism check
        student_submissions = await db.get_student_submissions(student_id)
        
        # Get other submissions for the same assignment
        assignment_submissions = await db.get_all_submissions_for_assignment(assignment_id)
        
        # Remove current submission from assignment submissions
        assignment_submissions = [s for s in assignment_submissions if s['id'] != submission_id]
        
        similarity_scores = []
        suspicious_segments = []
        matched_sources = []
        paraphrase_detected = False
        
        # Check against student's previous submissions (self-plagiarism)
        for prev_submission in student_submissions:
            if prev_submission['id'] != submission_id:  # Don't compare with self
                seq_similarity = calculate_similarity(content, prev_submission['content']) * 100
                jaccard_sim = calculate_jaccard_similarity(content, prev_submission['content']) * 100
                
                if seq_similarity > 30 or jaccard_sim > 25:  # Lower threshold for self-plagiarism
                    similarity_scores.append((seq_similarity + jaccard_sim) / 2)
                    matched_sources.append(f"Previous submission ({seq_similarity:.1f}% similar)")
        
        # Check against other students' submissions (collusion)
        for other_submission in assignment_submissions:
            seq_similarity = calculate_similarity(content, other_submission['content']) * 100
            jaccard_sim = calculate_jaccard_similarity(content, other_submission['content']) * 100
            is_paraphrase = detect_paraphrasing(content, other_submission['content'])
            
            weighted_similarity = (seq_similarity * 0.4 + jaccard_sim * 0.3 + (seq_similarity * 0.3 if is_paraphrase else 0))
            
            if weighted_similarity > 25 or is_paraphrase:
                similarity_scores.append(weighted_similarity)
                
                if is_paraphrase:
                    paraphrase_detected = True
                    matched_sources.append(f"Potential paraphrasing detected (confidence: {weighted_similarity:.1f}%)")
                elif weighted_similarity > 40:
                    matched_sources.append(f"High similarity with another submission ({weighted_similarity:.1f}%)")
        
        # Pattern-based analysis
        formal_indicators = [
            r'\b(therefore|furthermore|moreover|consequently|nevertheless)\b',
            r'\b(it can be argued that|research indicates|studies show)\b',
            r'\b(according to|as stated by|in accordance with)\b'
        ]
        
        sentences = re.split(r'[.!?]+', content)
        pattern_based_segments = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 50:
                continue
                
            formal_count = sum(1 for pattern in formal_indicators if re.search(pattern, sentence, re.IGNORECASE))
            
            if formal_count >= 2:
                pattern_based_segments.append(sentence)
        
        # Calculate overall similarity score
        if similarity_scores:
            avg_similarity = sum(similarity_scores) / len(similarity_scores)
        else:
            # Check for internal repetition
            ngrams = get_ngrams(content, 4)
            unique_ngrams = len(set(ngrams))
            repetition_score = (1 - (unique_ngrams / max(len(ngrams), 1))) * 30
            avg_similarity = min(repetition_score, 15)
        
        is_suspicious = (
            avg_similarity > 25 or 
            len(matched_sources) > 0 or
            paraphrase_detected or
            len(pattern_based_segments) > 5
        )
        
        confidence = min(0.85 + (len(matched_sources) * 0.05), 0.99)
        
        # Limit suspicious segments
        suspicious_segments = pattern_based_segments[:5]
        
        analysis_parts = []
        if avg_similarity > 40:
            analysis_parts.append("High similarity detected with other submissions")
        if paraphrase_detected:
            analysis_parts.append("Potential paraphrasing detected")
        if len(pattern_based_segments) > 3:
            analysis_parts.append("Multiple segments show academic writing patterns")
        if not is_suspicious:
            analysis_parts.append("No significant plagiarism indicators detected")
        
        analysis = ". ".join(analysis_parts) if analysis_parts else "Analysis complete"
        
        result = {
            "similarity_score": round(avg_similarity, 2),
            "is_suspicious": is_suspicious,
            "suspicious_segments": suspicious_segments,
            "matched_sources": matched_sources,
            "paraphrase_detected": paraphrase_detected,
            "confidence": round(confidence, 4),
            "analysis": analysis,
            "submission_id": submission_id,
            "student_id": student_id,
            "assignment_id": assignment_id
        }
        
        # Save plagiarism report to database
        await db.create_plagiarism_report(submission_id, result)
        
        logger.info(f"Plagiarism check completed for submission {submission_id}. Similarity: {avg_similarity:.2f}%")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in plagiarism check for submission {submission_id}: {str(e)}")
        return {
            "similarity_score": 0,
            "is_suspicious": False,
            "suspicious_segments": [],
            "matched_sources": [],
            "confidence": 0,
            "analysis": f"Error during analysis: {str(e)}"
        }
