# from fastapi import APIRouter, HTTPException, Depends
# from typing import List, Optional
# from .models import RecommendationResponse, BookRecommendation
# from .database import BookDatabase

# router = APIRouter(
#     prefix="/books",
#     tags=["Book Recommender"],
#     responses={404: {"description": "Not found"}},
# )

# # Database connection dependency
# def get_book_db():
#     db = BookDatabase()
#     return db

# @router.get("/", summary="Get all available books")
# async def get_books(db: BookDatabase = Depends(get_book_db)):
#     """
#     Get a list of all books available for recommendation
#     """
#     try:
#         books = db.get_all_books()
#         return {"books": [{"id": book[0], "title": book[1]} for book in books]}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# @router.get("/recommend/{book_title}", response_model=RecommendationResponse)
# async def get_recommendations(
#     book_title: str, 
#     limit: Optional[int] = 8,
#     db: BookDatabase = Depends(get_book_db)
# ):
#     """
#     Get book recommendations based on a specified book title
    
#     - **book_title**: The title of the book to base recommendations on
#     - **limit**: Maximum number of recommendations to return (default: 8)
#     """
#     try:
#         books = db.get_book_recommendations(book_title, limit)
        
#         # Convert to response model
#         recommendations = [
#             BookRecommendation(
#                 title=book["title"],
#                 image_url=book["image_url"]
#             ) for book in books
#         ]
        
#         return RecommendationResponse(recommended_books=recommendations)
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")



from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .database import BookDatabase

router = APIRouter(
    prefix="/api/books",  # Note: changed from /books to /api/books
    tags=["Book Recommender"],
    responses={404: {"description": "Not found"}},
)

# Database connection dependency
def get_book_db():
    db = BookDatabase()
    return db

class BookItem(BaseModel):
    id: int
    title: str

class BookRecommendation(BaseModel):
    title: str
    image_url: str

class RecommendationResponse(BaseModel):
    recommended_books: List[BookRecommendation]

@router.get("/", response_model=Dict[str, List[BookItem]])
async def get_books(db: BookDatabase = Depends(get_book_db)):
    """
    Get a list of all books available for recommendation
    """
    try:
        books = db.get_all_books()
        return {"books": books}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/recommend/{book_title}", response_model=RecommendationResponse)
async def get_recommendations(
    book_title: str, 
    limit: Optional[int] = 8,
    db: BookDatabase = Depends(get_book_db)
):
    """
    Get book recommendations based on a specified book title
    
    - **book_title**: The title of the book to base recommendations on
    - **limit**: Maximum number of recommendations to return (default: 8)
    """
    try:
        books = db.get_book_recommendations(book_title, limit)
        
        # Convert to response model format
        recommendations = [
            BookRecommendation(
                title=book["title"],
                image_url=book["image_url"]
            ) for book in books
        ]
        
        return RecommendationResponse(recommended_books=recommendations)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# Add CORS middleware directly to router
# This won't work directly on the router, but shows what to add to your main app
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
"""