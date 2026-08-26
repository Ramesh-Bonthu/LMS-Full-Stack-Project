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
  process.env.GROQ_MODEL,
  "llama-3.3-70b-versatile",
  "llama-3.2-3b-preview",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "llama-3.1-8b-instant"
].filter(Boolean);

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-exp",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-pro"
];

/**
 * Generate AI completion text with multi-model fallback across Gemini and Groq.
 */
async function generateCompletion({ prompt, systemPrompt = "", messages = [], jsonMode = false }) {
  // 1. Attempt Gemini models first
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
        if (text) {
          return text;
        }
      } catch (err) {
        console.warn(`Gemini model '${modelName}' attempt failed (${err.message}). Trying next candidate...`);
      }
    }
  }

  // 2. Attempt Groq models
  if (groqClient) {
    for (const model of GROQ_MODELS) {
      try {
        const groqMessages = [];
        if (systemPrompt) {
          groqMessages.push({ role: "system", content: systemPrompt });
        }
        if (messages && messages.length > 0) {
          groqMessages.push(...messages);
        } else if (prompt) {
          groqMessages.push({ role: "user", content: prompt });
        }

        const options = { messages: groqMessages, model };
        if (jsonMode) {
          options.response_format = { type: "json_object" };
        }

        try {
          const completion = await groqClient.chat.completions.create(options);
          const text = completion.choices[0]?.message?.content;
          if (text) return text;
        } catch (jsonErr) {
          // If model doesn't support json_object response_format, retry without response_format
          if (jsonMode && (jsonErr.status === 400 || jsonErr.message?.includes("response_format"))) {
            delete options.response_format;
            const completion = await groqClient.chat.completions.create(options);
            const text = completion.choices[0]?.message?.content;
            if (text) return text;
          } else {
            throw jsonErr;
          }
        }
      } catch (err) {
        console.warn(`Groq model '${model}' attempt failed (${err.status || err.message}). Trying next candidate...`);
      }
    }
  }

  throw new Error("All AI models and providers failed.");
}

module.exports = {
  generateCompletion
};
