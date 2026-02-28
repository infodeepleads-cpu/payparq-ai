import { env } from "../../../../lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

function json(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit =
    typeof init === "number" ? { status: init } : init || {};
  return new Response(JSON.stringify(data), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const note = body?.note ?? "";
  const image = body?.image; // base64 string
  const requestedModel = body?.model;
  const messages = body?.messages || [];
  const tasks = body?.tasks || [];

  // Construct context string
  const taskList = Array.isArray(tasks) && tasks.length > 0 
    ? tasks.map((t: any) => `- ${t.title} (${t.completed ? 'Completed' : 'Pending'})`).join('\n')
    : "No active tasks.";

  const appStructure = `
Application Structure & Pages:
- /mission: "Define objectives, priorities, and weekly goals." Use this for high-level planning.
- /espresso: "Quick actions and one-minute updates." Use this for rapid checks and news.
- /daily-recap: "Summaries of today’s activity and next steps." Use this for end-of-day reviews.
- /crm: "Contacts, interactions, and follow-ups." Use this for managing client relationships.
- /resources: Shared documents, files, and assets.
`;

  // Check for specific Gemini API key query
  if (/gemini\s+api\s+key/i.test(note)) {
    return json({
      nextStep: "this is google studio project gen-lang-klijent-0881693673 opened today",
      urgent: false
    });
  }

  if (env.GEMINI_API_KEY || env.GROQ_API_KEY) {
    try {
      let resultText = "";
      const modelName = requestedModel || env.GEMINI_MODEL || "gemini-2.0-flash";

      // Safety check: if model name looks like gemini-2.5-flash (which doesn't exist yet),
      // or if it's explicitly set to it, fallback to 2.0-flash.
      const normalizedModelName = modelName.includes("gemini-2.5") ? "gemini-2.0-flash" : modelName;

      const isGroqModel =
        normalizedModelName.startsWith("groq/") ||
        normalizedModelName.startsWith("openai/") ||
        normalizedModelName.startsWith("moonshotai/") ||
        normalizedModelName.startsWith("qwen/") ||
        normalizedModelName.startsWith("whisper") ||
        normalizedModelName.includes("llama") ||
        normalizedModelName.includes("gemma");
      if (isGroqModel) {
        if (!groq) throw new Error("GROQ_API_KEY is missing");
        if (normalizedModelName.startsWith("whisper")) {
          const payload = JSON.stringify({
            nextStep: "Transcription models are not supported in chat. Please switch to a chat model.",
            urgent: false
          });
          return json({ nextStep: "Transcription models are not supported in chat. Please switch to a chat model.", urgent: false });
        }
        
        const systemPrompt = `Manager note: ${note}\n\n` +
          `Context:\n${appStructure}\n\nCurrent Taskbar Content:\n${taskList}\n\n` +
          `Current Server Time (ISO): ${new Date().toISOString()}\n` +
          `Current Server Time (Local): ${new Date().toLocaleString()}\n\n` +
          `Return JSON with keys: nextStep, urgent (boolean), action (optional string), taskTitle (optional string), crmContact (optional object), reminderTime (optional ISO string). ` +
          `Instructions:\n` +
          `1. Analyze the conversation history, the new note, and the provided context (tasks and pages).\n` +
          `2. **REMINDER LOGIC IS CRITICAL**: If the user asks for a reminder, you MUST set "action": "schedule_reminder" and "reminderTime" (ISO 8601). Do NOT just say you did it in "nextStep" without setting these fields. You MUST output valid JSON.\n` +
          `3. Be mindful of the application pages and current tasks when answering. Suggest actions related to them if relevant.\n` +
          `3. If the user wants to ADD a task:\n` +
          `   - Set "action" to "add_task".\n` +
          `   - IMPORTANT: If the request is a REMINDER (e.g. "Remind me..."), DO NOT use "add_task". Use "schedule_reminder" instead.\n` +
          `   - Set "taskTitle" to the task description (e.g., "Call my boss").\n` +
          `   - In "nextStep", confirm the action (e.g., "I've added 'Call my boss' to your tasks.").\n` +
          `4. If the user wants to COMPLETE a task:\n` +
          `   - Set "action" to "complete_task".\n` +
          `   - Set "taskTitle" to the task description.\n` +
          `   - In "nextStep", confirm the action (e.g., "I've marked 'Call my boss' as completed.").\n` +
          `5. If the user wants to DELETE/REMOVE a task:\n` +
          `   - Set "action" to "delete_task".\n` +
          `   - Set "taskTitle" to the task description.\n` +
          `   - In "nextStep", confirm the action (e.g., "I've removed 'Call my boss' from your tasks.").\n` +
          `6. If the user wants to CONFIRM a task:\n` +
          `   - Set "action" to "confirm_task".\n` +
          `   - Set "taskTitle" to the task description.\n` +
          `   - In "nextStep", confirm the action (e.g., "I've confirmed 'Call my boss' task.").\n` +
          `7. If the user wants to ADD a CRM contact:\n` +
          `   - Set "action" to "add_crm_contact".\n` +
          `   - Set "crmContact" to an object with: { "tier": number (1-7), "decisionMaker": "Name", "location": "Location", "estimatedCapacity": number, "status": "Number. Date (e.g. '1. 2024-01-01')", "nextStep": "Next step", "notes": "Any notes" }.\n` +
          `   - Status format MUST be one of: '1. Date' (Entry), '2. Date' (Live DEMO), '3. Date' (Yes/Expiration), '4. Reason' (No), '5. Date' (Follow Up).\n` +
          `   - In "nextStep", confirm the action (e.g., "I've added [Name] to the CRM.").\n` +
          `   - If the user uses the shorthand format "N. a [Name] b [Location] c [Cap] d [Status] e [Next Step] f [Notes]":\n` +
          `     - Parse "N" as "tier" (number).\n` +
          `     - Parse "a" value as "decisionMaker".\n` +
          `     - Parse "b" value as "location".\n` +
          `     - Parse "c" value as "estimatedCapacity" (number).\n` +
          `     - Parse "d" value as "status".\n` +
          `     - Parse "e" value as "nextStep".\n` +
          `     - Parse "f" value as "notes".\n` +
          `     - Include these in the "crmContact" object.\n` +
          `8. If the user wants to UPDATE a CRM contact:
` +
          `   - Set "action" to "update_crm_contact".
` +
          `   - Set "crmContact" to the updated fields (must include "decisionMaker": "Name" to identify the contact).
` +
          `   - If the user uses the shorthand format "N. a [Name] b [Location] c [Cap] d [Status] e [Next Step] f [Notes]":\n` +
          `     - Parse "N" as "tier" (number). Also use "N" as "index" to identify which contact to update (1-based).\n` +
          `     - Parse "a" value as "decisionMaker".\n` +
          `     - Parse "b" value as "location".\n` +
          `     - Parse "c" value as "estimatedCapacity" (number).\n` +
          `     - Parse "d" value as "status".\n` +
          `     - Parse "e" value as "nextStep".\n` +
          `     - Parse "f" value as "notes".\n` +
          `     - Include these in the "crmContact" object.\n` +
          `   - In "nextStep", confirm the action.
` +
          `11. If the user wants to SCHEDULE A REMINDER:\n` +
          `   - Set "action" to "schedule_reminder".\n` +
          `   - Set "taskTitle" to the reminder description.\n` +
          `   - Set "reminderTime" to the ISO 8601 date string (e.g. "2024-01-01T12:00:00.000Z") when the reminder should fire. Use the provided Current Server Time to calculate relative times (e.g. "tomorrow at 1pm").\n` +
          `   - In "nextStep", confirm the action and explicitly state the time you set.\n` +
          `   - EXAMPLE:\n` +
          `     Input: "Remind me to call John at 2pm tomorrow"\n` +
          `     Response: { "action": "schedule_reminder", "taskTitle": "Call John", "reminderTime": "2024-01-02T14:00:00.000Z", "nextStep": "I've set a reminder to call John tomorrow at 2pm.", "urgent": false }\n` +
          `   - IMPORTANT: Do not include markdown code blocks (backticks) in your JSON output. Just raw JSON.\n` +
          `   - IMPORTANT: The frontend will handle the actual scheduling based on your response. You just need to identify the intent.\n` +
          `10. If an image is provided: Analyze it and answer the user's request in 'nextStep'.
` +
          `Style: concise, actionable, manager-oriented. Return ONLY JSON.\n` +
          `Do not greet or introduce yourself. Do not write self-referential phrases (e.g., "I'm an assistant", "I'm Gemini").`;

        const limitedMsgs = Array.isArray(messages)
          ? messages.slice(-8).map((m: any) => ({ role: m.role, content: String(m.content || "").slice(0, 1500) }))
          : [];
        const supportsJson = !(
          normalizedModelName.includes("guard") ||
          normalizedModelName.includes("prompt-guard") ||
          normalizedModelName.includes("maverick") ||
          normalizedModelName.includes("scout")
        );
        let chatCompletion;
        try {
          chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              ...limitedMsgs,
              ...(note ? [{ role: "user", content: String(note).slice(0, 1000) }] : [])
            ],
            model: normalizedModelName,
            temperature: 0.7,
            ...(supportsJson ? { response_format: { type: "json_object" } } : {})
          });
        } catch (e: any) {
          const msg = String(e.message || "");
          const shouldRetryWithoutJson =
            msg.includes("json_validate_failed") ||
            msg.includes("does not support JSON output") ||
            msg.includes('"param":"response_format"') ||
            msg.includes('"param":"messages"');
          if (shouldRetryWithoutJson) {
            chatCompletion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: systemPrompt },
                ...limitedMsgs,
                ...(note ? [{ role: "user", content: String(note).slice(0, 1000) }] : [])
              ],
              model: normalizedModelName,
              temperature: 0.7
            });
          } else {
            throw e;
          }
        }

        if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
           throw new Error("Groq returned no choices.");
        }
        
        const messageContent = chatCompletion.choices[0]?.message?.content;
        if (!messageContent) {
           throw new Error("Groq returned empty content.");
        }
        
        resultText = messageContent;
      } 
      // Gemini Handler
      else {
        if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        
        // Use gemini-1.5-flash which should work. If not, maybe the API key doesn't have access to it or needs paid plan?
         // Trying gemini-1.5-flash-8b as it is often free tier friendly.
         let targetModel = normalizedModelName;
         if (targetModel === "gemini-1.5-flash") {
            targetModel = "gemini-1.5-flash"; // Keep it simple first
         }
         
         // Use 2.0 Flash by default if not specified or if falling back
         if (!targetModel || targetModel === "gemini-2.5-flash") {
             targetModel = "gemini-2.0-flash";
         }
         
         const model = genAI.getGenerativeModel({ model: targetModel });
        
        const parts: any[] = [];
        
        if (image) {
           const base64Data = image.split(",")[1] || image;
           const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";
           parts.push({
             inlineData: {
               data: base64Data,
               mimeType: mimeType
             }
           });
         }

         // Construct history context
         const historyText = messages.length > 0 
           ? messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")
           : "";

         parts.push({
           text: `Manager note: ${note}\n\n` +
          `Context:\n${appStructure}\n\nCurrent Taskbar Content:\n${taskList}\n\n` +
          `Current Server Time (ISO): ${new Date().toISOString()}\n` +
          `Current Server Time (Local): ${new Date().toLocaleString()}\n\n` +
          `Conversation History:\n${historyText}\n\n` +
          `Return JSON with keys: nextStep, urgent (boolean), action (optional string), taskTitle (optional string), crmContact (optional object), reminderTime (optional ISO string). ` +
           `Instructions:\n` +
           `1. Analyze the conversation history, the new note, and the provided context (tasks and pages).\n` +
           `2. Be mindful of the application pages and current tasks when answering. Suggest actions related to them if relevant.\n` +
           `3. If the user wants to ADD a task:\n` +
           `   - Set "action" to "add_task".\n` +
           `   - Set "taskTitle" to the task description (e.g., "Call my boss").\n` +
           `   - In "nextStep", confirm the action (e.g., "I've added 'Call my boss' to your tasks.").\n` +
           `4. If the user wants to COMPLETE a task:\n` +
           `   - Set "action" to "complete_task".\n` +
           `   - Set "taskTitle" to the task description.\n` +
           `   - In "nextStep", confirm the action (e.g., "I've marked 'Call my boss' as completed.").\n` +
           `5. If the user wants to DELETE/REMOVE a task:\n` +
           `   - Set "action" to "delete_task".\n` +
           `   - Set "taskTitle" to the task description.\n` +
           `   - In "nextStep", confirm the action (e.g., "I've removed 'Call my boss' from your tasks.").\n` +
           `6. If the user wants to CONFIRM a task:\n` +
           `   - Set "action" to "confirm_task".\n` +
           `   - Set "taskTitle" to the task description.\n` +
           `   - In "nextStep", confirm the action (e.g., "I've confirmed 'Call my boss' task.").\n` +
           `7. If the user wants to ADD a CRM contact:\n` +
           `   - Set "action" to "add_crm_contact".\n` +
           `   - Set "crmContact" to an object with: { "tier": number (1-7), "decisionMaker": "Name of the person/entity", "city": "City Name", "estimatedCapacity": number, "status": "Number. Date (e.g. '1. 2024-01-01')", "nextStep": "Next step details", "notes": "Any notes" }.\n` +
          `   - Status format MUST be one of: '1. Date' (Entry), '2. Date' (Live DEMO), '3. Date' (Yes/Expiration), '4. Reason' (No), '5. Date' (Follow Up).\n` +
           `   - In "nextStep", confirm the action (e.g., "I've added [Name] to the CRM.").\n` +
           `8. If the user wants to UPDATE a CRM contact:
` +
           `   - Set "action" to "update_crm_contact".
` +
           `   - Set "crmContact" to the updated fields.
` +
           `   - If the user uses the shorthand format "N. a [Name] b [Location] c [Cap] d [Status] e [Next Step] f [Notes]":
` +
          `     - Parse "N" as the "tier" (number). This is the contact's Tier/Group, NOT an index.
` +
          `     - Parse "a" value as "decisionMaker".
` +
          `     - Parse "b" value as "location".
` +
          `     - Parse "c" value as "estimatedCapacity" (number).
` +
          `     - Parse "d" value as "status".
` +
          `     - Parse "e" value as "nextStep".
` +
          `     - Parse "f" value as "notes".
` +
          `     - Include these in the "crmContact" object.
` +
          `   - In "nextStep", confirm the action.\n` +
          `11. If the user wants to SCHEDULE A REMINDER:\n` +
          `   - Set "action" to "schedule_reminder".\n` +
          `   - Set "taskTitle" to the reminder description.\n` +
          `   - Set "reminderTime" to the ISO 8601 date string (e.g. "2024-01-01T12:00:00.000Z") when the reminder should fire. Use the provided Current Server Time to calculate relative times (e.g. "tomorrow at 1pm").\n` +
          `   - In "nextStep", confirm the action and explicitly state the time you set.\n` +
          `   - EXAMPLE:\n` +
          `     Input: "Remind me to call John at 2pm tomorrow"\n` +
          `     Response: { "action": "schedule_reminder", "taskTitle": "Call John", "reminderTime": "2024-01-02T14:00:00.000Z", "nextStep": "I've set a reminder to call John tomorrow at 2pm.", "urgent": false }\n` +
          `9. If an image is provided: Analyze it and answer the user's request in 'nextStep'.\n` +
           `Style: concise, actionable, manager-oriented. Return ONLY JSON. Do not include markdown code blocks.`
         });

         let result: any;
         let retries = 3;
        while (retries > 0) {
          try {
            result = await model.generateContent(parts);
            break;
          } catch (error: any) {
            // Enhanced Error Handling for Gemini
            console.error(`Gemini Attempt ${4 - retries} failed:`, error.message);

            if (error.message.includes("429") && retries > 1) {
              await new Promise(resolve => setTimeout(resolve, 3000));
              retries--;
            } else if ((error.message.includes("404") || error.message.includes("not found")) && retries > 1) {
                console.log(`Model ${targetModel} not found, trying gemini-1.5-flash`);
                // Try flash as fallback
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                try {
                  result = await fallbackModel.generateContent(parts);
                  break;
                } catch (e) {
                  console.log("gemini-1.5-flash failed, trying gemini-2.0-flash-exp");
                  const lastResort = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                  result = await lastResort.generateContent(parts);
                  break;
                }
             } else {
               throw error;
             }
          }
        }
        const response = await result.response;
        resultText = response.text();
      }
      
      // Clean up text if it contains markdown code blocks
      const cleanText = resultText.replace(/```json\n?|\n?```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        // If JSON parsing fails, use the raw text as nextStep
        parsed = { nextStep: cleanText, urgent: false };
      }
      
      if (!parsed.nextStep || typeof parsed.nextStep !== "string" || !parsed.nextStep.trim()) {
        parsed.nextStep = "Provide the conversation history and the new note for analysis.";
      }
      

      
      // Artificial delay to simulate "thinking" (0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return json({
        nextStep: parsed.nextStep || "",
        urgent: !!parsed.urgent,
        action: parsed.action,
        taskTitle: parsed.taskTitle,
        crmContact: parsed.crmContact,
        reminderTime: parsed.reminderTime
      });

    } catch (error: any) {
      console.error("AI API Error:", error);
      return json({
        error: error.message || "Internal server error",
        nextStep: "I'm having trouble connecting to the AI service right now. Please try again.",
        urgent: false
      }, 500);
    }
  }

  console.error("Missing API Keys");
  return json({
    error: "API Keys are missing. Please check your environment variables.",
    nextStep: "I'm having trouble connecting to the AI service right now. Please try again.",
    urgent: false
  }, 500);
}
