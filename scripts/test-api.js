// Node.js script to test EHR API endpoints
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testEHRAPI() {
  console.log('🔍 Testing EHR API Endpoints');
  console.log('===============================================');

  try {
    // Step 1: Test server is running
    console.log('\n📡 Checking if server is running...');
    const healthCheck = await fetch(`${API_BASE}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!healthCheck.ok) {
      throw new Error('Server not running. Please start with: pnpm dev');
    }
    console.log('✅ Server is running!');

    // Step 2: You'll need to manually get patient ID from database
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('Get patient ID from Supabase with this SQL:');
    console.log('SELECT id FROM "Patient" WHERE "firstName" = \'John\';');
    console.log('\nThen replace PATIENT_ID in the code below and re-run.');
    
    // Replace this with actual patient ID
    const PATIENT_ID = 'REPLACE_WITH_ACTUAL_PATIENT_ID';
    
    if (PATIENT_ID === 'REPLACE_WITH_ACTUAL_PATIENT_ID') {
      console.log('❌ Please update PATIENT_ID in the script first!');
      return;
    }

    // Step 3: Test PDF upload
    console.log('\n📄 Testing PDF upload...');
    const pdfPath = './test-transcripts/Initial Mental Health Session - Depression and Complicated Grief Following Paternal Loss.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('patientId', PATIENT_ID);
    formData.append('sessionDate', '2024-01-15T10:00:00.000Z');

    const uploadResponse = await fetch(`${API_BASE}/api/ehr/transcripts/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ PDF uploaded successfully!');
    console.log('Transcript ID:', uploadResult.transcript.id);

    // Step 4: Test analysis
    console.log('\n🤖 Testing SOAP analysis...');
    const analysisResponse = await fetch(`${API_BASE}/api/ehr/transcripts/${uploadResult.transcript.id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisTypes: ['soap_note'] })
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      throw new Error(`Analysis failed: ${error}`);
    }

    const analysisResult = await analysisResponse.json();
    console.log('✅ SOAP analysis completed!');
    console.log('Overall confidence:', analysisResult.results[0].overallConfidence);

    // Step 5: Test getting results
    console.log('\n📋 Testing results retrieval...');
    const getResponse = await fetch(`${API_BASE}/api/ehr/transcripts/${uploadResult.transcript.id}/analyze`);
    
    if (!getResponse.ok) {
      throw new Error('Failed to get results');
    }

    const getResult = await getResponse.json();
    console.log('✅ Results retrieved successfully!');
    console.log('Processing status:', getResult.transcript.processingStatus);

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testEHRAPI();