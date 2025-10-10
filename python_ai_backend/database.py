import os
import json
import aiohttp
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class NeonDatabase:
    def __init__(self):
        self.base_url = "http://localhost:5000"  # CHECKmate LMS API
        self.session = None
    
    async def connect(self):
        """Connect to CHECKmate LMS API"""
        try:
            self.session = aiohttp.ClientSession()
            # Test connection
            async with self.session.get(f"{self.base_url}/api/health") as response:
                if response.status == 200:
                    logger.info("Connected to CHECKmate LMS API successfully")
                else:
                    logger.warning("CHECKmate LMS API not responding properly")
        except Exception as e:
            logger.error(f"Failed to connect to CHECKmate LMS API: {e}")
            # Continue without database for now
    
    async def close(self):
        """Close API session"""
        if self.session:
            await self.session.close()
            logger.info("API session closed")
    
    async def get_assignment(self, assignment_id: str) -> Optional[Dict[str, Any]]:
        """Get assignment details from CHECKmate LMS API"""
        try:
            if not self.session:
                return None
                
            async with self.session.get(f"{self.base_url}/api/assignments/{assignment_id}") as response:
                if response.status == 200:
                    assignment = await response.json()
                    # Parse rubric if it's JSON
                    if assignment.get('rubric') and isinstance(assignment['rubric'], str):
                        try:
                            assignment['rubric'] = json.loads(assignment['rubric'])
                        except json.JSONDecodeError:
                            assignment['rubric'] = {}
                    return assignment
                return None
        except Exception as e:
            logger.error(f"Error fetching assignment {assignment_id}: {e}")
            return None
    
    async def get_submission(self, submission_id: str) -> Optional[Dict[str, Any]]:
        """Get submission details from database"""
        try:
            async with self.pool.acquire() as conn:
                query = """
                SELECT id, student_id, assignment_id, content, submitted_at, 
                       ai_processed, ai_results
                FROM submissions 
                WHERE id = $1
                """
                row = await conn.fetchrow(query, submission_id)
                
                if row:
                    submission = dict(row)
                    # Parse AI results if they exist
                    if submission.get('ai_results') and isinstance(submission['ai_results'], str):
                        try:
                            submission['ai_results'] = json.loads(submission['ai_results'])
                        except json.JSONDecodeError:
                            submission['ai_results'] = None
                    return submission
                return None
        except Exception as e:
            logger.error(f"Error fetching submission {submission_id}: {e}")
            return None
    
    async def save_ai_results(self, submission_id: str, ai_results: Dict[str, Any]) -> bool:
        """Save AI grading results to database"""
        try:
            async with self.pool.acquire() as conn:
                query = """
                UPDATE submissions 
                SET ai_processed = true, 
                    ai_results = $2,
                    updated_at = NOW()
                WHERE id = $1
                """
                await conn.execute(query, submission_id, json.dumps(ai_results))
                logger.info(f"Saved AI results for submission {submission_id}")
                return True
        except Exception as e:
            logger.error(f"Error saving AI results for submission {submission_id}: {e}")
            return False
    
    async def get_student_submissions(self, student_id: str) -> List[Dict[str, Any]]:
        """Get all submissions by a student for plagiarism checking"""
        try:
            async with self.pool.acquire() as conn:
                query = """
                SELECT id, content, submitted_at
                FROM submissions 
                WHERE student_id = $1 AND content IS NOT NULL
                ORDER BY submitted_at DESC
                LIMIT 10
                """
                rows = await conn.fetch(query, student_id)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching student submissions for {student_id}: {e}")
            return []
    
    async def get_all_submissions_for_assignment(self, assignment_id: str) -> List[Dict[str, Any]]:
        """Get all submissions for an assignment for plagiarism checking"""
        try:
            async with self.pool.acquire() as conn:
                query = """
                SELECT id, student_id, content, submitted_at
                FROM submissions 
                WHERE assignment_id = $1 AND content IS NOT NULL
                ORDER BY submitted_at DESC
                """
                rows = await conn.fetch(query, assignment_id)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching submissions for assignment {assignment_id}: {e}")
            return []
    
    async def create_plagiarism_report(self, submission_id: str, report_data: Dict[str, Any]) -> bool:
        """Save plagiarism detection results"""
        try:
            async with self.pool.acquire() as conn:
                # First check if plagiarism_reports table exists, if not create it
                await self._ensure_plagiarism_table_exists(conn)
                
                query = """
                INSERT INTO plagiarism_reports (submission_id, similarity_score, 
                                              is_suspicious, suspicious_segments, 
                                              matched_sources, analysis, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (submission_id) DO UPDATE SET
                    similarity_score = EXCLUDED.similarity_score,
                    is_suspicious = EXCLUDED.is_suspicious,
                    suspicious_segments = EXCLUDED.suspicious_segments,
                    matched_sources = EXCLUDED.matched_sources,
                    analysis = EXCLUDED.analysis,
                    updated_at = NOW()
                """
                await conn.execute(
                    query,
                    submission_id,
                    report_data.get('similarity_score', 0),
                    report_data.get('is_suspicious', False),
                    json.dumps(report_data.get('suspicious_segments', [])),
                    json.dumps(report_data.get('matched_sources', [])),
                    report_data.get('analysis', '')
                )
                logger.info(f"Saved plagiarism report for submission {submission_id}")
                return True
        except Exception as e:
            logger.error(f"Error saving plagiarism report for submission {submission_id}: {e}")
            return False
    
    async def _ensure_plagiarism_table_exists(self, conn):
        """Ensure plagiarism_reports table exists"""
        create_table_query = """
        CREATE TABLE IF NOT EXISTS plagiarism_reports (
            id SERIAL PRIMARY KEY,
            submission_id VARCHAR NOT NULL UNIQUE,
            similarity_score DECIMAL(5,2) DEFAULT 0,
            is_suspicious BOOLEAN DEFAULT FALSE,
            suspicious_segments TEXT,
            matched_sources TEXT,
            analysis TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
        """
        await conn.execute(create_table_query)

# Global database instance
db = NeonDatabase()
