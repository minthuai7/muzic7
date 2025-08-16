import React, { useState, useEffect } from 'react';
import { Play, Heart, Share2, User, Music, Globe, RefreshCw } from 'lucide-react';
import { Track } from '../types/music';
import { formatTime } from '../utils/formatTime';
import { useSavedTracks } from '../hooks/useSavedTracks';

interface PublicMusicFeedProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export default function PublicMusicFeed({ onPlayTrack, currentTrack, isPlaying }: PublicMusicFeedProps) {
  const [publicTracks, setPublicTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { getPublicTracks } = useSavedTracks();

  useEffect(() => {
    loadPublicTracks();
  }, []);

  const loadPublicTracks = async () => {
    setLoading(true);
    try {
      const tracks = await getPublicTracks();
      setPublicTracks(tracks);
    } catch (error) {
      console.error('Error loading public tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const TrackCard = ({ track }: { track: Track }) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img
              src={track.imageUrl}
              alt={track.title}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800';
              }}
            />
            <button
              onClick={() => onPlayTrack(track)}
              className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-6 h-6 text-white" />
            </button>
            {isCurrentTrack && isPlaying && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-semibold truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                {track.title}
              </h3>
              {track.isGenerated && (
                <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  AI
                </span>
              )}
              <Globe className="w-3 h-3 text-green-400" title="Public Track" />
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-3 h-3 text-gray-400" />
              <p className="text-gray-400 text-sm truncate">{track.artist}</p>
            </div>

            {track.tags && (
              <p className="text-gray-500 text-xs mb-2 truncate">{track.tags}</p>
            )}

            {track.prompt && (
              <div className="bg-white/5 rounded-lg p-3 mb-3">
                <p className="text-gray-300 text-sm italic">"{track.prompt}"</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatTime(track.duration)}</span>
                {track.playCount !== undefined && (
                  <span>{track.playCount} plays</span>
                )}
                {track.createdAt && (
                  <span>{new Date(track.createdAt).toLocaleDateString()}</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Heart className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Share2 className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-gray-400 text-lg">Loading public music...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Globe className="w-8 h-8 mr-3 text-green-400" />
            Public Music Feed
          </h2>
          <p className="text-gray-400">Discover music shared by the community</p>
        </div>
        <button
          onClick={loadPublicTracks}
          disabled={loading}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          title="Refresh feed"
        >
          <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {publicTracks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {publicTracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Music className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Public Music Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Be the first to share your AI-generated music with the community! 
            Generate some tracks and make them public.
          </p>
          <button 
            onClick={() => {
              // Navigate to AI Generator
              window.dispatchEvent(new CustomEvent('navigate-to-generator'));
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
          >
            Create & Share Music
          </button>
        </div>
      )}
    </div>
  );
}