
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
