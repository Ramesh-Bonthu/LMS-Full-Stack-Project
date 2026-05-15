import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, 
  User, Bot, Sparkles, Loader2, Volume2, VolumeX, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error("Microphone error: " + event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
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
    
    // Remove asterisks and other markdown symbols for cleaner speech
    const cleanText = text.replace(/\*/g, '').replace(/#/g, '').trim();
    
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
    } else {
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsListening(true);
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
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in zoom-in duration-500">
        <Card className="overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white text-center space-y-4">
            <div className="inline-flex p-4 bg-white/20 rounded-full">
              <Sparkles className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold">Interview Completed!</h2>
            <div className="flex justify-center gap-2">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-8 rounded-full transition-all duration-1000 ${
                    i < feedback.score ? 'bg-yellow-400' : 'bg-white/20'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <p className="text-6xl font-black">{feedback.score}<span className="text-2xl opacity-50">/10</span></p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Expert Feedback
              </h3>
              <div className="p-6 bg-muted rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-inner border">
                {feedback.feedback}
              </div>
            </div>
            <Button onClick={onEnd} className="w-full h-12 text-lg">
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

          {/* AI Overlay / Avatar */}
          <div className="absolute top-4 right-4 w-48 aspect-video bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              {isSpeaking ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex gap-1"
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [10, 30, 10] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 bg-primary rounded-full"
                    />
                  ))}
                </motion.div>
              ) : (
                <Bot className="w-12 h-12 text-primary opacity-50" />
              )}
            </AnimatePresence>
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
               <span className="text-[10px] font-bold text-white/70 uppercase">Interviewer AI</span>
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
            <Button 
              variant={isListening ? "primary" : "secondary"} 
              size="lg" 
              className={`rounded-xl px-6 h-12 gap-2 transition-all duration-300 ${isListening ? 'bg-primary ring-4 ring-primary/20 scale-105' : ''}`}
              onClick={toggleListening}
              disabled={isProcessing}
            >
              {isListening ? (
                <>
                  <div className="flex gap-1 items-center">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Answer with Voice
                </>
              )}
            </Button>
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
