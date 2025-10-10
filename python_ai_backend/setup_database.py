#!/usr/bin/env python3
"""
Setup script to copy DATABASE_URL from main project to Python AI backend
"""
import os
import shutil
from pathlib import Path

def setup_database_connection():
    """Copy DATABASE_URL from main project to Python AI backend"""
    
    # Path to main project .env file
    main_project_root = Path(__file__).parent.parent
    main_env_file = main_project_root / '.env'
    
    # Path to Python AI backend .env file
    ai_backend_root = Path(__file__).parent
    ai_env_file = ai_backend_root / '.env'
    
    print("🔧 Setting up database connection for Python AI backend...")
    
    if main_env_file.exists():
        # Copy .env file to AI backend
        shutil.copy2(main_env_file, ai_env_file)
        print("✅ Copied .env file to Python AI backend")
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv(ai_env_file)
        
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            print("✅ DATABASE_URL found and loaded")
            print(f"📊 Database: {database_url.split('@')[1].split('/')[0] if '@' in database_url else 'Unknown'}")
        else:
            print("❌ DATABASE_URL not found in .env file")
            return False
    else:
        print("❌ .env file not found in main project")
        print("Please ensure your .env file contains DATABASE_URL")
        return False
    
    return True

if __name__ == "__main__":
    if setup_database_connection():
        print("\n🎉 Database setup complete!")
        print("Your Python AI backend is now connected to the same Neon database as CHECKmate LMS")
    else:
        print("\n❌ Database setup failed")
        print("Please check your .env file and try again")
