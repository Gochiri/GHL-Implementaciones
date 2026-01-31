# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**AI & Language Models:**
- OpenAI GPT API - LLM backbone for all AI analysis and content generation
  - SDK/Client: openai package ^6.16.0
  - Auth: `OPENAI_API_KEY` environment variable
  - Endpoint: https://api.openai.com/v1/chat/completions
  - Supported Models: gpt-5.2, gpt-5, gpt-4.5-turbo, gpt-4-turbo, gpt-4
  - Usage: Transcript analysis, Hormozi-style questioning, project structure generation, quotation generation, documentation generation
  - Configuration: `backend/services/ai-analyzer.js` defines system prompts and model selection

**Project Management:**
- ClickUp API v2 - Task and project management platform integration
  - SDK/Client: axios for HTTP requests (no official SDK)
  - Auth: `CLICKUP_API_TOKEN` header authorization
  - Base URL: https://api.clickup.com/api/v2
  - Auth: `CLICKUP_SPACE_ID` required for project creation
  - Endpoints Used:
    - `POST /space/{spaceId}/folder` - Create client folders
    - `POST /folder/{folderId}/list` - Create project lists/phases
    - `POST /list/{listId}/task` - Create tasks from project structure
    - `PUT /task/{taskId}/status` - Update task status
    - `GET /user` - Connection test and verification
    - `GET /team` - Retrieve teams for space discovery
  - Implementation: `backend/services/clickup-service.js`

**GHL (Go High Level) Integration:**
- GHL Webhook Receiver - Listens for incoming webhooks from GHL platform
  - Endpoint: `POST /api/webhook/ghl` in `backend/server.js`
  - Payload: Expects contact information, pipeline_stage, and messages
  - Storage: In-memory webhook storage (up to 50 recent webhooks)
  - Use case: Receiving lead/contact updates from GHL pipeline

## Data Storage

**Databases:**
- Not detected - No traditional database is configured

**File Storage:**
- Memory-based storage via Multer - Uploaded files stored in server memory during request
  - Configuration: 10MB maximum file size limit
  - Location: `backend/server.js` lines 20-24
  - Formats supported: PDF, DOCX/DOC, plain text files

**Caching:**
- In-memory webhook cache - GHL webhooks stored in memory (up to 50 most recent)
  - Location: `backend/server.js` lines 183-218

## Authentication & Identity

**Auth Provider:**
- Not detected - No user authentication system implemented
- API key-based authorization for external services only:
  - OpenAI API key validation in `backend/services/ai-analyzer.js`
  - ClickUp API token validation in `backend/services/clickup-service.js`
- No login/logout mechanism or user accounts

## Monitoring & Observability

**Error Tracking:**
- Not detected - No third-party error tracking service integrated

**Logs:**
- Console logging approach via `console.log()` and `console.error()`
- Logs output to server console
- Key log points:
  - Server startup: `backend/server.js` line 308
  - File extraction: `backend/services/file-service.js`
  - API integration attempts: Throughout `server.js`
  - Project creation progress: `backend/services/clickup-service.js`

## CI/CD & Deployment

**Hosting:**
- Not detected - No CI/CD pipeline or deployment configuration found

**Development Environment:**
- Backend: Node.js watch mode via `npm run dev` → `node --watch server.js`
- Frontend: Vite dev server via `npm run dev` → `vite`

## Environment Configuration

**Required Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API key (critical for AI features)
- `CLICKUP_API_TOKEN` - ClickUp API token (required for project export)
- `CLICKUP_SPACE_ID` - ClickUp workspace space ID (required for project export)

**Optional Environment Variables:**
- `OPENAI_MODEL` - Model selection (defaults to gpt-5.2)
- `PORT` - Backend server port (defaults to 3001)

**Secrets Location:**
- `.env` file in `backend/` directory
- Reference template: `backend/.env.example`
- Environment variables passed to frontend via `VITE_API_URL` (Vite env variable)

## Webhooks & Callbacks

**Incoming Webhooks:**
- `POST /api/webhook/ghl` - GHL platform sends contact/lead updates
  - Payload format: JSON with contact, pipeline_stage, message fields
  - Response: JSON with success status and webhook ID
  - Storage: Cached in-memory for recent audit/inspection

**Outgoing Webhooks:**
- Not detected - No outbound webhook delivery mechanism

**Callback Endpoints:**
- Frontend communicates with backend via REST API only (no callbacks required)
- ClickUp integration is request-response based (no webhooks from ClickUp)

## API Documentation

**Backend REST API Endpoints:**
- Health check: `GET /api/health`
- File upload: `POST /api/upload` (multipart/form-data)
- Transcript analysis: `POST /api/analyze`
- Hormozi questioning: `POST /api/hormozi`
- Project structure generation: `POST /api/project-structure`
- Quotation generation: `POST /api/quotation`
- Project approval & export: `POST /api/project/approve`
- ClickUp project creation: `POST /api/clickup/create`
- Task status update: `PUT /api/clickup/task/{id}/status`
- GHL webhook receiver: `POST /api/webhook/ghl`
- Recent webhooks list: `GET /api/webhooks`
- OpenAI connection test: `POST /api/openai/test`
- ClickUp connection test: `POST /api/clickup/test`
- ClickUp spaces discovery: `GET /api/clickup/spaces`
- Configuration status: `GET /api/config/status`

**Frontend API Wrapper:**
- Location: `frontend/src/api.js`
- Base URL configuration: `API_BASE_URL` (from `VITE_API_URL` env or localhost:3001)
- All backend endpoints wrapped in `api` object methods

---

*Integration audit: 2026-01-31*
