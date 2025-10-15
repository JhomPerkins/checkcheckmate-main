/**
 * AI INTEGRATION COMPONENT FOR CHECKMATE
 * Easy-to-use React components for AI features
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, CheckCircle, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIGradingResult {
  success: boolean;
  total_score: number;
  criteria_scores: Record<string, any>;
  feedback: string;
  content_analysis: ContentAnalysis;
  confidence: number;
  grading_method: string;
  metadata: {
    processing_time: number;
    cost: string;
    timestamp: string;
  };
}

interface PlagiarismResult {
  similarity_scores: number[];
  matches: PlagiarismMatch[];
  highest_similarity: number;
  is_flagged: boolean;
  ai_detection: AIDetection;
  detection_method: string;
  metadata: {
    processing_time: number;
    cost: string;
    timestamp: string;
  };
}

interface ContentAnalysis {
  word_count: number;
  sentence_count: number;
  readability_score: number;
  sentiment: string;
  complexity_score: number;
  avg_words_per_sentence: number;
}

interface PlagiarismMatch {
  submission_id: string;
  student_id: string;
  similarity: number;
  content_preview: string;
}

interface AIDetection {
  is_ai_generated: boolean;
  ai_confidence: number;
  indicators: Record<string, boolean>;
}

// AI Grading Component
export function AIGradingComponent({ 
  submissionContent, 
  assignmentId, 
  studentId,
  onGradeComplete 
}: {
  submissionContent: string;
  assignmentId: string;
  studentId: string;
  onGradeComplete?: (result: AIGradingResult) => void;
}) {
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<AIGradingResult | null>(null);
  const [rubric, setRubric] = useState({
    content_quality: { max_points: 40 },
    grammar: { max_points: 30 },
    creativity: { max_points: 30 }
  });

  const handleAIGrading = async () => {
    setIsGrading(true);
    try {
      const response = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: submissionContent,
          student_id: studentId,
          assignment_id: assignmentId,
          rubric: rubric
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGradingResult(result);
        onGradeComplete?.(result);
        toast({
          title: "AI Grading Complete",
          description: `Grade: ${result.total_score}/100 (${result.confidence * 100}% confidence)`,
        });
      } else {
        throw new Error(result.error || 'Grading failed');
      }
    } catch (error) {
      toast({
        title: "Grading Error",
        description: "Failed to grade with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Grading
          <Badge variant="secondary">FREE</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rubric Configuration */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="content-quality">Content Quality</Label>
            <Input
              id="content-quality"
              type="number"
              value={rubric.content_quality.max_points}
              onChange={(e) => setRubric(prev => ({
                ...prev,
                content_quality: { max_points: parseInt(e.target.value) || 40 }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="grammar">Grammar</Label>
            <Input
              id="grammar"
              type="number"
              value={rubric.grammar.max_points}
              onChange={(e) => setRubric(prev => ({
                ...prev,
                grammar: { max_points: parseInt(e.target.value) || 30 }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="creativity">Creativity</Label>
            <Input
              id="creativity"
              type="number"
              value={rubric.creativity.max_points}
              onChange={(e) => setRubric(prev => ({
                ...prev,
                creativity: { max_points: parseInt(e.target.value) || 30 }
              }))}
            />
          </div>
        </div>

        {/* Grade Button */}
        <Button 
          onClick={handleAIGrading} 
          disabled={isGrading || !submissionContent}
          className="w-full"
        >
          {isGrading ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              AI Grading...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Grade with AI
            </>
          )}
        </Button>

        {/* Results */}
        {gradingResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Grade: {gradingResult.total_score}/100</strong>
                <br />
                Confidence: {Math.round(gradingResult.confidence * 100)}%
                <br />
                Processing Time: {gradingResult.metadata.processing_time}s
                <br />
                Cost: {gradingResult.metadata.cost}
              </AlertDescription>
            </Alert>

            {/* Rubric Scores */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(gradingResult.criteria_scores).map(([criterion, score]) => (
                <div key={criterion} className="text-center p-2 border rounded">
                  <div className="font-medium capitalize">{criterion.replace('_', ' ')}</div>
                  <div className="text-2xl font-bold text-blue-600">{score.score}</div>
                  <div className="text-sm text-gray-500">/100</div>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div>
              <h4 className="font-medium mb-2">AI Feedback:</h4>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {gradingResult.feedback}
              </div>
            </div>

            {/* Content Analysis */}
            <div>
              <h4 className="font-medium mb-2">Content Analysis:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Words: {gradingResult.content_analysis.word_count}</div>
                <div>Sentences: {gradingResult.content_analysis.sentence_count}</div>
                <div>Readability: {gradingResult.content_analysis.readability_score}</div>
                <div>Sentiment: {gradingResult.content_analysis.sentiment}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Plagiarism Detection Component
export function PlagiarismDetectionComponent({
  content,
  assignmentId,
  studentId
}: {
  content: string;
  assignmentId: string;
  studentId: string;
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);

  const handlePlagiarismCheck = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/ai/detect-plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          assignment_id: assignmentId,
          student_id: studentId
        })
      });

      const result = await response.json();
      setPlagiarismResult(result);
      
      if (result.is_flagged) {
        toast({
          title: "Plagiarism Detected",
          description: `${result.highest_similarity}% similarity found`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Plagiarism Detected",
          description: "Content appears to be original",
        });
      }
    } catch (error) {
      toast({
        title: "Plagiarism Check Error",
        description: "Failed to check for plagiarism. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Plagiarism Detection
          <Badge variant="secondary">FREE</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handlePlagiarismCheck} 
          disabled={isChecking || !content}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Check for Plagiarism
            </>
          )}
        </Button>

        {plagiarismResult && (
          <div className="space-y-4">
            <Alert className={plagiarismResult.is_flagged ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              {plagiarismResult.is_flagged ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>
                  {plagiarismResult.is_flagged ? 'Plagiarism Detected!' : 'No Plagiarism Found'}
                </strong>
                <br />
                Highest Similarity: {Math.round(plagiarismResult.highest_similarity * 100)}%
                <br />
                Processing Time: {plagiarismResult.metadata.processing_time}s
                <br />
                Cost: {plagiarismResult.metadata.cost}
              </AlertDescription>
            </Alert>

            {/* AI Detection */}
            {plagiarismResult.ai_detection && (
              <div>
                <h4 className="font-medium mb-2">AI Content Detection:</h4>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4" />
                    <span className="font-medium">
                      {plagiarismResult.ai_detection.is_ai_generated ? 'AI Generated' : 'Human Written'}
                    </span>
                    <Badge variant={plagiarismResult.ai_detection.is_ai_generated ? "destructive" : "secondary"}>
                      {Math.round(plagiarismResult.ai_detection.ai_confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {Object.entries(plagiarismResult.ai_detection.indicators).map(([indicator, detected]) => (
                      <div key={indicator} className="flex items-center gap-2">
                        <span className={detected ? "text-red-600" : "text-green-600"}>
                          {detected ? "⚠️" : "✅"}
                        </span>
                        <span className="capitalize">{indicator.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Similar Matches */}
            {plagiarismResult.matches.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Similar Submissions:</h4>
                <div className="space-y-2">
                  {plagiarismResult.matches.map((match, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Student {match.student_id}</span>
                        <Badge variant={match.similarity > 0.9 ? "destructive" : "secondary"}>
                          {Math.round(match.similarity * 100)}% similar
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {match.content_preview}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Content Analysis Component
export function ContentAnalysisComponent({ content }: { content: string }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ content_analysis: ContentAnalysis } | null>(null);

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/ai/analyze-content?content=${encodeURIComponent(content)}`);
      const result = await response.json();
      setAnalysis(result);
      
      toast({
        title: "Content Analysis Complete",
        description: `Readability: ${result.content_analysis.readability_score}`,
      });
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to analyze content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Content Analysis
          <Badge variant="secondary">FREE</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAnalysis} 
          disabled={isAnalyzing || !content}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Content
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.content_analysis.word_count}</div>
                <div className="text-sm text-gray-500">Words</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysis.content_analysis.sentence_count}</div>
                <div className="text-sm text-gray-500">Sentences</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analysis.content_analysis.readability_score}</div>
                <div className="text-sm text-gray-500">Readability</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analysis.content_analysis.complexity_score}</div>
                <div className="text-sm text-gray-500">Complexity</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Sentiment:</strong> {analysis.content_analysis.sentiment}
              </div>
              <div>
                <strong>Avg Words/Sentence:</strong> {analysis.content_analysis.avg_words_per_sentence}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
