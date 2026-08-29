import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get('/api/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ status: 'ok', time: Date.now() });
  });

  // Socratic AI Hint Route
  app.post('/api/socratic-hint', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      const { mode, boardSummary, currentHint, targetQuestion, studentVoiceQuery } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          hint: studentVoiceQuery
            ? `💡 Socratic Coach: To answer "${studentVoiceQuery}", think about how algebra tiles represent physical areas or balanced scale weights.`
            : `💡 Coach Tip: Focus on maintaining balance or geometry. What does the opposite sign do to cancel unwanted terms?`,
        });
      }

      const prompt = `You are a supportive, insightful Socratic math coach assisting a middle/high school student working with virtual Algebra Tiles.
The student is currently in mode: "${mode}".
Target Question: "${targetQuestion || 'Self-placed custom problem'}".
${studentVoiceQuery ? `Student's Direct Spoken Question: "${studentVoiceQuery}"` : ''}
Current Board State: "${boardSummary}".
System rule guidance: "${currentHint}".

Provide a SINGLE, short (1-2 sentences), gentle Socratic guiding question or observation. 
NEVER give away the direct numeric final answer. 
Guide their intuition regarding zero pairs, inverse operations, adding tiles to both sides to balance, or arranging tiles into rectangular areas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      const hint = response.text?.trim() || currentHint;
      res.json({ hint });
    } catch (err: any) {
      console.warn('Socratic AI generation fallback:', err?.message || err);
      res.json({
        hint: `💡 Coach Tip: Keep both sides balanced! If you add or remove something on the left, remember to do the exact same on the right.`,
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve static assets with smart cache headers: no-cache for HTML/SW/manifest, cache-control for hashed assets
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (
            filePath.endsWith('.html') ||
            filePath.endsWith('sw.js') ||
            filePath.endsWith('manifest.json')
          ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else if (filePath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    // SPA fallback: Always serve fresh index.html with no-cache headers
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Algebra Tiles Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
