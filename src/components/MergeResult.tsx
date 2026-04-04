"use client";

import { motion } from "framer-motion";
import { Link2, Lightbulb, Rocket, Copy, Check } from "lucide-react";
import { useState } from "react";
import BaseCard from "./BaseCard";
import SectionHeader from "./SectionHeader";

export interface MergeOutput {
  title: string;
  insight: string;
  connections: string[];
  applications: string[];
  innovation: string;
}

interface Props {
  result: MergeOutput;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 rounded-xl transition-colors hover:bg-black/5" style={{ color: "var(--text-secondary)" }}>
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

export default function MergeResult({ result }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <BaseCard className="px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--accent-tertiary)" }}>Fused Knowledge</p>
          <h2 className="text-2xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{result.title}</h2>
        </div>

        {/* Combined Insight */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Unified Insight</h3>
            <CopyBtn text={result.insight} />
          </div>
          <p className="text-base leading-relaxed font-medium" style={{ color: "var(--text-primary)" }}>{result.insight}</p>
        </div>

        {/* Connections */}
        {result.connections?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Link2 size={14} /> Key Connections
            </h3>
            <div className="space-y-3">
              {result.connections.map((conn, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--bg-secondary)", color: "var(--accent-primary)" }}>{i + 1}</span>
                  <span className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>{conn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        {result.applications?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Lightbulb size={14} /> Practical Applications
            </h3>
            <ul className="space-y-2">
              {result.applications.map((app, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-secondary)" }} />
                  {app}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Innovation */}
        {result.innovation && (
          <div className="pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--accent-primary)" }}>
              <Rocket size={14} /> Innovation Idea
            </h3>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--text-primary)" }}>{result.innovation}</p>
          </div>
        )}
      </BaseCard>
    </motion.div>
  );
}
