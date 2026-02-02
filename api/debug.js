// Diagnostic endpoint - test imports one by one
export default async function handler(req, res) {
  const results = {
    nodeVersion: process.version,
    imports: {}
  };

  try {
    await import('express');
    results.imports.express = 'OK';
  } catch (e) {
    results.imports.express = e.message;
  }

  try {
    await import('cors');
    results.imports.cors = 'OK';
  } catch (e) {
    results.imports.cors = e.message;
  }

  try {
    await import('multer');
    results.imports.multer = 'OK';
  } catch (e) {
    results.imports.multer = e.message;
  }

  try {
    await import('openai');
    results.imports.openai = 'OK';
  } catch (e) {
    results.imports.openai = e.message;
  }

  try {
    await import('axios');
    results.imports.axios = 'OK';
  } catch (e) {
    results.imports.axios = e.message;
  }

  try {
    await import('uuid');
    results.imports.uuid = 'OK';
  } catch (e) {
    results.imports.uuid = e.message;
  }

  try {
    await import('./db.js');
    results.imports.db = 'OK';
  } catch (e) {
    results.imports.db = e.message;
  }

  try {
    await import('./services/file-service.js');
    results.imports.fileService = 'OK';
  } catch (e) {
    results.imports.fileService = e.message;
  }

  try {
    await import('./services/clickup-service.js');
    results.imports.clickupService = 'OK';
  } catch (e) {
    results.imports.clickupService = e.message;
  }

  try {
    await import('./services/ai-analyzer.js');
    results.imports.aiAnalyzer = 'OK';
  } catch (e) {
    results.imports.aiAnalyzer = e.message;
  }

  res.status(200).json(results);
}
