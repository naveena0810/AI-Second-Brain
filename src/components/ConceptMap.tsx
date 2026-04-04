"use client";

import { useState, useCallback } from "react";
import { db } from "@/lib/instant";
import { id } from "@instantdb/react";
import { motion, AnimatePresence } from "framer-motion";
import { Workflow, Sparkles, FileText, StickyNote, Download, Database, ChevronDown, ChevronUp } from "lucide-react";
import GraphCanvas from "./GraphCanvas";
import EmptyState from "./EmptyState";
import { toPng } from 'html-to-image';

interface Props {
  userId: string;
}

export default function ConceptMap({ userId }: Props) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data, isLoading } = db.useQuery({
    notes: { $: { where: { userId } } },
    knowledgeDocuments: { $: { where: { userId } } },
    conceptMaps: { $: { where: { userId } } },
  });

  const notes = data?.notes ?? [];
  const docs = data?.knowledgeDocuments ?? [];
  const conceptMaps = data?.conceptMaps ?? [];

  const handleGenerate = async () => {
    if (!selectedSource || isGenerating) return;
    setIsGenerating(true);
    setError("");

    try {
      // Find the source content
      const source = [...notes, ...docs].find(n => n.id === selectedSource);
      if (!source) throw new Error("Source not found");

      const text = source.title + "\n\n" + ((source as any).content || (source as any).textContent || "");
      if (text.trim().length < 20) {
        throw new Error("Content is too short to generate a meaningful concept map.");
      }

      const res = await fetch("/api/concept-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate concept map");
      }

      const graphData = await res.json();

      // Save to InstantDB
      const existingMapForSource = conceptMaps.find(m => m.sourceId === selectedSource);
      const mapIdToUse = existingMapForSource ? existingMapForSource.id : id();

      await db.transact([
        db.tx.conceptMaps[mapIdToUse].update({
          userId,
          sourceId: selectedSource,
          sourceType: notes.some(n => n.id === selectedSource) ? 'note' : 'document',
          nodes: JSON.stringify(graphData.nodes),
          edges: JSON.stringify(graphData.edges),
          createdAt: existingMapForSource ? existingMapForSource.createdAt : Date.now(),
        })
      ]);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestConcepts = async (currentNodes: any[], currentEdges: any[], mapId: string) => {
    setIsGenerating(true);
    try {
      // Bonus: Ask AI for related concepts
      const existingConcepts = currentNodes.map(n => n.label).join(", ");
      const promptText = `Existing concepts: ${existingConcepts}. Suggest 3 completely new related sub-concepts and provide JSON with "nodes" and "edges" connecting them to the existing ones. Do not repeat existing nodes. Use same JSON structure.`;
      
      const res = await fetch("/api/concept-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: promptText }),
      });

      if (!res.ok) throw new Error("Suggestion failed");
      const graphData = await res.json();

      const mergedNodes = [...currentNodes, ...graphData.nodes];
      const mergedEdges = [...currentEdges, ...graphData.edges];

      await db.transact([
        db.tx.conceptMaps[mapId].update({
          nodes: JSON.stringify(mergedNodes),
          edges: JSON.stringify(mergedEdges),
        })
      ]);

    } catch(err) {
      console.error(err);
      setError("Failed to suggest new concepts.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = useCallback(() => {
    const node = document.querySelector('.react-flow') as HTMLElement;
    if (!node) return;
    
    // Hide controls before export
    const controls = document.querySelector('.react-flow__controls') as HTMLElement;
    if (controls) controls.style.display = 'none';

    toPng(node, {
      backgroundColor: '#f9fafb',
      width: node.offsetWidth,
      height: node.offsetHeight,
      style: {
        width: node.offsetWidth.toString(),
        height: node.offsetHeight.toString(),
      },
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'concept-map.png';
        link.href = dataUrl;
        link.click();
        if (controls) controls.style.display = 'flex';
      })
      .catch((err) => {
        console.error('Error exporting image:', err);
        if (controls) controls.style.display = 'flex';
      });
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 opacity-50">Loading Knowledge Base...</div>;
  }

  // Check if selected source already has a map
  const existingMap = selectedSource ? conceptMaps.sort((a,b) => b.createdAt - a.createdAt).find(m => m.sourceId === selectedSource) : null;
  const parsedNodes = existingMap ? JSON.parse(existingMap.nodes) : [];
  const parsedEdges = existingMap ? JSON.parse(existingMap.edges) : [];

  const allSources = [...notes, ...docs];
  
  // Group sources for ChatGPT-like history
  const uniqueMapSources = Array.from(new Set(conceptMaps.sort((a,b) => b.createdAt - a.createdAt).map(m => m.sourceId)));
  const historySources = uniqueMapSources.map(id => allSources.find(s => s.id === id)).filter(Boolean);
  const availableSources = allSources.filter(s => !uniqueMapSources.includes(s.id));

  const renderSourceItem = (source: any) => {
    const isNote = notes.some(n => n.id === source.id);
    const Icon = isNote ? StickyNote : FileText;
    const hasMap = conceptMaps.some(m => m.sourceId === source.id);
    const isActive = selectedSource === source.id;
    
    return (
      <div className="px-1" key={source.id}>
        <button
          onClick={() => { setSelectedSource(source.id); setError(""); }}
          className={`w-full flex items-center gap-3 text-left p-4 rounded-2xl text-sm leading-snug transition-colors border ${
            isActive ? 'border-transparent shadow-sm' : 'border-transparent hover:border-gray-100 hover:bg-black/5'
          }`}
          style={{
            color: "var(--text-primary)",
            background: isActive ? "var(--surface)" : "transparent"
          }}
        >
          <div className="flex-1 truncate font-medium">
             {source.title}
          </div>
          {hasMap && (
            <span title="Has Concept Map">
              <Database size={14} style={{ color: isActive ? "#6366f1" : "inherit", opacity: isActive ? 1 : 0.4 }} />
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full relative">
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar toggle button */}
      <button
        className="md:hidden absolute bottom-[calc(64px+16px)] left-1/2 -translate-x-1/2 z-[45] flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold shadow-xl transition-all"
        style={{ background: "var(--accent-primary)", color: "white", minHeight: 44 }}
        onClick={() => setMobileSidebarOpen(v => !v)}
      >
        {mobileSidebarOpen ? "Hide" : "Select Source"}
        {mobileSidebarOpen
          ? <span style={{ fontSize: 16 }}>▼</span>
          : <span style={{ fontSize: 16 }}>▲</span>
        }
      </button>

      {/* Sidebar for selecting sources */}
      <div
        className={`conceptmap-sidebar w-[300px] flex-shrink-0 flex flex-col h-full overflow-hidden border-r ${
          mobileSidebarOpen ? "" : "max-md:hidden"
        }`}
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="sidebar-inner w-[300px] p-4 flex flex-col h-full">
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Visual Graph</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Select an item to generate its map</p>
          </div>
          
          <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {historySources.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] px-2 opacity-40 mb-1" style={{ color: "var(--text-secondary)" }}>📌 PREVIOUS MAPS</p>
                {historySources.map(renderSourceItem)}
              </div>
            )}

            {availableSources.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] px-2 opacity-40 mt-4 mb-1" style={{ color: "var(--text-secondary)" }}>AVAILABLE TO MAP</p>
                {availableSources.map(renderSourceItem)}
              </div>
            )}
            
            {historySources.length === 0 && availableSources.length === 0 && (
              <p className="text-xs px-2 italic" style={{ color: "var(--text-secondary)" }}>No notes or documents found.</p>
            )}
          </div>
        </div>
      </div>
      {/* Main Canvas Area */}
      <div className="conceptmap-canvas-area flex-1 flex flex-col relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        {!selectedSource ? (
          <EmptyState
            icon={Workflow}
            title="Instant Concept Map"
            description="Select a document or note from the sidebar to instantly generate a visual knowledge graph."
          />
        ) : (
          <>
            {/* Header / Actions */}
            <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between pointer-events-none">
              <div className="backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border pointer-events-auto" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Workflow size={16} style={{ color: "var(--accent-primary)" }} />
                  {notes.find(n => n.id === selectedSource)?.title || docs.find(d => d.id === selectedSource)?.title}
                </p>
              </div>

              <div className="flex gap-2 pointer-events-auto">
                {existingMap && (
                  <>
                    <button
                      onClick={() => handleSuggestConcepts(parsedNodes, parsedEdges, existingMap.id)}
                      disabled={isGenerating}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Sparkles size={14} /> AI Suggest Related
                    </button>
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Download size={14} /> Export Image
                    </button>
                  </>
                )}
                {!existingMap && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Sparkles size={14} /> 
                    {isGenerating ? "Analyzing..." : "Generate Concept Map"}
                  </button>
                )}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold border border-red-200 shadow-sm flex items-center gap-2">
                {error}
                <button onClick={() => setError("")} className="hover:text-red-800 ml-2">×</button>
              </div>
            )}

            {/* Canvas */}
            <div className="flex-1 w-full h-full bg-gray-50/50">
              {isGenerating && !existingMap && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 p-8 premium-card shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--accent-primary)] animate-spin" />
                    <p className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Extracting Knowledge...</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Building nodes and relationships</p>
                  </motion.div>
                </div>
              )}

              {existingMap && parsedNodes.length > 0 && (
                <div className="w-full h-full pt-16">
                   <GraphCanvas initialNodes={parsedNodes} initialEdges={parsedEdges} />
                </div>
              )}

              {isGenerating && existingMap && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-indigo-200 animate-pulse flex items-center gap-2">
                   <Sparkles size={14} />
                   AI is researching related concepts...
                 </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
