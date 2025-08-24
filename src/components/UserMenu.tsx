import React, { useState } from 'react';
import { User, LogOut, Settings, Music } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    setShowProfile(true);
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  const handleMyMusicClick = () => {
    setIsOpen(false);
    // This will be handled by the parent component
    window.dispatchEvent(new CustomEvent('navigate-to-mymusic'));
  };

  if (!user) return null;

  const userInitials = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {userInitials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-[99999]">
          <div
            className="fixed inset-0 z-[99998] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
            <div className="relative z-[99999] p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
                  {userInitials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{user.email}</p>
                  <p className="text-gray-400 text-xs">Premium Member</p>
                </div>
              </div>
            </div>

            <div className="relative z-[99999] p-2">
              <button 
                onClick={handleProfileClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Profile</span>
              </button>
              <button 
                onClick={handleMyMusicClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Music className="w-4 h-4" />
                <span className="text-sm">My Music</span>
              </button>
              <button 
                onClick={handleSettingsClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
            </div>

            <div className="relative z-[99999] p-2 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
      )}

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}