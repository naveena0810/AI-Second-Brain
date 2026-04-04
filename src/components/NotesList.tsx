"use client";

import { db } from "@/lib/instant";
import { id } from "@instantdb/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, StickyNote, Pencil, Trash2, X, Check, Mic } from "lucide-react";
import EmptyState from "./EmptyState";
import SearchBar from "./SearchBar";
import SummaryCard from "./SummaryCard";
import VoiceNoteContainer from "./VoiceNoteContainer";
import BaseCard from "./BaseCard";
import SectionHeader from "./SectionHeader";
import ActionButton from "./ActionButton";
import FloatingButton from "./FloatingButton";

interface Props { userId: string; }

export default function NotesList({ userId }: Props) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showInsights, setShowInsights] = useState<Record<string, boolean>>({});
  const [showVoiceMode, setShowVoiceMode] = useState(false);

  const { data } = db.useQuery({
    notes: { $: { where: { userId } } },
  });

  const notes = (data?.notes ?? []).filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const noteId = id();
    const now = Date.now();
    await db.transact([
      db.tx.notes[noteId].update({
        title: newTitle,
        content: newContent,
        userId,
        createdAt: now,
      }),
      db.tx.timelineEvents[id()].update({
        type: "note",
        title: newTitle,
        description: newContent.slice(0, 120) || "New note created",
        referenceId: noteId,
        userId,
        date: now,
        createdAt: now,
      }),
    ]);
    setNewTitle("");
    setNewContent("");
    setCreating(false);
  };

  const handleStartEdit = (note: { id: string; title: string; content: string }) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await db.transact([
      db.tx.notes[editingId].update({ title: editTitle, content: editContent }),
    ]);
    setEditingId(null);
  };

  const handleDelete = async (noteId: string) => {
    await db.transact([db.tx.notes[noteId].delete()]);
  };

  return (
    <div className="space-y-6 relative h-full">
      <AnimatePresence mode="wait">
        {showVoiceMode ? (
          <motion.div
            key="voice-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-3xl"
          >
            <VoiceNoteContainer userId={userId} onClose={() => setShowVoiceMode(false)} />
          </motion.div>
        ) : (
          <motion.div key="notes-list" className="space-y-6">
            {/* Header */}
            <div className="notes-header flex items-center justify-between">
               <SectionHeader 
                 title="Notes" 
                 subtitle={`${(data?.notes ?? []).length} captured ideas`} 
               />
              <div className="flex items-center gap-3">
                <div className="search-wrapper w-56">
                  <SearchBar value={search} onChange={setSearch} placeholder="Search notes…" />
                </div>
                <button
                  onClick={() => setShowVoiceMode(true)}
                  className="voice-btn relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border hover:scale-105"
                  style={{ background: "var(--surface)", color: "var(--text-primary)", borderColor: "var(--border)", minHeight: 44 }}
                >
                  <div className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 animate-pulse" style={{ background: "var(--accent-highlight)", boxShadow: "0 0 10px var(--accent-highlight)" }} />
                  <Mic size={14} style={{ color: "var(--accent-highlight)" }} />
                  Voice Note
                </button>
              </div>
            </div>

            {/* Create note form */}
            <AnimatePresence>
              {creating && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl p-6 mb-6 shadow-md border"
                  style={{ borderColor: "var(--accent-primary)", background: "var(--bg-secondary)" }}
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Title your thought…"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent outline-none mb-3"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <textarea
                    rows={4}
                    placeholder="Write your note here…"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    className="w-full text-base bg-transparent outline-none resize-none leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <div className="flex items-center gap-3 justify-end mt-4">
                    <ActionButton variant="ghost" onClick={() => setCreating(false)}>
                      Cancel
                    </ActionButton>
                    <ActionButton variant="primary" onClick={handleCreate}>
                      Save Note
                    </ActionButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes grid */}
            {(data?.notes ?? []).length === 0 ? (
              <EmptyState
                icon={StickyNote}
                title="No thoughts yet"
                description="Create notes to capture ideas, summaries, and knowledge."
                action={
                  <ActionButton onClick={() => setCreating(true)} icon={Plus}>
                    Create your first note
                  </ActionButton>
                }
              />
            ) : (
              <div className="notes-grid grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                <AnimatePresence>
                  {notes.map((note) => (
                    <BaseCard key={note.id} className="group relative flex flex-col min-h-[160px]">
                      {editingId === note.id ? (
                        <div className="space-y-3 flex flex-col flex-1">
                          <input
                            autoFocus
                            className="w-full text-lg font-bold bg-transparent outline-none"
                            style={{ color: "var(--text-primary)" }}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                          />
                          <textarea
                            rows={3}
                            className="w-full flex-1 text-sm bg-transparent outline-none resize-none leading-relaxed"
                            style={{ color: "var(--text-primary)" }}
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end mt-2">
                            <ActionButton variant="ghost" size="sm" onClick={() => setEditingId(null)} icon={X}>Cancel</ActionButton>
                            <ActionButton variant="primary" size="sm" onClick={handleSaveEdit} icon={Check}>Save</ActionButton>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                             <p className="text-lg font-bold mb-2 pr-12" style={{ color: "var(--text-primary)" }}>{note.title}</p>
                             <p className="text-sm leading-relaxed opacity-80" style={{ color: "var(--text-secondary)" }}>{note.content}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                            <p className="text-xs font-medium opacity-50" style={{ color: "var(--text-secondary)" }}>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                            <button 
                               onClick={() => setShowInsights(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                               className="text-[11px] font-bold uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg"
                               style={{ 
                                  background: showInsights[note.id] ? "var(--accent-primary)" : "transparent",
                                  color: showInsights[note.id] ? "white" : "var(--accent-primary)",
                                  border: showInsights[note.id] ? "none" : "1px solid var(--accent-primary)"
                               }}
                            >
                               {showInsights[note.id] ? "Hide Insights" : "Brain Insights"}
                            </button>
                          </div>

                          <AnimatePresence>
                            {showInsights[note.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t overflow-hidden"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <SummaryCard 
                                  referenceId={note.id} 
                                  userId={userId} 
                                  textContent={note.content} 
                                  type="note" 
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Quick Actions Hover */}
                          <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStartEdit({ id: note.id, title: note.title, content: note.content })} className="p-2 rounded-xl bg-white shadow-sm border hover:bg-gray-50 transition-colors" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(note.id)} className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100 shadow-sm hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </>
                      )}
                    </BaseCard>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {notes.length === 0 && search && (
              <p className="text-center text-sm py-12 font-medium" style={{ color: "var(--text-secondary)" }}>No thoughts match &quot;{search}&quot;</p>
            )}
            
            {/* Floating Action Button */}
            {!creating && (
              <FloatingButton onClick={() => setCreating(true)} text="New Note" icon={Plus} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
