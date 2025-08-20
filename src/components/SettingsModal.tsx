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
  Zap
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
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-lg min-h-[50vh] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-2xl font-bold text-white flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            App Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Subscription Section */}
          {usage && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Crown className={`w-5 h-5 mr-2 ${usage.planType === 'premium' ? 'text-yellow-400' : 'text-gray-400'}`} />
                Subscription
              </h3>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold capitalize flex items-center">
                      {usage.planType === 'premium' ? (
                        <Crown className="w-4 h-4 text-yellow-400 mr-2" />
                      ) : (
                        <Zap className="w-4 h-4 text-gray-400 mr-2" />
                      )}
                      {usage.planType} Plan
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {usage.planType === 'premium'
                        ? 'Unlimited AI music generation'
                        : 'Limited to 1 generation per month'}
                    </p>
                  </div>
                  {usage.planType === 'free' && (
                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center space-x-2 mt-4 sm:mt-0">
                      <CreditCard className="w-4 h-4" />
                      <span>Upgrade</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-white">{usage.current}</p>
                    <p className="text-gray-400 text-xs">Used</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-white">{usage.remaining}</p>
                    <p className="text-gray-400 text-xs">Remaining</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-white">{usage.limit}</p>
                    <p className="text-gray-400 text-xs">Monthly Limit</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Usage Progress</span>
                    <span>{Math.round((usage.current / usage.limit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((usage.current / usage.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Resets on {new Date(usage.resetDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Audio Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              Audio
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span className="font-medium text-white">{settings.volume}%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white font-medium">High Quality Audio</p>
                  <p className="text-gray-400 text-sm">Stream music in 320kbps quality</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group mt-2 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={settings.highQuality}
                    onChange={(e) => handleSettingChange('highQuality', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 group-hover:bg-gray-500"></div>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white font-medium">Autoplay</p>
                  <p className="text-gray-400 text-sm">Continue playing similar tracks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group mt-2 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={settings.autoplay}
                    onChange={(e) => handleSettingChange('autoplay', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 group-hover:bg-gray-500"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Updates and new features</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group mt-2 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 group-hover:bg-gray-500"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white font-medium">Show Lyrics</p>
                  <p className="text-gray-400 text-sm">Show lyrics overlay during playback</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group mt-2 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={settings.showLyrics}
                    onChange={(e) => handleSettingChange('showLyrics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 group-hover:bg-gray-500"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Downloads */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Downloads
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Download Quality
                </label>
                <select
                  value={settings.downloadQuality}
                  onChange={(e) => handleSettingChange('downloadQuality', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="low" className="bg-gray-800">Low (128kbps)</option>
                  <option value="medium" className="bg-gray-800">Medium (256kbps)</option>
                  <option value="high" className="bg-gray-800">High (320kbps)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Higher quality = larger file sizes</p>
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Privacy & Security
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group">
                <div className="flex items-center">
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-white mr-3 transition-colors" />
                  <div>
                    <p className="text-white font-medium">Export My Data</p>
                    <p className="text-gray-400 text-sm">Download all your saved music and data</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all group">
                <div className="flex items-center">
                  <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300 mr-3 transition-colors" />
                  <div>
                    <p className="text-red-400 group-hover:text-red-300 font-medium transition-colors">Delete Account</p>
                    <p className="text-red-300 text-sm">Permanently delete your account and all data</p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* App Info */}
          <section className="pt-6 border-t border-white/10">
            <div className="text-center text-gray-400 text-sm space-y-2">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">AI Music Studio</span>
              </div>
              <p className="text-gray-500">Version 1.0.0</p>
              <p className="text-gray-500">Built with ❤️ in Myanmar</p>
              <div className="flex justify-center space-x-4 mt-4 text-xs">
                <button className="text-purple-400 hover:text-purple-300 transition-colors">Privacy Policy</button>
                <button className="text-purple-400 hover:text-purple-300 transition-colors">Terms of Service</button>
                <button className="text-purple-400 hover:text-purple-300 transition-colors">Support</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
