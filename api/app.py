from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from typing import List, Optional
import uvicorn

# Initialize FastAPI app
app = FastAPI(title="Music Recommendation API", 
              description="API for music recommendations based on song similarity",
              version="1.0.0")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Spotify API credentials
CLIENT_ID = '445f4d10566043b897cafc061a2609a6'
CLIENT_SECRET = '54e1eba9297a45d59a04f01108b589e1'

# Initialize Spotify client
client_credentials_manager = SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

# Load model and data
try:
    similarity = pickle.load(open('pkls/similarity.pkl', 'rb'))
    music_df = pickle.load(open('pkls/df.pkl', 'rb'))
except FileNotFoundError:
    similarity = None
    music_df = None

# Define response models
class Song(BaseModel):
    name: str
    artist: str
    album_cover_url: str
    spotify_uri: Optional[str] = None

class RecommendationResponse(BaseModel):
    input_song: str
    recommendations: List[Song]

class SongListResponse(BaseModel):
    songs: List[str]

# Helper functions
def get_song_details(song_name, artist_name):
    """Get song details including album cover URL and Spotify URI"""
    search_query = f"track:{song_name} artist:{artist_name}"
    results = sp.search(q=search_query, type="track")

    if results and results['tracks']['items']:
        track = results['tracks']['items'][0]
        return {
            "album_cover_url": track['album']['images'][0]['url'] if track['album']['images'] else "https://i.postimg.cc/0QNxYz4V/social.png",
            "spotify_uri": track['uri']
        }
    else:
        return {
            "album_cover_url": "https://i.postimg.cc/0QNxYz4V/social.png",  # Placeholder image
            "spotify_uri": None
        }

def recommend_songs(song_name):
    """Generate song recommendations based on similarity"""
    if similarity is None or music_df is None:
        raise HTTPException(status_code=500, detail="Model data not loaded properly")
    
    try:
        index = music_df[music_df['song'] == song_name].index[0]
    except IndexError:
        raise HTTPException(status_code=404, detail=f"Song '{song_name}' not found in database")
    
    distances = sorted(list(enumerate(similarity[index])), reverse=True, key=lambda x: x[1])
    
    recommendations = []
    for i in distances[1:6]:  # Get top 5 recommendations
        song = music_df.iloc[i[0]].song
        artist = music_df.iloc[i[0]].artist
        
        song_details = get_song_details(song, artist)
        
        recommendations.append(Song(
            name=song,
            artist=artist,
            album_cover_url=song_details["album_cover_url"],
            spotify_uri=song_details["spotify_uri"]
        ))
    
    return recommendations

# API Endpoints
@app.get("/", tags=["Root"])
async def read_root():
    """Welcome endpoint with API information"""
    return {
        "message": "Welcome to the Music Recommendation API",
        "available_endpoints": [
            "/songs - Get list of all songs",
            "/recommend - Get song recommendations",
            "/song_details - Get details for a specific song"
        ]
    }

@app.get("/songs", response_model=SongListResponse, tags=["Songs"])
async def get_songs():
    """Get a list of all available songs in the database"""
    if music_df is None:
        raise HTTPException(status_code=500, detail="Song database not loaded properly")
    
    return {"songs": music_df['song'].tolist()}

@app.get("/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(song: str = Query(..., description="Name of the song to get recommendations for")):
    """Get song recommendations based on the provided song name"""
    if song not in music_df['song'].values:
        raise HTTPException(status_code=404, detail=f"Song '{song}' not found in database")
    
    recommendations = recommend_songs(song)
    
    return {
        "input_song": song,
        "recommendations": recommendations
    }

@app.get("/song_details", response_model=Song, tags=["Songs"])
async def get_song_details_endpoint(
    song: str = Query(..., description="Name of the song"),
    artist: str = Query(..., description="Name of the artist")
):
    """Get details for a specific song by name and artist"""
    details = get_song_details(song, artist)
    
    return {
        "name": song,
        "artist": artist,
        "album_cover_url": details["album_cover_url"],
        "spotify_uri": details["spotify_uri"]
    }

if __name__ == "__main__":
    # Run the application with uvicorn when script is executed directly
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)