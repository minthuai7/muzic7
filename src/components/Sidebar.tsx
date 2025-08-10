import React from 'react';
import { Home, Music, Sparkles, Library, Heart, Clock } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'generator', label: 'AI Generator', icon: Sparkles },
    { id: 'liked', label: 'Liked Songs', icon: Heart },
    { id: 'recent', label: 'Recently Played', icon: Clock },
  ];

  return (
    <div className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6">
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              currentView === item.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Playlists
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white transition-colors">
            My AI Creations
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Chill Beats
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Workout Mix
          </button>
        </div>
      </div>
    </div>
  );
}