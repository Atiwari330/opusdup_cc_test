// Quick script to create John Doe test patient
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function createTestPatient() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL not found in .env.local');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🔍 Checking for existing users...');
    
    // Get first user
    const users = await client`SELECT * FROM "User" LIMIT 1`;
    if (users.length === 0) {
      console.error('❌ No users found. Please create a user account first by logging into the app.');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log(`✅ Found user: ${users[0].email || 'Unknown'} (${userId})`);

    // Check if John Doe already exists
    const existingPatients = await client`
      SELECT * FROM "Patient" 
      WHERE "firstName" = 'John' AND "lastName" = 'Doe'
    `;

    if (existingPatients.length > 0) {
      console.log('✅ John Doe already exists!');
      console.log(`Patient ID: ${existingPatients[0].id}`);
      return existingPatients[0].id;
    }

    // Create John Doe patient
    console.log('🏥 Creating John Doe patient...');
    const patientId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Fixed UUID for consistency
    
    await client`
      INSERT INTO "Patient" (
        id, "userId", "firstName", "lastName", "dateOfBirth", 
        "medicalRecordNumber", "createdAt", "updatedAt"
      ) VALUES (
        ${patientId}, ${userId}, 'John', 'Doe', 
        '1985-06-15'::timestamp, 'MRN-001', NOW(), NOW()
      ) ON CONFLICT (id) DO NOTHING
    `;

    console.log('✅ John Doe patient created successfully!');
    console.log(`Patient ID: ${patientId}`);
    console.log(`Provider ID: ${userId}`);
    
    return patientId;

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestPatient().then((patientId) => {
  console.log('\n🎉 Ready to test! The John Doe patient is now available.');
  console.log('You can now upload PDFs in the UI.');
});