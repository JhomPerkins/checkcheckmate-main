import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Brain, FileText, TrendingUp, TrendingDown } from 'lucide-react';

interface AdvancedAIResultsProps {
  aiResult?: {
    success: boolean;
    total_score: number;
    criteria_scores: Record<string, any>;
    feedback: string;
    strengths: string[];
    improvements: string[];
    plagiarism_result: {
      similarity_score: number;
      is_suspicious: boolean;
      analysis: string;
    };
    confidence: number;
    metadata: {
      processing_time: number;
      word_count: number;
      timestamp: string;
    };
  };
  loading?: boolean;
}

export function AdvancedAIResults({ aiResult, loading }: AdvancedAIResultsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-4">Processing with Advanced AI...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aiResult) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No AI analysis available for this submission</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Grading Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Overall Score:</span>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${getScoreColor(aiResult.total_score)}`}>
                {aiResult.total_score.toFixed(1)}%
              </span>
              <Badge className={getScoreBadge(aiResult.total_score)}>
                {aiResult.confidence * 100}% Confidence
              </Badge>
            </div>
          </div>
          <Progress value={aiResult.total_score} className="h-3" />
          <div className="mt-4 text-sm text-gray-600">
            <p>📊 {aiResult.metadata.word_count} words • ⏱️ {aiResult.metadata.processing_time}s processing time</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Criteria Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Rubric Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(aiResult.criteria_scores).map(([criterion, scores]) => (
              <div key={criterion} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium capitalize">
                    {criterion.replace('_', ' ')}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(scores.percentage)}`}>
                      {scores.score}/{scores.max_score}
                    </span>
                    <Badge variant="outline">
                      {scores.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={scores.percentage} className="h-2 mb-2" />
                <p className="text-sm text-gray-600">{scores.feedback}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plagiarism Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plagiarism Analysis
            {aiResult.plagiarism_result.is_suspicious && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Flagged
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className={aiResult.plagiarism_result.is_suspicious ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            {aiResult.plagiarism_result.is_suspicious ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <strong>Similarity Score: {aiResult.plagiarism_result.similarity_score}%</strong>
              <br />
              {aiResult.plagiarism_result.analysis}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiResult.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiResult.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {aiResult.improvements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <TrendingDown className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiResult.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Detailed Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
              {aiResult.feedback}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
