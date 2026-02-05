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

  // Step 1: Use AI to extract structured scope from analysis
  const scopePrompt = `Analiza el siguiente roadmap/análisis y extrae los módulos GHL necesarios en formato JSON estructurado.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones.

Estructura requerida:
{
  "cliente": "nombre del cliente",
  "setup_subcuenta": "completo",
  "pipelines": [{"nombre": "Sales Pipeline", "etapas": 7}],
  "workflows": [{"nombre": "LS01 Widget Chat", "nodos": 8}],
  "chatbots": [{"nombre": "WhatsApp Bot", "nodos": 12, "ia_avanzada": true}],
  "integraciones": 2,
  "landing_pages": [{"nombre": "Landing Principal", "secciones": 7}],
  "reportes": true,
  "sesiones_capacitacion": 1,
  "soporte": true
}

Roadmap a analizar:
${analysis.roadmap || JSON.stringify(analysis)}`;

  let scope = {};
  try {
    const scopeResponse = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'Eres un experto en extraer scope técnico de proyectos GHL. Responde SOLO JSON.' },
        { role: 'user', content: scopePrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    });
    scope = JSON.parse(scopeResponse.choices[0].message.content);
  } catch (e) {
    console.warn('Failed to extract scope, using defaults:', e.message);
    scope = {
      cliente: analysis.clientName || 'Cliente',
      setup_subcuenta: 'completo',
      pipelines: [{ nombre: 'Pipeline Principal', etapas: 7 }],
      workflows: [],
      chatbots: [],
      integraciones: 0,
      landing_pages: [],
      reportes: false,
      sesiones_capacitacion: 1,
      soporte: true
    };
  }

  // Step 2: Calculate pricing using cotizador logic (JS port)
  const cotizacion = calcularCotizacion(scope);

  // Return full quotation object
  return {
    cliente: scope.cliente || analysis.clientName,
    scope: scope,
    ...cotizacion,
    // Legacy fields for backwards compatibility
    investment: cotizacion.a_la_carte?.setup || 0,
    monthlyFee: cotizacion.a_la_carte?.mensual || 0,
    timeline: `${projectStructure?.length || 4} semanas`,
    roi: { multiplier: 3, description: 'ROI estimado basado en eficiencia operativa' }
  };
}

// ── COTIZADOR GHL (JS Port) ─────────────────────────────────────────────────

const MODULOS = {
  crm: { nombre: "CRM & Pipelines", base: 250, mensual: 0, factores: { pipelines: { limite: 2, extra: 60 }, etapas: { limite: 5, extra: 15 } } },
  workflows: { nombre: "Automatizaciones & Workflows", base: 350, mensual: 0, factores: { workflows: { limite: 3, extra: 70 }, nodos: { limite: 8, extra: 12 } } },
  chatbot: { nombre: "Chatbot / AI Chat", base: 400, mensualPorUnidad: 80, factores: { chatbots: { limite: 1, extra: 200 }, nodos: { limite: 10, extra: 15 }, ia_avanzada: { precio: 150 } } },
  integraciones: { nombre: "Integraciones Externas", base: 300, mensualPorUnidad: 50, factores: { integraciones: { limite: 1, extra: 300 } } },
  landing: { nombre: "Landing Pages", base: 450, mensual: 0, factores: { pages: { limite: 1, extra: 300 }, secciones: { limite: 5, extra: 40 } } },
  reportes: { nombre: "Reportes & Dashboards", base: 250, mensual: 60 },
  soporte: { nombre: "Soporte Post-Implementación", mensual: 150 }
};

const SETUP_SUBCUENTA = { completo: 250, validacion: 100 };

const PAQUETES = {
  Starter: { setup: 900, mensual: 150, limites: { crm: { pipelines: 2, etapas: 5 }, workflows: { workflows: 3, nodos: 8 }, capacitacion: 1, soporte: true } },
  Pro: { setup: 1800, mensual: 280, limites: { crm: { pipelines: 2, etapas: 7 }, workflows: { workflows: 6, nodos: 10 }, chatbot: { chatbots: 1, nodos: 10 }, capacitacion: 2, soporte: true } },
  Enterprise: { setup: 3200, mensual: 400, limites: { crm: { pipelines: 2, etapas: 7 }, workflows: { workflows: 6, nodos: 10 }, chatbot: { chatbots: 1, nodos: 10 }, integraciones: 2, landing: { pages: 1, secciones: 6 }, reportes: true, capacitacion: 3, soporte: true } }
};

function cotizarALaCarte(scope) {
  let setupTotal = 0;
  let mensualTotal = 0;
  const desglose = [];

  // Setup de subcuenta
  const tipoSetup = scope.setup_subcuenta || 'completo';
  const precioSetup = SETUP_SUBCUENTA[tipoSetup] || 250;
  setupTotal += precioSetup;
  desglose.push({ modulo: "Setup de Subcuenta", setup: precioSetup, mensual: 0, detalle: [`Tipo: ${tipoSetup} (DNS + dominio + WhatsApp + correos)`] });

  // CRM & Pipelines
  if (scope.pipelines?.length > 0) {
    let base = MODULOS.crm.base;
    const detalle = [];
    const cantPip = scope.pipelines.length;
    detalle.push(`Base (${cantPip} pipelines, 5 etapas c/u)`);

    if (cantPip > 2) {
      const extra = (cantPip - 2) * 60;
      base += extra;
      detalle.push(`${cantPip - 2} pipeline(s) extra → +$${extra}`);
    }

    for (const p of scope.pipelines) {
      if ((p.etapas || 0) > 5) {
        const extra = (p.etapas - 5) * 15;
        base += extra;
        detalle.push(`Pipeline '${p.nombre}': ${p.etapas - 5} etapa(s) extra (${p.etapas} total) → +$${extra}`);
      }
    }

    setupTotal += base;
    desglose.push({ modulo: "CRM & Pipelines", setup: base, mensual: 0, detalle });
  }

  // Workflows
  if (scope.workflows?.length > 0) {
    let base = MODULOS.workflows.base;
    const detalle = [];
    const cantWf = scope.workflows.length;
    detalle.push(`Base (${Math.min(3, cantWf)} workflows, 8 nodos c/u)`);

    if (cantWf > 3) {
      const extra = (cantWf - 3) * 70;
      base += extra;
      detalle.push(`${cantWf - 3} workflow(s) extra (${cantWf} total) → +$${extra}`);
    }

    // Check for workflows within limit that have excess nodes
    let allWithinNodeLimit = true;
    for (const wf of scope.workflows) {
      if ((wf.nodos || 0) > 8) {
        allWithinNodeLimit = false;
        const extra = (wf.nodos - 8) * 12;
        base += extra;
        detalle.push(`Workflow '${wf.nombre}': ${wf.nodos - 8} nodo(s) extra → +$${extra}`);
      }
    }
    if (allWithinNodeLimit && cantWf <= 3) {
      detalle.push(`Nota: todos los workflows quedan dentro del límite de 8 nodos c/u → sin extras por nodos`);
    }

    setupTotal += base;
    desglose.push({ modulo: "Automatizaciones & Workflows", setup: base, mensual: 0, detalle });
  }

  // Chatbot
  if (scope.chatbots?.length > 0) {
    let base = MODULOS.chatbot.base;
    let mensual = 0;
    const detalle = [];
    const cantCb = scope.chatbots.length;
    const totalNodos = scope.chatbots.reduce((t, c) => t + (c.nodos || 0), 0);

    detalle.push(`Base (1 chatbot, 10 nodos)`);

    if (cantCb > 1) {
      const extra = (cantCb - 1) * 200;
      base += extra;
      detalle.push(`${cantCb - 1} chatbot(s) extra → +$${extra}`);
    }

    for (const cb of scope.chatbots) {
      if ((cb.nodos || 0) > 10) {
        const extra = (cb.nodos - 10) * 15;
        base += extra;
        detalle.push(`${cb.nodos - 10} nodos extra (${cb.nodos} total) → +$${extra}`);
      }
      if (cb.ia_avanzada) {
        base += 150;
        detalle.push(`IA generativa avanzada → +$150`);
      }
    }

    mensual = cantCb * 80;
    detalle.push(`Mensual: ${cantCb} chatbot activo × $80`);

    setupTotal += base;
    mensualTotal += mensual;
    desglose.push({ modulo: "Chatbot / AI Chat", setup: base, mensual, detalle });
  }

  // Integraciones
  if ((scope.integraciones || 0) > 0) {
    let base = MODULOS.integraciones.base;
    const detalle = [];
    const cant = scope.integraciones;

    detalle.push(`Base (1 integración incluida)`);

    if (cant > 1) {
      const extra = (cant - 1) * 300;
      base += extra;
      detalle.push(`${cant - 1} integración extra (WhatsApp API + UTM tracking) → +$${extra}`);
    }

    const mensual = cant * 50;
    detalle.push(`Mensual: ${cant} integraciones activas × $50`);

    setupTotal += base;
    mensualTotal += mensual;
    desglose.push({ modulo: "Integraciones Externas", setup: base, mensual, detalle });
  }

  // Landing Pages
  if (scope.landing_pages?.length > 0) {
    let base = MODULOS.landing.base;
    const detalle = [];
    const cantPages = scope.landing_pages.length;

    detalle.push(`Base (1 page, 5 secciones)`);

    if (cantPages > 1) {
      const extra = (cantPages - 1) * 300;
      base += extra;
      detalle.push(`${cantPages - 1} page(s) extra → +$${extra}`);
    }

    for (const page of scope.landing_pages) {
      if ((page.secciones || 0) > 5) {
        const extra = (page.secciones - 5) * 40;
        base += extra;
        detalle.push(`${page.secciones - 5} secciones extra (${page.secciones} total) → +$${extra}`);
      }
    }

    setupTotal += base;
    desglose.push({ modulo: "Landing Pages", setup: base, mensual: 0, detalle });
  }

  // Reportes
  if (scope.reportes) {
    setupTotal += 250;
    mensualTotal += 60;
    desglose.push({ modulo: "Reportes & Dashboards", setup: 250, mensual: 60, detalle: ["Dashboard de atribución y métricas"] });
  }

  // Soporte
  if (scope.soporte) {
    mensualTotal += 150;
    desglose.push({ modulo: "Soporte Post-Implementación", setup: 0, mensual: 150, detalle: ["Feed mensual de mantenimiento"] });
  }

  return { setup: setupTotal, mensual: mensualTotal, desglose };
}

function cotizarConPaquete(scope, nombrePaquete) {
  const paquete = PAQUETES[nombrePaquete];
  const tipoSetup = scope.setup_subcuenta || 'completo';
  const precioSetupSub = SETUP_SUBCUENTA[tipoSetup] || 250;

  // Calculate extras over package limits (simplified)
  let extrasSetup = 0;
  let extrasMensual = 0;

  // Check if scope elements exceed package limits
  if (scope.chatbots?.length && !paquete.limites.chatbot) {
    extrasSetup += MODULOS.chatbot.base + (scope.chatbots.some(c => c.ia_avanzada) ? 150 : 0);
    extrasMensual += scope.chatbots.length * 80;
  }

  if (scope.integraciones && !paquete.limites.integraciones) {
    extrasSetup += MODULOS.integraciones.base + ((scope.integraciones - 1) * 300);
    extrasMensual += scope.integraciones * 50;
  }

  if (scope.landing_pages?.length && !paquete.limites.landing) {
    extrasSetup += MODULOS.landing.base;
    for (const page of scope.landing_pages) {
      if ((page.secciones || 0) > 5) extrasSetup += (page.secciones - 5) * 40;
    }
  }

  if (scope.reportes && !paquete.limites.reportes) {
    extrasSetup += 250;
    extrasMensual += 60;
  }

  return {
    paquete: nombrePaquete,
    setup_subcuenta: precioSetupSub,
    setup_paquete: paquete.setup,
    extras_setup: extrasSetup,
    setup_total: precioSetupSub + paquete.setup + extrasSetup,
    mensual_paquete: paquete.mensual,
    extras_mensual: extrasMensual,
    mensual_total: paquete.mensual + extrasMensual
  };
}

function calcularCotizacion(scope) {
  const aLaCarte = cotizarALaCarte(scope);

  const todosPaquetes = ['Starter', 'Pro', 'Enterprise'].map(nombre => {
    const cot = cotizarConPaquete(scope, nombre);
    const ahorroSetup = aLaCarte.setup - cot.setup_total;
    const ahorroMensual = aLaCarte.mensual - cot.mensual_total;
    return {
      ...cot,
      ahorro_setup: ahorroSetup,
      ahorro_mensual: ahorroMensual,
      ahorro_total_primer_año: ahorroSetup + (ahorroMensual * 12)
    };
  });

  // Find best package (max savings in first year, if positive)
  const positivos = todosPaquetes.filter(p => p.ahorro_total_primer_año > 0);
  const mejorPaquete = positivos.length > 0
    ? positivos.reduce((a, b) => a.ahorro_total_primer_año > b.ahorro_total_primer_año ? a : b)
    : null;

  return {
    cliente: scope.cliente || 'Cliente',
    a_la_carte: aLaCarte,
    mejor_paquete: mejorPaquete,
    todos_paquetes: todosPaquetes,
    recomendacion: mejorPaquete
      ? { titulo: mejorPaquete.paquete, razon: `Ahorro de $${mejorPaquete.ahorro_total_primer_año} en el primer año.` }
      : { titulo: 'À la carte', razon: 'Ningún paquete genera ahorro significativo para este scope específico.' }
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