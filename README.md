# 3D Avatar Chatbot

## Overview

A Harry Potter–themed conversational agent that renders a fully animated 3D avatar in the browser using React Three Fiber. Users submit a prompt once per turn, the backend returns a single JSON payload for that turn, and the avatar mirrors the assistant’s sentiment with facial expressions, FBX animations, and ElevenLabs streaming audio whose visemes are derived in-browser via the wawa-lipsync Web Audio pipeline. The experience targets a single user at a time, emphasizing cinematic presentation, observability, and professional engineering practices.

## Features

- Cinematic 3D avatar with zoom controls, sentiment-driven facial blends, and FBX idle/talking loops.
- LangChain pipeline that calls Gemini for structured outputs (text, sentiment, viseme hints) with short-lived memory.
- Guardrail layer that sanitizes prompts and blocks common prompt-injection attempts before invoking Gemini.
- ElevenLabs streaming route handler plus a client-side [wawa-lipsync](https://github.com/wass08/wawa-lipsync) harness that taps a browser `AnalyserNode` for real-time viseme cues.
- Low-latency chat endpoint that returns the full assistant turn plus a base64 ElevenLabs audio payload for each POST, allowing the browser to kick off playback and wawa-lipsync without SSE token streams.
- LangSmith tracing wired through Docker for end-to-end observability.
- Built-in loading states, SEO-ready layout, and Vitest coverage.

## Tech Stack

- **Framework**: Next.js 16 (App Router, full-stack)
- **Language**: TypeScript (strict)
- **3D Rendering**: React Three Fiber + Drei
- **LLM Orchestration**: LangChain w/ Gemini API, Prompts, and Memory
- **Speech & Visemes**: ElevenLabs API + browser-based wawa-lipsync
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
- ElevenLabs API key plus a configured voice profile (Realtime or streaming HTTP)
- Browser support for Web Audio (`AnalyserNode`) so wawa-lipsync can derive visemes client-side

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
   LANGSMITH_ENDPOINT=https://api.smith.langchain.com
   LANGSMITH_CALLBACKS_BACKGROUND=true
   LANGSMITH_PROJECT=harry-potter-3d-chatbot
   LANGCHAIN_TRACING_V2=true
   ELEVENLABS_API_KEY=your-elevenlabs-key
   ELEVENLABS_VOICE_ID=hermione-realism
   ELEVENLABS_MODEL_ID=eleven_monolingual_v1
   NEXT_PUBLIC_SSE_ENDPOINT=/api/chat
   NEXT_PUBLIC_LOADING_DELAY_MS=350
   ```

   When LangSmith tracing is enabled, `LANGSMITH_CALLBACKS_BACKGROUND=true` lets LangChain flush telemetry asynchronously so local runs do not block or warn about foreground callbacks.

### Running the Development Server

```bash
pnpm dev
```

Open http://localhost:3000 to access the chat UI. Each prompt triggers a single POST, the server responds once with the full assistant turn, and the payload already includes the synthesized ElevenLabs audio (base64 + MIME type) so the browser can start playback immediately.

## Docker

Build a production image and run it the same way you would on a server:

```bash
docker build -t 3d-avatar-chatbot .
docker run --rm -p 3000:3000 --env-file .env.local 3d-avatar-chatbot
```

For iterative work, rely on the included Compose file (uses `.env.local` automatically):

```bash
docker compose up --build
```

Once the container is healthy, visit http://localhost:3000. Stop the stack with `docker compose down`.

## Publishing to GHCR

This repo ships a `docker-publish` GitHub Action that builds the Dockerfile and pushes tags to `ghcr.io`. It runs automatically on every push to `main`, and you can trigger it manually via *Run workflow* in the Actions tab. The workflow:

1. Logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` (already granted `packages: write`).
2. Derives the image name `ghcr.io/<owner>/<repo>` in lowercase.
3. Builds the Next.js production image with Buildx and pushes tags such as `sha-<short>` and `latest`.

To publish the image yourself from a local machine:

```bash
# 1. Authenticate
echo $GHCR_PAT | docker login ghcr.io -u <github-username> --password-stdin

# 2. Build the production image
IMAGE=ghcr.io/<github-username>/3js-avatar-chatbot:$(git rev-parse --short HEAD)
docker build -t "$IMAGE" .

# 3. Push it to the registry
docker push "$IMAGE"
```

Use a classic personal access token with the `write:packages` scope (`GHCR_PAT` above) or reuse the same token the CI job uses. Any consumer (local machine, container platform, Railway) can then pull the image with:

```bash
docker pull ghcr.io/<github-username>/3js-avatar-chatbot:latest
```

## Available Scripts

- `pnpm dev`: Start the local Next.js server with hot reloading.
- `pnpm build`: Create an optimized production build.
- `pnpm start`: Serve the production build.
- `pnpm lint`: Run ESLint.
- `pnpm typecheck`: Run TypeScript in build mode.
- `pnpm test:unit`: Execute Vitest unit tests.
- `pnpm format`: Format files with Prettier.
- `pnpm format:check`: Verify formatting (used in CI).

For a full project playbook (Docker, chat/voice expectations, testing standards), see .gemini/GEMINI.md.
