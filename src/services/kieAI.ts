import { GenerationOptions, KieAIResponse } from '../types/music';

class SunoAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.kie.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateMusic(prompt: string, options: GenerationOptions = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
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
    const response = await fetch(`${this.baseUrl}/generate/extend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
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
    const response = await fetch(`${this.baseUrl}/lyrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
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
    const response = await fetch(`${this.baseUrl}/generate/record-info?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    const result: KieAIResponse = await response.json();
    return result.data;
  }
}

export default SunoAPI;