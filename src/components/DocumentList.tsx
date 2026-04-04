"use client";

import { db } from "@/lib/instant";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import EmptyState from "./EmptyState";
import SearchBar from "./SearchBar";
import SummaryCard from "./SummaryCard";

import BaseCard from "./BaseCard";

interface Props { userId: string; }

export default function DocumentList({ userId }: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState<Record<string, boolean>>({});

  const { data } = db.useQuery({
    knowledgeDocuments: { $: { where: { userId } } },
  });

  const docs = (data?.knowledgeDocuments ?? []).filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (docId: string) => {
    await db.transact([
      db.tx.knowledgeDocuments[docId].delete(),
    ]);
  };

  if ((data?.knowledgeDocuments ?? []).length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload a PDF, TXT, or Markdown file to start building your knowledge base."
      />
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Your Library <span className="text-xs font-normal opacity-50 ml-2">({docs.length})</span>
        </h3>
        <div className="w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Search documents…" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {docs.map((doc) => (
            <BaseCard key={doc.id} className="flex flex-col group relative overflow-hidden" noPadding>
              <div className="p-5 flex-1 cursor-pointer" onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm border" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
                    <FileText size={20} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>{doc.title}</p>
                    <p className="text-[11px] mt-1.5 font-medium tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      {" • "}
                      {doc.textContent?.length?.toLocaleString() ?? 0} chars
                    </p>
                  </div>
                </div>

                {/* Floating quick actions */}
                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="p-2 rounded-xl text-red-500 hover:text-white transition-all shadow-sm border"
                    style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-primary)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "#ef4444"; }}
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === doc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t"
                    style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.02)" }}
                  >
                    <div className="p-5 space-y-5">
                      <SummaryCard 
                        referenceId={doc.id} 
                        userId={userId} 
                        textContent={doc.textContent} 
                        type="document" 
                      />
                      
                      <div className="flex flex-col gap-3">
                         <button 
                          onClick={() => setShowRawText(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                          className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors w-fit flex items-center gap-1.5"
                        >
                          {showRawText[doc.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showRawText[doc.id] ? "Hide Original Text" : "Show Original Text"}
                        </button>
                        
                        {showRawText[doc.id] && (
                          <div className="p-4 rounded-xl shadow-inner border" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
                            <p className="text-[13px] leading-relaxed max-h-48 overflow-y-auto custom-scrollbar" style={{ color: "var(--text-secondary)" }}>
                              {doc.textContent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </BaseCard>
          ))}
        </AnimatePresence>
      </div>

      {docs.length === 0 && search && (
        <p className="text-center text-sm py-8" style={{ color: "var(--text-secondary)" }}>No documents match &quot;{search}&quot;</p>
      )}
    </div>
  );
}
