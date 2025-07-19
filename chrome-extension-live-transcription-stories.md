# Chrome Extension Live Transcription - User Stories & Implementation Plan

## Overview

This document contains a prioritized list of one-story-point user stories for implementing a Chrome Extension that captures live audio during video calls, streams it for real-time transcription via Deepgram, and integrates with the existing EHR AI analysis pipeline. Each story is designed to be completed in one day or less by an AI agent builder. **Focus: Demo-ready functionality, not enterprise production software.**

## Priority Framework

Using WSJF (Weighted Shortest Job First):

- **P0**: Critical foundation (blocks all other work)
- **P1**: Core functionality (blocks major features)
- **P2**: Essential features (required for MVP)
- **P3**: Nice-to-have features

## Definition of Done

- [ ] Code compiles without errors
- [ ] TypeScript types are properly defined (if applicable)
- [ ] Basic error handling implemented (user-friendly messages)
- [ ] Key operation logging for debugging (not verbose metrics)
- [ ] Code follows existing patterns in the codebase
- [ ] Manual testing completed with demo scenarios
- [ ] Changes committed with descriptive message

## Epic 1: Codebase Familiarization & Project Foundation

### 1.1 Analyze Existing EHR Architecture

- [ ] **Story**: As an AI agent builder, I need to understand the existing EHR codebase structure so that I can integrate live transcription seamlessly.
  - **Priority**: P0
  - **Dependencies**: None
  - **Acceptance Criteria**:
    - Complete analysis of `/app/ehr/` directory structure and components
    - Document existing AI pipeline in `/lib/ehr/` for SOAP, CPT, ICD-10 analysis
    - Identify current database schema in `/lib/db/schema.ts`
    - Create `checkpoint-1-analysis.md` summarizing key architectural patterns
    - Console logs show successful file reading and pattern identification
  - **Files to Read**:
    - `app/ehr/wizard/page.tsx` and all step components
    - `lib/ehr/analyzers/` directory for AI processing patterns
    - `lib/db/schema.ts` for database structure
    - `package.json` for existing dependencies

### 1.2 Review Documentation and Implementation Patterns

- [ ] **Story**: As an AI agent builder, I need to understand the documentation patterns and implementation standards so that I can follow consistent coding practices.
  - **Priority**: P0
  - **Dependencies**: 1.1
  - **Acceptance Criteria**:
    - Review all documentation files in `/docs/` directory
    - Identify existing WebSocket patterns (if any) in codebase
    - Document current error handling and logging standards
    - Note TypeScript patterns and interface definitions used
    - Console logs show successful documentation parsing and pattern extraction
  - **Files to Read**:
    - All files in `/docs/` directory
    - Existing API routes in `/app/api/` for patterns
    - Current error handling examples in components

### 1.3 Create Project Structure for Chrome Extension

- [ ] **Story**: As a developer, I need a Chrome extension directory structure so that I can organize the extension components properly.
  - **Priority**: P0
  - **Dependencies**: 1.1, 1.2
  - **Acceptance Criteria**:
    - Create `/chrome-extension/` directory in project root
    - Set up subdirectories: `/manifest/`, `/background/`, `/content/`, `/sidepanel/`, `/offscreen/`
    - Create `/chrome-extension/package.json` with extension-specific dependencies
    - Initialize basic TypeScript configuration for extension
    - Console logs confirm successful directory creation and structure setup
  - **Files to Create**:
    - `chrome-extension/package.json`
    - `chrome-extension/tsconfig.json`
    - Directory structure as specified

## Epic 2: Chrome Extension Manifest & Permissions

### 2.1 Create Manifest V3 Configuration

- [ ] **Story**: As an extension developer, I need a proper Manifest V3 configuration so that the extension has correct permissions and structure.
  - **Priority**: P0
  - **Dependencies**: 1.3
  - **Acceptance Criteria**:
    - Create `manifest.json` with all required permissions (tabCapture, sidePanel, offscreen, storage)
    - Configure service worker and action settings
    - Set minimum Chrome version to 116+ for tab capture support
    - Include proper content security policy
    - Console logs show successful manifest validation
  - **Files to Create**: `chrome-extension/manifest.json`
  - **Pattern Reference**: Use documentation from `docs/01-chrome-extension/manifest-v3-basics.md`

### 2.2 Implement Service Worker Foundation

- [ ] **Story**: As an extension developer, I need a service worker that handles extension lifecycle so that audio capture can be managed properly.
  - **Priority**: P0
  - **Dependencies**: 2.1
  - **Acceptance Criteria**:
    - Create `background.js` with top-level event listeners for MV3 compliance
    - Implement extension install, action click, and message handling
    - Add basic keepalive with setTimeout (simpler than chrome.alarms)
    - Include basic error handling and logging for key events
    - Console logs show service worker activation and major events
  - **Files to Create**: `chrome-extension/background.js`
  - **Pattern Reference**: Use documentation from `docs/01-chrome-extension/manifest-v3-basics.md`
  - **Research Tip**: If needed, research Chrome MV3 service worker patterns for audio extensions

### 2.3 Create Offscreen Document Structure

- [ ] **Story**: As an extension developer, I need an offscreen document for audio processing so that tab capture can work within MV3 limitations.
  - **Priority**: P1
  - **Dependencies**: 2.2
  - **Acceptance Criteria**:
    - Create `offscreen.html` with minimal structure for audio processing
    - Implement `offscreen.js` with audio capture capabilities
    - Add proper message handling between service worker and offscreen document
    - Include audio stream management and MediaRecorder setup
    - Console logs show offscreen document creation and audio stream acquisition
  - **Files to Create**:
    - `chrome-extension/offscreen.html`
    - `chrome-extension/offscreen.js`
  - **Pattern Reference**: Use patterns from `docs/01-chrome-extension/offscreen-documents.md`

## Epic 3: Audio Capture & Processing

### 3.1 Implement Tab Audio Capture

- [ ] **Story**: As a user, I need the extension to capture audio from my current tab so that video call conversations can be transcribed.
  - **Priority**: P1
  - **Dependencies**: 2.3
  - **Acceptance Criteria**:
    - Implement `chrome.tabCapture.getMediaStreamId()` in service worker
    - Use stream ID in offscreen document to get MediaStream via getUserMedia
    - Configure audio constraints for tab capture (chromeMediaSource: 'tab')
    - Add audio playback routing so users can still hear the call
    - Console logs show successful stream acquisition and audio routing
  - **Files to Update**:
    - `chrome-extension/background.js`
    - `chrome-extension/offscreen.js`
  - **Logging Strategy**:
    - Log stream ID generation with tab information
    - Log MediaStream creation with track details
    - Log audio routing setup and playback confirmation

### 3.2 Configure MediaRecorder for Streaming

- [ ] **Story**: As a developer, I need MediaRecorder configured for real-time streaming so that audio can be sent continuously to the backend.
  - **Priority**: P1
  - **Dependencies**: 3.1
  - **Acceptance Criteria**:
    - Configure MediaRecorder with `audio/webm;codecs=opus` mime type
    - Set audio bitrate to 128000 for quality/performance balance
    - Implement 250ms chunk intervals for low latency
    - Add ondataavailable handler for streaming chunks
    - Console logs show MediaRecorder configuration and chunk generation
  - **Files to Update**: `chrome-extension/offscreen.js`
  - **Pattern Reference**: Use configuration from `docs/03-audio-processing/mediarecorder-api.md`

### 3.3 Add Basic Audio Buffering

- [ ] **Story**: As a developer, I need simple audio buffering so that brief network hiccups don't interrupt demos.
  - **Priority**: P2
  - **Dependencies**: 3.2
  - **Acceptance Criteria**:
    - Create simple array-based buffer with max size limit (e.g., 50 chunks)
    - Clear buffer when it reaches limit (prevent memory issues)
    - Add basic retry logic when WebSocket is temporarily unavailable
    - Console logs show buffer usage and clearing events
  - **Files to Update**: `chrome-extension/offscreen.js`
  - **Pattern Reference**: Review buffering concepts in `docs/03-audio-processing/real-time-streaming.md`

## Epic 4: WebSocket Communication

### 4.1 Create Next.js Custom Server for WebSockets

- [ ] **Story**: As a developer, I need a custom Next.js server so that WebSocket connections can be maintained for real-time audio streaming.
  - **Priority**: P1
  - **Dependencies**: None (parallel with extension work)
  - **Acceptance Criteria**:
    - Create `server.js` in project root with custom HTTP server
    - Integrate WebSocket server using 'ws' library (not socket.io for MV3 compatibility)
    - Configure binary WebSocket support (`binaryType: 'arraybuffer'`)
    - Add connection handling with proper cleanup
    - Console logs show server startup and WebSocket connection events
  - **Files to Create**: `server.js`
  - **Pattern Reference**: Use custom server pattern from `docs/04-websockets/nextjs-websocket-server.md`

### 4.2 Implement Binary Audio Streaming

- [ ] **Story**: As a developer, I need efficient binary streaming so that audio data is transmitted without encoding overhead.
  - **Priority**: P1
  - **Dependencies**: 4.1, 3.2
  - **Acceptance Criteria**:
    - Configure WebSocket for binary data transmission (no base64 encoding)
    - Implement audio chunk forwarding from extension to server
    - Add proper binary data handling in server WebSocket
    - Include chunk size validation and error handling
    - Console logs show binary data transmission with chunk sizes and timestamps
  - **Files to Update**:
    - `server.js`
    - `chrome-extension/offscreen.js`
  - **API Integration Logging**:
    - Log WebSocket connection establishment with endpoint and protocol
    - Log binary chunk transmission with size and sequence info
    - Log any transmission errors with retry attempts

### 4.3 Add Simple Connection Recovery

- [ ] **Story**: As a user, I need basic connection recovery so that network hiccups don't completely stop transcription.
  - **Priority**: P2
  - **Dependencies**: 4.2
  - **Acceptance Criteria**:
    - Implement simple reconnection with 3 retry attempts
    - Add 2-second delay between reconnection attempts
    - Show connection status to user (connected/disconnected/retrying)
    - Handle graceful connection closure and cleanup
    - Console logs show connection state changes and retry attempts
  - **Files to Update**: `chrome-extension/offscreen.js` and `chrome-extension/sidepanel.js`
  - **Pattern Reference**: Review simple reconnection patterns in `docs/04-websockets/reconnection-patterns.md`
  - **Research Tip**: If needed, research WebSocket reconnection best practices for Chrome extensions

## Epic 5: Deepgram Integration

### 5.1 Set Up Deepgram Client Configuration

- [ ] **Story**: As a developer, I need Deepgram configured for medical transcription so that healthcare terminology is accurately captured.
  - **Priority**: P1
  - **Dependencies**: 4.1
  - **Acceptance Criteria**:
    - Install `@deepgram/sdk` dependency in main project
    - Configure Deepgram client with Nova-3-Medical model
    - Set up streaming configuration with optimal settings for healthcare
    - Add API key management and environment configuration
    - Console logs show Deepgram client initialization and configuration
  - **Files to Update**:
    - `package.json`
    - `server.js`
  - **Pattern Reference**: Use configuration from `docs/02-deepgram/nova-medical-model.md`

### 5.2 Implement Real-time Transcription Streaming

- [ ] **Story**: As a developer, I need Deepgram streaming integration so that audio is transcribed in real-time.
  - **Priority**: P1
  - **Dependencies**: 5.1, 4.2
  - **Acceptance Criteria**:
    - Create Deepgram WebSocket connection in server
    - Forward audio chunks from Chrome extension to Deepgram
    - Handle interim and final transcription results
    - Add proper error handling for Deepgram API failures
    - Console logs show Deepgram connection status and transcription events
  - **Files to Update**: `server.js`
  - **API Integration Logging**:
    - Log Deepgram connection establishment with model and settings
    - Log audio data forwarding with chunk sizes
    - Log transcription responses with confidence scores and timestamps

### 5.3 Add Basic Transcription Result Processing

- [ ] **Story**: As a developer, I need simple transcription result formatting so that real-time text displays properly.
  - **Priority**: P2
  - **Dependencies**: 5.2
  - **Acceptance Criteria**:
    - Parse Deepgram response JSON for transcript text
    - Handle interim vs final result types (basic differentiation)
    - Extract basic confidence scores and timestamps
    - Forward formatted results to Chrome extension
    - Console logs show transcription results and forwarding
  - **Files to Update**: `server.js`
  - **Pattern Reference**: Use Deepgram response handling from `docs/02-deepgram/websocket-streaming.md`

## Epic 6: Side Panel UI

### 6.1 Create Side Panel HTML Structure

- [ ] **Story**: As a user, I need a side panel interface so that I can see transcription results in real-time.
  - **Priority**: P1
  - **Dependencies**: 2.1
  - **Acceptance Criteria**:
    - Create `sidepanel.html` with header, transcription area, and controls
    - Include start/stop recording buttons and status indicators
    - Add scrollable transcription display area
    - Include export and clear functionality buttons
    - Console logs show side panel initialization and element creation
  - **Files to Create**: `chrome-extension/sidepanel.html`
  - **UI Components to Use**: Match existing EHR design system colors and typography

### 6.2 Implement Side Panel JavaScript Logic

- [ ] **Story**: As a user, I need functional controls in the side panel so that I can manage recording and view transcriptions.
  - **Priority**: P1
  - **Dependencies**: 6.1, 3.1
  - **Acceptance Criteria**:
    - Implement start/stop recording button functionality
    - Add real-time transcription display with auto-scrolling
    - Include connection status indicators and error messaging
    - Add transcript export functionality for demo handoff
    - Console logs show user interactions and state changes
  - **Files to Create**: `chrome-extension/sidepanel.js`
  - **Logging Strategy**:
    - Log user button clicks with action and timestamp
    - Log transcription updates with text length and display position
    - Log connection status changes with detailed state info

### 6.3 Style Side Panel to Match EHR Design

- [ ] **Story**: As a user, I need professional-looking UI so that the extension feels integrated with the main EHR application.
  - **Priority**: P2
  - **Dependencies**: 6.2
  - **Acceptance Criteria**:
    - Create `sidepanel.css` matching existing EHR color scheme
    - Use fixed-width design (no complex responsive breakpoints)
    - Add basic typography and spacing consistent with main app
    - Include simple loading states and status indicators
    - UI looks professional and clean for demo purposes
  - **Files to Create**: `chrome-extension/sidepanel.css`
  - **Style Reference**: Match design system from existing `/app/ehr/` components
  - **Research Tip**: Review existing EHR CSS files to match color scheme and fonts

### 6.4 Human Testing Checkpoint #1

- [ ] **Story**: As a stakeholder, I need to review the side panel UI and basic audio capture before proceeding to transcription integration.
  - **Priority**: P1
  - **Dependencies**: 6.3, 3.2
  - **Acceptance Criteria**:
    - Extension successfully loads in Chrome developer mode
    - Side panel opens and displays properly with professional styling
    - Audio capture works on test video call (Google Meet/Zoom)
    - Recording controls function correctly with visual feedback
    - Console logs reviewed for debugging effectiveness and completeness
    - Human approval received before proceeding to Epic 7
  - **Files to Review**: All extension files created so far
  - **Testing Requirements**: Manual testing on video conferencing platforms

## Epic 7: Real-time Transcription Display

### 7.1 Implement WebSocket Client in Extension

- [ ] **Story**: As a user, I need the extension to connect to the transcription server so that I can receive real-time transcription results.
  - **Priority**: P1
  - **Dependencies**: 4.3, 6.2
  - **Acceptance Criteria**:
    - Create WebSocket connection from extension to Next.js server
    - Implement message passing between extension components
    - Add connection status tracking and user feedback
    - Include proper error handling and reconnection logic
    - Console logs show WebSocket connection lifecycle and message passing
  - **Files to Update**:
    - `chrome-extension/sidepanel.js`
    - `chrome-extension/background.js`
  - **API Integration Logging**:
    - Log WebSocket connection attempts with server endpoint
    - Log connection success/failure with detailed error information
    - Log all message passing between extension components

### 7.2 Display Real-time Transcription Results

- [ ] **Story**: As a user, I need to see transcription text appear in real-time so that I can monitor conversation capture during demos.
  - **Priority**: P1
  - **Dependencies**: 7.1, 5.3
  - **Acceptance Criteria**:
    - Display interim transcription results with visual distinction (italics/faded)
    - Show final transcription results with full opacity and formatting
    - Include timestamps and confidence scores for each segment
    - Auto-scroll to show latest transcription with smooth behavior
    - Console logs show transcription updates with timing and confidence data
  - **Files to Update**: `chrome-extension/sidepanel.js`
  - **Logging Strategy**:
    - Log each transcription update with type (interim/final), length, and confidence
    - Log UI updates with scroll position and display timing

### 7.3 Add Basic Session Controls

- [ ] **Story**: As a user, I need simple session controls so that I can start fresh transcriptions for different demo calls.
  - **Priority**: P2
  - **Dependencies**: 7.2
  - **Acceptance Criteria**:
    - Add clear/reset button to start new sessions
    - Store transcription text in simple array for compilation
    - Include basic export functionality (copy to clipboard or text download)
    - Show simple session status (recording/stopped)
    - Console logs show session start/stop and export events
  - **Files to Update**: `chrome-extension/sidepanel.js`

## Epic 8: Integration with Existing EHR Pipeline

### 8.1 Create Text-based Analysis API Endpoint

- [ ] **Story**: As a developer, I need a new API endpoint that accepts text transcripts so that live transcriptions can use the existing AI analysis pipeline.
  - **Priority**: P1
  - **Dependencies**: None (can be parallel)
  - **Acceptance Criteria**:
    - Create `/api/ehr/transcripts/analyze-text` endpoint
    - Accept compiled transcript text instead of PDF upload
    - Format text to work with existing analysis pipeline
    - Reuse existing SOAP, CPT, ICD-10 analyzers without modification
    - Console logs show API requests and analysis pipeline execution
  - **Files to Create**: `app/api/ehr/transcripts/analyze-text/route.ts`
  - **Pattern Reference**: Follow patterns from existing `/api/ehr/transcripts/upload-test/route.ts`

### 8.2 Add Simple Demo Mode Flag

- [ ] **Story**: As a developer, I need demo sessions flagged so that demo data is clearly identified.
  - **Priority**: P1
  - **Dependencies**: 8.1
  - **Acceptance Criteria**:
    - Add `isDemoSession` boolean flag to transcript records
    - Set flag to true for all transcripts from chrome extension
    - Update analyze-text API to include demo flag
    - No complex filtering needed - just flag for identification
    - Console logs show demo mode flag being set
  - **Files to Update**:
    - `lib/db/schema.ts` (if needed)
    - `app/api/ehr/transcripts/analyze-text/route.ts`
  - **Pattern Reference**: Follow existing database patterns in current schema

### 8.3 Add "Process Transcript" Integration Button

- [ ] **Story**: As a user, I need a button in the side panel so that I can send the compiled transcript to the EHR analysis pipeline.
  - **Priority**: P1
  - **Dependencies**: 8.2, 7.3
  - **Acceptance Criteria**:
    - Add "Process Transcript" button to side panel UI
    - Compile final transcript from session transcription results
    - Send transcript to new analyze-text API endpoint
    - Open main EHR app in new tab showing analysis results
    - Console logs show transcript compilation and API integration
  - **Files to Update**:
    - `chrome-extension/sidepanel.js`
    - `chrome-extension/sidepanel.html`
  - **API Integration Logging**:
    - Log transcript compilation with word count and session duration
    - Log API request to analyze-text endpoint with payload size
    - Log response handling and tab opening for results

### 8.4 Human Testing Checkpoint #2

- [ ] **Story**: As a stakeholder, I need to review the complete transcription-to-analysis flow before final optimizations.
  - **Priority**: P1
  - **Dependencies**: 8.3, 7.2
  - **Acceptance Criteria**:
    - Complete demo flow works: audio capture → transcription → analysis → results
    - Transcript quality is suitable for AI analysis (95%+ accuracy on clear speech)
    - Analysis pipeline produces expected SOAP notes, CPT codes, ICD-10 codes
    - Demo mode properly separates from production data
    - Console logs reviewed for complete debugging coverage
    - Human approval received before proceeding to final epic
  - **Testing Requirements**: End-to-end demo testing with sample healthcare conversation

## Epic 9: Basic Error Handling & Demo Readiness

### 9.1 Add Essential Error Handling

- [ ] **Story**: As a user, I need basic error messages so that I understand when something goes wrong during demos.
  - **Priority**: P2
  - **Dependencies**: 8.3
  - **Acceptance Criteria**:
    - Add user-friendly error messages for connection failures
    - Show simple error notifications in side panel
    - Include basic retry button for failed operations
    - Add error logging for debugging support issues
    - Console logs show error types and user actions taken
  - **Files to Update**:
    - `chrome-extension/sidepanel.js`
    - `server.js`
  - **Pattern Reference**: Review basic error handling in `docs/05-integration/error-handling.md`

### 9.2 Create Simple Extension Package

- [ ] **Story**: As a developer, I need the extension packaged for easy installation so that it can be shared for demos.
  - **Priority**: P3
  - **Dependencies**: 9.1
  - **Acceptance Criteria**:
    - Create basic extension .zip file for developer mode installation
    - Include minimal required icons (just 16px, 48px, 128px)
    - Test loading extension in Chrome developer mode
    - Create simple installation instructions
    - Console logs confirm successful extension loading
  - **Files to Create**:
    - Basic icon files in `chrome-extension/icons/`
    - `installation-instructions.md`
  - **Research Tip**: Look up Chrome extension developer mode installation if needed

## Sprint Mapping

### Sprint 1 (Days 1-4): Foundation & Architecture

- Epic 1: Codebase Familiarization (Stories 1.1-1.3)
- Epic 2: Chrome Extension Manifest & Permissions (Stories 2.1-2.3)
- Epic 4: WebSocket Communication (Story 4.1)
- Epic 5: Deepgram Integration (Story 5.1)

### Sprint 2 (Days 5-8): Audio Capture & Basic UI

- Epic 3: Audio Capture & Processing (Stories 3.1-3.3)
- Epic 6: Side Panel UI (Stories 6.1-6.3)
- Checkpoint #1: Basic functionality review

### Sprint 3 (Days 9-12): Real-time Transcription

- Epic 4: WebSocket Communication (Stories 4.2-4.3)
- Epic 5: Deepgram Integration (Stories 5.2-5.3)
- Epic 7: Real-time Transcription Display (Stories 7.1-7.3)

### Sprint 4 (Days 13-16): EHR Integration & Polish

- Epic 8: Integration with Existing EHR Pipeline (Stories 8.1-8.3)
- Checkpoint #2: End-to-end flow review
- Epic 9: Basic Error Handling & Demo Readiness (Stories 9.1-9.2)

## Notes for AI Agent Builder

### Before Starting

1. Read this entire document first
2. Complete Epic 1 (Codebase Familiarization) before any coding
3. Check off completed tasks using [x] in this file
4. Create checkpoint summary files as specified

### Key Patterns to Follow

- Follow existing TypeScript patterns in `/app/` and `/lib/` directories
- Use existing UI component patterns from `/components/ui/`
- Match error handling patterns from current API routes
- Follow existing database schema patterns from `/lib/db/`
- Use consistent naming conventions with existing codebase

### Logging Requirements & Best Practices

1. **Focus on key operation logging** (not verbose metrics):

   - API request/response for Deepgram and EHR integration
   - WebSocket connection status and major events
   - Audio capture start/stop and major errors
   - User interactions (button clicks, session start/stop)
   - Error conditions with basic context

2. **Simple Logging Format**:

   - Use descriptive prefixes: `[Extension]`, `[WebSocket]`, `[Deepgram]`, `[ERROR]`
   - Include timestamps for API calls
   - Use console.warn for recoverable issues
   - Use console.error for failures that stop functionality

3. **Keep it simple - avoid over-logging**:
   - Log major events, not every small operation
   - Focus on what helps with demo troubleshooting
   - Don't log performance metrics unless specifically needed

### When Stuck

- **First**: Review the comprehensive documentation in `/docs/` directory for patterns and examples
- **Second**: Research online if you need additional context (e.g., "Chrome MV3 audio capture", "Deepgram WebSocket streaming")
- **Third**: Check existing patterns in similar components in the codebase
- **Fourth**: Test in isolation before integrating with larger system
- Use checkpoint reviews to get human feedback when needed

### Progress Tracking

- Update completion status in this file after each story using [x]
- Create checkpoint summary files at designated review points
- Report blockers immediately with context and research attempted

### Research Guidelines

When you need additional information beyond the docs:

- Feel free to research Chrome Extension APIs, WebSocket patterns, Deepgram integration
- Look up current best practices for any technology you're implementing
- Verify that patterns from documentation are still current/recommended
- Research specific error messages or API responses you encounter

---

## Completion Status

**Total Stories**: 22 (trimmed from 32)
**Completed**: 0
**In Progress**: 0
**Blocked**: 0

Last Updated: [Date to be filled by agent]
Next Checkpoint: Epic 1 completion and foundation review
