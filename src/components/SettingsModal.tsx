import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  Volume2,
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  Crown,
  CreditCard,
  Zap,
  ChevronRight,
  Monitor,
  Smartphone,
  Headphones,
  User,
  Music,
  Globe
} from 'lucide-react';
import { useUserUsage } from '../hooks/useUserUsage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { usage } = useUserUsage();
  const [settings, setSettings] = useState({
    volume: 80,
    notifications: true,
    autoplay: false,
    highQuality: true,
    darkMode: true,
    showLyrics: true,
    downloadQuality: 'high'
  });

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedSettings = Object.keys(settings).reduce((acc, key) => {
      const savedValue = localStorage.getItem(`setting_${key}`);
      return { ...acc, [key]: savedValue ? JSON.parse(savedValue) : settings[key] };
    }, {} as typeof settings);
    setSettings(savedSettings);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle setting changes and save to localStorage
  const handleSettingChange = useCallback((key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`setting_${key}`, JSON.stringify(value));
  }, []);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex" style={{ zIndex: 999999 }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ zIndex: 999998 }}
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div 
        className={`ml-auto h-full w-full max-w-md bg-gray-900/98 backdrop-blur-xl border-l border-white/20 shadow-2xl transform transition-transform duration-300 ease-out relative ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
        style={{ zIndex: 999999 }}
      >
        
        {/* Header - Fixed */}
        <div className="sticky top-0 z-[999990] bg-gray-900/98 backdrop-blur-xl border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <p className="text-xs text-gray-400">Customize your experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          
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
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{usage.current}</p>
                  <p className="text-xs text-gray-400">Used</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{usage.remaining}</p>
                  <p className="text-xs text-gray-400">Left</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{usage.limit}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usage.current / usage.limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Resets {new Date(usage.resetDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Audio Settings</h3>
            </div>

            {/* Volume Control */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Default Volume</span>
                <span className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded">
                  {settings.volume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${settings.volume}%, #4b5563 ${settings.volume}%, #4b5563 100%)`
                }}
              />
            </div>

            {/* Audio Quality */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Headphones className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-sm text-white font-medium">High Quality Audio</p>
                    <p className="text-xs text-gray-400">Stream in 320kbps quality</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.highQuality}
                    onChange={(e) => handleSettingChange('highQuality', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Autoplay */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Autoplay</p>
                    <p className="text-xs text-gray-400">Continue playing similar tracks</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoplay}
                    onChange={(e) => handleSettingChange('autoplay', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Bell className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Push Notifications</p>
                    <p className="text-xs text-gray-400">Updates and new features</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Palette className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-white">Appearance</h3>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Show Lyrics</p>
                  <p className="text-xs text-gray-400">Display lyrics during playback</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showLyrics}
                    onChange={(e) => handleSettingChange('showLyrics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Downloads */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Download className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Downloads</h3>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Download Quality
              </label>
              <select
                value={settings.downloadQuality}
                onChange={(e) => handleSettingChange('downloadQuality', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="low" className="bg-gray-800">Low (128kbps)</option>
                <option value="medium" className="bg-gray-800">Medium (256kbps)</option>
                <option value="high" className="bg-gray-800">High (320kbps)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Higher quality = larger file sizes</p>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-white">Privacy & Security</h3>
            </div>

            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <div className="text-left">
                    <p className="text-sm text-white font-medium">Export My Data</p>
                    <p className="text-xs text-gray-400">Download your saved music</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/20">
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <div className="text-left">
                    <p className="text-sm text-red-400 font-medium">Delete Account</p>
                    <p className="text-xs text-red-300/70">Permanently delete account</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-white/10 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-white font-semibold">MuzAI</p>
                <p className="text-xs text-gray-400">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">Built with ❤️ in Myanmar</p>
            <div className="flex justify-center gap-3 text-xs">
              <button className="text-purple-400 hover:text-purple-300">Privacy</button>
              <button className="text-purple-400 hover:text-purple-300">Terms</button>
              <button className="text-purple-400 hover:text-purple-300">Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}