"use client";

import { useMemo, useEffect, useState } from "react";
import { FileText, StickyNote, MessageSquare, CalendarDays, BrainCircuit } from "lucide-react";

interface Props {
  label: string;
  events: any[];
}

export default function TimelineSummary({ label, events }: Props) {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const counts = useMemo(() => ({
    document: events.filter(e => e.type === "document").length,
    note: events.filter(e => e.type === "note").length,
    query: events.filter(e => e.type === "query").length,
  }), [events]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/timeline-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month: label, events }),
        });
        const data = await res.json();
        setAiSummary(data.summary);
      } catch (err) {
        setAiSummary("Continue your learning journey and explore more concepts!");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [label, events]);

  const fallbackSummary = useMemo(() => {
    const stage =
      events.length < 3 ? "You were just getting started this month." :
      events.length < 8 ? "You had solid activity this month." :
      "You were very active this month — great momentum!";

    const insightParts: string[] = [];
    if (counts.document > 0) insightParts.push(`uploaded ${counts.document} document${counts.document > 1 ? "s" : ""}`);
    if (counts.note > 0) insightParts.push(`created ${counts.note} note${counts.note > 1 ? "s" : ""}`);
    if (counts.query > 0) insightParts.push(`asked ${counts.query} question${counts.query > 1 ? "s" : ""}`);

    return insightParts.length > 0
      ? `In ${label}, you ${insightParts.join(", ")}. ${stage}`
      : `No activity recorded in ${label}.`;
  }, [label, events, counts]);

  return (
    <div className="flex items-start gap-3 pl-14 mb-2">
      {/* Month label on the line */}
      <div
        className="absolute left-0 w-[60px] flex flex-col items-center gap-1 -translate-x-[1px]"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--accent-primary)" }}>
          <CalendarDays size={12} color="white" />
        </div>
      </div>

      <div className="flex-1 rounded-2xl p-4 -ml-14" style={{ background: "rgba(124,144,130,0.06)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "var(--accent-primary)", color: "white" }}>
            <BrainCircuit size={10} />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Summary</span>
          </div>
        </div>
        
        <p className="text-xs leading-relaxed mb-3 italic" style={{ color: "var(--text-secondary)" }}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-current animate-bounce" />
              <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
              Generating monthly insight...
            </span>
          ) : (
            aiSummary || fallbackSummary
          )}
        </p>

        <div className="flex gap-3 flex-wrap">
          {counts.document > 0 && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#7C9082" }}>
              <FileText size={11} /> {counts.document} doc{counts.document > 1 ? "s" : ""}
            </span>
          )}
          {counts.note > 0 && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#CA9E5E" }}>
              <StickyNote size={11} /> {counts.note} note{counts.note > 1 ? "s" : ""}
            </span>
          )}
          {counts.query > 0 && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#8B8FA8" }}>
              <MessageSquare size={11} /> {counts.query} query{counts.query > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
