"use client";

import { motion } from "framer-motion";
import { Check, CheckCircle2, Copy, FileText, Lightbulb, Save } from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/instant";

export interface StructuredVoiceNote {
  title: string;
  summary: string;
  keyPoints: string[];
  concepts: string[];
}

interface Props {
  result: StructuredVoiceNote;
  userId: string;
  originalTranscript: string;
  onSaved: () => void;
}

export default function VoiceNoteResult({ result, userId, originalTranscript, onSaved }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${result.title}\n\nSummary:\n${result.summary}\n\nKey Points:\n${result.keyPoints.map(p => `• ${p}`).join("\n")}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const noteId = Date.now().toString();
      await db.transact([
        db.tx.notes[noteId].update({
          title: result.title || "Voice Note",
          content: originalTranscript, // Save raw text as content for searchability
          summary: result.summary,
          keyPoints: result.keyPoints,
          concepts: result.concepts,
          userId,
          createdAt: Date.now(),
        }),
        db.tx.timelineEvents[Date.now().toString()].update({
          type: "note",
          title: `Voice Note: ${result.title}`,
          description: result.summary.slice(0, 100) + "...",
          referenceId: noteId,
          userId,
          date: Date.now(),
          createdAt: Date.now(),
        }),
      ]);
      setTimeout(() => {
        setIsSaving(false);
        onSaved();
      }, 600);
    } catch (err) {
      console.error("Failed to save voice note", err);
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">{result.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="Copy Note"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
            style={{ background: "var(--accent-primary)" }}
          >
            {isSaving ? <CheckCircle2 size={18} className="animate-pulse" /> : <Save size={18} />}
            {isSaving ? "Saved!" : "Save to Database"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-3 flex items-center gap-2">
            <FileText size={14} /> Summary
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 bg-purple-50 p-4 rounded-2xl border border-purple-100">
            {result.summary}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} /> Key Points
          </h3>
          <ul className="space-y-2">
            {result.keyPoints?.map((point, i) => (
              <li key={i} className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-sm text-gray-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {result.concepts && result.concepts.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2">
              <Lightbulb size={14} /> Core Concepts
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.concepts.map((concept, i) => (
                <span key={i} className="px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
