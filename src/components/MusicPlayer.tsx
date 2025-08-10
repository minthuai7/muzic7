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
      <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-4">
        <div className="flex items-center justify-center text-gray-400">
          <Music className="w-8 h-8 mr-2" />
          <span>Select a track to start listening</span>
        </div>
      </div>
    );
  }

  const progress = (currentTime / currentTrack.duration) * 100;

  return (
    <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-4">
      <div className="flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center space-x-4 flex-1">
          <img
            src={currentTrack.imageUrl}
            alt={currentTrack.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h4 className="text-white font-medium">{currentTrack.title}</h4>
            <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-2 flex-2">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Shuffle className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={onPlayPause}
              className="bg-white text-black rounded-full p-3 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full max-w-lg">
            <span className="text-xs text-gray-400 min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 bg-gray-600 rounded-full h-1 cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percentage = (e.clientX - rect.left) / rect.width;
                onSeek(percentage * currentTrack.duration);
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
            <span className="text-xs text-gray-400 min-w-[40px]">
              {formatTime(currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
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