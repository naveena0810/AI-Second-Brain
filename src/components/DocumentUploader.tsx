"use client";

import { useState, useRef } from "react";
import { db } from "@/lib/instant";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2 } from "lucide-react";
import { id } from "@instantdb/react";

import SectionHeader from "./SectionHeader";

interface Props {
  userId: string;
}

function chunkText(text: string, size = 400, overlap = 50): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

export default function DocumentUploader({ userId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(pdf|txt|md)$/i)) {
      setError("Only PDF, TXT, and MD files are supported.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      let textContent = "";
      if (file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/extract-text", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          textContent = data.text || "";
        } else {
          textContent = "(PDF text extraction unavailable — please use TXT format)";
        }
      } else {
        textContent = await file.text();
      }

      const docId = id();
      const chunks = chunkText(textContent);
      const now = Date.now();

      await db.transact([
        db.tx.knowledgeDocuments[docId].update({
          title: file.name,
          fileUrl: "",
          textContent,
          userId,
          createdAt: now,
        }),
        ...chunks.map(chunkText => {
          const chunkId = id();
          return db.tx.knowledgeChunks[chunkId].update({
            documentId: docId,
            chunkText,
            embedding: [],
            createdAt: now,
          });
        }),
        db.tx.timelineEvents[id()].update({
          type: "document",
          title: file.name,
          description: `Uploaded document with ${chunks.length} knowledge chunks`,
          referenceId: docId,
          userId,
          date: now,
          createdAt: now,
        }),
      ]);

      fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textContent, length: 'medium' }),
      }).then(res => res.json()).then(data => {
        if (data.summary) {
           db.transact([
            db.tx.summaries[id()].update({
              referenceId: docId,
              summary: data.summary,
              keyPoints: data.keyPoints,
              concepts: data.concepts,
              length: 'medium',
              userId,
              createdAt: Date.now(),
            })
          ]);
        }
      }).catch(err => console.warn("Auto-summarization background task failed:", err));

    } catch (err) {
      setError("Failed to process file. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <SectionHeader title="Upload Knowledge" subtitle="Add documents to your second brain" icon={Upload} />
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="relative border border-dashed rounded-[32px] p-16 text-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_var(--shadow)]"
        style={{
          borderColor: isDragging ? "var(--accent-primary)" : "var(--border)",
          background: "var(--surface)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
        />
        <div className="flex flex-col items-center gap-5">
          {uploading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 size={40} style={{ color: "var(--accent-primary)" }} />
            </motion.div>
          ) : (
            <motion.div 
               animate={{ y: isDragging ? -5 : 0, scale: isDragging ? 1.05 : 1 }} 
               className="w-16 h-16 rounded-[20px] flex items-center justify-center shadow-md border"
               style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
            >
              <Upload size={24} style={{ color: "var(--text-secondary)" }} strokeWidth={2} />
            </motion.div>
          )}
          <div>
            <p className="text-lg font-bold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              {uploading ? "Synthesizing document…" : "Drop a file to upload"}
            </p>
            <p className="text-sm font-medium opacity-80" style={{ color: "var(--text-secondary)" }}>
              PDF, TXT, MD • Auto-chunked & Indexed
            </p>
          </div>
        </div>
      </motion.div>
      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-3 font-medium text-center">{error}</motion.p>}
      <div className="flex items-center justify-center gap-2 mt-4" style={{ color: "var(--text-secondary)" }}>
        <FileText size={14} />
        <span className="text-xs font-medium">Files are automatically chunked into searchable knowledge pieces</span>
      </div>
    </div>
  );
}
