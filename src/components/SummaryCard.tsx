"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/instant";
import { id } from "@instantdb/react";
import { Sparkles, Copy, RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KeyPointsList from "./KeyPointsList";
import ConceptTags from "./ConceptTags";

interface SummaryData {
  summary: string;
  keyPoints: string[];
  concepts: string[];
}

interface Props {
  referenceId: string;
  userId: string;
  textContent: string;
  type: "document" | "note";
}

export default function SummaryCard({ referenceId, userId, textContent, type }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "detailed">("medium");

  // Query existing summary for this referenceId and length
  const { data: summaryData } = db.useQuery({
    summaries: {
      $: {
        where: { referenceId, length: summaryLength, userId }
      }
    }
  });

  const existingSummary = summaryData?.summaries?.[0];

  const generateSummary = async () => {
    if (!textContent || loading) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textContent, length: summaryLength }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Summarization failed");
      }

      const data: SummaryData = await res.json();

      // Save to InstantDB
      db.transact([
        db.tx.summaries[id()].update({
          referenceId,
          summary: data.summary,
          keyPoints: data.keyPoints,
          concepts: data.concepts,
          length: summaryLength,
          userId,
          createdAt: Date.now(),
        })
      ]);

    } catch (err: any) {
      setError(err.message || "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!existingSummary) return;
    navigator.clipboard.writeText(existingSummary.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-generate if not exists
  useEffect(() => {
    if (!existingSummary && !loading && textContent && !error) {
      generateSummary();
    }
  }, [existingSummary, textContent, summaryLength]);

  return (
    <div className="rounded-2xl border p-6 space-y-6" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: "rgba(124,144,130,0.1)", color: "var(--accent-primary)" }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Smart Summary</h3>
            <p className="text-xs opacity-60">AI-powered insights</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Length Toggle */}
          <div className="flex items-center p-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
            {["short", "medium", "detailed"].map((l) => (
              <button
                key={l}
                onClick={() => setSummaryLength(l as any)}
                className="px-2.5 py-1.5 rounded-lg transition-all"
                style={{ 
                  background: summaryLength === l ? "var(--accent-primary)" : "transparent",
                  color: summaryLength === l ? "white" : "var(--text-secondary)"
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={generateSummary}
            disabled={loading}
            className="p-2 rounded-xl border hover:bg-black/5 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
            title="Regenerate"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <Loader2 size={32} className="animate-spin opacity-20" />
            <p className="text-sm font-medium animate-pulse opacity-60 italic">Analyzing content and extracting insights...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600"
          >
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={generateSummary}
                className="text-xs font-bold uppercase tracking-wider underline hover:opacity-80"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : existingSummary ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* The Summary Text */}
            <div className="relative group">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {existingSummary.summary}
              </p>
              <button
                onClick={handleCopy}
                className="absolute -top-2 -right-2 p-2 rounded-lg border opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                style={{ borderColor: "var(--border)", background: "var(--bg-primary)", color: "var(--text-secondary)" }}
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="h-px w-full" style={{ background: "var(--border)" }} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <KeyPointsList points={existingSummary.keyPoints} />
              <ConceptTags concepts={existingSummary.concepts} />
            </div>
          </motion.div>
        ) : (
          <div className="py-12 text-center opacity-40 italic text-sm">
            Content is empty or too short to summarize.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
