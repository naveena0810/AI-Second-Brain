"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface ExampleSectionProps {
  example: string;
  onSaveToNotes?: (text: string) => void;
}

export default function ExampleSection({ example, onSaveToNotes }: ExampleSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="mt-3 rounded-2xl overflow-hidden border border-amber-200/70"
      style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Lightbulb size={12} className="text-white fill-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-amber-800">
            Real-Life Example
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="p-1.5 rounded-lg hover:bg-amber-200/60 transition-colors"
            title="Copy example"
          >
            {copied
              ? <Check size={12} className="text-amber-700" />
              : <Copy size={12} className="text-amber-600" />
            }
          </button>
          {expanded ? <ChevronUp size={14} className="text-amber-600" /> : <ChevronDown size={14} className="text-amber-600" />}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <div className="flex gap-3">
                <div className="w-0.5 rounded-full bg-amber-300 flex-shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed">{example}</p>
              </div>
              {onSaveToNotes && (
                <button
                  onClick={() => onSaveToNotes(example)}
                  className="mt-3 text-[10px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
                >
                  + Save to notes
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
