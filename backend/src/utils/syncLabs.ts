import axios, { AxiosResponse } from 'axios';

interface SyncLabsConfig {
  apiKey: string;
  baseUrl: string;
}

interface ClonedAudioRequest {
  actorId: string;
  text: string;
  personalizationId: number;
}

interface LipsyncJobRequest {
  actorId: string;
  audioUrl: string;
  originalVideoId: string;
}

interface SyncJobResponse {
  id: string;
  status: string;
  outputUrl?: string;
}

class SyncLabsService {
  private config: SyncLabsConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SYNC_API_KEY || '',
      baseUrl: process.env.SYNC_API_BASE || 'https://api.sync.so'
    };

    if (!this.config.apiKey) {
      console.warn('⚠️ SYNC_API_KEY not found in environment variables');
    }
  }

  /**
   * Create cloned audio using SyncLabs voice cloning API
   */
  async createClonedAudio({ actorId, text, personalizationId }: ClonedAudioRequest): Promise<string> {
    try {
      console.log(`🎤 Creating cloned audio for actor ${actorId} with text: "${text}"`);
      
      const response: AxiosResponse = await axios.post(
        `${this.config.baseUrl}/v1/voices/generate`,
        {
          actor_id: actorId,
          text: text,
          voice_style: "default"
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      const audioUrl = response.data.audioUrl || response.data.audio_url || response.data.url;
      
      if (!audioUrl) {
        throw new Error('No audio URL returned from SyncLabs API');
      }

      console.log(`✅ Cloned audio created: ${audioUrl}`);
      return audioUrl;

    } catch (error: any) {
      console.error('❌ Error creating cloned audio:', error.response?.data || error.message);
      throw new Error(`Failed to create cloned audio: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create lipsync job using SyncLabs API
   */
  async createLipsyncJob({ actorId, audioUrl, originalVideoId }: LipsyncJobRequest): Promise<SyncJobResponse> {
    try {
      console.log(`🎬 Creating lipsync job for actor ${actorId} with audio: ${audioUrl}`);
      
      const response: AxiosResponse = await axios.post(
        `${this.config.baseUrl}/v1/lipsync/generate`,
        {
          actor_id: actorId,
          audio_url: audioUrl,
          source_video_id: originalVideoId,
          // Additional parameters that might be needed
          quality: 'high',
          format: 'mp4'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      const jobData = response.data.job || response.data;
      
      if (!jobData.id) {
        throw new Error('No job ID returned from SyncLabs API');
      }

      console.log(`✅ Lipsync job created: ${jobData.id}`);
      return {
        id: jobData.id,
        status: jobData.status || 'pending',
        outputUrl: jobData.outputUrl || jobData.output_url
      };

    } catch (error: any) {
      console.error('❌ Error creating lipsync job:', error.response?.data || error.message);
      throw new Error(`Failed to create lipsync job: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check the status of a SyncLabs job
   */
  async getJobStatus(jobId: string): Promise<SyncJobResponse> {
    try {
      console.log(`🔍 Checking status for job: ${jobId}`);
      
      const response: AxiosResponse = await axios.get(
        `${this.config.baseUrl}/v1/jobs/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      const jobData = response.data.job || response.data;
      
      return {
        id: jobData.id || jobId,
        status: jobData.status || 'unknown',
        outputUrl: jobData.outputUrl || jobData.output_url || jobData.result_url
      };

    } catch (error: any) {
      console.error('❌ Error checking job status:', error.response?.data || error.message);
      throw new Error(`Failed to check job status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Poll for job completion with timeout
   */
  async waitForJobCompletion(jobId: string, maxWaitTime: number = 300000): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    console.log(`⏳ Waiting for job ${jobId} to complete...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const jobStatus = await this.getJobStatus(jobId);
        
        console.log(`📊 Job ${jobId} status: ${jobStatus.status}`);

        if (jobStatus.status === 'completed' && jobStatus.outputUrl) {
          console.log(`✅ Job ${jobId} completed successfully: ${jobStatus.outputUrl}`);
          return jobStatus.outputUrl;
        }

        if (jobStatus.status === 'failed' || jobStatus.status === 'error') {
          throw new Error(`Job ${jobId} failed with status: ${jobStatus.status}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error: any) {
        console.error(`❌ Error polling job ${jobId}:`, error.message);
        // Continue polling unless it's a definitive failure
        if (error.message.includes('failed')) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Job ${jobId} did not complete within ${maxWaitTime / 1000} seconds`);
  }
}

export default new SyncLabsService();
