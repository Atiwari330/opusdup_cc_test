# Checkpoint 1: EHR Architecture Analysis

## Overview
This document summarizes the key architectural patterns found in the existing EHR codebase, providing a foundation for integrating the Chrome Extension live transcription feature.

## Application Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4 Turbo via AI SDK
- **Styling**: Tailwind CSS with shadcn/ui components
- **Form Handling**: React Hook Form
- **Storage**: Vercel Blob (for PDFs)
- **Caching**: Redis (optional)

### Key Dependencies for Chrome Extension Integration
- WebSocket support via 'ws' library will be needed
- No existing WebSocket patterns found in codebase
- AI SDK already configured for OpenAI integration

## EHR Directory Structure

### `/app/ehr/` - Main EHR Routes
- **wizard/** - Multi-step wizard UI for transcript processing
  - Uses URL params for step tracking (`step` and `t` for transcript ID)
  - Component-based step system with shared state
  - Clean separation between UI steps and data processing
- **upload/** - Direct PDF upload endpoint (older UI)
- **api/** - RESTful endpoints for transcript processing

### `/lib/ehr/` - Core Business Logic
- **analyzers/** - AI analysis pipeline
  - Base analyzer pattern with abstract class
  - Specialized analyzers: SOAPAnalyzer, CPTAnalyzer, ICDAnalyzer
  - Registry pattern for dynamic analyzer selection
  - Each analyzer returns structured results with confidence scores
- **types.ts** - TypeScript interfaces for all EHR data structures

## Database Schema (EHR Tables)

### Core Tables
1. **patient** - Patient demographics
   - Links to user via userId
   - Basic info: firstName, lastName, dateOfBirth, medicalRecordNumber

2. **sessionTranscript** - Main transcript storage
   - Status tracking: pending → processing → completed → failed
   - Stores both PDF URL and raw transcript text
   - Links to patient and provider (user)

3. **clinicalNote** - SOAP notes from AI analysis
   - Flexible JSON structure in sectionsData
   - Supports different note templates (default: SOAP)
   - Stores confidence scores and raw AI responses

4. **analysisResult** - Other analysis outputs
   - Types: soap_note, cpt_codes, icd_codes, risk_assessment
   - JSON result storage with confidence tracking

5. **analysisCorrection** - Provider feedback/corrections
   - Tracks all manual edits to AI-generated content
   - Audit trail for compliance

## AI Analysis Pipeline

### Current Flow
1. PDF Upload → Text Extraction (pdf-parse)
2. Text → AI Analysis via analyzers
3. Parallel processing of SOAP, CPT, ICD-10
4. Results stored in database with status updates
5. UI polling for completion

### Integration Points for Chrome Extension
- Need new endpoint that accepts text directly (bypass PDF)
- Can reuse entire analyzer pipeline unchanged
- Add isDemoSession flag to differentiate demo data
- WebSocket server will feed transcription → text endpoint → existing pipeline

## UI Patterns

### Wizard Pattern (`/ehr/wizard/`)
- Step-based navigation with breadcrumbs
- URL-driven state (good for bookmarking/sharing)
- Each step is independent component
- Clean props interface: `onComplete`, `onBack`, `stepData`
- Professional clinical UI with subtle animations

### Design System
- Tailwind CSS with custom clinical-appropriate colors
- Consistent spacing and typography
- Loading states and error handling patterns
- Toast notifications for user feedback

## API Patterns

### RESTful Endpoints
- Consistent error handling with try-catch
- Status codes: 200 (success), 400 (bad request), 500 (server error)
- JSON responses with clear structure
- Request validation before processing

### Example Pattern (from upload endpoint):
```typescript
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request
    const formData = await request.formData();
    
    // 2. Process data
    const result = await processTranscript(...);
    
    // 3. Return structured response
    return NextResponse.json({ 
      transcript: result,
      message: 'Success' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

## Error Handling Patterns

### Client-Side
- Toast notifications for user errors
- Console logging for debugging
- Graceful degradation (show error state, not crash)
- Retry logic for transient failures

### Server-Side
- Structured error responses
- Proper HTTP status codes
- Error logging with context
- Database transaction rollbacks

## Key Findings for Chrome Extension Integration

### Strengths to Leverage
1. Clean analyzer abstraction - easy to reuse
2. Well-structured database schema
3. Consistent UI patterns to match
4. Good TypeScript typing throughout

### Gaps to Address
1. No WebSocket infrastructure - need custom server
2. No real-time data patterns - need to add
3. No existing Chrome extension code
4. Binary data handling not present

### Integration Strategy
1. Create text-based API endpoint (bypass PDF requirement)
2. Add WebSocket server as custom Next.js server
3. Match existing UI patterns in side panel
4. Reuse entire AI analysis pipeline
5. Add minimal demo mode flagging

## Next Steps
With this analysis complete, we can proceed to:
1. Review documentation for additional patterns
2. Create Chrome extension project structure
3. Begin implementation following identified patterns