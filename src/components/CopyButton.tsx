"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  text: string;
  size?: number;
  label?: string;
  className?: string;
}

export default function CopyButton({ text, size = 14, label, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={label || "Copy to clipboard"}
      className={className || "p-1.5 rounded-lg transition-colors hover:bg-black/5 flex items-center gap-1.5"}
      style={{ color: "var(--text-secondary)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="flex items-center gap-1.5">
            <Check size={size} style={{ color: "var(--accent-primary)" }} />
            {label && <span className="text-[10px] uppercase font-bold tracking-tight">Copied!</span>}
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="flex items-center gap-1.5">
            <Copy size={size} />
            {label && <span className="text-[10px] uppercase font-bold tracking-tight">{label}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
