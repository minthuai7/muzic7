import React, { useState } from 'react';
import { X, Save, Globe, Lock, Loader2, Music } from 'lucide-react';
import { Track } from '../types/music';

interface SaveTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onSave: (track: Track, isPublic: boolean) => Promise<boolean>;
}

export default function SaveTrackModal({ isOpen, onClose, track, onSave }: SaveTrackModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setIsPublic(false);
    setLoading(false);
    setMessage('');
    setError('');
    onClose();
  };
  const handleSave = async () => {
    if (!track) {
      const errorMsg = 'No track selected to save';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate track data before saving
    if (!track.title?.trim()) {
      const errorMsg = 'Track must have a title to be saved';
      console.error(errorMsg, 'Track title:', track.title);
      setError(errorMsg);
      return;
    }

    if (!track.audioUrl) {
      const errorMsg = 'Track must have an audio URL to be saved';
      console.error(errorMsg, 'Track audioUrl:', track.audioUrl);
      setError(errorMsg);
      return;
    }

    console.log('=== SAVE TRACK MODAL ===');
    console.log('Track to save:', {
      id: track.id,
      title: track.title,
      artist: track.artist,
      audioUrl: track.audioUrl ? 'Present' : 'Missing',
      isPublic: isPublic
    });

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const success = await onSave(track, isPublic);
      
      console.log('Save result:', success);
      
      if (success) {
        const successMsg = `Track saved successfully as ${isPublic ? 'public' : 'private'}!`;
        console.log(successMsg);
        setMessage(successMsg);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        const errorMsg = 'Failed to save track. Please check the console for details.';
        console.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('=== SAVE TRACK MODAL ERROR ===');
      console.error('Error:', error);
      const errorMsg = `Unexpected error: ${error?.message || 'Unknown error'}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Save className="w-6 h-6 mr-2" />
            Save Track
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm">
              {message}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {/* Track Preview */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex items-center space-x-4">
            <img
              src={track.imageUrl}
              alt={track.title}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{track.title}</h3>
              <p className="text-gray-400 text-sm truncate">{track.artist}</p>
              {track.isGenerated && (
                <div className="flex items-center mt-1">
                  <Music className="w-3 h-3 text-purple-400 mr-1" />
                  <span className="text-purple-400 text-xs">AI Generated</span>
                </div>
              )}
              {track.audioUrl && (
                <p className="text-gray-500 text-xs mt-1">
                  Audio: {track.audioUrl.length > 50 ? track.audioUrl.substring(0, 50) + '...' : track.audioUrl}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Visibility Options */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white">Visibility</h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                disabled={loading}
                className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Private</p>
                  <p className="text-gray-400 text-sm">Only you can see this track</p>
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                disabled={loading}
                className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Public</p>
                  <p className="text-gray-400 text-sm">Anyone can discover and play this track</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Track</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}