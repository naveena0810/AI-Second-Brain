"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, StickyNote, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

const TYPE_CONFIG = {
  document: { icon: FileText, label: "Document", emoji: "📄", color: "#7C9082", bg: "rgba(124,144,130,0.12)" },
  note: { icon: StickyNote, label: "Note", emoji: "📝", color: "#CA9E5E", bg: "rgba(202,158,94,0.12)" },
  query: { icon: MessageSquare, label: "AI Query", emoji: "💬", color: "#8B8FA8", bg: "rgba(139,143,168,0.12)" },
} as const;

interface Props { event: any; index?: number; }

export default function TimelineItem({ event, index = 0 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[event.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.query;
  const Icon = config.icon;
  const date = new Date(event.date ?? event.createdAt ?? 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10, y: 10 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative group"
    >
      {/* Dot on the vertical line */}
      <div
        className="absolute -left-[46px] top-3.5 w-3 h-3 rounded-full border-2"
        style={{ background: config.color, borderColor: "var(--bg-primary)" }}
      />

      {/* Card */}
      <div
        className="premium-card overflow-hidden cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4 p-2">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5" style={{ background: config.bg }}>
            <Icon size={15} style={{ color: config.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: config.bg, color: config.color }}>
                {config.label}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                {date.toLocaleDateString("en-US", { day: "numeric", month: "short" })} · {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{event.title}</p>
            {!expanded && (
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{event.description}</p>
            )}
          </div>

          {/* Expand toggle */}
          <button className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100" style={{ color: "var(--text-secondary)" }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                  {event.description}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
