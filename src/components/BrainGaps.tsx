"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/instant";
import { id } from "@instantdb/react";
import { Brain, RefreshCw, Loader2, Sparkles, GraduationCap, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopicList from "./TopicList";
import SuggestionsPanel from "./SuggestionsPanel";

interface Props {
  userId: string;
}

export default function BrainGaps({ userId }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const { data: insightsData } = db.useQuery({
    knowledgeInsights: { $: { where: { userId } } }
  });

  const latestInsight = insightsData?.knowledgeInsights?.sort((a, b) => b.createdAt - a.createdAt)[0];

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await res.json();

      // Save to InstantDB
      db.transact([
        db.tx.knowledgeInsights[id()].update({
          userId,
          knownTopics: data.knownTopics || [],
          missingTopics: data.missingTopics || [],
          suggestions: data.suggestions || [],
          createdAt: Date.now(),
        })
      ]);

    } catch (err: any) {
      setError(err.message || "Failed to analyze your knowledge.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Initial analysis if none exists
  useEffect(() => {
    if (!latestInsight && !analyzing && !error) {
      handleAnalyze();
    }
  }, [latestInsight, analyzing]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(124,144,130,0.15)" }} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl" style={{ background: "var(--accent-primary)", color: "white" }}>
              <Brain size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Mentored Insights</h2>
              <p className="text-sm opacity-60" style={{ color: "var(--text-secondary)" }}>Bridging the gaps in your knowledge base</p>
            </div>
          </div>
          
          <button 
             onClick={handleAnalyze}
             disabled={analyzing}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] hover:shadow-lg disabled:opacity-50"
             style={{ background: "var(--accent-primary)", color: "white" }}
          >
             {analyzing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
             <span>{analyzing ? "Analyzing Your Brain..." : "Re-Analyze Knowledge"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div 
             key="loading"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="flex flex-col items-center justify-center py-20 space-y-4"
          >
            <Loader2 size={40} className="animate-spin text-[var(--accent-primary)] opacity-40" />
            <div className="text-center">
              <p className="text-lg font-semibold animate-pulse" style={{ color: "var(--text-primary)" }}>Mapping Cognitive Pathways...</p>
              <p className="text-sm opacity-60" style={{ color: "var(--text-secondary)" }}>Analyzing your documents and notes to find connections.</p>
            </div>
          </motion.div>
        ) : error ? (
           <motion.div key="error" className="py-20 text-center space-y-4">
              <p className="text-red-500 font-medium">{error}</p>
              <button onClick={handleAnalyze} className="underline text-sm font-bold tracking-wider uppercase opacity-60 hover:opacity-100 transition-opacity">Try Again</button>
           </motion.div>
        ) : latestInsight ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left: Topics Column */}
            <div className="lg:col-span-7 space-y-10">
              <TopicList topics={latestInsight.knownTopics} type="known" />
              <div className="h-px w-full" style={{ background: "var(--border)" }} />
              <TopicList topics={latestInsight.missingTopics} type="missing" />
            </div>

            {/* Right: Path Column */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-3xl border p-6 space-y-6" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-2 p-3 rounded-2xl" style={{ background: "rgba(124,144,130,0.05)", border: "1px dashed var(--border)" }}>
                    <GraduationCap size={20} style={{ color: "var(--accent-primary)" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Mentor Recommendations</span>
                  </div>
                  <SuggestionsPanel suggestions={latestInsight.suggestions} />
                  
                  <div className="pt-2">
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-black/5" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <span>View Detailed Learning Map</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="py-20 text-center opacity-40 italic">
            Add some documents or notes to start generating insights.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
