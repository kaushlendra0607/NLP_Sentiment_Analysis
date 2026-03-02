from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
import certifi
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_instance = Database()

async def connect_to_mongo():
    try:
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            print("[DATABASE] Warning: MONGO_URI not found in environment.")
            return

        # certifi.where() prevents SSL handshake errors on Windows/Cloud
        db_instance.client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where())
        
        # Name your database "nlp_research"
        db_instance.db = db_instance.client.nlp_research
        print("[DATABASE] Successfully connected to MongoDB.")
    except Exception as e:
        print(f"[DATABASE] Connection failed: {e}")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("[DATABASE] Closed MongoDB connection.")