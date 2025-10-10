# Python AI Backend Setup

## Quick Setup Instructions

### 1. Install Python (if not installed)
- Download Python 3.8+ from https://python.org
- Make sure to check "Add Python to PATH" during installation

### 2. Setup Python AI Backend
```bash
# Navigate to python_ai_backend directory
cd python_ai_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the AI backend
python main.py
```

### 3. Start CHECKmate LMS
```bash
# In a separate terminal, start the main LMS
npm run dev
```

## Integration Complete! ✅

Your Python AI backend is now integrated with CHECKmate LMS:

- **Advanced AI Grading** - Multiple criteria evaluation
- **Plagiarism Detection** - Sophisticated similarity analysis  
- **Real-time Processing** - Automatic AI analysis on submission
- **Detailed Feedback** - Comprehensive grading with strengths/improvements

## API Endpoints
- Python AI Backend: `http://localhost:8000`
- CHECKmate LMS: `http://localhost:5173`
- AI Documentation: `http://localhost:8000/docs`

## Testing
1. Start Python AI backend first
2. Start CHECKmate LMS
3. Submit an assignment as a student
4. AI will automatically process and grade the submission
