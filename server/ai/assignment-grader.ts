/**
 * AI Assignment Grading Service
 * Uses advanced algorithms for automatic assignment grading
 */

export interface GradingResult {
  overallScore: number;
  rubricScores: Record<string, RubricScore>;
  feedback: string;
  contentAnalysis: ContentAnalysis;
  confidence: number;
}

export interface RubricScore {
  score: number;
  weight: number;
  confidence: number;
  criterion: string;
}

export interface ContentAnalysis {
  wordCount: number;
  sentenceCount: number;
  readabilityScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  avgWordsPerSentence: number;
  complexityScore: number;
  strengths: string[];
  improvements: string[];
}

export interface RubricCriterion {
  maxPoints: number;
  weight?: number;
}

export class AssignmentGrader {
  /**
   * Grade an assignment using AI analysis
   */
  async gradeAssignment(
    content: string,
    rubric: Record<string, RubricCriterion>,
    assignmentContext: { assignmentId: string; studentId: string }
  ): Promise<GradingResult> {
    try {
      console.log(`📝 Grading assignment for student ${assignmentContext.studentId}`);

      // Analyze content quality
      const contentAnalysis = this.analyzeContent(content);

      // Evaluate rubric compliance
      const rubricScores = this.evaluateRubric(content, rubric, contentAnalysis);

      // Generate feedback
      const feedback = this.generateFeedback(contentAnalysis, rubricScores);

      const result: GradingResult = {
        overallScore: this.calculateOverallScore(rubricScores),
        rubricScores,
        feedback,
        contentAnalysis,
        confidence: 0.85
      };

      console.log(`✅ Grading completed - Score: ${result.overallScore}/100`);
      return result;

    } catch (error) {
      console.error('❌ Grading error:', error);
      return {
        overallScore: 70,
        rubricScores: {},
        feedback: `Grading error: ${error}`,
        contentAnalysis: {
          wordCount: 0,
          sentenceCount: 0,
          readabilityScore: 0,
          sentiment: 'neutral',
          avgWordsPerSentence: 0,
          complexityScore: 0,
          strengths: [],
          improvements: []
        },
        confidence: 0
      };
    }
  }

  /**
   * Analyze content quality using advanced metrics
   */
  private analyzeContent(content: string): ContentAnalysis {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Calculate readability (simplified Flesch score)
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgSyllablesPerWord = this.calculateAverageSyllables(words);
    
    const readability = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    const readabilityScore = Math.max(0, Math.min(100, readability));

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(content);

    // Complexity analysis
    const complexityScore = this.calculateComplexity(content);

    // Generate strengths and improvements
    const strengths = this.identifyStrengths(content, readabilityScore, complexityScore);
    const improvements = this.suggestImprovements(content, readabilityScore, complexityScore);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      readabilityScore: Math.round(readabilityScore),
      sentiment,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      complexityScore,
      strengths,
      improvements
    };
  }

  /**
   * Calculate average syllables per word
   */
  private calculateAverageSyllables(words: string[]): number {
    const sampleWords = words.slice(0, Math.min(20, words.length));
    const totalSyllables = sampleWords.reduce((sum, word) => sum + this.countSyllables(word), 0);
    return totalSyllables / sampleWords.length;
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) return 0;

    const vowels = 'aeiouy';
    let syllableCount = 0;
    let prevWasVowel = false;

    for (const char of cleanWord) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevWasVowel) {
        syllableCount++;
      }
      prevWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (cleanWord.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  /**
   * Analyze sentiment of content
   */
  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'effective', 'successful', 'improved'];
    const negativeWords = ['bad', 'poor', 'negative', 'harmful', 'ineffective', 'problem', 'failed', 'worse'];

    const lowerContent = content.toLowerCase();
    const posCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate content complexity
   */
  private calculateComplexity(content: string): number {
    const words = content.split(/\s+/);
    if (words.length === 0) return 0;

    // Count complex words (more than 6 characters)
    const complexWords = words.filter(word => word.length > 6);
    const complexityRatio = complexWords.length / words.length;

    // Count unique words
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniquenessRatio = uniqueWords.size / words.length;

    // Combine metrics
    const complexity = (complexityRatio * 0.6 + uniquenessRatio * 0.4) * 100;
    return Math.round(complexity * 10) / 10;
  }

  /**
   * Identify content strengths
   */
  private identifyStrengths(content: string, readability: number, complexity: number): string[] {
    const strengths: string[] = [];

    if (readability >= 70) {
      strengths.push('Clear and readable writing style');
    }
    if (complexity >= 60) {
      strengths.push('Sophisticated vocabulary usage');
    }
    if (content.split(/[.!?]+/).length >= 5) {
      strengths.push('Well-structured with multiple supporting points');
    }
    if (content.length >= 200) {
      strengths.push('Comprehensive coverage of the topic');
    }

    return strengths;
  }

  /**
   * Suggest content improvements
   */
  private suggestImprovements(content: string, readability: number, complexity: number): string[] {
    const improvements: string[] = [];

    if (readability < 50) {
      improvements.push('Use simpler sentence structures to improve readability');
    }
    if (complexity < 40) {
      improvements.push('Consider using more varied and sophisticated vocabulary');
    }
    if (content.split(/[.!?]+/).length < 5) {
      improvements.push('Add more detailed explanations and supporting evidence');
    }
    if (content.length < 150) {
      improvements.push('Expand your response with more comprehensive analysis');
    }

    return improvements;
  }

  /**
   * Evaluate rubric criteria
   */
  private evaluateRubric(
    content: string,
    rubric: Record<string, RubricCriterion>,
    analysis: ContentAnalysis
  ): Record<string, RubricScore> {
    const scores: Record<string, RubricScore> = {};

    for (const [criterion, details] of Object.entries(rubric)) {
      const score = this.evaluateCriterion(content, criterion, analysis);
      const weight = details.weight || (details.maxPoints / 100);

      scores[criterion] = {
        score,
        weight,
        confidence: 0.8,
        criterion
      };
    }

    return scores;
  }

  /**
   * Evaluate individual criterion
   */
  private evaluateCriterion(content: string, criterion: string, analysis: ContentAnalysis): number {
    const criterionLower = criterion.toLowerCase();

    if (criterionLower.includes('content') || criterionLower.includes('quality')) {
      let baseScore = 70;

      // Length scoring
      if (analysis.wordCount >= 200) baseScore += 15;
      else if (analysis.wordCount >= 100) baseScore += 10;
      else if (analysis.wordCount < 50) baseScore -= 20;

      // Complexity scoring
      if (analysis.complexityScore >= 70) baseScore += 10;
      else if (analysis.complexityScore < 40) baseScore -= 10;

      return Math.min(100, Math.max(0, baseScore));
    }

    if (criterionLower.includes('grammar') || criterionLower.includes('writing')) {
      let baseScore = 75;

      // Sentence structure
      if (analysis.avgWordsPerSentence >= 10 && analysis.avgWordsPerSentence <= 25) {
        baseScore += 15;
      } else if (analysis.avgWordsPerSentence < 5) {
        baseScore -= 15;
      }

      // Readability
      if (analysis.readabilityScore >= 60) baseScore += 10;
      else if (analysis.readabilityScore < 30) baseScore -= 10;

      return Math.min(100, Math.max(0, baseScore));
    }

    if (criterionLower.includes('creativity') || criterionLower.includes('original')) {
      let baseScore = 70;

      // Uniqueness
      if (analysis.complexityScore >= 60) baseScore += 20;
      else if (analysis.complexityScore < 30) baseScore -= 15;

      // Sentiment (creative writing often has emotional content)
      if (analysis.sentiment !== 'neutral') baseScore += 10;

      return Math.min(100, Math.max(0, baseScore));
    }

    // Default scoring
    return 75;
  }

  /**
   * Calculate overall score from rubric scores
   */
  private calculateOverallScore(rubricScores: Record<string, RubricScore>): number {
    let totalWeighted = 0;
    let totalWeight = 0;

    for (const scoreData of Object.values(rubricScores)) {
      totalWeighted += scoreData.score * scoreData.weight;
      totalWeight += scoreData.weight;
    }

    if (totalWeight > 0) {
      return Math.round(totalWeighted / totalWeight);
    }

    return 70;
  }

  /**
   * Generate detailed feedback
   */
  private generateFeedback(analysis: ContentAnalysis, rubricScores: Record<string, RubricScore>): string {
    const feedbackParts: string[] = [];

    // Overall performance
    const overallScore = this.calculateOverallScore(rubricScores);

    if (overallScore >= 90) {
      feedbackParts.push('🌟 Excellent work! Your submission demonstrates outstanding understanding and quality.');
    } else if (overallScore >= 80) {
      feedbackParts.push('👍 Good work! Your submission shows solid understanding with room for minor improvements.');
    } else if (overallScore >= 70) {
      feedbackParts.push('✅ Satisfactory work. Consider addressing the areas mentioned below.');
    } else if (overallScore >= 60) {
      feedbackParts.push('⚠️ Needs improvement. Please review the requirements and revise your submission.');
    } else {
      feedbackParts.push('❌ Significant improvement needed. Please review the requirements and resubmit.');
    }

    // Content-specific feedback
    if (analysis.wordCount < 100) {
      feedbackParts.push('📝 Consider expanding your content to provide more detail and depth.');
    } else if (analysis.wordCount > 1000) {
      feedbackParts.push('📄 Your content is quite comprehensive. Consider being more concise where possible.');
    }

    if (analysis.readabilityScore < 40) {
      feedbackParts.push('📖 Consider using simpler sentence structures to improve readability.');
    } else if (analysis.readabilityScore > 80) {
      feedbackParts.push('📚 Your writing is very clear and easy to understand.');
    }

    // Rubric-specific feedback
    for (const [criterion, scoreData] of Object.entries(rubricScores)) {
      if (scoreData.score < 70) {
        feedbackParts.push(`🎯 Focus on improving ${criterion.replace('_', ' ')}.`);
      } else if (scoreData.score >= 90) {
        feedbackParts.push(`⭐ Excellent work on ${criterion.replace('_', ' ')}!`);
      }
    }

    return feedbackParts.join(' ');
  }
}

// Export singleton instance
export const assignmentGrader = new AssignmentGrader();
