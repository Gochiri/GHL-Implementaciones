import { analyzeTranscript } from './services/ai-analyzer.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAnalyzer() {
    console.log('🧪 Testing AI Analyzer...');
    
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found in .env');
        return;
    }

    const mockTranscript = `
        Interesado: Juan Pérez de Real Estate Pro.
        Problema: Pierde muchos leads porque no les responde rápido. Maneja unos 50 leads al mes.
        Objetivo: Automatizar el primer contacto y tener un pipeline claro.
    `;

    try {
        const result = await analyzeTranscript(mockTranscript);
        console.log('✅ Analysis Result:', JSON.stringify(result, null, 2));
        
        if (result.clientName && result.painPoints && result.complexity) {
            console.log('✨ Test Passed!');
        } else {
            console.error('❌ Test Failed: Missing fields');
        }
    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

testAnalyzer();
