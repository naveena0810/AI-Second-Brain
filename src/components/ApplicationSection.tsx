"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface ApplicationSectionProps {
  application: string;
}

export default function ApplicationSection({ application }: ApplicationSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(application);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="mt-2 rounded-2xl overflow-hidden border border-violet-200/70"
      style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Cpu size={12} className="text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-violet-800">
            Practical Application
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="p-1.5 rounded-lg hover:bg-violet-200/60 transition-colors"
            title="Copy application"
          >
            {copied
              ? <Check size={12} className="text-violet-700" />
              : <Copy size={12} className="text-violet-600" />
            }
          </button>
          {expanded ? <ChevronUp size={14} className="text-violet-600" /> : <ChevronDown size={14} className="text-violet-600" />}
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
                <div className="w-0.5 rounded-full bg-violet-300 flex-shrink-0" />
                <p className="text-sm text-violet-900 leading-relaxed">{application}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
