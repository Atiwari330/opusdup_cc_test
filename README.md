<h1 align="center">My AI Chatbot Starter Template</h1>

<p align="center">
    A personal starter template for building AI chatbot applications with Next.js, OpenAI, and modern web technologies.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#customizations"><strong>Customizations Made</strong></a> ·
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#environment-setup"><strong>Environment Setup</strong></a>
</p>
<br/>

## About This Template

This is my personal starter template based on Vercel's AI Chatbot, customized for my development workflow. It includes all the essential features needed to build production-ready AI chatbot applications quickly.

## Features

- **[Next.js](https://nextjs.org) App Router**
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering
- **[AI SDK](https://sdk.vercel.ai/docs)**
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - **Pre-configured for OpenAI GPT-4 Turbo**
- **[shadcn/ui](https://ui.shadcn.com)**
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility
- **Data Persistence**
  - PostgreSQL for saving chat history and user data
  - Vercel Blob for efficient file storage
  - Redis for caching and session management
- **[Auth.js](https://authjs.dev)**
  - Simple and secure authentication

## Customizations Made

This template includes the following customizations from the original:

1. **OpenAI Integration**: Switched from xAI to OpenAI GPT-4 Turbo
2. **Fixed Hydration Issues**: Resolved markdown rendering hydration errors
3. **Cleaned Dependencies**: Added `@ai-sdk/openai` package

## Quick Start

1. **Clone this template**

   ```bash
   git clone <your-repo-url>
   cd <your-project-name>
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your API keys and database URLs (see Environment Setup below)

4. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

Your app will be running on [localhost:3000](http://localhost:3000).

## Environment Setup

You'll need the following environment variables in your `.env.local`:

```bash
# Generate a random secret: https://generate-secret.vercel.app/32
AUTH_SECRET=your_auth_secret_here

# Get your OpenAI API Key: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_openai_key_here

# PostgreSQL Database URL
POSTGRES_URL=your_postgres_connection_string

# Vercel Blob Storage (optional, for file uploads)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Redis URL (optional, for caching)
REDIS_URL=your_redis_url_here
```

### Database Options

- **Supabase**: Free PostgreSQL hosting
- **Neon**: Serverless PostgreSQL
- **Vercel Postgres**: Integrated PostgreSQL
- **Local PostgreSQL**: For development

### Redis Options

- **Upstash**: Serverless Redis
- **Redis Cloud**: Managed Redis
- **Local Redis**: For development

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm lint` - Run linting

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI**: OpenAI GPT-4 Turbo via AI SDK
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Auth.js (NextAuth.js)
- **Storage**: Vercel Blob
- **Caching**: Redis
- **Package Manager**: pnpm

## Notes

- This template is pre-configured for OpenAI. To use other providers, modify `lib/ai/providers.ts`
- Database migrations are automatically run during build
- The template includes authentication, file uploads, and chat history
- All UI components are from shadcn/ui for consistency

---

_Based on [Vercel's AI Chatbot](https://github.com/vercel/ai-chatbot) with personal customizations._
