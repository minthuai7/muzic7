import React from 'react';
import { Play, Heart, MoreHorizontal, Plus } from 'lucide-react';
import { Track, Playlist } from '../types/music';
import { formatTime } from '../utils/formatTime';
import GenreSelector from './GenreSelector';

interface MusicLibraryProps {
  tracks: Track[];
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onGenreSelect: (genre: string) => void;
  selectedGenre: string | null;
  onLoadMore: () => void;
}

export default function MusicLibrary({ 
  tracks, 
  playlists, 
  onPlayTrack, 
  currentTrack, 
  isPlaying,
  onGenreSelect,
  selectedGenre,
  onLoadMore
}: MusicLibraryProps) {
  const TrackItem = ({ track, index }: { track: Track; index: number }) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    
    return (
      <div
        className={`group flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
          isCurrentTrack ? 'bg-white/10' : ''
        }`}
        onClick={() => onPlayTrack(track)}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative">
            <span className="text-gray-400 text-sm w-6 text-center block group-hover:hidden">
              {index + 1}
            </span>
            <Play className="w-4 h-4 text-white hidden group-hover:block" />
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
          />

          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
              {track.title}
              {track.isGenerated && (
                <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  AI
                </span>
              )}
            </h4>
            <p className="text-gray-400 text-sm truncate">{track.artist}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all">
            <Heart className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
          <span className="text-gray-400 text-sm min-w-[40px] text-right">
            {formatTime(track.duration)}
          </span>
          <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Genre Selection */}
      <GenreSelector onGenreSelect={onGenreSelect} selectedGenre={selectedGenre} />

      {/* Featured Playlists */}
      {playlists.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            {selectedGenre && selectedGenre !== 'all' ? `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Albums` : 'Featured Albums & Playlists'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.slice(0, 6).map((playlist) => (
              <div
                key={playlist.id}
                className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <img
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  className="w-full aspect-square rounded-xl object-cover mb-4"
                />
                <h3 className="text-white font-semibold text-lg mb-2 truncate">{playlist.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{playlist.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{playlist.tracks.length} tracks</span>
                  <button 
                    onClick={() => playlist.tracks.length > 0 && onPlayTrack(playlist.tracks[0])}
                    className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Tracks */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {selectedGenre && selectedGenre !== 'all' 
              ? `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Music`
              : 'All Tracks'
            }
          </h2>
          <span className="text-gray-400 text-sm">
            {tracks.length} tracks available
          </span>
        </div>
        
        {tracks.length > 0 ? (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <TrackItem key={`${track.id}-${index}`} track={track} index={index} />
              ))}
            </div>
            
            {tracks.length >= 20 && (
              <div className="mt-6 text-center">
                <button
                  onClick={onLoadMore}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Load More Tracks</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
            <p className="text-gray-400 text-lg mb-4">No tracks found</p>
            <p className="text-gray-500 text-sm">
              {selectedGenre && selectedGenre !== 'all' 
                ? `Try selecting a different genre or search for specific tracks.`
                : 'Try searching for music or generate some AI tracks.'
              }
            </p>
          </div>
        )}
      </section>
    </div>
  );
}