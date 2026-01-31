import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import {
  analyzeTranscript,
  askHormoziQuestion,
  generateProjectStructure,
  generateQuotation,
  generateGHLDocumentation
} from './services/ai-analyzer.js';
import { createClickUpProject, updateTaskStatus } from './services/clickup-service.js';
import { extractTextFromFile } from './services/file-service.js';

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
  console.log('📥 Received /api/analyze request');
  try {
    const { transcript } = req.body;
    console.log('📝 Transcript length:', transcript?.length || 0);
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    console.log('🤖 Calling OpenAI...');
    const analysis = await analyzeTranscript(transcript);
    console.log('✅ Analysis complete');
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hormozi-style questioning
app.post('/api/hormozi', async (req, res) => {
  try {
    const { context, previousAnswers } = req.body;
    const response = await askHormoziQuestion(context, previousAnswers);
    res.json(response);
  } catch (error) {
    console.error('Hormozi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate project structure
app.post('/api/project-structure', async (req, res) => {
  try {
    const { analysis, answers } = req.body;
    const structure = await generateProjectStructure(analysis, answers);
    res.json(structure);
  } catch (error) {
    console.error('Project structure error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate quotation
app.post('/api/quotation', async (req, res) => {
  try {
    const { analysis, projectStructure } = req.body;
    const quotation = await generateQuotation(analysis, projectStructure);
    res.json(quotation);
  } catch (error) {
    console.error('Quotation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Project Approval Flow: Generates documentation and exports to ClickUp
app.post('/api/project/approve', async (req, res) => {
  try {
    const { analysis, projectStructure, answers, clickupConfig } = req.body;

    console.log('🚀 Project Approved! Generating technical documentation...');

    // 1. Generate detailed GHL Blueprint
    const documentation = await generateGHLDocumentation(analysis, projectStructure, answers);

    // 2. Prepare data for ClickUp
    const projectWithDoc = {
      ...projectStructure,
      clientName: analysis?.clientName || projectStructure?.clientName || 'Nuevo Proyecto GHL',
      documentation
    };

    // 3. Fallback for ClickUp Config
    const isPlaceholder = (val) => !val || val.includes('***') || val.length < 5;
    const finalConfig = {
      apiToken: isPlaceholder(clickupConfig?.apiToken) ? process.env.CLICKUP_API_TOKEN : clickupConfig.apiToken,
      spaceId: isPlaceholder(clickupConfig?.spaceId) ? process.env.CLICKUP_SPACE_ID : clickupConfig.spaceId
    };

    console.log('📦 Exporting to ClickUp with blueprint...');
    const result = await createClickUpProject(projectWithDoc, finalConfig);

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

// Create project in ClickUp
app.post('/api/clickup/create', async (req, res) => {
  try {
    const { projectData, clickupConfig } = req.body;

    // Fallback to .env if not provided or if it's a placeholder
    const isPlaceholder = (val) => !val || val.includes('***') || val.length < 5;

    const finalConfig = {
      apiToken: isPlaceholder(clickupConfig?.apiToken) ? process.env.CLICKUP_API_TOKEN : clickupConfig.apiToken,
      spaceId: isPlaceholder(clickupConfig?.spaceId) ? process.env.CLICKUP_SPACE_ID : clickupConfig.spaceId
    };

    if (!finalConfig.apiToken || !finalConfig.spaceId) {
      return res.status(400).json({ error: 'ClickUp API Token and Space ID are required (not found in .env or request)' });
    }

    const result = await createClickUpProject(projectData, finalConfig);
    res.json(result);
  } catch (error) {
    console.error('ClickUp error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clickup/task/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, apiToken } = req.body;

    const finalToken = apiToken || process.env.CLICKUP_API_TOKEN;

    if (!finalToken) {
      return res.status(400).json({ error: 'ClickUp API Token is required' });
    }

    const result = await updateTaskStatus(id, status, finalToken);
    res.json({ success: true, result });
  } catch (error) {
    console.error('ClickUp update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// In-memory store for GHL webhooks (simulating a database for this demo)
const ghlWebhooks = [];

// GHL Webhook receiver
app.post('/api/webhook/ghl', async (req, res) => {
  try {
    console.log('📬 GHL Webhook received:', JSON.stringify(req.body, null, 2));
    const { contact, pipeline_stage, message } = req.body;

    const webhookData = {
      id: Date.now().toString(),
      contact: contact || { name: 'Lead Desconocido' },
      stage: pipeline_stage || 'Review',
      message: message || '',
      receivedAt: new Date().toISOString(),
      status: 'pending'
    };

    ghlWebhooks.unshift(webhookData); // Add to start
    if (ghlWebhooks.length > 50) ghlWebhooks.pop(); // Keep last 50

    res.json({
      success: true,
      message: 'GHL Webhook processed successfully',
      id: webhookData.id
    });
  } catch (error) {
    console.error('❌ GHL webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent GHL webhooks
app.get('/api/webhooks', (req, res) => {
  res.json(ghlWebhooks);
});

// Test OpenAI connection
app.post('/api/openai/test', async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const finalKey = apiKey || process.env.OPENAI_API_KEY;

    if (!finalKey) {
      return res.status(400).json({ success: false, error: 'No API key configured' });
    }

    const OpenAI = (await import('openai')).default;
    const testClient = new OpenAI({ apiKey: finalKey });

    const response = await testClient.chat.completions.create({
      model: model || 'gpt-5.2',
      messages: [{ role: 'user', content: 'Responde solo: OK' }],
      max_completion_tokens: 10
    });

    res.json({
      success: true,
      message: 'Conexión exitosa',
      model: model || process.env.OPENAI_MODEL || 'gpt-5.2',
      response: response.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Test ClickUp connection
app.post('/api/clickup/test', async (req, res) => {
  try {
    const { apiToken } = req.body;
    const token = apiToken || process.env.CLICKUP_API_TOKEN;

    if (!token) {
      return res.status(400).json({ success: false, error: 'No API token configured' });
    }

    const axios = (await import('axios')).default;

    const response = await axios.get('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });

    res.json({
      success: true,
      message: 'Conexión exitosa',
      user: response.data.user.username
    });
  } catch (error) {
    console.error('ClickUp test error:', error);
    res.status(400).json({ success: false, error: error.response?.data?.err || error.message });
  }
});

// Debug endpoint to find Space IDs
app.get('/api/clickup/spaces', async (req, res) => {
  try {
    const apiToken = process.env.CLICKUP_API_TOKEN;
    if (!apiToken) return res.status(400).json({ error: 'No API Token in .env' });

    const { getTeams, getSpaces } = await import('./services/clickup-service.js');
    const teams = await getTeams(apiToken);

    const spacesWithTeams = await Promise.all(teams.map(async (team) => {
      const spaces = await getSpaces(apiToken, team.id);
      return { teamName: team.name, teamId: team.id, spaces };
    }));

    res.json(spacesWithTeams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test backend configuration status
app.get('/api/config/status', (req, res) => {
  res.json({
    openai: !!process.env.OPENAI_API_KEY,
    clickup: !!process.env.CLICKUP_API_TOKEN,
    model: process.env.OPENAI_MODEL || 'gpt-5.2'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
