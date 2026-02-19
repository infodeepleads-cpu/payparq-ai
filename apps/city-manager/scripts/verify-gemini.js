
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Try to read .env.local
let apiKey = "";
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (match) {
      apiKey = match[1].trim();
    }
  }
} catch (e) {
  console.log("Could not read .env.local", e);
}

async function test() {
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  
  console.log("Using API Key:", apiKey.substring(0, 5) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // List models first
  /*
  // Note: ListModels requires admin scope sometimes, but let's try generateContent directly first
  */

  try {
     // This is not directly exposed in the high-level SDK easily without a model, 
     // but we can try to use the model manager if available or just infer from error.
     // Actually, we can't easily list models with the simplified SDK unless we use the REST endpoint or specific method.
     // Let's stick to trying models.
  } catch(e) {}

  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest", 
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  for (const modelName of modelsToTry) {
    console.log(`\nTesting ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello world");
      console.log(`✅ Success with ${modelName}`);
      console.log(result.response.text());
      return; // Stop on first success
    } catch (e) {
      console.error(`❌ Failed with ${modelName}:`, e.message);
      if (e.message.includes("429")) {
        console.log("Rate limit hit, stopping tests.");
        break; 
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
  }
}

test();
