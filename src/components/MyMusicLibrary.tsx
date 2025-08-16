import React, { useState } from 'react';
import { Play, Heart, MoreHorizontal, Globe, Lock, Trash2, Edit3, Eye, Music } from 'lucide-react';
import { Track } from '../types/music';
import { formatTime } from '../utils/formatTime';
import { useSavedTracks } from '../hooks/useSavedTracks';

interface MyMusicLibraryProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export default function MyMusicLibrary({ onPlayTrack, currentTrack, isPlaying }: MyMusicLibraryProps) {
  const { savedTracks, loading, updateTrackVisibility, deleteTrack } = useSavedTracks();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const handleVisibilityToggle = async (track: Track) => {
    await updateTrackVisibility(track.id, !track.isPublic);
    setShowMenu(null);
  };

  const handleDelete = async (track: Track) => {
    if (confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      await deleteTrack(track.id);
      setShowMenu(null);
    }
  };

  const TrackItem = ({ track, index }: { track: Track; index: number }) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    
    return (
      <div
        className={`group flex items-center p-4 rounded-lg hover:bg-white/5 transition-colors ${
          isCurrentTrack ? 'bg-white/10' : ''
        }`}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative">
            <span className="text-gray-400 text-sm w-6 text-center block group-hover:hidden">
              {index + 1}
            </span>
            <button
              onClick={() => onPlayTrack(track)}
              className="hidden group-hover:block"
            >
              <Play className="w-4 h-4 text-white" />
            </button>
            {isCurrentTrack && isPlaying && (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-green-500 animate-pulse"></div>
                  <div className="w-0.5 h-2 bg-green-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-0.5 h-4 bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          <img
            src={track.imageUrl}
            alt={track.title}
            className="w-12 h-12 rounded-lg object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800';
            }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                {track.title}
              </h4>
              {track.isGenerated && (
                <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  AI
                </span>
              )}
              {track.isPublic ? (
                <Globe className="w-4 h-4 text-green-400" title="Public" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" title="Private" />
              )}
            </div>
            <p className="text-gray-400 text-sm truncate">{track.artist}</p>
            {track.tags && (
              <p className="text-gray-500 text-xs truncate">{track.tags}</p>
            )}
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              {track.playCount !== undefined && (
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {track.playCount} plays
                </span>
              )}
              {track.createdAt && (
                <span>
                  Saved {new Date(track.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all">
            <Heart className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
          <span className="text-gray-400 text-sm min-w-[40px] text-right">
            {formatTime(track.duration)}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(showMenu === track.id ? null : track.id)}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
            
            {showMenu === track.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(null)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-20">
                  <button
                    onClick={() => handleVisibilityToggle(track)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {track.isPublic ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">Make Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Make Public</span>
                      </>
                    )}
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm">Edit Details</span>
                  </button>
                  <button
                    onClick={() => handleDelete(track)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete Track</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && savedTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-gray-400 text-lg">Loading your music...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Music</h2>
          <p className="text-gray-400">Your saved and generated tracks</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{savedTracks.length}</p>
          <p className="text-gray-400 text-sm">Saved Tracks</p>
        </div>
      </div>

      {savedTracks.length > 0 ? (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="space-y-1">
            {savedTracks.map((track, index) => (
              <TrackItem key={track.id} track={track} index={index} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Music className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Saved Music Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start by generating some AI music or saving tracks from your library. 
            Your saved music will appear here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-to-generator'));
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
            >
              Generate AI Music
            </button>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-to-library'));
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Browse Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}