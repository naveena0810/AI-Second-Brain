"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Mic, AlertCircle } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import VoiceNoteResult, { StructuredVoiceNote } from "./VoiceNoteResult";
import SectionHeader from "./SectionHeader";

interface Props {
  userId: string;
  onClose?: () => void;
}

type Mode = "record" | "processing" | "result";

export default function VoiceNoteContainer({ userId, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("record");
  const [result, setResult] = useState<StructuredVoiceNote | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [error, setError] = useState("");

  const handleProcess = async (transcript: string) => {
    setOriginalTranscript(transcript);
    setMode("processing");
    setError("");

    try {
      const res = await fetch("/api/voice-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process voice note");
      }

      const data = await res.json();
      setResult(data);
      setMode("result");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
      setMode("record");
    }
  };

  const handleSaved = () => {
    setMode("record");
    setResult(null);
    setOriginalTranscript("");
    if (onClose) onClose();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-full">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          {onClose && (
            <button 
              onClick={onClose}
              className="mr-2 p-2.5 rounded-xl hover:bg-black/5 transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <SectionHeader title="Voice to Knowledge" subtitle="Speak to capture ideas automatically" icon={Mic} />
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {mode === "record" && (
          <motion.div
            key="record"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <VoiceRecorder onProcess={handleProcess} isProcessing={false} />
          </motion.div>
        )}

        {mode === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-24 premium-card"
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
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Structuring Knowledge...</h2>
            <p className="text-sm font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>AI is extracting insights</p>
          </motion.div>
        )}

        {mode === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <VoiceNoteResult 
              result={result} 
              userId={userId} 
              originalTranscript={originalTranscript} 
              onSaved={handleSaved} 
            />
            <div className="mt-8 flex justify-center">
               <button onClick={() => setMode("record")} className="text-sm font-bold tracking-widest uppercase transition-colors opacity-50 hover:opacity-100" style={{ color: "var(--text-secondary)" }}>
                  ← Discard & Start Over
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
