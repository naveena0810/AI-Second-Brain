"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Trophy, Target, Lightbulb } from "lucide-react";
import { Question } from "./QuizActive";
import BaseCard from "./BaseCard";
import ActionButton from "./ActionButton";

interface Props {
  questions: Question[];
  userAnswers: Record<number, string>;
  onRetry: () => void;
}

export default function QuizResult({ questions, userAnswers, onRetry }: Props) {
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      const userAnswer = userAnswers[i]?.trim().toLowerCase();
      const correctAnswer = q.answer.trim().toLowerCase();
      
      if (q.type === "mcq") {
        if (userAnswer === correctAnswer) score++;
      } else {
        if (userAnswer?.includes(correctAnswer) || correctAnswer?.includes(userAnswer)) score++;
      }
    });
    return score;
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Score Header */}
      <BaseCard className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full border-8 flex items-center justify-center shadow-inner" style={{ borderColor: "var(--bg-primary)" }}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40 * (percentage / 100)} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{percentage}%</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} style={{ color: "var(--accent-secondary)" }} />
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Quiz Completed!</h1>
            </div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              You scored {score} out of {questions.length}
            </p>
          </div>
        </div>
        <ActionButton variant="secondary" onClick={onRetry} className="py-3 px-6 h-auto">
          <RotateCcw size={16} />
          Try Another Quiz
        </ActionButton>
      </BaseCard>

      {/* Breakdown Header */}
      <div className="flex items-center gap-3 px-2">
        <Target size={18} style={{ color: "var(--accent-tertiary)" }} />
        <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Detailed Feedback</h2>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-6">
        {questions.map((q, i) => {
          const userAnswer = userAnswers[i];
          const isCorrect = q.type === "mcq" 
            ? userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase()
            : userAnswer?.trim().toLowerCase().includes(q.answer.trim().toLowerCase());

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="premium-card p-6 flex flex-col gap-6 transition-all"
              style={{
                borderColor: isCorrect ? "rgba(124, 144, 130, 0.4)" : "rgba(184, 115, 82, 0.3)"
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Question {i + 1}</p>
                  <h3 className="text-base font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>{q.question}</h3>
                </div>
                {isCorrect ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm" style={{ background: "var(--accent-primary)", color: "white" }}>
                    <CheckCircle2 size={12} /> Correct
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm" style={{ background: "var(--accent-tertiary)", color: "white" }}>
                    <XCircle size={12} /> Incorrect
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Your Answer</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{userAnswer || "No answer provided"}</p>
                </div>
                {!isCorrect && (
                  <div className="p-5 rounded-2xl border" style={{ background: "rgba(184, 115, 82, 0.05)", borderColor: "rgba(184, 115, 82, 0.2)" }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--accent-tertiary)" }}>Expected Answer</p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{q.answer}</p>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl border flex gap-4" style={{ background: "rgba(202, 167, 125, 0.05)", borderColor: "rgba(202, 167, 125, 0.2)" }}>
                <Lightbulb size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--accent-secondary)" }}>AI Explanation</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{q.explanation}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
