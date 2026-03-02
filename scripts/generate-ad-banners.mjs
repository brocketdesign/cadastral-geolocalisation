import OpenAI from "openai";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "ads");

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Banner definitions with different formats for the dashboard
const BANNERS = [
  {
    name: "sidebar-immo-prestige",
    prompt:
      'Professional real estate advertising banner for a luxury Caribbean agency called "Prestige Caraïbes Immobilier". Blue and white color scheme. Shows a beautiful tropical villa with ocean view, palm trees, modern architecture. Text overlay: "PRESTIGE CARAÏBES IMMOBILIER" and "Votre partenaire immobilier aux Antilles". Elegant, professional, high-end real estate ad style. Clean modern design with blue accents.',
    aspectRatio: "3:4",
    description: "Sidebar vertical banner - luxury agency",
  },
  {
    name: "sidebar-terrain-expert",
    prompt:
      'Professional real estate advertising banner for a land surveying agency called "Terrain Expert Antilles". Blue and white color scheme. Shows aerial view of tropical land parcels, cadastral map overlay, professional surveying equipment. Text: "TERRAIN EXPERT ANTILLES" and "Expertise foncière & géomètre". Clean modern corporate design with blue gradient background.',
    aspectRatio: "3:4",
    description: "Sidebar vertical banner - land expert",
  },
  {
    name: "banner-horizon-immo",
    prompt:
      'Wide horizontal real estate advertising banner for "Horizon Immobilier DOM-TOM". Blue color scheme on white. Shows panoramic Caribbean beachfront properties, modern condos with sea view. Text: "HORIZON IMMOBILIER DOM-TOM" and "Plus de 500 biens disponibles en Outre-mer". Professional wide banner format, clean layout with blue accents and call to action button style.',
    aspectRatio: "2:1",
    description: "Top horizontal banner - DOM-TOM agency",
  },
  {
    name: "banner-invest-caraibes",
    prompt:
      'Wide horizontal real estate investment advertising banner for "Invest Caraïbes". Blue and gold color scheme. Shows upward trending graph overlaid on tropical real estate, investment charts, luxury properties. Text: "INVEST CARAÏBES" and "Investissez dans l\'immobilier antillais - Rendement garanti". Professional financial/real estate wide ad with blue tones.',
    aspectRatio: "2:1",
    description: "Top horizontal banner - investment",
  },
  {
    name: "inline-agence-soleil",
    prompt:
      'Medium-sized real estate advertising banner for "Agence Soleil Immobilier". Bright blue and white color scheme. Shows a charming Creole house with colorful shutters, tropical garden, in Guadeloupe or Martinique. Text: "AGENCE SOLEIL IMMOBILIER" and "Trouvez votre bien de rêve aux Antilles". Warm yet professional, blue-themed modern ad design with rounded corners feel.',
    aspectRatio: "16:9",
    description: "Inline medium banner - Creole agency",
  },
  {
    name: "inline-neuf-outremer",
    prompt:
      'Medium-sized real estate advertising banner for new construction called "Outre-Mer Neuf". Blue and white minimal design. Shows modern new apartment building in tropical setting, contemporary architecture, pool area. Text: "OUTRE-MER NEUF" and "Programmes neufs en Guadeloupe, Martinique, Guyane - Défiscalisation Pinel". Clean modern promotional banner with blue theme.',
    aspectRatio: "16:9",
    description: "Inline medium banner - new construction",
  },
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

async function generateBanner(banner) {
  console.log(`\n🎨 Generating: ${banner.description} (${banner.name})...`);
  console.log(`   Aspect ratio: ${banner.aspectRatio}`);

  try {
    const response = await client.images.generate({
      model: "grok-imagine-image",
      prompt: banner.prompt,
      n: 1,
    });

    const imageUrl = response.data[0].url;
    console.log(`   ✅ Image generated: ${imageUrl}`);

    const destPath = path.join(OUTPUT_DIR, `${banner.name}.png`);
    await downloadImage(imageUrl, destPath);
    console.log(`   💾 Saved to: ${destPath}`);

    return { name: banner.name, success: true, path: destPath };
  } catch (error) {
    console.error(`   ❌ Error generating ${banner.name}:`, error.message);
    return { name: banner.name, success: false, error: error.message };
  }
}

async function main() {
  console.log("==============================================");
  console.log("  CadaStreMap - Ad Banner Generator");
  console.log("  Generating real estate agency banners");
  console.log("==============================================");

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = [];

  // Generate banners sequentially to avoid rate limits
  for (const banner of BANNERS) {
    const result = await generateBanner(banner);
    results.push(result);
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n==============================================");
  console.log("  Generation Summary");
  console.log("==============================================");
  for (const r of results) {
    console.log(`  ${r.success ? "✅" : "❌"} ${r.name} ${r.success ? "" : `- ${r.error}`}`);
  }
  console.log(`\n  Total: ${results.filter((r) => r.success).length}/${results.length} generated`);
}

main().catch(console.error);
