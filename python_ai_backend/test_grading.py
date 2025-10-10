import requests
import json

API_URL = "http://127.0.0.1:8000/api/grade-submission"

TEST_ESSAY = """
Climate change represents one of the most significant challenges facing humanity today. 
The scientific consensus is clear: human activities, particularly the burning of fossil fuels, 
are contributing to rising global temperatures.

The effects of climate change are already visible. Rising sea levels threaten coastal communities, 
while extreme weather events become more frequent and severe. Furthermore, ecosystems are being 
disrupted, leading to species extinction and habitat loss.

However, there is hope. Renewable energy technologies are becoming more affordable and efficient. 
Moreover, international cooperation through agreements like the Paris Accord demonstrates global 
commitment to addressing this crisis. Therefore, while the challenge is substantial, solutions 
are within reach.

In conclusion, addressing climate change requires immediate action at all levels of society. 
By transitioning to clean energy, protecting natural habitats, and promoting sustainable practices, 
we can work towards a more sustainable future for generations to come.
"""

def test_grading():
    print("=" * 60)
    print("TESTING AI GRADING SYSTEM")
    print("=" * 60)
    
    request_data = {
        "content": TEST_ESSAY,
        "student_id": "test-student-001",
        "assignment_id": "test-assignment-001",
        "assignment_type": "essay",
        "rubric": {
            "content": {
                "max_points": 30,
                "min_words": 100
            },
            "structure": {
                "max_points": 25
            },
            "grammar": {
                "max_points": 20
            },
            "argument": {
                "max_points": 25
            }
        }
    }
    
    print("\nSending grading request...")
    print(f"Essay length: {len(TEST_ESSAY.split())} words")
    
    try:
        response = requests.post(API_URL, json=request_data)
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n" + "=" * 60)
            print("GRADING RESULTS")
            print("=" * 60)
            
            print(f"\nOverall Score: {result['total_score']}%")
            print(f"Confidence: {result['confidence'] * 100}%")
            
            print("\n--- Criteria Scores ---")
            for criterion, scores in result['criteria_scores'].items():
                print(f"\n{criterion.upper()}:")
                print(f"  Score: {scores['score']}/{scores['max_score']} ({scores.get('percentage', 0)}%)")
                print(f"  Feedback: {scores['feedback']}")
            
            print("\n--- Strengths ---")
            for strength in result['strengths']:
                print(f"  ✓ {strength}")
            
            print("\n--- Areas for Improvement ---")
            for improvement in result['improvements']:
                print(f"  → {improvement}")
            
            print("\n--- Plagiarism Check ---")
            plag = result['plagiarism_result']
            print(f"  Similarity Score: {plag['similarity_score']}%")
            print(f"  Status: {'⚠ SUSPICIOUS' if plag['is_suspicious'] else '✓ CLEAR'}")
            
            if plag['suspicious_segments']:
                print(f"  Flagged Segments: {len(plag['suspicious_segments'])}")
            
            print("\n--- Full Feedback ---")
            print(result['feedback'])
            
            print("\n" + "=" * 60)
            print("TEST COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API")
        print("Make sure the backend is running:")
        print("  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

def test_health_check():
    """Test if API is running"""
    print("\nTesting API health check...")
    try:
        response = requests.get("http://127.0.0.1:8000/health")
        if response.status_code == 200:
            print("✓ API is running!")
            return True
        else:
            print("✗ API health check failed")
            return False
    except:
        print("✗ Cannot connect to API")
        return False

if __name__ == "__main__":
    if test_health_check():
        test_grading()
    else:
        print("\nPlease start the backend first:")
        print("  cd python_backend")
        print("  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload")