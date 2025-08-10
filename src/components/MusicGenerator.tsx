import React, { useState } from 'react';
import { Sparkles, Wand2, Music, Download, Play, Loader2 } from 'lucide-react';
import { GenerationOptions, Track } from '../types/music';
import SunoAPI from '../services/kieAI';

interface MusicGeneratorProps {
  onTrackGenerated: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
}

export default function MusicGenerator({ onTrackGenerated, onPlayTrack }: MusicGeneratorProps) {
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
  const [apiKey, setApiKey] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim()) {
      alert('Please enter both a prompt and API key');
      return;
    }

    setIsGenerating(true);
    try {
      const api = new SunoAPI(apiKey);
      const taskId = await api.generateMusic(prompt, options);
      
      // Simulate waiting for completion (in a real app, you'd poll the status)
      setTimeout(async () => {
        try {
          const result = await api.waitForCompletion(taskId);
          const tracks: Track[] = result.sunoData.map((track: any) => ({
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
        } catch (error) {
          console.error('Generation failed:', error);
          setIsGenerating(false);
        }
      }, 5000); // Simulate 5 second generation time
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    }
  };

  const styles = [
    'Pop', 'Rock', 'Electronic', 'Hip-Hop', 'Jazz', 'Classical',
    'Ambient', 'Folk', 'R&B', 'Country', 'Indie', 'Synthwave'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">AI Music Generator</h2>
        <p className="text-gray-400">Create unique music tracks with artificial intelligence</p>
      </div>

      {/* API Key Input */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Kie AI API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Kie AI API key"
          className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Generation Form */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Music Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the music you want to generate... (e.g., 'A nostalgic folk song about childhood memories')"
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Track Title (Optional)
              </label>
              <input
                type="text"
                value={options.title}
                onChange={(e) => setOptions({ ...options, title: e.target.value })}
                placeholder="Enter track title"
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Style/Genre
              </label>
              <input
                type="text"
                value={options.style}
                onChange={(e) => setOptions({ ...options, style: e.target.value })}
                placeholder="e.g., Folk, Acoustic, Nostalgic"
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-400">Quick styles:</span>
            {styles.map(style => (
              <button
                key={style}
                onClick={() => setOptions({ ...options, style })}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-gray-300 hover:text-white transition-colors"
              >
                {style}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-6">
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
            disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Music...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Generate Music</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Tracks */}
      {generatedTracks.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2" />
            Generated Tracks
          </h3>
          <div className="space-y-3">
            {generatedTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-white font-medium">{track.title}</h4>
                    <p className="text-gray-400 text-sm">{track.artist}</p>
                    {track.tags && (
                      <p className="text-gray-500 text-xs">{track.tags}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Play className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    <Download className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}