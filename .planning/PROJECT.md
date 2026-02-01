# GHL Implementaciones - Documento Maestro

> **Para el asistente de IA:** Este documento contiene todo el contexto necesario para trabajar en este proyecto. Léelo completo antes de hacer cualquier cambio.

## Qué Es Este Proyecto

**GHL Implementaciones** es una herramienta interna para gestionar proyectos de implementación de Go High Level (GHL/HighLevel).

**Flujo principal:**
1. Usuario pega transcripción de llamada de ventas (de Fathom u otra herramienta)
2. IA analiza la transcripción y extrae: dolores, objetivos, complejidad, tipo de proyecto
3. Chat con "Arquitecto GHL" para refinar detalles técnicos
4. Genera estructura de proyecto (semanas, tareas, horas)
5. Genera propuesta/cotización
6. Exporta a ClickUp como proyecto con tareas

**Usuario objetivo:** Equipo interno de implementaciones GHL (1-3 personas).

## Stack Técnico

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5.2.1
- **IA:** OpenAI API (modelo gpt-5.2)
- **Integraciones:** ClickUp API
- **Puerto:** 3001

### Frontend
- **Framework:** Vue 3.5.24 + Composition API
- **Build:** Vite 7.3.1
- **Router:** Vue Router 4.6.4
- **Estilos:** CSS puro con variables (glassmorphism, paleta de lujo)
- **Puerto:** 5173 (dev)

### Almacenamiento Actual
- **localStorage** para proyectos (temporal - pendiente migrar a DB)
- **Memoria** para webhooks GHL (temporal)

## Estructura de Carpetas

```
GHL-Implementaciones/
├── api/                       # Backend (Express) optimizado para Vercel
│   ├── index.js               # Entry point (antes server.js)
│   ├── services/
│   ├── db.js
│   └── package.json
│
├── frontend/                  # Frontend (Vue + Vite)
│   ├── src/
│   └── package.json
│
├── vercel.json                # Configuración de despliegue
├── package.json               # Monorepo root con scripts de build
├── .planning/
└── templates/
```

## Flujo de Datos

```
[Transcripción]
    → POST /api/analyze
    → OpenAI (ai-analyzer.js)
    → { clientName, niche, painPoints, complexity, objectives }
    → localStorage('projects')

[Chat Arquitecto]
    → POST /api/hormozi
    → OpenAI (max 3 preguntas)
    → { question } o { ready: true }

[Generar Proyecto]
    → POST /api/project-structure
    → OpenAI
    → { weeks: [{ name, tasks: [...] }] }

[Aprobar Proyecto]
    → POST /api/project/approve
    → POST /api/clickup/create
    → Crea folder + list + tasks en ClickUp
```

## Estados de Proyecto

```javascript
// Definidos en utils/status-utils.js
'analysis'  → Análisis completado, pendiente estructura
'created'   → Estructura creada
'proposal'  → Propuesta generada
'approved'  → Aprobado, exportado a ClickUp
'completed' → Implementación terminada
```

## Configuración Requerida (.env)

```env
OPENAI_API_KEY=sk-...          # Requerido
OPENAI_MODEL=gpt-5.2           # Modelo a usar
CLICKUP_API_TOKEN=pk_...       # Para exportar proyectos
CLICKUP_SPACE_ID=...           # ID del space en ClickUp
PORT=3001                      # Puerto del backend
```

## Cómo Correr el Proyecto

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Abrir http://localhost:5173
```

## Estado Actual (2026-01-31)

### ✅ Funciona
- Análisis de transcripciones con OpenAI (extrae clientName, niche, painPoints, complexity, objectives)
- Chat con Arquitecto GHL (máx 3 preguntas)
- Guardar proyectos en localStorage
- Navegación entre páginas
- Dashboard con métricas básicas
- Lista de proyectos con nombre del cliente
- Botón "Generar Proyecto" ahora llama a `/api/project-structure` para crear semanas/tareas

### ⚠️ Parcialmente Funciona / En Pruebas
- ProjectBuilder: Ahora genera estructura, pendiente verificar visualización
- Generación de propuestas: Genera HTML pero se muestra como código raw (pendiente renderizar)
- ClickUp integration: Configurado pero no probado end-to-end

### ❌ No Funciona / Pendiente
- Persistencia real (todo en localStorage)
- Autenticación de usuarios
- Webhooks de GHL (en memoria, se pierden)
- Tests (0% coverage)
- Propuesta muestra HTML raw en vez de renderizado

## Bugs Conocidos

Ver `.planning/mejoras.md` para lista completa.

**Corregidos en esta sesión (2026-01-31):**
- `max_tokens` → `max_completion_tokens` (compatibilidad gpt-5.2)
- `ghLeads` → `ghlLeads` typo en Dashboard.vue
- `isAnalyzing` nunca se ponía en false después de analizar
- Bug -Infinity al agregar tareas/semanas (Math.max en array vacío)
- `last-analysis-id` → `last-project-id` (conexión entre páginas)
- Prompt de OpenAI mejorado para extraer clientName y niche
- "Generar Proyecto" ahora llama a API para crear estructura (antes no hacía nada)

## Decisiones Técnicas

| Decisión | Razón | Estado |
|----------|-------|--------|
| Vue 3 + Composition API | Moderno, reactivo, fácil de mantener | ✅ |
| localStorage temporal | MVP rápido, migrar después | ⚠️ Pendiente DB |
| OpenAI gpt-5.2 | Modelo más reciente disponible | ✅ |
| Sin autenticación | Solo uso interno por ahora | ⚠️ Pendiente |
| CSS puro (no Tailwind) | Control total del diseño glassmorphism | ✅ |

## Próximos Pasos Sugeridos

1. **Verificar que ProjectBuilder muestre la estructura generada** - Probar flujo completo
2. **Arreglar propuesta HTML** - Se muestra como código, debería renderizarse
3. **Probar integración ClickUp** - End-to-end
4. **Migrar a base de datos** - SQLite o PostgreSQL
5. **Agregar tests básicos** - Al menos para ai-analyzer.js

## Archivos Clave para Modificar

| Si quieres... | Modifica... |
|---------------|-------------|
| Cambiar prompts de IA | `backend/services/ai-analyzer.js` |
| Agregar endpoint API | `backend/server.js` |
| Modificar análisis UI | `frontend/src/pages/TranscriptAnalyzer.vue` |
| Modificar proyectos UI | `frontend/src/pages/ProjectBuilder.vue` |
| Cambiar estilos globales | `frontend/src/App.vue` (CSS variables) |
| Agregar nueva página | `frontend/src/pages/` + actualizar router en `main.js` |

## Convenciones de Código

- **Componentes Vue:** `<script setup>` con Composition API
- **Estilos:** Scoped CSS en cada componente
- **Nombres de variables:** camelCase
- **API responses:** JSON con campos en inglés (painPoints, no dolores)
- **Commits:** Conventional commits (feat:, fix:, docs:, etc.)

---

*Última actualización: 2026-01-31 (sesión de debugging y fixes)*
*Actualizar este documento cuando haya cambios significativos.*
