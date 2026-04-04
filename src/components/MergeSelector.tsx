"use client";

import { motion } from "framer-motion";
import { Check, FileText, StickyNote, GitMerge } from "lucide-react";
import BaseCard from "./BaseCard";

interface Doc {
  id: string;
  title: string;
  content: string;
  type: "document" | "note";
}

interface Props {
  documents: Doc[];
  notes: Doc[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function MergeSelector({ documents, notes, selected, onToggle }: Props) {
  const allItems: Doc[] = [
    ...documents.map(d => ({ ...d, type: "document" as const })),
    ...notes.map(n => ({ ...n, type: "note" as const })),
  ];

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
        <GitMerge size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">No documents or notes found. Upload or create some first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-4">
      {allItems.map(item => {
        const isSelected = selected.includes(item.id);
        return (
          <BaseCard
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`cursor-pointer transition-all ${
              isSelected 
                ? "ring-2 ring-[var(--accent-primary)] bg-[var(--surface)] shadow-md translate-y-[-2px]" 
                : "border-transparent shadow-sm border hover:shadow-md"
            }`}
          >
            <div className="flex flex-col h-full gap-4">
               <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ 
                    background: item.type === "document" ? "rgba(124, 144, 130, 0.15)" : "rgba(202, 158, 94, 0.15)",
                    color: item.type === "document" ? "var(--accent-primary)" : "var(--accent-secondary)"
                  }}>
                    {item.type === "document" ? <FileText size={16} /> : <StickyNote size={16} />}
                  </div>
                  
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-[var(--border)]"
                  }`}>
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
               </div>
               
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title || "Untitled"}</p>
                 <p className="text-xs line-clamp-2 mt-1" style={{ color: "var(--text-secondary)" }}>
                   {item.content}
                 </p>
               </div>
            </div>
          </BaseCard>
        );
      })}
    </div>
  );
}
