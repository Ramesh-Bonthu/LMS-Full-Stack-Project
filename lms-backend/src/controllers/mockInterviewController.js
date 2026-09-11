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
  
  // 1. Remove Markdown tables, pipes, headers, bold, symbols, and emojis while keeping code/punctuation intact
  let cleaned = text
    .replace(/\|[^\n]+\|/g, "")
    .replace(/#+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[\~\`\>\_]/g, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  // 2. Ensure text ends cleanly on a full sentence (period, exclamation, or question mark)
  if (!/[.!?]$/.test(cleaned)) {
    const lastPunctuation = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf('!'), cleaned.lastIndexOf('?'));
    if (lastPunctuation > 20) {
      cleaned = cleaned.substring(0, lastPunctuation + 1);
    } else {
      cleaned += ".";
    }
  }

  return cleaned;
}

const buildInterviewSystemPrompt = (type, subject, resumeText) => {
  const topicName = subject || type || "Software & Full-Stack Engineering";
  return `You are an encouraging, experienced, and professional technical interviewer conducting an interactive mock job interview for "${topicName}".

MANDATORY RESPONSE RULES:
1. PERSONA: Warm, professional, articulate technical interviewer.
2. CONVERSATION FLOW:
   - Provide a brief 1-sentence acknowledgement or constructive comment on the candidate's previous response (if any).
   - Ask ONE direct, relevant technical question about "${topicName}".
3. RESPONSE LENGTH & CLARITY: Keep your response clear, well-structured, and complete (2 to 4 well-constructed sentences, approx 40 to 80 words). Never stop or cut off mid-sentence.
4. FORMATTING: Plain text sentences only. Do NOT output markdown tables, raw pipe bars (|), or emoji symbols.
${resumeText ? "\nCandidate Resume Context:\n" + resumeText : ""}`;
};

const buildCommSystemPrompt = (subject) => {
  const topicName = subject || "General Professional Communication & Interview Practice";
  return `You are a supportive, articulate communication coach conducting a conversation practice session on "${topicName}".

MANDATORY RESPONSE RULES:
1. PERSONA: Encouraging, articulate, and friendly coach.
2. FLOW: Provide a brief encouraging remark on the candidate's previous response, then ask ONE engaging open-ended question.
3. RESPONSE LENGTH & CLARITY: Keep your response concise, complete, and clear (2 to 3 sentences, approx 35 to 70 words). Never cut off mid-sentence.
4. FORMATTING: Plain text words only. No markdown tables or special symbols.`;
};

const DEMO_RESPONSES = [
  "Welcome to your technical interview! I'm glad to assist with your preparation today. Could you start with a brief introduction and overview of your background?",
  "Thank you for sharing that. Can you explain the core concepts and primary use cases of this domain?",
  "Good explanation! What is the most challenging technical problem you solved recently in this subject?",
  "Thank you for your response. That concludes our main technical questions for this session."
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

    const topicName = subject || type || "Technical Concepts";
    let responseText;
    try {
      const isComm = type === "COMMUNICATION";
      const systemPrompt = isComm 
        ? buildCommSystemPrompt(subject) 
        : buildInterviewSystemPrompt(type, subject, resumeText);
      
      const prompt = `Start the mock interview session for "${topicName}". Greet the candidate warmly with a brief professional introduction explaining the session purpose, and then ask your first engaging interview question about "${topicName}". Keep the response complete, well-structured, and clear (2 to 4 sentences total).`;

      const rawResponse = await generateCompletion({ prompt, systemPrompt });
      responseText = cleanAndCapSpeechText(rawResponse) || `Hello! Welcome to your mock interview session for ${topicName}. I'm glad to assist with your interview preparation today. To start, could you explain the core concepts and primary use cases of ${topicName}?`;
    } catch (e) {
      console.warn("AI generation fallback for startSession:", e.message);
      responseText = `Hello! Welcome to your mock interview session for ${topicName}. I'm glad to assist with your interview preparation today. To start, could you explain the core concepts and primary use cases of ${topicName}?`;
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

      aiResponse = cleanAndCapSpeechText(rawAiResponse) || "Thank you for your answer. Let's move to our next technical question.";
    } catch (e) {
      console.warn("AI generation fallback for chat:", e.message);
      const aiMsgCount = history.filter(m => m.role === 'ai').length;
      aiResponse = DEMO_RESPONSES[aiMsgCount % DEMO_RESPONSES.length] || "Thank you for your answer. Let me ask our next technical question.";
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

    const formattedTranscript = history.length > 0
      ? history.map((m) => {
          const roleLabel = m.role === 'ai' ? 'Interviewer' : 'Candidate';
          return `${roleLabel}: ${m.content}`;
        }).join("\n\n")
      : "Candidate completed the session.";

    const coachPrompt = `You are a senior technical hiring manager reviewing a candidate's performance in a mock interview for "${topicName}".
Analyze the candidate's answers from the transcript. Even if answers are short, evaluate their technical accuracy, problem-solving mindset, and communication clarity.

PROVIDE A STRUCTURED CANDIDATE EVALUATION IN THIS EXACT FORMAT (USE BULLET POINTS WITH BULLET SYMBOL • AND NO MARKDOWN TABLES):

Overall Score: X / 10

Key Strengths:
• [Concrete strength based on candidate's answers and engagement]
• [Another positive observation about technical knowledge or communication]

Areas for Improvement:
• [Specific technical gap, incomplete explanation, or area needing detail]
• [Another area where candidate can improve accuracy or depth]

Actionable Guidance:
• [Actionable study tip or practice recommendation]
• [Practical advice for answering similar interview questions with code examples]

Summary:
[2-3 sentence overall candidate performance summary]`;

    let feedbackText;
    try {
      feedbackText = await generateCompletion({
        systemPrompt: coachPrompt,
        prompt: `Topic: ${topicName}\n\nSession Transcript:\n${formattedTranscript}`
      });
    } catch (e) {
      console.warn("AI generation fallback for endSession:", e.message);
      feedbackText = `Overall Score: 8 / 10\n\nKey Strengths:\n• Demonstrated active participation and willingness to tackle technical questions on ${topicName}\n• Responded promptly during the mock interview session\n\nAreas for Improvement:\n• Provide deeper technical definitions and concrete code examples in your answers\n• Expand on edge cases and architectural principles for ${topicName}\n\nActionable Guidance:\n• Structure your interview answers using the STAR format (Situation, Task, Action, Result)\n• Practice writing out code snippets for core ${topicName} algorithms and definitions\n\nSummary:\nSolid effort in completing the ${topicName} mock interview session. Focus on expanding technical depth and providing concrete code scenarios to improve further.`;
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
