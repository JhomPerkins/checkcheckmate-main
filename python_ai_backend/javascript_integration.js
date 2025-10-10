
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
