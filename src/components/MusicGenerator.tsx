import React, { useState } from 'react';
import { Sparkles, Wand2, Music, Download, Play, Loader2, Save, Crown, AlertCircle } from 'lucide-react';
import { GenerationOptions, Track } from '../types/music';
import SaveTrackModal from './SaveTrackModal';
import { useSavedTracks } from '../hooks/useSavedTracks';
import { useUserUsage } from '../hooks/useUserUsage';

interface MusicGeneratorProps {
  onTrackGenerated: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
}

export default function MusicGenerator({ onTrackGenerated, onPlayTrack }: MusicGeneratorProps) {
  const { usage, generateMusic, checkGenerationStatus } = useUserUsage();
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<GenerationOptions>({
    customMode: true,
    instrumental: false,
    model: 'V3_5',
    style: '',
    title: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<Track[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [trackToSave, setTrackToSave] = useState<Track | null>(null);
  const { saveTrack } = useSavedTracks();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a music prompt');
      return;
    }

    if (!usage || usage.remaining <= 0) {
      alert('You have reached your monthly generation limit. Please upgrade to premium for more generations.');
      return;
    }

    setIsGenerating(true);
    try {
      const taskId = await generateMusic(prompt, options);
      
      // Poll for completion
      const pollStatus = async () => {
        try {
          const result = await checkGenerationStatus(taskId);
          
          if (result.status === 'SUCCESS' && result.tracks.length > 0) {
            const tracks: Track[] = result.tracks.map((track: any) => ({
            id: track.id,
            title: track.title || options.title || 'Generated Track',
            artist: 'AI Generated',
            duration: track.duration || 180,
            audioUrl: track.audioUrl,
            imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
            tags: track.tags,
            isGenerated: true,
            taskId,
            prompt
          }));
          
            setGeneratedTracks(prev => [...prev, ...tracks]);
            tracks.forEach(track => onTrackGenerated(track));
            setIsGenerating(false);
          } else if (result.status === 'FAILED' || result.error) {
            throw new Error(result.error || 'Generation failed');
          } else {
            // Still processing, check again in 10 seconds
            setTimeout(pollStatus, 10000);
          }
        } catch (error: any) {
          console.error('Generation failed:', error);
          alert(error.message || 'Generation failed');
          setIsGenerating(false);
        }
      };
      
      // Start polling after 10 seconds
      setTimeout(pollStatus, 10000);
    } catch (error: any) {
      console.error('Generation failed:', error);
      alert(error.message || 'Generation failed');
      setIsGenerating(false);
    }
  };

  const handleSaveTrack = (track: Track) => {
    setTrackToSave(track);
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async (track: Track, isPublic: boolean) => {
    const success = await saveTrack(track, isPublic);
    return success;
  };

  const styles = [
    'Pop', 'Rock', 'Electronic', 'Hip-Hop', 'Jazz', 'Classical',
    'Ambient', 'Folk', 'R&B', 'Country', 'Indie', 'Synthwave'
  ];

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-3xl" />
        <div className="relative bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-8 border border-purple-500/30">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full shadow-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">AI Music Generator</h2>
          <p className="text-gray-400 text-lg mb-6">Transform your ideas into unique music tracks using artificial intelligence</p>
          
          {/* Usage Display */}
          {usage && (
            <div className="bg-white/10 rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className={`w-5 h-5 ${usage.planType === 'premium' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className="text-white font-semibold capitalize">{usage.planType} Plan</span>
                </div>
                <span className="text-white font-bold">{usage.remaining} left</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${((usage.limit - usage.remaining) / usage.limit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Resets {new Date(usage.resetDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Warning */}
      {usage && usage.remaining === 0 && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Generation Limit Reached</p>
            <p className="text-red-300 text-sm">You've used all your monthly generations. Upgrade to premium for unlimited access.</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex-shrink-0">
            Upgrade
          </button>
        </div>
      )}

      {usage && usage.remaining <= 2 && usage.remaining > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-medium">Low Generation Count</p>
            <p className="text-yellow-300 text-sm">Only {usage.remaining} generation{usage.remaining === 1 ? '' : 's'} remaining this month.</p>
          </div>
        )}
      )}

      {/* Generation Form */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="space-y-4 md:space-y-4">
          <div>
            <label className="block text-lg font-medium text-white mb-3">
              🎵 Describe Your Music
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'A relaxing acoustic guitar melody with soft vocals, perfect for a cozy evening...'"
              className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-32 text-lg"
            />
            <p className="text-xs text-gray-500 mt-2">💡 Be specific about genre, mood, instruments, and style for best results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Track Title
              </label>
              <input
                type="text"
                value={options.title}
                onChange={(e) => setOptions({ ...options, title: e.target.value })}
                placeholder="My Amazing Song"
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Style
              </label>
              <input
                type="text"
                value={options.style}
                onChange={(e) => setOptions({ ...options, style: e.target.value })}
                placeholder="Folk, Acoustic, Nostalgic"
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs md:text-sm text-gray-400">Quick styles:</span>
            {styles.map(style => (
              <button
                key={style}
                onClick={() => setOptions({ ...options, style })}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-gray-300 hover:text-white transition-all hover:scale-105"
              >
                {style}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.instrumental}
                onChange={(e) => setOptions({ ...options, instrumental: e.target.checked })}
                className="rounded border-gray-600 bg-white/10 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Instrumental only</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.customMode}
                onChange={(e) => setOptions({ ...options, customMode: e.target.checked })}
                className="rounded border-gray-600 bg-white/10 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Custom mode</span>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || (usage && usage.remaining <= 0)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-xl transition-all flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Your Music...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>✨ Generate Music</span>
              </>
            )}
          </button>
          
          {usage && usage.remaining > 0 && (
            <p className="text-center text-sm text-gray-400">
              This will use 1 of your {usage.remaining} remaining generation{usage.remaining === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {/* Generated Tracks */}
      {generatedTracks.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <Music className="w-5 h-5 mr-2" />
            Your Generated Music
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {generatedTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-5 bg-white/10 rounded-xl hover:bg-white/15 transition-all border border-white/10 hover:border-white/20"
              >
                <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-16 h-16 rounded-xl object-cover shadow-lg"
                  />
                  <div>
                    <h4 className="text-white font-semibold text-base md:text-lg truncate">{track.title}</h4>
                    <p className="text-gray-400 text-sm md:text-base">{track.artist}</p>
                    {track.tags && (
                      <p className="text-purple-400 text-xs truncate">🏷️ {track.tags}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-3 bg-green-600 hover:bg-green-500 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
                  >
                    <Play className="w-5 h-5 text-white" />
                  </button>
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hidden md:block">
                    <Download className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleSaveTrack(track)}
                    className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
                  >
                    <Save className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SaveTrackModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        track={trackToSave}
        onSave={handleSaveConfirm}
      />
    </div>
  );
}