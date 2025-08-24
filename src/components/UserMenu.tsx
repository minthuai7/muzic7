import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, Settings, Music, X, Crown, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserUsage } from '../hooks/useUserUsage';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut } = useAuth();
  const { usage } = useUserUsage();

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

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
    window.dispatchEvent(new CustomEvent('navigate-to-mymusic'));
  };

  if (!user) return null;

  const userInitials = user.email?.charAt(0).toUpperCase() || 'U';
  const userName = user.email?.split('@')[0] || 'User';

  const MenuDropdown = () => (
    <div className="fixed inset-0 z-[99999]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dropdown Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Account</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* User Info Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{userName}</h3>
              <p className="text-sm text-gray-400 truncate flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                {user.email}
              </p>
            </div>
          </div>

          {/* Subscription Status */}
          {usage && (
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className={`w-4 h-4 ${usage.planType === 'premium' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className="text-white font-medium capitalize">{usage.planType} Plan</span>
                </div>
                {usage.planType === 'free' && (
                  <button className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all">
                    Upgrade
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-lg font-bold text-white">{usage.current}</p>
                  <p className="text-xs text-gray-400">Used</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-lg font-bold text-white">{usage.remaining}</p>
                  <p className="text-xs text-gray-400">Left</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-lg font-bold text-white">{usage.limit}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usage.current / usage.limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Resets {new Date(usage.resetDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2">
          <button 
            onClick={handleProfileClick}
            className="w-full flex items-center space-x-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">Profile</p>
              <p className="text-sm text-gray-500">Manage your account</p>
            </div>
          </button>

          <button 
            onClick={handleMyMusicClick}
            className="w-full flex items-center space-x-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <Music className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">My Music</p>
              <p className="text-sm text-gray-500">Your saved tracks</p>
            </div>
          </button>

          <button 
            onClick={handleSettingsClick}
            className="w-full flex items-center space-x-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Settings className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">Settings</p>
              <p className="text-sm text-gray-500">App preferences</p>
            </div>
          </button>
        </div>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-white/10 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-4 p-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-red-300/70">Leave your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="Open user menu"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
          {userInitials}
        </div>
      </button>

      {isOpen && createPortal(<MenuDropdown />, document.body)}

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