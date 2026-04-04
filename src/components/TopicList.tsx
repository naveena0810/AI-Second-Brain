"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  topics: string[];
  type: "known" | "missing";
}

export default function TopicList({ topics, type }: Props) {
  if (!topics || topics.length === 0) return null;

  const isKnown = type === "known";

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
        {isKnown ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-amber-500" />}
        {isKnown ? "Your Knowledge" : "Missing Topics"}
      </h4>
      <div className="flex flex-wrap gap-2.5">
        {topics.map((topic, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all hover:scale-[1.03]"
            style={{ 
              background: isKnown ? "rgba(34,197,94,0.05)" : "rgba(245,158,11,0.05)", 
              borderColor: isKnown ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
              color: isKnown ? "#166534" : "#92400e"
            }}
          >
            <div 
               className="w-1.5 h-1.5 rounded-full" 
               style={{ background: isKnown ? "#22c55e" : "#f59e0b" }} 
            />
            {topic}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
