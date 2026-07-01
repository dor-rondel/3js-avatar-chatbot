---
name: ci-and-push
description: Use this skill when the user asks to run local CI verification checks (format, lint, typecheck, unit tests), commit changes, or push to GitHub.
---

# Local CI Verification & Git Push Workflow

This skill hooks directly into the project's verification scripts to guarantee zero breaking changes are committed or pushed to GitHub.

## 🛠️ Environment Constraints

- **Package Manager:** `pnpm` (Engines: `>=9.0.0`)
- **Node Version:** `>=20.0.0`
- **Operating System:** Linux / POSIX

## 🏃‍♂️ Step 1: Local CI Verification

Execute these checks in order. **Stop immediately if any step throws an error or fails.**

| Step | Task                  | Command          | Target / Standard                         |
| :--- | :-------------------- | :--------------- | :---------------------------------------- |
| 1    | **Code Formatting**   | `pnpm format`    | Rewrites files matching Prettier rules    |
| 2    | **Linting Check**     | `pnpm lint`      | ESLint verification (`--max-warnings=0`)  |
| 3    | **Type Safety Check** | `pnpm typecheck` | Run `tsc --noEmit` to validate TypeScript |
| 4    | **Unit Tests**        | `pnpm test:unit` | Run Vitest suite natively                 |

---

## 🔀 Step 2: Git Workflow Execution

Only proceed to this step if all 4 operations above pass successfully with code `0`.

1.  **Stage Verified Code:**
    ```bash
    git add .
    ```
2.  **Review Diff**
    - Read and analyze this diff output carefully. Identify the exact modules, files, or logic changed to write an accurate, technical summary. Check the diff to make sure there are no unintended changes.
    ```bash
    git diff --cached
    ```
3.  **Commit with Context:**
    - Craft a concise, descriptive imperative commit message matching the task context.
    ```bash
    git commit -m "<descriptive-message>"
    ```
4.  **Push to Remote:**
    ```bash
    git push origin HEAD
    ```
