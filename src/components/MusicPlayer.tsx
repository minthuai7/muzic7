import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Music } from 'lucide-react';
import { Track } from '../types/music';
import { formatTime } from '../utils/formatTime';

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function MusicPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange
}: MusicPlayerProps) {
  if (!currentTrack) {
    return (
      <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-2 md:p-4">
        <div className="flex items-center justify-center text-gray-400">
          <Music className="w-6 md:w-8 h-6 md:h-8 mr-2" />
          <span className="text-sm md:text-base">Select a track to start listening</span>
        </div>
      </div>
    );
  }

  const duration = currentTrack.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-2 md:p-4">
      <div className="flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
          <img
            src={currentTrack.imageUrl}
            alt={currentTrack.title}
            className="w-12 md:w-16 h-12 md:h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800';
            }}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium text-sm md:text-base truncate">{currentTrack.title}</h4>
            <p className="text-gray-400 text-xs md:text-sm truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2 flex-2">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors hidden md:block">
              <Shuffle className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors hidden md:block">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={onPlayPause}
              className="bg-white text-black rounded-full p-2 md:p-3 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-4 md:w-6 h-4 md:h-6" />
              ) : (
                <Play className="w-4 md:w-6 h-4 md:h-6 ml-0.5 md:ml-1" />
              )}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors hidden md:block">
              <SkipForward className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors hidden md:block">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-1 md:space-x-2 w-full max-w-lg">
            <span className="text-xs text-gray-400 min-w-[30px] md:min-w-[40px] hidden md:block">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 bg-gray-600 rounded-full h-1 cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percentage = (e.clientX - rect.left) / rect.width;
                onSeek(percentage * duration);
              }}
            >
              <div
                className="bg-white rounded-full h-1 transition-all"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, marginLeft: '-6px' }}
              />
            </div>
            <span className="text-xs text-gray-400 min-w-[30px] md:min-w-[40px] hidden md:block">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-2 flex-1 justify-end hidden md:flex">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
}