"use client";

import { motion } from "framer-motion";

interface Props {
  concepts: string[];
}

export default function ConceptTags({ concepts }: Props) {
  if (!concepts || concepts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Important Concepts</h4>
      <div className="flex flex-wrap gap-2">
        {concepts.map((concept, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ 
              background: "rgba(124,144,130,0.1)", 
              borderColor: "rgba(124,144,130,0.2)",
              color: "var(--accent-primary)"
            }}
          >
            {concept}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
