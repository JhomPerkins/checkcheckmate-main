"""
Webhook Integration Example
==========================

This example shows how to integrate the grading API with webhooks
for real-time grading in learning management systems.
"""

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import requests
import json
import asyncio
from typing import Dict, Any

# Your grading API client
class GradingAPIClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    async def grade_submission(self, content: str, student_id: str, 
                             assignment_id: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """Grade a submission asynchronously"""
        payload = {
            "content": content,
            "student_id": student_id,
            "assignment_id": assignment_id,
            "rubric": rubric,
            "assignment_type": "essay"
        }
        
        # Use asyncio to make the request non-blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: requests.post(f"{self.base_url}/api/grade-submission", json=payload)
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

# Webhook receiver app
webhook_app = FastAPI(title="Grading Webhook Receiver")
grading_client = GradingAPIClient()

class SubmissionWebhook(BaseModel):
    """Webhook payload from your LMS"""
    submission_id: str
    student_id: str
    assignment_id: str
    content: str
    rubric: Dict[str, Any]
    callback_url: str  # Where to send results back

@webhook_app.post("/webhook/submission")
async def handle_submission_webhook(submission: SubmissionWebhook):
    """
    Handle incoming submission webhooks from your LMS
    """
    try:
        # Grade the submission
        result = await grading_client.grade_submission(
            content=submission.content,
            student_id=submission.student_id,
            assignment_id=submission.assignment_id,
            rubric=submission.rubric
        )
        
        # Send results back to your LMS
        callback_payload = {
            "submission_id": submission.submission_id,
            "grading_result": result,
            "status": "completed"
        }
        
        # Send callback (in real implementation, use proper async HTTP client)
        try:
            requests.post(submission.callback_url, json=callback_payload)
        except Exception as e:
            print(f"Failed to send callback: {e}")
        
        return {
            "status": "success",
            "submission_id": submission.submission_id,
            "score": result["total_score"]
        }
        
    except Exception as e:
        # Send error callback
        error_payload = {
            "submission_id": submission.submission_id,
            "status": "error",
            "error": str(e)
        }
        
        try:
            requests.post(submission.callback_url, json=error_payload)
        except:
            pass
        
        raise HTTPException(status_code=500, detail=str(e))

# Example LMS integration (Canvas, Blackboard, etc.)
class LMSIntegration:
    """Example integration with popular LMS platforms"""
    
    @staticmethod
    def canvas_webhook_payload(submission_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Canvas submission to our format"""
        return {
            "submission_id": submission_data["id"],
            "student_id": submission_data["user_id"],
            "assignment_id": submission_data["assignment_id"],
            "content": submission_data["body"],
            "rubric": submission_data.get("rubric", {
                "content": {"max_points": 30, "min_words": 100},
                "structure": {"max_points": 25},
                "grammar": {"max_points": 20},
                "argument": {"max_points": 25}
            }),
            "callback_url": f"https://your-canvas-instance.com/api/v1/courses/{submission_data['course_id']}/assignments/{submission_data['assignment_id']}/submissions/{submission_data['id']}/grade"
        }
    
    @staticmethod
    def moodle_webhook_payload(submission_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Moodle submission to our format"""
        return {
            "submission_id": submission_data["id"],
            "student_id": submission_data["userid"],
            "assignment_id": submission_data["assignment"],
            "content": submission_data["onlinetext"],
            "rubric": submission_data.get("rubric", {
                "content": {"max_points": 30, "min_words": 100},
                "structure": {"max_points": 25},
                "grammar": {"max_points": 20},
                "argument": {"max_points": 25}
            }),
            "callback_url": f"https://your-moodle-site.com/mod/assign/view.php?id={submission_data['assignment']}"
        }

# Example usage
if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Webhook Receiver...")
    print("📡 Webhook endpoint: http://localhost:8001/webhook/submission")
    print("📚 Integration guide: See INTEGRATION_GUIDE.md")
    
    uvicorn.run(webhook_app, host="0.0.0.0", port=8001)
