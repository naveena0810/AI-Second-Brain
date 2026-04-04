"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-3xl border-2 border-dashed transition-all"
      style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Icon size={28} style={{ color: "var(--accent-primary)" }} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </motion.div>
  );
}
