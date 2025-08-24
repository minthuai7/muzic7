interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  artist_idstr: string;
  album_name: string;
  album_id: string;
  license_ccurl: string;
  position: number;
  releasedate: string;
  album_image: string;
  audio: string;
  audiodownload: string;
}

interface JamendoAlbum {
  id: string;
  name: string;
  releasedate: string;
  artist_name: string;
  artist_id: string;
  image: string;
  zip: string;
  shorturl: string;
}

interface JamendoResponse<T> {
  headers: {
    status: string;
    code: number;
    error_message: string;
    warnings: string;
    results_count: number;
  };
  results: T[];
}

class JamendoAPI {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string = 'https://api.jamendo.com/v3.0';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || import.meta.env.VITE_JAMENDO_CLIENT_ID || '17f25733';
    this.clientSecret = clientSecret || import.meta.env.VITE_JAMENDO_CLIENT_SECRET || '3bd8e1c6eccf87b30905717ff535ea54';
  }

  private getCacheKey(endpoint: string, params: URLSearchParams): string {
    return `${endpoint}?${params.toString()}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  async getTracks(options: {
    limit?: number;
    offset?: number;
    order?: string;
    tags?: string;
    search?: string;
    featured?: string;
    include?: string;
    audiodlformat?: string;
  } = {}): Promise<JamendoTrack[]> {
    // Validate client ID before making request
    if (!this.clientId || this.clientId === 'your_jamendo_client_id') {
      console.warn('Invalid Jamendo client ID. Using fallback data.');
      return [];
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      format: 'json',
      limit: Math.min(options.limit || 20, 200).toString(), // Jamendo max is 200
      offset: (options.offset || 0).toString(),
      order: options.order || 'popularity_total',
      include: options.include || 'musicinfo',
      audiodlformat: options.audiodlformat || 'mp32',
      ...((options.tags && { tags: options.tags }) || {}),
      ...((options.search && { search: options.search }) || {}),
      ...((options.featured && { featured: options.featured }) || {}),
    });

    const cacheKey = this.getCacheKey('tracks', params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/tracks/?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        console.warn(`Jamendo API error: ${response.status} ${response.statusText}`);
        return [];
      }
      const data: JamendoResponse<JamendoTrack> = await response.json();
      const results = data.results || [];
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.warn('Jamendo API unavailable, using fallback:', error);
      return [];
    }
  }

  async getPopularTracks(limit: number = 50): Promise<JamendoTrack[]> {
    return this.getTracks({
      limit,
      order: 'popularity_total',
      featured: 'featured',
      include: 'musicinfo+stats'
    });
  }

  async searchTracks(query: string, limit: number = 50): Promise<JamendoTrack[]> {
    if (!query.trim()) return [];
    
    return this.getTracks({
      search: query.trim(),
      limit,
      order: 'relevance',
      include: 'musicinfo'
    });
  }

  async getTracksByGenre(genre: string, limit: number = 50): Promise<JamendoTrack[]> {
    return this.getTracks({
      tags: genre,
      limit,
      order: 'popularity_total',
      include: 'musicinfo'
    });
  }

  async getAlbums(options: {
    limit?: number;
    offset?: number;
    order?: string;
    search?: string;
    include?: string;
  } = {}): Promise<JamendoAlbum[]> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      format: 'json',
      limit: Math.min(options.limit || 20, 200).toString(),
      offset: (options.offset || 0).toString(),
      order: options.order || 'popularity_total',
      include: options.include || 'musicinfo',
      ...((options.search && { search: options.search }) || {}),
    });

    const cacheKey = this.getCacheKey('albums', params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/albums/?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: JamendoResponse<JamendoAlbum> = await response.json();
      const results = data.results || [];
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  async getTracksByIds(trackIds: string[]): Promise<JamendoTrack[]> {
    if (trackIds.length === 0) return [];
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      format: 'json',
      id: trackIds.join('+'),
      include: 'musicinfo',
      audiodlformat: 'mp32',
      audioformat: 'mp32'
    });

    try {
      const response = await fetch(`${this.baseUrl}/tracks/?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MuzAI-App/1.0',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Jamendo Tracks by ID API error: ${response.status}`, errorText);
        throw new Error(`Jamendo API error: ${response.status}`);
      }
      const data: JamendoResponse<JamendoTrack> = await response.json();
      
      if (data.headers.code !== 0) {
        console.error('Jamendo API returned error:', data.headers.error_message);
        throw new Error(data.headers.error_message || 'Jamendo API error');
      }
      
      return data.results || [];
    } catch (error) {
      console.error('Error fetching tracks by IDs:', error);
      throw error;
    }
  }
  // Convert Jamendo track to our Track interface
  convertToTrack(jamendoTrack: JamendoTrack): import('../types/music').Track {
    // Ensure we have valid audio URL
    const audioUrl = jamendoTrack.audio || jamendoTrack.audiodownload || '';
    const imageUrl = jamendoTrack.album_image || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800';
    
    return {
      id: jamendoTrack.id,
      title: jamendoTrack.name,
      artist: jamendoTrack.artist_name,
      duration: jamendoTrack.duration,
      audioUrl,
      imageUrl,
      tags: `${jamendoTrack.album_name}`,
      isGenerated: false
    };
  }

  // Convert Jamendo album to our Playlist interface
  convertToPlaylist(jamendoAlbum: JamendoAlbum, tracks: JamendoTrack[]): import('../types/music').Playlist {
    return {
      id: jamendoAlbum.id,
      name: jamendoAlbum.name,
      description: `Album by ${jamendoAlbum.artist_name}`,
      tracks: tracks.map(track => this.convertToTrack(track)),
      imageUrl: jamendoAlbum.image || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
      createdAt: new Date(jamendoAlbum.releasedate)
    };
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }
}

export default JamendoAPI;
