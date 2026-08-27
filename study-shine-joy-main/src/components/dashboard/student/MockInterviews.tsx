import React, { useState, useEffect } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Video, Mic, History, PlayCircle, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { InterviewSession, StructuredFeedbackCard } from "./InterviewSession";
import { api } from "@/lib/api";

export function MockInterviews() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  
  // Selection State
  const [type, setType] = useState<string>("TOPIC");
  const [subject, setSubject] = useState<string>("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.makeRequest<any[]>("/mock-interviews/history");
      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async () => {
    if (!subject && type !== "COMMUNICATION") {
      toast.error("Please enter a topic or job role");
      return;
    }

    setIsStarting(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("subject", subject);
      if (type === "RESUME" && (window as any).selectedResume) {
        formData.append("resume", (window as any).selectedResume);
      }

      const response = await api.makeFormDataRequest<any>("/mock-interviews/start", formData);

      if (response.success && response.data) {
        const data = response.data;
        // Clear global file reference after use
        (window as any).selectedResume = null;
        
        setActiveSession({
          id: data.interviewId,
          type,
          subject,
          initialMessage: data.message
        });
        toast.success("Interview session started!");
      } else {
        toast.error(response.error || "Failed to start session");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setIsStarting(false);
    }
  };

  if (activeSession) {
    return (
      <InterviewSession 
        session={activeSession} 
        onEnd={() => {
          setActiveSession(null);
          fetchHistory();
        }} 
      />
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            AI Mock Interviews
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Practice your skills with our advanced AI interviewer using video and voice.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all gap-2 bg-primary text-white">
              <PlayCircle className="w-5 h-5" />
              New Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Setup Your Interview</DialogTitle>
              <CardDescription>
                Choose how you want to be interviewed today.
              </CardDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interview Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOPIC">Specific Topic (e.g. React, Java)</SelectItem>
                    <SelectItem value="ROLE">Job Role (e.g. Software Engineer)</SelectItem>
                    <SelectItem value="RESUME">Resume-Based</SelectItem>
                    <SelectItem value="COMMUNICATION">Communication Practice (General Chat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {type === "TOPIC" ? "What topic?" : type === "ROLE" ? "What role?" : type === "COMMUNICATION" ? "What would you like to talk about?" : "Confirm your profile"}
                </label>
                <Input 
                  placeholder={type === "TOPIC" ? "Enter topic name..." : type === "ROLE" ? "Enter job title..." : "Enter interest or topic (optional)..."}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12"
                />
              </div>

              {type === "RESUME" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Resume (PDF)</label>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          (window as any).selectedResume = file;
                          toast.success("Resume attached: " + file.name);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <PlayCircle className="w-8 h-8 text-primary opacity-50" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF only (max 5MB)</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Sparkles className="w-4 h-4" />
                  Requirements
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Video className="w-3 h-3" /> Camera access recommended
                  </li>
                  <li className="flex items-center gap-2">
                    <Mic className="w-3 h-3" /> Microphone access required
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Real-time AI conversation
                  </li>
                </ul>
              </div>

              <Button 
                onClick={startInterview} 
                className="w-full h-12 text-lg" 
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing Session...
                  </>
                ) : "Start Interview Now"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Video className="w-24 h-24 text-blue-900" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Video className="w-5 h-5" />
              Video Enabled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800/70 text-sm">
              Practice eye contact and facial expressions with real-time video tracking.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Mic className="w-24 h-24 text-purple-900" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Mic className="w-5 h-5" />
              Voice Interaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-800/70 text-sm">
              Speak naturally. Our AI listens, understands, and responds instantly.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-24 h-24 text-emerald-900" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Sparkles className="w-5 h-5" />
              Smart Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-emerald-800/70 text-sm">
              Get detailed performance analytics and improvement tips from Gemini AI.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Interview History
          </CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">#{session.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{session.subject}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={session.status === "COMPLETED" ? "secondary" : "default"}
                        className={session.status === "COMPLETED" ? "bg-green-100 text-green-800 border-none" : ""}
                      >
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.score ? (
                        <div className="flex items-center gap-1 font-bold text-primary">
                          {session.score}/10
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">View Feedback</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Interview Feedback - {session.subject}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <StructuredFeedbackCard feedback={session.feedback} />
                            <div className="space-y-2">
                              <h4 className="font-semibold">Transcript</h4>
                              <div className="space-y-3">
                                {session.transcript?.map((msg: any, i: number) => (
                                  <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                                      msg.role === 'ai' 
                                        ? 'bg-blue-50 text-blue-900 rounded-tl-none' 
                                        : 'bg-primary text-white rounded-tr-none'
                                    }`}>
                                      <p className="font-bold mb-1 uppercase text-[10px] opacity-70">
                                        {msg.role === 'ai' ? 'Interviewer' : 'You'}
                                      </p>
                                      {msg.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-12 bg-muted/20 rounded-xl border-2 border-dashed">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No interview sessions found.</p>
              <p className="text-xs text-muted-foreground mt-1">Start your first mock interview above!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
