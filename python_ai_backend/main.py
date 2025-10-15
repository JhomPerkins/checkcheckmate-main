from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
import logging
import time
from datetime import datetime

from enhanced_services.ai_grading import grade_essay_with_database
from enhanced_services.plagiarism import check_plagiarism_with_database
from simple_ai_system import simple_ai
from database import db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CHECKmate AI Grading API",
    description="Enterprise-grade AI-powered grading system for student submissions",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

class RubricCriterion(BaseModel):
    max_points: int = Field(..., gt=0, le=100, description="Maximum points for this criterion")
    min_words: Optional[int] = Field(None, ge=0, description="Minimum word count required")

class GradingRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=50000, description="Essay content to grade")
    student_id: str = Field(..., min_length=1, max_length=100, description="Student identifier")
    assignment_id: str = Field(..., min_length=1, max_length=100, description="Assignment identifier")
    rubric: Dict[str, RubricCriterion] = Field(..., description="Grading rubric criteria")
    assignment_type: str = Field(default="essay", description="Type of assignment")

class GradingResponse(BaseModel):
    success: bool
    total_score: float = Field(..., ge=0, le=100)
    criteria_scores: Dict[str, Any]
    feedback: str
    strengths: List[str] = Field(default=[])
    improvements: List[str] = Field(default=[])
    plagiarism_result: Dict[str, Any]
    confidence: float = Field(..., ge=0, le=1)
    metadata: Optional[Dict[str, Any]] = None

@app.post("/api/grade-submission", response_model=GradingResponse, tags=["Grading"])
async def grade_submission(request: GradingRequest):
    """Grade a single submission using advanced AI algorithms with database integration"""
    start_time = time.time()
    
    try:
        logger.info(f"Processing grading request | Student: {request.student_id} | Assignment: {request.assignment_id}")
        
        if len(request.rubric) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rubric must contain at least one criterion"
            )
        
        # Connect to database if not already connected
        if not db.pool:
            await db.connect()
        
        logger.info("Starting enhanced AI grading process with database integration...")
        grading_result = await grade_essay_with_database(
            content=request.content,
            rubric=request.rubric,
            assignment_id=request.assignment_id,
            student_id=request.student_id
        )
        
        logger.info("Running enhanced plagiarism detection with database...")
        plagiarism_result = await check_plagiarism_with_database(
            content=request.content,
            submission_id=f"sub_{request.student_id}_{request.assignment_id}",
            student_id=request.student_id,
            assignment_id=request.assignment_id
        )
        
        processing_time = time.time() - start_time
        
        response = GradingResponse(
            success=True,
            total_score=grading_result["total_score"],
            criteria_scores=grading_result["criteria_scores"],
            feedback=grading_result["feedback"],
            strengths=grading_result.get("strengths", []),
            improvements=grading_result.get("improvements", []),
            plagiarism_result=plagiarism_result,
            confidence=grading_result.get("confidence", 0.85),
            metadata={
                "processing_time": round(processing_time, 3),
                "word_count": grading_result.get("word_count", 0),
                "timestamp": datetime.now().isoformat(),
                "assignment_type": request.assignment_type,
                "database_connected": True,
                "enhanced_features": True
            }
        )
        
        logger.info(f"Enhanced grading completed | Score: {response.total_score}% | Time: {processing_time:.3f}s")
        return response
        
    except Exception as e:
        logger.error(f"Error in enhanced grading process: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing enhanced grading request: {str(e)}"
        )

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CHECKmate AI Grading API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.process_time()
    }

# Simple AI system is already initialized

@app.post("/api/free/grade-submission", tags=["Free Grading"])
async def grade_submission_free(request: GradingRequest):
    """Grade submission using FREE LLM models - no API costs"""
    start_time = time.time()
    
    try:
        logger.info(f"Processing FREE grading request | Student: {request.student_id} | Assignment: {request.assignment_id}")
        
        # Convert rubric format for free grader
        free_rubric = {}
        for criterion, details in request.rubric.items():
            free_rubric[criterion] = details.max_points / 100.0  # Convert to weight
        
        # Grade using simple AI system
        grading_result = simple_ai.grade_assignment(
            content=request.content,
            rubric=free_rubric,
            assignment_context={"assignment_id": request.assignment_id, "student_id": request.student_id}
        )
        
        # Detect plagiarism using simple AI system
        plagiarism_result = simple_ai.detect_plagiarism(
            content=request.content,
            assignment_id=request.assignment_id,
            student_id=request.student_id
        )
        
        processing_time = time.time() - start_time
        
        response = GradingResponse(
            success=True,
            total_score=grading_result["overall_score"],
            criteria_scores=grading_result["rubric_scores"],
            feedback=grading_result["feedback"],
            strengths=grading_result.get("content_analysis", {}).get("strengths", []),
            improvements=grading_result.get("content_analysis", {}).get("improvements", []),
            plagiarism_result=plagiarism_result,
            confidence=grading_result.get("confidence", 0.7),
            metadata={
                "processing_time": round(processing_time, 3),
                "word_count": len(request.content.split()),
                "timestamp": datetime.now().isoformat(),
                "assignment_type": request.assignment_type,
                "grading_method": "free_llm",
                "cost": "$0.00"
            }
        )
        
        logger.info(f"FREE grading completed | Score: {response.total_score}% | Time: {processing_time:.3f}s | Cost: $0.00")
        return response
        
    except Exception as e:
        logger.error(f"Error in FREE grading process: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing FREE grading request: {str(e)}"
        )

@app.post("/api/free/detect-plagiarism", tags=["Free Plagiarism"])
async def detect_plagiarism_free(request: dict):
    """Detect plagiarism using FREE models - no API costs"""
    try:
        content = request.get("content", "")
        assignment_id = request.get("assignment_id", "")
        student_id = request.get("student_id", "")
        
        if not content or not assignment_id or not student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: content, assignment_id, student_id"
            )
        
        logger.info(f"Processing FREE plagiarism detection | Student: {student_id} | Assignment: {assignment_id}")
        
        result = simple_ai.detect_plagiarism(
            content=content,
            assignment_id=assignment_id,
            student_id=student_id
        )
        
        logger.info(f"FREE plagiarism detection completed | Flagged: {result['is_flagged']} | Cost: $0.00")
        return result
        
    except Exception as e:
        logger.error(f"Error in FREE plagiarism detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing FREE plagiarism detection: {str(e)}"
        )

@app.get("/api/free/analyze-content", tags=["Free Analysis"])
async def analyze_content_free(content: str):
    """Analyze content quality using FREE models"""
    try:
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content parameter is required"
            )
        
        logger.info("Processing FREE content analysis")
        
        # Analyze content quality
        content_analysis = simple_ai.analyze_content(content)
        
        # Detect AI generation
        ai_detection = simple_ai.detect_ai_content(content)
        
        result = {
            "content_analysis": content_analysis,
            "ai_detection": ai_detection,
            "processing_method": "free_llm",
            "cost": "$0.00"
        }
        
        logger.info(f"FREE content analysis completed | Cost: $0.00")
        return result
        
    except Exception as e:
        logger.error(f"Error in FREE content analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing FREE content analysis: {str(e)}"
        )

app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await db.connect()
        logger.info("✅ Database connection established successfully")
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        # Continue without database for now
    
    # Initialize free LLM system
    logger.info("🚀 FREE LLM Academic Assessment System ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await db.close()
    logger.info("Database connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )