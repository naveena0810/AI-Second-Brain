"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import SourceCard from "./SourceCard";

interface Source {
  id: string;
  documentTitle: string;
  snippet: string;
  score?: number;
  pageNumber?: number;
  type?: 'note' | 'document';
}

interface Props {
  sources: Source[];
  keywords: string[];
}

export default function SourceList({ sources, keywords }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group py-1"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Information Sources ({sources.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>
            {isOpen ? "Hide Details" : "Show Details"}
          </span>
          {isOpen ? <ChevronUp size={12} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-secondary)" }} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
              {sources.map((source, i) => (
                <motion.div
                  key={source.id + i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <SourceCard source={source} keywords={keywords} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
