import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Helper to load skill content (SKILL.md)
const getSkillPrompt = (skillName) => {
  try {
    const skillPath = path.resolve(__dirname, '../../skills', skillName, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      return fs.readFileSync(skillPath, 'utf-8');
    }
    return null;
  } catch (error) {
    console.error(`Error loading skill ${skillName}:`, error);
    return null;
  }
};

// Lazy-loaded OpenAI client
let openaiClient = null;
const getOpenAI = (apiKeyOverride = null) => {
    let apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (apiKey) apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');

    if (apiKeyOverride || !openaiClient) {
        if (!apiKey) {
             if (!process.env.OPENAI_API_KEY) return null;
             apiKey = process.env.OPENAI_API_KEY;
        }
        return new OpenAI({ apiKey });
    }
    return openaiClient;
};

// --- CORE FUNCTIONS ---

export async function analyzeTranscript(transcript, apiKey = null) {
  const client = getOpenAI(apiKey);
  if (!client) throw new Error('OpenAI API key not configured in settings.');

  const skillPrompt = getSkillPrompt('ghl-onboarding-mapper');
  
  // Base prompt if skill file is missing
  const defaultPrompt = `Eres un experto analista de negocios GHL. Analiza la transcripción y extrae JSON.`;
  
  const systemPrompt = skillPrompt ? `${skillPrompt}\n\nIMPORTANT: At the end of your response, provide a JSON object wrapped in \`\`\`json tags containing: clientName, niche, painPoints (array), objectives (array), complexity, implementationType, currentSituation.` : defaultPrompt;

  const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza la siguiente transcripción:\n\n${transcript}` }
      ],
      // Use json_object only if we are sure we want strictly JSON. 
      // But the skill returns a full Roadmap + JSON. So we don't force JSON mode here.
      temperature: 0.3
  });

  const content = response.choices[0].message.content;
  
  // Extract JSON part
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  let analysisData = {};
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      analysisData = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('Failed to parse JSON from AI response');
    }
  }

  return {
    ...analysisData,
    roadmap: content, // The full detailed roadmap from the skill
    clientName: analysisData.clientName || 'Nuevo Proyecto'
  };
}

export async function askHormoziQuestion(context, previousAnswers = [], apiKey = null) {
    const client = getOpenAI(apiKey);
    if (!client) throw new Error('OpenAI API key required');

    const messages = [
        { 
          role: 'system', 
          content: `Eres un Arquitecto GHL. Haz preguntas técnicas (máx 3). Responde en JSON: {"question": "..."} o {"ready": true}.` 
        },
        { role: 'user', content: `Contexto:\n${JSON.stringify(context, null, 2)}` }
    ];

    for (const qa of previousAnswers) {
        messages.push({ role: 'assistant', content: qa.question });
        messages.push({ role: 'user', content: qa.answer });
    }

    const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content);
}

export async function generateProjectStructure(analysis, answers, apiKey = null) {
    const client = getOpenAI(apiKey);
    if (!client) throw new Error('OpenAI API key required');

    const roadmapContext = analysis.roadmap || JSON.stringify(analysis);

    const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
            { 
              role: 'system', 
              content: `Eres un Project Manager. Convierte este roadmap/análisis en una estructura de semanas y tareas para ClickUp. Responde estrictamente en JSON: {"weeks": [{"weekNumber": 1, "name": "Week Title", "focus": "...", "tasks": [{"name": "...", "description": "...", "status": "OPEN", "estimate": "2h"}]}]}` 
            },
            {
                role: 'user',
                content: `Roadmap/Contexto:\n${roadmapContext}\n\nRespuestas:\n${JSON.stringify(answers)}`
            }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
    });

    return JSON.parse(response.choices[0].message.content);
}

export async function generateQuotation(analysis, projectStructure, apiKey = null) {
    const client = getOpenAI(apiKey);
    if (!client) throw new Error('OpenAI API key required');

    const skillPrompt = getSkillPrompt('ghl-cotizador');
    const roadmap = analysis.roadmap || JSON.stringify(analysis);

    const systemPrompt = skillPrompt 
      ? `${skillPrompt}\n\nIMPORTANT: Return a JSON object wrapped in \`\`\`json tags with: html (the professional quote), investment (total number), timeline, solutions (array), painPoints (array), roi (object).`
      : `Eres un experto en cotización GHL. Genera JSON con: investment, timeline, solutions, painPoints, roi, html.`;

    const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Genera la cotización basada en este Roadmap:\n${roadmap}`
            }
        ],
        temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }

    // Fallback if no JSON blocks found
    return { html: content, investment: 0, timeline: 'Por definir' };
}

export async function generateGHLDocumentation(analysis, projectStructure, answers, apiKey = null) {
    const client = getOpenAI(apiKey);
    const roadmap = analysis.roadmap || JSON.stringify(analysis);

    const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
            { role: 'system', content: 'Genera documentación técnica en Markdown basada en el roadmap y estructura del proyecto.' },
            {
                role: 'user',
                content: `Roadmap:\n${roadmap}\n\nEstructura:\n${JSON.stringify(projectStructure)}`
            }
        ],
        temperature: 0.2
    });

    return response.choices[0].message.content;
}