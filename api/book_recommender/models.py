from pydantic import BaseModel
from typing import List, Optional

class Book(BaseModel):
    id: int
    title: str
    image_url: str
    
class BookRecommendation(BaseModel):
    title: str
    image_url: str

class RecommendationResponse(BaseModel):
    recommended_books: List[BookRecommendation]