// Diagnostic endpoint to find what's crashing

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL ? 'vercel' : 'local',
    imports: {}
  };

  // Test each import
  try {
    await import('express');
    results.imports.express = 'OK';
  } catch (e) {
    results.imports.express = `FAIL: ${e.message}`;
  }

  try {
    await import('cors');
    results.imports.cors = 'OK';
  } catch (e) {
    results.imports.cors = `FAIL: ${e.message}`;
  }

  try {
    await import('dotenv');
    results.imports.dotenv = 'OK';
  } catch (e) {
    results.imports.dotenv = `FAIL: ${e.message}`;
  }

  try {
    await import('multer');
    results.imports.multer = 'OK';
  } catch (e) {
    results.imports.multer = `FAIL: ${e.message}`;
  }

  try {
    await import('openai');
    results.imports.openai = 'OK';
  } catch (e) {
    results.imports.openai = `FAIL: ${e.message}`;
  }

  try {
    await import('axios');
    results.imports.axios = 'OK';
  } catch (e) {
    results.imports.axios = `FAIL: ${e.message}`;
  }

  try {
    await import('uuid');
    results.imports.uuid = 'OK';
  } catch (e) {
    results.imports.uuid = `FAIL: ${e.message}`;
  }

  try {
    await import('./db.js');
    results.imports.db = 'OK';
  } catch (e) {
    results.imports.db = `FAIL: ${e.message}`;
  }

  try {
    await import('./services/file-service.js');
    results.imports.fileService = 'OK';
  } catch (e) {
    results.imports.fileService = `FAIL: ${e.message}`;
  }

  try {
    await import('./services/clickup-service.js');
    results.imports.clickupService = 'OK';
  } catch (e) {
    results.imports.clickupService = `FAIL: ${e.message}`;
  }

  try {
    await import('./services/ai-analyzer.js');
    results.imports.aiAnalyzer = 'OK';
  } catch (e) {
    results.imports.aiAnalyzer = `FAIL: ${e.message}`;
  }

  res.status(200).json(results);
}
