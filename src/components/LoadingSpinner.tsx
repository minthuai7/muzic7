import React from 'react';
import { Loader2, Music } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading music...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <Music className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-400 text-lg">{message}</p>
      <p className="text-gray-500 text-sm">Powered by Jamendo - Free Music for Everyone</p>
    </div>
  );
}