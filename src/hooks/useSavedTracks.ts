import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Track, SavedTrack } from '../types/music';
import { useAuth } from './useAuth';

export function useSavedTracks() {
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSavedTracks();
    } else {
      setSavedTracks([]);
    }
  }, [user]);

  const loadSavedTracks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('saved_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const tracks: Track[] = (data || []).map(convertSavedTrackToTrack);
      setSavedTracks(tracks);
    } catch (err) {
      console.error('Error loading saved tracks:', err);
      setError('Failed to load saved tracks');
    } finally {
      setLoading(false);
    }
  };

  const saveTrack = async (track: Track, isPublic: boolean = false): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to save tracks');
      return false;
    }

    try {
      setError(null);

      // Validate track data
      if (!track.title || !track.audioUrl) {
        setError('Invalid track data - missing title or audio URL');
        return false;
      }

      // Check if track already exists
      const { data: existingTrack } = await supabase
        .from('saved_tracks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', track.title)
        .eq('audio_url', track.audioUrl)
        .single();

      if (existingTrack) {
        setError('Track already saved');
        return false;
      }

      const { data, error: saveError } = await supabase
        .from('saved_tracks')
        .insert({
          user_id: user.id,
          title: track.title,
          artist: track.artist,
          duration: Math.floor(track.duration),
          audio_url: track.audioUrl,
          image_url: track.imageUrl,
          tags: track.tags || null,
          prompt: track.prompt || null,
          task_id: track.taskId || null,
          is_public: isPublic,
          is_generated: track.isGenerated || false
        })
        .select()
        .single();

      if (saveError) throw saveError;

      const savedTrack = convertSavedTrackToTrack(data);
      setSavedTracks(prev => [savedTrack, ...prev]);
      return true;
    } catch (err) {
      console.error('Error saving track:', err);
      const errorMessage = err.message || 'Failed to save track';
      setError(errorMessage);
      return false;
    }
  };

  const updateTrackVisibility = async (trackId: string, isPublic: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('saved_tracks')
        .update({ is_public: isPublic })
        .eq('id', trackId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSavedTracks(prev =>
        prev.map(track =>
          track.id === trackId ? { ...track, isPublic } : track
        )
      );
      return true;
    } catch (err) {
      console.error('Error updating track visibility:', err);
      setError('Failed to update track visibility');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrack = async (trackId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('saved_tracks')
        .delete()
        .eq('id', trackId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setSavedTracks(prev => prev.filter(track => track.id !== trackId));
      return true;
    } catch (err) {
      console.error('Error deleting track:', err);
      setError('Failed to delete track');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const incrementPlayCount = async (trackId: string) => {
    try {
      await supabase.rpc('increment_play_count', { track_id: trackId });
    } catch (err) {
      console.error('Error incrementing play count:', err);
    }
  };

  const getPublicTracks = async (): Promise<Track[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('saved_tracks')
        .select(`
          *,
          user_profiles (
            username,
            display_name
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      return (data || []).map(item => ({
        ...convertSavedTrackToTrack(item),
        artist: item.user_profiles?.display_name || item.user_profiles?.username || 'Anonymous'
      }));
    } catch (err) {
      console.error('Error loading public tracks:', err);
      return [];
    }
  };

  return {
    savedTracks,
    loading,
    error,
    saveTrack,
    updateTrackVisibility,
    deleteTrack,
    incrementPlayCount,
    getPublicTracks,
    refreshTracks: loadSavedTracks
  };
}

function convertSavedTrackToTrack(savedTrack: SavedTrack): Track {
  return {
    id: savedTrack.id,
    title: savedTrack.title,
    artist: savedTrack.artist,
    duration: savedTrack.duration,
    audioUrl: savedTrack.audio_url,
    imageUrl: savedTrack.image_url,
    tags: savedTrack.tags,
    prompt: savedTrack.prompt,
    taskId: savedTrack.task_id,
    isGenerated: savedTrack.is_generated,
    isSaved: true,
    isPublic: savedTrack.is_public,
    playCount: savedTrack.play_count,
    userId: savedTrack.user_id,
    createdAt: new Date(savedTrack.created_at)
  };
}