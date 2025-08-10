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
  private baseUrl: string = 'https://api.jamendo.com/v3.0';

  constructor(clientId: string = 'c40e3496') {
    this.clientId = clientId;
  }

  async getTracks(options: {
    limit?: number;
    offset?: number;
    order?: string;
    tags?: string;
    search?: string;
    featured?: string;
  } = {}): Promise<JamendoTrack[]> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      format: 'json',
      limit: (options.limit || 20).toString(),
      offset: (options.offset || 0).toString(),
      order: options.order || 'popularity_total',
      include: 'musicinfo',
      audiodlformat: 'mp32',
      ...((options.tags && { tags: options.tags }) || {}),
      ...((options.search && { search: options.search }) || {}),
      ...((options.featured && { featured: options.featured }) || {}),
    });

    try {
      const response = await fetch(`${this.baseUrl}/tracks/?${params}`);
      const data: JamendoResponse<JamendoTrack> = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }

  async getPopularTracks(limit: number = 20): Promise<JamendoTrack[]> {
    return this.getTracks({
      limit,
      order: 'popularity_total',
      featured: 'featured'
    });
  }

  async searchTracks(query: string, limit: number = 20): Promise<JamendoTrack[]> {
    return this.getTracks({
      search: query,
      limit,
      order: 'relevance'
    });
  }

  async getTracksByGenre(genre: string, limit: number = 20): Promise<JamendoTrack[]> {
    return this.getTracks({
      tags: genre,
      limit,
      order: 'popularity_total'
    });
  }

  async getAlbums(options: {
    limit?: number;
    offset?: number;
    order?: string;
    search?: string;
  } = {}): Promise<JamendoAlbum[]> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      format: 'json',
      limit: (options.limit || 20).toString(),
      offset: (options.offset || 0).toString(),
      order: options.order || 'popularity_total',
      include: 'musicinfo',
      ...((options.search && { search: options.search }) || {}),
    });

    try {
      const response = await fetch(`${this.baseUrl}/albums/?${params}`);
      const data: JamendoResponse<JamendoAlbum> = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  // Convert Jamendo track to our Track interface
  convertToTrack(jamendoTrack: JamendoTrack): import('../types/music').Track {
    return {
      id: jamendoTrack.id,
      title: jamendoTrack.name,
      artist: jamendoTrack.artist_name,
      duration: jamendoTrack.duration,
      audioUrl: jamendoTrack.audio,
      imageUrl: jamendoTrack.album_image || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
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
}

export default JamendoAPI;
