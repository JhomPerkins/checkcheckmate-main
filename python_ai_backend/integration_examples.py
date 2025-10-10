"""
Integration Examples for CHECKmate AI Grading API
=================================================

This file contains examples of how to integrate the AI grading API
with various systems and programming languages.
"""

import requests
import json
from typing import List, Dict, Any

class GradingAPIClient:
    """Python client for the CHECKmate AI Grading API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def health_check(self) -> Dict[str, Any]:
        """Check if the API is running"""
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()
    
    def grade_submission(self, content: str, student_id: str, assignment_id: str, 
                        rubric: Dict[str, Dict], assignment_type: str = "essay") -> Dict[str, Any]:
        """Grade a single submission"""
        payload = {
            "content": content,
            "student_id": student_id,
            "assignment_id": assignment_id,
            "rubric": rubric,
            "assignment_type": assignment_type
        }
        
        response = self.session.post(f"{self.base_url}/api/grade-submission", json=payload)
        response.raise_for_status()
        return response.json()
    
    def batch_grade(self, submissions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Grade multiple submissions"""
        response = self.session.post(f"{self.base_url}/api/batch-grade", json=submissions)
        response.raise_for_status()
        return response.json()

# Example usage
if __name__ == "__main__":
    # Initialize client
    api = GradingAPIClient("http://localhost:8000")
    
    # Check health
    try:
        health = api.health_check()
        print("✅ API is healthy:", health['status'])
    except Exception as e:
        print("❌ API is not available:", e)
        exit(1)
    
    # Example rubric
    rubric = {
        "content": {"max_points": 30, "min_words": 100},
        "structure": {"max_points": 25},
        "grammar": {"max_points": 20},
        "argument": {"max_points": 25}
    }
    
    # Grade a single submission
    essay = """
    Climate change is one of the most pressing issues of our time. 
    The scientific evidence clearly shows that human activities are 
    contributing to rising global temperatures and environmental degradation.
    """
    
    try:
        result = api.grade_submission(
            content=essay,
            student_id="student-123",
            assignment_id="assignment-456",
            rubric=rubric
        )
        
        print(f"\n📊 Grading Result:")
        print(f"Score: {result['total_score']}%")
        print(f"Confidence: {result['confidence'] * 100}%")
        print(f"Plagiarism: {'⚠️ Suspicious' if result['plagiarism_result']['is_suspicious'] else '✅ Clear'}")
        
    except Exception as e:
        print(f"❌ Error grading submission: {e}")

# ============================================================================
# INTEGRATION EXAMPLES FOR OTHER LANGUAGES
# ============================================================================

# JavaScript/Node.js Example
javascript_example = '''
// JavaScript/Node.js Integration
const axios = require('axios');

class GradingAPIClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }
    
    async healthCheck() {
        const response = await axios.get(`${this.baseUrl}/health`);
        return response.data;
    }
    
    async gradeSubmission(content, studentId, assignmentId, rubric) {
        const payload = {
            content,
            student_id: studentId,
            assignment_id: assignmentId,
            rubric,
            assignment_type: 'essay'
        };
        
        const response = await axios.post(`${this.baseUrl}/api/grade-submission`, payload);
        return response.data;
    }
}

// Usage
const api = new GradingAPIClient();
api.healthCheck().then(health => console.log('API Status:', health.status));
'''

# PHP Example
php_example = '''
<?php
// PHP Integration
class GradingAPIClient {
    private $baseUrl;
    
    public function __construct($baseUrl = 'http://localhost:8000') {
        $this->baseUrl = $baseUrl;
    }
    
    public function healthCheck() {
        $response = file_get_contents($this->baseUrl . '/health');
        return json_decode($response, true);
    }
    
    public function gradeSubmission($content, $studentId, $assignmentId, $rubric) {
        $payload = json_encode([
            'content' => $content,
            'student_id' => $studentId,
            'assignment_id' => $assignmentId,
            'rubric' => $rubric,
            'assignment_type' => 'essay'
        ]);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => $payload
            ]
        ]);
        
        $response = file_get_contents($this->baseUrl . '/api/grade-submission', false, $context);
        return json_decode($response, true);
    }
}

// Usage
$api = new GradingAPIClient();
$health = $api->healthCheck();
echo "API Status: " . $health['status'] . "\n";
?>
'''

# C# Example
csharp_example = '''
// C# Integration
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class GradingAPIClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    
    public GradingAPIClient(string baseUrl = "http://localhost:8000")
    {
        _baseUrl = baseUrl;
        _httpClient = new HttpClient();
    }
    
    public async Task<dynamic> HealthCheckAsync()
    {
        var response = await _httpClient.GetAsync($"{_baseUrl}/health");
        var content = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject(content);
    }
    
    public async Task<dynamic> GradeSubmissionAsync(string content, string studentId, 
        string assignmentId, object rubric)
    {
        var payload = new
        {
            content = content,
            student_id = studentId,
            assignment_id = assignmentId,
            rubric = rubric,
            assignment_type = "essay"
        };
        
        var json = JsonConvert.SerializeObject(payload);
        var content_data = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync($"{_baseUrl}/api/grade-submission", content_data);
        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject(responseContent);
    }
}

// Usage
var api = new GradingAPIClient();
var health = await api.HealthCheckAsync();
Console.WriteLine($"API Status: {health.status}");
'''

# Save examples to files
with open('javascript_integration.js', 'w') as f:
    f.write(javascript_example)

with open('php_integration.php', 'w') as f:
    f.write(php_example)

with open('csharp_integration.cs', 'w') as f:
    f.write(csharp_example)

print("✅ Integration examples created!")
print("Files created:")
print("- javascript_integration.js")
print("- php_integration.php") 
print("- csharp_integration.cs")
print("- integration_examples.py (this file)")
