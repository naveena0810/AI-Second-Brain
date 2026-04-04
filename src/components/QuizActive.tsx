"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Timer, Brain, CheckCircle2, Circle } from "lucide-react";
import BaseCard from "./BaseCard";

export interface Question {
  question: string;
  type: "mcq" | "short";
  options?: string[];
  answer: string;
  explanation: string;
}

interface Props {
  questions: Question[];
  onComplete: (answers: Record<number, string>) => void;
}

export default function QuizActive({ questions, onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(questions.length * 60); // 1 min per question

  const currentQuestion = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(userAnswers);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete, userAnswers]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(userAnswers);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Quiz Progress & Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <motion.div 
              className="h-full"
              style={{ background: "var(--accent-primary)" }}
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black whitespace-nowrap uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            {currentIdx + 1} / {questions.length}
          </span>
        </div>
        <div className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-sm shadow-sm ${
          timeLeft < 30 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-white border-gray-100"
        }`} style={timeLeft >= 30 ? { color: "var(--text-secondary)" } : {}}>
          <Timer size={14} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card as a Physical Flashcard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -30, rotateX: 10 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ perspective: "1000px" }}
        >
          <div 
            className="premium-card p-8 shadow-xl relative overflow-hidden flex flex-col"
            style={{ 
              minHeight: "400px"
            }}
          >
            <div className="absolute top-0 left-0 w-2 h-full" style={{ background: "var(--accent-primary)" }} />
            
            <div className="mb-8 pl-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 block" style={{ color: "var(--accent-primary)" }}>
                Question {currentIdx + 1} • {currentQuestion.type === "mcq" ? "Multiple Choice" : "Short Answer"}
              </span>
              <h2 className="text-xl font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-4 flex-1 pl-2">
              {currentQuestion.type === "mcq" ? (
                currentQuestion.options?.map((opt, i) => {
                  const isSelected = userAnswers[currentIdx] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => setUserAnswers(prev => ({ ...prev, [currentIdx]: opt }))}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "shadow-md"
                          : "hover:border-opacity-50"
                      }`}
                      style={{
                        background: isSelected ? "var(--accent-primary)" : "var(--bg-secondary)",
                        borderColor: isSelected ? "var(--accent-primary)" : "var(--border)",
                        color: isSelected ? "white" : "var(--text-primary)"
                      }}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black ${
                        isSelected ? "bg-white/20 text-white" : "text-opacity-60"
                      }`} style={!isSelected ? { background: "var(--border)" } : {}}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm font-semibold flex-1 leading-relaxed">{opt}</span>
                      <div className="ml-auto">
                        {isSelected ? <CheckCircle2 size={18} color="white" /> : <Circle size={18} className="opacity-20" color="var(--text-primary)" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <textarea
                  value={userAnswers[currentIdx] || ""}
                  onChange={e => setUserAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
                  placeholder="Type your answer here..."
                  className="w-full h-40 p-5 rounded-2xl border text-base font-medium focus:outline-none transition-all resize-none shadow-inner"
                  style={{ 
                    background: "var(--bg-secondary)", 
                    borderColor: "var(--border)",
                    color: "var(--text-primary)" 
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-sm font-bold transition-all disabled:opacity-30 hover:bg-black/5"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!userAnswers[currentIdx]}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-40 shadow-lg"
          style={{ background: "var(--accent-primary)" }}
        >
          {isLast ? "Finish Quiz" : "Next Question"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
