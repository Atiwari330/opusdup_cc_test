CREATE TABLE IF NOT EXISTS "AnalysisCorrection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinicalNoteId" uuid,
	"analysisResultId" uuid,
	"correctionType" varchar NOT NULL,
	"fieldName" varchar(100),
	"originalValue" text NOT NULL,
	"correctedValue" text NOT NULL,
	"correctionNotes" text,
	"correctedByProviderId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AnalysisCorrection" ADD CONSTRAINT "AnalysisCorrection_clinicalNoteId_ClinicalNote_id_fk" FOREIGN KEY ("clinicalNoteId") REFERENCES "public"."ClinicalNote"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AnalysisCorrection" ADD CONSTRAINT "AnalysisCorrection_analysisResultId_AnalysisResult_id_fk" FOREIGN KEY ("analysisResultId") REFERENCES "public"."AnalysisResult"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AnalysisCorrection" ADD CONSTRAINT "AnalysisCorrection_correctedByProviderId_User_id_fk" FOREIGN KEY ("correctedByProviderId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
