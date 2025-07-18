-- Seed query for test patient "John Doe"
-- Run this query in your Supabase SQL editor after running migrations

-- First, we need to get or create a test provider user
-- This assumes you already have a user account created (your test provider account)
-- Replace 'your-email@example.com' with your actual test email

DO $$
DECLARE
    provider_id UUID;
BEGIN
    -- Get the first user ID (or you can specify a specific email)
    SELECT id INTO provider_id FROM "User" LIMIT 1;
    
    -- If no user exists, you'll need to create one first via the app
    IF provider_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user account first.';
    END IF;
    
    -- Insert John Doe patient
    INSERT INTO "Patient" (
        "id",
        "userId",
        "firstName", 
        "lastName",
        "dateOfBirth",
        "medicalRecordNumber",
        "createdAt",
        "updatedAt"
    ) VALUES (
        gen_random_uuid(),
        provider_id,
        'John',
        'Doe',
        '1985-06-15'::timestamp,
        'MRN-001',
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'John Doe patient created successfully (or already exists)';
END $$;

-- Verify the patient was created
SELECT * FROM "Patient" WHERE "firstName" = 'John' AND "lastName" = 'Doe';