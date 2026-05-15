const { MockInterview } = require("../models");
const Groq = require("groq-sdk");
const fs = require("fs");
const pdf = require("pdf-parse");

// Ensure the directory exists for resumes
const resumeDir = "uploads/resumes/";
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

let groq;
const getGroq = () => {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

const INTERVIEW_SYSTEM_PROMPT = `
You are a professional technical interviewer. 
- Ask one question at a time.
- Stay in character.
- CONCISENESS: Keep your responses and follow-up comments brief and professional. Avoid long-winded explanations or deep-diving into answers unless specifically asked.
- WARM-UP PHASE: Start the interview with a friendly greeting and ONE general warm-up question (e.g., "How are you today?" or "Tell me a bit about yourself") before diving into the topic.
- TECHNICAL PHASE: After the warm-up, gradually move into technical questions. Start basic and move to advanced topics.
- RESUME ANALYSIS: If resume text is provided, tailor your questions to the candidate's specific experience, projects, and skills mentioned in the resume.
- IMPORTANT: Use plain text only. DO NOT use Markdown, bold (**), asterisks (*), or any symbols. This text will be read aloud by a text-to-speech system.
`;

const COMMUNICATION_SYSTEM_PROMPT = `
You are a friendly and engaging communication coach. 
- Your goal is to help the user improve their conversational English and communication skills.
- Be supportive, natural, and conversational.
- CONCISENESS: Keep your responses medium-length. Do not provide overly detailed or "essay-like" explanations. One or two short paragraphs or a few sentences are usually enough.
- You can talk about ANYTHING: hobbies, life, technology, travel, movies, or even just daily routines.
- If the user specifies a topic, stick to it. If not, start with a friendly greeting and an open-ended conversation starter.
- Ask questions that encourage longer, descriptive answers from the user, but keep YOUR responses snappy.
- Occasionally provide gentle tips on how they could express themselves better if they make a clear mistake.
- IMPORTANT: Use plain text only. DO NOT use Markdown, bold (**), asterisks (*), or any symbols. This text will be read aloud by a text-to-speech system.
`;

const DEMO_RESPONSES = [
  "Hello! I'm your AI interviewer. How are you doing today?",
  "That's good to hear! To get started, could you please tell me a bit about your background and what interests you about this field?",
  "Excellent. Now, tell me about a significant technical project you've worked on recently.",
  "That sounds like a great project. What was the biggest challenge you faced there?",
  "Thank you. We'll be in touch with the results soon!"
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
        // Universal import fix for Node v22
        const parse = typeof pdf === 'function' ? pdf : pdf.default;
        if (typeof parse === 'function') {
          const parsedData = await parse(dataBuffer);
          resumeText = parsedData?.text || "";
        }
        // Delete the temporary file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error parsing PDF:", err);
      }
    }

    const interview = await MockInterview.create({
      studentId, studentName, type, subject, status: "STARTED", transcript: [], resumeText
    });

    let responseText;
    const groqClient = getGroq();

    if (groqClient) {
      try {
        const isComm = type === "COMMUNICATION";
        const systemPrompt = isComm ? COMMUNICATION_SYSTEM_PROMPT : INTERVIEW_SYSTEM_PROMPT;
        
        let prompt;
        if (isComm) {
          prompt = subject 
            ? `Start a friendly conversation about "${subject}". Greet me and ask an open-ended question to get me talking.`
            : `Start a friendly conversation. Greet me and ask an interesting open-ended question about any general topic to get me talking.`;
        } else {
          prompt = `Start a ${type} interview about ${subject}. ${resumeText ? "The candidate's resume is provided below." : ""} 
          Greet them warmly and ask a simple warm-up question.
          
          ${resumeText ? "RESUME TEXT:\n" + resumeText : ""}`;
        }

        const completion = await groqClient.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          model: "llama-3.1-8b-instant",
        });
        responseText = completion.choices[0].message.content;
      } catch (e) {
        responseText = DEMO_RESPONSES[0];
      }
    } else {
      responseText = DEMO_RESPONSES[0];
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
    const groqClient = getGroq();

    if (groqClient) {
      try {
        const isComm = interview.type === "COMMUNICATION";
        const systemPrompt = isComm ? COMMUNICATION_SYSTEM_PROMPT : INTERVIEW_SYSTEM_PROMPT;

        const messages = [
          { role: "system", content: systemPrompt + (interview.resumeText ? "\nResume Context: " + interview.resumeText : "") },
          ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
        ];
        const completion = await groqClient.chat.completions.create({
          messages,
          model: "llama-3.1-8b-instant",
        });
        aiResponse = completion.choices[0].message.content;
      } catch (e) {
        const aiMsgCount = history.filter(m => m.role === 'ai').length;
        aiResponse = DEMO_RESPONSES[aiMsgCount] || "Thank you. Let's continue.";
      }
    } else {
      const aiMsgCount = history.filter(m => m.role === 'ai').length;
      aiResponse = DEMO_RESPONSES[aiMsgCount] || "Thank you. Let's continue.";
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
    let feedback;
    const groqClient = getGroq();

    if (groqClient) {
      try {
        const isComm = interview.type === "COMMUNICATION";
        const coachPrompt = isComm 
          ? "You are a communication coach. Review this conversation and provide feedback on the user's communication skills, clarity, and engagement. Provide a score (1-10)."
          : "You are an interview coach. Provide feedback and a score (1-10).";

        const completion = await groqClient.chat.completions.create({
          messages: [
            { role: "system", content: coachPrompt },
            { role: "user", content: `Review this session: ${JSON.stringify(history)}` }
          ],
          model: "llama-3.1-8b-instant",
        });
        feedback = completion.choices[0].message.content;
      } catch (e) {
        feedback = "Good job! (Demo feedback)";
      }
    } else {
      feedback = "Good job! (Demo feedback)";
    }

    const scoreMatch = feedback.match(/(\d+)\/10/) || [null, "8"];
    const score = parseInt(scoreMatch[1]);

    await interview.update({ status: "COMPLETED", feedback, score });
    res.json({ feedback, score });
  } catch (error) {
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
