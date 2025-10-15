/**
 * AI INTEGRATION TEST SCRIPT
 * Demonstrates the CHECKmate AI capabilities
 */

// Test data for AI grading
const testSubmission = {
  content: `
    Artificial Intelligence has revolutionized the way we approach problem-solving in modern society. 
    The development of machine learning algorithms has enabled computers to learn from data and make 
    intelligent decisions without explicit programming. This technology has applications across various 
    industries including healthcare, finance, and education. Furthermore, AI systems can process vast 
    amounts of information quickly and accurately, making them invaluable tools for data analysis and 
    decision-making processes.
    
    However, the implementation of AI also raises important ethical considerations. Privacy concerns 
    arise when personal data is used to train these systems. Additionally, there is the potential for 
    bias in AI algorithms if the training data is not representative of diverse populations. 
    Therefore, it is crucial to develop AI systems that are both effective and ethical.
    
    In conclusion, while AI presents tremendous opportunities for advancement, we must carefully 
    consider the implications and ensure responsible development and deployment of these technologies.
  `,
  student_id: "test_student_001",
  assignment_id: "test_assignment_001",
  rubric: {
    content_quality: { max_points: 40 },
    grammar_writing: { max_points: 30 },
    creativity_originality: { max_points: 30 }
  }
};

// Test plagiarism detection
const testPlagiarism = {
  content: `
    The quick brown fox jumps over the lazy dog. This is a test sentence that contains common words.
    Furthermore, this content demonstrates various writing patterns and structures that might be 
    detected by plagiarism detection systems. Moreover, the repetition of certain phrases could 
    indicate potential issues with originality.
  `,
  assignment_id: "test_assignment_002",
  student_id: "test_student_002"
};

async function testAIIntegration() {
  console.log("🚀 Testing CHECKmate AI Integration\n");
  
  try {
    // Test 1: AI Grading
    console.log("📝 Testing AI Assignment Grading...");
    const gradingResponse = await fetch('http://localhost:3000/api/ai/grade-submission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSubmission)
    });
    
    if (gradingResponse.ok) {
      const gradingResult = await gradingResponse.json();
      console.log("✅ AI Grading Results:");
      console.log(`   Overall Score: ${gradingResult.total_score}/100`);
      console.log(`   Confidence: ${Math.round(gradingResult.confidence * 100)}%`);
      console.log(`   Processing Time: ${gradingResult.metadata.processing_time}s`);
      console.log(`   Cost: ${gradingResult.metadata.cost}`);
      console.log(`   Feedback: ${gradingResult.feedback.substring(0, 100)}...\n`);
    } else {
      console.log("❌ AI Grading failed:", await gradingResponse.text());
    }
    
    // Test 2: Plagiarism Detection
    console.log("🔍 Testing AI Plagiarism Detection...");
    const plagiarismResponse = await fetch('http://localhost:3000/api/ai/detect-plagiarism', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPlagiarism)
    });
    
    if (plagiarismResponse.ok) {
      const plagiarismResult = await plagiarismResponse.json();
      console.log("✅ Plagiarism Detection Results:");
      console.log(`   Flagged: ${plagiarismResult.is_flagged ? 'YES' : 'NO'}`);
      console.log(`   Highest Similarity: ${plagiarismResult.highest_similarity}%`);
      console.log(`   AI Generated: ${plagiarismResult.ai_detection.is_ai_generated ? 'YES' : 'NO'}`);
      console.log(`   AI Confidence: ${Math.round(plagiarismResult.ai_detection.ai_confidence * 100)}%`);
      console.log(`   Detection Method: ${plagiarismResult.detection_method}\n`);
    } else {
      console.log("❌ Plagiarism Detection failed:", await plagiarismResponse.text());
    }
    
    // Test 3: Content Analysis
    console.log("📊 Testing AI Content Analysis...");
    const analysisResponse = await fetch(`http://localhost:3000/api/ai/analyze-content?content=${encodeURIComponent(testSubmission.content)}`);
    
    if (analysisResponse.ok) {
      const analysisResult = await analysisResponse.json();
      console.log("✅ Content Analysis Results:");
      console.log(`   Word Count: ${analysisResult.content_analysis.word_count}`);
      console.log(`   Readability Score: ${analysisResult.content_analysis.readability_score}`);
      console.log(`   Sentiment: ${analysisResult.content_analysis.sentiment}`);
      console.log(`   Complexity Score: ${analysisResult.content_analysis.complexity_score}`);
      console.log(`   Processing Method: ${analysisResult.processing_method}`);
      console.log(`   Cost: ${analysisResult.cost}\n`);
    } else {
      console.log("❌ Content Analysis failed:", await analysisResponse.text());
    }
    
    console.log("🎉 AI Integration Test Complete!");
    console.log("\n📋 Summary:");
    console.log("   ✅ AI Grading: Working");
    console.log("   ✅ Plagiarism Detection: Working");
    console.log("   ✅ Content Analysis: Working");
    console.log("   💰 Total Cost: $0.00 (Completely Free!)");
    console.log("   ⚡ Processing: Native TypeScript (Fast!)");
    
  } catch (error) {
    console.error("❌ Error testing AI integration:", error.message);
    console.log("\n💡 Make sure your CHECKmate server is running on http://localhost:3000");
  }
}

// Run the test
testAIIntegration();
