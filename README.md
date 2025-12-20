# 3D Avatar Chatbot

## Overview

A Harry Potter–themed conversational agent that renders a fully animated 3D avatar in the browser using React Three Fiber. Users submit a prompt once per turn, the backend streams responses over Server-Sent Events (SSE), and the avatar mirrors the assistant’s sentiment with facial expressions, FBX animations, and HeadTTS-generated audio. The experience targets a single user at a time, emphasizing cinematic presentation, observability, and professional engineering practices.

## Features

- Cinematic 3D avatar with zoom controls, sentiment-driven facial blends, and FBX idle/talking loops.
- LangChain pipeline that calls Gemini for structured outputs (text, sentiment, viseme hints) with short-lived memory.
- Guardrail layer that sanitizes prompts and blocks common prompt-injection attempts before invoking Gemini.
- HeadTTS Next.js route handler that returns synchronized viseme timelines and audio clips.
- SSE chat endpoint so the frontend receives streaming tokens plus animation cues.
- LangSmith tracing wired through Docker for end-to-end observability.
- Built-in loading states, SEO-ready layout, and Vitest coverage.

## Tech Stack

- **Framework**: Next.js 16 (App Router, full-stack)
- **Language**: TypeScript (strict)
- **3D Rendering**: React Three Fiber + Drei
- **LLM Orchestration**: LangChain w/ Gemini API, Prompts, and Memory
- **Speech & Visemes**: HeadTTS via Next.js route handler
- **Styling**: Tailwind CSS + custom Hogwarts-inspired design tokens
- **Testing**: Vitest + React Testing Library
- **Observability**: LangSmith tracing
- **Containerization**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js >= 20.x
- pnpm
- Gemini API key
- LangSmith API key + project
- (Optional) Access to a HeadTTS instance or Docker image

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/3js-avatar-chatbot.git
   ```
2. Change into the project directory:
   ```bash
   cd 3js-avatar-chatbot
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
5. Populate secrets in `.env.local` (example):
   ```
   GEMINI_API_KEY=your-gemini-key
   GEMINI_MODEL=gemini-2.5-flash
   LANGSMITH_API_KEY=your-langsmith-key
   LANGSMITH_ENDPOINT=https://api.langsmith.com
   LANGSMITH_PROJECT=harry-potter-3d-chatbot
   LANGCHAIN_TRACING_V2=true
   HEADTTS_BASE_URL=http://localhost:8000
   HEADTTS_VOICE_ID=holo-hp
   NEXT_PUBLIC_SSE_ENDPOINT=/api/chat
   NEXT_PUBLIC_LOADING_DELAY_MS=350
   ```

### Running the Development Server

```bash
pnpm dev
```

Open http://localhost:3000 to access the chat UI. Each prompt triggers an SSE stream; keep the tab open until the avatar completes its response.

### Chat API (work in progress)

- `POST /api/chat`
  - Request body: `{ "message": string }`
  - Response body (temporary non-SSE): `{ "reply": string }`
  - The handler sanitizes user input with prompt-injection heuristics, records LangSmith traces under the fixed `harry-potter-3d-chatbot` project, and fans out to the Gemini model configured via `GEMINI_MODEL` (defaults to Flash 2.5).
  - Future updates will upgrade this endpoint to Server-Sent Events and integrate memory plus HeadTTS cues.

## Available Scripts

- `pnpm dev`: Start the local Next.js server with hot reloading.
- `pnpm build`: Create an optimized production build.
- `pnpm start`: Serve the production build.
- `pnpm lint`: Run ESLint.
- `pnpm typecheck`: Run TypeScript in build mode.
- `pnpm test:unit`: Execute Vitest unit tests.
- `pnpm format`: Format files with Prettier.
- `pnpm format:check`: Verify formatting (used in CI).

For a full project playbook (Docker, SSE expectations, testing standards), see .gemini/GEMINI.md.
