import React, { useState, useEffect } from 'react';
import { Book, Search, ArrowRight } from 'lucide-react';
import axios from 'axios';

const BookRecommender = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [error, setError] = useState(null);

  // Function to search for books using Google Books API
  const searchBooks = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoadingBooks(true);
      setError(null);
      
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=10`
      );
      
      if (response.data && response.data.items) {
        const formattedBooks = response.data.items.map(book => ({
          id: book.id,
          title: book.volumeInfo.title,
          author: book.volumeInfo.authors ? book.volumeInfo.authors[0] : 'Unknown Author',
          thumbnail: book.volumeInfo.imageLinks?.thumbnail || null,
          publishedDate: book.volumeInfo.publishedDate,
          categories: book.volumeInfo.categories || []
        }));
        
        setBooks(formattedBooks);
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.error("Error searching books:", err);
      setError('Failed to search books. Please try again later.');
    } finally {
      setLoadingBooks(false);
    }
  };

  // Function to get recommendations based on the selected book
  const getRecommendations = async () => {
    if (!selectedBook) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use Google Books API to search for books similar to the selected book
      // We'll use categories and author as search parameters
      const searchParams = [];
      
      if (selectedBook.categories && selectedBook.categories.length > 0) {
        searchParams.push(`subject:${encodeURIComponent(selectedBook.categories[0])}`);
      }
      
      // Add a keyword from the title (excluding common words)
      const titleWords = selectedBook.title.split(' ')
        .filter(word => word.length > 3 && !['the', 'and', 'that', 'with'].includes(word.toLowerCase()));
      
      if (titleWords.length > 0) {
        searchParams.push(encodeURIComponent(titleWords[0]));
      }
      
      const searchQuery = searchParams.join('+');
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=8`
      );
      
      if (response.data && response.data.items) {
        // Filter out the selected book from recommendations
        const filteredRecommendations = response.data.items
          .filter(book => book.id !== selectedBook.id)
          .map(book => ({
            id: book.id,
            title: book.volumeInfo.title,
            author: book.volumeInfo.authors ? book.volumeInfo.authors[0] : 'Unknown Author',
            image_url: book.volumeInfo.imageLinks?.thumbnail || null,
            description: book.volumeInfo.description ? 
              book.volumeInfo.description.substring(0, 100) + '...' : 
              'No description available'
          }));
        
        setRecommendations(filteredRecommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError('Failed to get recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input submission
  const handleSearch = (e) => {
    e.preventDefault();
    searchBooks();
  };

  // Handle book selection
  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setRecommendations([]);
  };

  // Handle getting recommendations
  const handleGetRecommendations = () => {
    getRecommendations();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header Section */}
      <section className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Book className="h-16 w-16 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Recommendations</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Discover books that inspire, comfort, and support your mental well-being journey.
        </p>
      </section>

      {/* Search Section */}
      <section className="bg-purple-50 rounded-2xl p-8 shadow-lg mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Find Your Next Read</h2>
        
        <div className="max-w-xl mx-auto">
          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-8">
            <label htmlFor="book-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search for books
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                id="book-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter book title, author, or genre..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!searchTerm.trim() || loadingBooks}
                className={`px-6 py-3 font-medium rounded-lg shadow-md transition-colors flex items-center justify-center ${
                  !searchTerm.trim() || loadingBooks 
                  ? "bg-gray-400 text-white cursor-not-allowed" 
                  : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {loadingBooks ? 'Searching...' : (
                  <>
                    Search
                    <Search className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Selected book section */}
          {selectedBook && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Selected Book:</h3>
              <div className="bg-white p-4 rounded-lg shadow flex items-center">
                {selectedBook.thumbnail ? (
                  <img 
                    src={selectedBook.thumbnail} 
                    alt={selectedBook.title} 
                    className="h-20 w-16 object-cover mr-4"
                  />
                ) : (
                  <div className="h-20 w-16 bg-gray-200 flex items-center justify-center mr-4">
                    <Book className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{selectedBook.title}</div>
                  <div className="text-sm text-gray-600">{selectedBook.author}</div>
                </div>
              </div>
              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className={`mt-4 px-6 py-3 font-medium rounded-lg shadow-md transition-colors flex items-center justify-center w-full ${
                  loading 
                  ? "bg-gray-400 text-white cursor-not-allowed" 
                  : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {loading ? 'Finding Recommendations...' : (
                  <>
                    Get Recommendations
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Search Results */}
        {books.length > 0 && !selectedBook && (
        <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Search Results:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
                <div 
                key={book.id}
                onClick={() => handleSelectBook(book)}
                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col items-center"
                >
                <div className="flex justify-center mb-4 h-56 w-full">
                    {book.thumbnail ? (
                    <img 
                        src={book.thumbnail.replace('http:', 'https:')} 
                        alt={book.title} 
                        className="h-56 object-contain"
                    />
                    ) : (
                    <div className="h-56 w-40 bg-gray-200 flex items-center justify-center">
                        <Book className="h-20 w-20 text-gray-400" />
                    </div>
                    )}
                </div>
                <div className="text-center w-full">
                    <h4 className="font-medium text-lg mb-2 line-clamp-2 h-14">{book.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                    <p className="text-xs text-gray-500">{book.publishedDate}</p>
                </div>
                </div>
            ))}
            </div>
        </div>
        )}

        {/* No results message */}
        {searchTerm && !loadingBooks && books.length === 0 && !error && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No books found. Try another search term.</h3>
          </div>
        )}
      </section>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {recommendations.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
            Books You Might Enjoy
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((book) => (
              <div 
                key={book.id} 
                className="bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="h-64 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {book.image_url ? (
                    <img 
                      src={book.image_url} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Book className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-lg line-clamp-2 h-14">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 h-10">
                    {book.description}
                  </p>
                  <button className="mt-4 text-purple-600 hover:text-purple-800 font-medium flex items-center text-sm">
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Loading Recommendations */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-medium text-gray-600">Finding books for you...</h3>
        </div>
      )}

      {/* Info Section */}
      <section className="bg-indigo-50 rounded-xl p-8 mt-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-indigo-900 mb-4">How It Works</h2>
          <p className="text-gray-700 mb-6">
            Our book recommendation system uses the Google Books API to suggest books based on your selection. 
            These recommendations are tailored to find books with similar themes, authors, and categories to enhance your reading experience.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow">
              <div className="text-indigo-600 font-bold mb-2">Step 1</div>
              <p className="text-gray-600">Search for a book you've enjoyed reading</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow">
              <div className="text-indigo-600 font-bold mb-2">Step 2</div>
              <p className="text-gray-600">Select a book from the search results</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow">
              <div className="text-indigo-600 font-bold mb-2">Step 3</div>
              <p className="text-gray-600">Discover new books tailored to your taste</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookRecommender;