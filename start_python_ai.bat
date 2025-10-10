@echo off
echo Starting Python AI Backend...
cd python_ai_backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python main.py
pause
