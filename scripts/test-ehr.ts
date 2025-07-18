#!/usr/bin/env tsx
// CLI script for testing EHR pipeline
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PDFProcessor } from '../lib/ehr/pdf-processor';
import { SOAPAnalyzer } from '../lib/ehr/analyzers/soap-analyzer';

// Load environment variables
config({ path: '.env.local' });

async function testPipeline(pdfPath: string) {
  console.log('🔍 EHR Pipeline Test Runner');
  console.log('=' * 50);
  
  try {
    // Step 1: Read PDF file
    console.log('\n📄 Reading PDF file:', pdfPath);
    const pdfBuffer = readFileSync(pdfPath);
    console.log(`✓ PDF loaded (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

    // Step 2: Extract text from PDF
    console.log('\n📝 Extracting text from PDF...');
    const pdfResult = await PDFProcessor.extractText(pdfBuffer);
    console.log(`✓ Extracted ${pdfResult.text.length} characters from ${pdfResult.pageCount} pages`);
    
    // Show preview of extracted text
    console.log('\n--- Text Preview (first 500 chars) ---');
    console.log(pdfResult.text.substring(0, 500) + '...');
    console.log('--- End Preview ---\n');

    // Step 3: Validate transcript
    console.log('🔍 Validating transcript...');
    const validation = PDFProcessor.validateTranscript(pdfResult.text);
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.reason);
      return;
    }
    console.log('✓ Transcript validation passed');

    // Step 4: Analyze with SOAP analyzer
    console.log('\n🤖 Running SOAP analysis...');
    const analyzer = new SOAPAnalyzer();
    const result = await analyzer.analyze(pdfResult.text);
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📋 SOAP NOTE RESULTS');
    console.log('='.repeat(60));
    
    // Display each section
    const sections = ['subjective', 'objective', 'assessment', 'plan'] as const;
    for (const section of sections) {
      const sectionData = result.sections[section];
      console.log(`\n## ${section.toUpperCase()}`);
      console.log('-'.repeat(40));
      console.log('Content:', sectionData.content);
      console.log(`Confidence: ${(sectionData.confidence * 100).toFixed(1)}%`);
      console.log(`Status: ${sectionData.status}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    // Save results to file (optional)
    const outputPath = pdfPath.replace('.pdf', '_soap_analysis.json');
    const { writeFileSync } = await import('fs');
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: pnpm test:ehr <pdf-file-path>');
    console.log('\nExample:');
    console.log('  pnpm test:ehr ./test-transcripts/sample-session.pdf');
    process.exit(1);
  }

  const pdfPath = join(process.cwd(), args[0]);
  await testPipeline(pdfPath);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}