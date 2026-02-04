import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {
  analyzeTranscript,
  askHormoziQuestion,
  generateProjectStructure,
  generateQuotation,
  generateGHLDocumentation
} from './services/ai-analyzer.js';
import { executeSkill } from './services/skill-service.js';
import { createClickUpProject, updateTaskStatus } from './services/clickup-service.js';
import { extractTextFromFile } from './services/file-service.js';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- PROJECT MANAGEMENT ENDPOINTS ---

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    if (!db) return res.json([]); // Return empty list if no DB
    const projects = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
    // Parse JSON fields
    const parsed = projects.map(p => ({
      ...p,
      analysis: p.analysis ? JSON.parse(p.analysis) : null,
      weeks: p.weeks ? JSON.parse(p.weeks) : [],
      answers: p.answers ? JSON.parse(p.answers) : []
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  try {
    if (!db) return res.status(404).json({ error: 'Project not found (No DB)' });
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    res.json({
      ...project,
      analysis: project.analysis ? JSON.parse(project.analysis) : null,
      weeks: project.weeks ? JSON.parse(project.weeks) : [],
      answers: project.answers ? JSON.parse(project.answers) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
app.post('/api/projects', (req, res) => {
  try {
    const { name, clientName, niche, analysis, weeks, status } = req.body;
    const id = uuidv4();

    if (db) {
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, clientName, niche, analysis, weeks, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        name || clientName || 'Nuevo Proyecto',
        clientName,
        niche,
        JSON.stringify(analysis || null),
        JSON.stringify(weeks || []),
        status || 'analysis'
      );
    }

    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
app.put('/api/projects/:id', (req, res) => {
  try {
    const { name, clientName, niche, complexity, status, analysis, weeks, answers, documentation } = req.body;

    if (!db) return res.json({ success: true, message: 'No DB connected' });

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (clientName !== undefined) { fields.push('clientName = ?'); values.push(clientName); }
    if (niche !== undefined) { fields.push('niche = ?'); values.push(niche); }
    if (complexity !== undefined) { fields.push('complexity = ?'); values.push(complexity); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (analysis !== undefined) { fields.push('analysis = ?'); values.push(JSON.stringify(analysis)); }
    if (weeks !== undefined) { fields.push('weeks = ?'); values.push(JSON.stringify(weeks)); }
    if (answers !== undefined) { fields.push('answers = ?'); values.push(JSON.stringify(answers)); }
    if (documentation !== undefined) { fields.push('documentation = ?'); values.push(documentation); }

    fields.push('updatedAt = CURRENT_TIMESTAMP');

    if (fields.length === 1) return res.json({ success: true, message: 'No changes' });

    const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });

    res.json({ success: true });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  try {
    if (db) db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI & EXTERNAL SERVICES ---

// File upload and text extraction
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

// Analyze transcript - extracts pain points, complexity, scope
app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, apiKey } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Debug: log which key source we're using
    const envKey = process.env.OPENAI_API_KEY;
    const finalKey = apiKey || envKey;
    console.log(`[Analyze] Using API key from: ${apiKey ? 'frontend' : 'env'}, key exists: ${!!finalKey}, length: ${finalKey?.length || 0}`);

    if (!finalKey) {
      return res.status(400).json({
        error: 'No OpenAI API key configured. Set OPENAI_API_KEY in Vercel environment variables or provide it in Settings.',
        debug: { envKeyExists: !!envKey, frontendKeyProvided: !!apiKey }
      });
    }

    const analysis = await analyzeTranscript(transcript, apiKey);

    // Auto-create project record
    const id = uuidv4();
    if (db) {
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, clientName, niche, complexity, analysis, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

      stmt.run(
        id,
        analysis.clientName || 'Nuevo Proyecto',
        analysis.clientName,
        analysis.niche,
        analysis.complexity,
        JSON.stringify(analysis),
        'analysis'
      );
    }

    res.json({ ...analysis, id });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hormozi-style questioning
app.post('/api/hormozi', async (req, res) => {
  try {
    const { context, previousAnswers, projectId, apiKey } = req.body;
    const response = await askHormoziQuestion(context, previousAnswers, apiKey);

    // Optional: save answers to project if projectId provided
    if (projectId && previousAnswers && db) {
      db.prepare('UPDATE projects SET answers = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(previousAnswers), projectId);
    }

    res.json(response);
  } catch (error) {
    console.error('Hormozi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute Skill (SaaS Integration)
app.post('/api/skills', async (req, res) => {
  try {
    const { skillName, input, apiKey } = req.body;

    if (!skillName || !input) {
      return res.status(400).json({ error: 'skillName and input are required' });
    }

    const result = await executeSkill(skillName, input, apiKey);
    res.json(result);
  } catch (error) {
    console.error(`Skill ${req.body.skillName} error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Generate project structure
app.post('/api/project-structure', async (req, res) => {
  try {
    const { analysis, answers, projectId, apiKey } = req.body;
    const structure = await generateProjectStructure(analysis, answers, apiKey);

    if (projectId && db) {
      db.prepare('UPDATE projects SET weeks = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(structure.weeks), 'created', projectId);
    }

    res.json(structure);
  } catch (error) {
    console.error('Project structure error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate quotation
app.post('/api/quotation', async (req, res) => {
  try {
    const { analysis, projectStructure, projectId, apiKey } = req.body;
    const quotation = await generateQuotation(analysis, projectStructure, apiKey);

    if (projectId && db) {
      db.prepare('UPDATE projects SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run('proposal', projectId);
    }

    res.json(quotation);
  } catch (error) {
    console.error('Quotation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Project Approval Flow (Now separated from ClickUp)
app.post('/api/project/document', async (req, res) => {
  try {
    const { analysis, projectStructure, answers, projectId, apiKey } = req.body;

    const documentation = await generateGHLDocumentation(analysis, projectStructure, answers, apiKey);

    if (projectId && db) {
      db.prepare('UPDATE projects SET documentation = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(documentation, 'approved', projectId);
    }

    res.json({
      success: true,
      message: 'Proyecto documentado y aprobado localmente',
      documentation
    });
  } catch (error) {
    console.error('❌ Documentation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Original approve endpoint (kept for backward compatibility or if needed)
app.post('/api/project/approve', async (req, res) => {
  try {
    const { analysis, projectStructure, answers, clickupConfig, projectId, apiKey } = req.body;

    const documentation = await generateGHLDocumentation(analysis, projectStructure, answers, apiKey);

    const projectWithDoc = {
      ...projectStructure,
      clientName: analysis?.clientName || projectStructure?.clientName || 'Nuevo Proyecto GHL',
      documentation
    };

    const isPlaceholder = (val) => !val || val.includes('***') || val.length < 5;
    const finalConfig = {
      apiToken: isPlaceholder(clickupConfig?.apiToken) ? process.env.CLICKUP_API_TOKEN : clickupConfig.apiToken,
      spaceId: isPlaceholder(clickupConfig?.spaceId) ? process.env.CLICKUP_SPACE_ID : clickupConfig.spaceId
    };

    const result = await createClickUpProject(projectWithDoc, finalConfig);

    if (projectId && db) {
      db.prepare('UPDATE projects SET documentation = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(documentation, 'approved', projectId);
    }

    res.json({
      success: true,
      message: 'Proyecto aprobado, documentado y exportado exitosamente',
      documentation,
      clickup: result.data
    });

  } catch (error) {
    console.error('❌ Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ClickUp Endpoints (keeping them for direct use if needed)
app.post('/api/clickup/create', async (req, res) => {
  try {
    const { projectData, clickupConfig } = req.body;
    const isPlaceholder = (val) => !val || val.includes('***') || val.length < 5;

    const finalConfig = {
      apiToken: isPlaceholder(clickupConfig?.apiToken) ? process.env.CLICKUP_API_TOKEN : clickupConfig.apiToken,
      spaceId: isPlaceholder(clickupConfig?.spaceId) ? process.env.CLICKUP_SPACE_ID : clickupConfig.spaceId
    };

    const result = await createClickUpProject(projectData, finalConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook Receiver
app.post('/api/webhook/ghl', async (req, res) => {
  try {
    const { contact, pipeline_stage, message } = req.body;
    const id = Date.now().toString();

    if (db) {
      const stmt = db.prepare(`
        INSERT INTO webhooks (id, contact, stage, message)
        VALUES (?, ?, ?, ?)
        `);

      stmt.run(id, JSON.stringify(contact || { name: 'Lead Desconocido' }), pipeline_stage || 'Review', message || '');
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhooks', (req, res) => {
  try {
    if (!db) return res.json([]);
    const webhooks = db.prepare('SELECT * FROM webhooks ORDER BY receivedAt DESC LIMIT 50').all();
    const parsed = webhooks.map(w => ({
      ...w,
      contact: JSON.parse(w.contact)
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI & ClickUp Connection Tests
app.post('/api/openai/test', async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const finalKey = apiKey || process.env.OPENAI_API_KEY;
    if (!finalKey) return res.status(400).json({ success: false, error: 'No API key configured' });

    const OpenAI = (await import('openai')).default;
    const testClient = new OpenAI({ apiKey: finalKey });

    const response = await testClient.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Responde solo: OK' }],
      max_completion_tokens: 10
    });

    res.json({ success: true, message: 'Conexión exitosa', response: response.choices[0].message.content });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/clickup/test', async (req, res) => {
  try {
    const { apiToken } = req.body;
    const token = apiToken || process.env.CLICKUP_API_TOKEN;
    if (!token) return res.status(400).json({ success: false, error: 'No API token configured' });

    const axios = (await import('axios')).default;
    const response = await axios.get('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });

    res.json({ success: true, message: 'Conexión exitosa', user: response.data.user.username });
  } catch (error) {
    res.status(400).json({ success: false, error: error.response?.data?.err || error.message });
  }
});

app.get('/api/config/status', (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    openai: !!openaiKey,
    openai_key_length: openaiKey.length,
    openai_key_prefix: openaiKey ? openaiKey.substring(0, 7) + '...' : 'NOT SET',
    anthropic: !!anthropicKey,
    anthropic_key_length: anthropicKey.length,
    clickup: !!process.env.CLICKUP_API_TOKEN,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    node_env: process.env.NODE_ENV || 'not set'
  });
});

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
