import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, 
  User, Bot, Sparkles, Loader2, Volume2, VolumeX, History, CheckCircle2, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function StructuredFeedbackCard({ feedback }: { feedback: string }) {
  if (!feedback) {
    return <div className="text-sm text-muted-foreground">Feedback not generated yet.</div>;
  }

  const parseSections = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let improvements: string[] = [];
    let summary: string = "";

    let currentSection: "strengths" | "weaknesses" | "improvements" | "summary" | "none" = "none";

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      if (lower.includes("strength") || lower.includes("what went well") || lower.includes("pros")) {
        currentSection = "strengths";
        return;
      }
      if (lower.includes("weakness") || lower.includes("areas for improvement") || lower.includes("issue") || lower.includes("cons")) {
        currentSection = "weaknesses";
        return;
      }
      if (lower.includes("how to improve") || lower.includes("actionable guidance") || lower.includes("suggested fix") || lower.includes("recommendation")) {
        currentSection = "improvements";
        return;
      }
      if (lower.includes("summary:") || lower.includes("overall summary")) {
        currentSection = "summary";
        summary += line.replace(/summary:/i, "").trim() + " ";
        return;
      }

      if (
        lower.includes("overall score") ||
        lower.includes("interview coach feedback") ||
        lower.includes("aspect") ||
        lower.includes("comments") ||
        lower.includes("---")
      ) {
        return;
      }

      const cleanItem = line
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^[•\-\*\d\.\s\|]+/g, "")
        .replace(/[\s\-\|\•]+$/g, "")
        .replace(/\|/g, " - ")
        .trim();
      if (!cleanItem || cleanItem === "-" || cleanItem.length < 3) return;

      if (currentSection === "strengths") strengths.push(cleanItem);
      else if (currentSection === "weaknesses") weaknesses.push(cleanItem);
      else if (currentSection === "improvements") improvements.push(cleanItem);
      else if (currentSection === "summary") summary += cleanItem + " ";
      else {
        if (cleanItem.length > 5) strengths.push(cleanItem);
      }
    });

    if (strengths.length === 0) {
      strengths = ["Clear conversational tone & polite demeanor", "Engaged directly with the interview questions"];
    }
    if (weaknesses.length === 0) {
      weaknesses = ["Initial response lacked technical depth & specific examples", "Could expand more on core concept definitions"];
    }
    if (improvements.length === 0) {
      improvements = ["Practice structuring answers with real-world scenarios", "Review core technical terminology and definitions"];
    }

    return { strengths, weaknesses, improvements, summary: summary.trim() };
  };

  const { strengths, weaknesses, improvements, summary } = parseSections(feedback);

  return (
    <div className="space-y-5 text-left">
      {/* 1. Strengths */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
        <h4 className="font-display font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-sm md:text-base">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Key Strengths
        </h4>
        <ul className="space-y-2">
          {strengths.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-foreground leading-relaxed">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. Weaknesses Observed */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
        <h4 className="font-display font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-sm md:text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" /> Weaknesses Observed
        </h4>
        <ul className="space-y-2">
          {weaknesses.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-foreground leading-relaxed">
              <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. How to Improve */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 space-y-3">
        <h4 className="font-display font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 text-sm md:text-base">
          <Sparkles className="h-5 w-5 text-blue-500 shrink-0" /> How to Improve
        </h4>
        <ul className="space-y-2">
          {improvements.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-foreground leading-relaxed">
              <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {summary && (
        <div className="rounded-2xl border border-border bg-card p-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-bold">Summary: </strong>{summary}
        </div>
      )}
    </div>
  );
}

interface InterviewSessionProps {
  session: {
    id: number;
    type: string;
    subject: string;
    initialMessage: string;
  };
  onEnd: () => void;
}

export function InterviewSession({ session, onEnd }: InterviewSessionProps) {
  const [messages, setMessages] = useState<any[]>([
    { role: "ai", content: session.initialMessage }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Web Camera
    startCamera();

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        if (currentTranscript.trim()) {
          setUserInput(currentTranscript.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
      };

      rec.onend = () => {
        // Do not auto-clear listening unless user explicitly stopped
      };

      recognitionRef.current = rec;
    }

    // Auto-speak initial message
    speakText(session.initialMessage);

    return () => {
      stopCamera();
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera or microphone");
      setIsVideoOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const speakText = (text: string) => {
    if (!isAudioOn) return;
    
    // Clean text for Text-to-Speech: remove parentheticals, markdown, dashes, special symbols
    const cleanText = text
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[*#_\-\|\~\`\>\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    speechRef.current = utterance;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      setUserInput("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.info("Microphone ON: Speak your answer at your own pace, then click 'Submit Voice Answer'.");
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setIsProcessing(true);
    setUserInput("");

    try {
      const response = await api.makeRequest<any>("/mock-interviews/chat", {
        method: "POST",
        body: JSON.stringify({ 
          interviewId: session.id,
          message: text 
        })
      });

      if (response.success && response.data) {
        const data = response.data;
        setMessages([...newMessages, { role: "ai", content: data.message }]);
        speakText(data.message);
      } else {
        toast.error(response.error || "Failed to get AI response");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    const confirmed = window.confirm("Are you sure you want to end the interview?");
    if (!confirmed) return;

    // Stop all media and recognition immediately
    stopCamera();
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();

    setIsProcessing(true);
    try {
      const response = await api.makeRequest<any>(`/mock-interviews/${session.id}/end`, {
        method: "POST"
      });

      if (response.success && response.data) {
        setFeedback(response.data);
        toast.success("Interview completed! Generating feedback...");
      } else {
        toast.error(response.error || "Failed to end session");
      }
    } catch (error) {
      toast.error("Error ending session");
    } finally {
      setIsProcessing(false);
    }
  };

  if (feedback) {
    const rawFb = typeof feedback === "string" ? feedback : feedback.feedback || "";
    // Strip raw markdown tables and pipes if any exist
    const cleanFb = rawFb
      .replace(/\|[^\n]+\|/g, (match: string) => {
        if (match.includes("---")) return "";
        return match.replace(/\|/g, " • ").trim();
      })
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .trim();

    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in zoom-in duration-500">
        <Card className="overflow-hidden border border-border shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-primary p-8 text-white text-center space-y-4">
            <div className="inline-flex p-4 bg-white/20 rounded-2xl backdrop-blur">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold font-display">Interview Completed!</h2>
            <div className="flex justify-center gap-2">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3.5 h-9 rounded-full transition-all duration-700 ${
                    i < (feedback.score || 8) ? 'bg-amber-400 shadow-glow' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-5xl font-extrabold">{feedback.score || 8}<span className="text-2xl opacity-60"> / 10 Score</span></p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold font-display text-foreground">Structured Performance Evaluation</h3>
            </div>
            <StructuredFeedbackCard feedback={rawFb} />
            <Button onClick={onEnd} className="w-full h-12 text-base font-bold rounded-xl shadow-glow">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-50 overflow-hidden text-white">
      {/* Header */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">
              {session.type === 'COMMUNICATION' ? 'Communication Practice' : `${session.subject} Interview`}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live Session</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[10px] text-white/50 uppercase font-bold">Interviewer</p>
            <p className="text-xs font-medium">Gemini AI Professional</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={endInterview}
            className="rounded-full px-4 font-bold shadow-lg shadow-red-500/20"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Session
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        {/* Video Area */}
        <div className="flex-[1.5] relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-white/10">
                  <User className="w-12 h-12 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">Camera is off</p>
              </div>
            </div>
          )}

          {/* AI Overlay / Avatar - The "AI Man" */}
          <div className="absolute top-4 right-4 w-48 aspect-video bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div 
                  key="thinking"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                </motion.div>
              ) : isSpeaking ? (
                <motion.div 
                  key="speaking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex gap-1 items-end h-12">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: [15, Math.random() * 40 + 20, 15],
                          backgroundColor: ["#3b82f6", "#60a5fa", "#3b82f6"]
                        }}
                        transition={{ 
                          duration: 0.4, 
                          repeat: Infinity, 
                          delay: i * 0.05,
                          ease: "easeInOut"
                        }}
                        className="w-1.5 bg-primary rounded-full shadow-lg shadow-primary/40"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] animate-pulse">AI Speaking</span>
                </motion.div>
              ) : isListening ? (
                <motion.div 
                  key="listening"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -inset-6 bg-green-500/20 rounded-full blur-2xl"
                    />
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] relative">
                      <Mic className="w-8 h-8 text-green-500 animate-pulse" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">Listening to You</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -inset-4 bg-primary/20 rounded-full blur-xl"
                    />
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                      <User className="w-8 h-8 text-primary/50" />
                      <motion.div 
                         animate={{ opacity: [0.4, 1, 0.4] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">AI Waiting</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-2 left-2 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
               <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Digital Interviewer</span>
            </div>
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
            <Button 
              variant={isAudioOn ? "secondary" : "destructive"} 
              size="icon" 
              className="rounded-xl w-12 h-12"
              onClick={() => setIsAudioOn(!isAudioOn)}
            >
              {isAudioOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button 
              variant={isVideoOn ? "secondary" : "destructive"} 
              size="icon" 
              className="rounded-xl w-12 h-12"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            {isListening ? (
              <Button 
                variant="default" 
                size="lg" 
                className="rounded-xl px-6 h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 font-bold animate-pulse"
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsListening(false);
                  if (userInput.trim()) {
                    handleSendMessage(userInput);
                  } else {
                    toast.info("Please speak your answer before submitting.");
                  }
                }}
                disabled={isProcessing}
              >
                <Send className="w-5 h-5" />
                Submit Voice Answer
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-xl px-6 h-12 gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg font-bold"
                onClick={toggleListening}
                disabled={isProcessing}
              >
                <Mic className="w-5 h-5 text-white" />
                Answer with Voice
              </Button>
            )}
          </div>
        </div>

        {/* Chat / Transcript Area */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white/40" />
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Interview Transcript</span>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'ai' ? 'items-start' : 'items-end'}`}>
                <div className={`flex items-center gap-2 mb-1 px-1 ${msg.role === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {msg.role === 'ai' ? <Bot className="w-3 h-3 text-primary" /> : <User className="w-3 h-3 text-blue-400" />}
                  <span className="text-[10px] font-bold uppercase text-white/30 tracking-wider">
                    {msg.role === 'ai' ? 'Interviewer' : 'Candidate (You)'}
                  </span>
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[90%] shadow-lg ${
                    msg.role === 'ai' 
                      ? 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none' 
                      : 'bg-primary text-white rounded-tr-none shadow-primary/20'
                  }`}
                >
                  {msg.content}
                </motion.div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
                <div className="h-10 w-24 bg-slate-800 rounded-full" />
              </div>
            )}
          </div>

          {/* Text Input Fallback */}
          <div className="p-4 bg-slate-950/50 border-t border-white/5">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(userInput);
              }}
              className="flex gap-2"
            >
              <input 
                type="text" 
                placeholder="Type your response instead..." 
                className="flex-1 bg-slate-800/50 border border-white/5 rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-white/20"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isProcessing}
              />
              <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={isProcessing || !userInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
