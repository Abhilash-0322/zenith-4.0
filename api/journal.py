from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from pymongo import MongoClient
import os
from bson import ObjectId
from bson.json_util import dumps
import json
from dotenv import load_dotenv

load_dotenv()

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.calmverse
journal_collection = db.journals

# Create router
router = APIRouter(prefix="/journal", tags=["Journal"])

# Models
class JournalEntry(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    mood: str = Field(None)
    tags: List[str] = []
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Finding peace today",
                "content": "I took some time to meditate this morning and it really helped clear my mind...",
                "mood": "calm",
                "tags": ["meditation", "morning", "reflection"]
            }
        }

class JournalEntryDB(JournalEntry):
    id: str = None
    created_at: datetime = None
    
class JournalPrompt(BaseModel):
    prompt: str
    category: str

# List of prompts for users
journal_prompts = [
    JournalPrompt(prompt="What made you smile today?", category="gratitude"),
    JournalPrompt(prompt="Describe three things you're grateful for right now.", category="gratitude"),
    JournalPrompt(prompt="What's one small win you had today?", category="achievements"),
    JournalPrompt(prompt="How did you practice self-care today?", category="self-care"),
    JournalPrompt(prompt="What's something that challenged you today and how did you respond?", category="growth"),
    JournalPrompt(prompt="Describe a moment of calm you experienced recently.", category="mindfulness"),
    JournalPrompt(prompt="What's one thing you're looking forward to tomorrow?", category="hope"),
    JournalPrompt(prompt="If your emotions today were weather, what would they be and why?", category="emotions"),
    JournalPrompt(prompt="Write a letter to your future self about how you're feeling right now.", category="reflection"),
    JournalPrompt(prompt="What's one small change you could make tomorrow to improve your wellbeing?", category="self-improvement")
]

# Helper function to parse ObjectId
def parse_json(data):
    return json.loads(dumps(data))

# Routes
@router.post("/entries", response_description="Create a new journal entry")
async def create_journal_entry(journal: JournalEntry = Body(...)):
    """Create a new journal entry in the database"""
    journal_dict = journal.dict()
    journal_dict["created_at"] = datetime.now()
    
    new_journal = journal_collection.insert_one(journal_dict)
    created_journal = journal_collection.find_one({"_id": new_journal.inserted_id})
    
    return parse_json(created_journal)

@router.get("/entries", response_description="List all journal entries")
async def list_journal_entries():
    """Retrieve all journal entries from the database"""
    journals = journal_collection.find().sort("created_at", -1)
    return parse_json(journals)

@router.get("/entries/{id}", response_description="Get a single journal entry")
async def get_journal_entry(id: str):
    """Retrieve a specific journal entry by ID"""
    try:
        if journal := journal_collection.find_one({"_id": ObjectId(id)}):
            return parse_json(journal)
        
        raise HTTPException(status_code=404, detail=f"Journal entry with ID {id} not found")
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID format")

@router.delete("/entries/{id}", response_description="Delete a journal entry")
async def delete_journal_entry(id: str):
    """Delete a journal entry by ID"""
    try:
        delete_result = journal_collection.delete_one({"_id": ObjectId(id)})
        
        if delete_result.deleted_count == 1:
            return {"message": f"Journal entry with ID {id} deleted successfully"}
            
        raise HTTPException(status_code=404, detail=f"Journal entry with ID {id} not found")
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID format")

@router.put("/entries/{id}", response_description="Update a journal entry")
async def update_journal_entry(id: str, journal: JournalEntry = Body(...)):
    """Update a journal entry by ID"""
    try:
        journal_dict = journal.dict(exclude_unset=True)
        
        update_result = journal_collection.update_one(
            {"_id": ObjectId(id)}, {"$set": journal_dict}
        )
        
        if update_result.modified_count == 1:
            if updated_journal := journal_collection.find_one({"_id": ObjectId(id)}):
                return parse_json(updated_journal)
        
        if (
            journal_collection.find_one({"_id": ObjectId(id)}) is None
        ):
            raise HTTPException(status_code=404, detail=f"Journal entry with ID {id} not found")
            
        return parse_json(journal_collection.find_one({"_id": ObjectId(id)}))
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID format or update data")

@router.get("/prompts", response_description="Get journal prompts")
async def get_journal_prompts():
    """Return a list of journal prompts to inspire writing"""
    return journal_prompts

@router.get("/insights", response_description="Get journal insights")
async def get_journal_insights():
    """Generate insights based on journal entries (frequency, mood patterns, etc.)"""
    # Count total entries
    total_entries = journal_collection.count_documents({})
    
    # Get most used moods
    mood_pipeline = [
        {"$match": {"mood": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$mood", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    mood_data = list(journal_collection.aggregate(mood_pipeline))
    
    # Get most used tags
    tag_pipeline = [
        {"$match": {"tags": {"$exists": True, "$ne": []}}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    tag_data = list(journal_collection.aggregate(tag_pipeline))
    
    # Get entries per week
    date_pipeline = [
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%U", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": 10}
    ]
    date_data = list(journal_collection.aggregate(date_pipeline))
    
    return {
        "total_entries": total_entries,
        "top_moods": parse_json(mood_data),
        "top_tags": parse_json(tag_data),
        "entries_by_week": parse_json(date_data),
        "message": "Continue journaling regularly to see more detailed insights!"
    }