"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Brain, ArrowRight, Shuffle } from "lucide-react";

interface Props {
  userId: string;
  recentTopics: string[];
  onAccept: (topic: string) => void;
  isExplainMode: boolean;
}

// Fallback topics when user has no activity
const FALLBACK_TOPICS = [
  "What is an algorithm?",
  "How does the internet work?",
  "What is machine learning?",
  "How do databases store data?",
  "What is an API?",
  "How does encryption work?",
];

export default function ChallengePrompt({ userId, recentTopics, onAccept, isExplainMode }: Props) {
  const [visible, setVisible] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Build a pool of topics from user's recent activity
  const topicPool = useMemo(() => {
    if (!recentTopics || recentTopics.length === 0) return FALLBACK_TOPICS;
    
    // Deduplicate and clean topics
    const cleaned = [...new Set(
      recentTopics
        .map(t => t.trim())
        .filter(t => t.length > 3 && t.length < 120)
    )];

    return cleaned.length > 0 ? cleaned : FALLBACK_TOPICS;
  }, [recentTopics]);

  const pickRandomTopic = useCallback(() => {
    const idx = Math.floor(Math.random() * topicPool.length);
    setCurrentTopic(topicPool[idx]);
  }, [topicPool]);

  // Show challenge after random delay between 60-180 seconds
  // Only trigger once per session unless reshuffled
  useEffect(() => {
    if (dismissed || isExplainMode) return;

    // Random delay: 60-180 seconds (1-3 minutes)
    const delay = (60 + Math.floor(Math.random() * 120)) * 1000;
    
    const timer = setTimeout(() => {
      pickRandomTopic();
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [dismissed, pickRandomTopic, isExplainMode]);

  const handleAccept = () => {
    onAccept(currentTopic);
    setVisible(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  const handleShuffle = () => {
    pickRandomTopic();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-24 right-6 z-[80] max-w-sm w-full"
        style={{ pointerEvents: "auto" }}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 60px var(--shadow), 0 0 0 1px var(--border)",
          }}
        >
          {/* Gradient accent bar */}
          <div
            className="h-1"
            style={{
              background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))",
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--accent-secondary), var(--accent-tertiary))" }}
              >
                <Brain size={16} color="white" />
              </motion.div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--accent-secondary)" }}>
                  🧠 Challenge Mode
                </p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  Test your understanding
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl transition-colors hover:bg-black/5"
              style={{ color: "var(--text-secondary)", minWidth: 36, minHeight: 36 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Topic */}
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Can you explain this in your own words?
            </p>
            <div
              className="p-4 rounded-xl"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-sm font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                &ldquo;{currentTopic}&rdquo;
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-black/5"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                minHeight: 44,
              }}
            >
              <Shuffle size={14} />
              Different topic
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] shadow-sm hover:brightness-105"
              style={{
                background: "linear-gradient(135deg, var(--accent-secondary), var(--accent-tertiary))",
                color: "white",
                minHeight: 44,
              }}
            >
              <Sparkles size={14} />
              Accept Challenge
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
