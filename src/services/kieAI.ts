import { GenerationOptions, KieAIResponse } from '../types/music';

class SunoAPI {
  private apiKeys: string[];
  private currentKeyIndex: number;
  private baseUrl: string = 'https://api.kie.ai/api/v1';
  private keyUsage: Map<string, { count: number; resetTime: number }>;
  private maxRequestsPerKey: number = 50; // Adjust based on your rate limits
  private resetInterval: number = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(apiKeys: string | string[]) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.currentKeyIndex = 0;
    this.keyUsage = new Map();
    
    // Initialize usage tracking for all keys
    this.apiKeys.forEach(key => {
      this.keyUsage.set(key, { count: 0, resetTime: Date.now() + this.resetInterval });
    });
  }

  private getNextAvailableKey(): string {
    const now = Date.now();
    
    // Reset counters for keys whose reset time has passed
    this.keyUsage.forEach((usage, key) => {
      if (now >= usage.resetTime) {
        this.keyUsage.set(key, { count: 0, resetTime: now + this.resetInterval });
      }
    });
    
    // Find a key that hasn't hit the rate limit
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[keyIndex];
      const usage = this.keyUsage.get(key)!;
      
      if (usage.count < this.maxRequestsPerKey) {
        this.currentKeyIndex = keyIndex;
        return key;
      }
    }
    
    // If all keys are rate limited, use the one with the earliest reset time
    let earliestResetKey = this.apiKeys[0];
    let earliestResetTime = this.keyUsage.get(earliestResetKey)!.resetTime;
    
    this.keyUsage.forEach((usage, key) => {
      if (usage.resetTime < earliestResetTime) {
        earliestResetKey = key;
        earliestResetTime = usage.resetTime;
      }
    });
    
    return earliestResetKey;
  }

  private incrementKeyUsage(apiKey: string): void {
    const usage = this.keyUsage.get(apiKey);
    if (usage) {
      usage.count++;
    }
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const apiKey = this.getNextAvailableKey();
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    try {
      const response = await fetch(url, { ...options, headers });
      this.incrementKeyUsage(apiKey);
      return response;
    } catch (error) {
      // If request fails, try with next available key
      if (this.apiKeys.length > 1) {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        const nextApiKey = this.getNextAvailableKey();
        const nextHeaders = {
          'Authorization': `Bearer ${nextApiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        };
        const retryResponse = await fetch(url, { ...options, headers: nextHeaders });
        this.incrementKeyUsage(nextApiKey);
        return retryResponse;
      }
      throw error;
    }
  }
  
  async generateMusic(prompt: string, options: GenerationOptions = {}): Promise<string> {
    const response = await this.makeRequest(`${this.baseUrl}/generate`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        customMode: options.customMode || false,
        instrumental: options.instrumental || false,
        model: options.model || 'V3_5',
        style: options.style,
        title: options.title,
        negativeTags: options.negativeTags,
        callBackUrl: options.callBackUrl || 'https://your-app.com/callback'
      })
    });
    
    const result: KieAIResponse = await response.json();
    if (result.code !== 200) {
      throw new Error(`Generation failed: ${result.msg}`);
    }
    
    return result.data.taskId!;
  }
  
  async extendMusic(audioId: string, options: any = {}): Promise<string> {
    const response = await this.makeRequest(`${this.baseUrl}/generate/extend`, {
      method: 'POST',
      body: JSON.stringify({
        audioId,
        defaultParamFlag: options.defaultParamFlag || false,
        model: options.model || 'V3_5',
        prompt: options.prompt,
        style: options.style,
        title: options.title,
        continueAt: options.continueAt,
        callBackUrl: options.callBackUrl || 'https://your-app.com/callback'
      })
    });
    
    const result: KieAIResponse = await response.json();
    if (result.code !== 200) {
      throw new Error(`Extension failed: ${result.msg}`);
    }
    
    return result.data.taskId!;
  }
  
  async generateLyrics(prompt: string, callBackUrl: string): Promise<string> {
    const response = await this.makeRequest(`${this.baseUrl}/lyrics`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        callBackUrl
      })
    });
    
    const result: KieAIResponse = await response.json();
    if (result.code !== 200) {
      throw new Error(`Lyrics generation failed: ${result.msg}`);
    }
    
    return result.data.taskId!;
  }
  
  async waitForCompletion(taskId: string, maxWaitTime: number = 600000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId);
      
      if (status.status === 'SUCCESS') {
        return status.response;
      } else if (status.status?.includes('FAILED') || status.status === 'SENSITIVE_WORD_ERROR') {
        throw new Error(`Generation failed: ${status.errorMessage || status.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    throw new Error('Generation timeout');
  }
  
  async getTaskStatus(taskId: string): Promise<any> {
    const response = await this.makeRequest(`${this.baseUrl}/generate/record-info?taskId=${taskId}`, {
      method: 'GET'
    });
    
    const result: KieAIResponse = await response.json();
    return result.data;
  }

  // Get current API key usage statistics
  getUsageStats(): { key: string; usage: number; maxUsage: number; resetTime: Date }[] {
    return this.apiKeys.map(key => {
      const usage = this.keyUsage.get(key)!;
      return {
        key: key.substring(0, 8) + '...',
        usage: usage.count,
        maxUsage: this.maxRequestsPerKey,
        resetTime: new Date(usage.resetTime)
      };
    });
  }
}

export default SunoAPI;