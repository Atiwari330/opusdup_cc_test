CREATE TABLE IF NOT EXISTS "AnalysisResult" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionTranscriptId" uuid NOT NULL,
	"analysisType" varchar NOT NULL,
	"result" json NOT NULL,
	"confidence" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ClinicalNote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionTranscriptId" uuid NOT NULL,
	"templateType" varchar(50) DEFAULT 'SOAP' NOT NULL,
	"sectionsData" json NOT NULL,
	"overallConfidence" varchar,
	"rawAiResponse" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"dateOfBirth" timestamp,
	"medicalRecordNumber" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SessionTranscript" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patientId" uuid NOT NULL,
	"providerId" uuid NOT NULL,
	"sessionDate" timestamp NOT NULL,
	"originalPdfUrl" text,
	"rawTranscriptText" text NOT NULL,
	"processingStatus" varchar DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_sessionTranscriptId_SessionTranscript_id_fk" FOREIGN KEY ("sessionTranscriptId") REFERENCES "public"."SessionTranscript"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_sessionTranscriptId_SessionTranscript_id_fk" FOREIGN KEY ("sessionTranscriptId") REFERENCES "public"."SessionTranscript"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SessionTranscript" ADD CONSTRAINT "SessionTranscript_patientId_Patient_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SessionTranscript" ADD CONSTRAINT "SessionTranscript_providerId_User_id_fk" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
