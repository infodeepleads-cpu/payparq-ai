import { env } from "../../../../lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import Groq from "groq-sdk";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
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

  // Check for specific Gemini API key query
  if (/gemini\s+api\s+key/i.test(note)) {
    return json({
      nextStep: "this is google studio project gen-lang-klijent-0881693673 opened today",
      whatsappDraft: "",
      emailDraft: "",
      urgent: false
    });
  }

  if (env.GEMINI_API_KEY || env.GROQ_API_KEY) {
    try {
      let resultText = "";
      const modelName = requestedModel || env.GEMINI_MODEL || "gemini-2.0-flash";

      const isGroqModel =
        modelName.startsWith("groq/") ||
        modelName.startsWith("openai/") ||
        modelName.startsWith("moonshotai/") ||
        modelName.startsWith("qwen/") ||
        modelName.startsWith("whisper") ||
        modelName.includes("llama") ||
        modelName.includes("gemma");
      if (isGroqModel) {
        if (!groq) throw new Error("GROQ_API_KEY is missing");
        if (modelName.startsWith("whisper")) {
          const payload = JSON.stringify({
            nextStep: "Transcription models are not supported in chat. Please switch to a chat model.",
            whatsappDraft: "",
            emailDraft: "",
            urgent: false
          });
          return json({ nextStep: "Transcription models are not supported in chat. Please switch to a chat model.", whatsappDraft: "", emailDraft: "", urgent: false });
        }
        
        const systemPrompt = `Manager note: ${note}\n\n` +
          `Return JSON with keys: nextStep, whatsappDraft, emailDraft, urgent (boolean), action (optional string), emailPayload (optional object). ` +
          `Instructions:\n` +
          `1. Analyze the conversation history and the new note.\n` +
          `2. If the user wants to SEND an email that was previously drafted:\n` +
          `   - Extract the recipient email, subject, and HTML body from the draft in the history.\n` +
          `   - Set "action" to "send_email".\n` +
          `   - Set "emailPayload" to { "to": "...", "subject": "...", "html": "..." }.\n` +
          `   - If recipient is missing, ask for it in "nextStep" and do NOT set action to "send_email".\n` +
          `3. If the user wants to DRAFT an email:\n` +
          `   - Create the draft in "emailDraft".\n` +
          `   - Set "nextStep" to "Draft prepared. Review it and say 'send' to send it.".\n` +
          `4. If an image is provided: Analyze it and answer the user's request in 'nextStep'.\n` +
          `5. If the note is a task: 'nextStep' is the action plan. Provide 'whatsappDraft' (short) and 'emailDraft' (clear).\n` +
          `Style: concise, actionable, manager-oriented. Return ONLY JSON.\n` +
          `Do not greet or introduce yourself. Do not write self-referential phrases (e.g., "I'm an assistant", "I'm Gemini"). If you cannot produce meaningful, context-specific drafts, set whatsappDraft and emailDraft to empty strings.\n` +
          `Do not produce generic meeting reminders or subject-only templates (e.g., "Reminder: Meeting today at 12:00", "Subject: Meeting Today at 12:00"). If the user did not explicitly request those exact strings with context, leave drafts empty.`;

        const limitedMsgs = Array.isArray(messages)
          ? messages.slice(-8).map((m: any) => ({ role: m.role, content: String(m.content || "").slice(0, 1500) }))
          : [];
        const supportsJson = !(
          modelName.includes("guard") ||
          modelName.includes("prompt-guard") ||
          modelName.includes("maverick") ||
          modelName.includes("scout")
        );
        let chatCompletion;
        try {
          chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              ...limitedMsgs,
              ...(note ? [{ role: "user", content: String(note).slice(0, 1000) }] : [])
            ],
            model: modelName,
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
              model: modelName,
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
         let targetModel = modelName;
         if (targetModel === "gemini-1.5-flash") {
            targetModel = "gemini-1.5-flash"; // Keep it simple first
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
           `Conversation History:\n${historyText}\n\n` +
           `Return JSON with keys: nextStep, whatsappDraft, emailDraft, urgent (boolean), action (optional string), emailPayload (optional object). ` +
           `Instructions:\n` +
           `1. Analyze the conversation history and the new note.\n` +
           `2. If the user wants to SEND an email that was previously drafted:\n` +
           `   - Extract the recipient email, subject, and HTML body from the draft in the history.\n` +
           `   - Set "action" to "send_email".\n` +
           `   - Set "emailPayload" to { "to": "...", "subject": "...", "html": "..." }.\n` +
           `   - If recipient is missing, ask for it in "nextStep" and do NOT set action to "send_email".\n` +
           `3. If the user wants to DRAFT an email:\n` +
           `   - Create the draft in "emailDraft".\n` +
           `   - Set "nextStep" to "Draft prepared. Review it and say 'send' to send it.".\n` +
           `4. If an image is provided: Analyze it and answer the user's request in 'nextStep'.\n` +
           `5. If the note is a task: 'nextStep' is the action plan. Provide 'whatsappDraft' (short) and 'emailDraft' (clear).\n` +
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
                console.log(`Model ${targetModel} not found, trying gemini-1.5-pro`);
                // Try pro if flash fails
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                try {
                  result = await fallbackModel.generateContent(parts);
                  break;
                } catch (e) {
                   // One last try with gemini-pro (legacy)
                   console.log("gemini-1.5-pro failed, trying gemini-pro");
                   const lastResort = genAI.getGenerativeModel({ model: "gemini-pro" });
                   try {
                     result = await lastResort.generateContent(parts);
                     break;
                   } catch (e2) {
                     throw e2;
                   }
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
        parsed = { nextStep: cleanText, whatsappDraft: "", emailDraft: "", urgent: false };
      }
      
      const normalizeDraft = (d: unknown) => {
        const s = typeof d === "string" ? d.trim() : "";
        if (!s) return "";
        const lower = s.toLowerCase();
        if (s.includes("[object Object]")) return "";
        const badExact = ["i'm an assistant", "i am an assistant", "assistant", "undefined", "null", "n/a"];
        if (badExact.includes(lower)) return "";
        const patterns = [
          /\bhi[,!.\s]/i,
          /\bhello[,!.\s]/i,
          /\bhey[,!.\s]/i,
          /how can i help/i,
          /here to assist/i,
          /what'?s on your mind/i,
          /i'?m (an )?assistant/i,
          /google'?s ai/i,
        ];
        if (patterns.some((re) => re.test(s))) {
          // If the text is mostly greeting/intro without task content, drop it
          const wordCount = s.split(/\s+/).filter(Boolean).length;
          if (wordCount <= 20) return "";
        }
        // Remove generic meeting reminder/subject artifacts
        const hasMeeting = /\bmeeting\b/i.test(s);
        const hasTime = /\b\d{1,2}:\d{2}\b/.test(s) || /\bnoon\b/i.test(s) || /\btoday\b/i.test(s);
        const isSubjectLine = /^subject:\s*/i.test(s);
        const isReminderLine = /^reminder:\s*/i.test(s);
        const tooShort = s.split(/\s+/).filter(Boolean).length <= 20;
        if ((isSubjectLine || isReminderLine) && hasMeeting && (hasTime || /\btoday\b/i.test(s)) && tooShort) {
          return "";
        }
        if (hasMeeting && hasTime && tooShort) {
          return "";
        }
        if (s.toLowerCase().includes("subject: meeting today at 12:00")) return "";
        if (s.toLowerCase().includes("reminder: meeting today at 12:00")) return "";
        return s;
      };
      parsed.whatsappDraft = normalizeDraft(parsed.whatsappDraft);
      parsed.emailDraft = normalizeDraft(parsed.emailDraft);
      if (!parsed.nextStep || typeof parsed.nextStep !== "string" || !parsed.nextStep.trim()) {
        parsed.nextStep = "Provide the conversation history and the new note for analysis.";
      }
      
      // Handle email sending
      if (parsed.action === 'send_email' && parsed.emailPayload && resend) {
        try {
          const { data, error } = await resend.emails.send({
            from: 'PayParq Team <team@mail.payparq.com>',
            to: parsed.emailPayload.to,
            subject: parsed.emailPayload.subject,
            html: parsed.emailPayload.html || parsed.emailPayload.body
          });
          
          if (error) {
            parsed.nextStep = `Failed to send email: ${error.message}`;
          } else {
            parsed.nextStep = `Email sent successfully! (ID: ${data?.id})`;
            // Clear drafts from response since it's sent
            parsed.emailDraft = "";
            parsed.whatsappDraft = "";
          }
        } catch (e: any) {
          parsed.nextStep = `Failed to send email: ${e.message}`;
        }
      } else if (parsed.action === 'send_email' && !resend) {
        parsed.nextStep = "I can't send the email because the Resend API key is missing.";
      }
      
      // Artificial delay to simulate "thinking" (0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return json({
        nextStep: parsed.nextStep || "",
        whatsappDraft: parsed.whatsappDraft || "",
        emailDraft: parsed.emailDraft || "",
        urgent: !!parsed.urgent
      });

    } catch (error: any) {
      console.error("AI API Error:", error);
      return json({
        error: error.message || "Internal server error",
        nextStep: "I'm having trouble connecting to the AI service right now. Please try again.",
        whatsappDraft: "",
        emailDraft: "",
        urgent: false
      }, 500);
    }
  }

  console.error("Missing API Keys");
  return json({
    error: "API Keys are missing. Please check your environment variables.",
    nextStep: "I'm having trouble connecting to the AI service right now. Please try again.",
    whatsappDraft: "",
    emailDraft: "",
    urgent: false
  }, 500);
}
