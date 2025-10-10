#!/bin/bash
echo "Starting Python AI Backend..."
cd python_ai_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
