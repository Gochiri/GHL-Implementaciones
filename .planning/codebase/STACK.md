# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- JavaScript (ES6+) - Frontend and backend implementation
- HTML - UI markup in Vue single-file components
- CSS - Styling within Vue components

**Secondary:**
- JSON - Configuration and data interchange

## Runtime

**Environment:**
- Node.js (version not pinned - using latest minor version)

**Package Manager:**
- npm (detected via package-lock.json)
- Lockfile: Present in both `backend/package-lock.json` and `frontend/package-lock.json`

## Frameworks

**Core:**
- Express.js ^5.2.1 - Backend HTTP server and REST API routing
- Vue 3 ^3.5.24 - Frontend UI framework
- Vue Router ^4.6.4 - Frontend client-side routing

**Build/Dev:**
- Vite ^7.2.4 - Frontend build tool and dev server
- @vitejs/plugin-vue ^6.0.1 - Vite plugin for Vue 3 SFC support

## Key Dependencies

**Critical:**
- openai ^6.16.0 - OpenAI API client for GPT model access (LLM backbone)
- axios ^1.13.2 - HTTP client used in both frontend and backend
- multer ^2.0.2 - Express middleware for file upload handling

**Document Processing:**
- pdf-parse ^2.4.5 - PDF text extraction
- mammoth ^1.11.0 - DOCX/Word file text extraction

**Infrastructure:**
- cors ^2.8.6 - Cross-Origin Resource Sharing middleware
- dotenv ^17.2.3 - Environment variable loading

## Configuration

**Environment:**
- Configuration via `.env` file in backend directory
- Environment variables loaded with `dotenv` package
- Frontend URL configuration via Vite `VITE_API_URL` env var in `frontend/src/api.js`

**Key Environment Variables Required:**
- `OPENAI_API_KEY` - API key for OpenAI GPT models (required)
- `OPENAI_MODEL` - Model selection (defaults to gpt-5.2, supports gpt-5, gpt-4.5-turbo, gpt-4-turbo, gpt-4)
- `CLICKUP_API_TOKEN` - API token for ClickUp project management integration
- `CLICKUP_SPACE_ID` - ClickUp workspace space identifier
- `PORT` - Backend server port (defaults to 3001)

**Build Configuration:**
- Backend: Uses Node.js ES6 modules (type: "module" in `backend/package.json`)
- Frontend: Vite configuration at `frontend/vite.config.js`
- No TypeScript configuration detected (pure JavaScript)

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser with ES6 support for Vue 3
- OpenAI API access (requires valid API key)
- Optional: ClickUp account for project export functionality

**Production:**
- Node.js runtime environment
- Environment variables for API keys must be configured
- Backend serves on configurable port (default 3001)
- Frontend build artifacts served as static files

---

*Stack analysis: 2026-01-31*
