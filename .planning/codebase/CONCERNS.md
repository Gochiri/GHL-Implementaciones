# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

**In-Memory Webhook Storage:**
- Issue: GHL webhooks are stored in-memory array with arbitrary 50-item limit
- Files: `backend/server.js` (lines 183-213)
- Impact: All webhook data lost on server restart; no persistence or history beyond last 50 entries; webhook retrieval unreliable in production
- Fix approach: Implement persistent storage (SQLite, PostgreSQL, or MongoDB) to preserve webhook history; add cleanup strategy for old webhooks; implement proper database indexes

**Hardcoded Port and Configuration:**
- Issue: API_BASE_URL hardcoded in frontend, no environment configuration for production
- Files: `frontend/src/api.js` (line 4), `frontend/src/pages/Settings.vue` (line 62)
- Impact: Frontend must be rebuilt or manually modified to work with different backends; difficult to manage multiple environments (dev, staging, prod)
- Fix approach: Use Vite environment variables (VITE_API_URL) consistently; document .env.local setup for frontend

**localStorage-Only Persistence:**
- Issue: All projects, analyses, and quotations exist only in browser localStorage
- Files: `frontend/src/pages/TranscriptAnalyzer.vue` (lines 135-148), `frontend/src/pages/ProjectBuilder.vue` (lines 67-82), `frontend/src/pages/Dashboard.vue` (lines 37-50)
- Impact: Data lost if browser cache cleared or user switches devices; no multi-user support; no data backup; unreliable for business-critical information
- Fix approach: Implement backend database to persist projects; add API endpoints for CRUD operations; migrate localStorage to act as cache only

**Mock Data Fallback as Permanent Pattern:**
- Issue: TranscriptAnalyzer falls back to mock data on API failure rather than retrying or queuing
- Files: `frontend/src/pages/TranscriptAnalyzer.vue` (lines 109-131)
- Impact: User gets fake analysis without warning; incorrect data fed to subsequent steps (project generation, quotation); no way to know if analysis was real or mock
- Fix approach: Make fallback explicit with UI warning; implement retry logic with exponential backoff; queue failed requests for later processing

## Known Bugs

**PDF Parsing Error Handling:**
- Symptoms: If pdf-parse encounters corrupted PDF, error thrown but no graceful fallback
- Files: `backend/services/file-service.js` (lines 6-15)
- Trigger: Upload corrupted or unusual PDF file without text layer
- Workaround: User must upload different file format or manually enter text; no alternative parser configured

**Zero Tasks Edge Case:**
- Symptoms: Unhandled error when calculating max task ID in empty weeks
- Files: `frontend/src/pages/ProjectBuilder.vue` (line 126: `Math.max(...weeks.value.flatMap(...))` with empty array)
- Trigger: Add task to first week with no existing tasks
- Workaround: Add a task manually before using modal; returns -Infinity which breaks task IDs

**ClickUp Folder Name Collision Retry:**
- Symptoms: If folder name collision happens, timestamp-based retry may still fail if collision occurs frequently
- Files: `backend/services/clickup-service.js` (lines 36-48)
- Trigger: Rapid sequential project creation with same client name in same space
- Current mitigation: Appends timestamp, but no max retry limit
- Recommendation: Implement exponential backoff and configurable retry count; consider UUID suffix instead of timestamp

**Incomplete Error Messages from OpenAI:**
- Symptoms: JSON parsing fails silently if OpenAI returns malformed JSON
- Files: `backend/services/ai-analyzer.js` (lines 106, 132, 157, 208)
- Trigger: OpenAI API timeout or truncated response
- Workaround: User sees "error.message" without context about what failed to parse
- Recommendation: Add validation before JSON.parse with descriptive error messages

## Security Considerations

**Secrets Exposed in Client State:**
- Risk: Settings (API keys) stored in browser localStorage and logged in console
- Files: `frontend/src/pages/Settings.vue` (lines 128-129), entire settings object serialized
- Current mitigation: localStorage is browser-isolated, but any XSS vulnerability exposes credentials
- Recommendations:
  - Never store API keys in localStorage; use session-only state or HTTP-only cookies
  - Remove API key from localStorage; only test connection on backend
  - Implement secure credential storage (OAuth or token exchange)

**Missing CORS Validation:**
- Risk: CORS enabled with no origin restrictions
- Files: `backend/server.js` (line 26: `cors()` with default settings)
- Impact: Any domain can make requests to backend; vulnerable to CSRF and unauthorized access
- Recommendation: Restrict CORS to specific frontend URL(s); use `cors({ origin: process.env.FRONTEND_URL })`

**API Token in Request Body:**
- Risk: ClickUp API tokens passed in POST body as plain text
- Files: `backend/server.js` (lines 141-162), `frontend/src/api.js` (lines 73-82)
- Impact: Tokens visible in browser network tab and server logs; not encrypted in transit
- Recommendation:
  - Use HTTP Authorization headers instead of body
  - Implement token rotation and expiration
  - Revoke exposed tokens immediately

**No Rate Limiting:**
- Risk: Backend endpoints have no rate limiting or request throttling
- Files: `backend/server.js` (all endpoints: lines 30-296)
- Impact: Vulnerable to DoS attacks; no protection against API abuse or credential brute-forcing
- Recommendation: Add express-rate-limit middleware; implement per-IP and per-user rate limits; log suspicious activity

**Webhook Validation Missing:**
- Risk: GHL webhooks accepted without signature verification
- Files: `backend/server.js` (lines 187-213)
- Impact: Anyone can forge webhook events; no guarantee request came from GHL
- Recommendation: Validate webhook signature using GHL-provided HMAC or OAuth; reject unsigned requests

## Performance Bottlenecks

**Large File Upload Without Streaming:**
- Problem: Files loaded entirely into memory before processing
- Files: `backend/server.js` (lines 20-24: multer with memoryStorage)
- Cause: Using multer memory storage; entire file buffered before upload completes
- Current limit: 10MB per file
- Improvement path:
  - Switch to disk storage with automatic cleanup
  - Implement streaming for large files
  - Add progress indicators for UI feedback
  - Process PDF/Word files with streaming parsers

**No Pagination on Webhook History:**
- Problem: All 50 webhooks loaded and serialized on every request
- Files: `backend/server.js` (line 217, returns all ghlWebhooks)
- Cause: Simple array iteration with no pagination logic
- Improvement path: Add limit/offset parameters; implement cursor-based pagination; archive old webhooks

**Vue Component Size:**
- Problem: TranscriptAnalyzer is 1164 lines; ProjectBuilder is 1039 lines
- Files: `frontend/src/pages/TranscriptAnalyzer.vue`, `frontend/src/pages/ProjectBuilder.vue`
- Cause: Multiple features (upload, analysis, chat, display) in single component
- Improvement path: Split into smaller components (FileUpload, AnalysisResults, ChatInterface); use composition

**No Caching of API Responses:**
- Problem: Same analysis or project regenerated on every page reload
- Files: All API calls in `frontend/src/api.js` fetch fresh data always
- Cause: No response caching or state management
- Improvement path: Implement Vue composables for state management; cache successful responses; add stale-while-revalidate strategy

## Fragile Areas

**AI-Driven Data Parsing (All Analysis Steps):**
- Files: `backend/services/ai-analyzer.js` (entire file); backend depends 100% on OpenAI JSON responses
- Why fragile:
  - LLM outputs inconsistent JSON structure (sometimes uses Spanish field names like "dolores", sometimes English "painPoints")
  - No schema validation before parsing
  - Temperature settings vary (0.2-0.7) causing unpredictable responses
  - Prompt injection possible if user provides malicious transcript
- Safe modification:
  - Add JSON schema validation with strict type checking
  - Normalize all field names server-side
  - Log all AI requests/responses for debugging
  - Implement prompt escaping for user input
- Test coverage: No tests for ai-analyzer.js; rely entirely on integration testing

**ClickUp Integration (Multiple Failure Modes):**
- Files: `backend/services/clickup-service.js` (entire file)
- Why fragile:
  - No validation that folder/list/task structure matches ClickUp API expectations
  - If subtask creation fails, parent task still created with no rollback (line 95: continue)
  - Task priority mapping (GHL 1-3 to ClickUp 1-4) hardcoded without validation
  - No handling of rate limits or API quota exceeded
- Safe modification:
  - Validate response shapes before using them
  - Implement transaction-like behavior: fail entire project creation if any step fails
  - Add ClickUp API error code documentation and specific handling
- Test coverage: No tests; integration-only

**localStorage State Synchronization:**
- Files: `frontend/src/pages/Dashboard.vue` (lines 42-50), `frontend/src/pages/ProjectBuilder.vue` (lines 67-86)
- Why fragile:
  - Multiple components write to same projects key with no coordination
  - `healProjectStatus` function attempts to fix corrupted data but no validation of repair logic
  - Race condition if localStorage modified while component updates are pending
  - No version migration strategy if data schema changes
- Safe modification:
  - Implement proper state management (Vuex/Pinia) with single write path
  - Add migration functions for schema changes
  - Validate all localStorage reads with schema
- Test coverage: None; critical path completely untested

**Configuration Loading (Placeholder Values):**
- Files: `backend/server.js` (lines 117-121, 145-150)
- Why fragile:
  - `isPlaceholder()` function uses magic strings (***) to detect unset values
  - Falls back to .env silently without logging what was used
  - Impossible to know at runtime which config came from where
- Safe modification:
  - Remove placeholder detection; require explicit configuration
  - Log which config source was used (env var name or request body)
  - Validate all required configs exist before server starts
- Test coverage: None for config loading

## Scaling Limits

**In-Memory Data Structures:**
- Current capacity: Hardcoded 50 webhooks; no limit on projects in localStorage
- Limit: Browser localStorage has ~5-10MB limit; 50+ projects will exceed quota
- Scaling path:
  - Implement server-side database (PostgreSQL recommended for relational data)
  - Move all state off client; localStorage becomes session cache only
  - Implement data archival for old projects
  - Add bulk operations for large datasets

**AI API Cost Without Rate Limiting:**
- Current capacity: No tracking of OpenAI API usage or costs
- Limit: High-temp settings (0.7) and large prompt context cause token waste
- Scaling path:
  - Add token counting before API calls
  - Implement usage tracking per project
  - Add cost estimation UI before analysis
  - Cache AI responses at project level to avoid re-analysis

**PDF Parsing Memory:**
- Current capacity: Entire PDF loaded into Node.js heap
- Limit: 10MB limit hits quickly for large documents; parsing ties up event loop
- Scaling path:
  - Implement streaming PDF parser (pdfjs-dist with incremental parsing)
  - Offload to worker process for large files
  - Add timeout protection (60s max per file)
  - Return partial results if parsing times out

## Dependencies at Risk

**pdf-parse (Version 2.4.5):**
- Risk: Outdated; last release was 2+ years ago
- Impact: Security vulnerabilities in PDF parsing; memory leaks in C++ bindings; breaks on newer Node versions
- Current status: No active maintenance
- Migration plan: Migrate to `pdfjs-dist` (official Mozilla parser); rewrite extraction logic; test with sample corpus

**express (Version 5.2.1):**
- Risk: Version 5.x is still beta; major breaking changes expected before stable release
- Impact: Unstable API; missing security patches; may be deprecated before project completion
- Current status: Alpha release, production warning on npm
- Migration plan: Pin to express 4.18.x (LTS); test compatibility; use changelog before upgrading

**mammoth (Version 1.11.0):**
- Risk: Outdated; no recent updates; doesn't support all Office formats
- Impact: May fail silently on newer .docx files; no support for .pptx
- Current status: Last update 2019
- Migration plan: Consider `docx` or `odt` parser as primary; implement fallback to LibreOffice conversion service

## Missing Critical Features

**No Audit Trail:**
- Problem: Cannot track who changed what or when; no approval workflow history
- Blocks: Compliance requirements; accountability; rollback capability
- Required for: Production deployment; enterprise customers

**No User Authentication:**
- Problem: No login system; all users share same data
- Blocks: Multi-user support; permission control; data isolation
- Required for: Team collaboration; client dashboard access

**No Data Backup/Export:**
- Problem: No way to export projects or analyses; no backup strategy
- Blocks: Data migration; disaster recovery; compliance audits
- Required for: Production reliability; data portability

**No Error Recovery Dashboard:**
- Problem: Failed API calls silently logged to console; no way to retry or debug
- Blocks: Operational visibility; support troubleshooting
- Required for: Production monitoring; incident response

## Test Coverage Gaps

**Backend Services:**
- What's not tested: `ai-analyzer.js`, `clickup-service.js`, `file-service.js`
- Files: Entire `backend/services/` directory
- Risk: Critical business logic changes go untested; JSON parsing failures undetected; API integration breaks silently
- Priority: HIGH - These are core functionality

**Frontend Vue Components:**
- What's not tested: All `.vue` files in `frontend/src/pages/`
- Files: `TranscriptAnalyzer.vue` (1164 lines), `ProjectBuilder.vue` (1039 lines), `KanbanBoard.vue`, etc.
- Risk: UI state bugs, localStorage corruption, API failure handling all undetected
- Priority: HIGH - User-facing features

**API Endpoints:**
- What's not tested: All Express routes in `backend/server.js`
- Files: Health check, analyze, upload, project approval, ClickUp integration (46 endpoints total)
- Risk: Request validation bypasses, error responses inconsistent, security holes undetected
- Priority: CRITICAL - API is attack surface

**Integration Tests:**
- What's not tested: End-to-end flows (upload → analyze → generate → ClickUp)
- Files: None exist
- Risk: Chained failures hidden; real-world usage patterns not validated
- Priority: MEDIUM - Harder to maintain but catches real bugs

**Error Handling Paths:**
- What's not tested: Exception cases (bad JSON, network timeout, invalid files, rate limits)
- Files: All services and API routes
- Risk: Unhandled rejections, confusing error messages, silent failures
- Priority: MEDIUM - User experience depends on graceful degradation

---

*Concerns audit: 2026-01-31*
