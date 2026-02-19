import Groq from "groq-sdk";
import fs from 'fs';
import path from 'path';

// Read .env.local for GROQ_API_KEY
let apiKey = "";
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GROQ_API_KEY=(.+)/);
    if (match) {
      apiKey = match[1].trim();
    }
  }
} catch (e) {
  console.log("Could not read .env.local", e);
}

async function main() {
  if (!apiKey) {
    console.error("GROQ_API_KEY not found in .env.local");
    return;
  }

  console.log("Using Groq API Key:", apiKey.substring(0, 5) + "...");
  const groq = new Groq({ apiKey });

  const modelsToTry = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "gemma2-9b-it",
  ];

  for (const model of modelsToTry) {
      console.log(`\n--- Testing model: ${model} ---`);
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant."
            },
            {
              role: "user",
              content: "Explain the importance of low-latency LLMs",
            },
          ],
          model: model,
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (content) {
            console.log(`✅ Success with ${model}:`);
            console.log(content.substring(0, 150) + "...");
            break; // Stop after first success
        } else {
            console.error(`❌ Failed with ${model}: Response was empty.`);
        }

      } catch (error) {
          console.error(`❌ Failed with ${model}:`, error.message);
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
  }
}

main();
