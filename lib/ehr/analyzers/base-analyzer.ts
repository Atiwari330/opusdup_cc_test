// Base analyzer class for all EHR analyzers
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { Analyzer, AnalyzerConfig, TranscriptAnalysis } from '../types';

export abstract class BaseAnalyzer implements Analyzer {
  constructor(public config: AnalyzerConfig) {}

  protected abstract buildPrompt(transcript: string, options?: any): string;
  protected abstract parseResponse(aiResponse: string): any;
  protected abstract calculateConfidence(result: any, aiResponse: string): number;

  async analyze(transcript: string, options?: any): Promise<TranscriptAnalysis['result']> {
    try {
      const prompt = this.buildPrompt(transcript, options);
      
      // Use OpenAI GPT-4 Turbo for analysis
      const { text } = await generateText({
        model: openai('gpt-4-turbo'),
        prompt,
        temperature: 0.3, // Lower temperature for more consistent clinical analysis
        maxTokens: 2000,
      });

      const parsedResult = this.parseResponse(text);
      const confidence = this.calculateConfidence(parsedResult, text);

      return {
        ...parsedResult,
        confidence,
        rawAiResponse: text,
      };
    } catch (error) {
      console.error(`${this.config.name} analysis failed:`, error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to extract confidence from AI response if it includes confidence scores
   */
  protected extractConfidenceFromResponse(text: string): number | null {
    // Look for confidence patterns like "Confidence: 0.85" or "85% confident"
    const patterns = [
      /confidence[:\s]+(\d*\.?\d+)/i,
      /(\d+)%\s*confident/i,
      /confidence\s*score[:\s]+(\d*\.?\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        // Convert percentage to decimal if needed
        return value > 1 ? value / 100 : value;
      }
    }

    return null;
  }
}