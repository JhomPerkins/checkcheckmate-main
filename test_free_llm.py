#!/usr/bin/env python3
"""
Test script for FREE LLM Academic Assessment System
Tests all major functionality without any costs
"""

import requests
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test data
TEST_ESSAY = """
Artificial Intelligence in Education: A Comprehensive Analysis

The integration of artificial intelligence (AI) in education represents a transformative shift in how we approach learning and teaching. This essay explores the multifaceted impact of AI technologies on educational systems, examining both the opportunities and challenges they present.

AI-powered educational tools offer personalized learning experiences that adapt to individual student needs. Machine learning algorithms can analyze student performance patterns, identify knowledge gaps, and recommend targeted interventions. This personalized approach has shown significant improvements in student engagement and learning outcomes.

Furthermore, AI enables automated grading systems that can provide immediate feedback to students. These systems use natural language processing to evaluate essays, coding assignments, and other written work. While concerns about accuracy persist, recent advances in transformer models have achieved human-level performance in many grading tasks.

However, the implementation of AI in education raises important ethical considerations. Privacy concerns arise from the collection and analysis of student data. Additionally, there are worries about algorithmic bias and the potential for AI systems to perpetuate existing inequalities in education.

In conclusion, while AI presents remarkable opportunities for enhancing education, careful consideration of ethical implications and implementation strategies is essential for realizing its full potential.
"""

TEST_RUBRIC = {
    "content_quality": {"max_points": 40},
    "analysis_depth": {"max_points": 30},
    "writing_style": {"max_points": 20},
    "conclusion": {"max_points": 10}
}

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if the API is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            logger.info("✅ Health check passed")
            return True
        else:
            logger.error(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Cannot connect to API. Make sure it's running on port 8000")
        return False

def test_content_analysis():
    """Test content analysis endpoint"""
    logger.info("🔍 Testing content analysis...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/free/analyze-content", 
                              params={"content": TEST_ESSAY})
        
        if response.status_code == 200:
            result = response.json()
            logger.info("✅ Content analysis successful")
            logger.info(f"   Word count: {result['content_analysis']['readability']['word_count']}")
            logger.info(f"   Readability score: {result['content_analysis']['readability']['flesch_score']}")
            logger.info(f"   AI detection confidence: {result['ai_detection']['ai_confidence']}")
            return True
        else:
            logger.error(f"❌ Content analysis failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Content analysis error: {e}")
        return False

def test_plagiarism_detection():
    """Test plagiarism detection endpoint"""
    logger.info("🔍 Testing plagiarism detection...")
    
    try:
        data = {
            "content": TEST_ESSAY,
            "assignment_id": "test_assignment_001",
            "student_id": "test_student_001"
        }
        
        response = requests.post(f"{BASE_URL}/api/free/detect-plagiarism", 
                               json=data)
        
        if response.status_code == 200:
            result = response.json()
            logger.info("✅ Plagiarism detection successful")
            logger.info(f"   Similarity matches: {len(result['matches'])}")
            logger.info(f"   Highest similarity: {result['highest_similarity']}")
            logger.info(f"   Is flagged: {result['is_flagged']}")
            return True
        else:
            logger.error(f"❌ Plagiarism detection failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Plagiarism detection error: {e}")
        return False

def test_assignment_grading():
    """Test assignment grading endpoint"""
    logger.info("📝 Testing assignment grading...")
    
    try:
        data = {
            "content": TEST_ESSAY,
            "student_id": "test_student_001",
            "assignment_id": "test_assignment_001",
            "rubric": TEST_RUBRIC,
            "assignment_type": "essay"
        }
        
        response = requests.post(f"{BASE_URL}/api/free/grade-submission", 
                               json=data)
        
        if response.status_code == 200:
            result = response.json()
            logger.info("✅ Assignment grading successful")
            logger.info(f"   Total score: {result['total_score']}")
            logger.info(f"   Confidence: {result['confidence']}")
            logger.info(f"   Processing time: {result['metadata']['processing_time']}s")
            logger.info(f"   Cost: {result['metadata']['cost']}")
            
            # Show rubric scores
            for criterion, score_data in result['criteria_scores'].items():
                logger.info(f"   {criterion}: {score_data['score']}/100")
            
            return True
        else:
            logger.error(f"❌ Assignment grading failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Assignment grading error: {e}")
        return False

def test_performance():
    """Test system performance"""
    logger.info("⚡ Testing performance...")
    
    start_time = time.time()
    
    # Run multiple requests in parallel
    import concurrent.futures
    
    def make_request():
        data = {
            "content": TEST_ESSAY[:200],  # Shorter content for speed
            "assignment_id": "perf_test",
            "student_id": "perf_test"
        }
        response = requests.post(f"{BASE_URL}/api/free/detect-plagiarism", json=data)
        return response.status_code == 200
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_request) for _ in range(10)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    total_time = time.time() - start_time
    success_rate = sum(results) / len(results) * 100
    
    logger.info(f"✅ Performance test completed")
    logger.info(f"   10 requests in {total_time:.2f}s")
    logger.info(f"   Success rate: {success_rate}%")
    logger.info(f"   Average time per request: {total_time/10:.2f}s")
    
    return success_rate > 80

def main():
    """Run all tests"""
    logger.info("🚀 FREE LLM Academic Assessment System Test Suite")
    logger.info("=" * 60)
    
    tests = [
        ("Health Check", test_health),
        ("Content Analysis", test_content_analysis),
        ("Plagiarism Detection", test_plagiarism_detection),
        ("Assignment Grading", test_assignment_grading),
        ("Performance Test", test_performance)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n🧪 Running {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 TEST RESULTS SUMMARY")
    logger.info("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name:.<40} {status}")
        if result:
            passed += 1
    
    logger.info("-" * 60)
    logger.info(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 ALL TESTS PASSED! Your FREE LLM system is working perfectly!")
        logger.info("💰 Cost: $0.00")
        logger.info("🎯 Ready for production use!")
    else:
        logger.info("⚠️ Some tests failed. Check the logs above for details.")
        logger.info("💡 Make sure the API is running: python main.py")
    
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
