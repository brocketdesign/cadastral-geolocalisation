import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

const XAI_API_KEY = process.env.XAI_API_KEY;

/**
 * POST /api/risk-analysis  – Generate a Foncier Risk Score using AI
 * GET  /api/risk-analysis   – List user's past analyses
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { db } = await connectToDatabase();
  const collection = db.collection('risk_analyses');

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    /* ─── LIST past analyses ─── */
    if (req.method === 'GET') {
      const items = await collection.find({}).sort({ createdAt: -1 }).limit(50).toArray();
      return res.status(200).json(items);
    }

    /* ─── CREATE new analysis ─── */
    if (req.method === 'POST') {
      const { parcelRef, commune, section, numero, territoire, surface, lat, lng } = req.body;

      if (!commune || !section || !numero || !territoire) {
        return res.status(400).json({ error: 'Informations cadastrales requises (commune, section, numero, territoire).' });
      }

      // Check daily analysis count for free plan
      const { plan = 'free' } = req.body;
      if (plan === 'free') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayCount = await collection.countDocuments({
          createdAt: { $gte: todayStart.getTime() },
          plan: 'free',
        });
        if (todayCount >= 1) {
          return res.status(429).json({
            error: 'Limite atteinte. Les utilisateurs gratuits ont droit à 1 analyse par jour. Passez au plan Pro pour des analyses illimitées.',
          });
        }
      }

      // Build the prompt for AI analysis
      const prompt = buildAnalysisPrompt({ commune, section, numero, territoire, surface, lat, lng });

      // Call xAI (Grok) API
      const aiResponse = await callXAI(prompt);

      if (!aiResponse) {
        return res.status(500).json({ error: 'Erreur lors de l\'analyse IA. Veuillez réessayer.' });
      }

      // Parse the AI response into structured data
      const analysis = parseAIResponse(aiResponse);

      const record = {
        id: crypto.randomUUID(),
        parcelRef: parcelRef || `${territoire}/${commune}/${section}/${numero}`,
        commune,
        section,
        numero,
        territoire,
        surface: surface || null,
        lat: lat || null,
        lng: lng || null,
        plan,
        ...analysis,
        rawResponse: aiResponse,
        createdAt: Date.now(),
      };

      await collection.insertOne(record);
      return res.status(201).json(record);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Risk analysis API error:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

/* ─── AI PROMPT BUILDER ─── */

function buildAnalysisPrompt(data: {
  commune: string;
  section: string;
  numero: string;
  territoire: string;
  surface?: string;
  lat?: number;
  lng?: number;
}): string {
  return `Tu es un expert en analyse foncière spécialisé dans les territoires d'outre-mer français des Caraïbes (Guadeloupe, Martinique, Guyane, Saint-Martin, Saint-Barthélemy).

Analyse la parcelle cadastrale suivante et génère un rapport de risque foncier complet :

📍 Référence cadastrale : ${data.territoire} / ${data.commune} / Section ${data.section} / Parcelle n°${data.numero}
${data.surface ? `📐 Surface estimée : ${data.surface}` : ''}
${data.lat && data.lng ? `🌍 Coordonnées : ${data.lat}, ${data.lng}` : ''}

Génère un rapport JSON structuré avec les éléments suivants. Réponds UNIQUEMENT avec le JSON, sans texte avant ou après :

{
  "scoreGlobal": <nombre entre 0 et 100, 100 = aucun risque>,
  "categorie": "<FAIBLE|MODÉRÉ|ÉLEVÉ|CRITIQUE>",
  "constructibilite": {
    "score": <0-100>,
    "zonePLU": "<zone probable selon localisation>",
    "cos": "<coefficient d'occupation des sols estimé>",
    "commentaire": "<explication détaillée>"
  },
  "risqueInondation": {
    "score": <0-100>,
    "zonePPRI": "<zone de risque PPRI probable>",
    "commentaire": "<analyse basée sur la localisation caraïbe, risque cyclonique>"
  },
  "risqueSismique": {
    "score": <0-100>,
    "zoneAlea": "<niveau d'aléa sismique>",
    "commentaire": "<spécifique Guadeloupe/Martinique si applicable>"
  },
  "risqueVolcanique": {
    "score": <0-100>,
    "commentaire": "<proximité volcans actifs, Soufrière, Montagne Pelée>"
  },
  "loiLittoral": {
    "score": <0-100>,
    "applicable": <true|false>,
    "commentaire": "<restrictions liées à la loi littoral pour les Caraïbes>"
  },
  "servitudes": {
    "score": <0-100>,
    "types": ["<servitudes probables>"],
    "commentaire": "<analyse des servitudes potentielles>"
  },
  "marcheFoncier": {
    "prixMoyenM2": "<estimation €/m² pour le quartier>",
    "tendance": "<HAUSSE|STABLE|BAISSE>",
    "commentaire": "<contexte du marché local>"
  },
  "urbanisme": {
    "projetsProches": ["<projets urbains connus à proximité>"],
    "tempsEstimePermis": "<estimation du délai d'obtention du permis de construire>",
    "commentaire": "<analyse urbanistique>"
  },
  "resumeIA": "<paragraphe de synthèse complet de 3-5 phrases résumant tous les risques et opportunités>",
  "recommandations": ["<recommandation 1>", "<recommandation 2>", "<recommandation 3>"]
}

IMPORTANT : Base ton analyse sur les caractéristiques connues du territoire ${data.territoire === '971' ? 'de la Guadeloupe' : data.territoire === '972' ? 'de la Martinique' : data.territoire === '973' ? 'de la Guyane' : 'des Antilles françaises'} et de la commune de ${data.commune}. Sois réaliste et précis dans tes estimations.`;
}

/* ─── xAI API CALL ─── */

async function callXAI(prompt: string): Promise<string | null> {
  if (!XAI_API_KEY) {
    console.error('XAI_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en analyse foncière et urbanisme des territoires d\'outre-mer français. Réponds uniquement en JSON valide.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('xAI API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error('xAI API call failed:', err);
    return null;
  }
}

/* ─── PARSE AI RESPONSE ─── */

function parseAIResponse(raw: string) {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    const cleaned = (jsonMatch[1] || raw).trim();
    const parsed = JSON.parse(cleaned);

    return {
      scoreGlobal: clamp(parsed.scoreGlobal ?? 50, 0, 100),
      categorie: parsed.categorie || 'MODÉRÉ',
      constructibilite: parsed.constructibilite || null,
      risqueInondation: parsed.risqueInondation || null,
      risqueSismique: parsed.risqueSismique || null,
      risqueVolcanique: parsed.risqueVolcanique || null,
      loiLittoral: parsed.loiLittoral || null,
      servitudes: parsed.servitudes || null,
      marcheFoncier: parsed.marcheFoncier || null,
      urbanisme: parsed.urbanisme || null,
      resumeIA: parsed.resumeIA || '',
      recommandations: parsed.recommandations || [],
    };
  } catch (err) {
    console.error('Failed to parse AI JSON response:', err);
    return {
      scoreGlobal: 50,
      categorie: 'MODÉRÉ',
      constructibilite: null,
      risqueInondation: null,
      risqueSismique: null,
      risqueVolcanique: null,
      loiLittoral: null,
      servitudes: null,
      marcheFoncier: null,
      urbanisme: null,
      resumeIA: raw,
      recommandations: [],
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
