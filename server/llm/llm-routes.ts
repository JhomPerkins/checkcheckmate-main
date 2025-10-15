import { Router } from 'express';
import { geminiLLM } from './gemini-service.js';
import { freeLLM } from './free-llm-service.js';
import { storage } from '../storage.js';

const router = Router();

// Get LLM status
router.get('/status', async (req, res) => {
  try {
    const freeStatus = freeLLM.getLLMStatus();
    const geminiStatus = geminiLLM.getLLMStatus();
    
    res.json({
      primary: freeStatus,
      fallback: geminiStatus,
      activeLLM: 'Free Local AI - 100% Free Forever'
    });
  } catch (error) {
    console.error('Error getting LLM status:', error);
    res.status(500).json({ error: 'Failed to get LLM status' });
  }
});

// Grade assignment using LLM
router.post('/grade-assignment', async (req, res) => {
  try {
    const { assignmentId, submissionText, maxPoints = 100 } = req.body;

    if (!assignmentId || !submissionText) {
      return res.status(400).json({ error: 'Assignment ID and submission text are required' });
    }

    // Get assignment details
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Grade using FREE LLM (no cost!)
    const gradingResult = await freeLLM.gradeAssignment(
      assignment.title,
      assignment.description || '',
      submissionText,
      maxPoints
    );

    // Update submission with AI grading
    const submissionId = req.body.submissionId;
    if (submissionId) {
      await storage.updateSubmissionWithAI(submissionId, {
        aiGraded: true,
        aiConfidence: gradingResult.confidence,
        aiProcessingTime: gradingResult.processingTime
      });
    }

    res.json(gradingResult);
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({ error: 'Failed to grade assignment' });
  }
});

// Detect plagiarism using LLM
router.post('/detect-plagiarism', async (req, res) => {
  try {
    const { submissionText, referenceTexts = [] } = req.body;

    if (!submissionText) {
      return res.status(400).json({ error: 'Submission text is required' });
    }

    const plagiarismResult = await freeLLM.detectPlagiarism(submissionText, referenceTexts);
    res.json(plagiarismResult);
  } catch (error) {
    console.error('Error detecting plagiarism:', error);
    res.status(500).json({ error: 'Failed to detect plagiarism' });
  }
});

// Analyze content using LLM
router.post('/analyze-content', async (req, res) => {
  try {
    const { submissionText } = req.body;

    if (!submissionText) {
      return res.status(400).json({ error: 'Submission text is required' });
    }

    const analysisResult = await freeLLM.analyzeContent(submissionText);
    res.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

// Bulk grade multiple submissions
router.post('/bulk-grade', async (req, res) => {
  try {
    const { assignmentId, submissions } = req.body;

    if (!assignmentId || !Array.isArray(submissions)) {
      return res.status(400).json({ error: 'Assignment ID and submissions array are required' });
    }

    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const results = [];
    
    for (const submission of submissions) {
      try {
        const gradingResult = await freeLLM.gradeAssignment(
          assignment.title,
          assignment.description || '',
          submission.text,
          submission.maxPoints || 100
        );

        // Update submission in database
        if (submission.id) {
          await storage.updateSubmissionWithAI(submission.id, {
            aiGraded: true,
            aiConfidence: gradingResult.confidence,
            aiProcessingTime: gradingResult.processingTime
          });
        }

        results.push({
          submissionId: submission.id,
          ...gradingResult
        });
      } catch (error) {
        console.error(`Error grading submission ${submission.id}:`, error);
        results.push({
          submissionId: submission.id,
          error: 'Failed to grade this submission'
        });
      }
    }

    res.json({ results, totalProcessed: results.length });
  } catch (error) {
    console.error('Error in bulk grading:', error);
    res.status(500).json({ error: 'Failed to perform bulk grading' });
  }
});

// Get LLM analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await storage.getAIStatistics();
    const llmStatus = freeLLM.getLLMStatus();
    
    res.json({
      ...analytics,
      llmStatus,
      isFree: true,
      cost: '$0.00',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting LLM analytics:', error);
    res.status(500).json({ error: 'Failed to get LLM analytics' });
  }
});

export default router;
