"""
Free Assignment Grading System
Uses open-source models for zero-cost assignment grading
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional
from textstat import flesch_reading_ease, flesch_kincaid_grade

logger = logging.getLogger(__name__)

class FreeAssignmentGrader:
    """Free assignment grading using open-source models"""
    
    def __init__(self, llm_system):
        self.llm_system = llm_system
        
    async def grade_assignment(self, content: str, rubric: Dict, assignment_context: Dict) -> Dict:
        """Grade assignment using free models"""
        try:
            content_hash = self.llm_system.get_content_hash(content)
            
            # Check cache first
            cached_result = self.llm_system.get_cached_result("grading_cache", content_hash)
            if cached_result:
                logger.info("📋 Using cached grading result")
                return cached_result
            
            logger.info("📝 Grading assignment with free LLM system")
            
            # Analyze content quality
            content_analysis = await self.analyze_content_quality(content)
            
            # Evaluate rubric compliance
            rubric_scores = await self.evaluate_rubric_compliance(content, rubric, assignment_context)
            
            # Generate feedback
            feedback = await self.generate_feedback(content, rubric_scores, content_analysis)
            
            result = {
                'overall_score': self.calculate_overall_score(rubric_scores),
                'rubric_scores': rubric_scores,
                'feedback': feedback,
                'content_analysis': content_analysis,
                'confidence': self.calculate_confidence(rubric_scores),
                'grading_method': 'free_llm_analysis'
            }
            
            # Cache the result
            self.llm_system.cache_result("grading_cache", content_hash, {
                "grade_result": result,
                "feedback": feedback
            })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error in assignment grading: {e}")
            return {
                'overall_score': 0,
                'rubric_scores': {},
                'feedback': f"Error in grading: {str(e)}",
                'error': str(e)
            }
    
    async def analyze_content_quality(self, content: str) -> Dict:
        """Analyze content quality using free tools"""
        try:
            analysis = {}
            
            # Text statistics
            word_count = len(content.split())
            sentence_count = len(re.split(r'[.!?]+', content))
            
            # Readability scores
            try:
                flesch_score = flesch_reading_ease(content)
                fk_grade = flesch_kincaid_grade(content)
                
                analysis['readability'] = {
                    'flesch_score': flesch_score,
                    'grade_level': fk_grade,
                    'word_count': word_count,
                    'sentence_count': sentence_count
                }
            except:
                analysis['readability'] = {
                    'word_count': word_count,
                    'sentence_count': sentence_count
                }
            
            # Sentiment analysis
            try:
                sentiment = self.llm_system.sentiment_analyzer(content)
                analysis['sentiment'] = {
                    'label': sentiment[0]['label'],
                    'score': sentiment[0]['score']
                }
            except:
                analysis['sentiment'] = {'label': 'neutral', 'score': 0.5}
            
            # Content classification
            try:
                # Classify content type
                candidate_labels = ["academic", "informal", "technical", "creative"]
                classification = self.llm_system.classifier(content, candidate_labels)
                
                analysis['classification'] = {
                    'type': classification['labels'][0],
                    'confidence': classification['scores'][0]
                }
            except:
                analysis['classification'] = {'type': 'academic', 'confidence': 0.5}
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error analyzing content quality: {e}")
            return {'error': str(e)}
    
    async def evaluate_rubric_compliance(self, content: str, rubric: Dict, context: Dict) -> Dict:
        """Evaluate rubric compliance using free models"""
        try:
            scores = {}
            
            for criterion, weight in rubric.items():
                score = await self.evaluate_criterion(content, criterion, weight)
                scores[criterion] = score
            
            return scores
            
        except Exception as e:
            logger.error(f"❌ Error evaluating rubric: {e}")
            return {}
    
    async def evaluate_criterion(self, content: str, criterion: str, weight: float) -> Dict:
        """Evaluate individual criterion using free models"""
        try:
            # Use zero-shot classification to evaluate criteria
            candidate_labels = [
                "excellent", "good", "satisfactory", "needs_improvement", "poor"
            ]
            
            # Create prompt for evaluation
            prompt = f"Evaluate the following content for {criterion}: {content[:500]}"
            
            try:
                classification = self.llm_system.classifier(prompt, candidate_labels)
                
                # Convert label to score
                label_to_score = {
                    "excellent": 90,
                    "good": 80,
                    "satisfactory": 70,
                    "needs_improvement": 60,
                    "poor": 50
                }
                
                score = label_to_score.get(classification['labels'][0], 70)
                confidence = classification['scores'][0]
                
            except:
                # Fallback scoring based on content length and structure
                score = self.fallback_criterion_scoring(content, criterion)
                confidence = 0.7
            
            return {
                'score': score,
                'weight': weight,
                'confidence': confidence,
                'criterion': criterion
            }
            
        except Exception as e:
            logger.error(f"❌ Error evaluating criterion {criterion}: {e}")
            return {'score': 70, 'weight': weight, 'confidence': 0.5, 'criterion': criterion}
    
    def fallback_criterion_scoring(self, content: str, criterion: str) -> int:
        """Fallback scoring when LLM fails"""
        word_count = len(content.split())
        
        # Basic scoring based on content length and structure
        if word_count < 50:
            return 40
        elif word_count < 100:
            return 60
        elif word_count < 200:
            return 70
        elif word_count < 500:
            return 80
        else:
            return 85
    
    async def generate_feedback(self, content: str, rubric_scores: Dict, content_analysis: Dict) -> str:
        """Generate feedback using free text generation"""
        try:
            # Create feedback prompt
            overall_score = self.calculate_overall_score(rubric_scores)
            
            feedback_prompt = f"""
            Provide constructive feedback for a student submission with an overall score of {overall_score}/100.
            
            Content analysis:
            - Word count: {content_analysis.get('readability', {}).get('word_count', 0)}
            - Readability: {content_analysis.get('readability', {}).get('flesch_score', 0)}
            
            Rubric scores: {json.dumps(rubric_scores, indent=2)}
            
            Provide specific, actionable feedback that helps the student improve.
            """
            
            try:
                # Generate feedback using free text generator
                generated_text = self.llm_system.text_generator(
                    feedback_prompt,
                    max_length=300,
                    num_return_sequences=1,
                    temperature=0.7
                )
                
                feedback = generated_text[0]['generated_text'].replace(feedback_prompt, '').strip()
                
                # Clean up the feedback
                feedback = self.clean_feedback(feedback)
                
            except:
                # Fallback feedback generation
                feedback = self.generate_fallback_feedback(overall_score, rubric_scores, content_analysis)
            
            return feedback
            
        except Exception as e:
            logger.error(f"❌ Error generating feedback: {e}")
            return "Feedback generation failed. Please review the submission manually."
    
    def clean_feedback(self, feedback: str) -> str:
        """Clean and format feedback text"""
        # Remove unwanted tokens and clean up
        feedback = re.sub(r'<[^>]+>', '', feedback)  # Remove HTML tags
        feedback = re.sub(r'\s+', ' ', feedback)     # Normalize whitespace
        feedback = feedback.strip()
        
        # Ensure feedback is not too short or too long
        if len(feedback) < 50:
            feedback += " Keep working on improving your writing skills!"
        elif len(feedback) > 500:
            feedback = feedback[:500] + "..."
        
        return feedback
    
    def generate_fallback_feedback(self, overall_score: int, rubric_scores: Dict, content_analysis: Dict) -> str:
        """Generate fallback feedback when LLM fails"""
        feedback_parts = []
        
        # Overall score feedback
        if overall_score >= 90:
            feedback_parts.append("Excellent work! Your submission demonstrates strong understanding and quality.")
        elif overall_score >= 80:
            feedback_parts.append("Good work! Your submission shows solid understanding with room for minor improvements.")
        elif overall_score >= 70:
            feedback_parts.append("Satisfactory work. Consider addressing the areas mentioned in the rubric.")
        elif overall_score >= 60:
            feedback_parts.append("Needs improvement. Please review the requirements and revise your submission.")
        else:
            feedback_parts.append("Significant improvement needed. Please review the requirements and resubmit.")
        
        # Specific criterion feedback
        for criterion, score_data in rubric_scores.items():
            score = score_data.get('score', 70)
            if score < 70:
                feedback_parts.append(f"Focus on improving {criterion.replace('_', ' ')}.")
        
        return " ".join(feedback_parts)
    
    def calculate_overall_score(self, rubric_scores: Dict) -> int:
        """Calculate overall score from rubric scores"""
        try:
            total_weighted_score = 0
            total_weight = 0
            
            for criterion, score_data in rubric_scores.items():
                score = score_data.get('score', 70)
                weight = score_data.get('weight', 1.0)
                
                total_weighted_score += score * weight
                total_weight += weight
            
            if total_weight > 0:
                return int(total_weighted_score / total_weight)
            else:
                return 70
                
        except Exception as e:
            logger.error(f"❌ Error calculating overall score: {e}")
            return 70
    
    def calculate_confidence(self, rubric_scores: Dict) -> float:
        """Calculate confidence in grading"""
        try:
            confidences = [score_data.get('confidence', 0.7) for score_data in rubric_scores.values()]
            return sum(confidences) / len(confidences) if confidences else 0.7
            
        except Exception as e:
            logger.error(f"❌ Error calculating confidence: {e}")
            return 0.7
    
    def analyze_programming_assignment(self, code: str, requirements: List[str]) -> Dict:
        """Specialized analysis for programming assignments"""
        try:
            analysis = {
                'code_quality': self.analyze_code_quality(code),
                'requirements_met': self.check_requirements(code, requirements),
                'syntax_errors': self.find_syntax_errors(code),
                'style_score': self.analyze_code_style(code)
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error analyzing programming assignment: {e}")
            return {'error': str(e)}
    
    def analyze_code_quality(self, code: str) -> Dict:
        """Analyze code quality metrics"""
        lines = code.split('\n')
        
        return {
            'line_count': len(lines),
            'comment_ratio': self.calculate_comment_ratio(code),
            'complexity_score': self.calculate_complexity(code),
            'variable_naming': self.analyze_variable_naming(code)
        }
    
    def calculate_comment_ratio(self, code: str) -> float:
        """Calculate comment to code ratio"""
        lines = code.split('\n')
        comment_lines = sum(1 for line in lines if line.strip().startswith('#') or line.strip().startswith('//'))
        total_lines = len([line for line in lines if line.strip()])
        
        return comment_lines / total_lines if total_lines > 0 else 0
    
    def calculate_complexity(self, code: str) -> int:
        """Calculate simple complexity score"""
        # Count control structures
        complexity_indicators = ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'class', 'def']
        complexity_score = sum(code.count(indicator) for indicator in complexity_indicators)
        
        return complexity_score
    
    def analyze_variable_naming(self, code: str) -> Dict:
        """Analyze variable naming conventions"""
        # Find variable assignments
        variables = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\s*=', code)
        
        # Check naming conventions
        snake_case = sum(1 for var in variables if '_' in var)
        camel_case = sum(1 for var in variables if re.search(r'[a-z][A-Z]', var))
        
        return {
            'snake_case_count': snake_case,
            'camel_case_count': camel_case,
            'naming_consistency': 'good' if snake_case > camel_case or camel_case > snake_case else 'mixed'
        }
    
    def check_requirements(self, code: str, requirements: List[str]) -> Dict:
        """Check if code meets requirements"""
        met_requirements = []
        
        for requirement in requirements:
            if requirement.lower() in code.lower():
                met_requirements.append(requirement)
        
        return {
            'met_count': len(met_requirements),
            'total_count': len(requirements),
            'met_requirements': met_requirements,
            'completion_percentage': (len(met_requirements) / len(requirements)) * 100 if requirements else 0
        }
    
    def find_syntax_errors(self, code: str) -> List[str]:
        """Find basic syntax errors"""
        errors = []
        
        # Check for common syntax errors
        if code.count('(') != code.count(')'):
            errors.append("Mismatched parentheses")
        
        if code.count('[') != code.count(']'):
            errors.append("Mismatched brackets")
        
        if code.count('{') != code.count('}'):
            errors.append("Mismatched braces")
        
        # Check for common Python errors
        if 'def ' in code and ':' not in code:
            errors.append("Missing colon after function definition")
        
        return errors
    
    def analyze_code_style(self, code: str) -> Dict:
        """Analyze code style"""
        lines = code.split('\n')
        
        # Check indentation
        indented_lines = sum(1 for line in lines if line.startswith('    ') or line.startswith('\t'))
        total_lines = len([line for line in lines if line.strip()])
        
        return {
            'indentation_consistency': indented_lines / total_lines if total_lines > 0 else 0,
            'line_length_avg': sum(len(line) for line in lines) / len(lines) if lines else 0,
            'style_score': min(100, (indented_lines / total_lines) * 100) if total_lines > 0 else 0
        }
