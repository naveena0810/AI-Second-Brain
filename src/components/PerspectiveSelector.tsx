"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const PERSPECTIVES = [
  { id: "standard",  label: "Standard",   emoji: "🤖", tone: "balanced and informative" },
  { id: "teacher",   label: "Teacher",    emoji: "👨‍🏫", tone: "clear, structured, with examples suitable for a classroom" },
  { id: "child",     label: "Child",      emoji: "👶", tone: "very simple, friendly, and fun — like explaining to a 7-year-old" },
  { id: "beginner",  label: "Beginner",   emoji: "📘", tone: "easy-going, no jargon, step-by-step for someone brand new to the topic" },
  { id: "developer", label: "Developer",  emoji: "👨‍💻", tone: "technical, precise, with code context and implementation details" },
  { id: "ceo",       label: "CEO",        emoji: "💼", tone: "strategic, business-focused, ROI-driven, and high-level" },
];

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function PerspectiveSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PERSPECTIVES.find(p => p.id === value) ?? PERSPECTIVES[0];

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all hover:bg-black/5"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
          background: "var(--bg-secondary)",
        }}
        title="Change perspective"
      >
        <span>{selected.emoji}</span>
        <span>{selected.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-10 left-0 z-50 min-w-[180px] rounded-2xl border shadow-xl overflow-hidden"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            {PERSPECTIVES.map(p => (
              <button
                key={p.id}
                onClick={() => { onChange(p.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors hover:bg-black/5 ${
                  p.id === value ? "font-extrabold" : ""
                }`}
                style={{ color: p.id === value ? "var(--accent-primary)" : "var(--text-primary)" }}
              >
                <span className="text-base">{p.emoji}</span>
                <span>{p.label}</span>
                {p.id === value && <span className="ml-auto text-[10px] opacity-60">active</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
