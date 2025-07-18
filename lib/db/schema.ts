import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// EHR-specific tables
export const patient = pgTable('Patient', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  firstName: varchar('firstName', { length: 255 }).notNull(),
  lastName: varchar('lastName', { length: 255 }).notNull(),
  dateOfBirth: timestamp('dateOfBirth'),
  medicalRecordNumber: varchar('medicalRecordNumber', { length: 100 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Patient = InferSelectModel<typeof patient>;

export const sessionTranscript = pgTable('SessionTranscript', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  patientId: uuid('patientId')
    .notNull()
    .references(() => patient.id),
  providerId: uuid('providerId')
    .notNull()
    .references(() => user.id),
  sessionDate: timestamp('sessionDate').notNull(),
  originalPdfUrl: text('originalPdfUrl'),
  rawTranscriptText: text('rawTranscriptText').notNull(),
  processingStatus: varchar('processingStatus', { 
    enum: ['pending', 'processing', 'completed', 'failed'] 
  }).notNull().default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type SessionTranscript = InferSelectModel<typeof sessionTranscript>;

export const clinicalNote = pgTable('ClinicalNote', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  sessionTranscriptId: uuid('sessionTranscriptId')
    .notNull()
    .references(() => sessionTranscript.id),
  templateType: varchar('templateType', { length: 50 }).notNull().default('SOAP'),
  sectionsData: json('sectionsData').notNull(), // Flexible JSON for different note types
  overallConfidence: varchar('overallConfidence'), // Store as decimal string
  rawAiResponse: text('rawAiResponse'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type ClinicalNote = InferSelectModel<typeof clinicalNote>;

export const analysisResult = pgTable('AnalysisResult', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  sessionTranscriptId: uuid('sessionTranscriptId')
    .notNull()
    .references(() => sessionTranscript.id),
  analysisType: varchar('analysisType', { 
    enum: ['soap_note', 'cpt_codes', 'icd_codes', 'risk_assessment'] 
  }).notNull(),
  result: json('result').notNull(),
  confidence: varchar('confidence'), // Store as decimal string
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type AnalysisResult = InferSelectModel<typeof analysisResult>;

export const analysisCorrection = pgTable('AnalysisCorrection', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  // Reference to either clinical note or analysis result
  clinicalNoteId: uuid('clinicalNoteId').references(() => clinicalNote.id),
  analysisResultId: uuid('analysisResultId').references(() => analysisResult.id),
  // Correction details
  correctionType: varchar('correctionType', { 
    enum: ['section_edit', 'confidence_adjustment', 'code_change', 'risk_level_change', 'full_rewrite'] 
  }).notNull(),
  fieldName: varchar('fieldName', { length: 100 }), // e.g., 'subjective', 'plan', 'cpt_codes'
  originalValue: text('originalValue').notNull(),
  correctedValue: text('correctedValue').notNull(),
  correctionNotes: text('correctionNotes'), // Optional provider notes
  // Provider who made the correction
  correctedByProviderId: uuid('correctedByProviderId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type AnalysisCorrection = InferSelectModel<typeof analysisCorrection>;
