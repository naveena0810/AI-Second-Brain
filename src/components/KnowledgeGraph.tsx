"use client";

import { db } from "@/lib/instant";
import { id } from "@instantdb/react";
import { useCallback, useState } from "react";
import { Network, Plus } from "lucide-react";
import EmptyState from "./EmptyState";

// Lightweight canvas rendering instead of ReactFlow (avoids dependency install issues)
// We will use a simple force-directed SVG layout

interface Node { id: string; label: string; x: number; y: number; type: 'note' | 'document' | 'concept'; parentId?: string; }
interface Edge { source: string; target: string; relation: string; }

interface Props { userId: string; }

function buildGraph(
  notes: any[], 
  docs: any[],
  activeConcepts: { id: string, label: string, parentId: string }[],
  selectedId: string | null
): { nodes: Node[]; edges: Edge[] } {
  if (!selectedId) return { nodes: [], edges: [] };

  const target = [...notes, ...docs].find(n => n.id === selectedId);
  if (!target) return { nodes: [], edges: [] };

  const mainNode: Node = {
    id: target.id,
    label: target.title || (target as any).name || "Untitled",
    type: notes.some(n => n.id === target.id) ? 'note' : 'document',
    x: 300,
    y: 200
  };

  const nodeList: Node[] = [mainNode];
  const itemConcepts = activeConcepts.filter(c => c.parentId === selectedId);

  itemConcepts.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / itemConcepts.length;
    const r = 160;
    nodeList.push({
      id: c.id,
      label: c.label,
      type: 'concept',
      parentId: selectedId,
      x: 300 + r * Math.cos(angle),
      y: 200 + r * Math.sin(angle)
    });
  });

  const finalEdges = itemConcepts.map(c => ({ 
    source: selectedId, 
    target: c.id, 
    relation: 'concept' 
  }));

  return { nodes: nodeList, edges: finalEdges };
}

export default function KnowledgeGraph({ userId }: Props) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [activeConcepts, setActiveConcepts] = useState<{ id: string, label: string, parentId: string }[]>([]);
  const [addingEdge, setAddingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [edgeRelation, setEdgeRelation] = useState("");

  const { data, isLoading } = db.useQuery({
    notes: { $: { where: { userId } } },
    knowledgeDocuments: { $: { where: { userId } } },
    connections: { $: { where: { userId } } },
  });

  const notes = data?.notes ?? [];
  const docs = data?.knowledgeDocuments ?? [];
  const connections = data?.connections ?? [];

  const { nodes, edges } = buildGraph(notes, docs, activeConcepts, selectedNode);

  const handleExpandConcepts = useCallback(async () => {
    if (!selectedNode || expanding) return;
    const target = [...notes, ...docs].find(n => n.id === selectedNode);
    if (!target) return;

    setExpanding(true);
    try {
      // Use both title and content for better extraction, fallback to title if empty
      const title = target.title || (target as any).name || "";
      const content = (target as any).textContent || (target as any).content || "";
      const textToAnalyze = `${title}\n\n${content}`.trim();
      
      if (!textToAnalyze) {
        alert("This item has no content to analyze.");
        return;
      }

      const res = await fetch("/api/summarize", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze, length: 'short' })
      });
      
      if (!res.ok) throw new Error("API failure");
      const resData = await res.json();
      
      if (resData.concepts && Array.isArray(resData.concepts) && resData.concepts.length > 0) {
        const newConcepts = resData.concepts.map((c: string) => ({
          id: id(),
          label: c,
          parentId: selectedNode
        }));
        setActiveConcepts(newConcepts);
      } else {
        alert("AI couldn't find distinct concepts in this note. Try adding more detail!");
        setActiveConcepts([]);
      }
    } catch (err) {
      console.error("Concept extraction failed", err);
      alert("AI analysis failed. Please try again.");
    } finally {
      setExpanding(false);
    }
  }, [selectedNode, expanding, notes, docs]);

  const handleAddConnection = useCallback(async () => {
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget) return;
    await db.transact([
      db.tx.connections[id()].update({
        sourceNoteId: edgeSource,
        targetNoteId: edgeTarget,
        relation: edgeRelation || "related",
        userId,
        createdAt: Date.now(),
      }),
    ]);
    setAddingEdge(false);
    setEdgeSource("");
    setEdgeTarget("");
    setEdgeRelation("");
  }, [edgeSource, edgeTarget, edgeRelation, userId]);

  const selectedItem = [...notes, ...docs].find(n => n.id === selectedNode);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-sm opacity-50">Loading Knowledge...</div>;
  }

  if (notes.length === 0 && docs.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="Your Brain is Empty"
        description="Add some notes or documents to start visualizing your knowledge."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Knowledge Graph</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Visualize concepts inside your notes</p>
        </div>
        <button
          onClick={() => setAddingEdge(!addingEdge)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.97]"
          style={{ background: "var(--accent-primary)" }}
        >
          <Plus size={14} /> Connect Ideas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SVG Graph Area */}
        <div className="md:col-span-2 rounded-2xl overflow-hidden relative shadow-inner" style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          {!selectedNode ? (
            <div className="flex flex-col items-center justify-center h-[450px] space-y-4 text-center px-8">
              <div className="p-4 rounded-full bg-white/50 border border-dotted border-gray-300">
                <Network size={32} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">No Item Selected</p>
                <p className="text-xs text-gray-400 max-w-xs mt-1">Select a note or document from the right to visualize its concepts and relationships.</p>
              </div>
            </div>
          ) : (
            <svg width="100%" height="450" viewBox="0 0 600 450" className="p-4">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                </filter>
              </defs>

              {/* Edges */}
              {edges.map((edge, i) => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return null;
                return (
                  <line 
                    key={i} 
                    x1={source.x} y1={source.y} x2={target.x} y2={target.y} 
                    stroke="var(--accent-primary)" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="4 3" 
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const isMain = node.type !== 'concept';
                const width = isMain ? 140 : 100;
                const height = isMain ? 60 : 40;
                const rx = isMain ? 16 : 20;

                return (
                  <g key={node.id} transform={`translate(${node.x - width/2}, ${node.y - height/2})`} filter="url(#shadow)">
                    <rect
                      width={width} height={height} rx={rx}
                      fill={isMain ? "white" : "rgba(168,85,247,0.05)"}
                      stroke={isMain ? (node.type === 'note' ? "#22c55e" : "#2563eb") : "#a855f7"}
                      strokeWidth={isMain ? "2" : "1.5"}
                    />
                    <foreignObject width={width} height={height}>
                      <div className="w-full h-full flex items-center justify-center p-3 text-center pointer-events-none">
                        <span 
                          className={`text-[10px] font-bold leading-tight line-clamp-2 ${isMain ? 'text-gray-800' : 'text-purple-700'}`}
                          style={{ wordBreak: 'break-word' }}
                        >
                          {node.label}
                        </span>
                      </div>
                    </foreignObject>
                    {isMain && (
                       <circle cx={width} cy="0" r="5" fill={node.type === 'note' ? "#22c55e" : "#2563eb"} />
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Sidebar List */}
        <div className="rounded-2xl p-4 space-y-4 flex flex-col h-[450px]" style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Available Knowledge</p>
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => { setSelectedNode(note.id); setActiveConcepts([]); }}
                className={`w-full text-left px-3 py-3 rounded-xl cursor-pointer transition-all border ${selectedNode === note.id ? 'bg-green-50/50 border-green-200' : 'bg-white/40 border-transparent hover:border-gray-200'}`}
              >
                <p className="font-bold text-xs text-gray-800 truncate">{note.title}</p>
                {selectedNode === note.id && (
                  <div className="mt-2 space-y-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExpandConcepts(); }}
                      disabled={expanding}
                      className="w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-green-600 text-white disabled:opacity-50"
                    >
                      {expanding ? "Analyzing..." : "Visualize Content ✨"}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => { setSelectedNode(doc.id); setActiveConcepts([]); }}
                className={`w-full text-left px-3 py-3 rounded-xl cursor-pointer transition-all border ${selectedNode === doc.id ? 'bg-blue-50/50 border-blue-200' : 'bg-white/40 border-transparent hover:border-gray-200'}`}
              >
                <p className="font-bold text-xs text-gray-800 truncate">{doc.title}</p>
                {selectedNode === doc.id && (
                  <div className="mt-2 space-y-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExpandConcepts(); }}
                      disabled={expanding}
                      className="w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-blue-600 text-white disabled:opacity-50"
                    >
                      {expanding ? "Analyzing..." : "Visualize Content ✨"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedItem && notes.some(n => n.id === selectedItem.id) && (
            <div className="mt-auto pt-4 border-t border-gray-100">
               <p className="text-[9px] text-gray-400 font-medium line-clamp-2 italic opacity-70">"{(selectedItem as any).content}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual & Instructions */}
      <div className="rounded-2xl p-6 border bg-white/50 backdrop-blur-sm mt-6" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">How to use the Knowledge Graph</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <div className="space-y-2">
            <p className="font-bold text-black opacity-80">1. Select an Item</p>
            <p>Select any Note <span className="text-green-600 font-bold">(Green)</span> or Document <span className="text-blue-600 font-bold">(Blue)</span> from the sidebar to visualize it.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-black opacity-80">2. Visualize Content</p>
            <p>Click <span className="font-bold text-[var(--accent-primary)]">"Visualize Content ✨"</span> to see the AI-extracted concepts from your selection.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-black opacity-80">3. Inspect Nodes</p>
            <p>The graph shows your selection as a professional rounded shape. Key concepts appear as purple pills.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-black opacity-80">4. Focused Learning</p>
            <p>This focused view helps you dive deep into one topic at a time without distractions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
