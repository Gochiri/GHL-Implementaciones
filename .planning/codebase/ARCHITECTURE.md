# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Multi-tier client-server architecture with clear separation of concerns between frontend presentation layer, backend API layer, and external service integrations.

**Key Characteristics:**
- REST API-based communication between frontend and backend
- Monolithic backend with service-based organization
- Local storage for client-side state persistence
- Integration with external APIs (OpenAI, ClickUp, GHL)
- File upload and processing pipeline

## Layers

**Frontend (Presentation Layer):**
- Purpose: User interface for GHL project analysis and management workflows
- Location: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend`
- Contains: Vue 3 single-file components, routing, API client, utilities
- Depends on: Backend API endpoints via `api.js`
- Used by: End users (GHL implementation consultants)

**Backend (API Layer):**
- Purpose: Core business logic, AI analysis, external service orchestration
- Location: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend`
- Contains: Express.js server, service modules, route handlers, file processing
- Depends on: OpenAI API, ClickUp API, external file parsing libraries
- Used by: Frontend application via REST endpoints

**Service Layer (Business Logic):**
- Purpose: Encapsulate domain-specific operations
- Location: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\services`
- Contains: AI analysis, ClickUp integration, file extraction
- Depends on: External APIs and libraries
- Used by: Server route handlers

## Data Flow

**Project Analysis Workflow:**

1. User uploads transcript/document → Frontend
2. Frontend calls `/api/upload` with file → Backend
3. File Service extracts text using `pdf-parse` or `mammoth` → Text content
4. User triggers analysis → Frontend calls `/api/analyze`
5. AI Analyzer processes text with OpenAI → Analysis object (pain points, client data, complexity)
6. Frontend displays analysis and shows architect questions
7. User answers architectural questions → Frontend calls `/api/hormozi`
8. AI Architect generates follow-up questions or provides structure → Response
9. When ready, frontend calls `/api/project-structure` → Project blueprint
10. Frontend navigates to quotation → `/api/quotation` returns pricing
11. User approves project → `/api/project/approve` triggers documentation generation and ClickUp export
12. Backend creates folder, lists, and tasks in ClickUp → ClickUp workspace updated

**State Management:**

- Frontend state: Managed in Vue components using `ref()` and stored in `localStorage`
- Projects stored in `localStorage` under key `projects` as JSON array
- Last active project ID stored in `localStorage` under key `last-project-id`
- Backend state: Ephemeral (GHL webhooks stored in memory array, max 50 items)
- No persistent database layer

## Key Abstractions

**API Client (`frontend/src/api.js`):**
- Purpose: Centralized HTTP client for all backend communication
- Examples: `api.analyze()`, `api.uploadFile()`, `api.projectStructure()`, `api.approveProject()`
- Pattern: Fetch-based wrapper functions with error handling and JSON serialization

**File Service (`backend/services/file-service.js`):**
- Purpose: Handle extraction of text from various file formats
- Examples: PDF parsing with `pdf-parse`, Word documents with `mammoth`, plain text
- Pattern: Mimetype detection → appropriate library selection → text extraction

**AI Analyzer (`backend/services/ai-analyzer.js`):**
- Purpose: Chat-based project understanding and specification generation using OpenAI
- Examples: `analyzeTranscript()`, `askHormoziQuestion()`, `generateProjectStructure()`, `generateGHLDocumentation()`
- Pattern: System prompts guide AI behavior; conversations tracked; structured JSON responses

**ClickUp Service (`backend/services/clickup-service.js`):**
- Purpose: Orchestrate ClickUp project creation with hierarchical structure
- Examples: `createClickUpProject()` creates folder → lists (weeks) → tasks
- Pattern: Sequential API calls with error handling (folder name collision detection)

**Project Status Utility (`frontend/src/utils/status-utils.js`):**
- Purpose: Manage and validate project lifecycle states
- Examples: PROJECT_STATUSES enum, `healProjectStatus()` for status migration
- Pattern: Status-based utility functions with color/label mapping

## Entry Points

**Backend Server (`backend/server.js`):**
- Location: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\server.js`
- Triggers: `npm run dev` or `node server.js`
- Responsibilities: Initialize Express app, setup CORS, multer, dotenv; define all route handlers; listen on PORT (default 3001)

**Frontend App (`frontend/src/main.js`):**
- Location: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\main.js`
- Triggers: `npm run dev` or `npm run build`
- Responsibilities: Initialize Vue 3 app, setup Vue Router, mount application to DOM element

**Frontend Router:**
- Location: `frontend/src/main.js` (routes definition) and `frontend/src/App.vue` (layout)
- Routes: `/` (Dashboard), `/kanban`, `/analyzer`, `/projects`, `/project/:id`, `/proposal/:id`, `/settings`

## Error Handling

**Strategy:** Try-catch in async handlers with descriptive error messages returned to client

**Patterns:**
- Backend: HTTP status codes (400, 500) with JSON error object `{ error: "message" }`
- Frontend: Try-catch in async functions with error alerts or console logging
- API fallbacks: ClickUp config uses env vars as fallback if request params contain placeholders or empty values
- File extraction: Mimetype validation; specific error messages for unsupported formats

## Cross-Cutting Concerns

**Logging:** Console-based logging with emoji prefixes for visual organization
- Backend: `console.log()` with status indicators (`🚀`, `📦`, `❌`, etc.)
- Frontend: `console.log()` and `console.error()` for debugging

**Validation:** Input validation at endpoint level
- Transcript required for analysis endpoint
- File existence checked before processing
- ClickUp config token/space validation

**Authentication:** API key-based via environment variables or request body
- OpenAI: `OPENAI_API_KEY` env var
- ClickUp: `CLICKUP_API_TOKEN` env var
- Request body can override env vars (with placeholder detection)

**CORS:** Enabled globally via `cors()` middleware on backend

---

*Architecture analysis: 2026-01-31*
