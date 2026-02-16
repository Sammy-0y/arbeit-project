#!/usr/bin/env python3
"""
Seed test users for Phase 1 authentication testing
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import bcrypt

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def seed_users():
    """Seed test users"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # First, create a test client
    test_client = {
        "client_id": "client_001",
        "company_name": "Acme Corporation",
        "status": "active",
        "created_at": "2025-01-01T00:00:00"
    }
    
    # Check if client exists
    existing_client = await db.clients.find_one({"client_id": "client_001"})
    if not existing_client:
        await db.clients.insert_one(test_client)
        print("✓ Created test client: Acme Corporation (client_001)")
    else:
        print("✓ Test client already exists")
    
    # Define test users
    test_users = [
        {
            "email": "admin@arbeit.com",
            "password": "admin123",
            "name": "Admin User",
            "role": "admin",
            "client_id": None
        },
        {
            "email": "recruiter@arbeit.com",
            "password": "recruiter123",
            "name": "Sarah Recruiter",
            "role": "recruiter",
            "client_id": None
        },
        {
            "email": "client@acme.com",
            "password": "client123",
            "name": "John Client",
            "role": "client_user",
            "client_id": "client_001"
        }
    ]
    
    for user_data in test_users:
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            print(f"✓ User {user_data['email']} already exists")
        else:
            password = user_data.pop("password")
            user_data["password_hash"] = hash_password(password)
            user_data["created_at"] = "2025-01-01T00:00:00"
            
            await db.users.insert_one(user_data)
            print(f"✓ Created user: {user_data['email']} (role: {user_data['role']})")
    
    print("\n" + "="*60)
    print("PHASE 1 TEST CREDENTIALS")
    print("="*60)
    print("\nAdmin:")
    print("  Email: admin@arbeit.com")
    print("  Password: admin123")
    print("\nRecruiter:")
    print("  Email: recruiter@arbeit.com")
    print("  Password: recruiter123")
    print("\nClient User:")
    print("  Email: client@acme.com")
    print("  Password: client123")
    print("="*60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_users())
