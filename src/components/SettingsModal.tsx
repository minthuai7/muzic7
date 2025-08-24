import React, { useState, useEffect, useCallback } from 'react';
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
  Headphones
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl mx-auto my-8 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="settings-modal-title" className="text-xl sm:text-2xl font-bold text-white">
                  Settings
                </h2>
                <p className="text-sm text-gray-400 hidden sm:block">Customize your music experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close settings"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Subscription Section */}
              {usage && (
                <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-4 sm:p-6 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Crown className={`w-6 h-6 ${usage.planType === 'premium' ? 'text-yellow-400' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white capitalize">{usage.planType} Plan</h3>
                        <p className="text-sm text-gray-400">
                          {usage.planType === 'premium' ? 'Unlimited generations' : 'Limited generations'}
                        </p>
                      </div>
                    </div>
                    {usage.planType === 'free' && (
                      <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Upgrade</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-lg sm:text-xl font-bold text-white">{usage.current}</p>
                      <p className="text-xs text-gray-400">Used</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-lg sm:text-xl font-bold text-white">{usage.remaining}</p>
                      <p className="text-xs text-gray-400">Left</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-lg sm:text-xl font-bold text-white">{usage.limit}</p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Usage Progress</span>
                      <span>{Math.round((usage.current / usage.limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((usage.current / usage.limit) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Resets {new Date(usage.resetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Audio Settings */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Audio Settings</h3>
                    <p className="text-sm text-gray-400">Configure your audio preferences</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Volume Control */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-300">Default Volume</label>
                      <span className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded-lg">
                        {settings.volume}%
                      </span>
                    </div>
                    <div className="relative">
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
                  </div>

                  {/* Audio Quality Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Headphones className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">High Quality Audio</p>
                        <p className="text-gray-400 text-sm">Stream in 320kbps quality</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.highQuality}
                        onChange={(e) => handleSettingChange('highQuality', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Autoplay Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Autoplay</p>
                        <p className="text-gray-400 text-sm">Continue playing similar tracks</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoplay}
                        onChange={(e) => handleSettingChange('autoplay', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Notifications */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-yellow-500/20 rounded-xl">
                    <Bell className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    <p className="text-sm text-gray-400">Manage your notification preferences</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-gray-400 text-sm">Updates and new features</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-pink-500/20 rounded-xl">
                    <Palette className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Appearance</h3>
                    <p className="text-sm text-gray-400">Customize the app appearance</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Show Lyrics</p>
                    <p className="text-gray-400 text-sm">Display lyrics during playback</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLyrics}
                      onChange={(e) => handleSettingChange('showLyrics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* Downloads */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Download className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Downloads</h3>
                    <p className="text-sm text-gray-400">Configure download settings</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Download Quality
                  </label>
                  <select
                    value={settings.downloadQuality}
                    onChange={(e) => handleSettingChange('downloadQuality', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="low" className="bg-gray-800">Low (128kbps)</option>
                    <option value="medium" className="bg-gray-800">Medium (256kbps)</option>
                    <option value="high" className="bg-gray-800">High (320kbps)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">Higher quality = larger file sizes</p>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
                    <p className="text-sm text-gray-400">Manage your data and privacy</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                    <div className="flex items-center space-x-3">
                      <Download className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">Export My Data</p>
                        <p className="text-gray-400 text-sm">Download your saved music and data</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all group border border-red-500/20">
                    <div className="flex items-center space-x-3">
                      <Trash2 className="w-5 h-5 text-red-400" />
                      <div className="text-left">
                        <p className="text-red-400 font-medium">Delete Account</p>
                        <p className="text-red-300/70 text-sm">Permanently delete your account</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">MuzAI Music Studio</p>
                <p className="text-gray-400 text-sm">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">Built with ❤️ in Myanmar</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <button className="text-purple-400 hover:text-purple-300 transition-colors">Privacy Policy</button>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">Terms of Service</button>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}