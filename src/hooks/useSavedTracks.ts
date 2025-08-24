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
      console.error('Save track error: User not authenticated');
      setError('You must be signed in to save tracks. Please sign in and try again.');
      return false;
    }

    try {
      console.log('Attempting to save track:', { 
        title: track.title, 
        audioUrl: track.audioUrl?.substring(0, 50) + '...', 
        isPublic 
      });
      
      setError(null);
      setLoading(true);

      // Validate track data
      if (!track.title || !track.audioUrl) {
        const missingFields = [];
        if (!track.title) missingFields.push('title');
        if (!track.audioUrl) missingFields.push('audio URL');
        setError(`Cannot save track: missing ${missingFields.join(' and ')}`);
        console.error('Save track validation failed:', { title: track.title, audioUrl: !!track.audioUrl });
        return false;
      }

      // Validate audio URL format
      if (!track.audioUrl.startsWith('http')) {
        setError('Invalid audio URL format');
        console.error('Invalid audio URL:', track.audioUrl);
        return false;
      }

      // Check if track already exists
      const { data: existingTrack } = await supabase
        .from('saved_tracks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', track.title)
        .eq('audio_url', track.audioUrl);

      if (existingTrack && existingTrack.length > 0) {
        setError('Track already saved');
        console.log('Track already exists in database');
        return false;
      }

      // Prepare track data for insertion
      const trackData = {
        user_id: user.id,
        title: track.title.trim(),
        artist: track.artist || 'Unknown Artist',
        duration: Math.floor(track.duration) || 180,
        audio_url: track.audioUrl,
        image_url: track.imageUrl || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: track.tags || null,
        prompt: track.prompt || null,
        task_id: track.taskId || null,
        is_public: isPublic,
        is_generated: track.isGenerated || false,
        play_count: 0
      };

      console.log('Inserting track data:', trackData);

      const { data, error: saveError } = await supabase
        .from('saved_tracks')
        .insert(trackData)
        .select()
        .single();

      if (saveError) {
        console.error('Database save error:', saveError);
        throw saveError;
      }

      if (!data) {
        throw new Error('No data returned from save operation');
      }

      console.log('Track saved successfully:', data);

      const savedTrack = convertSavedTrackToTrack(data);
      setSavedTracks(prev => [savedTrack, ...prev]);
      return true;
    } catch (err) {
      console.error('Error saving track:', err);
      let errorMessage = 'Failed to save track';
      
      if (err.message) {
        if (err.message.includes('duplicate key')) {
          errorMessage = 'This track has already been saved';
        } else if (err.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your account status';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again';
        } else {
          errorMessage = `Save failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
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
      const { error } = await supabase.rpc('increment_play_count', { track_id: trackId });
      if (error) {
        console.warn('Failed to increment play count:', error);
      }
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