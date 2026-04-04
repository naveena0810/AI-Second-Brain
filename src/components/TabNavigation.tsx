"use client";

import { motion } from "framer-motion";
import { FileText, StickyNote, Mic, BrainCircuit, Network, Clock, Workflow, GitMerge, HelpCircle } from "lucide-react";

export type TabId = "documents" | "notes" | "ask" | "graph" | "timeline" | "fusion" | "quiz";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "documents", label: "Documents", icon: FileText },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "ask", label: "Ask AI", icon: BrainCircuit },
  { id: "graph", label: "Visual Graph", icon: Workflow },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "fusion", label: "Fusion", icon: GitMerge },
  { id: "quiz", label: "Quiz Mode", icon: HelpCircle },
];

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export default function TabNavigation({ activeTab, onChange }: Props) {
  return (
    <nav className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: "var(--bg-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
