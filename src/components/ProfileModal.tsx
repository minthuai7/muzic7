import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Save, 
  Loader2, 
  Camera, 
  Mail, 
  Crown, 
  Calendar,
  Edit3,
  Shield,
  Star,
  Music,
  Eye,
  Globe,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserUsage } from '../hooks/useUserUsage';
import { supabase } from '../lib/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { usage } = useUserUsage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

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

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || '',
          display_name: user.email?.split('@')[0] || '',
          bio: '',
          avatar_url: ''
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        
        setProfile(createdProfile);
        setFormData({
          username: createdProfile.username || '',
          display_name: createdProfile.display_name || '',
          bio: createdProfile.bio || '',
          avatar_url: createdProfile.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: formData.username.trim() || null,
          display_name: formData.display_name.trim() || null,
          bio: formData.bio.trim() || null,
          avatar_url: formData.avatar_url.trim() || null
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === '23505') {
        setError('Username already taken. Please choose a different one.');
      } else {
        setError('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div className={`ml-auto h-full w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header - Fixed */}
        <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">My Profile</h2>
                <p className="text-xs text-gray-400">Manage your account</p>
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
        <div className="flex-1 overflow-y-auto">
          {/* Status Messages */}
          {message && (
            <div className="m-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="m-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                <p className="text-gray-400">Loading profile...</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              
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
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/10 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-white">{usage.current}</p>
                      <p className="text-xs text-gray-400">Used</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-white">{usage.remaining}</p>
                      <p className="text-xs text-gray-400">Left</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${(usage.current / usage.limit) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Resets {new Date(usage.resetDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Avatar Section */}
              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      user?.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors shadow-lg">
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                </div>
                <p className="text-gray-400 text-xs">Click camera to change avatar</p>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-white/5 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-gray-400 text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Choose a unique username"
                      className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="How others will see your name"
                      className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <div className="relative">
                    <Music className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell the community about yourself..."
                      rows={3}
                      maxLength={500}
                      className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Share your musical journey</p>
                    <p className="text-xs text-gray-500">{formData.bio.length}/500</p>
                  </div>
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Avatar URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Optional: Link to your profile picture</p>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold text-white">Activity Stats</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Tracks Created</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Public Tracks</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Total Plays</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Followers</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Fixed */}
        {!loading && (
          <div className="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}