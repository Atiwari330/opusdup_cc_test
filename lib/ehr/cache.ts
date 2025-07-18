// Redis caching utilities for EHR system
import { createClient, type RedisClientType } from 'redis';

class EHRCache {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL not configured, caching disabled');
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      this.client = null;
    }
  }

  // Cache analysis results by transcript ID and analysis type
  async cacheAnalysisResult(
    transcriptId: string,
    analysisType: string,
    result: any,
    ttlMinutes: number = 60
  ): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const key = `analysis:${transcriptId}:${analysisType}`;
      const ttlSeconds = ttlMinutes * 60;
      
      await this.client.setEx(key, ttlSeconds, JSON.stringify({
        result,
        cached_at: new Date().toISOString(),
        ttl_minutes: ttlMinutes,
      }));
    } catch (error) {
      console.error('Failed to cache analysis result:', error);
    }
  }

  // Retrieve cached analysis result
  async getCachedAnalysisResult(
    transcriptId: string,
    analysisType: string
  ): Promise<any | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const key = `analysis:${transcriptId}:${analysisType}`;
      const cached = await this.client.get(key);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`Cache hit for ${analysisType} analysis of transcript ${transcriptId}`);
        return parsed.result;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve cached analysis result:', error);
      return null;
    }
  }

  // Cache PDF processing results
  async cachePDFProcessing(
    pdfHash: string,
    processingResult: { text: string; pageCount: number },
    ttlHours: number = 24
  ): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const key = `pdf:${pdfHash}`;
      const ttlSeconds = ttlHours * 60 * 60;
      
      await this.client.setEx(key, ttlSeconds, JSON.stringify({
        ...processingResult,
        cached_at: new Date().toISOString(),
        ttl_hours: ttlHours,
      }));
    } catch (error) {
      console.error('Failed to cache PDF processing result:', error);
    }
  }

  // Retrieve cached PDF processing result
  async getCachedPDFProcessing(pdfHash: string): Promise<{ text: string; pageCount: number } | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const key = `pdf:${pdfHash}`;
      const cached = await this.client.get(key);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`Cache hit for PDF processing ${pdfHash}`);
        return {
          text: parsed.text,
          pageCount: parsed.pageCount,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve cached PDF processing result:', error);
      return null;
    }
  }

  // Invalidate cache for a specific transcript
  async invalidateTranscriptCache(transcriptId: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const pattern = `analysis:${transcriptId}:*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Invalidated ${keys.length} cached entries for transcript ${transcriptId}`);
      }
    } catch (error) {
      console.error('Failed to invalidate transcript cache:', error);
    }
  }

  // Get cache stats
  async getCacheStats(): Promise<{ connected: boolean; info?: any }> {
    if (!this.client || !this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.client.info('memory');
      return { connected: true, info };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { connected: false };
    }
  }
}

// Singleton instance
const ehrCache = new EHRCache();

// Initialize connection on module load
ehrCache.connect().catch(console.error);

export { ehrCache };
export type { EHRCache };