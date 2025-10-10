import re
from typing import Dict, List, Any, Tuple
from collections import Counter
from textstat import flesch_reading_ease, flesch_kincaid_grade, automated_readability_index
import logging
from ..database import db

logger = logging.getLogger(__name__)

TRANSITION_WORDS = {
    'addition': ['furthermore', 'moreover', 'additionally', 'also', 'besides'],
    'contrast': ['however', 'nevertheless', 'conversely', 'although', 'whereas'],
    'causation': ['therefore', 'consequently', 'thus', 'hence', 'accordingly'],
    'sequence': ['firstly', 'secondly', 'finally', 'subsequently', 'meanwhile']
}

ACADEMIC_VOCABULARY = [
    'analyze', 'evaluate', 'demonstrate', 'illustrate', 'synthesize',
    'interpret', 'examine', 'investigate', 'emphasize', 'significant'
]

def count_words(text: str) -> int:
    """Count words in text with improved accuracy"""
    words = re.findall(r'\b\w+\b', text)
    return len(words)

def count_sentences(text: str) -> int:
    """Count sentences accurately"""
    sentences = re.split(r'[.!?]+', text)
    return len([s for s in sentences if s.strip() and len(s.split()) > 2])

def analyze_vocabulary_complexity(text: str) -> Dict[str, Any]:
    """Analyze vocabulary sophistication"""
    words = re.findall(r'\b\w+\b', text.lower())
    
    if not words:
        return {
            "complexity_score": 0,
            "academic_word_count": 0,
            "avg_word_length": 0,
            "unique_words_ratio": 0
        }
    
    avg_word_length = sum(len(word) for word in words) / len(words)
    academic_word_count = sum(1 for word in words if word in ACADEMIC_VOCABULARY)
    unique_words = set(words)
    unique_ratio = len(unique_words) / len(words)
    long_words = sum(1 for word in words if len(word) > 6)
    complexity_score = ((long_words / len(words)) * 0.4 + 
                       unique_ratio * 0.4 + 
                       (academic_word_count / max(len(words), 1)) * 0.2) * 100
    
    return {
        "complexity_score": round(complexity_score, 2),
        "academic_word_count": academic_word_count,
        "avg_word_length": round(avg_word_length, 2),
        "unique_words_ratio": round(unique_ratio, 2),
        "long_words_count": long_words
    }

def calculate_content_score(text: str, min_words: int = 100) -> Dict[str, Any]:
    """Enhanced content quality evaluation"""
    word_count = count_words(text)
    
    if word_count < min_words:
        length_score = (word_count / min_words) * 0.5
    elif word_count < min_words * 1.5:
        length_score = 0.5 + ((word_count - min_words) / (min_words * 0.5)) * 0.3
    else:
        length_score = 0.8 + min((word_count - min_words * 1.5) / (min_words * 2), 0.2)
    
    vocab_analysis = analyze_vocabulary_complexity(text)
    vocab_score = vocab_analysis["complexity_score"] / 100
    
    try:
        readability = flesch_reading_ease(text)
        readability_score = min(max((readability - 30) / 70, 0), 1)   
    except:
        readability_score = 0.5
    
    overall_score = (
        length_score * 0.4 + 
        vocab_score * 0.4 + 
        readability_score * 0.2
    ) * 100
    
    feedback = []
    if word_count < min_words:
        feedback.append(f"Content is too short ({word_count} words). Target: {min_words}+ words.")
    elif word_count > min_words * 3:
        feedback.append(f"Very comprehensive ({word_count} words). Excellent depth.")
    
    if vocab_analysis["unique_words_ratio"] < 0.4:
        feedback.append("Limited vocabulary diversity. Use more varied word choices.")
    elif vocab_analysis["academic_word_count"] > 5:
        feedback.append("Strong use of academic vocabulary.")
    
    return {
        "score": overall_score,
        "word_count": word_count,
        "vocab_analysis": vocab_analysis,
        "readability": readability_score,
        "feedback": " ".join(feedback) if feedback else "Good content quality with strong development."
    }

def calculate_grammar_score(text: str) -> Dict[str, Any]:
    """Enhanced grammar evaluation"""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    sentence_count = len(sentences)
    
    has_proper_punctuation = bool(re.search(r'[.!?]$', text.strip()))
    repeated_words = len(re.findall(r'\b(\w+)\s+\1\b', text, re.IGNORECASE))
    passive_indicators = len(re.findall(r'\b(is|are|was|were|been|be)\s+\w+ed\b', text, re.IGNORECASE))
    long_sentences = sum(1 for s in sentences if len(s.split()) > 30)
    fragments = sum(1 for s in sentences if len(s.split()) < 5)
    proper_capitalization = sum(1 for s in sentences if s[0].isupper()) / max(sentence_count, 1)
    
    score = 90 
    feedback = []
    
    if not has_proper_punctuation:
        score -= 10
        feedback.append("Missing proper ending punctuation.")
    
    if repeated_words > 0:
        deduction = min(repeated_words * 5, 20)
        score -= deduction
        feedback.append(f"Found {repeated_words} repeated words.")
    
    if sentence_count < 3:
        score -= 15
        feedback.append("Too few sentences. Expand your ideas.")
    
    if passive_indicators > sentence_count * 0.3:
        score -= 10
        feedback.append("Excessive passive voice. Use more active constructions.")
    
    if long_sentences > 2:
        score -= 5
        feedback.append("Some sentences are too long. Break them up.")
    
    if fragments > 1:
        score -= 10
        feedback.append("Sentence fragments detected. Ensure complete sentences.")
    
    if proper_capitalization < 0.9:
        score -= 5
        feedback.append("Check sentence capitalization.")
    
    score = max(score, 0)
    
    if score >= 85:
        feedback.insert(0, "Strong grammar and style.")
    
    return {
        "score": score,
        "feedback": " ".join(feedback) if feedback else "Grammar and style are excellent."
    }

def calculate_structure_score(text: str) -> Dict[str, Any]:
    """Enhanced structure evaluation"""
    paragraphs = [p for p in text.split('\n\n') if p.strip()]
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    if not paragraphs or not sentences:
        return {
            "paragraph_count": 0,
            "avg_paragraph_length": 0,
            "avg_sentence_length": 0,
            "has_introduction": False,
            "has_conclusion": False,
            "structure_balance": 0
        }
    
    avg_paragraph_length = sum(len(p.split()) for p in paragraphs) / len(paragraphs)
    avg_sentence_length = count_words(text) / len(sentences)
    has_introduction = len(paragraphs) > 0 and len(paragraphs[0].split()) > 20
    has_conclusion = len(paragraphs) > 1 and len(paragraphs[-1].split()) > 15
    
    if len(paragraphs) > 1:
        paragraph_lengths = [len(p.split()) for p in paragraphs]
        avg_len = sum(paragraph_lengths) / len(paragraph_lengths)
        variance = sum((x - avg_len) ** 2 for x in paragraph_lengths) / len(paragraph_lengths)
        structure_balance = max(0, 100 - variance)
    else:
        structure_balance = 50
    
    score = 60  
    feedback = []
    
    if has_introduction:
        score += 15
    else:
        feedback.append("Add a strong introduction paragraph (20+ words).")
    
    if has_conclusion:
        score += 15
    else:
        feedback.append("Add a proper conclusion paragraph (15+ words).")
    
    para_count = len(paragraphs)
    if para_count >= 5:
        score += 15
    elif para_count >= 3:
        score += 10
    elif para_count >= 2:
        score += 5
    else:
        feedback.append("Organize content into multiple paragraphs (3+ recommended).")
    
    if avg_sentence_length >= 15 and avg_sentence_length <= 25:
        score += 10
    elif avg_sentence_length >= 12 and avg_sentence_length <= 30:
        score += 5
    else:
        feedback.append("Balance sentence length (aim for 15-25 words average).")
    
    if structure_balance > 70:
        score += 5
        feedback.insert(0, "Well-balanced paragraph structure.")
    
    score = min(score, 100)
    
    return {
        "score": score,
        "feedback": " ".join(feedback) if feedback else "Excellent structure and organization."
    }

def analyze_argument_quality(text: str) -> Dict[str, Any]:
    """Analyze argumentation and critical thinking"""
    reasoning_patterns = [
        r'\b(because|since|therefore|thus|hence|consequently)\b',
        r'\b(for example|for instance|such as|including)\b',
        r'\b(according to|research shows|studies indicate)\b',
        r'\b(in contrast|on the other hand|alternatively)\b'
    ]
    
    reasoning_indicators = sum(
        len(re.findall(pattern, text, re.IGNORECASE))
        for pattern in reasoning_patterns
    )
    
    citations = len(re.findall(r'\([^)]*\d{4}[^)]*\)|\[\d+\]', text))
    questions = len(re.findall(r'\?', text))
    sentence_count = count_sentences(text)
    reasoning_density = reasoning_indicators / max(sentence_count, 1)
    
    score = min((reasoning_density * 100 + citations * 10 + questions * 5), 100)
    
    return {
        "reasoning_indicators": reasoning_indicators,
        "citations": citations,
        "questions": questions,
        "argument_score": round(score, 2)
    }

async def grade_essay_with_database(content: str, rubric: Dict, assignment_id: str, student_id: str) -> Dict[str, Any]:
    """
    Advanced AI grading with database integration
    """
    try:
        logger.info(f"Starting enhanced grading process for assignment {assignment_id}")
        
        # Get assignment details from database
        assignment = await db.get_assignment(assignment_id)
        if not assignment:
            raise ValueError(f"Assignment {assignment_id} not found in database")
        
        # Get rubric from database or use provided rubric
        db_rubric = assignment.get('rubric', {})
        if db_rubric:
            rubric = db_rubric
        
        criteria_scores = {}
        total_weighted_score = 0
        total_weight = 0
        strengths = []
        improvements = []
        
        for criterion_name, criterion_config in rubric.items():
            try:
                max_points = criterion_config.get("max_points", 20)
                min_words = criterion_config.get("min_words", 100)
                
                criterion_lower = criterion_name.lower()
                
                if "content" in criterion_lower or "thesis" in criterion_lower:
                    result = calculate_content_score(content, min_words)
                    score = (result["score"] / 100) * max_points
                    feedback = result["feedback"]
                    
                elif "grammar" in criterion_lower or "style" in criterion_lower or "language" in criterion_lower:
                    result = calculate_grammar_score(content)
                    score = (result["score"] / 100) * max_points
                    feedback = result["feedback"]
                    
                elif "structure" in criterion_lower or "organization" in criterion_lower:
                    result = calculate_structure_score(content)
                    score = (result["score"] / 100) * max_points
                    feedback = result["feedback"]
                    
                elif "argument" in criterion_lower or "analysis" in criterion_lower or "critical" in criterion_lower:
                    arg_analysis = analyze_argument_quality(content)
                    score = (arg_analysis["argument_score"] / 100) * max_points
                    feedback = f"Reasoning indicators: {arg_analysis['reasoning_indicators']}, Citations: {arg_analysis['citations']}"
                    
                else:
                    result = calculate_content_score(content, min_words)
                    score = (result["score"] / 100) * max_points
                    feedback = f"Comprehensive evaluation for {criterion_name}"
                
                criteria_scores[criterion_name] = {
                    "score": round(score, 2),
                    "max_score": max_points,
                    "feedback": feedback,
                    "percentage": round((score / max_points) * 100, 1)
                }
                
                total_weighted_score += score
                total_weight += max_points
                
                percentage = (score / max_points) * 100
                if percentage >= 85:
                    strengths.append(f"Excellent {criterion_name.replace('_', ' ')}")
                elif percentage >= 75:
                    strengths.append(f"Strong {criterion_name.replace('_', ' ')}")
                elif percentage < 60:
                    improvements.append(f"Focus on improving {criterion_name.replace('_', ' ')}")
                    
            except Exception as e:
                logger.error(f"Error processing criterion {criterion_name}: {str(e)}")
                continue
        
        final_score = (total_weighted_score / total_weight * 100) if total_weight > 0 else 0
        
        word_count = count_words(content)
        sentence_count = count_sentences(content)
        
        try:
            readability = flesch_reading_ease(content)
            grade_level = flesch_kincaid_grade(content)
        except:
            readability = 50
            grade_level = 8
        
        feedback_parts = [
            f"Overall Score: {final_score:.1f}%",
            f"Grade Level: {grade_level:.1f}",
            "",
        ]
        
        if final_score >= 93:
            feedback_parts.append("🌟 Outstanding work! Demonstrates exceptional understanding and mastery.")
        elif final_score >= 85:
            feedback_parts.append("✓ Excellent work! Strong performance with minor areas for refinement.")
        elif final_score >= 75:
            feedback_parts.append("Good work overall. Some key areas would benefit from development.")
        elif final_score >= 65:
            feedback_parts.append("Satisfactory. Focus on the improvement areas highlighted below.")
        else:
            feedback_parts.append("Needs significant development. Review the detailed feedback carefully.")
        
        feedback_parts.extend([
            "",
            f"📊 Statistics:",
            f"  • Word Count: {word_count} words",
            f"  • Sentences: {sentence_count}",
            f"  • Readability: {readability:.1f} (Flesch Reading Ease)",
            f"  • Grade Level: {grade_level:.1f}",
            "",
            "📝 Detailed Criterion Feedback:"
        ])
        
        for criterion, scores in criteria_scores.items():
            feedback_parts.append(f"\n{criterion.replace('_', ' ').title()}:")
            feedback_parts.append(f"  Score: {scores['score']}/{scores['max_score']} ({scores['percentage']}%)")
            feedback_parts.append(f"  {scores['feedback']}")
        
        overall_feedback = "\n".join(feedback_parts)
        
        if not strengths:
            if final_score >= 70:
                strengths.append("Solid foundational understanding")
        if not improvements:
            if final_score < 95:
                improvements.append("Continue refining writing skills")
        
        confidence = min(0.70 + (word_count / 500) * 0.15 + (sentence_count / 10) * 0.10, 0.98)
        
        logger.info(f"Enhanced grading completed successfully. Final score: {final_score:.2f}%")
        
        return {
            "total_score": round(final_score, 2),
            "criteria_scores": criteria_scores,
            "feedback": overall_feedback,
            "strengths": strengths[:5],  
            "improvements": improvements[:5],  
            "confidence": round(confidence, 4),
            "word_count": word_count,
            "sentence_count": sentence_count,
            "readability_score": round(readability, 2),
            "grade_level": round(grade_level, 1),
            "assignment_id": assignment_id,
            "student_id": student_id
        }
        
    except Exception as e:
        logger.error(f"Critical error in enhanced grade_essay: {str(e)}", exc_info=True)
        raise ValueError(f"Enhanced grading failed: {str(e)}")
