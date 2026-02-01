import OpenAI from 'openai';

// Lazy-loaded OpenAI client
let openaiClient = null;
const getOpenAI = () => {
    if (!openaiClient && process.env.OPENAI_API_KEY) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    if (!openaiClient) {
        throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env file.');
    }
    return openaiClient;
};

// Configurable model - defaults to gpt-5.2
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2';

// System prompts
const ANALYZER_PROMPT = `Eres un experto en análisis de implementaciones de Go High Level (GHL).

Tu trabajo es analizar la información proporcionada (que puede incluir transcripciones de llamadas y contenido extraído de documentos adjuntos como PDFs o archivos Word).

Presta especial atención a los requisitos técnicos o diagramas de flujo descritos en los documentos adjuntos.

Responde SIEMPRE en el siguiente formato JSON exacto:
{
  "clientName": "Nombre del cliente o empresa (si no se menciona, usa 'Cliente')",
  "niche": "Nicho o industria del cliente (ej: inmobiliaria, coaching, ecommerce)",
  "painPoints": ["Problema 1", "Problema 2", "..."],
  "currentSituation": "Descripción de cómo opera actualmente",
  "objectives": ["Objetivo 1", "Objetivo 2", "..."],
  "complexity": 7,
  "implementationType": "Tipo de proyecto (setup básico, automatizaciones, integraciones API, SAAS, etc.)"
}`;

const GHL_ARCHITECT_PROMPT = `Eres un Arquitecto Senior en implementaciones de Go High Level. Tu objetivo es definir con precisión la arquitectura técnica de la subcuenta del cliente.

Tu estilo es profesional, directo y técnico. Te enfocas exclusivamente en la infraestructura GHL:
- Estructura de Pipelines (etapas lógicas).
- Custom Fields necesarios para segmentación.
- Lógica de Automatizaciones (Workflows).
- Integraciones con herramientas externas.

Reglas del chat:
1. Tu primera intervención siempre debe validar el análisis inicial y preguntar algo técnico.
2. MÁXIMO 3 PREGUNTAS EN TOTAL. Sé muy eficiente.
3. No pidas métricas de marketing (leads, CPA, etc), enfócate en CÓMO construirlo en GHL.
4. Si el usuario te da instrucciones, intégralas.
5. Después de la 3ra respuesta del usuario, o si el usuario dice "listo" o similar, responde con { "ready": true }.
6. Si ya tienes suficiente información para armar el proyecto antes de las 3 preguntas, también puedes responder { "ready": true }.

DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON:
{ "question": "Tu pregunta técnica aquí" } ó { "ready": true }`;

const PROJECT_GENERATOR_PROMPT = `Eres un experto en ingeniería de procesos para Go High Level. 
A partir de la transcripción y de la conversación con el arquitecto, genera un desglose técnico detallado del proyecto.

Reglas de salida:
1. La primera "semana" o fase DEBE llamarse "📜 PLANIFICACIÓN Y DOC".
2. Incluye una tarea llamada "Documento de Proyecto" que contenga en su descripción: Resumen Ejecutivo, Objetivos y Alcance.
3. Incluye una tarea llamada "Especificaciones Técnicas" que detalle: Nombres de Pipelines, Listado de Custom Fields y Lógica de Workflows.
4. Para CADA tarea, incluye metadatos técnicos en el campo "metadata":
   - "field_type": (si aplica, ej: 'Workflow', 'Custom Field', 'Pipeline', 'Integration').
   - "priority_ghl": (Del 1 al 3, donde 1 es bloqueante técnico).

Responde EXCLUSIVAMENTE en formato JSON:
{
  "weeks": [
    {
      "name": "Nombre de la fase/semana",
      "tasks": [
        { 
          "name": "Nombre tarea", 
          "description": "Descripción técnica detallada", 
          "estimatedHours": 2,
          "metadata": { "field_type": "Workflow", "priority_ghl": 2 }
        }
      ]
    }
  ]
}`;

const GHL_DOCUMENTATION_PROMPT = `Eres un Documentador Técnico Senior para implementaciones de Go High Level. 
Tu objetivo es crear un Blueprint técnico detallado para el proyecto aprobado basándote en la estructura definida y el análisis previo.

Estructura requerida (Markdown):
1. **Estructura de Pipelines**: Nombres exactos y desglose de cada etapa.
2. **Lógica de Workflows**: Disparadores (triggers), condiciones (IF/THEN) y acciones específicas (SMS, Email, Webhooks, etc).
3. **Movimiento de Leads**: Cómo fluye un contacto desde la captura hasta el cierre o pérdida, especificando cambios de pipeline si aplica.
4. **Campos y Etiquetas**: 
    - Listado de Custom Fields con su tipo (Texto, Dropdown, etc).
    - Nomenclatura de Tags recomendada para este proyecto.
5. **Puntos de Integración**: Detalles sobre APIs, Webhooks o herramientas de terceros.

Usa un tono de ingeniería, muy preciso y fácil de seguir para el equipo de implementación.`;

export async function analyzeTranscript(transcript) {
    const response = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages: [
            { role: 'system', content: ANALYZER_PROMPT },
            { role: 'user', content: `Analiza la siguiente transcripción de una llamada de venta:\n\n${transcript}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
}

export async function askHormoziQuestion(context, previousAnswers = []) {
    const messages = [
        { role: 'system', content: GHL_ARCHITECT_PROMPT },
        { role: 'user', content: `Contexto del cliente:\n${JSON.stringify(context, null, 2)}` }
    ];

    for (const qa of previousAnswers) {
        messages.push({ role: 'assistant', content: qa.question });
        messages.push({ role: 'user', content: qa.answer });
    }

    messages.push({
        role: 'user', content: `Llevamos ${previousAnswers.length} preguntas de un máximo de 3. 
    Genera la siguiente pregunta técnica más relevante para definir la estructura en GHL, 
    o responde con {"ready": true} si ya tienes suficiente información o si ya alcanzamos el límite.` });

    const response = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content);
}

export async function generateProjectStructure(analysis, answers) {
    const response = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages: [
            { role: 'system', content: PROJECT_GENERATOR_PROMPT },
            {
                role: 'user',
                content: `Genera la estructura del proyecto basándote en:
        
Análisis del cliente:
${JSON.stringify(analysis, null, 2)}

Respuestas del cuestionario:
${JSON.stringify(answers, null, 2)}

Genera un JSON con la estructura completa del proyecto para ClickUp.`
            }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
    });

    return JSON.parse(response.choices[0].message.content);
}

export async function generateGHLDocumentation(analysis, projectStructure, answers) {
    const response = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages: [
            { role: 'system', content: GHL_DOCUMENTATION_PROMPT },
            {
                role: 'user',
                content: `Genera la documentación técnica detallada basándote en:
        
Análisis del cliente:
${JSON.stringify(analysis, null, 2)}

Estructura del proyecto:
${JSON.stringify(projectStructure, null, 2)}

Respuestas del Arquitecto:
${JSON.stringify(answers, null, 2)}

Responde en formato Markdown directo.`
            }
        ],
        temperature: 0.2
    });

    return response.choices[0].message.content;
}

export async function generateQuotation(analysis, projectStructure) {
    const response = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages: [
            {
                role: 'system', content: `Eres un experto en cotización de proyectos de implementación GHL. 
Basándote en la complejidad, horas estimadas y tipo de proyecto, genera una cotización profesional.

Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
{
  "painPoints": ["Dolor 1 refinado para propuesta", "Dolor 2..."],
  "solutions": ["Solución 1 específica", "Solución 2..."],
  "investment": 1500,
  "timeline": "4 semanas",
  "paymentOptions": "Desglose de pagos",
  "roi": {
    "leadsPerMonth": 100,
    "currentCloseRate": 10,
    "projectedCloseRate": 20,
    "avgTicket": 500
  }
}` },
            {
                role: 'user',
                content: `Genera cotización para:
        
Análisis: ${JSON.stringify(analysis, null, 2)}
Estructura del proyecto: ${JSON.stringify(projectStructure, null, 2)}`
            }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
}
