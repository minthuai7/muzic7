export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  imageUrl: string;
  tags?: string;
  isGenerated?: boolean;
  taskId?: string;
  prompt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  imageUrl: string;
  createdAt: Date;
}

export interface GenerationOptions {
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  style?: string;
  title?: string;
  negativeTags?: string;
}

export interface GenerationTask {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  prompt: string;
  options: GenerationOptions;
  createdAt: Date;
  result?: Track[];
}

export interface KieAIResponse {
  code: number;
  msg: string;
  data: {
    taskId?: string;
    sunoData?: Array<{
      id: string;
      title: string;
      audioUrl: string;
      duration: number;
      tags: string;
    }>;
    status?: string;
    errorMessage?: string;
    response?: {
      sunoData: Array<{
        id: string;
        title: string;
        audioUrl: string;
        duration: number;
        tags: string;
      }>;
    };
  };
}