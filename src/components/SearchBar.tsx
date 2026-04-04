"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search…" }: Props) {
  return (
    <div className="relative flex items-center">
      <Search size={14} className="absolute left-3 pointer-events-none" style={{ color: "var(--text-secondary)" }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-xl outline-none transition-all focus:ring-2 focus:ring-[var(--accent-primary)]/30"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
      />
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => onChange("")}
          className="absolute right-2.5"
        >
          <X size={13} style={{ color: "var(--text-secondary)" }} />
        </motion.button>
      )}
    </div>
  );
}
