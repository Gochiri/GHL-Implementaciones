import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load skill content
const loadSkill = (skillName) => {
  try {
    const skillPath = path.resolve(__dirname, '../../Skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      const altPath = path.resolve(__dirname, '../../skills', skillName, 'SKILL.md');
      if (!fs.existsSync(altPath)) {
        throw new Error(`Skill ${skillName} not found in Skills or skills directory.`);
      }
      return fs.readFileSync(altPath, 'utf-8');
    }
    return fs.readFileSync(skillPath, 'utf-8');
  } catch (error) {
    console.error(`Error loading skill ${skillName}:`, error);
    throw error;
  }
};

export const executeSkill = async (skillName, input, apiKey) => {
  const finalKey = apiKey || process.env.OPENAI_API_KEY;

  if (!finalKey) {
    throw new Error('OpenAI API key not configured.');
  }

  const openai = new OpenAI({
    apiKey: finalKey,
  });

  const skillSystemPrompt = loadSkill(skillName);

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: skillSystemPrompt },
      { role: "user", content: input }
    ],
    temperature: 0.3
  });

  return {
    result: response.choices[0].message.content,
    usage: response.usage
  };
};