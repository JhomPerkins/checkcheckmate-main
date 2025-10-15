"""
FREE LLM-Based Academic Assessment System
Uses only open-source models and libraries - ZERO API costs
"""

import os
import re
import json
import hashlib
import sqlite3
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
import logging

# Free ML Libraries
from transformers import pipeline, AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from textstat import flesch_reading_ease, flesch_kincaid_grade

logger = logging.getLogger(__name__)

class FreeLLMAcademicSystem:
    """Complete free LLM-based academic assessment system"""
    
    def __init__(self):
        self.setup_models()
        self.setup_databases()
        self.setup_nltk()
        
    def setup_models(self):
        """Initialize free open-source models"""
        try:
            logger.info("🤖 Loading free LLM models...")
            
            # Free embedding model for plagiarism detection
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            
            # Free text generation for feedback
            self.text_generator = pipeline(
                "text-generation",
                model="microsoft/DialoGPT-medium",
                tokenizer="microsoft/DialoGPT-medium",
                max_length=512,
                do_sample=True,
                temperature=0.7
            )
            
            # Free sentiment analysis for grading
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest"
            )
            
            # Free text classification for content analysis
            self.classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli"
            )
            
            logger.info("✅ Free LLM models loaded successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            self.setup_fallback_models()
    
    def setup_fallback_models(self):
        """Fallback models if primary ones fail"""
        logger.info("🔄 Setting up fallback models...")
        
        # Simple TF-IDF based similarity
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 3)
        )
        
        self.text_stats_available = True
        logger.info("✅ Fallback models ready")
    
    def setup_databases(self):
        """Setup local SQLite databases for caching"""
        self.db_path = "ai_cache.db"
        
        # Create tables for caching
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Embeddings cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS embeddings_cache (
                content_hash TEXT PRIMARY KEY,
                embedding TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Plagiarism results cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS plagiarism_cache (
                content_hash TEXT PRIMARY KEY,
                similarity_scores TEXT,
                matches TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Grading results cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS grading_cache (
                content_hash TEXT PRIMARY KEY,
                grade_result TEXT,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("✅ Local databases initialized")
    
    def setup_nltk(self):
        """Download required NLTK data"""
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
            logger.info("✅ NLTK data downloaded")
        except Exception as e:
            logger.warning(f"⚠️ NLTK setup warning: {e}")
    
    def get_content_hash(self, content: str) -> str:
        """Generate hash for content caching"""
        return hashlib.md5(content.encode()).hexdigest()
    
    def get_cached_result(self, table: str, content_hash: str) -> Optional[Dict]:
        """Get cached result from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(f"SELECT * FROM {table} WHERE content_hash = ?", (content_hash,))
            result = cursor.fetchone()
            
            conn.close()
            
            if result:
                if table == "embeddings_cache":
                    return {"embedding": json.loads(result[1])}
                elif table == "plagiarism_cache":
                    return {
                        "similarity_scores": json.loads(result[1]),
                        "matches": json.loads(result[2])
                    }
                elif table == "grading_cache":
                    return {
                        "grade_result": json.loads(result[1]),
                        "feedback": result[2]
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error getting cached result: {e}")
            return None
    
    def cache_result(self, table: str, content_hash: str, data: Dict):
        """Cache result in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if table == "embeddings_cache":
                cursor.execute(
                    "INSERT OR REPLACE INTO embeddings_cache (content_hash, embedding) VALUES (?, ?)",
                    (content_hash, json.dumps(data["embedding"]))
                )
            elif table == "plagiarism_cache":
                cursor.execute(
                    "INSERT OR REPLACE INTO plagiarism_cache (content_hash, similarity_scores, matches) VALUES (?, ?, ?)",
                    (content_hash, json.dumps(data["similarity_scores"]), json.dumps(data["matches"]))
                )
            elif table == "grading_cache":
                cursor.execute(
                    "INSERT OR REPLACE INTO grading_cache (content_hash, grade_result, feedback) VALUES (?, ?, ?)",
                    (content_hash, json.dumps(data["grade_result"]), data["feedback"])
                )
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ Error caching result: {e}")

# Initialize the free LLM system
free_llm_system = FreeLLMAcademicSystem()
logger.info("🚀 Free LLM Academic Assessment System initialized successfully!")
