import { useState, useEffect } from 'react';
import JamendoAPI from '../services/jamendoAPI';
import { Track, Playlist } from '../types/music';

export function useJamendoMusic() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);

  const jamendoAPI = new JamendoAPI();

  useEffect(() => {
    loadInitialMusic();
  }, []);

  const loadInitialMusic = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentOffset(0);

      // Load popular tracks initially with better error handling
      const popularTracks = await jamendoAPI.getPopularTracks(50);
      
      // If no tracks from API, show a user-friendly message but don't error
      if (popularTracks.length === 0) {
        console.warn('No tracks available from Jamendo API - this is normal if API key is not configured');
        setTracks([]);
        setHasMore(false);
        setPlaylists([]);
        return;
      }
      
      const convertedTracks = popularTracks.map(track => jamendoAPI.convertToTrack(track));
      setTracks(convertedTracks);
      setCurrentOffset(50);
      setHasMore(popularTracks.length === 50);

      // Load albums as playlists
      const albums = await jamendoAPI.getAlbums({ limit: 12 });
      const convertedPlaylists: Playlist[] = [];

      // Process albums in parallel for better performance
      const albumPromises = albums.slice(0, 8).map(async (album) => {
        // Get tracks for each album
        try {
          const albumTracks = await jamendoAPI.getTracks({
            limit: 10,
            search: `${album.artist_name} ${album.name}`.substring(0, 50) // Limit search query length
          });
          
          if (albumTracks.length > 0) {
            return jamendoAPI.convertToPlaylist(album, albumTracks.slice(0, 8));
          }
        } catch (err) {
          console.warn(`Failed to load tracks for album ${album.name}:`, err);
        }
        return null;
      });

      const playlistResults = await Promise.allSettled(albumPromises);
      playlistResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          convertedPlaylists.push(result.value);
        }
        });

      setPlaylists(convertedPlaylists);
    } catch (err) {
      console.warn('Jamendo API unavailable - using fallback mode:', err);
      // Don't set error state, just use empty data
      setTracks([]);
      setPlaylists([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const searchMusic = async (query: string): Promise<Track[]> => {
    if (!query.trim()) return tracks;

    try {
      const searchResults = await jamendoAPI.searchTracks(query, 50);
      return searchResults.map(track => jamendoAPI.convertToTrack(track));
    } catch (err) {
      console.error('Error searching music:', err);
      return [];
    }
  };

  const getTracksByGenre = async (genre: string): Promise<Track[]> => {
    try {
      const genreTracks = await jamendoAPI.getTracksByGenre(genre, 60);
      return genreTracks.map(track => jamendoAPI.convertToTrack(track));
    } catch (err) {
      console.error('Error loading genre tracks:', err);
      return [];
    }
  };

  const loadMoreTracks = async () => {
    if (!hasMore) return;
    
    try {
      setLoading(true);
      const moreTracks = await jamendoAPI.getTracks({
        limit: 50,
        offset: currentOffset,
        order: 'popularity_total'
      });
      
      const convertedTracks = moreTracks.map(track => jamendoAPI.convertToTrack(track));
      
      if (convertedTracks.length > 0) {
        setTracks(prev => [...prev, ...convertedTracks]);
        setCurrentOffset(prev => prev + moreTracks.length);
        setHasMore(moreTracks.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRandomTracks = async (count: number = 30): Promise<Track[]> => {
    try {
      // Get random tracks by using different offsets
      const randomOffset = Math.floor(Math.random() * 1000);
      const randomTracks = await jamendoAPI.getTracks({
        limit: count,
        offset: randomOffset,
        order: 'releasedate_desc'
      });
      return randomTracks.map(track => jamendoAPI.convertToTrack(track));
    } catch (err) {
      console.error('Error loading random tracks:', err);
      return [];
    }
  };
  return {
    tracks,
    playlists,
    loading,
    error,
    hasMore,
    searchMusic,
    getTracksByGenre,
    loadMoreTracks,
    refreshMusic: loadInitialMusic,
    getRandomTracks
  };
}