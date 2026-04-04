"use client";

import { Search } from "lucide-react";

type FilterType = "all" | "document" | "note" | "query";

interface Props {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  search: string;
  setSearch: (s: string) => void;
  counts: { total: number; documents: number; notes: number; queries: number };
}

const FILTERS: { key: FilterType; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "🗂" },
  { key: "document", label: "Documents", emoji: "📄" },
  { key: "note", label: "Notes", emoji: "📝" },
  { key: "query", label: "Queries", emoji: "💬" },
];

export default function TimelineFilters({ filter, setFilter, search, setSearch, counts }: Props) {
  const getCount = (key: FilterType) => {
    if (key === "all") return counts.total;
    if (key === "document") return counts.documents;
    if (key === "note") return counts.notes;
    return counts.queries;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Filter buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: filter === key ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: filter === key ? "white" : "var(--text-secondary)",
              border: "1px solid " + (filter === key ? "transparent" : "var(--border)"),
            }}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{
              background: filter === key ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)"
            }}>
              {getCount(key)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-secondary)" }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search timeline…"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>
    </div>
  );
}
