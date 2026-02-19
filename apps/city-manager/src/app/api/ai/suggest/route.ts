import { env } from "../../../../lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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

  if (env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const modelName = requestedModel || env.GEMINI_MODEL || "gemini-flash-latest";
      const model = genAI.getGenerativeModel({ model: modelName });

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
        `Style: concise, actionable, manager-oriented.`
      });

      let result: any;
      let retries = 3;
      while (retries > 0) {
        try {
          result = await model.generateContent(parts);
          break;
        } catch (error: any) {
          if (error.message.includes("429") && retries > 1) {
            console.log(`Rate limited (429), retrying... attempts left: ${retries - 1}`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            retries--;
          } else {
            throw error;
          }
        }
      }
      const response = await result.response;
      const text = response.text();
      
      // Clean up text if it contains markdown code blocks
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        // If JSON parsing fails, use the raw text as nextStep
        parsed = { nextStep: cleanText, whatsappDraft: "", emailDraft: "", urgent: false };
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
      console.error("Gemini API Error:", error);
      return json({
        nextStep: "I'm having trouble connecting to the AI service right now. Please try again.",
        whatsappDraft: "",
        emailDraft: "",
        urgent: false
      }, 500);
    }
  }

  return json({
    nextStep: "Gemini API Key is missing.",
    whatsappDraft: "",
    emailDraft: "",
    urgent: false
  }, 500);
}
