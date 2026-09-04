import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  ShieldCheck,
  GraduationCap,
  X,
  CornerDownRight,
  RefreshCw,
  Search,
  Users,
  Trash2
} from "lucide-react";
import { type Announcement, type Course, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Btn } from "../../shared/UIPrimitives";

interface CourseDiscussionForumProps {
  course?: Course | null;
  isAddModalOpen?: boolean;
  onCloseModal?: () => void;
  onTopicCreated?: () => void;
}

interface ChatMessage {
  id: number;
  title?: string;
  body: string;
  authorName: string;
  authorRole: string;
  courseId?: number;
  createdAt: string;
  time: string;
  replyTo?: {
    authorName: string;
    body: string;
  };
}

export function CourseDiscussionForum({
  course,
  isAddModalOpen = false,
  onCloseModal,
  onTopicCreated,
}: CourseDiscussionForumProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const courseTitle = course ? course.title || course.name : "Course Workspace";
  const courseCode = course ? course.code : "LMS";
  const storageKey = `lms_course_discussion_${course?.id || "all"}`;

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, 100);
  };

  const fetchChatMessages = async () => {
    try {
      setLoading(true);

      // 1. Load locally cached chat messages
      let localMsgs: ChatMessage[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) localMsgs = JSON.parse(raw);
      } catch (e) {
        localMsgs = [];
      }

      // 2. Fetch remote discussion posts & convert to chat messages
      const res = await api.getAnnouncements("DISCUSSION");
      let remoteMsgs: ChatMessage[] = [];

      if (res.success && res.data && Array.isArray(res.data)) {
        res.data.forEach((ann: any) => {
          // Exclude official broadcast announcements from discussion forum
          if (ann.category && ann.category.toUpperCase() === "ANNOUNCEMENT") return;

          if (course) {
            const cId = String(course.id);
            const aCode = (course.code || "").toLowerCase();
            const aTitle = (course.title || "").toLowerCase();
            const annTitle = (ann.title || "").toLowerCase();

            const isMatch =
              (ann.courseId && String(ann.courseId) === cId) ||
              (!ann.courseId && (annTitle.includes(aCode) || annTitle.includes(aTitle))) ||
              !ann.courseId;

            if (!isMatch) return;
          }

          const createdDate = ann.createdAt ? new Date(ann.createdAt) : new Date();
          const formattedTime = createdDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          // Parent topic/message
          remoteMsgs.push({
            id: Number(ann.id),
            title: ann.title,
            body: ann.body,
            authorName: ann.authorName || "Faculty Instructor",
            authorRole: (ann.authorRole || "FACULTY").toUpperCase(),
            courseId: ann.courseId ? Number(ann.courseId) : undefined,
            createdAt: ann.createdAt || new Date().toISOString(),
            time: ann.time || formattedTime,
          });

          // Replies formatted as chat messages
          if (Array.isArray(ann.replies)) {
            ann.replies.forEach((rep: any, rIdx: number) => {
              const repTime = rep.createdAt
                ? new Date(rep.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : formattedTime;

              remoteMsgs.push({
                id: Number(rep.id || `${ann.id}${rIdx}`),
                body: rep.body,
                authorName: rep.authorName || "Enrolled Student",
                authorRole: (rep.authorRole || "STUDENT").toUpperCase(),
                courseId: ann.courseId ? Number(ann.courseId) : undefined,
                createdAt: rep.createdAt || new Date().toISOString(),
                time: repTime,
                replyTo: {
                  authorName: ann.authorName || "Faculty Instructor",
                  body: ann.title || ann.body,
                },
              });
            });
          }
        });
      }

      // 3. Backend DB is single source of truth for active messages
      const finalMsgs: ChatMessage[] = [...remoteMsgs];

      // Keep temporary local items only if created within the last 10 seconds and not yet in remoteMsgs
      const nowMs = Date.now();
      localMsgs.forEach((lm) => {
        const isRecentTemp =
          nowMs - new Date(lm.createdAt).getTime() < 10000 &&
          !finalMsgs.some(
            (rm) => rm.body.trim() === lm.body.trim() && rm.authorName.trim() === lm.authorName.trim()
          );
        if (isRecentTemp) {
          finalMsgs.push(lm);
        }
      });

      // Default welcome message if empty
      if (finalMsgs.length === 0) {
        finalMsgs.push({
          id: 1000001,
          body: `Welcome to the official ${courseTitle} discussion forum! Enrolled students and faculty can share thoughts, ask questions, and collaborate here.`,
          authorName: "Course Moderator",
          authorRole: "FACULTY",
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }

      const sortedMsgs = finalMsgs.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(sortedMsgs);
      localStorage.setItem(storageKey, JSON.stringify(sortedMsgs));
    } catch (err) {
      console.error("Error loading discussion messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatMessages();
    // Auto-poll for new student/faculty messages every 3 seconds
    const pollInterval = setInterval(() => {
      fetchChatMessages();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [course?.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const currentUserName =
      user?.name || (user?.role?.toUpperCase() === "FACULTY" ? "Faculty Instructor" : "Student");
    const currentUserRole = (user?.role || "STUDENT").toUpperCase();
    const now = new Date();

    const newMsg: ChatMessage = {
      id: Date.now(),
      body: inputText.trim(),
      authorName: currentUserName,
      authorRole: currentUserRole,
      courseId: course ? Number(course.id) : undefined,
      createdAt: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      replyTo: replyingTo
        ? {
            authorName: replyingTo.authorName,
            body: replyingTo.title ? `${replyingTo.title}: ${replyingTo.body}` : replyingTo.body,
          }
        : undefined,
    };

    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    localStorage.setItem(storageKey, JSON.stringify(updatedMsgs));
    setInputText("");
    setReplyingTo(null);
    scrollToBottom(true);

    try {
      await api.createAnnouncement({
        title: replyingTo ? `Reply to ${replyingTo.authorName}` : `${currentUserName}'s Post`,
        body: newMsg.body,
        audience: "STUDENTS",
        category: "DISCUSSION",
        courseId: course ? Number(course.id) : undefined,
        authorName: currentUserName,
        authorRole: currentUserRole,
      } as any);
      fetchChatMessages();
    } catch (e) {
      console.error("Async send error:", e);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this discussion message?");
    if (!confirmDelete) return;

    // Immediate local removal
    const updated = messages.filter((m) => m.id !== msgId);
    setMessages(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Backend delete request
    try {
      await api.deleteAnnouncement(msgId);
      fetchChatMessages();
    } catch (e) {
      console.error("Error deleting message:", e);
    }
  };

  const filteredMessages = searchTerm.trim()
    ? messages.filter(
        (m) =>
          m.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  return (
    <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border shadow-soft bg-card flex flex-col h-[680px] overflow-hidden">
      {/* UI MATCHING HEADER BAR */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between shadow-xs shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base font-display text-foreground">{courseTitle}</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                {courseCode} Forum
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Interactive Discussion Forum • Faculty Instructor & Enrolled Students
            </p>
          </div>
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex items-center gap-1.5 bg-secondary/80 border border-border rounded-xl px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="bg-transparent text-xs text-foreground outline-none w-32 sm:w-44"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchTerm("");
                  setShowSearch(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Search discussion messages"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={fetchChatMessages}
            className="p-2 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Refresh discussion feed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* MATCHING UI CHAT FEED */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-secondary/20 relative"
      >
        {/* Date Divider Pill */}
        <div className="flex justify-center my-2">
          <span className="bg-card border border-border text-muted-foreground text-[11px] font-bold px-3.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
            Discussion Feed
          </span>
        </div>

        {filteredMessages.map((msg) => {
          const isFaculty = msg.authorRole === "FACULTY" || msg.authorRole === "ADMIN";
          const isMe =
            msg.authorName.toLowerCase() === (user?.name || "").toLowerCase() ||
            (user?.role?.toUpperCase() === msg.authorRole && msg.authorName.includes(user?.name || "___"));

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 group ${isMe ? "justify-end" : "justify-start"}`}
            >
              {/* Left Avatar for other members */}
              {!isMe && (
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                    isFaculty
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                  title={`${msg.authorName} (${msg.authorRole})`}
                >
                  {isFaculty ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <GraduationCap className="h-4 w-4" />
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-xs text-sm transition-all ${
                  isMe
                    ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-xs"
                    : "bg-card border border-border text-foreground rounded-tl-xs"
                }`}
              >
                {/* Quoted Reply Preview Block */}
                {msg.replyTo && (
                  <div className="mb-2.5 rounded-xl bg-secondary/60 p-2.5 border-l-4 border-primary text-xs text-muted-foreground">
                    <span className="font-bold block text-primary font-display">
                      {msg.replyTo.authorName}
                    </span>
                    <p className="line-clamp-2 italic text-[11px] mt-0.5">{msg.replyTo.body}</p>
                  </div>
                )}

                {/* Author Name & Role Tag (For Received Messages) */}
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-xs text-foreground font-display">
                      {msg.authorName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isFaculty
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {isFaculty ? "Teacher / Faculty" : "Student"}
                    </span>
                  </div>
                )}

                {/* Optional Custom Topic Title (Hides auto-generated post titles) */}
                {msg.title &&
                  !msg.title.endsWith("'s Post") &&
                  !msg.title.startsWith("Reply to ") &&
                  !msg.title.toLowerCase().includes("discussion topic") && (
                    <h4 className="font-bold text-sm mb-1.5 text-foreground border-b border-border/50 pb-1.5 font-display">
                      {msg.title}
                    </h4>
                  )}

                {/* Main Message Text Body */}
                <p className="whitespace-pre-wrap leading-relaxed break-words text-sm text-foreground">
                  {msg.body}
                </p>

                {/* Bubble Footer: Timestamp, Reply & Delete Options */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="opacity-0 group-hover:opacity-100 hover:underline flex items-center gap-1 text-primary font-semibold transition"
                    >
                      <CornerDownRight className="h-3 w-3" /> Reply
                    </button>

                    {(user?.role?.toUpperCase() === "FACULTY" ||
                      user?.role?.toUpperCase() === "ADMIN" ||
                      isMe) && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 flex items-center gap-1 font-semibold transition text-muted-foreground"
                        title="Delete message"
                      >
                        <Trash2 className="h-3 w-3 text-red-500 inline" /> Delete
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <span>{msg.time}</span>
                    {isMe && <CheckCheck className="h-3.5 w-3.5 text-primary inline" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* REPLING TO QUOTE PREVIEW OVERLAY */}
      {replyingTo && (
        <div className="bg-primary/5 border-t border-b border-primary/20 p-2.5 px-4 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="border-l-4 border-primary pl-3">
            <span className="font-bold text-primary block font-display">
              Replying to {replyingTo.authorName}
            </span>
            <span className="text-muted-foreground line-clamp-1 italic">
              {replyingTo.title ? `${replyingTo.title}: ${replyingTo.body}` : replyingTo.body}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MATCHING UI BOTTOM CHAT INPUT BAR */}
      <div className="bg-card p-3.5 px-4 border-t border-border flex items-center gap-2.5 shrink-0">
        <button
          className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary border border-transparent hover:border-border transition"
          title="Add attachment"
          onClick={() => alert("Attachment feature coming soon!")}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <button
          className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary border border-transparent hover:border-border transition hidden sm:block"
          title="Insert emoji"
          onClick={() => setInputText((prev) => prev + " 😊")}
        >
          <Smile className="h-4 w-4" />
        </button>

        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Write a message or question to the discussion forum..."
          className="flex-1 bg-secondary/30 text-foreground text-sm rounded-xl px-4 py-2.5 border border-border outline-none focus:ring-2 focus:ring-primary/40 focus:bg-card transition"
        />

        <Btn
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className="px-4 py-2.5 rounded-xl text-xs font-bold shadow-glow shrink-0 flex items-center gap-1.5"
        >
          <Send className="h-4 w-4" /> Send
        </Btn>
      </div>
    </div>
  );
}
