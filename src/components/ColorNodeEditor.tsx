import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, X, ChevronRight, Circle, Layers, 
  Sun, Thermometer, TrendingUp, Palette, 
  Contrast, Maximize2, Move 
} from 'lucide-react';
import { ColorNode, ColorConnection, Clip } from '../../packages/core/timeline-engine';
import { motion } from 'motion/react';

interface ColorNodeEditorProps {
  clip: Clip;
  onUpdateNodes: (nodes: ColorNode[]) => void;
  onUpdateConnections: (connections: ColorConnection[]) => void;
}

const NODE_TYPES = [
  { type: 'exposure', label: 'Exposure', icon: Sun, color: '#F5A623' },
  { type: 'white-balance', label: 'White Balance', icon: Thermometer, color: '#4A90E2' },
  { type: 'curves', label: 'Curves', icon: TrendingUp, color: '#7ED321' },
  { type: 'lut', label: 'LUT', icon: Layers, color: '#BD10E0' },
  { type: 'color-wheel', label: 'Color Wheel', icon: Palette, color: '#D0021B' },
  { type: 'smh', label: 'Shadows/Mid/High', icon: Contrast, color: '#50E3C2' },
];

export default function ColorNodeEditor({ clip, onUpdateNodes, onUpdateConnections }: ColorNodeEditorProps) {
  const nodes = clip.colorNodes || [
    { id: 'input', type: 'input', params: {}, position: { x: 50, y: 150 } },
    { id: 'output', type: 'output', params: {}, position: { x: 550, y: 150 } },
  ];
  const connections = clip.colorConnections || [];

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newNodes = nodes.map(n => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            position: {
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y
            }
          };
        }
        return n;
      });
      onUpdateNodes(newNodes);
    } else if (isPanning) {
      setViewOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
    setConnectingSourceId(null);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - viewOffset.x,
        y: e.clientY - viewOffset.y
      });
    } else {
      setSelectedNodeId(null);
    }
  };

  const addNode = (type: string) => {
    const newNode: ColorNode = {
      id: Math.random().toString(36).substr(2, 9),
      type: type as any,
      params: getDefaultParams(type),
      position: { x: 300 - viewOffset.x, y: 200 - viewOffset.y }
    };
    onUpdateNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const getDefaultParams = (type: string) => {
    switch (type) {
      case 'exposure': return { exposure: 0, contrast: 1 };
      case 'white-balance': return { temp: 5600, tint: 0 };
      case 'smh': return { shadows: [0, 0, 0], midtones: [0, 0, 0], highlights: [0, 0, 0] };
      default: return {};
    }
  };

  const deleteNode = (id: string) => {
    if (id === 'input' || id === 'output') return;
    onUpdateNodes(nodes.filter(n => n.id !== id));
    onUpdateConnections(connections.filter(c => c.sourceId !== id && c.targetId !== id));
    setSelectedNodeId(null);
  };

  const handleConnect = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    // Prevent duplicate connections
    if (connections.find(c => c.sourceId === sourceId && c.targetId === targetId)) return;
    
    const newConnection: ColorConnection = {
      id: `${sourceId}-${targetId}`,
      sourceId,
      targetId
    };
    onUpdateConnections([...connections, newConnection]);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full bg-[#070608]">
      {/* Toolbar */}
      <div className="h-10 bg-[#141116] border-b border-[#2A2430] flex items-center px-3 gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#7A6E80] mr-2">Nodes</span>
        {NODE_TYPES.map(nt => (
          <button
            key={nt.type}
            onClick={() => addNode(nt.type)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1A161C] border border-[#2A2430] hover:border-[#F5A623] transition-all group"
          >
            <nt.icon size={10} style={{ color: nt.color }} />
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#7A6E80] group-hover:text-[#F0E8D8]">{nt.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => {
            onUpdateNodes([
              { id: 'input', type: 'input', params: {}, position: { x: 50, y: 150 } },
              { id: 'output', type: 'output', params: {}, position: { x: 550, y: 150 } },
            ]);
            onUpdateConnections([]);
          }}
          className="text-[8px] font-bold uppercase tracking-widest text-red-400/50 hover:text-red-400 transition-colors"
        >
          Reset Graph
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Node Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 relative cursor-crosshair overflow-hidden bg-[radial-gradient(#1A161C_1px,transparent_1px)] [background-size:20px_20px]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={handleContainerMouseDown}
        >
          <div 
            style={{ 
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* Connections */}
            <svg className="absolute inset-0 pointer-events-none w-[5000px] h-[5000px]">
              {connections.map(conn => {
                const source = nodes.find(n => n.id === conn.sourceId);
                const target = nodes.find(n => n.id === conn.targetId);
                if (!source || !target) return null;

                const x1 = source.position.x + 120;
                const y1 = source.position.y + 30;
                const x2 = target.position.x;
                const y2 = target.position.y + 30;
                const cp1x = x1 + (x2 - x1) / 2;
                const cp2x = x1 + (x2 - x1) / 2;

                return (
                  <path
                    key={conn.id}
                    d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                    stroke="#F5A623"
                    strokeWidth="2"
                    fill="none"
                    className="opacity-50"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const nt = NODE_TYPES.find(t => t.type === node.type) || { color: '#7A6E80', icon: Circle, label: node.type };
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  className={cn(
                    "absolute w-32 bg-[#141116] border rounded-lg shadow-2xl transition-shadow cursor-grab active:cursor-grabbing",
                    isSelected ? "border-[#F5A623] shadow-[#F5A623]/10" : "border-[#2A2430]"
                  )}
                  style={{ left: node.position.x, top: node.position.y }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                >
                  <div className="h-1 bg-current opacity-50 rounded-t-lg" style={{ color: nt.color }} />
                  <div className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <nt.icon size={12} style={{ color: nt.color }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#F0E8D8] truncate w-16">
                        {nt.label}
                      </span>
                    </div>
                    {node.id !== 'input' && node.id !== 'output' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                        className="text-[#7A6E80] hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  
                  {/* Ports */}
                  <div className="flex justify-between px-1 pb-1">
                    <div 
                      className="w-3 h-3 rounded-full bg-[#2A2430] border border-[#070608] -ml-2.5 flex items-center justify-center hover:bg-[#F5A623] transition-colors cursor-pointer"
                      onMouseUp={() => connectingSourceId && handleConnect(connectingSourceId, node.id)}
                    >
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full bg-[#2A2430] border border-[#070608] -mr-2.5 flex items-center justify-center hover:bg-[#F5A623] transition-colors cursor-pointer"
                      onMouseDown={(e) => { e.stopPropagation(); setConnectingSourceId(node.id); }}
                    >
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector */}
        {selectedNode && (
          <div className="w-64 bg-[#0E0B0F] border-l border-[#2A2430] flex flex-col">
            <div className="p-3 border-b border-[#2A2430] flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F0E8D8]">Node Settings</span>
              <button onClick={() => setSelectedNodeId(null)} className="text-[#7A6E80] hover:text-[#F0E8D8]">
                <X size={12} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (NODE_TYPES.find(t => t.type === selectedNode.type)?.color || '#7A6E80') }} />
                <span className="text-[11px] font-bold text-[#F5A623] uppercase">{selectedNode.type}</span>
              </div>
              
              {/* Dynamic Params */}
              {Object.entries(selectedNode.params).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-tighter">{key}</label>
                  <input 
                    type="range"
                    min={key === 'exposure' ? -5 : 0}
                    max={key === 'exposure' ? 5 : 2}
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const newNodes = nodes.map(n => {
                        if (n.id === selectedNode.id) {
                          return { ...n, params: { ...n.params, [key]: parseFloat(e.target.value) } };
                        }
                        return n;
                      });
                      onUpdateNodes(newNodes);
                    }}
                    className="w-full accent-[#F5A623] h-1 bg-[#2A2430] rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-[#7A6E80]">
                    <span>{key === 'exposure' ? -5 : 0}</span>
                    <span className="text-[#F5A623]">{value.toFixed(2)}</span>
                    <span>{key === 'exposure' ? 5 : 2}</span>
                  </div>
                </div>
              ))}

              {selectedNode.type === 'color-wheel' && (
                <div className="space-y-4">
                  <ColorWheel label="Lift" color="#4A90E2" />
                  <ColorWheel label="Gamma" color="#7ED321" />
                  <ColorWheel label="Gain" color="#D0021B" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorWheel({ label, color }: { label: string, color: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-tighter">{label}</label>
      <div className="aspect-square rounded-full border-2 border-[#2A2430] relative bg-gradient-to-tr from-blue-900/20 via-green-900/20 to-red-900/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white shadow-xl shadow-white/50" />
        </div>
      </div>
      <input type="range" className="w-full accent-[#F5A623] h-1 bg-[#2A2430] rounded-full appearance-none cursor-pointer" />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
