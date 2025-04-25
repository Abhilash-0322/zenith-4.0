from .router import router
from .database import BookDatabase

__all__ = ["router", "BookDatabase"]

# main.py update
# Import section remains the same
# ...

# Add this line to include the router with the correct prefix
# app.include_router(book_router, prefix="/api")  # Note: if using prefix in router definition, don't add it here again

# Make sure CORS is properly configured
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # During development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
"""