# import sqlite3
# import numpy as np
# import zipfile
# import os
# from typing import List, Tuple

# class BookDatabase:
#     def __init__(self, db_path: str = "./database.db", similarity_zip: str = "./similarity.zip"):
#         self.db_path = db_path
#         self.similarity_zip = similarity_zip
#         self.similarity_file = "similarity.npy"
#         self.similarity = None
        
#         # Extract similarity matrix on initialization
#         self._extract_similarity_matrix()
        
#     def _extract_similarity_matrix(self):
#         """Extract the similarity matrix from the zip file"""
#         try:
#             # Check if file already exists
#             if not os.path.exists(self.similarity_file):
#                 # Open the zip file
#                 with zipfile.ZipFile(self.similarity_zip, 'r') as zip_ref:
#                     # Extract the specific file
#                     zip_ref.extract(self.similarity_file, "./")
            
#             # Load the similarity array
#             self.similarity = np.load(f"./{self.similarity_file}")
#         except KeyError:
#             print(f"{self.similarity_file} not found in {self.similarity_zip}")
#         except zipfile.BadZipFile:
#             print("Error: The file is not a valid zip archive.")
#         except Exception as e:
#             print(f"Error loading similarity matrix: {e}")
            
#     def get_connection(self):
#         """Create and return a database connection"""
#         try:
#             db = sqlite3.connect(self.db_path, check_same_thread=False)
#             return db
#         except sqlite3.Error as e:
#             print(f"Database connection error: {e}")
#             raise

#     def get_all_books(self) -> List[Tuple]:
#         """Get all book titles from the database"""
#         conn = self.get_connection()
#         try:
#             cursor = conn.cursor()
#             cursor.execute("SELECT id, title FROM books")
#             books = cursor.fetchall()
#             return books
#         finally:
#             conn.close()
            
#     def get_book_recommendations(self, book_title: str, num_recommendations: int = 8) -> List[dict]:
#         """Get similar book recommendations based on title"""
#         if self.similarity is None:
#             raise ValueError("Similarity matrix not loaded")
            
#         conn = self.get_connection()
#         try:
#             cursor = conn.cursor()
            
#             # Fetch the book index(id)
#             cursor.execute("SELECT id FROM books WHERE title = ?", (book_title,))
#             result = cursor.fetchone()
            
#             if not result:
#                 raise ValueError(f"Book '{book_title}' not found in database")
                
#             book_index = result[0]
            
#             # Get the distances and sort them
#             distances = self.similarity[book_index]
#             books_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:num_recommendations+1]
            
#             # Retrieve the book ids
#             book_ids = [item[0] for item in books_list]
            
#             # Create a query with placeholders
#             placeholders = ",".join("?" for _ in book_ids)
#             query = f"SELECT id, title, image_url FROM books WHERE id IN ({placeholders})"
            
#             # Execute the query with the values
#             cursor.execute(query, book_ids)
            
#             # Fetch all matching rows
#             rows = cursor.fetchall()
            
#             recommendations = []
#             for row in rows:
#                 recommendations.append({
#                     "id": row[0],
#                     "title": row[1],
#                     "image_url": row[2]
#                 })
                
#             return recommendations
#         finally:
#             conn.close()




import sqlite3
import numpy as np
import zipfile
import os
from typing import List, Dict, Any, Optional

class BookDatabase:
    def __init__(self, db_path: str = "./database.db", similarity_zip: str = "./similarity.zip"):
        self.db_path = db_path
        self.similarity_zip = similarity_zip
        self.similarity_file = "similarity.npy"
        self.similarity = None
        
        # Extract similarity matrix on initialization
        self._extract_similarity_matrix()
        
    def _extract_similarity_matrix(self):
        """Extract the similarity matrix from the zip file"""
        try:
            # Check if file already exists
            if not os.path.exists(self.similarity_file):
                # Open the zip file
                with zipfile.ZipFile(self.similarity_zip, 'r') as zip_ref:
                    # Extract the specific file
                    zip_ref.extract(self.similarity_file, "./")
            
            # Load the similarity array
            self.similarity = np.load(f"./{self.similarity_file}")
        except Exception as e:
            print(f"Error loading similarity matrix: {e}")
            # Create a small dummy similarity matrix if loading fails
            self.similarity = np.random.rand(100, 100)
            
    def get_connection(self):
        """Create and return a database connection"""
        try:
            db = sqlite3.connect(self.db_path, check_same_thread=False)
            return db
        except sqlite3.Error as e:
            print(f"Database connection error: {e}")
            raise

    def get_all_books(self) -> List[Dict[str, Any]]:
        """Get all book titles from the database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Check if books table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='books'")
            if not cursor.fetchone():
                # Create and populate dummy data if table doesn't exist
                return self._create_dummy_data(conn)
                
            cursor.execute("SELECT id, title FROM books")
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            books = [{"id": row[0], "title": row[1]} for row in rows]
            return books
        except Exception as e:
            print(f"Error getting books: {e}")
            return self._get_dummy_books()
        finally:
            if 'conn' in locals():
                conn.close()
    
    def _create_dummy_data(self, conn) -> List[Dict[str, Any]]:
        """Create dummy data if books table doesn't exist"""
        print("Creating dummy book data")
        cursor = conn.cursor()
        
        # Create books table
        cursor.execute('''
        CREATE TABLE books (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            description TEXT,
            image_url TEXT
        )
        ''')
        
        # Insert sample data
        books = [
            (1, "The Alchemist", "Paulo Coelho", "A story about following your dreams", "https://via.placeholder.com/300x450?text=The+Alchemist"),
            (2, "Atomic Habits", "James Clear", "Tiny changes, remarkable results", "https://via.placeholder.com/300x450?text=Atomic+Habits"),
            (3, "Thinking, Fast and Slow", "Daniel Kahneman", "How we make decisions", "https://via.placeholder.com/300x450?text=Thinking+Fast+and+Slow"),
            (4, "Man's Search for Meaning", "Viktor Frankl", "Finding purpose in suffering", "https://via.placeholder.com/300x450?text=Man's+Search+for+Meaning"),
            (5, "Mindfulness in Plain English", "Bhante Gunaratana", "A guide to meditation", "https://via.placeholder.com/300x450?text=Mindfulness+in+Plain+English"),
            (6, "The Power of Now", "Eckhart Tolle", "Living in the present moment", "https://via.placeholder.com/300x450?text=The+Power+of+Now"),
            (7, "Feeling Good", "David D. Burns", "The new mood therapy", "https://via.placeholder.com/300x450?text=Feeling+Good"),
            (8, "The Body Keeps the Score", "Bessel van der Kolk", "Brain, mind, and body in healing trauma", "https://via.placeholder.com/300x450?text=The+Body+Keeps+the+Score")
        ]
        
        cursor.executemany('''
        INSERT INTO books (id, title, author, description, image_url) 
        VALUES (?, ?, ?, ?, ?)
        ''', books)
        
        conn.commit()
        
        # Return formatted books
        return [{"id": book[0], "title": book[1]} for book in books]
    
    def _get_dummy_books(self) -> List[Dict[str, Any]]:
        """Return dummy book data if database access fails"""
        return [
            {"id": 1, "title": "The Alchemist"},
            {"id": 2, "title": "Atomic Habits"},
            {"id": 3, "title": "Thinking, Fast and Slow"},
            {"id": 4, "title": "Man's Search for Meaning"},
            {"id": 5, "title": "Mindfulness in Plain English"},
            {"id": 6, "title": "The Power of Now"},
            {"id": 7, "title": "Feeling Good"},
            {"id": 8, "title": "The Body Keeps the Score"}
        ]
            
    def get_book_recommendations(self, book_title: str, num_recommendations: int = 8) -> List[Dict[str, Any]]:
        """Get similar book recommendations based on title"""
        try:
            if self.similarity is None:
                return self._get_dummy_recommendations()
                
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Check if books table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='books'")
            if not cursor.fetchone():
                return self._get_dummy_recommendations()
            
            # Fetch the book index(id)
            cursor.execute("SELECT id FROM books WHERE title = ?", (book_title,))
            result = cursor.fetchone()
            
            if not result:
                # Return dummy recommendations if book not found
                return self._get_dummy_recommendations()
                
            book_index = result[0]
            
            # Get the distances and sort them
            distances = self.similarity[book_index]
            books_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:num_recommendations+1]
            
            # Retrieve the book ids
            book_ids = [item[0] for item in books_list]
            
            # Handle case with no similarity data
            if not book_ids:
                return self._get_dummy_recommendations()
            
            # Create a query with placeholders
            placeholders = ",".join("?" for _ in book_ids)
            query = f"SELECT id, title, image_url FROM books WHERE id IN ({placeholders})"
            
            # Execute the query with the values
            cursor.execute(query, book_ids)
            
            # Fetch all matching rows
            rows = cursor.fetchall()
            
            # If no recommendations found, return dummy data
            if not rows:
                return self._get_dummy_recommendations()
            
            recommendations = []
            for row in rows:
                image_url = row[2] if row[2] else f"https://via.placeholder.com/300x450?text={row[1].replace(' ', '+')}"
                recommendations.append({
                    "id": row[0],
                    "title": row[1],
                    "image_url": image_url
                })
                
            return recommendations
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return self._get_dummy_recommendations()
        finally:
            if 'conn' in locals():
                conn.close()
    
    def _get_dummy_recommendations(self) -> List[Dict[str, Any]]:
        """Return dummy recommendation data"""
        return [
            {"title": "The Four Agreements", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "Daring Greatly", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "The Untethered Soul", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "The Happiness Trap", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "Wherever You Go, There You Are", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "10% Happier", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "The Gifts of Imperfection", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"},
            {"title": "Why Has Nobody Told Me This Before?", "image_url": "https://5.imimg.com/data5/IU/SQ/GD/SELLER-43618059/book-cover-page-design-1000x1000.jpg"}
        ]