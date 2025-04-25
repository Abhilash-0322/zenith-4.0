from fastapi import APIRouter, HTTPException, Body, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Annotated, Any
from datetime import datetime, timedelta
from bson import ObjectId
import motor.motor_asyncio
from pymongo import ASCENDING
import os
from uuid import uuid4

# Setup Router
router = APIRouter(
    prefix="/therapists",
    tags=["Therapists"],
    responses={404: {"description": "Not found"}},
)

# MongoDB Connection
client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get("MONGODB_URI", "mongodb://localhost:27017"))
db = client.calmverse
therapists_collection = db.therapists
appointments_collection = db.appointments

# Custom type for ObjectId
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
        
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    # Updated for Pydantic v2
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, **kwargs):
        field_schema.update(type="string")
        return field_schema

# Pydantic Models
class TimeSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    is_booked: bool = False
    
    model_config = ConfigDict(
        json_encoders={ObjectId: str}
    )

class Therapist(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    specializations: List[str]
    experience_years: int
    education: str
    bio: str
    photo_url: Optional[str] = None
    hourly_rate: float
    languages: List[str] = ["English"]
    availability: List[TimeSlot] = []
    
    model_config = ConfigDict(
        validate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class TherapistDisplay(BaseModel):
    id: str = Field(alias="_id")
    name: str
    specializations: List[str]
    experience_years: int
    education: str
    bio: str
    photo_url: Optional[str] = None
    hourly_rate: float
    languages: List[str]
    
    model_config = ConfigDict(
        validate_by_name=True,
        arbitrary_types_allowed=True
    )

class Appointment(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    appointment_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    therapist_id: str
    therapist_name: str
    date: datetime
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"  # scheduled, completed, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    model_config = ConfigDict(
        validate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class AppointmentCreate(BaseModel):
    user_id: str
    therapist_id: str
    date: datetime
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

# Helper Functions
def parse_therapist(therapist) -> TherapistDisplay:
    return {
        "_id": str(therapist["_id"]),
        "name": therapist["name"],
        "specializations": therapist["specializations"],
        "experience_years": therapist["experience_years"],
        "education": therapist["education"],
        "bio": therapist["bio"],
        "photo_url": therapist.get("photo_url"),
        "hourly_rate": therapist["hourly_rate"],
        "languages": therapist["languages"]
    }

def parse_appointment(appointment):
    return {
        "_id": str(appointment["_id"]),
        "appointment_id": appointment["appointment_id"],
        "user_id": appointment["user_id"],
        "therapist_id": appointment["therapist_id"],
        "therapist_name": appointment["therapist_name"],
        "date": appointment["date"],
        "start_time": appointment["start_time"],
        "end_time": appointment["end_time"],
        "status": appointment["status"],
        "notes": appointment.get("notes"),
        "created_at": appointment["created_at"]
    }

# Seed Database with Therapists
async def seed_therapists():
    count = await therapists_collection.count_documents({})
    if count == 0:
        therapists = [
            {
                "name": "Dr. Sarah Johnson",
                "specializations": ["Anxiety", "Depression", "Stress Management"],
                "experience_years": 12,
                "education": "Ph.D in Clinical Psychology, Stanford University",
                "bio": "Dr. Johnson specializes in cognitive behavioral therapy and mindfulness techniques to help clients overcome anxiety and depression.",
                "photo_url": "https://img.freepik.com/free-photo/female-doctor-hospital-with-stethoscope_23-2148827774.jpg?ga=GA1.1.759901056.1745457952&semt=ais_hybrid&w=740",
                "hourly_rate": 120.00,
                "languages": ["English", "Spanish"],
                "availability": generate_availability(14)
            },
            {
                "name": "Dr. Michael Chen",
                "specializations": ["Trauma", "PTSD", "Family Therapy"],
                "experience_years": 15,
                "education": "Psy.D in Clinical Psychology, Columbia University",
                "bio": "Dr. Chen has extensive experience helping clients process trauma and rebuild their lives using evidence-based approaches.",
                "photo_url": "https://example.com/photos/michael.jpg",
                "hourly_rate": 135.00,
                "languages": ["English", "Mandarin"],
                "availability": generate_availability(14)
            },
            {
                "name": "Maya Rodriguez, LMFT",
                "specializations": ["Relationships", "Couples Therapy", "Self-Esteem"],
                "experience_years": 8,
                "education": "M.S. in Marriage and Family Therapy, NYU",
                "bio": "Maya helps couples and individuals navigate relationship challenges and build healthier connections.",
                "photo_url": "https://img.freepik.com/free-psd/cute-3d-cartoon-female-doctor-wearing-glasses-white-coat-with-stethoscope-healthcare-professional-illustration_632498-32034.jpg?ga=GA1.1.759901056.1745457952&semt=ais_hybrid&w=740",
                "hourly_rate": 100.00,
                "languages": ["English", "Spanish"],
                "availability": generate_availability(14)
            },
            {
                "name": "Dr. James Wilson",
                "specializations": ["Addiction Recovery", "Substance Abuse", "Mental Health"],
                "experience_years": 18,
                "education": "Ph.D in Psychology, Yale University",
                "bio": "Dr. Wilson works with clients struggling with addiction and co-occurring mental health issues to achieve lasting recovery.",
                "photo_url": "https://example.com/photos/james.jpg",
                "hourly_rate": 140.00,
                "languages": ["English"],
                "availability": generate_availability(14)
            },
            {
                "name": "Aisha Patel, LCSW",
                "specializations": ["Cultural Identity", "Grief & Loss", "Life Transitions"],
                "experience_years": 7,
                "education": "MSW, University of Chicago",
                "bio": "Aisha provides culturally sensitive therapy to help clients navigate life transitions and find meaning through difficult times.",
                "photo_url": "https://example.com/photos/aisha.jpg",
                "hourly_rate": 95.00,
                "languages": ["English", "Hindi", "Gujarati"],
                "availability": generate_availability(14)
            }
        ]
        await therapists_collection.insert_many(therapists)
        print("Therapists database seeded successfully")

def generate_availability(days_ahead):
    availability = []
    now = datetime.now()
    for day in range(days_ahead):
        current_date = now + timedelta(days=day)
        # Generate 8 one-hour slots from 9 AM to 5 PM
        for hour in range(9, 17):
            start_time = datetime(
                current_date.year, 
                current_date.month, 
                current_date.day, 
                hour, 0, 0
            )
            end_time = start_time + timedelta(hours=1)
            availability.append({
                "start_time": start_time,
                "end_time": end_time,
                "is_booked": False
            })
    return availability

# Endpoints
@router.get("/", response_description="List all therapists")
async def list_therapists(
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    language: Optional[str] = Query(None, description="Filter by language")
):
    """
    Get a list of all therapists with optional filtering by specialization or language
    """
    query = {}
    if specialization:
        query["specializations"] = {"$regex": specialization, "$options": "i"}
    if language:
        query["languages"] = {"$regex": language, "$options": "i"}
        
    therapists = await therapists_collection.find(query).to_list(length=100)
    return [parse_therapist(therapist) for therapist in therapists]

@router.get("/{therapist_id}", response_description="Get a therapist by ID")
async def get_therapist(therapist_id: str):
    """
    Get detailed information about a specific therapist including availability
    """
    if not ObjectId.is_valid(therapist_id):
        raise HTTPException(400, "Invalid therapist ID format")
        
    therapist = await therapists_collection.find_one({"_id": ObjectId(therapist_id)})
    if not therapist:
        raise HTTPException(404, "Therapist not found")
    
    therapist_data = parse_therapist(therapist)
    
    # Add availability info (only future slots that aren't booked)
    now = datetime.now()
    availability = []
    for slot in therapist.get("availability", []):
        if slot["start_time"] > now and not slot["is_booked"]:
            availability.append({
                "start_time": slot["start_time"],
                "end_time": slot["end_time"]
            })
    
    therapist_data["available_slots"] = availability
    return therapist_data

@router.get("/specializations", response_description="Get all specializations")
async def get_specializations():
    """
    Get a list of all therapist specializations for filtering
    """
    specializations = await therapists_collection.distinct("specializations")
    return {"specializations": specializations}

@router.post("/appointments", response_description="Book a new appointment")
async def book_appointment(appointment: AppointmentCreate = Body(...)):
    """
    Book a new appointment with a therapist
    """
    if not ObjectId.is_valid(appointment.therapist_id):
        raise HTTPException(400, "Invalid therapist ID format")
    
    # Verify therapist exists
    therapist = await therapists_collection.find_one({"_id": ObjectId(appointment.therapist_id)})
    if not therapist:
        raise HTTPException(404, "Therapist not found")
    
    # Check if time slot is available - improved logic
    slot_available = False
    
    # Debug info
    print(f"Looking for slot: {appointment.start_time} to {appointment.end_time}")
    
    for slot in therapist["availability"]:
        # Convert to string for comparison if needed
        slot_start = slot["start_time"]
        slot_end = slot["end_time"]
        
        # Debug info
        print(f"Checking against slot: {slot_start} to {slot_end}, booked: {slot['is_booked']}")
        
        # Compare timestamps - this is a more robust comparison
        if (slot_start.isoformat() == appointment.start_time.isoformat() and 
            slot_end.isoformat() == appointment.end_time.isoformat() and 
            not slot["is_booked"]):
            slot_available = True
            break
    
    if not slot_available:
        raise HTTPException(400, "This time slot is not available")
    
    # Create appointment - rest of the function remains the same...
    
    # Create appointment
    new_appointment = Appointment(
        user_id=appointment.user_id,
        therapist_id=appointment.therapist_id,
        therapist_name=therapist["name"],
        date=appointment.date,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        notes=appointment.notes
    )
    
    appointment_data = new_appointment.model_dump(by_alias=True)
    inserted_appointment = await appointments_collection.insert_one(appointment_data)
    
    # Update therapist availability
    await therapists_collection.update_one(
        {"_id": ObjectId(appointment.therapist_id), 
         "availability.start_time": appointment.start_time},
        {"$set": {"availability.$.is_booked": True}}
    )
    
    # Return the created appointment
    created_appointment = await appointments_collection.find_one({"_id": inserted_appointment.inserted_id})
    return parse_appointment(created_appointment)

@router.get("/appointments/{appointment_id}", response_description="Get appointment details")
async def get_appointment(appointment_id: str):
    """
    Get details for a specific appointment
    """
    appointment = await appointments_collection.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(404, "Appointment not found")
    
    return parse_appointment(appointment)

@router.get("/appointments/user/{user_id}", response_description="Get user appointments")
async def get_user_appointments(
    user_id: str,
    status: Optional[str] = Query(None, description="Filter by status (scheduled, completed, cancelled)")
):
    """
    Get all appointments for a specific user with optional status filtering
    """
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    appointments = await appointments_collection.find(query).sort("start_time", ASCENDING).to_list(length=50)
    return [parse_appointment(appointment) for appointment in appointments]

@router.put("/appointments/{appointment_id}", response_description="Update appointment")
async def update_appointment(appointment_id: str, update_data: AppointmentUpdate = Body(...)):
    """
    Update an appointment status or notes
    """
    appointment = await appointments_collection.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(404, "Appointment not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(400, "No valid update data provided")
    
    # If status is being updated to cancelled, free up the time slot
    if update_dict.get("status") == "cancelled":
        await therapists_collection.update_one(
            {"_id": ObjectId(appointment["therapist_id"]),
             "availability.start_time": appointment["start_time"]},
            {"$set": {"availability.$.is_booked": False}}
        )
    
    await appointments_collection.update_one(
        {"appointment_id": appointment_id},
        {"$set": update_dict}
    )
    
    updated_appointment = await appointments_collection.find_one({"appointment_id": appointment_id})
    return parse_appointment(updated_appointment)

@router.delete("/appointments/{appointment_id}", response_description="Cancel appointment")
async def cancel_appointment(appointment_id: str):
    """
    Cancel an appointment and free up the therapist's time slot
    """
    appointment = await appointments_collection.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(404, "Appointment not found")
    
    # Only allow cancellation if appointment is still scheduled
    if appointment["status"] != "scheduled":
        raise HTTPException(400, f"Cannot cancel appointment with status: {appointment['status']}")
    
    # Update appointment status
    await appointments_collection.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "cancelled"}}
    )
    
    # Free up the therapist's time slot
    await therapists_collection.update_one(
        {"_id": ObjectId(appointment["therapist_id"]),
         "availability.start_time": appointment["start_time"]},
        {"$set": {"availability.$.is_booked": False}}
    )
    
    return {"message": "Appointment cancelled successfully"}