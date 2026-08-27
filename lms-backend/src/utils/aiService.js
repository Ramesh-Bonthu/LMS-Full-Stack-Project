const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

let groqClient = null;
if (process.env.GROQ_API_KEY) {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    console.warn("Failed to initialize Groq SDK:", err.message);
  }
}

let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.warn("Failed to initialize Gemini SDK:", err.message);
  }
}

const GROQ_MODELS = [
  process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it"
].filter(Boolean);

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro"
];

/**
 * Generate AI completion text with multi-model fallback across Groq and Gemini.
 */
async function generateCompletion({ prompt, systemPrompt = "", messages = [], jsonMode = false }) {
  // 1. Attempt Groq models first if GROQ_API_KEY is available
  if (groqClient) {
    for (const model of GROQ_MODELS) {
      try {
        const groqMessages = [];
        let combinedText = "";

        if (systemPrompt) {
          combinedText += `SYSTEM INSTRUCTION:\n${systemPrompt}\n\n`;
        }

        if (prompt) {
          combinedText += prompt;
        }

        if (jsonMode) {
          combinedText += "\n\nIMPORTANT: Respond ONLY with a valid raw JSON object matching the requested schema. Do not include markdown text formatting outside of JSON.";
        }

        if (messages && messages.length > 0) {
          groqMessages.push(...messages);
        } else {
          groqMessages.push({ role: "user", content: combinedText.trim() });
        }

        const options = { messages: groqMessages, model };
        const completion = await groqClient.chat.completions.create(options);
        const text = completion.choices[0]?.message?.content;
        if (text) return text;
      } catch (err) {
        console.warn(`Groq model '${model}' attempt failed (${err.status || err.message}). Details:`, err.error?.message || err.message);
      }
    }
  }

  // 2. Attempt Gemini models as fallback
  if (geminiClient) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const geminiModel = geminiClient.getGenerativeModel({ model: modelName });
        let fullPrompt = prompt || "";
        if (messages && messages.length > 0) {
          fullPrompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n" + (prompt || "");
        }
        if (systemPrompt) {
          fullPrompt = `SYSTEM INSTRUCTION:\n${systemPrompt}\n\nUSER REQUEST:\n${fullPrompt}`;
        }
        if (jsonMode) {
          fullPrompt += "\n\nIMPORTANT: Respond ONLY with a valid raw JSON object matching the requested schema. No markdown formatting outside of JSON.";
        }

        const result = await geminiModel.generateContent(fullPrompt);
        const text = result.response.text();
        if (text) return text;
      } catch (err) {
        console.warn(`Gemini model '${modelName}' attempt failed (${err.message}). Trying next candidate...`);
      }
    }
  }

  throw new Error("All AI models and providers failed.");
}

module.exports = {
  generateCompletion
};
