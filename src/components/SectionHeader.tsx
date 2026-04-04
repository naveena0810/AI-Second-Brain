"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
}

export default function SectionHeader({ title, subtitle, action, icon: Icon }: SectionHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/50 border shadow-sm" style={{ borderColor: "var(--border)" }}>
            <Icon size={20} style={{ color: "var(--accent-primary)" }} />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </motion.div>
  );
}
