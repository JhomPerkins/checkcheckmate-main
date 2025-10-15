import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { Brain, Settings, Zap, AlertCircle, CheckCircle, Clock, BarChart3, RefreshCw } from 'lucide-react';

interface LLMStatus {
  configured: boolean;
  model: string;
  provider: string;
}

interface LLMAnalytics {
  totalSubmissions: number;
  aiGradedSubmissions: number;
  aiUsagePercentage: number;
  avgConfidence: number;
  avgProcessingTime: number;
  plagiarismDetected: number;
  llmStatus: LLMStatus;
  timestamp: string;
}

export const LLMManager: React.FC = () => {
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [analytics, setAnalytics] = useState<LLMAnalytics | null>(null);
  const [testSubmission, setTestSubmission] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLLMStatus();
    fetchAnalytics();
  }, []);

  const fetchLLMStatus = async () => {
    try {
      const response = await fetch('/api/llm/status');
      const data = await response.json();
      // Use the primary status from the API response
      setLlmStatus(data.primary || data);
    } catch (error) {
      console.error('Error fetching LLM status:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/llm/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching LLM analytics:', error);
    }
  };

  const testLLMGrading = async () => {
    if (!testSubmission.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test submission",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/llm/grade-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: 'test-assignment',
          submissionText: testSubmission,
          maxPoints: 100
        })
      });

      const result = await response.json();
      setTestResult(result);
      
      toast({
        title: "LLM Test Complete",
        description: `Grade: ${result.grade}/100 (Confidence: ${result.confidence}%)`,
      });
    } catch (error) {
      console.error('Error testing LLM:', error);
      toast({
        title: "Error",
        description: "Failed to test LLM functionality",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPlagiarismDetection = async () => {
    if (!testSubmission.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test submission",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/llm/detect-plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionText: testSubmission
        })
      });

      const result = await response.json();
      setTestResult(result);
      
      toast({
        title: "Plagiarism Detection Complete",
        description: `Result: ${result.isPlagiarized ? 'Plagiarized' : 'Original'} (Confidence: ${result.confidence}%)`,
      });
    } catch (error) {
      console.error('Error testing plagiarism detection:', error);
      toast({
        title: "Error",
        description: "Failed to test plagiarism detection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* LLM Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>LLM Status</span>
              {llmStatus && (
                <Badge variant={llmStatus.configured ? "default" : "secondary"}>
                  {llmStatus.configured ? "Active" : "Fallback Mode"}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => { fetchLLMStatus(); fetchAnalytics(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {llmStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Provider</Label>
                <p className="text-sm text-muted-foreground">{llmStatus.provider}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Model</Label>
                <p className="text-sm text-muted-foreground">{llmStatus.model}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center space-x-2">
                  {llmStatus.configured ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{llmStatus.configured ? "Active" : "Using Fallback"}</span>
                </div>
                {llmStatus.cost && (
                  <div className="mt-1">
                    <span className="text-xs text-green-600 font-medium">{llmStatus.cost}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading LLM status...</p>
          )}
        </CardContent>
      </Card>

      {/* LLM Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>LLM Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.totalSubmissions}</div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.aiGradedSubmissions}</div>
                <p className="text-sm text-muted-foreground">AI Graded</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(analytics.avgConfidence)}%</div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analytics.avgProcessingTime}ms</div>
                <p className="text-sm text-muted-foreground">Avg Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LLM Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>LLM Test Interface</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-submission">Test Submission</Label>
            <Textarea
              id="test-submission"
              placeholder="Enter a sample student submission to test LLM functionality..."
              value={testSubmission}
              onChange={(e) => setTestSubmission(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={testLLMGrading} 
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Test Grading</span>
            </Button>
            <Button 
              onClick={testPlagiarismDetection} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Test Plagiarism</span>
            </Button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Test Result:</h4>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Setup Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">100% FREE Local LLM System:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>✅ No API keys required - completely free forever</li>
              <li>✅ Runs entirely on your server - no external services</li>
              <li>✅ Uses real AI models (DistilBERT + MiniLM-L6)</li>
              <li>✅ First run downloads models (~330MB, cached forever)</li>
              <li>✅ Works offline after initial setup</li>
            </ol>
          </div>
          
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">100% Free System</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              CHECKmate uses Transformers.js with real transformer neural networks (same technology as ChatGPT). 
              These are open-source models from Microsoft and Hugging Face. Zero cost, zero API keys, unlimited usage!
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Models Used</span>
            </div>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li><strong>DistilBERT:</strong> 66M parameters - Sentiment analysis & quality assessment</li>
              <li><strong>MiniLM-L6:</strong> 23M parameters - Semantic similarity & plagiarism detection</li>
            </ul>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
