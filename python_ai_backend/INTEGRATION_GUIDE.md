# CHECKmate AI Grading API - Integration Guide

## 🚀 Quick Start

### 1. **Local Development**
```bash
# Install dependencies
pip install -r requirements.txt

# Start the API
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Test the API
python test_grading.py
```

### 2. **Docker Deployment**
```bash
# Build and run with Docker
docker build -t grading-api .
docker run -p 8000:8000 grading-api

# Or use Docker Compose
docker-compose up -d
```

## 🔗 Integration Methods

### **Method 1: Direct HTTP API Calls**

#### Python Integration
```python
import requests

# Grade a single submission
response = requests.post('http://localhost:8000/api/grade-submission', json={
    "content": "Your essay content here...",
    "student_id": "student-123",
    "assignment_id": "assignment-456",
    "rubric": {
        "content": {"max_points": 30, "min_words": 100},
        "structure": {"max_points": 25},
        "grammar": {"max_points": 20},
        "argument": {"max_points": 25}
    }
})

result = response.json()
print(f"Score: {result['total_score']}%")
```

#### JavaScript/Node.js Integration
```javascript
const axios = require('axios');

async function gradeEssay(content, studentId, assignmentId, rubric) {
    try {
        const response = await axios.post('http://localhost:8000/api/grade-submission', {
            content,
            student_id: studentId,
            assignment_id: assignmentId,
            rubric,
            assignment_type: 'essay'
        });
        return response.data;
    } catch (error) {
        console.error('Grading failed:', error.response.data);
    }
}
```

#### PHP Integration
```php
<?php
function gradeSubmission($content, $studentId, $assignmentId, $rubric) {
    $url = 'http://localhost:8000/api/grade-submission';
    $data = json_encode([
        'content' => $content,
        'student_id' => $studentId,
        'assignment_id' => $assignmentId,
        'rubric' => $rubric,
        'assignment_type' => 'essay'
    ]);
    
    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'POST',
            'content' => $data
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    return json_decode($result, true);
}
?>
```

### **Method 2: Using the Python Client**

```python
from integration_examples import GradingAPIClient

# Initialize client
api = GradingAPIClient("http://localhost:8000")

# Check if API is running
health = api.health_check()
print(f"API Status: {health['status']}")

# Grade a submission
result = api.grade_submission(
    content="Your essay content...",
    student_id="student-123",
    assignment_id="assignment-456",
    rubric={
        "content": {"max_points": 30, "min_words": 100},
        "structure": {"max_points": 25},
        "grammar": {"max_points": 20},
        "argument": {"max_points": 25}
    }
)

print(f"Score: {result['total_score']}%")
print(f"Confidence: {result['confidence'] * 100}%")
```

## 📊 API Endpoints

### **POST /api/grade-submission**
Grade a single submission.

**Request Body:**
```json
{
    "content": "Essay content to grade",
    "student_id": "unique-student-id",
    "assignment_id": "unique-assignment-id",
    "rubric": {
        "content": {"max_points": 30, "min_words": 100},
        "structure": {"max_points": 25},
        "grammar": {"max_points": 20},
        "argument": {"max_points": 25}
    },
    "assignment_type": "essay"
}
```

**Response:**
```json
{
    "success": true,
    "total_score": 85.5,
    "criteria_scores": {
        "content": {
            "score": 25.5,
            "max_score": 30,
            "feedback": "Strong content with good development",
            "percentage": 85.0
        }
    },
    "feedback": "Overall feedback...",
    "strengths": ["Excellent structure", "Strong grammar"],
    "improvements": ["Focus on improving argument"],
    "plagiarism_result": {
        "similarity_score": 5.2,
        "is_suspicious": false,
        "suspicious_segments": [],
        "matched_sources": []
    },
    "confidence": 0.89
}
```

### **POST /api/batch-grade**
Grade multiple submissions at once.

**Request Body:**
```json
[
    {
        "content": "First essay...",
        "student_id": "student-1",
        "assignment_id": "assignment-1",
        "rubric": {...}
    },
    {
        "content": "Second essay...",
        "student_id": "student-2",
        "assignment_id": "assignment-2",
        "rubric": {...}
    }
]
```

### **GET /health**
Check API health status.

**Response:**
```json
{
    "status": "healthy",
    "service": "CHECKmate AI Grading API",
    "version": "2.0.0",
    "timestamp": "2025-10-10T10:00:00.000Z",
    "uptime": 3600.5
}
```

## 🏗️ Integration Patterns

### **1. LMS Integration (Canvas, Blackboard, Moodle)**
- Use webhooks to trigger grading when assignments are submitted
- Store results in your LMS gradebook
- Display detailed feedback to students

### **2. Custom Learning Platform**
- Integrate directly into your frontend
- Real-time grading with progress indicators
- Batch processing for large classes

### **3. Microservices Architecture**
- Deploy as a standalone service
- Use service discovery for dynamic routing
- Implement circuit breakers for reliability

### **4. Serverless Integration**
- Deploy to AWS Lambda, Azure Functions, or Google Cloud Functions
- Use API Gateway for request routing
- Scale automatically based on demand

## 🔧 Configuration Options

### **Environment Variables**
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Performance
MAX_BATCH_SIZE=50
REQUEST_TIMEOUT=30
```

### **Docker Environment**
```yaml
# docker-compose.yml
environment:
  - API_HOST=0.0.0.0
  - API_PORT=8000
  - LOG_LEVEL=INFO
```

## 📈 Performance Considerations

### **Scaling Options**
1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Caching**: Cache rubric configurations and common responses
3. **Async Processing**: Use background tasks for large batch operations
4. **Database Integration**: Store results for faster retrieval

### **Monitoring**
- Health check endpoint: `/health`
- Metrics endpoint: `/api/stats`
- Request logging with timing information
- Error tracking and alerting

## 🛡️ Security Considerations

### **Authentication (Optional)**
```python
# Add to main.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(token: str = Depends(security)):
    # Implement your token verification logic
    if not verify_jwt_token(token.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    return token.credentials

# Protect endpoints
@app.post("/api/grade-submission", dependencies=[Depends(verify_token)])
```

### **Rate Limiting**
```python
# Add rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/grade-submission")
@limiter.limit("10/minute")
async def grade_submission(request: Request, ...):
    # Your grading logic
```

## 🚀 Deployment Options

### **1. Cloud Platforms**
- **AWS**: ECS, Lambda, or EC2
- **Azure**: Container Instances, App Service, or Functions
- **Google Cloud**: Cloud Run, Compute Engine, or Functions
- **Heroku**: Simple deployment with Procfile

### **2. On-Premises**
- **Docker**: Use provided Dockerfile
- **Kubernetes**: Deploy with Helm charts
- **Traditional VPS**: Direct Python deployment

### **3. Serverless**
- **AWS Lambda**: Use Mangum adapter
- **Azure Functions**: Use Azure Functions Python worker
- **Vercel**: Deploy as serverless function

## 📝 Example Integrations

See the following files for complete examples:
- `integration_examples.py` - Python client and examples
- `javascript_integration.js` - Node.js/JavaScript examples
- `php_integration.php` - PHP examples
- `csharp_integration.cs` - C# examples

## 🆘 Support

For integration support:
1. Check the API documentation at `http://localhost:8000/docs`
2. Review the test file `test_grading.py` for usage examples
3. Check the logs in `api.log` for debugging information

## 🔄 Updates and Maintenance

- The API is designed to be backward compatible
- New features are added through new endpoints
- Existing endpoints maintain their contract
- Version information available at `/health` endpoint
