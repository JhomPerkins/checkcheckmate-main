import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface AIProcessingStatusProps {
  submissionId: string;
  onComplete?: (result: any) => void;
}

export function AIProcessingStatus({ submissionId, onComplete }: AIProcessingStatusProps) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'error'>('processing');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing AI analysis...');
  const [result, setResult] = useState<any>(null);

  const steps = [
    'Initializing AI analysis...',
    'Analyzing content structure...',
    'Evaluating grammar and style...',
    'Checking for plagiarism...',
    'Generating detailed feedback...',
    'Calculating final scores...',
    'Finalizing results...'
  ];

  useEffect(() => {
    let stepIndex = 0;
    let progressValue = 0;

    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        progressValue = (stepIndex / steps.length) * 100;
        setCurrentStep(steps[stepIndex]);
        setProgress(progressValue);
      } else {
        // Simulate API call to get actual results
        fetch(`/api/submissions/${submissionId}/ai-result`)
          .then(response => response.json())
          .then(data => {
            setStatus('completed');
            setProgress(100);
            setResult(data);
            onComplete?.(data);
          })
          .catch(error => {
            setStatus('error');
            setCurrentStep('Error processing with AI');
          });
        clearInterval(interval);
      }
    }, 2000); // 2 seconds per step

    return () => clearInterval(interval);
  }, [submissionId, onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Brain className="h-6 w-6 animate-pulse text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={`${getStatusColor()} transition-all duration-500`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">
                {status === 'processing' && 'AI Analysis in Progress'}
                {status === 'completed' && 'AI Analysis Complete'}
                {status === 'error' && 'AI Analysis Failed'}
              </h3>
              {status === 'processing' && (
                <Badge variant="outline" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Processing
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{currentStep}</p>
            
            <Progress value={progress} className="h-2" />
            
            {status === 'completed' && result && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Final Score:</span>
                  <span className="text-xl font-bold text-green-600">
                    {result.total_score}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(result.confidence * 100)}% • 
                  Processing Time: {result.metadata?.processing_time}s
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
