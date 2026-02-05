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
    // Fixed path casing and possible variations ('Skills' is the actual folder name)
    const skillPath = path.resolve(__dirname, '../../Skills', skillName, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      return fs.readFileSync(skillPath, 'utf-8');
    }
    // Fallback search if 'Skills' case fails (though it should be capital on this system)
    const altPath = path.resolve(__dirname, '../../skills', skillName, 'SKILL.md');
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath, 'utf-8');
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

  const mapperSkill = getSkillPrompt('ghl-onboarding-mapper');
  const cotizadorSkill = getSkillPrompt('ghl-cotizador');

  const systemPrompt = `
Eres un experto Arquitecto de Soluciones GHL y Analista de Negocios.
Tu tarea es analizar una transcripción de una llamada de onboarding y extraer los componentes clave basándote en la metodología de implementación GHL.

### METODOLOGÍA DE MAPEADO (Roadmap):
${mapperSkill || 'Analiza los puntos de dolor, objetivos y complejidad técnica.'}

### CRITERIOS DE SOLUCIÓN Y MÓDULOS (Cotización):
${cotizadorSkill || 'Considera CRM, Workflows, Chatbots, Landings e Integraciones.'}

DEBES responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "clientName": "Nombre del cliente/empresa",
  "niche": "Nicho de mercado",
  "painPoints": [{"id": 1, "text": "descripción", "severity": "high|medium|low", "category": "Categoría"}],
  "objectives": ["Objetivo 1", "Objetivo 2"],
  "complexity": 1-10 (número),
  "implementationType": "Tipo de implementación (Basado en la tabla de paquetes si es posible)",
  "currentSituation": "Resumen breve de la situación actual",
  "roadmap": "Aquí pon TODO el análisis detallado del Roadmap en formato Markdown (extenso y profesional siguiendo la nomenclatura LS/SP/AP del mapper)"
}
`;

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analiza la siguiente transcripción:\n\n${transcript}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const data = JSON.parse(response.choices[0].message.content);

    // Normalización de campos para asegurar compatibilidad con el frontend
    return {
      id: data.id || `proj_${Date.now()}`,
      clientName: data.clientName || data.nombre_cliente || data.nombre || 'Nuevo Proyecto',
      niche: data.niche || data.nicho || 'GHL Implementation',
      painPoints: data.painPoints || data.dolores || data.puntos_dolor || [],
      objectives: data.objectives || data.objetivos || [],
      complexity: data.complexity || data.complejidad || 5,
      implementationType: data.implementationType || data.tipo_implementacion || 'Setup Estándar',
      currentSituation: data.currentSituation || data.situacion_actual || '',
      roadmap: data.roadmap || data.contenido || ''
    };
  } catch (error) {
    console.error('Error in analyzeTranscript:', error);
    throw error;
  }
}

export async function askHormoziQuestion(context, previousAnswers = [], apiKey = null) {
  const client = getOpenAI(apiKey);
  if (!client) throw new Error('OpenAI API key required');

  const mapperSkill = getSkillPrompt('ghl-onboarding-mapper');

  const messages = [
    {
      role: 'system',
      content: `Eres un Arquitecto GHL experto en la metodología de implementación. 
      Haz preguntas técnicas (máx 3) para profundizar en los detalles necesarios para el mapeado LS/SP/AP.
      
      ### REGLAS DE MAPEADO:
      ${mapperSkill || 'Foco en Pipelines, Workflows y Asset Inventory.'}
      
      Responde en JSON: {"question": "..."} o {"ready": true}.`
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

  const mapperSkill = getSkillPrompt('ghl-onboarding-mapper');
  const roadmapContext = analysis.roadmap || JSON.stringify(analysis);

  const response = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Eres un experto Project Manager GHL (Arquitecto de Implementación). 
Tu objetivo es convertir un Roadmap técnico en una estructura de proyecto por fases/semanas ejecutable, siguiendo los estándares de nomenclatura y fases del mapper.

### ESTÁNDARES DE IMPLEMENTACIÓN:
${mapperSkill || 'Usa fases lógicas: Setup -> Pipelines -> Workflows -> Testing.'}
              
DEBES responder con un objeto JSON con esta estructura exacta:
{
  "weeks": [
    {
      "weekNumber": 1,
      "name": "Fase 1 — Setup base + Arquitectura MVP",
      "focus": "Objetivo principal de esta semana/fase",
      "tasks": [
        {
          "name": "Nombre de la tarea específica",
          "description": "Explicación técnica clara de qué se hará en GHL",
          "estimate": "2h"
        }
      ]
    }
  ],
  "totalDuration": "8 semanas",
  "totalTasks": 36,
  "totalHours": 120
}

REGLAS CRÍTICAS: 
- La estructura debe seguir un orden lógico de implementación GHL (Setup, CRM, Automatizaciones, Integraciones, Reporting, Go-Live).
- Crea entre 4 y 12 semanas según la complejidad. Si el proyecto es complejo, usa 8-12 semanas.
- Utiliza nombres de fase profesionales como: "Fase 2 — Captura de leads + UTMs/Attribution", "Fase 3 — WhatsApp API inbound + Conversational AI".
- Cada tarea debe ser específica para GHL.
- Calcula el total de horas estimadas y tareas de forma realista.
- Responde ÚNICAMENTE el JSON.`
      },
      {
        role: 'user',
        content: `Roadmap/Contexto:\n${roadmapContext}\n\nRespuestas técnicas adicionales:\n${JSON.stringify(answers)}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  const data = JSON.parse(response.choices[0].message.content);

  // Normalización para asegurar que siempre haya semanas
  return {
    weeks: data.weeks || data.semanas || [],
    totalDuration: data.totalDuration || `${(data.weeks || []).length} semanas`,
    totalTasks: data.totalTasks || (data.weeks || []).reduce((acc, w) => acc + (w.tasks?.length || 0), 0),
    totalHours: data.totalHours || (data.weeks || []).reduce((acc, w) => acc + (w.tasks?.reduce((tAcc, t) => tAcc + parseInt(t.estimate || 0), 0) || 0), 0)
  };
}

export async function generateQuotation(analysis, projectStructure, apiKey = null) {
  const client = getOpenAI(apiKey);
  if (!client) throw new Error('OpenAI API key required');

  const skillPrompt = getSkillPrompt('ghl-cotizador');
  const roadmap = analysis.roadmap || JSON.stringify(analysis);
  const weeksCount = projectStructure?.length || 4;
  const tasksCount = projectStructure?.reduce((t, w) => t + (w.tasks?.length || 0), 0) || 10;

  const systemPrompt = `${skillPrompt || 'Eres un cotizador experto en implementaciones GHL.'}

IMPORTANTE: Calcula y devuelve un JSON con estos campos EXACTOS:
- investment: número (SOLO el costo de setup/implementación, SIN incluir fees mensuales)
- monthlyFee: número (costo mensual de mantenimiento GHL si aplica, típicamente $97-$497)
- timeline: string (ej: "6-8 semanas")
- roi: objeto con { multiplier: número, description: string }
- solutions: array de strings (máximo 5 soluciones clave)
- painPoints: array de strings (máximo 3 dolores que resuelve)
- html: string HTML con el desglose profesional de la cotización

El JSON debe ir envuelto en \`\`\`json bloques.

Referencia de precios base:
- Setup básico CRM: $1,200 - $2,500
- Setup con Automatizaciones: $2,500 - $5,000
- Setup con IA Conversacional: $4,000 - $8,000
- Por semana de trabajo: ~$800-1,200
- Total de ${weeksCount} semanas y ${tasksCount} tareas sugiere un proyecto de complejidad media-alta.`;

  const response = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Genera la cotización basada en este Roadmap:\n${roadmap}\n\nEstructura del proyecto:\n${JSON.stringify(projectStructure)}`
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
  return {
    html: content,
    investment: weeksCount * 800,
    monthlyFee: 97,
    timeline: `${weeksCount} semanas`,
    roi: { multiplier: 3, description: 'ROI estimado' }
  };
}

export async function generateGHLDocumentation(analysis, projectStructure, answers, apiKey = null) {
  const client = getOpenAI(apiKey);
  const mapperSkill = getSkillPrompt('ghl-onboarding-mapper');
  const roadmap = analysis.roadmap || JSON.stringify(analysis);

  const response = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Genera documentación técnica en Markdown basada en el roadmap y estructura del proyecto. 
        Asegúrate de seguir los estándares de nomenclatura (LS/SP/AP) definidos en la metodología.
        
        ### ESTÁNDARES:
        ${mapperSkill || 'Usa nomenclatura estándar GHL.'}`
      },
      {
        role: 'user',
        content: `Roadmap:\n${roadmap}\n\nEstructura:\n${JSON.stringify(projectStructure)}`
      }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content;
}