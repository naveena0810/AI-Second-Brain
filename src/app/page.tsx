"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/instant";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Brain } from "lucide-react";
import TabNavigation, { TabId } from "@/components/TabNavigation";
import NotificationBell from "@/components/NotificationBell";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import NotesList from "@/components/NotesList";
import AskAI from "@/components/AskAI";
import Timeline from "@/components/Timeline";
import ConceptMap from "@/components/ConceptMap";
import KnowledgeMerge from "@/components/KnowledgeMerge";
import QuizMode from "@/components/QuizMode";
import VoiceNoteContainer from "@/components/VoiceNoteContainer";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("documents");

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth");
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.replace("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading your brain…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isFullScreenTab = ["ask", "graph", "fusion", "quiz"].includes(activeTab);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-primary)" }}>
            <Brain size={14} color="white" />
          </div>
          <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>AI Second Brain</span>
        </div>
        <div className="flex items-center gap-3">
          <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
          <ThemeToggle />
          <NotificationBell userId={user.id} />
          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl hover:bg-black/5 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${isFullScreenTab ? "w-full max-w-none h-[calc(100vh-64px)] overflow-hidden" : "max-w-[1200px] mx-auto px-6 py-10"} transition-all duration-300 flex-1 flex flex-col`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={isFullScreenTab ? "h-full flex flex-col overflow-hidden" : "h-full flex flex-col"}
          >
            {activeTab === "documents" && (
              <div className="space-y-6">
                <DocumentUploader userId={user.id} />
                <DocumentList userId={user.id} />
              </div>
            )}
            {activeTab === "notes" && <NotesList userId={user.id} />}
            {activeTab === "ask" && <AskAI userId={user.id} />}
            {activeTab === "graph" && <ConceptMap userId={user.id} />}
            {activeTab === "timeline" && <Timeline userId={user.id} />}
            {activeTab === "fusion" && <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1"><KnowledgeMerge userId={user.id} /></div>}
            {activeTab === "quiz" && <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1"><QuizMode userId={user.id} /></div>}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
