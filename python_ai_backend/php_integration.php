
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
echo "API Status: " . $health['status'] . "
";
?>
