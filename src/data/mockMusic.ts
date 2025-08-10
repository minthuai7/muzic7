import { Track, Playlist } from '../types/music';

export const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'Synthwave Collection',
    duration: 245,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '2',
    title: 'Midnight Jazz',
    artist: 'AI Jazz Ensemble',
    duration: 312,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    imageUrl: 'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '3',
    title: 'Electronic Pulse',
    artist: 'Digital Soundscape',
    duration: 198,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    imageUrl: 'https://images.pexels.com/photos/1037999/pexels-photo-1037999.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '4',
    title: 'Ambient Flow',
    artist: 'Atmospheric AI',
    duration: 287,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'AI Generated Hits',
    description: 'The best AI-generated music tracks',
    tracks: mockTracks.slice(0, 2),
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Chill Vibes',
    description: 'Relaxing AI music for focus and relaxation',
    tracks: mockTracks.slice(2, 4),
    imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: new Date()
  }
];