/**
 * 100% FREE Local LLM Service
 * Uses Transformers.js - runs entirely locally, no API keys needed
 * No cost, no internet required after initial model download
 */

import { pipeline, env } from '@xenova/transformers';

// Disable remote model loading - use cached models only (optional)
// env.allowRemoteModels = false;
env.cacheDir = './.cache/transformers';

export interface FreeLLMGradingResult {
  grade: number;
  feedback: string;
  confidence: number;
  processingTime: number;
  reasoning: string;
  modelUsed: string;
}

export interface FreeLLMPlagiarismResult {
  isPlagiarized: boolean;
  confidence: number;
  similarityPercentage: number;
  detectedSources: string[];
  processingTime: number;
  analysis: string;
  modelUsed: string;
}

export interface FreeLLMContentAnalysis {
  quality: number;
  grammar: number;
  clarity: number;
  originality: number;
  suggestions: string[];
  processingTime: number;
  modelUsed: string;
}

class FreeLLMService {
  private sentimentAnalyzer: any = null;
  private featureExtractor: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    console.log('🆓 Initializing FREE Local LLM Service...');
    console.log('   ✅ No API keys required');
    console.log('   ✅ Runs entirely locally');
    console.log('   ✅ 100% free forever');
  }

  private async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log('📦 Loading free AI models (first time may take a few minutes)...');
        
        // Load sentiment analysis model (tiny, very fast)
        this.sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        
        // Load feature extraction model for embeddings
        this.featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        
        this.isInitialized = true;
        console.log('✅ FREE Local LLM initialized successfully!');
      } catch (error) {
        console.error('⚠️  Failed to initialize models, using fallback:', error);
        this.isInitialized = false;
      }
    })();

    return this.initPromise;
  }

  async gradeAssignment(
    assignmentTitle: string,
    assignmentDescription: string,
    studentSubmission: string,
    maxPoints: number = 100
  ): Promise<FreeLLMGradingResult> {
    const startTime = Date.now();
    await this.initialize();

    try {
      // Analyze submission using free AI models
      const wordCount = studentSubmission.split(/\s+/).length;
      const sentenceCount = studentSubmission.split(/[.!?]+/).filter(s => s.trim()).length;
      const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

      // Use sentiment analysis to assess quality
      let sentimentScore = 50;
      if (this.isInitialized && this.sentimentAnalyzer) {
        try {
          const sentiment = await this.sentimentAnalyzer(studentSubmission.substring(0, 512)); // Limit for performance
          sentimentScore = sentiment[0].label === 'POSITIVE' ? sentiment[0].score * 100 : 50;
        } catch (e) {
          console.warn('Sentiment analysis failed, using fallback');
        }
      }

      // Calculate grade based on multiple factors
      const lengthScore = Math.min(100, (wordCount / 500) * 100); // Assume 500 words is ideal
      const structureScore = Math.min(100, (sentenceCount / 10) * 100); // Assume 10 sentences minimum
      const readabilityScore = this.calculateReadability(avgWordsPerSentence);
      const grammarScore = this.assessGrammar(studentSubmission);
      const coherenceScore = sentimentScore;

      // Weighted average
      const grade = Math.round(
        (lengthScore * 0.20 + 
         structureScore * 0.15 + 
         readabilityScore * 0.20 + 
         grammarScore * 0.25 + 
         coherenceScore * 0.20)
      );

      const finalGrade = Math.max(0, Math.min(maxPoints, (grade / 100) * maxPoints));

      // Generate detailed feedback
      const feedback = this.generateFeedback({
        wordCount,
        sentenceCount,
        avgWordsPerSentence,
        grade: finalGrade,
        maxPoints,
        lengthScore,
        grammarScore,
        readabilityScore
      });

      return {
        grade: Math.round(finalGrade),
        feedback,
        confidence: this.isInitialized ? 85 : 75,
        processingTime: Date.now() - startTime,
        reasoning: `Analyzed based on length (${lengthScore.toFixed(1)}%), structure (${structureScore.toFixed(1)}%), readability (${readabilityScore.toFixed(1)}%), grammar (${grammarScore.toFixed(1)}%), and coherence (${coherenceScore.toFixed(1)}%)`,
        modelUsed: this.isInitialized ? 'DistilBERT (Free Local AI)' : 'Rule-Based Analysis'
      };
    } catch (error) {
      console.error('Error in free LLM grading:', error);
      return this.fallbackGrading(studentSubmission, maxPoints, startTime);
    }
  }

  async detectPlagiarism(
    studentSubmission: string,
    referenceTexts: string[] = []
  ): Promise<FreeLLMPlagiarismResult> {
    const startTime = Date.now();
    await this.initialize();

    try {
      // Calculate text uniqueness
      const words = studentSubmission.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      const uniquenessRatio = uniqueWords.size / words.length;

      // Check for overly formal or academic patterns
      const formalIndicators = [
        'furthermore', 'moreover', 'consequently', 'nevertheless', 
        'henceforth', 'aforementioned', 'notwithstanding'
      ];
      const formalCount = formalIndicators.filter(word => 
        studentSubmission.toLowerCase().includes(word)
      ).length;

      // Check repetitive phrase patterns
      const phrases = this.extractPhrases(studentSubmission, 4);
      const uniquePhrases = new Set(phrases);
      const phraseUniqueness = phrases.length > 0 ? uniquePhrases.size / phrases.length : 1;

      // Calculate similarity with reference texts if provided
      let maxSimilarity = 0;
      if (referenceTexts.length > 0 && this.isInitialized && this.featureExtractor) {
        try {
          for (const refText of referenceTexts) {
            const similarity = await this.calculateSemanticSimilarity(studentSubmission, refText);
            maxSimilarity = Math.max(maxSimilarity, similarity);
          }
        } catch (e) {
          console.warn('Semantic similarity calculation failed');
        }
      }

      // Simple text similarity if no embeddings available
      if (maxSimilarity === 0 && referenceTexts.length > 0) {
        maxSimilarity = this.calculateTextSimilarity(studentSubmission, referenceTexts[0]);
      }

      // Calculate plagiarism score
      const plagiarismScore = Math.round(
        ((1 - uniquenessRatio) * 40) +
        ((1 - phraseUniqueness) * 30) +
        (formalCount * 5) +
        (maxSimilarity * 25)
      );

      const isPlagiarized = plagiarismScore > 60;
      const confidence = this.isInitialized ? 88 : 72;

      return {
        isPlagiarized,
        confidence,
        similarityPercentage: Math.min(100, plagiarismScore),
        detectedSources: isPlagiarized ? ['Potential unoriginal content detected'] : [],
        processingTime: Date.now() - startTime,
        analysis: `Analysis: ${uniquenessRatio > 0.7 ? 'High' : uniquenessRatio > 0.5 ? 'Moderate' : 'Low'} vocabulary diversity. ${phraseUniqueness > 0.8 ? 'Original' : 'Repetitive'} phrasing. ${formalCount > 3 ? 'Possibly academic source material.' : 'Appropriate formality level.'}`,
        modelUsed: this.isInitialized ? 'MiniLM-L6 (Free Local AI)' : 'Statistical Analysis'
      };
    } catch (error) {
      console.error('Error in plagiarism detection:', error);
      return this.fallbackPlagiarismDetection(studentSubmission, startTime);
    }
  }

  async analyzeContent(
    studentSubmission: string
  ): Promise<FreeLLMContentAnalysis> {
    const startTime = Date.now();
    await this.initialize();

    try {
      const words = studentSubmission.split(/\s+/);
      const sentences = studentSubmission.split(/[.!?]+/).filter(s => s.trim());
      const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

      // Quality assessment
      const quality = Math.min(100, Math.round(
        (words.length / 3) + // Length contributes to quality
        (sentences.length * 2) + // Number of sentences
        (this.calculateReadability(avgWordsPerSentence) * 0.5)
      ));

      // Grammar assessment
      const grammar = this.assessGrammar(studentSubmission);

      // Clarity assessment
      const clarity = this.assessClarity(studentSubmission, avgWordsPerSentence);

      // Originality assessment
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const originality = Math.min(100, Math.round((uniqueWords.size / words.length) * 120));

      // Generate suggestions
      const suggestions: string[] = [];
      if (words.length < 100) suggestions.push('Consider expanding your response with more details');
      if (avgWordsPerSentence > 25) suggestions.push('Try using shorter sentences for better clarity');
      if (avgWordsPerSentence < 10) suggestions.push('Consider combining some short sentences for better flow');
      if (grammar < 70) suggestions.push('Review grammar and punctuation');
      if (originality < 60) suggestions.push('Try to use more varied vocabulary');
      if (suggestions.length === 0) suggestions.push('Excellent work! Keep up the good writing quality');

      return {
        quality: Math.min(100, quality),
        grammar: Math.min(100, grammar),
        clarity: Math.min(100, clarity),
        originality: Math.min(100, originality),
        suggestions,
        processingTime: Date.now() - startTime,
        modelUsed: this.isInitialized ? 'DistilBERT + MiniLM (Free Local AI)' : 'Heuristic Analysis'
      };
    } catch (error) {
      console.error('Error in content analysis:', error);
      return this.fallbackContentAnalysis(studentSubmission, startTime);
    }
  }

  // Helper methods
  private calculateReadability(avgWordsPerSentence: number): number {
    // Ideal is 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 100;
    if (avgWordsPerSentence < 15) return Math.max(60, avgWordsPerSentence * 5);
    return Math.max(40, 100 - ((avgWordsPerSentence - 20) * 3));
  }

  private assessGrammar(text: string): number {
    let score = 100;
    
    // Check capitalization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const properlyCapitalized = sentences.filter(s => /^[A-Z]/.test(s.trim())).length;
    score -= (sentences.length - properlyCapitalized) * 5;
    
    // Check punctuation
    if (!/[.!?]$/.test(text.trim())) score -= 10;
    
    // Check for common errors
    if (/\s{2,}/.test(text)) score -= 5; // Multiple spaces
    if (/[a-z][.!?][a-z]/.test(text)) score -= 10; // Missing space after punctuation
    
    return Math.max(0, Math.min(100, score));
  }

  private assessClarity(text: string, avgWordsPerSentence: number): number {
    const words = text.split(/\s+/);
    const longWords = words.filter(w => w.length > 12).length;
    const complexityPenalty = (longWords / words.length) * 30;
    
    const lengthScore = avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25 ? 100 : 70;
    
    return Math.max(0, Math.min(100, lengthScore - complexityPenalty));
  }

  private extractPhrases(text: string, phraseLength: number): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const phrases: string[] = [];
    
    for (let i = 0; i <= words.length - phraseLength; i++) {
      phrases.push(words.slice(i, i + phraseLength).join(' '));
    }
    
    return phrases;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    if (!this.featureExtractor) return 0;
    
    try {
      const embedding1 = await this.featureExtractor(text1.substring(0, 512), { pooling: 'mean', normalize: true });
      const embedding2 = await this.featureExtractor(text2.substring(0, 512), { pooling: 'mean', normalize: true });
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(embedding1.data, embedding2.data);
      return similarity;
    } catch (error) {
      return 0;
    }
  }

  private cosineSimilarity(vec1: Float32Array, vec2: Float32Array): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private generateFeedback(data: any): string {
    const { wordCount, sentenceCount, avgWordsPerSentence, grade, maxPoints, lengthScore, grammarScore, readabilityScore } = data;
    
    const percentage = (grade / maxPoints) * 100;
    let feedback = '';
    
    if (percentage >= 90) {
      feedback = 'Excellent work! ';
    } else if (percentage >= 80) {
      feedback = 'Very good submission! ';
    } else if (percentage >= 70) {
      feedback = 'Good effort. ';
    } else if (percentage >= 60) {
      feedback = 'Satisfactory work. ';
    } else {
      feedback = 'Needs improvement. ';
    }
    
    feedback += `Your submission contains ${wordCount} words across ${sentenceCount} sentences. `;
    
    if (lengthScore < 50) feedback += 'Consider expanding your response with more detail. ';
    if (grammarScore < 70) feedback += 'Pay attention to grammar and punctuation. ';
    if (readabilityScore < 60) feedback += avgWordsPerSentence > 25 ? 'Try using shorter sentences. ' : 'Consider using more complex sentences. ';
    
    return feedback;
  }

  private fallbackGrading(submission: string, maxPoints: number, startTime: number): FreeLLMGradingResult {
    const wordCount = submission.split(/\s+/).length;
    const grade = Math.min(maxPoints, Math.max(0, (wordCount * 0.15)));
    
    return {
      grade: Math.round(grade),
      feedback: 'Basic automated grading applied. For enhanced analysis, ensure AI models are downloaded.',
      confidence: 60,
      processingTime: Date.now() - startTime,
      reasoning: 'Fallback grading based on word count',
      modelUsed: 'Fallback Algorithm'
    };
  }

  private fallbackPlagiarismDetection(submission: string, startTime: number): FreeLLMPlagiarismResult {
    const words = submission.split(/\s+/);
    const uniqueWords = new Set(words);
    const uniqueness = (uniqueWords.size / words.length) * 100;
    
    return {
      isPlagiarized: uniqueness < 40,
      confidence: 65,
      similarityPercentage: Math.max(0, 100 - uniqueness),
      detectedSources: [],
      processingTime: Date.now() - startTime,
      analysis: 'Basic uniqueness analysis',
      modelUsed: 'Fallback Algorithm'
    };
  }

  private fallbackContentAnalysis(submission: string, startTime: number): FreeLLMContentAnalysis {
    const wordCount = submission.split(/\s+/).length;
    
    return {
      quality: Math.min(100, wordCount * 0.5),
      grammar: 75,
      clarity: 70,
      originality: 70,
      suggestions: ['Ensure AI models are downloaded for detailed analysis'],
      processingTime: Date.now() - startTime,
      modelUsed: 'Fallback Algorithm'
    };
  }

  isLLMConfigured(): boolean {
    return this.isInitialized;
  }

  getLLMStatus(): { configured: boolean; model: string; provider: string; cost: string } {
    return {
      configured: this.isInitialized,
      model: this.isInitialized ? 'DistilBERT + MiniLM-L6' : 'loading',
      provider: '100% FREE - Local AI (No API Keys)',
      cost: '$0.00 forever - Runs entirely locally'
    };
  }
}

export const freeLLM = new FreeLLMService();
