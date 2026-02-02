import OpenAI from 'openai';

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

// ... (PROMPTS remain the same) ...

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
