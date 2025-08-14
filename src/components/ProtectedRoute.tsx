import React from 'react';
import { Lock, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (requireAuth && !user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full">
          <Lock className="w-12 h-12 text-white" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white">Authentication Required</h3>
          <p className="text-gray-400 max-w-md">
            Please sign in to access the AI Music Generator and create your own custom tracks.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-purple-400">
          <LogIn className="w-5 h-5" />
          <span>Click "Sign In" in the header to get started</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}