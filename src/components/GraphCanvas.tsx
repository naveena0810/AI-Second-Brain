"use client";

import React, { useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { motion } from 'framer-motion';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  
  // Wider separation gives curved edges more space to fan out their labels
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 40 });

  nodes.forEach((node) => {
    // Read dimensions from the node style to accommodate different shapes (diamonds vs rects)
    const w = parseInt(node.style?.width?.toString() || "160", 10);
    const h = parseInt(node.style?.height?.toString() || "60", 10);
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const w = parseInt(node.style?.width?.toString() || "160", 10);
    const h = parseInt(node.style?.height?.toString() || "60", 10);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

interface GraphCanvasProps {
  initialNodes: any[];
  initialEdges: any[];
}

// Map edge labels to distinct colors to ensure clarity
const getEdgeColorPalette = (label: string) => {
  const cleanLabel = (label || "").trim().toLowerCase();
  
  // Specific logical flows
  if (cleanLabel === 'yes' || cleanLabel === 'true') {
    return { bg: '#ecfccb', text: '#65a30d', border: '#bef264', stroke: '#84cc16' }; // Green
  }
  if (cleanLabel === 'no' || cleanLabel === 'false') {
    return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', stroke: '#ef4444' }; // Red
  }
  
  // Common Structural Relationships
  if (cleanLabel === 'includes' || cleanLabel === 'contains') {
    return { bg: '#fef3c7', text: '#d97706', border: '#fde68a', stroke: '#f59e0b' }; // Amber
  }
  if (cleanLabel === 'applied in' || cleanLabel === 'used in' || cleanLabel === 'uses') {
    return { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff', stroke: '#a855f7' }; // Purple
  }
  if (cleanLabel === 'evaluated by' || cleanLabel === 'measured by') {
    return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd', stroke: '#38bdf8' }; // Sky
  }
  if (cleanLabel === 'related to' || cleanLabel === 'similar to') {
    return { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8', stroke: '#ec4899' }; // Pink
  }
  if (cleanLabel === 'requires' || cleanLabel === 'needs') {
    return { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa', stroke: '#f97316' }; // Orange
  }

  // Generic Default
  return { bg: '#f8fafc', text: '#475569', border: '#cbd5e1', stroke: '#94a3b8' }; // Slate
};

export default function GraphCanvas({ initialNodes, initialEdges }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Determine hierarchy logic for shapes
    const incomingEdgeCounts: Record<string, number> = {};
    const outgoingEdgeCounts: Record<string, number> = {};
    
    initialNodes.forEach(n => {
      incomingEdgeCounts[n.id] = 0;
      outgoingEdgeCounts[n.id] = 0;
    });

    initialEdges.forEach(e => {
      outgoingEdgeCounts[e.source] = (outgoingEdgeCounts[e.source] || 0) + 1;
      incomingEdgeCounts[e.target] = (incomingEdgeCounts[e.target] || 0) + 1;
    });

    const formattedNodes: Node[] = initialNodes.map(n => {
      const isRoot = incomingEdgeCounts[n.id] === 0;
      const isLeaf = outgoingEdgeCounts[n.id] === 0;
      const labelStr = (n.label || "");
      const isDecision = labelStr.trim().endsWith('?') || labelStr.toLowerCase().includes("which ") || labelStr.toLowerCase().includes("how ");

      let nodeContent;
      let nodeW = 160;
      let nodeH = 60;

      // React Component as label overrides the default node visual wrapper
      if (isRoot) {
        // Start: Deep Blue Pill
        nodeW = 160; nodeH = 50;
        nodeContent = (
          <div className="w-full h-full text-white rounded-full flex items-center justify-center font-bold text-[13px] px-4 shadow-[0_4px_14px_0_var(--shadow)] uppercase tracking-wider text-center break-words leading-tight transition-transform" style={{ background: "var(--accent-primary)" }}>
            {labelStr}
          </div>
        );
      } else if (isDecision) {
        // Decision: Rich Indigo Diamond
        nodeW = 130; nodeH = 130;
        nodeContent = (
          <div className="w-full h-full relative flex items-center justify-center transition-transform hover:scale-105">
            <div className="absolute inset-[15%] shadow-lg rotate-45 rounded-xl border border-white/20" style={{ background: "var(--accent-tertiary)" }}></div>
            <div className="relative z-10 text-white font-bold text-[11px] text-center px-5 leading-snug">
              {labelStr}
            </div>
          </div>
        );
      } else if (isLeaf) {
        // End: Emerald Pill
        nodeW = 140; nodeH = 46;
        nodeContent = (
          <div className="w-full h-full text-white rounded-full flex items-center justify-center font-bold text-xs px-4 shadow-[0_4px_14px_0_var(--shadow)] text-center break-words leading-tight transition-transform" style={{ background: "var(--accent-highlight)" }}>
            {labelStr}
          </div>
        );
      } else {
        // Standard Action: Premium Orange Rectangle
        nodeW = 170; nodeH = 64;
        nodeContent = (
          <div className="w-full h-full text-white rounded-[20px] flex items-center justify-center font-bold text-xs px-4 shadow-[0_4px_14px_0_var(--shadow)] border border-white/10 text-center break-words leading-snug transition-transform" style={{ background: "var(--accent-secondary)" }}>
            {labelStr}
          </div>
        );
      }

      return {
        id: n.id,
        // Override React Flow's default padding and background wrapper entirely
        className: "!bg-transparent !border-none !p-0 !min-w-0 ring-[rgba(0,0,0,0)] shadow-none rounded-none",
        style: { width: nodeW, height: nodeH },
        data: { label: nodeContent },
        position: { x: 0, y: 0 },
      };
    });

    const formattedEdges: Edge[] = initialEdges.map((e, idx) => {
      const palette = getEdgeColorPalette(e.label || "");

      return {
        id: `e-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'default', // Bezier curve prevents dense label overlapping that happens with straight orthogonal lines
        animated: false,
        labelStyle: { fill: palette.text, fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 100, // Circular/pill labels for arrows
        labelBgStyle: { fill: palette.bg, fillOpacity: 0.95, stroke: palette.border, strokeWidth: 1.5 },
        style: { stroke: palette.stroke, strokeWidth: 2, opacity: 0.8 }, // Colored clean lines
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: palette.stroke
        },
      };
    });

    // We use TB (Top to Bottom) for classical flowchart structure
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      formattedNodes,
      formattedEdges,
      'TB' 
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-full h-full relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnScroll={true}
        zoomOnScroll={false}
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        attributionPosition="bottom-right"
        style={{ background: "var(--bg-primary)" }}
      >
        <Controls showInteractive={false} className="bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] shadow-sm rounded-xl overflow-hidden" />
        <Background color="var(--border)" gap={24} size={1} />
      </ReactFlow>
    </motion.div>
  );
}
