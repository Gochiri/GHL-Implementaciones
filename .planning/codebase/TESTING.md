# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Status:** Not detected

**Current State:**
- No test files found in codebase (no `*.test.js`, `*.spec.js` files)
- No test framework configured (Jest, Vitest, Mocha, Chai not in dependencies)
- No test configuration files present
- No testing scripts in `package.json`

**Implications:**
- All testing currently manual/exploratory
- Backend and frontend rely on runtime validation
- No automated regression testing or CI pipeline

## Test File Organization

**Current Status:** No test structure established

**Recommendation for Implementation:**
- Backend tests: `backend/__tests__/services/*.test.js` (one per service)
- Backend route tests: `backend/__tests__/routes/*.test.js`
- Frontend component tests: `frontend/src/components/__tests__/*.test.js`
- Frontend page tests: `frontend/src/pages/__tests__/*.test.js`

## Test Structure

**No existing patterns to document**

**When tests are added, recommended structure:**
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
// or Jest: import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

describe('Service Name', () => {
  beforeEach(() => {
    // Setup
  })

  afterEach(() => {
    // Cleanup
  })

  it('should do X when given Y', () => {
    // Arrange
    const input = { ... }

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toEqual({ ... })
  })
})
```

## Mocking

**Current Approach:**
- Frontend uses `useRealAPI` ref in `TranscriptAnalyzer.vue` for toggle between mock and real API
- Mock data hardcoded in components (e.g., `mockPainPoints`, `mockObjectives` in `TranscriptAnalyzer.vue`)
- No formal mocking framework

**Recommendation:**
- Use Vitest's `vi.mock()` or Jest's `jest.mock()`
- Mock external services: OpenAI, ClickUp, file extraction
- Mock localStorage for frontend tests
- Example pattern for when tests are implemented:

**What to Mock:**
- External APIs: OpenAI chat completions, ClickUp API calls, file extraction
- HTTP requests: `fetch()` calls in `api.js`
- localStorage operations in Vue components
- Async operations (resolve/reject test scenarios)

**What NOT to Mock:**
- Core business logic (analysis, filtering, transformations)
- Vue composition functions (`ref`, `computed`, `watch`)
- Local utility functions (`getStatusLabel`, `healProjectStatus`)

## Fixtures and Factories

**Current Status:** Not implemented

**Mock data currently hardcoded:**
- `TranscriptAnalyzer.vue` contains `mockPainPoints`, `mockObjectives`, `mockAnalysis`
- `ProjectBuilder.vue` contains `projectTypes`, `tags`, `customFields` as fixture-like data
- `Settings.vue` contains `models`, `languages`, `currencies` dropdowns

**Recommendation for test fixtures:**
```javascript
// frontend/src/__fixtures__/projects.js
export const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  status: 'analysis',
  clientName: 'Test Client',
  weeks: [],
  analysis: { painPoints: [], complexity: 5 }
}

export const mockAnalysis = {
  painPoints: [],
  complexity: 7,
  implementationType: 'automation',
  objectives: [],
  clientName: 'Test Client'
}

// backend/__fixtures__/clickup.js
export const mockClickUpConfig = {
  apiToken: 'test-token-123',
  spaceId: 'space-456'
}
```

**Location to establish:**
- `frontend/src/__fixtures__/` - for frontend test data
- `backend/__fixtures__/` - for backend test data
- `backend/__fixtures__/mocks/` - for external API mocks

## Coverage

**Requirements:** Not enforced

**No coverage configuration detected**

**Recommendation when implementing tests:**
- Aim for 70%+ line coverage minimum
- 80%+ for critical paths (API integrations, data transformations)
- Focus on branches in error handling (try-catch blocks)

**View Coverage (when implemented):**
```bash
npm run test:coverage        # Run tests with coverage report
npm run test:coverage -- --ui # View in browser
```

## Test Types

**Unit Tests (Recommended for):**
- Utility functions: `getStatusLabel()`, `healProjectStatus()` in `status-utils.js`
- Service functions: API response parsing in `ai-analyzer.js`
- File extraction logic in `file-service.js`
- Status mapping and transformations

**Integration Tests (Recommended for):**
- Complete request-response cycle through route handlers
- OpenAI API integration with AI analyzer
- ClickUp project creation with nested folder/list/task structure
- File upload → extraction → analysis flow
- localStorage persistence in Vue components

**E2E Tests:**
- Not currently detected
- Could use Cypress, Playwright, or Puppeteer for future
- Recommended scenarios:
  - Full transcript analysis flow (upload → analyze → generate structure)
  - Project creation and export to ClickUp
  - Settings configuration and connection testing

## Common Patterns to Test

**Async Testing:**
```javascript
// For backend route handlers
it('should analyze transcript', async () => {
  const transcript = 'Test transcript text'
  const result = await analyzeTranscript(transcript)
  expect(result).toHaveProperty('painPoints')
  expect(result).toHaveProperty('complexity')
})

// For Vue components with API calls
it('should load projects on mount', async () => {
  const { mount } = await import('@vue/test-utils')
  const wrapper = mount(Dashboard)
  await wrapper.vm.$nextTick()
  expect(wrapper.vm.projects).toBeDefined()
})
```

**Error Testing:**
```javascript
// Backend error handling
it('should return 400 when file not provided', async () => {
  const response = {
    status: jest.fn().mockReturnValue({ json: jest.fn() })
  }
  const request = { file: null }

  await uploadHandler(request, response)
  expect(response.status).toHaveBeenCalledWith(400)
})

// API error handling
it('should throw error on invalid transcript', async () => {
  expect(async () => {
    await api.analyze(null)
  }).rejects.toThrow()
})
```

**Vue Component State Testing:**
```javascript
// Test reactive state changes
it('should update transcript when file uploaded', async () => {
  const wrapper = mount(TranscriptAnalyzer)

  // Simulate file upload
  wrapper.vm.transcript = 'New content'
  await wrapper.vm.$nextTick()

  expect(wrapper.vm.transcript).toBe('New content')
})

// Test computed properties
it('should filter analyses by search query', async () => {
  const wrapper = mount(Dashboard)
  wrapper.vm.searchQuery = 'client-name'
  await wrapper.vm.$nextTick()

  expect(wrapper.vm.filteredAnalyses.length).toBeLessThan(
    wrapper.vm.recentAnalyses.length
  )
})
```

## Critical Test Gaps

**Services requiring tests:**
- `ai-analyzer.js` - OpenAI integration, response parsing
- `clickup-service.js` - Complex ClickUp API orchestration (10+ API calls)
- `file-service.js` - PDF, Word, text extraction error handling

**Route handlers requiring tests:**
- `/api/analyze` - AI analysis request/response
- `/api/project/approve` - Multi-step approval flow
- `/api/clickup/create` - Complex nested structure creation
- `/api/upload` - File upload and extraction

**Components requiring tests:**
- `TranscriptAnalyzer.vue` - File upload, analysis flow
- `ProjectBuilder.vue` - State persistence, project loading
- `KanbanBoard.vue` - Task filtering, drag-and-drop
- `Dashboard.vue` - Data loading, status healing

**No tests for:**
- Error recovery and retry logic
- Edge cases in API responses
- localStorage corruption/recovery scenarios
- Network timeout handling
- Large file handling

---

*Testing analysis: 2026-01-31*
