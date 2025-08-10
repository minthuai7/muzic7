import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MusicLibrary from './components/MusicLibrary';
import MusicGenerator from './components/MusicGenerator';
import MusicPlayer from './components/MusicPlayer';
import LoadingSpinner from './components/LoadingSpinner';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useJamendoMusic } from './hooks/useJamendoMusic';
import { Track } from './types/music';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [generatedTracks, setGeneratedTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  
  const {
    tracks: jamendoTracks,
    playlists: jamendoPlaylists,
    loading,
    error,
    searchMusic,
    getTracksByGenre,
    loadMoreTracks
  } = useJamendoMusic();

  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    audioRef,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolumeLevel
  } = useAudioPlayer();

  const handleTrackGenerated = (newTrack: Track) => {
    setGeneratedTracks(prev => [newTrack, ...prev]);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchMusic(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    if (genre === 'all') {
      setGenreTracks([]);
    } else {
      const tracks = await getTracksByGenre(genre);
      setGenreTracks(tracks);
    }
  };

  // Combine all tracks based on current view and filters
  const getAllTracks = () => {
    const allTracks = [...generatedTracks, ...jamendoTracks];
    
    if (searchQuery.trim() && searchResults.length > 0) {
      return [...generatedTracks.filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      ), ...searchResults];
    }
    
    if (selectedGenre && selectedGenre !== 'all' && genreTracks.length > 0) {
      return [...generatedTracks, ...genreTracks];
    }
    
    return allTracks;
  };

  const getPlaylists = () => {
    const allPlaylists = [...jamendoPlaylists];
    
    // Add generated tracks playlist if there are any
    if (generatedTracks.length > 0) {
      allPlaylists.unshift({
        id: 'generated',
        name: 'AI Generated Music',
        description: 'Your custom AI-generated tracks',
        tracks: generatedTracks,
        imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
        createdAt: new Date()
      });
    }
    
    return allPlaylists;
  };

  const renderContent = () => {
    if (loading && jamendoTracks.length === 0) {
      return <LoadingSpinner message="Loading free music from Jamendo..." />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <p className="text-red-400 text-lg">Error loading music: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'generator':
        return (
          <MusicGenerator
            onTrackGenerated={handleTrackGenerated}
            onPlayTrack={playTrack}
          />
        );
      case 'library':
      case 'home':
      default:
        return (
          <MusicLibrary
            tracks={getAllTracks()}
            playlists={getPlaylists()}
            onPlayTrack={playTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onGenreSelect={handleGenreSelect}
            selectedGenre={selectedGenre}
            onLoadMore={loadMoreTracks}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      <audio ref={audioRef} />
      
      <Header onSearch={handleSearch} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
      
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        volume={volume}
        onPlayPause={togglePlayPause}
        onSeek={seekTo}
        onVolumeChange={setVolumeLevel}
      />
    </div>
  );
}

export default App;