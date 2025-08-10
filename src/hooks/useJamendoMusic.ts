import { useState, useEffect } from 'react';
import JamendoAPI from '../services/jamendoAPI';
import { Track, Playlist } from '../types/music';

export function useJamendoMusic() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const jamendoAPI = new JamendoAPI();

  useEffect(() => {
    loadInitialMusic();
  }, []);

  const loadInitialMusic = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load popular tracks
      const popularTracks = await jamendoAPI.getPopularTracks(30);
      const convertedTracks = popularTracks.map(track => jamendoAPI.convertToTrack(track));
      setTracks(convertedTracks);

      // Load popular albums as playlists
      const albums = await jamendoAPI.getAlbums({ limit: 10 });
      const convertedPlaylists: Playlist[] = [];

      for (const album of albums.slice(0, 6)) {
        // Get tracks for each album
        const albumTracks = await jamendoAPI.getTracks({
          limit: 10,
          search: `${album.artist_name} ${album.name}`
        });
        
        if (albumTracks.length > 0) {
          const playlist = jamendoAPI.convertToPlaylist(album, albumTracks.slice(0, 8));
          convertedPlaylists.push(playlist);
        }
      }

      setPlaylists(convertedPlaylists);
    } catch (err) {
      setError('Failed to load music from Jamendo');
      console.error('Error loading Jamendo music:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchMusic = async (query: string): Promise<Track[]> => {
    if (!query.trim()) return tracks;

    try {
      const searchResults = await jamendoAPI.searchTracks(query, 20);
      return searchResults.map(track => jamendoAPI.convertToTrack(track));
    } catch (err) {
      console.error('Error searching music:', err);
      return [];
    }
  };

  const getTracksByGenre = async (genre: string): Promise<Track[]> => {
    try {
      const genreTracks = await jamendoAPI.getTracksByGenre(genre, 20);
      return genreTracks.map(track => jamendoAPI.convertToTrack(track));
    } catch (err) {
      console.error('Error loading genre tracks:', err);
      return [];
    }
  };

  const loadMoreTracks = async () => {
    try {
      const moreTracks = await jamendoAPI.getTracks({
        limit: 20,
        offset: tracks.length,
        order: 'popularity_total'
      });
      const convertedTracks = moreTracks.map(track => jamendoAPI.convertToTrack(track));
      setTracks(prev => [...prev, ...convertedTracks]);
    } catch (err) {
      console.error('Error loading more tracks:', err);
    }
  };

  return {
    tracks,
    playlists,
    loading,
    error,
    searchMusic,
    getTracksByGenre,
    loadMoreTracks,
    refreshMusic: loadInitialMusic
  };
}