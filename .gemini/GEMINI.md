# 3D Avatar Chatbot · GeminiCLI Guide

## 0. System Prompt

- Operate as a **principal engineer** intent on shipping an industry-grade chatbot: prioritize maintainability, architecture, readability, documentation, and exhaustive tests.
- Enforce high standards (strict linting, CI parity, clean Git history, small PRs) and raise questions when requirements are ambiguous.
- Keep focus on local workflows while ensuring decisions are compatible with a future Railway Node runtime.

---

## 1. Responsibilities & Flow

- Serve a single-user chat experience: frontend issues one POST request, server responds via Server-Sent Events (SSE) until completion.
- Use LangChain to call the Gemini API with structured output (`text`, `sentiment`, `visemeHints`).
- Enforce guardrails: sanitize every inbound prompt and reject common prompt-injection attempts before invoking LangChain/Gemini.
- Maintain a **summary memory** object: after each user→assistant turn, rebuild a concise conversation summary (up to 10 sentences) and store it for the next prompt. This replaces full transcript storage and must be regenerated every cycle.
- Map Gemini sentiment to avatar facial expressions and FBX animation clips rendered with React Three Fiber/Drei.
- Generate audio + visemes through a dedicated Next.js **route handler** (`/api/headtts/route.ts`) that proxies to HeadTTS; sync playback with the avatar on the client.
- Capture LangChain traces with LangSmith even when the app runs inside Docker.
- Ensure obvious loading states in the UI (chat input disabled, spinner overlay on the avatar) while awaiting SSE or HeadTTS output.
- Maintain `app/layout.tsx` with SEO metadata (title, description, Open Graph) because this project is part of a public portfolio.

---

## 2. Planned Repository Layout

```
/app                         # Next.js 16 App Router code
  /page.tsx                  # Chat UI + 3D scene shell
  /layout.tsx                # SEO metadata + shared providers
  /api/chat/route.ts         # SSE chat endpoint (LangChain + Gemini)
  /api/headtts/route.ts      # HeadTTS proxy handler (audio + visemes)
  /lib/langchain/            # Prompt templates, memory helpers
  /lib/langchain/memory/     # In-memory summary cache per session
  /components/scene/         # React Three Fiber scene + controls
  /components/chat/          # Message list, controls, HUD
  /globals.css               # Global styles/theme tokens
/public
  /assets/avatar/            # FBX meshes, textures, morph targets
.gemini/GEMINI.md            # This file
.env.example                 # Template for local secrets
.prettierrc                  # Formatting contract
package.json                 # pnpm scripts consumed locally + CI
pnpm-lock.yaml               # Locked dependency graph
.github/workflows/ci.yml     # Pull-request checks running pnpm commands
```

_If a folder is missing today, assume it will exist once implementation begins. Avoid referencing files outside this structure._

---

## 3. Prerequisites

1. **Node.js 20+** and **pnpm** installed on the host machine.
2. **Docker Desktop** (or Docker Engine) running locally with access to `docker compose`.
3. Valid **Gemini** and **LangSmith** API keys plus project names.
4. Access to the HeadTTS Docker image and any required voice models.
5. `.env.local` (or `.env`) created from `.env.local.example` before running any scripts.

### Environment Variables (sample keys only)

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
LANGSMITH_ENDPOINT=https://api.langsmith.com
LANGCHAIN_TRACING_V2=true
HEADTTS_BASE_URL=http://headtts:8000
HEADTTS_VOICE_ID=holo-hp
NEXT_PUBLIC_SSE_ENDPOINT=/api/chat
NEXT_PUBLIC_LOADING_DELAY_MS=350
```

_Add more entries (e.g., asset CDN URLs) as the project evolves._

---

## 4. Setup Workflow

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Verify linting & types** (once scripts exist)
   ```bash
   pnpm lint
   pnpm typecheck
   ```
3. **Run unit tests**
   ```bash
   pnpm test:unit    # Vitest
   ```
4. **Prepare assets**
   - Place FBX meshes, textures, and morph targets under `public/assets/avatar/`.
   - Store reusable animation metadata inside feature-level directories (e.g., `app/(chat)/__mocks__/animations.test-data.ts`).
5. **Formatting contract**
   ```bash
   pnpm format        # Applies prettier rules (.prettierrc)
   pnpm format:check  # Used locally + CI to fail on drift
   ```

---

## 5. Running Locally (Docker-first)

1. **Start services**

   ```bash
   docker compose up -d
   ```

   - Compose should bring up the Next.js app server and the HeadTTS container.
   - Ensure the Next.js service loads environment variables defined above.

2. **Tail logs when needed**
   ```bash
   docker compose logs -f app
   docker compose logs -f headtts
   ```
3. **Access the UI**
   - Default URL: `http://localhost:3000` (adjust if compose uses another port).
   - Opening the chat view auto-initiates a single POST request; all assistant tokens stream back via SSE until completion.
   - UI must show explicit loading indicators until the first SSE chunk and while HeadTTS audio is synthesizing.
4. **LangSmith verification**
   - With `LANGCHAIN_TRACING_V2=true`, every chat invocation should appear inside the configured `LANGSMITH_PROJECT`.
   - If traces do not appear, confirm the variables are part of the Next.js container environment (either via `.env` bind mount or compose `env_file`).

### Running without Docker (optional dev loop)

```bash
pnpm dev
```

- Requires a separately running HeadTTS instance (local or remote). Update `HEADTTS_BASE_URL` accordingly.
- Keep LangSmith env vars in the shell so tracing still works.
- Maintain Node 20 compatibility (`engines.node >=20`) to match Railway's default runtime.

---

## 6. Chat & SSE Expectations

- Endpoint: `POST /api/chat`
- Request payload: { message, emotionOverride? }
- Response: SSE stream (`text/event-stream`) containing tokens plus structured JSON events (sentiment, animation cues, head pose).
- The frontend **never** sends follow-up messages over the same connection; instead, it opens a new POST for each user prompt.
- `/api/headtts/route.ts` accepts `{ text, voiceId }`, queues TTS generation, and returns JSON containing an audio URL plus viseme timeline; the chat pipeline invokes this after receiving each Gemini turn.
- LangChain pipeline must:
  1.  Feed Gemini both the latest user message and the current summary memory string.
  2.  Parse Gemini's structured response to get the new assistant text and metadata.
  3.  Generate a **fresh summary** by combining the previous summary + latest exchange (use LangChain `ConversationSummaryMemory` or equivalent custom chain).
  4.  Persist only that summary (no transcript history) for the next cycle.

---

## 7. Testing & Quality Gates

- **Unit tests**: `pnpm test:unit` (Vitest + React Testing Library) must pass before merging.
- **Lint/type**: `pnpm lint`, `pnpm typecheck`.
- **Prettier**: `pnpm format:check` must pass; run `pnpm format` to fix.
- **3D scene validation**: run storybook-like harness (future `pnpm storybook` script) to preview avatar animations per sentiment bucket.
- **GitHub Actions CI** (see `.github/workflows/ci.yml`) executes `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm format:check` for every PR.
- Keep pull requests small and focused on one concern (scene, pipeline, TTS, etc.).

---

## 8. File Organization

- Group code by **feature** (chat, avatar, audio) instead of file type; colocate UI, hooks, and tests where possible.
- Co-locate unit tests with the component or module using the `.test.ts` suffix.
- Keep Server Actions minimal and focused; prefer route handlers for API edges.
- Clearly separate UI components from business logic (e.g., presentational vs data hooks).
- Enforce Prettier for every file according to `.prettierrc`.

### Code Formatting Rules

- Honor `.prettierrc` strictly.
- Maximum line length: **80 characters**.
- Use **single quotes** for JS/TS/JSX strings.
- Always include **semicolons**.
- Require **ES5-compatible trailing commas**.
- Indent with **2 spaces** (no tabs).

### Clean Code Expectations

- Respect SOC, DRY, KISS, and YAGNI to keep the codebase lean.
- Document complex logic with concise JSDoc (DYC) and leverage descriptive naming.
- Use early returns to reduce nesting.
- Validate and sanitize all user or external input.
- Stay in TypeScript strict mode; avoid `any` and unused variables/imports.

---

## 9. Implementation Approach

1. Identify the core problem for each task.
2. Choose the simplest solution that satisfies requirements.
3. Implement incrementally with small, reviewable steps.
4. Test early and often (unit tests, manual SSE checks, avatar preview).

Avoid overthinking:

- Start with basic implementations before optimizing.
- Favor composition over heavy abstractions.
- Reuse proven ecosystem patterns when possible.

---

## 10. Unit Testing Guidelines (Vitest)

- Never rely on `// @ts-expect-error`; TypeScript already enforces types.
- Use strict assertions (`toStrictEqual`, `toBe(true)`, `toHaveBeenCalledExactlyOnceWith`).
- Prefer `vi.mock()` over `vi.doMock()`; use `vi.mocked()` for type-safe chaining.
- Stub env vars with `vi.stubEnv()` and globals with `vi.stubGlobal()`.
- Reference the original function name in `expect()` unless inspecting mock metadata.
- Let the global Vitest config clean up mocks—avoid manual `vi.clear/reset/restore` calls.

---

## 8. Troubleshooting

| Symptom                    | Checks                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| No SSE stream starts       | Confirm `Accept: text/event-stream` on requests, ensure Next.js route is running, inspect `docker compose logs -f app`.                               |
| Avatar idle / no animation | Validate structured output contains `sentiment` tag, inspect `packages/avatar-animator` mapping, ensure FBX clips load under `public/assets/avatar/`. |
| No audio output            | Check HeadTTS container health, verify `HEADTTS_BASE_URL`, inspect REST call responses emitted by LangChain runnable.                                 |
| Missing LangSmith traces   | Make sure env vars exist inside container, `LANGCHAIN_TRACING_V2=true`, and outbound HTTPS access is allowed.                                         |

---

## 9. Shutdown & Cleanup

```bash
docker compose down
```

- Remove dangling volumes only if necessary (`docker compose down -v`).
- To reset node_modules, run `pnpm store prune` followed by `rm -rf node_modules` (rarely needed).

---

By following these steps, GeminiCLI can confidently run and observe the local chatbot stack, keeping the workflow professional and aligned with the small, incremental PR strategy.
