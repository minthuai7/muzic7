import React from 'react';
import { Music2, Headphones, Radio, Disc3 } from 'lucide-react';

interface GenreSelectorProps {
  onGenreSelect: (genre: string) => void;
  selectedGenre: string | null;
}

export default function GenreSelector({ onGenreSelect, selectedGenre }: GenreSelectorProps) {
  const genres = [
    { id: 'all', name: 'All Music', icon: Music2, color: 'from-purple-500 to-pink-500' },
    { id: 'electronic', name: 'Electronic', icon: Radio, color: 'from-blue-500 to-cyan-500' },
    { id: 'rock', name: 'Rock', icon: Disc3, color: 'from-red-500 to-orange-500' },
    { id: 'jazz', name: 'Jazz', icon: Headphones, color: 'from-yellow-500 to-amber-500' },
    { id: 'classical', name: 'Classical', icon: Music2, color: 'from-green-500 to-emerald-500' },
    { id: 'ambient', name: 'Ambient', icon: Radio, color: 'from-indigo-500 to-purple-500' },
    { id: 'folk', name: 'Folk', icon: Music2, color: 'from-teal-500 to-green-500' },
    { id: 'world', name: 'World', icon: Disc3, color: 'from-pink-500 to-rose-500' }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-white mb-4">Browse by Genre</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onGenreSelect(genre.id)}
            className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105 ${
              selectedGenre === genre.id
                ? 'ring-2 ring-white/50 scale-105'
                : ''
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10 flex flex-col items-center space-y-2">
              <genre.icon className="w-6 h-6 text-white" />
              <span className="text-white text-sm font-medium text-center">
                {genre.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}