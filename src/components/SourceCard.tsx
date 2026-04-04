"use client";

import { FileText, StickyNote, ExternalLink } from "lucide-react";
import HighlightedText from "./HighlightedText";

interface Source {
  id: string;
  documentTitle: string;
  snippet: string;
  score?: number;
  pageNumber?: number;
  type?: 'note' | 'document';
}

interface Props {
  source: Source;
  keywords: string[];
}

export default function SourceCard({ source, keywords }: Props) {
  const isNote = source.type === 'note' || source.documentTitle.startsWith('Note:');
  const Icon = isNote ? StickyNote : FileText;

  return (
    <div 
      className="p-3 rounded-xl border transition-all hover:shadow-md group cursor-default"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: isNote ? "rgba(202,158,94,0.12)" : "rgba(124,144,130,0.12)" }}>
            <Icon size={12} style={{ color: isNote ? "var(--accent-secondary)" : "var(--accent-primary)" }} />
          </div>
          <p className="text-[11px] font-bold truncate pr-2" style={{ color: "var(--text-primary)" }}>
            {source.documentTitle}
          </p>
          {source.pageNumber && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              p. {source.pageNumber}
            </span>
          )}
        </div>
        {source.score !== undefined && (
          <span className="text-[10px] font-bold" style={{ color: source.score > 80 ? "var(--accent-primary)" : "var(--text-secondary)" }}>
            {source.score}% Match
          </span>
        )}
      </div>

      <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
        <HighlightedText text={source.snippet} keywords={keywords} />
      </p>

      <div className="mt-2 flex justify-end">
        <button className="flex items-center gap-1 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100" style={{ color: "var(--accent-primary)" }}>
          <ExternalLink size={10} />
          View Source
        </button>
      </div>
    </div>
  );
}
