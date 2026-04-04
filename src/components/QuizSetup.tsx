"use client";

import { motion } from "framer-motion";
import { Check, FileText, StickyNote, HelpCircle, Hash, Zap } from "lucide-react";
import BaseCard from "./BaseCard";

interface Doc {
  id: string;
  title: string;
  content: string;
  type: "document" | "note";
}

interface Props {
  documents: Doc[];
  notes: Doc[];
  selected: string[];
  onToggle: (id: string) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (d: "easy" | "medium" | "hard") => void;
  questionCount: number;
  setQuestionCount: (c: number) => void;
}

export default function QuizSetup({
  documents,
  notes,
  selected,
  onToggle,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount
}: Props) {
  const allItems: Doc[] = [
    ...documents.map(d => ({ ...d, type: "document" as const })),
    ...notes.map(n => ({ ...n, type: "note" as const })),
  ];

  const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];
  const counts = [3, 5, 10];

  return (
    <div className="space-y-6">
      <BaseCard className="p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: "var(--accent-primary)", color: "white" }}>1</span>
          Select Knowledge Sources
          {selected.length > 0 && (
            <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "var(--accent-primary)", color: "white" }}>
              {selected.length} selected
            </span>
          )}
        </h2>
        
        {allItems.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
            <HelpCircle size={24} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-semibold">No documents or notes found to generate a quiz from.</p>
          </div>
        ) : (
          <div className="quiz-source-grid grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar pb-2">
            {allItems.map(item => {
              const isSelected = selected.includes(item.id);
              return (
              <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "ring-2 ring-[var(--accent-primary)] shadow-sm"
                      : "hover:shadow-md"
                  }`}
                  style={{
                    background: isSelected ? "var(--surface)" : "var(--bg-secondary)",
                    borderColor: isSelected ? "var(--accent-primary)" : "var(--border)",
                    minHeight: 52,
                  }}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-[var(--border)]"
                  }`}>
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                    background: item.type === "document" ? "rgba(124, 144, 130, 0.15)" : "rgba(202, 159, 94, 0.15)",
                    color: item.type === "document" ? "var(--accent-primary)" : "var(--accent-secondary)"
                  }}>
                    {item.type === "document" ? <FileText size={14} /> : <StickyNote size={14} />}
                  </div>
                  <p className="text-sm font-semibold truncate flex-1" style={{ color: "var(--text-primary)" }}>{item.title || "Untitled"}</p>
                </button>
              );
            })}
          </div>
        )}
      </BaseCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseCard className="p-6">
          <h2 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: "var(--accent-secondary)", color: "white" }}>2</span>
            Difficulty Level
          </h2>
          <div className="flex gap-3">
            {difficulties.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                  difficulty === d ? "shadow-md" : ""
                }`}
                style={{ 
                  background: difficulty === d ? "var(--accent-primary)" : "var(--bg-secondary)",
                  borderColor: difficulty === d ? "var(--accent-primary)" : "var(--border)",
                  color: difficulty === d ? "white" : "var(--text-secondary)"
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </BaseCard>

        <BaseCard className="p-6">
          <h2 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: "var(--accent-tertiary)", color: "white" }}>3</span>
            Number of Questions
          </h2>
          <div className="flex gap-3">
            {counts.map(c => (
              <button
                key={c}
                onClick={() => setQuestionCount(c)}
                className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                  questionCount === c ? "shadow-md" : ""
                }`}
                style={{ 
                  background: questionCount === c ? "var(--accent-secondary)" : "var(--bg-secondary)",
                  borderColor: questionCount === c ? "var(--accent-secondary)" : "var(--border)",
                  color: questionCount === c ? "white" : "var(--text-secondary)"
                }}
              >
                {c} Qs
              </button>
            ))}
          </div>
        </BaseCard>
      </div>
    </div>
  );
}
