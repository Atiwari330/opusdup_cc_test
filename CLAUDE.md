# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js AI chatbot application built with OpenAI integration, featuring a modern tech stack including TypeScript, Tailwind CSS, and Drizzle ORM. The application includes authentication, chat functionality, document management, and artifact creation capabilities.

## Common Development Commands

### Development
- `pnpm dev` - Start development server with turbo
- `pnpm build` - Build for production (includes automatic database migrations)
- `pnpm start` - Start production server

### Database Management
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:generate` - Generate new migrations from schema changes
- `pnpm db:push` - Push schema changes directly to database
- `pnpm db:pull` - Pull schema from database

### Code Quality
- `pnpm lint` - Run Next.js ESLint and Biome linting with auto-fix
- `pnpm lint:fix` - Run linting with automatic fixes
- `pnpm format` - Format code with Biome

### Testing
- `pnpm test` - Run Playwright E2E tests
- `pnpm test:ehr process-pdf <pdf-path>` - Test EHR PDF processing pipeline

## Architecture Overview

### Directory Structure
- `app/` - Next.js App Router pages and API routes
  - `(auth)/` - Authentication pages and API routes
  - `(chat)/` - Chat-related pages and API routes
- `components/` - Reusable React components (shadcn/ui + custom)
- `lib/` - Core utilities and business logic
  - `ai/` - AI provider configuration and model definitions
  - `db/` - Database schema, migrations, and queries
  - `editor/` - Rich text editor configurations
- `artifacts/` - Artifact system for code, images, sheets, and text
- `hooks/` - Custom React hooks
- `tests/` - Playwright E2E tests and fixtures
- `lib/ehr/` - Electronic Health Record system
  - `analyzers/` - Modular AI analyzers (SOAP, future: billing/ICD codes)
  - `pdf-processor.ts` - PDF text extraction
  - `db-queries.ts` - EHR database operations
- `scripts/` - CLI tools including EHR testing script

### Key Components

#### AI Integration
- **Provider**: Custom AI provider in `lib/ai/providers.ts` using OpenAI GPT-4 Turbo
- **Models**: Configured models for chat, reasoning, titles, and artifacts
- **Tools**: AI tools for document management, weather, and suggestions

#### Database Schema
- **Users**: Authentication and user management
- **Chats**: Conversation storage with visibility controls
- **Messages**: Chat messages with parts and attachments (v2 schema)
- **Documents**: Text, code, image, and sheet artifacts
- **Suggestions**: Text editing suggestions for documents
- **Votes**: Message voting system
- **Patient**: Mental health patient records
- **SessionTranscript**: Therapy session transcripts with PDF storage
- **ClinicalNote**: AI-generated SOAP notes with confidence scores
- **AnalysisResult**: Flexible storage for various analysis types

#### Authentication
- Uses NextAuth.js with custom configuration
- Supports email/password authentication
- Guest mode available via API

#### Artifact System
- Supports four types: text, code, image, and sheet
- Real-time collaborative editing capabilities
- Version control and suggestion system

#### EHR System (Electronic Health Records)
- **PDF Processing**: Extract text from therapy session transcripts
- **SOAP Analysis**: AI-powered generation of SOAP notes with confidence scoring
- **Modular Analyzers**: Extensible architecture for future features (billing codes, ICD codes, risk assessment)
- **API Endpoints**:
  - `POST /api/ehr/transcripts/upload` - Upload PDF transcripts
  - `POST /api/ehr/transcripts/[id]/analyze` - Analyze transcript with AI
  - `GET /api/ehr/transcripts/[id]/analyze` - Retrieve analysis results

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4 Turbo via AI SDK
- **Auth**: NextAuth.js
- **Storage**: Vercel Blob
- **Caching**: Redis
- **Testing**: Playwright
- **Code Quality**: Biome for linting and formatting

### Environment Configuration
Required environment variables:
- `POSTGRES_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `AUTH_SECRET` - NextAuth secret
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (optional)
- `REDIS_URL` - Redis connection string (optional)

### Development Notes
- Database migrations run automatically during build
- Uses experimental PPR (Partial Prerendering) in chat layout
- Includes Pyodide for client-side Python execution
- Biome configuration includes specific rules for accessibility and code style
- Test environment uses mock AI models for consistent testing