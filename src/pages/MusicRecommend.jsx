import { useState, useEffect } from 'react';
import { Search, Disc, Play, Music, Radio, Loader } from 'lucide-react';

// API endpoints (change the base URL to match your FastAPI server)
const API_BASE_URL = 'http://localhost:8000';

const MusicRecommend = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all songs on component mount
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/songs`);
        const data = await response.json();
        setSongs(data.songs);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('Failed to load songs. Please check if the API server is running.');
      }
    };
    
    fetchSongs();
  }, []);

  // Filter songs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSongs([]);
      setShowDropdown(false);
      return;
    }
    
    const filtered = songs.filter(song => 
      song.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
    
    setFilteredSongs(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchTerm, songs]);

  // Fetch recommendations when a song is selected
  const getRecommendations = async (song) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/recommend?song=${encodeURIComponent(song)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations);
      setSelectedSong(song);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle song selection from dropdown
  const handleSelectSong = (song) => {
    setSearchTerm(song);
    setShowDropdown(false);
    getRecommendations(song);
  };

  // Open song in Spotify
  const openInSpotify = (uri) => {
    if (uri) {
      const spotifyUrl = uri.replace('spotify:track:', 'https://open.spotify.com/track/');
      window.open(spotifyUrl, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-indigo-900">Music Therapy</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Discover music that soothes your mind and uplifts your spirit. Our recommendation system helps you find the perfect soundtrack for your mood and mindfulness practice.
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-12 max-w-xl mx-auto">
        <div className="relative">
          <div className="flex items-center bg-white rounded-lg px-4 py-3 shadow-md">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a song..."
              className="w-full bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400"
            />
          </div>
          
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {filteredSongs.map((song, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSong(song)}
                  className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center"
                >
                  <Music className="h-4 w-4 text-indigo-400 mr-2" />
                  <span className="text-gray-800">{song}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center my-12">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Selected Song */}
      {selectedSong && !isLoading && (
        <div className="mb-8 text-center">
          <h3 className="text-xl mb-2 text-gray-700">Recommendations based on:</h3>
          <div className="text-2xl font-bold text-indigo-600">{selectedSong}</div>
        </div>
      )}

      {/* Recommendations -  */}
      {recommendations.length > 0 && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendations.map((song, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="relative">
                <div className="w-full h-32 overflow-hidden">
                  <img 
                    src={song.album_cover_url} 
                    alt={`${song.name} album cover`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                {song.spotify_uri && (
                  <button
                    onClick={() => openInSpotify(song.spotify_uri)}
                    className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 rounded-full p-1 shadow-lg transition-all duration-300"
                  >
                    <Play className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>
              <div className="p-2">
                <h3 className="font-bold text-sm line-clamp-1 text-gray-800" title={song.name}>{song.name}</h3>
                <p className="text-gray-600 text-xs line-clamp-1" title={song.artist}>{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Music Therapy Benefits */}
      {!isLoading && recommendations.length === 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-indigo-900 text-center mb-8">Benefits of Music Therapy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 mb-4">
                <Disc className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Stress Reduction</h3>
              <p className="text-gray-600">
                Listening to calming music can lower cortisol levels and help manage stress and anxiety.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-purple-600 mb-4">
                <Radio className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Mood Enhancement</h3>
              <p className="text-gray-600">
                Music stimulates dopamine release, helping to elevate mood and create positive emotions.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <Music className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Mindful Focus</h3>
              <p className="text-gray-600">
                Music provides an anchor for mindfulness practices, helping to center your attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicRecommend;