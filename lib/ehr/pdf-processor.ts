// PDF processing service
// Dynamic import to avoid module loading issues
// import pdfParse from 'pdf-parse';
import { createHash } from 'crypto';
import { ehrCache } from './cache';

export interface PDFProcessingResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

export class PDFProcessor {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for PDFs

  /**
   * Extract text from a PDF buffer
   */
  static async extractText(pdfBuffer: Buffer): Promise<PDFProcessingResult> {
    if (pdfBuffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`PDF file too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Generate hash for caching
    const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');
    
    // Check cache first
    const cached = await ehrCache.getCachedPDFProcessing(pdfHash);
    if (cached) {
      console.log('Using cached PDF processing result');
      return {
        text: cached.text,
        pageCount: cached.pageCount,
        metadata: {}, // Metadata not cached for simplicity
      };
    }

    try {
      console.log('Importing pdf-parse...');
      // Dynamic import to avoid module loading issues
      const pdfParse = (await import('pdf-parse')).default;
      console.log('pdf-parse imported successfully');
      
      console.log('Parsing PDF buffer...');
      const data = await pdfParse(pdfBuffer);
      console.log('PDF parsing completed');
      
      // Clean the extracted text
      const cleanedText = this.cleanText(data.text);
      
      const result = {
        text: cleanedText,
        pageCount: data.numpages,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        },
      };

      // Cache the result (24 hour TTL)
      await ehrCache.cachePDFProcessing(pdfHash, {
        text: cleanedText,
        pageCount: data.numpages,
      }, 24);
      
      return result;
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private static cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/Page \d+ of \d+/gi, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Validate if the text appears to be a therapy transcript
   */
  static validateTranscript(text: string): { isValid: boolean; reason?: string } {
    const minLength = 100; // Minimum reasonable length for a transcript
    
    if (text.length < minLength) {
      return { isValid: false, reason: 'Text too short to be a valid transcript' };
    }

    // Look for common therapy transcript indicators
    const therapyIndicators = [
      'patient', 'client', 'therapy', 'session', 'appointment',
      'dr.', 'doctor', 'therapist', 'counselor', 'psychologist'
    ];
    
    const lowerText = text.toLowerCase();
    const hasIndicators = therapyIndicators.some(indicator => lowerText.includes(indicator));
    
    if (!hasIndicators) {
      return { isValid: false, reason: 'Text does not appear to be a therapy transcript' };
    }

    return { isValid: true };
  }
}