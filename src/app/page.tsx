"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/instant";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Brain, Menu, X,
  FileText, StickyNote, BrainCircuit, Clock, HelpCircle, Workflow, GitMerge
} from "lucide-react";
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

// Bottom tab bar (5 most-used tabs)
const BOTTOM_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "documents", label: "Docs", icon: FileText },
  { id: "notes",     label: "Notes", icon: StickyNote },
  { id: "ask",       label: "Ask AI", icon: BrainCircuit },
  { id: "timeline",  label: "Timeline", icon: Clock },
  { id: "quiz",      label: "Quiz", icon: HelpCircle },
];

// Full tab list for hamburger menu
const ALL_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "documents", label: "Documents",    icon: FileText },
  { id: "notes",     label: "Notes",        icon: StickyNote },
  { id: "ask",       label: "Ask AI",       icon: BrainCircuit },
  { id: "graph",     label: "Visual Graph", icon: Workflow },
  { id: "timeline",  label: "Timeline",     icon: Clock },
  { id: "fusion",    label: "Fusion",       icon: GitMerge },
  { id: "quiz",      label: "Quiz Mode",    icon: HelpCircle },
];

export default function Home() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("documents");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth");
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.replace("/auth");
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
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
      <header className="sticky top-0 z-50 border-b" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 header-inner">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-primary)" }}>
              <Brain size={14} color="white" />
            </div>
            <span className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>AI Second Brain</span>
          </div>

          {/* Desktop nav + actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop tab navigation */}
            <div className="desktop-tab-nav">
              <TabNavigation activeTab={activeTab} onChange={handleTabChange} />
            </div>

            <ThemeToggle />
            <NotificationBell userId={user.id} />

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl hover:bg-black/5 transition-colors"
              title="Sign out"
              style={{ minWidth: 36, minHeight: 36 }}
            >
              <LogOut size={16} style={{ color: "var(--text-secondary)" }} />
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="mobile-hamburger hidden items-center justify-center p-2 rounded-xl transition-colors hover:bg-black/5"
              onClick={() => setMobileMenuOpen(true)}
              style={{ minWidth: 44, minHeight: 44, color: "var(--text-primary)" }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="mobile-nav-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-in panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[60] flex flex-col shadow-2xl"
              style={{ width: "75vw", maxWidth: 300, background: "var(--bg-primary)", borderLeft: "1px solid var(--border)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-black/5 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                  <X size={18} style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {ALL_TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleTabChange(id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all"
                      style={{
                        background: isActive ? "var(--bg-secondary)" : "transparent",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        minHeight: 48,
                      }}
                    >
                      <Icon size={18} style={{ color: isActive ? "var(--accent-primary)" : "inherit" }} />
                      {label}
                    </button>
                  );
                })}
              </nav>

              {/* Sign out */}
              <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors hover:bg-red-50"
                  style={{ color: "#ef4444", minHeight: 48 }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`
          main-content-area
          ${isFullScreenTab ? "w-full max-w-none h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden" : "max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10"}
          transition-all duration-300 flex-1 flex flex-col
        `}
      >
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
            {activeTab === "fusion" && (
              <div className="px-4 sm:px-6 py-6 overflow-y-auto custom-scrollbar flex-1">
                <KnowledgeMerge userId={user.id} />
              </div>
            )}
            {activeTab === "quiz" && (
              <div className="px-4 sm:px-6 py-6 overflow-y-auto custom-scrollbar flex-1">
                <QuizMode userId={user.id} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-tab-bar">
        {BOTTOM_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all"
              style={{
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                minHeight: 56,
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
