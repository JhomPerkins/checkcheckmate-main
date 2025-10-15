import { GoogleGenerativeAI } from '@google/generative-ai';

export interface LLMGradingResult {
  grade: number;
  feedback: string;
  confidence: number;
  processingTime: number;
  reasoning: string;
}

export interface LLMPlagiarismResult {
  isPlagiarized: boolean;
  confidence: number;
  similarityPercentage: number;
  detectedSources: string[];
  processingTime: number;
  analysis: string;
}

export interface LLMContentAnalysis {
  quality: number;
  grammar: number;
  clarity: number;
  originality: number;
  suggestions: string[];
  processingTime: number;
}

class GeminiLLMService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        console.log('⚠️  Gemini API key not found. LLM features will use fallback methods.');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isConfigured = true;
      console.log('✅ Gemini LLM initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini LLM:', error);
      this.isConfigured = false;
    }
  }

  async gradeAssignment(
    assignmentTitle: string,
    assignmentDescription: string,
    studentSubmission: string,
    maxPoints: number = 100
  ): Promise<LLMGradingResult> {
    const startTime = Date.now();

    if (!this.isConfigured || !this.model) {
      return this.fallbackGrading(studentSubmission, maxPoints, startTime);
    }

    try {
      const prompt = `
You are an expert educator grading this assignment. Please provide a comprehensive evaluation.

Assignment: ${assignmentTitle}
Description: ${assignmentDescription}
Max Points: ${maxPoints}

Student Submission:
${studentSubmission}

Please provide your evaluation in the following JSON format:
{
  "grade": [number between 0 and ${maxPoints}],
  "feedback": "[detailed feedback for the student]",
  "confidence": [number between 0 and 100 representing your confidence in this grade],
  "reasoning": "[brief explanation of your grading rationale]"
}

Focus on:
1. Content accuracy and relevance
2. Writing quality and clarity
3. Completeness of response
4. Critical thinking and analysis
5. Grammar and structure
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const gradingData = this.parseJSONResponse(text);
      
      const processingTime = Date.now() - startTime;
      
      return {
        grade: gradingData.grade || this.fallbackGrading(studentSubmission, maxPoints, startTime).grade,
        feedback: gradingData.feedback || 'No specific feedback available.',
        confidence: gradingData.confidence || 75,
        processingTime,
        reasoning: gradingData.reasoning || 'AI-generated evaluation'
      };

    } catch (error) {
      console.error('Error in Gemini grading:', error);
      return this.fallbackGrading(studentSubmission, maxPoints, startTime);
    }
  }

  async detectPlagiarism(
    studentSubmission: string,
    referenceTexts: string[] = []
  ): Promise<LLMPlagiarismResult> {
    const startTime = Date.now();

    if (!this.isConfigured || !this.model) {
      return this.fallbackPlagiarismDetection(studentSubmission, startTime);
    }

    try {
      const prompt = `
You are a plagiarism detection expert. Analyze this student submission for potential plagiarism.

Student Submission:
${studentSubmission}

${referenceTexts.length > 0 ? `
Reference Texts to Compare Against:
${referenceTexts.map((text, index) => `${index + 1}. ${text.substring(0, 200)}...`).join('\n')}
` : ''}

Please provide your analysis in the following JSON format:
{
  "isPlagiarized": [true/false],
  "confidence": [number between 0 and 100],
  "similarityPercentage": [number between 0 and 100],
  "detectedSources": ["list of potential sources if any"],
  "analysis": "[detailed analysis of your findings]"
}

Look for:
1. Direct copying of text
2. Paraphrasing without proper attribution
3. Suspiciously similar sentence structures
4. Unusual vocabulary choices for the student's level
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const plagiarismData = this.parseJSONResponse(text);
      const processingTime = Date.now() - startTime;
      
      return {
        isPlagiarized: plagiarismData.isPlagiarized || false,
        confidence: plagiarismData.confidence || 85,
        similarityPercentage: plagiarismData.similarityPercentage || 0,
        detectedSources: plagiarismData.detectedSources || [],
        processingTime,
        analysis: plagiarismData.analysis || 'AI plagiarism analysis completed'
      };

    } catch (error) {
      console.error('Error in Gemini plagiarism detection:', error);
      return this.fallbackPlagiarismDetection(studentSubmission, startTime);
    }
  }

  async analyzeContent(
    studentSubmission: string
  ): Promise<LLMContentAnalysis> {
    const startTime = Date.now();

    if (!this.isConfigured || !this.model) {
      return this.fallbackContentAnalysis(studentSubmission, startTime);
    }

    try {
      const prompt = `
You are a writing instructor analyzing this student's work. Provide a comprehensive content analysis.

Student Submission:
${studentSubmission}

Please provide your analysis in the following JSON format:
{
  "quality": [number between 0 and 100 for overall quality],
  "grammar": [number between 0 and 100 for grammar and mechanics],
  "clarity": [number between 0 and 100 for clarity and coherence],
  "originality": [number between 0 and 100 for originality and creativity],
  "suggestions": ["list of specific improvement suggestions"]
}

Evaluate:
1. Writing quality and style
2. Grammar and mechanics
3. Clarity and organization
4. Originality and critical thinking
5. Areas for improvement
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const analysisData = this.parseJSONResponse(text);
      const processingTime = Date.now() - startTime;
      
      return {
        quality: analysisData.quality || 75,
        grammar: analysisData.grammar || 80,
        clarity: analysisData.clarity || 75,
        originality: analysisData.originality || 70,
        suggestions: analysisData.suggestions || ['Continue practicing writing skills'],
        processingTime
      };

    } catch (error) {
      console.error('Error in Gemini content analysis:', error);
      return this.fallbackContentAnalysis(studentSubmission, startTime);
    }
  }

  private parseJSONResponse(text: string): any {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return {};
    }
  }

  private fallbackGrading(submission: string, maxPoints: number, startTime: number): LLMGradingResult {
    // Fallback grading using heuristics
    const wordCount = submission.split(' ').length;
    const hasCapitalization = /[A-Z]/.test(submission);
    const hasPunctuation = /[.!?]/.test(submission);
    
    let grade = Math.min(maxPoints, Math.max(0, (wordCount * 0.5) + (hasCapitalization ? 10 : 0) + (hasPunctuation ? 10 : 0)));
    
    return {
      grade: Math.round(grade),
      feedback: 'Automated grading using heuristic analysis. For detailed feedback, please enable Gemini LLM.',
      confidence: 60,
      processingTime: Date.now() - startTime,
      reasoning: 'Fallback grading algorithm applied'
    };
  }

  private fallbackPlagiarismDetection(submission: string, startTime: number): LLMPlagiarismResult {
    // Simple plagiarism detection using text patterns
    const words = submission.split(' ');
    const uniqueWords = new Set(words);
    const uniqueness = (uniqueWords.size / words.length) * 100;
    
    return {
      isPlagiarized: uniqueness < 30,
      confidence: 70,
      similarityPercentage: Math.max(0, 100 - uniqueness),
      detectedSources: [],
      processingTime: Date.now() - startTime,
      analysis: 'Basic plagiarism analysis using text uniqueness patterns'
    };
  }

  private fallbackContentAnalysis(submission: string, startTime: number): LLMContentAnalysis {
    const wordCount = submission.split(' ').length;
    const sentenceCount = submission.split(/[.!?]/).length - 1;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    return {
      quality: Math.min(100, Math.max(0, (wordCount * 0.5) + (avgWordsPerSentence * 0.3))),
      grammar: 75,
      clarity: Math.min(100, avgWordsPerSentence * 2),
      originality: 70,
      suggestions: ['Enable Gemini LLM for detailed analysis and feedback'],
      processingTime: Date.now() - startTime
    };
  }

  isLLMConfigured(): boolean {
    return this.isConfigured;
  }

  getLLMStatus(): { configured: boolean; model: string; provider: string } {
    return {
      configured: this.isConfigured,
      model: this.isConfigured ? 'gemini-1.5-flash' : 'fallback-heuristics',
      provider: this.isConfigured ? 'Google Gemini' : 'Built-in Algorithms'
    };
  }
}

export const geminiLLM = new GeminiLLMService();
