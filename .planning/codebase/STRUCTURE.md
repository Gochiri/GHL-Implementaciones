# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
C:\Users\germa\OneDrive\Documents\GHL Implementaciones\
├── backend/                    # Express.js API server
│   ├── server.js               # Entry point: Express app, routes
│   ├── package.json            # Dependencies (express, openai, axios, multer, pdf-parse, mammoth)
│   ├── .env                    # API keys (OPENAI_API_KEY, CLICKUP_API_TOKEN, etc.)
│   ├── .env.example            # Template for required env vars
│   ├── routes/                 # Route definitions (currently empty, routes in server.js)
│   └── services/               # Business logic modules
│       ├── ai-analyzer.js      # OpenAI integration, prompt engineering
│       ├── clickup-service.js  # ClickUp API wrapper
│       └── file-service.js     # PDF/Word/text extraction
├── frontend/                   # Vue 3 + Vite SPA
│   ├── src/
│   │   ├── main.js             # Vue app entry point, router setup
│   │   ├── App.vue             # Root component (sidebar layout)
│   │   ├── api.js              # Fetch-based API client
│   │   ├── style.css           # Global styles
│   │   ├── pages/              # Page components (routed views)
│   │   │   ├── Dashboard.vue   # Project overview, recent analyses
│   │   │   ├── TranscriptAnalyzer.vue  # File upload, transcription analysis
│   │   │   ├── ProjectBuilder.vue      # Project structure editor
│   │   │   ├── KanbanBoard.vue         # Task management by status
│   │   │   ├── ProposalGenerator.vue   # Quotation & approval flow
│   │   │   ├── Projects.vue            # Project list/gallery
│   │   │   └── Settings.vue            # Config (API keys, etc.)
│   │   ├── components/         # Reusable UI components
│   │   │   └── HelloWorld.vue  # Sample component
│   │   ├── utils/              # Utility functions
│   │   │   └── status-utils.js # Project status enums, helpers
│   │   ├── assets/             # Images, fonts, etc.
│   │   └── public/             # Static files
│   ├── vite.config.js          # Vite build configuration
│   ├── package.json            # Vue, Vite, axios dependencies
│   ├── index.html              # HTML entry point
│   └── dist/                   # Build output (generated)
├── config/                     # Configuration directory (purpose TBD)
├── .planning/                  # GSD planning outputs
│   └── codebase/               # Codebase analysis documents
├── .claude/                    # Claude-specific config
├── .agent/                     # Agent-related files
├── .agents/                    # Multi-agent setup
├── implementation_plan.md      # Project documentation
└── README (implicit)
```

## Directory Purposes

**Backend (`backend/`):**
- Purpose: REST API server with business logic and integrations
- Contains: Express.js setup, route handlers, service modules
- Key files: `server.js` (entry point), `services/` (domain logic)

**Frontend (`frontend/`):**
- Purpose: Vue 3 single-page application
- Contains: Pages, components, API client, routing, styling
- Key files: `src/main.js` (app init), `src/pages/` (routed views), `src/api.js` (HTTP client)

**Frontend Pages (`frontend/src/pages/`):**
- Purpose: Routed view components for different workflows
- Contains: Dashboard, Analyzer, ProjectBuilder, Kanban, Proposals, Settings
- Pattern: One `.vue` file per route

**Backend Services (`backend/services/`):**
- Purpose: Encapsulated business logic for specific domains
- Contains: AI analysis, file handling, ClickUp integration
- Pattern: Exported async functions, error handling, external API calls

**Frontend Utils (`frontend/src/utils/`):**
- Purpose: Shared utility functions and constants
- Contains: Status enums, helper functions
- Key file: `status-utils.js` (project status lifecycle)

**Configuration (`config/`):**
- Purpose: Config files (role unclear from exploration)
- Contains: Likely environment or setup configs

## Key File Locations

**Entry Points:**
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\server.js`: Backend server initialization
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\main.js`: Frontend app initialization

**Configuration:**
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\package.json`: Backend dependencies, scripts
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\.env`: Backend secrets (OpenAI, ClickUp keys)
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\package.json`: Frontend dependencies, scripts
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\vite.config.js`: Vite build config

**Core API Layer:**
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\server.js`: All route definitions (no separate route files)
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\services\ai-analyzer.js`: OpenAI prompts and chat logic
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\services\clickup-service.js`: ClickUp folder/list/task creation
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\services\file-service.js`: PDF/Word text extraction

**Frontend Client:**
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\api.js`: Centralized fetch client
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\App.vue`: Root layout (sidebar + router-view)

**Frontend Views:**
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\Dashboard.vue`: Home/overview
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\TranscriptAnalyzer.vue`: Upload and analyze
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\ProjectBuilder.vue`: Structure editing
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\KanbanBoard.vue`: Task board
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\ProposalGenerator.vue`: Quotation flow
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\Projects.vue`: Project gallery
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages\Settings.vue`: Configuration UI

**Utilities:**
- `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\utils\status-utils.js`: Status constants and helpers

## Naming Conventions

**Files:**
- Backend: camelCase (`.js` extension)
  - Services: descriptive noun phrases with `-service.js` suffix (e.g., `ai-analyzer.js`, `clickup-service.js`)
  - Main entry: `server.js`
- Frontend: PascalCase for Vue components (`.vue` extension)
  - Pages: Descriptive names matching their route function (e.g., `Dashboard.vue`, `ProjectBuilder.vue`)
  - Utils: descriptive names with `-utils.js` suffix (e.g., `status-utils.js`)
  - API client: `api.js`

**Directories:**
- Lowercase, descriptive, plural where appropriate
  - `backend/`, `frontend/`, `services/`, `pages/`, `components/`, `utils/`, `assets/`

**Routes (Frontend Router):**
- Kebab-case in URL paths: `/analyzer`, `/kanban`, `/projects`, `/settings`
- Dynamic segments: `/project/:id`, `/proposal/:id`

## Where to Add New Code

**New Feature:**
- Backend endpoint: Add handler in `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\server.js`
- Corresponding frontend call: Add method to `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\api.js`
- Frontend UI: Create component in appropriate location

**New Page/Route:**
- Create `.vue` file in `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\pages/`
- Add route entry in `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\main.js` routes array
- Add nav item to `navItems` array in `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\App.vue`

**New Service Module:**
- Create file in `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\backend\services/` with descriptive name
- Export async functions as default or named exports
- Import and use in `server.js` route handlers

**Utilities:**
- Shared helper functions: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\utils/`
- Constants and enums: Adjacent to usage or in dedicated utils file

**Components:**
- Reusable UI components: `C:\Users\germa\OneDrive\Documents\GHL Implementaciones\frontend\src\components/`
- Page-specific UI: Embed directly in page `.vue` file or co-locate if needed

## Special Directories

**`backend/routes/`:**
- Purpose: Placeholder for future route organization (currently empty)
- Generated: No
- Committed: Yes

**`frontend/dist/`:**
- Purpose: Vite build output
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`frontend/node_modules/`:**
- Purpose: Installed npm packages
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`backend/node_modules/`:**
- Purpose: Installed npm packages
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`frontend/public/`:**
- Purpose: Static assets served as-is
- Generated: No
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, etc.)
- Generated: Yes (by GSD mapper)
- Committed: Yes

**`.env` files:**
- Purpose: Environment variables for secrets and config
- `backend/.env`: Actual keys (not committed, in `.gitignore`)
- `backend/.env.example`: Template for required vars
- Generated: No (manual creation)
- Committed: `.env.example` only

---

*Structure analysis: 2026-01-31*
