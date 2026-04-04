"use client";

import { useState } from "react";
import { db } from "@/lib/instant";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, HelpCircle, Sparkles, AlertCircle } from "lucide-react";
import QuizSetup from "./QuizSetup";
import QuizActive, { Question } from "./QuizActive";
import QuizResult from "./QuizResult";

interface Props {
  userId: string;
}

type QuizState = "setup" | "generating" | "active" | "result";

export default function QuizMode({ userId }: Props) {
  const [state, setState] = useState<QuizState>("setup");
  const [selected, setSelected] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const { data: docsData } = db.useQuery({
    knowledgeDocuments: { $: { where: { userId } } },
    notes: { $: { where: { userId } } },
  });

  const allDocuments = (docsData?.knowledgeDocuments || []).map((d: any) => ({
    id: d.id,
    title: d.title || "Untitled Document",
    content: d.textContent || "",
    type: "document" as const,
  }));

  const allNotes = (docsData?.notes || []).map((n: any) => ({
    id: n.id,
    title: n.title || "Untitled Note",
    content: n.content || "",
    type: "note" as const,
  }));

  const handleToggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleStartQuiz = async () => {
    if (selected.length === 0) return;
    
    setState("generating");
    setError("");

    const combinedContent = [...allDocuments, ...allNotes]
      .filter(item => selected.includes(item.id))
      .map(item => item.content)
      .join("\n\n");

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: combinedContent,
          difficulty,
          count: questionCount
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate quiz.");
      }

      const data = await res.json();
      if (!data.quiz || !Array.isArray(data.quiz)) {
        throw new Error("AI returned invalid quiz data.");
      }

      setQuestions(data.quiz);
      setState("active");
    } catch (err: any) {
      setError(err.message || "An error occurred while generating your quiz.");
      setState("setup");
    }
  };

  const handleQuizComplete = (answers: Record<number, string>) => {
    setUserAnswers(answers);
    setState("result");
  };

  const handleRetry = () => {
    setState("setup");
    setQuestions([]);
    setUserAnswers({});
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 min-h-full">
      {/* Quiz Header */}
      <div className="mb-6 sm:mb-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent-secondary)", color: "white" }}>
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Revision Quiz</h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Active Exam Preparation</p>
          </div>
        </div>
        {state === "active" && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm" style={{ background: "rgba(124, 144, 130, 0.1)", color: "var(--accent-primary)", border: "1px solid var(--border)" }}>
            <Sparkles size={12} /> Adaptive Engine Active
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {state === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="rounded-3xl p-8 text-white shadow-xl" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
              <h2 className="text-xl font-black mb-2 flex items-center gap-2"><Sparkles size={18} /> Ready to test your knowledge?</h2>
              <p className="text-sm leading-relaxed mb-6 opacity-90">
                Select your notes or documents below, and our AI will generate a personalized quiz to help you identify knowledge gaps.
              </p>
              <div className="quiz-steps-row flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">1</div>
                  <span className="text-xs font-bold uppercase tracking-wider">Select Sources</span>
                </div>
                <div className="quiz-step-divider w-4 h-[1px] bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">2</div>
                  <span className="text-xs font-bold uppercase tracking-wider">Configure</span>
                </div>
                <div className="quiz-step-divider w-4 h-[1px] bg-white/20" />
                <div className="flex items-center gap-2 text-white/50">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs font-black">3</div>
                  <span className="text-xs font-bold uppercase tracking-wider">Test Yourself</span>
                </div>
              </div>
            </div>

            <QuizSetup
              documents={allDocuments}
              notes={allNotes}
              selected={selected}
              onToggle={handleToggle}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
            />

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              disabled={selected.length === 0}
              className="w-full py-5 rounded-3xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm"
              style={{ background: "var(--accent-primary)" }}
            >
              Generate Revision Quiz
              <ArrowIcon />
            </button>
          </motion.div>
        )}

        {state === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 premium-card"
          >
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-inner" style={{ background: "var(--bg-primary)", borderColor: "var(--surface)" }}>
                <motion.div 
                  className="absolute inset-0 rounded-full border-t-4"
                  style={{ borderColor: "var(--accent-primary)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <Brain size={32} style={{ color: "var(--accent-primary)" }} />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Analyzing Knowledge Base...</h2>
            <p className="text-sm font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>Generating high-quality questions</p>
          </motion.div>
        )}

        {state === "active" && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <QuizActive questions={questions} onComplete={handleQuizComplete} />
          </motion.div>
        )}

        {state === "result" && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <QuizResult questions={questions} userAnswers={userAnswers} onRetry={handleRetry} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
