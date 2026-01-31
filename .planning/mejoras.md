# Mejoras - GHL Implementaciones

**Fecha de revisión:** 2026-01-31

## Observaciones del Usuario

### Sesión 1 - Revisión Inicial

**✅ Funciona:**
- Análisis de transcripciones con OpenAI (después de fix)
- Muestra dolores principales, complejidad, estructura sugerida

**❌ Bugs encontrados:**

1. **"Generar Proyecto" no trae info del análisis**
   - Presiona botón pero ProjectBuilder no recibe los datos
   - Nombre del cliente no se guarda

2. **Bug "Semana -Infinity"**
   - ProjectBuilder muestra "Semana -Infinity: Nueva Fase"
   - Causa: `Math.max(...[])` retorna -Infinity

3. **Proyectos sin nombre**
   - Lista de proyectos muestra "Cliente 1", "Cliente 2"...
   - No extrae nombre real del cliente de la transcripción

4. **Botones de Estructura vacíos**
   - En lista de proyectos, botón "Estructura" no muestra nada

5. **Complejidad no se muestra**
   - En lista dice "Complejidad" pero sin valor

6. **Nicho siempre "N/A"**
   - No se extrae el nicho del cliente

---

## Bugs Corregidos (2026-01-31)

- [x] `max_tokens` → `max_completion_tokens` (gpt-5.2)
- [x] `ghLeads` typo en Dashboard.vue
- [x] `isAnalyzing` nunca se ponía en false
- [x] Bug -Infinity al agregar tareas/semanas (Math.max en array vacío)
- [x] `last-analysis-id` → `last-project-id` (conexión entre páginas)
- [x] Prompt de OpenAI ahora extrae clientName y niche
- [x] Frontend captura y guarda clientName y niche
- [x] "Generar Proyecto" ahora llama a `/api/project-structure` para crear semanas/tareas
- [x] **ProjectBuilder:** Normalización de datos recibidos de la API (IDs para semanas y tareas) para asegurar visualización correcta.
- [x] **ProposalGenerator / ProjectBuilder:** Mejora en el renderizado de Markdown/HTML para blueprints técnicos y propuestas.
- [x] **Lista de Proyectos:** Se muestra numéricamente la complejidad y de forma más prominente el nicho.

---

## Mejoras Pendientes

- [ ] Probar integración ClickUp end-to-end (requiere API Token real)
- [ ] Migrar de localStorage a base de datos (SQLite/PostgreSQL)
- [ ] Agregar tests básicos para `ai-analyzer.js` y `clickup-service.js`
- [ ] Autenticación de usuarios

