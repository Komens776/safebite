import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set body limit higher to allow processing high-resolution base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy init of Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// REST Endpoint to process meal classification
app.post('/api/classify', async (req, res) => {
  try {
    const { image, localHint } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Isolate base64 data and mimeType
    let base64Data = image;
    let mimeType = 'image/jpeg';
    
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const ai = getAiClient();

    // Recreate the experts prompt suited for SafeBite GH
    const tfliteHint = localHint ? `My local model classifier thinks: "${localHint}".` : '';
    const promptText = `
You are a Ghanaian food expert AI assistant.
A user is scanning their meal to check for specific allergens in the MAIN dish AND the TOPPINGS/SIDES.

${tfliteHint}

TASK:
1. Identify the main Ghanaian dish.
2. Identify EVERY TOPPING, SIDE, or PROTEIN visible on the plate or in the container.
   - Look for: Fried Fish, Tilapia, Egg (boiled/fried), Spaghetti (Talia), Gari, Shito, Wele, Salad, Avocado (Pear), Fried Plantain, Chicken, Meat, Goat, Palm oil, Groundnut.
3. If it's a packaged product or bottle (like Sobolo), identify the product name.

IMPORTANT: If the image is blurry, do not say you can't see it. Use your expert knowledge of Ghanaian food pairings to make the most likely identification based on the colors and shapes you see.

RESPOND in this EXACT format only:
FOOD_NAME: [main dish name lowercase, e.g. waakye, banku, fufu, jollof rice, groundnut soup, gobe, hausa koko, kelewele, kontomire stew, light soup, or unknown]
ITEMS_ON_PLATE: [list everything visible including sides/toppings, comma separated, e.g. waakye rice, fried tilapia, spaghetti, gari, shito, boiled egg, wele]

Example for Waakye:
FOOD_NAME: waakye
ITEMS_ON_PLATE: Waakye rice, fried tilapia, spaghetti, gari, shito, boiled egg, wele

Example for Banku:
FOOD_NAME: banku
ITEMS_ON_PLATE: Banku, grilled tilapia, pepper sauce, sliced onions, shito

Example for a drink:
FOOD_NAME: sobolo
ITEMS_ON_PLATE: Hibiscus drink, bottle

Only respond with "unknown" if there is absolutely no food-related item at all.
`;

    // Make the multimodal Gemini call
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 500,
      }
    });

    const responseText = response.text || '';
    console.log('[SafeBite Server] Gemini API response:', responseText);

    // Parse Response
    const lines = responseText.split('\n');
    let foodDetected = 'unknown';
    let itemsOnPlate = '';

    for (const line of lines) {
      if (line.toUpperCase().startsWith('FOOD_NAME:')) {
        foodDetected = line.replace(/FOOD_NAME:/i, '').trim().toLowerCase();
      }
      if (line.toUpperCase().startsWith('ITEMS_ON_PLATE:')) {
        itemsOnPlate = line.replace(/ITEMS_ON_PLATE:/i, '').trim();
      }
    }

    return res.json({
      foodDetected,
      itemsOnPlate,
      rawOutput: responseText
    });

  } catch (error: any) {
    console.error('[SafeBite Server] Classification Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process AI classification', 
      details: error.message 
    });
  }
});

// Configure Vite or production folder serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafeBite Server] Live running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('[SafeBite Server] System Initialization Crash:', err);
});
