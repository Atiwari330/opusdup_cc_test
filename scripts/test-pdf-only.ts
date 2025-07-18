#!/usr/bin/env tsx
// Test PDF processing directly
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

async function testPDFProcessing() {
  console.log('🔍 Testing PDF Processing Only');
  console.log('=' * 40);
  
  try {
    const pdfPath = join(process.cwd(), 'test-transcripts', 'Initial Mental Health Session - Depression and Complicated Grief Following Paternal Loss.pdf');
    
    console.log('📄 Reading PDF file:', pdfPath);
    const pdfBuffer = readFileSync(pdfPath);
    console.log(`✓ PDF loaded (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

    // Test the dynamic import
    console.log('📦 Importing pdf-parse...');
    const pdfParse = (await import('pdf-parse')).default;
    console.log('✓ pdf-parse imported successfully');
    
    console.log('📝 Parsing PDF...');
    const data = await pdfParse(pdfBuffer);
    console.log('✓ PDF parsed successfully');
    console.log(`Pages: ${data.numpages}`);
    console.log(`Text length: ${data.text.length}`);
    console.log(`First 200 chars: ${data.text.substring(0, 200)}...`);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

testPDFProcessing();