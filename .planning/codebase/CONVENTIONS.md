# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- Backend services: camelCase (e.g., `ai-analyzer.js`, `clickup-service.js`, `file-service.js`)
- Frontend pages: PascalCase (e.g., `Dashboard.vue`, `TranscriptAnalyzer.vue`, `ProjectBuilder.vue`)
- Frontend components: PascalCase (e.g., `HelloWorld.vue`)
- Frontend utilities: camelCase (e.g., `status-utils.js`, `api.js`)

**Functions:**
- camelCase for all function names
- Async functions are explicitly declared with `async` keyword
- Higher-order functions and utility helpers use camelCase
- Examples: `analyzeTranscript()`, `createClickUpProject()`, `extractTextFromFile()`, `getStatusLabel()`

**Variables:**
- camelCase for all variables (refs, computed properties, regular vars)
- Constants that are truly immutable use UPPER_CASE with underscores
- Example: `CLICKUP_API_BASE = 'https://api.clickup.com/api/v2'`
- Vue refs and reactive data: camelCase (e.g., `transcript`, `isAnalyzing`, `attachedFiles`)

**Types:**
- Objects use camelCase for property names
- Metadata objects follow pattern: `metadata: { field_type: '', priority_ghl: 0 }`
- Response objects follow backend API shape
- No explicit TypeScript interfaces used; relies on JSDoc comments

## Code Style

**Formatting:**
- No explicit formatter configured (no `.prettierrc`, no `eslintrc`)
- 2-space indentation observed throughout
- Trailing commas in objects/arrays for readability
- Prefer template literals over string concatenation for multi-line content

**Linting:**
- No linter configuration files detected
- Code style is consistent but self-enforced through review
- No pre-commit hooks or automated formatting

## Import Organization

**Order:**
1. Built-in/framework imports (Vue, Express, dotenv, etc.)
2. Third-party packages (axios, OpenAI, mammoth, pdf-parse, etc.)
3. Local imports (services, utilities, components, pages)

**Examples:**
```javascript
// Backend pattern
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { analyzeTranscript } from './services/ai-analyzer.js';
import { createClickUpProject } from './services/clickup-service.js';

// Frontend pattern
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api.js'
import { PROJECT_STATUSES, getStatusLabel } from '../utils/status-utils.js'
```

**Path Aliases:**
- No path aliases configured
- Relative imports used throughout (e.g., `../api.js`, `./services/ai-analyzer.js`)
- Full paths required from root for imports from utils

## Error Handling

**Patterns:**
- Try-catch blocks used consistently for async operations
- Error messages passed through to client: `res.status(500).json({ error: error.message })`
- Frontend errors caught in try-catch and displayed via `alert()` or error state variables
- Errors logged to console before responding to client
- Console logs include emoji prefixes for categorization (🚀, 📬, ❌, ✅, 📂, etc.)

**Examples from `server.js`:**
```javascript
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const text = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    res.json({ text, filename: req.file.originalname });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend error handling from `TranscriptAnalyzer.vue`:**
```javascript
try {
  const res = await api.uploadFile(file)
  // ... success handling
} catch (error) {
  console.error(`❌ Error en ${file.name}:`, error)
  alert(`Error al subir ${file.name}: ${error.message}`)
}
```

## Logging

**Framework:** Native `console` object (no logging library)

**Patterns:**
- `console.log()` for informational messages with emoji prefixes
- `console.error()` for errors with emoji prefix (❌)
- Messages include context and operation status
- Examples: `console.log('🚀 Server running on...')`, `console.error('❌ PDF extraction error:', err)`
- Emoji usage: 🚀 (startup/important), 📬 (webhook), ❌ (error), ✅ (success), 📂 (file operation), 🔨 (creation), 📝 (task creation), 📦 (export), 🎯 (analysis), 📤 (upload), ⚠️ (warning)

## Comments

**When to Comment:**
- Comments used sparingly
- Inline comments for non-obvious logic or workarounds
- Code is generally self-documenting through descriptive naming
- Comments appear before sections describing high-level intent

**JSDoc/TSDoc:**
- Minimal JSDoc usage observed
- Function purpose documented in comments above complex functions
- Example from `status-utils.js`:
```javascript
/**
 * Heals project status based on current content and legacy keys.
 * Returns { project, wasHealed }
 */
export const healProjectStatus = (project) => {
```

## Function Design

**Size:**
- Most functions 20-50 lines
- Some route handlers in `server.js` reach 30+ lines for multi-step processes
- Utility functions kept under 15 lines
- Async functions in services can be 50+ lines for complex API interactions

**Parameters:**
- Destructuring used for complex objects
- Example: `function createClickUpProject(projectData, clickupConfig)` where `clickupConfig` is destructured internally
- Single object parameter preferred over multiple parameters
- Optional parameters defaulted inline

**Return Values:**
- Always return values from functions explicitly
- Async functions always return Promise/result
- For Vue components: use `ref()` for reactive state, return nothing from `script setup`
- Fetch-based API calls return parsed JSON

## Module Design

**Exports:**
- Named exports for utility functions: `export const getStatusLabel = (id) => ...`
- Default export for Vue components: `export default { ... }`
- Services export multiple named functions: `export { analyzeTranscript, askHormoziQuestion, ... }`
- Backend services export functions that wrap external API calls

**Barrel Files:**
- Not used in this codebase
- Each utility/service imported directly from its file
- No index.js files aggregating exports

**API Module Pattern (`frontend/src/api.js`):**
- Centralized API client object with named methods
- Each method handles full request-response cycle
- Error handling at API layer with user-friendly messages
- Example:
```javascript
export const api = {
  analyze: (transcript) =>
    fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error analizando transcripción');
      return data;
    })
}
```

## Vue-Specific Patterns

**Script Setup:**
- All Vue components use `<script setup>` syntax
- Imports at top of script tag
- Reactive state declared with `ref()` and `computed()`
- Lifecycle hooks used: `onMounted`, `watch`
- Router hooks: `useRouter()`, `useRoute()`

**Reactivity:**
- `ref()` for primitive and object state
- `computed()` for derived state
- `watch()` for side effects on state changes
- Deep watch option used when needed: `watch([...], {...}, { deep: true })`

**Template Patterns:**
- Vue directives: `v-for`, `v-if`, `v-class`, `@click`, `:to`
- Ternary operators in templates for conditional rendering
- Event binding with inline arrow functions or method references
- Two-way binding via `v-model` on form inputs

---

*Convention analysis: 2026-01-31*
