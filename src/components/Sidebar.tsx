import React from 'react';
import { Home, Music, Sparkles, Library, Heart, Clock } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: User | null;
}

export default function Sidebar({ currentView, onViewChange, user }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'generator', label: 'AI Generator', icon: Sparkles, requireAuth: true },
    { id: 'liked', label: 'Liked Songs', icon: Heart, requireAuth: true },
    { id: 'recent', label: 'Recently Played', icon: Clock, requireAuth: true },
  ];

  return (
    <div className="w-16 md:w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-3 md:p-6">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const isDisabled = item.requireAuth && !user;
          
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onViewChange(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-center md:justify-start space-x-0 md:space-x-3 px-2 md:px-4 py-3 rounded-lg transition-all ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : isDisabled
                  ? 'text-gray-500 cursor-not-allowed opacity-50'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title={isDisabled ? `${item.label} (Sign in required)` : item.label}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium hidden md:block">
                {item.label}
                {isDisabled && <span className="text-xs ml-1">🔒</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 hidden md:block">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 hidden md:block">
          {user ? 'Your Playlists' : 'Playlists (Sign in required)'}
        </h3>
        <div className="space-y-2">
          <button 
            disabled={!user}
            className={`w-full text-left px-4 py-2 transition-colors hidden md:block ${
              user ? 'text-gray-300 hover:text-white' : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            My AI Creations
          </button>
          <button 
            disabled={!user}
            className={`w-full text-left px-4 py-2 transition-colors hidden md:block ${
              user ? 'text-gray-300 hover:text-white' : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            Chill Beats
          </button>
          <button 
            disabled={!user}
            className={`w-full text-left px-4 py-2 transition-colors hidden md:block ${
              user ? 'text-gray-300 hover:text-white' : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            Workout Mix
          </button>
        </div>
      </div>
    </div>
  );
}