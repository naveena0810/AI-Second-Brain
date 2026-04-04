"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/instant";
import { id } from "@instantdb/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BrainCircuit, RefreshCw, BookOpen, Menu, X, MessageSquare, Pin, PinOff, Zap, ChevronDown, ChevronUp, Check, Lightbulb, Mic, User } from "lucide-react";
import CopyButton from "./CopyButton";
import EmptyState from "./EmptyState";
import SourceList from "./SourceList";
import ExampleSection from "./ExampleSection";
import ApplicationSection from "./ApplicationSection";
import ReactMarkdown from "react-markdown";
import PerspectiveSelector, { PERSPECTIVES } from "./PerspectiveSelector";
import ExplainInput from "./ExplainInput";
import EvaluationResult, { EvaluationData } from "./EvaluationResult";

interface Source {
  id: string;
  documentTitle: string;
  snippet: string;
  score?: number;
  pageNumber?: number;
  type?: 'note' | 'document';
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  queryId?: string;
  deepDive?: string;
  example?: string;
  application?: string;
  perspective?: string;
  evaluation?: EvaluationData;
}

interface Props { userId: string; }

export default function AskAI({ userId }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [deepDiveLoading, setDeepDiveLoading] = useState<string | null>(null);
  const [examplesEnabled, setExamplesEnabled] = useState(true);
  const [perspective, setPerspective] = useState("standard");
  const [isExplainMode, setIsExplainMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const handleDeepDive = async (q: any) => {
    if (!q || deepDiveLoading) return;
    setDeepDiveLoading(q.id);
    try {
      const res = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, answer: q.answer }),
      });
      if (!res.ok) throw new Error("Deep Dive failed");
      const data = await res.json();
      
      await db.transact([
        db.tx.queries[q.id].update({ deepDive: data.deepDive })
      ]);
      setMessages(prev => prev.map(m => m.queryId === q.id ? { ...m, deepDive: data.deepDive } : m));
      showToast("Deep Dive ready! 🚀");
    } catch (err) {
      console.error(err);
      showToast("Deep Dive failed. Please try again.");
    } finally {
      setDeepDiveLoading(null);
    }
  };
  

  const { data: queriesData } = db.useQuery({ queries: { $: { where: { userId } } } });
  const { data: sourcesData } = db.useQuery({ querySources: {} });
  const history = queriesData?.queries ?? [];
  const allSources = (sourcesData?.querySources ?? []) as any[];

  const groupHistoryByDate = (history: any[]) => {
    const groups: { [key: string]: any[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      "Previous 30 Days": [],
      Older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;
    const thirtyDaysAgo = today - 30 * 86400000;

    // Use a copy to avoid mutating anything, though map/filter are safe
    const sorted = [...history].sort((a, b) => b.createdAt - a.createdAt);

    sorted.forEach(item => {
      const date = item.createdAt;
      if (date >= today) groups.Today.push(item);
      else if (date >= yesterday) groups.Yesterday.push(item);
      else if (date >= sevenDaysAgo) groups["Previous 7 Days"].push(item);
      else if (date >= thirtyDaysAgo) groups["Previous 30 Days"].push(item);
      else groups.Older.push(item);
    });

    return groups;
  };

  const filteredHistory = history.filter(h => 
    h.question.toLowerCase().includes(historySearch.toLowerCase())
  );
  
  const pinnedChats = filteredHistory
    .filter(h => h.isPinned)
    .sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
    .slice(0, 5);

  const recentChats = filteredHistory.filter(h => !h.isPinned);
  const historyGroups = groupHistoryByDate(recentChats);

  // Auto-close sidebar on small screens initially
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);

    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInput(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === "no-speech") return;
          if (event.error === "not-allowed") {
            console.warn("Microphone access denied.");
            // We can't call showToast here because it might be before component mounts, wait, this is inside useEffect, we can call it. But showToast is declared later. Let's just suppress the error overlay by using console.warn instead of console.error.
          } else {
            console.warn("Speech recognition error", event.error);
          }
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const sendMessage = async (question?: string) => {
    const q = question ?? input.trim();
    if (!q || loading) return;
    setInput("");
    setError("");
    const userMsg: Message = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, userId, perspective }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Query failed");
      }
      const data = await res.json();
    // Save to history + timeline (background sync)
    const queryId = id();
    const now = Date.now();
    
    const assistantMsg: Message = { 
      role: "assistant", 
      content: data.answer, 
      sources: data.sources,
      queryId: queryId,
      example: data.example || undefined,
      application: data.application || undefined,
      perspective: perspective,
    };
    setMessages(prev => [...prev, assistantMsg]);

    db.transact([
        db.tx.queries[queryId].update({ 
          question: q, 
          answer: data.answer, 
          userId, 
          createdAt: now,
          updatedAt: now,
          isPinned: false
        }),
        db.tx.timelineEvents[id()].update({
          type: "query",
          title: q.slice(0, 80),
          description: data.answer.slice(0, 160),
          referenceId: queryId,
          userId,
          date: now,
          createdAt: now,
        }),
        ...(data.sources || []).map((s: any) => {
          return db.tx.querySources[id()].update({
            queryId,
            documentId: s.documentId,
            documentTitle: s.documentTitle,
            chunkText: s.snippet,
            pageNumber: s.pageNumber,
            createdAt: now,
          });
        }),
        db.tx.userActivity[id()].update({
          userId,
          topic: q.slice(0, 100),
          lastAccessed: now,
          interactionCount: 1,
          type: "query",
          createdAt: now,
        }),
      ]).catch(err => console.warn("Instant transaction ignored:", err));
    } catch (err: any) {
      setError(err.message || "Failed to get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExplainSubmit = async (topic: string, explanation: string) => {
    setLoading(true);
    setError("");
    const userMsg: Message = { role: "user", content: `**Explained Topic: ${topic}**\n\n${explanation}` };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/evaluate-thinking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, userExplanation: explanation, userId })
      });

      if (!res.ok) {
        throw new Error("Failed to evaluate explanation.");
      }

      const evalData = await res.json();
      const evalMsg: Message = {
        role: "assistant",
        content: "Here is the evaluation of your thinking:",
        evaluation: evalData
      };
      setMessages(prev => [...prev, evalMsg]);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (q: any) => {
    const querySources = allSources
      .filter((s: any) => s.queryId === q.id)
      .map((s: any) => ({
        id: s.id,
        documentId: s.documentId,
        documentTitle: s.documentTitle || "Document",
        snippet: s.chunkText,
        pageNumber: s.pageNumber,
      }));

    setMessages([
      { role: "user", content: q.question },
      { role: "assistant", content: q.answer, sources: querySources, queryId: q.id, deepDive: q.deepDive }
    ]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setError("");
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) {
      setMessages(prev => prev.slice(0, -1));
      sendMessage(lastUser.content);
    }
  };

  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  const handleTogglePin = async (q: any) => {
    const newPinned = !q.isPinned;
    await db.transact([
      db.tx.queries[q.id].update({ 
        isPinned: newPinned,
        updatedAt: Date.now() 
      })
    ]).catch(err => console.warn("Pin transaction failed:", err));
    showToast(newPinned ? "Chat pinned! 📌" : "Chat unpinned");
  };

  // Bonus: Auto-suggest pinning
  const mostActiveQuery = history.find(h => !h.isPinned);
  const showPinSuggestion = mostActiveQuery && history.length > 5 && !pinnedChats.length;

  return (
    <div className="flex flex-col gap-0 h-full flex-1 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[100] px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-2xl pointer-events-none"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {/* ... (keep header as is) */}
      <div className="flex items-center gap-3 px-6 h-16 border-b flex-shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl border transition-colors hover:bg-black/5 flex-shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Ask AI</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Interactive Knowledge Assistant</p>
        </div>
        {/* Example Mode Toggle */}
        <button
          onClick={() => setExamplesEnabled(v => !v)}
          title={examplesEnabled ? "Disable real-life examples" : "Enable real-life examples"}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all`}
          style={{
            background: examplesEnabled ? "rgba(202,167,125,0.12)" : "var(--bg-secondary)",
            borderColor: examplesEnabled ? "var(--accent-secondary)" : "var(--border)",
            color: examplesEnabled ? "var(--accent-secondary)" : "var(--text-secondary)"
          }}
        >
          <span>💡</span>
          {examplesEnabled ? "Examples ON" : "Examples OFF"}
        </button>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar History */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              layout
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 flex flex-col h-full overflow-hidden border-r"
              style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
            >
              <div className="w-[300px] p-4 flex flex-col h-full">
                <button
                   onClick={startNewChat}
                   className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
                   style={{ background: "var(--accent-primary)", color: "white" }}
                >
                  <MessageSquare size={16} /> New Chat
                </button>

                {showPinSuggestion && (
                  <div className="mb-4 p-3 rounded-xl border text-[10px] animate-pulse cursor-pointer" style={{ background: "rgba(202,167,125,0.1)", borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)" }} onClick={() => handleTogglePin(mostActiveQuery)}>
                    💡 revisit often? Pin <b>"{mostActiveQuery.question?.slice(0, 15)}..."</b> for quick access.
                  </div>
                )}

                <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {/* Pinned Chats */}
                  {pinnedChats.length > 0 && (
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] px-2 opacity-40 mb-1" style={{ color: "var(--text-secondary)" }}>📌 PINNED</p>
                       <AnimatePresence mode="popLayout">
                        {pinnedChats.map(q => (
                          <motion.div
                            layout
                            key={q.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="group relative px-1"
                          >
                            <button
                              onClick={() => loadHistoryItem(q)}
                              className="w-full text-left p-3 rounded-2xl text-sm leading-snug transition-all border block pr-12"
                              style={{ 
                                color: "var(--text-primary)", 
                                borderColor: messages[0]?.content === q.question ? "var(--accent-primary)" : "var(--border)",
                                background: messages[0]?.content === q.question ? "var(--surface)" : "var(--bg-primary)"
                              }}
                            >
                              <p className="line-clamp-2 font-semibold">{q.question}</p>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTogglePin(q); }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                              title="Unpin chat"
                            >
                              <PinOff size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Past Chats */}
                  <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                      {Object.entries(historyGroups).map(([groupName, items]) => (
                        items.length > 0 && (
                          <div key={groupName} className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] px-2 opacity-40" style={{ color: "var(--text-secondary)" }}>{groupName}</p>
                            {items.map(q => (
                              <motion.div key={q.id} layout className="group relative px-1">
                                <button
                                  onClick={() => loadHistoryItem(q)}
                                  className="w-full text-left p-3 rounded-2xl text-sm leading-snug transition-all block pr-12 border"
                                  style={{ 
                                    color: "var(--text-primary)", 
                                    background: "transparent",
                                    borderColor: "transparent"
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-primary)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  <p className="line-clamp-2">{q.question}</p>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleTogglePin(q); }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                                  title="Pin chat"
                                >
                                  <Pin size={14} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {filteredHistory.length === 0 && (
                    <div className="text-center mt-10">
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{historySearch ? "No matches found" : "No chat history found."}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ background: "var(--bg-primary)" }}>
          <div className="flex-1 overflow-y-auto space-y-6 px-6 py-8 custom-scrollbar">
            {messages.length === 0 ? (
              <EmptyState icon={BrainCircuit} title="Ask your knowledge base" description="Type a question below. The AI will pull relevant notes and documents to guide its response." />
            ) : (
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col mb-8"
                  >
                    <div className="flex gap-5 max-w-4xl mx-auto w-full">
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-1">
                        {msg.role === "user" ? (
                           <div className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                             <User size={16} style={{ color: "var(--text-primary)" }} />
                           </div>
                        ) : (
                           <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ background: "var(--accent-primary)" }}>
                             <BrainCircuit size={16} color="white" />
                           </div>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
                        <div className="text-base leading-relaxed space-y-4 font-medium">
                          {msg.role === "user" ? (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          ) : (
                            <>
                              <ReactMarkdown
                                components={{
                                  h3: ({ children }) => (
                                    <h3 className="flex items-center gap-2 text-base font-bold mt-6 mb-3" style={{ color: "var(--text-primary)" }}>
                                      {children}
                                    </h3>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-lg font-black mt-6 mb-3" style={{ color: "var(--text-primary)" }}>{children}</h2>
                                  ),
                                  p: ({ children }) => (
                                    <p className="mb-4 leading-loose text-base" style={{ color: "var(--text-secondary)" }}>{children}</p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-bold" style={{ color: "var(--text-primary)" }}>{children}</strong>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-inside space-y-2 mb-4 text-base pl-2" style={{ color: "var(--text-secondary)" }}>{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal list-inside space-y-2 mb-4 text-base pl-2" style={{ color: "var(--text-secondary)" }}>{children}</ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="leading-loose">{children}</li>
                                  ),
                                  hr: () => (
                                    <hr className="my-6 border-t" style={{ borderColor: "var(--border)" }} />
                                  ),
                                  code: ({ children }) => (
                                    <code className="px-1.5 py-0.5 rounded text-sm font-mono bg-black/5" style={{ color: "var(--text-primary)" }}>{children}</code>
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                              {/* Evaluation Result for Explain My Thinking Mode */}
                              {msg.evaluation && (
                                <div className="mt-6">
                                  <EvaluationResult
                                    data={msg.evaluation}
                                    onRetry={() => setIsExplainMode(true)}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {msg.role === "assistant" && (
                          <div className="mt-4">
                            {/* Real-Life Example Section */}
                            {examplesEnabled && msg.example && (
                              <ExampleSection example={msg.example} />
                            )}
                            {examplesEnabled && msg.application && (
                              <ApplicationSection application={msg.application} />
                            )}

                            <div className="flex items-center gap-4 mt-4 pt-4 border-t opacity-80 transition-opacity hover:opacity-100" style={{ borderColor: "var(--border)" }}>
                              <CopyButton text={msg.content} />
                              {msg.queryId && (
                                <button 
                                  onClick={() => handleDeepDive({ id: msg.queryId, question: messages[i-1]?.content, answer: msg.content })}
                                  disabled={!!deepDiveLoading}
                                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:bg-orange-50 text-orange-600 border border-transparent hover:border-orange-100 disabled:opacity-50"
                                >
                                  {deepDiveLoading === msg.queryId ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Zap size={14} />
                                  )}
                                  {msg.deepDive ? "Deep Dive Active" : "Deep Dive"}
                                </button>
                              )}
                              {/* Auto-Suggest Deep Dive (Bonus) */}
                              {!msg.deepDive && !deepDiveLoading && i === messages.length - 1 && (messages[i-1]?.content.toLowerCase().startsWith("what is") || messages[i-1]?.content.toLowerCase().startsWith("explain") || messages[i-1]?.content.length > 50) && (
                                <button 
                                  onClick={() => handleDeepDive({ id: msg.queryId, question: messages[i-1]?.content, answer: msg.content })}
                                  className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all animate-bounce"
                                >
                                  💡 Suggest Deep Dive
                                </button>
                              )}
                              {msg.sources && msg.sources.length > 0 && (
                                <span className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                                  <BookOpen size={14} />
                                  Referenced {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            {/* Deep Dive Content */}
                            <AnimatePresence>
                              {msg.deepDive && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-6 overflow-hidden"
                                >
                                  <div className="p-6 rounded-2xl text-sm leading-relaxed border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                                      <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--accent-tertiary)" }}>
                                        <Zap size={14} style={{ color: "var(--accent-tertiary)" }} /> Expert Deep Dive
                                      </span>
                                      <CopyButton text={msg.deepDive} label="Copy Explanation" size={14} className="px-3 py-1.5 rounded-lg bg-white border shadow-sm transition-all text-xs font-bold" />
                                    </div>
                                    <div className="text-base leading-loose" style={{ color: "var(--text-secondary)" }}>
                                      {msg.deepDive}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-4">
                                <SourceList sources={msg.sources} keywords={messages[i-1]?.content.split(/\s+/) || []} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start pt-2">
                <div className="rounded-2xl px-5 py-3.5" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                  <div className="flex gap-2 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--accent-primary)" }}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {error && <p className="text-sm text-red-500 mt-2 px-1">{error}</p>}

          {/* Input container - floating style or fixed at bottom */}
          <div className="p-6 pt-0">
            {isExplainMode ? (
              <div className="max-w-4xl mx-auto pt-2">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setIsExplainMode(false)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm transition-all"
                  >
                    {"← "} Switch to Chat Mode
                  </button>
                </div>
                <ExplainInput onSubmit={handleExplainSubmit} isLoading={loading} />
              </div>
            ) : (
              <div className="pt-2 pb-6">
                <div className="max-w-4xl mx-auto flex flex-col gap-3 p-4 rounded-[32px] border transition-all duration-300 hover:shadow-[0_8px_30px_var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "0 4px 20px var(--shadow)" }}>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={isRecording ? "Listening..." : "Ask a question to your second brain..."}
                    className="flex-1 px-4 py-2 text-base bg-transparent outline-none w-full font-medium"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <div className="flex items-center justify-between pl-4">
                    <div className="flex items-center gap-3">
                       <PerspectiveSelector value={perspective} onChange={setPerspective} />
                       {perspective !== "standard" && (
                         <span className="text-[11px] font-semibold italic" style={{ color: "var(--text-secondary)" }}>
                           Answering as {PERSPECTIVES.find(p => p.id === perspective)?.emoji} {PERSPECTIVES.find(p => p.id === perspective)?.label}
                         </span>
                       )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsExplainMode(true)}
                        className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Lightbulb size={14} className="fill-purple-500" /> Explain Thinking
                      </button>
                      
                      {messages.length > 1 && (
                        <button
                          onClick={handleRegenerate}
                          disabled={loading || isRecording}
                          className="p-2.5 rounded-xl hover:bg-black/5 transition-colors disabled:opacity-40"
                          title="Regenerate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                      
                      <button
                        onClick={toggleRecording}
                        disabled={loading}
                        className={`p-2.5 rounded-xl transition-all disabled:opacity-40 relative ${
                          isRecording ? "text-red-500 bg-red-50" : "hover:bg-black/5 text-gray-500"
                        }`}
                        title={isRecording ? "Stop recording" : "Start voice input"}
                      >
                        {isRecording && (
                          <motion.div
                            className="absolute inset-1.5 rounded-full border border-red-400"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ pointerEvents: 'none' }}
                          />
                        )}
                        <Mic size={18} className={isRecording ? "animate-pulse" : ""} />
                      </button>
                      
                      <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="p-3 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center min-w-[48px] shadow-sm ml-1 hover:brightness-105"
                        style={{ background: "var(--accent-primary)", color: "white" }}
                      >
                        <Send size={18} className={input.trim() ? "translate-x-0.5" : ""} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
