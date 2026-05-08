# 🤖 AGENTS.md - PARDPLOY Development Protocol

This document defines the golden rules and technical standards for any AI agent or developer working on the **Pardploy** repository.

## 1. Project Context
* **Mission:** High-performance, lightweight alternative to Coolify/Dockploy for Docker management.
* **Philosophy:** "Performance First." Rust backend, React 19 frontend. Minimal dependencies.

## 2. Language & Communication Protocol
* **Interaction:** The user (Felipe) is a Spanish speaker.
    * **Respond in the language used by the user:** If the prompt is in Spanish, reply in Spanish. If it is in English, reply in English.
* **Codebase:** All code (variables, functions, classes, file names) **MUST** be in **English**.
* **Documentation:** Comments within the code must be descriptive and written in **English**.
* **Commit Messages:** Must follow [Conventional Commits](https://www.conventionalcommits.org/) in **English**.

## 3. Technical Stack Rules

### Backend (Rust + Axum)
* **Pattern:** Follow the `Routes -> Handlers -> Models -> DB` architecture.
* **Async:** Use `Tokio` for all asynchronous tasks.
* **Error Handling:** Use a custom `AppError` enum for consistent HTTP responses. **Strictly avoid** `.unwrap()` or `.expect()` in production code; handle results explicitly.
* **Database:** SQLx with SQLite. Migrations must reside in `backend/migrations`.

### Frontend (React 19 + Bun)
* **State Management:** Use **TanStack Query** for server-side state. Avoid unnecessary `useEffect` hooks for data fetching.
* **Components:** Use **shadcn/ui** located in `shared/`. Keep components atomic and modular.
* **Typing:** Strict TypeScript. The use of `any` is forbidden.

## 4. Style & Conventions
* **Naming Conventions:**
    * **Rust:** `snake_case` for functions/variables, `PascalCase` for Structs/Enums.
    * **React:** `kebab-case` for file names, `PascalCase` for component names.
* **Descriptive Comments:** Every complex logic block must have a concise comment in English explaining the "why" rather than just the "what."

## 5. Testing Standards

### Backend (Rust)
* **Framework:** Built-in `cargo test`
* **Location:** Tests colocated with source files (`#[cfg(test)]` modules) or in `tests/` directory
* **Coverage:** All handlers and business logic must have unit tests

### Frontend (React 19)
* **Unit/Component Tests:** Vitest + React Testing Library
* **Location:** Co-located with components or in `__tests__/` directories
* **E2E Tests:** Playwright
* **Location:** `ui/web/e2e/` for E2E tests
* **Coverage:** Critical user flows (auth, navigation) must have E2E tests

## 7. Security Standards

### Backend (Rust)
- **Input Validation:** Use libraries like `validator` or `serde` to validate all incoming data. Never trust user input directly.
- **SQL Injection:** Use parameterized queries via SQLx. Never concatenate strings into SQL queries.
- **Rate Limiting:** Implement rate limiting on public endpoints to prevent abuse.
- **Security Headers:** Use `tower-http` middleware for CORS, CSP, HSTS, and other security headers.
- **Secrets:** Never hardcode secrets. Use environment variables and `.env` files (already in `.gitignore`).

### Frontend (React 19)
- **XSS Prevention:** Never use `dangerouslySetInnerHTML` unless absolutely necessary. Sanitize any user-generated content.
- **API Keys:** Never expose API keys or sensitive data in client-side code.
- **Authentication:** Store tokens securely (httpOnly cookies preferred over localStorage).

### General
- **Dependencies:** Regularly audit dependencies (`cargo audit`, `npm audit`) for vulnerabilities.
- **Logging:** Log security events (failed auth attempts, suspicious requests) but never log sensitive data (passwords, tokens).

## 8. Directory Structure
```text
/backend
  ├── src/
  │    ├── handlers/   # Endpoint logic
  │    ├── models/     # DB schemas & Structs
  │    └── routes/     # Axum Router definitions
/ui/web
  ├── src/
  │    ├── app/        # Routes & pages
  │    ├── modules/    # Feature-based logic (Auth, Containers, etc.)
  │    └── shared/     # Reusable UI components (shadcn)
      ├── ui/          # shadcn components
      ├── providers/   # Context providers
      └── guards/      # Route guards
