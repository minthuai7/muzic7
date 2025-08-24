import React from 'react';
import { Search, Music, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserUsage } from '../hooks/useUserUsage';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import { useState } from 'react';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MuzAI - Free Music & AI Generator
              </h1>
            </div>
          </div>
          
          <div className="flex-1 max-w-md mx-2 md:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search music..."
                className="w-full bg-white/10 border border-white/20 rounded-full py-2 md:py-3 pl-10 pr-4 text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {!loading && (
              user ? (
                <div className="flex items-center space-x-3">
                  {usage && (
                    <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
                      <span className="text-xs text-gray-300">Generations:</span>
                      <span className={`text-xs font-bold ${usage.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {usage.remaining}/{usage.limit}
                      </span>
                    </div>
                  )}
                  <UserMenu />
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full transition-all text-sm md:text-base"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden md:inline">Sign In</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}