"use client";

import { useState, useMemo } from "react";
import { db } from "@/lib/instant";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, StickyNote, MessageSquare, CalendarDays } from "lucide-react";
import TimelineItem from "./TimelineItem";
import TimelineFilters from "./TimelineFilters";
import TimelineSummary from "./TimelineSummary";
import ActivityHeatmap from "./ActivityHeatmap";
import EmptyState from "./EmptyState";

interface Props { userId: string; }

type FilterType = "all" | "document" | "note" | "query";

export default function Timeline({ userId }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data } = db.useQuery({ timelineEvents: { $: { where: { userId } } } });
  const allEvents = (data?.timelineEvents ?? []) as any[];

  const filtered = useMemo(() => {
    let events = [...allEvents];
    if (filter !== "all") events = events.filter(e => e.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return events.sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
  }, [allEvents, filter, search]);

  // Group by Month
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; monthKey: string; events: any[] }>();
    for (const event of filtered) {
      const d = new Date(event.date ?? event.createdAt ?? 0);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map.has(monthKey)) map.set(monthKey, { label, monthKey, events: [] });
      map.get(monthKey)!.events.push(event);
    }
    return [...map.values()];
  }, [filtered]);

  // Calculate insights
  const insights = useMemo(() => ({
    total: allEvents.length,
    documents: allEvents.filter(e => e.type === "document").length,
    notes: allEvents.filter(e => e.type === "note").length,
    queries: allEvents.filter(e => e.type === "query").length,
  }), [allEvents]);

  // Growth stage
  const stage =
    insights.total < 5 ? { label: "Beginner", color: "var(--text-secondary)" } :
    insights.total < 20 ? { label: "Intermediate", color: "var(--accent-secondary)" } :
    { label: "Advanced", color: "var(--accent-primary)" };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Smart Memory Timeline</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Your learning journey visualized</p>
        </div>
        {allEvents.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(124,144,130,0.1)", border: "1px solid var(--border)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
            <span className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label} Stage</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      {allEvents.length > 0 && (
        <div className="timeline-stats-grid grid grid-cols-3 gap-3">
          {[
            { icon: FileText, label: "Documents", count: insights.documents, color: "var(--accent-primary)" },
            { icon: StickyNote, label: "Notes", count: insights.notes, color: "var(--accent-secondary)" },
            { icon: MessageSquare, label: "AI Queries", count: insights.queries, color: "var(--accent-highlight)" },
          ].map(({ icon: Icon, label, count, color }) => (
            <div key={label} className="premium-card p-4 text-center">
              <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{count}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity Heatmap */}
      {allEvents.length > 0 && (
        <ActivityHeatmap events={allEvents} />
      )}

      {/* Filters */}
      <TimelineFilters filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} counts={insights} />

      {/* Timeline content */}
      {groups.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={allEvents.length === 0 ? "Your timeline is empty" : "No results found"}
          description={allEvents.length === 0
            ? "Start by uploading a document, creating a note, or asking the AI a question. Every action creates a memory."
            : `No events match "${filter !== "all" ? filter + "s" : ""} ${search}".`}
        />
      ) : (
        <div className="relative mt-8">
          {/* Vertical guide line */}
          <div className="timeline-guide-line absolute left-[30px] top-0 bottom-0 w-0.5 rounded-full" style={{ background: "var(--accent-secondary)", opacity: 0.3 }} />

          <div className="space-y-12">
            <AnimatePresence>
              {groups.map(({ label, monthKey, events }) => (
                <motion.div key={monthKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <TimelineSummary label={label} events={events} />
                  <div className="timeline-items-pl space-y-6 mt-6 pl-14">
                    {events.map((event, index) => (
                      <TimelineItem key={event.id} event={event} index={index} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
