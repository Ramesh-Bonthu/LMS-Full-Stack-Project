const { MockInterview } = require("../models");
const fs = require("fs");
const pdf = require("pdf-parse");
const { generateCompletion } = require("../utils/aiService");

// Ensure the directory exists for resumes
const resumeDir = "uploads/resumes/";
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

function cleanAndCapSpeechText(text) {
  if (!text) return "";
  
  // 1. Remove Markdown tables, pipes, headers, bold, symbols, brackets, and emojis
  let cleaned = text
    .replace(/\|[^\n]+\|/g, "")
    .replace(/#+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[\~\`\>\_]/g, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  // 2. Cap at maximum 2 short sentences
  const sentences = cleaned.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (sentences.length > 2) {
    cleaned = sentences.slice(0, 2).join(" ");
  }

  // 3. Absolute word count safety net (max 35 words)
  const words = cleaned.split(/\s+/);
  if (words.length > 35) {
    cleaned = words.slice(0, 35).join(" ");
    if (!cleaned.endsWith(".")) cleaned += ".";
  }

  return cleaned;
}

const buildInterviewSystemPrompt = (type, subject, resumeText) => {
  const topicName = subject || type || "Technical Concepts";
  return `You are a strict technical interviewer conducting a formal job interview for "${topicName}".

MANDATORY INSTRUCTIONS:
1. DIRECT TECHNICAL QUESTION: Immediately ask ONE direct technical interview question about "${topicName}".
2. DO NOT ask the candidate what they want to talk about, what experience level they have, or to set an agenda.
3. DO NOT output tables, section lists, markdown, bold text (**), asterisks (*), pipes (|), or emojis.
4. STRICT LENGTH: Maximum 1 to 2 short sentences. Never exceed 25 words.
${resumeText ? "\nCandidate Resume Context:\n" + resumeText : ""}`;
};

const buildCommSystemPrompt = (subject) => {
  const topicName = subject || "General Conversation & Public Speaking";
  return `You are a professional communication coach interviewing a candidate to evaluate their English communication skills on "${topicName}".

MANDATORY RULES:
1. FOCUS: Keep the conversation strictly focused on "${topicName}".
2. MAXIMUM 2 LINES: Keep your responses strictly short (1-2 sentences maximum). Ask ONE clear open-ended question at a time.
3. DOMAIN BOUNDARY: Do NOT mention ChatGPT, OpenAI, or AI models. Never answer off-topic queries.
4. ZERO SPECIAL CHARACTERS: Pure plain text words only. No markdown, asterisks, hyphens, brackets, or emojis.`;
};

const DEMO_RESPONSES = [
  "Welcome to your technical interview. Could you start with a brief 1-minute introduction?",
  "Thank you. Can you explain the core concepts and primary use cases of this domain?",
  "Good. What is the most challenging technical problem you solved recently in this subject?",
  "Thank you for your response. That concludes our technical questions."
];

exports.startSession = async (req, res) => {
  try {
    const { type, subject } = req.body;
    const studentId = req.user.userId;
    const studentName = req.user.name;

    let resumeText = "";
    if (req.file) {
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const parse = typeof pdf === 'function' ? pdf : pdf.default;
        if (typeof parse === 'function') {
          const parsedData = await parse(dataBuffer);
          resumeText = parsedData?.text || "";
        }
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error parsing PDF:", err);
      }
    }

    const interview = await MockInterview.create({
      studentId, studentName, type, subject, status: "STARTED", transcript: [], resumeText
    });

    let responseText;
    try {
      const isComm = type === "COMMUNICATION";
      const systemPrompt = isComm 
        ? buildCommSystemPrompt(subject) 
        : buildInterviewSystemPrompt(type, subject, resumeText);
      
      const prompt = `Start the interview for "${subject || "Technical Concepts"}". Greet the candidate in ONE short sentence and ask ONE direct technical question about "${subject}". Do NOT ask what topic they want to discuss. Do NOT output agendas or markdown. Maximum 2 sentences.`;

      const rawResponse = await generateCompletion({ prompt, systemPrompt });
      responseText = cleanAndCapSpeechText(rawResponse) || `Welcome to your ${subject || "Technical"} interview. Can you explain the core concepts of ${subject}?`;
    } catch (e) {
      console.warn("AI generation fallback for startSession:", e.message);
      responseText = `Welcome to your ${subject || "Technical"} interview. Can you explain the core concepts of ${subject}?`;
    }

    interview.transcript = [{ role: "ai", content: responseText }];
    await interview.save();
    res.status(201).json({ interviewId: interview.id, message: responseText });
  } catch (error) {
    console.error("Error in startSession:", error);
    res.status(500).json({ message: "System error" });
  }
};

exports.chat = async (req, res) => {
  try {
    const { interviewId, message } = req.body;
    const interview = await MockInterview.findByPk(interviewId);
    if (!interview) return res.status(404).json({ message: "Not found" });

    const history = interview.transcript || [];
    history.push({ role: "user", content: message });

    let aiResponse;
    try {
      const isComm = interview.type === "COMMUNICATION";
      const systemPrompt = isComm 
        ? buildCommSystemPrompt(interview.subject) 
        : buildInterviewSystemPrompt(interview.type, interview.subject, interview.resumeText);

      const formattedMessages = history.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const rawAiResponse = await generateCompletion({
        systemPrompt,
        messages: formattedMessages
      });

      aiResponse = cleanAndCapSpeechText(rawAiResponse) || "Thank you. Let's move to our next technical question.";
    } catch (e) {
      console.warn("AI generation fallback for chat:", e.message);
      const aiMsgCount = history.filter(m => m.role === 'ai').length;
      aiResponse = DEMO_RESPONSES[aiMsgCount] || "Thank you. Let's move to our next technical question.";
    }

    history.push({ role: "ai", content: aiResponse });
    await interview.update({ transcript: history });
    res.json({ message: aiResponse });
  } catch (error) {
    res.status(500).json({ message: "Chat failed" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await MockInterview.findByPk(id);
    if (!interview) return res.status(404).json({ message: "Not found" });

    const history = interview.transcript || [];
    const topicName = interview.subject || interview.type || "Technical Concepts";

    const coachPrompt = `You are a senior technical hiring manager reviewing a candidate's performance in a mock interview for "${topicName}".
Analyze ONLY the candidate's answers from the transcript.

PROVIDE A STRUCTURED CANDIDATE EVALUATION IN THIS EXACT FORMAT (USE CLEAR BULLET POINTS WITH BULLET SYMBOL • AND NO MARKDOWN TABLES OR RAW PIPES):

Overall Score: X / 10

Key Strengths:
• [Strength point 1]
• [Strength point 2]

Areas for Improvement:
• [Improvement point 1]
• [Improvement point 2]

Actionable Guidance:
• [Specific study or answer tip 1]
• [Specific study or answer tip 2]

Summary:
[2-3 sentence overall candidate performance summary]`;

    let feedbackText;
    try {
      feedbackText = await generateCompletion({
        systemPrompt: coachPrompt,
        prompt: `Evaluate candidate performance for "${topicName}". Session Transcript:\n${JSON.stringify(history)}`
      });
    } catch (e) {
      console.warn("AI generation fallback for endSession:", e.message);
      feedbackText = `Overall Score: 8 / 10\n\nKey Strengths:\n• Good conceptual understanding\n• Clear communication\n\nAreas for Improvement:\n• Provide more detailed examples\n• Deepen technical terminology\n\nActionable Guidance:\n• Practice explaining core concepts with practical code scenarios\n\nSummary:\nSolid interview attempt. Focus on providing specific practical examples to reach top performance.`;
    }

    const scoreMatch = feedbackText.match(/Score:\s*(\d+)/i) || feedbackText.match(/(\d+)\s*\/\s*10/) || [null, "8"];
    const score = Math.min(10, Math.max(1, parseInt(scoreMatch[1]) || 8));

    await interview.update({ status: "COMPLETED", feedback: feedbackText, score });
    res.json({ feedback: feedbackText, score });
  } catch (error) {
    console.error("Error in endSession:", error);
    res.status(500).json({ message: "End failed" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const history = await MockInterview.findAll({
      where: { studentId },
      order: [["createdAt", "DESC"]]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "History failed" });
  }
};
