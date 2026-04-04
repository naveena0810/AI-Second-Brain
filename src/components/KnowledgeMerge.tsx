"use client";

import { useState } from "react";
import { db } from "@/lib/instant";
import { motion, AnimatePresence } from "framer-motion";
import { GitMerge, SparklesIcon, ArrowRight, RotateCcw } from "lucide-react";
import MergeSelector from "./MergeSelector";
import MergeResult, { MergeOutput } from "./MergeResult";
import SectionHeader from "./SectionHeader";
import ActionButton from "./ActionButton";

interface Props {
  userId: string;
}

export default function KnowledgeMerge({ userId }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MergeOutput | null>(null);
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

  const allItems = [...allDocuments, ...allNotes];

  const handleToggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getSelectedDocs = () =>
    allItems
      .filter(item => selected.includes(item.id))
      .map(item => ({ title: item.title, content: item.content }));

  const handleMerge = async () => {
    const docs = getSelectedDocs();
    if (docs.length < 2) return;
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/merge-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: docs }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Merge failed.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Could not generate merged insight. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelected([]);
    setError("");
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Header */}
      <SectionHeader 
        title="Knowledge Merge" 
        subtitle="Fusion Mode — synthesize ideas into new knowledge" 
        icon={GitMerge} 
      />

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Related Doc Suggestion Badge */}
            {allItems.length >= 2 && (
              <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-medium" style={{ background: "rgba(124, 144, 130, 0.1)", color: "var(--accent-primary)", border: "1px solid var(--border)" }}>
                <SparklesIcon size={16} />
                <span>Select 2 or more documents/notes below and merge them into a unified insight.</span>
              </div>
            )}

            {/* Selector */}
            <div className="premium-card p-6 space-y-6">
              <h2 className="text-sm font-bold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
                Select Knowledge Sources
                {selected.length > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "var(--accent-primary)", color: "white" }}>
                    {selected.length} selected
                  </span>
                )}
              </h2>
              <MergeSelector
                documents={allDocuments}
                notes={allNotes}
                selected={selected}
                onToggle={handleToggle}
              />
            </div>

            {/* Error */}
            {error && <p className="text-sm text-red-500 font-medium px-2">{error}</p>}

            {/* Merge Button */}
            <div className="flex flex-col items-center gap-3">
              <div className={`relative ${isLoading ? "animate-pulse" : ""}`}>
                {/* Glow effect when active */}
                {selected.length >= 2 && (
                  <div className="absolute -inset-1 blur-md rounded-2xl opacity-50 transition-opacity duration-1000" style={{ background: "linear-gradient(135deg, var(--accent-tertiary), var(--accent-secondary))" }} />
                )}
                
                <button
                  onClick={handleMerge}
                  disabled={selected.length < 2 || isLoading}
                  className={`relative z-10 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ 
                    background: selected.length >= 2 ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" : "var(--border)",
                    color: selected.length >= 2 ? "white" : "var(--text-secondary)"
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <GitMerge size={18} /> Merge Knowledge
                      {selected.length >= 2 && <ArrowRight size={16} />}
                    </>
                  )}
                </button>
              </div>

              {selected.length < 2 && (
                <p className="text-xs font-semibold opacity-60" style={{ color: "var(--text-secondary)" }}>
                  (Select at least 2 sources)
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex justify-between items-center p-4 premium-card">
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Merged from {selected.length} sources
              </h2>
              <ActionButton variant="secondary" onClick={handleReset} className="py-2.5">
                <RotateCcw size={14} /> Merge Again
              </ActionButton>
            </div>
            <MergeResult result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
