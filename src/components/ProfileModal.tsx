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
  Globe
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="profile-modal-title" className="text-xl sm:text-2xl font-bold text-white">
                  My Profile
                </h2>
                <p className="text-sm text-gray-400 hidden sm:block">Manage your account information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close profile"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-4 sm:p-6">
          {/* Status Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
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
            <div className="space-y-6">
              {/* Subscription Status */}
              {usage && (
                <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-4 sm:p-6 border border-purple-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      <Crown className={`w-6 h-6 ${usage.planType === 'premium' ? 'text-yellow-400' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white capitalize">{usage.planType} Plan</h3>
                        <p className="text-sm text-gray-400">
                          {usage.planType === 'premium' ? 'Unlimited AI generations' : 'Limited AI generations'}
                        </p>
                      </div>
                    </div>
                    {usage.planType === 'free' && (
                      <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all">
                        Upgrade Plan
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-white">{usage.current}</p>
                      <p className="text-xs text-gray-400">Used</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-white">{usage.remaining}</p>
                      <p className="text-xs text-gray-400">Left</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-white">{usage.limit}</p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-white">0</p>
                      <p className="text-xs text-gray-400">Tracks</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Monthly Usage</span>
                      <span>{Math.round((usage.current / usage.limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${(usage.current / usage.limit) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Resets {new Date(usage.resetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Form */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Edit3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                    <p className="text-sm text-gray-400">Update your personal details</p>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl mx-auto mb-3 shadow-lg">
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
                    <button className="absolute bottom-1 right-1 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors shadow-lg">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">Click camera to change avatar</p>
                </div>

                <div className="space-y-4">
                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Choose a unique username"
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    <div className="relative">
                      <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="How others will see your name"
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <div className="relative">
                      <Music className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell the community about yourself and your music..."
                        rows={3}
                        maxLength={500}
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Share your musical journey</p>
                      <p className="text-xs text-gray-500">{formData.bio.length}/500</p>
                    </div>
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Avatar URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                        placeholder="https://example.com/your-avatar.jpg"
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Optional: Link to your profile picture</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Activity Stats</h3>
                    <p className="text-sm text-gray-400">Your music activity overview</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Tracks Created</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Public Tracks</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Total Plays</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Followers</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && (
          <div className="sticky bottom-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 backdrop-blur-md border-t border-white/10 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
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