import OpenAI from 'openai';

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo';

const ANALYZER_PROMPT = `Eres un experto analista de negocios y consultor de GoHighLevel. Tu objetivo es analizar transcripciones de ventas para identificar:
1. Nombre del cliente y nicho.
2. Dolores principales (pain points) y su severidad (high, medium, low).
3. Objetivos del cliente.
4. Complejidad de la implementación (1-10).
5. Tipo de implementación sugerida (Setup, Full Build, Automation, etc.).
6. Situación actual.

Responde estrictamente en formato JSON con la siguiente estructura:
{
  "clientName": "Nombre o Empresa",
  "niche": "Nicho de mercado",
  "painPoints": [
    { "text": "Descripción del dolor", "severity": "high", "category": "Eficiencia/Ventas/Etc" }
  ],
  "objectives": ["Objetivo 1", "Objetivo 2"],
  "complexity": 5,
  "implementationType": "Nombre del servicio sugerido",
  "currentSituation": "Resumen de la situación actual"
}`;

const GHL_ARCHITECT_PROMPT = `Eres un Arquitecto de Soluciones GHL experto. Tu trabajo es hacer preguntas técnicas precisas para definir la estructura del proyecto en ClickUp.
El objetivo es clarificar dudas sobre integraciones, pipelines, automatizaciones complejas, o migración de datos.

Reglas:
1. Haz preguntas de una en una.
2. Máximo 3 preguntas en total (llevamos la cuenta).
3. Si ya tienes suficiente información para armar una estructura técnica sólida, responde con "ready": true.

Responde estrictamente en formato JSON:
{
  "question": "Tu pregunta técnica aquí..."
}
O si ya terminaste:
{
  "ready": true
}`;

const PROJECT_GENERATOR_PROMPT = `Eres un Project Manager experto en implementaciones de GoHighLevel y uso de ClickUp.
Tu objetivo es generar una estructura de proyecto detallada, dividida por semanas, para una implementación exitosa.

Basándote en el análisis y las respuestas técnicas, crea un plan de trabajo.

Responde estrictamente en formato JSON con esta estructura:
{
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Setup Base & Integraciones",
      "tasks": [
        { "name": "Configurar Sub-Account", "description": "Crear subcuenta y configurar twilio/mailgun", "status": "OPEN", "estimate": "2h" },
        { "name": "Integrar Stripe", "description": "Conectar pasarela de pagos", "status": "OPEN", "estimate": "1h" }
      ]
    },
    ...
  ]
}`;

const GHL_DOCUMENTATION_PROMPT = `Eres un Technical Writer experto en documentación de software y GoHighLevel.
Genera una documentación técnica clara y estructurada para el equipo de implementación.
Usa formato Markdown.

Estructura requerida:
# Documentación del Proyecto: [Cliente]

## 1. Resumen Ejecutivo
...

## 2. Arquitectura de Pipelines
- Pipeline de Ventas: Etapas [Stage 1, Stage 2...]
...

## 3. Automatizaciones Clave (Workflows)
- Workflow 1: Trigger -> Acción
...

## 4. Integraciones y Configuración
...

## 5. Diccionario de Datos (Custom Fields)
...`;

// Lazy-loaded OpenAI client
let openaiClient = null;
const getOpenAI = (apiKeyOverride = null) => {
    let apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (apiKey) apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');

    // If we have a new key that differs from the existing client's key (if any), create a new one
    // Or if we don't have a client yet
    if (apiKeyOverride || !openaiClient) {
        if (!apiKey) {
             // Only throw if we absolutely have no key from anywhere
             if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env file or pass it in the request.');
             }
             // Fallback to env var if override was null/empty but env var exists
             apiKey = process.env.OPENAI_API_KEY;
        }
        
        return new OpenAI({ apiKey });
    }
    
    return openaiClient;
};

export async function analyzeTranscript(transcript, apiKey = null) {
    const response = await getOpenAI(apiKey).chat.completions.create({
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

export async function askHormoziQuestion(context, previousAnswers = [], apiKey = null) {
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

    const response = await getOpenAI(apiKey).chat.completions.create({
        model: AI_MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content);
}

export async function generateProjectStructure(analysis, answers, apiKey = null) {
    const response = await getOpenAI(apiKey).chat.completions.create({
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

export async function generateGHLDocumentation(analysis, projectStructure, answers, apiKey = null) {
    const response = await getOpenAI(apiKey).chat.completions.create({
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

export async function generateQuotation(analysis, projectStructure, apiKey = null) {
    const response = await getOpenAI(apiKey).chat.completions.create({
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