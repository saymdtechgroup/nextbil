import React, { useState } from 'react';
import { X, Network, User, ChevronDown, ChevronRight, UserPlus, Users, Search, Target } from 'lucide-react';

interface NetworkTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Dummy Tree Data Type
type TreeNode = {
  id: string;
  name: string;
  wallet: string;
  rank: string;
  totalTeam: number;
  investment: number;
  isExpanded?: boolean;
  children?: TreeNode[];
};

// Dummy Data Generator
const myTree: TreeNode = {
  id: 'me',
  name: 'You (Satoshi)',
  wallet: '0x71C...a89F',
  rank: 'Gold Director',
  totalTeam: 148,
  investment: 500,
  isExpanded: true,
  children: [
    {
      id: 'd1',
      name: 'Alex D.',
      wallet: '0x8A1...f32E',
      rank: 'Silver Leader',
      totalTeam: 42,
      investment: 250,
      isExpanded: true,
      children: [
        { id: 'd1_1', name: 'Bob M.', wallet: '0x9B2...d41C', rank: 'Member', totalTeam: 0, investment: 100 },
        { id: 'd1_2', name: 'Charlie', wallet: '0xC33...e52D', rank: 'Member', totalTeam: 12, investment: 50 },
      ]
    },
    {
      id: 'd2',
      name: 'Diana P.',
      wallet: '0x4D4...b11A',
      rank: 'Bronze',
      totalTeam: 18,
      investment: 120,
      isExpanded: false,
      children: [
        { id: 'd2_1', name: 'Eve S.', wallet: '0xE55...a22B', rank: 'Member', totalTeam: 5, investment: 50 },
      ]
    },
    {
      id: 'd3',
      name: 'Frank L.',
      wallet: '0xF66...c33D',
      rank: 'Member',
      totalTeam: 0,
      investment: 50,
    }
  ]
};

export const NetworkTreeModal: React.FC<NetworkTreeModalProps> = ({ isOpen, onClose }) => {
  const [treeData, setTreeData] = useState<TreeNode>(myTree);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const toggleNode = (node: TreeNode, targetId: string): TreeNode => {
    if (node.id === targetId) {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children) {
      return { ...node, children: node.children.map(c => toggleNode(c, targetId)) };
    }
    return node;
  };

  const handleToggle = (id: string) => {
    setTreeData(toggleNode(treeData, id));
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    
    // Simple search filter highlight
    const isMatch = searchQuery && (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || node.wallet.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div key={node.id} className="relative">
        <div className="flex items-center gap-2 mb-2 relative z-10">
          {/* Connecting Lines (Desktop/Visual Tree style) */}
          {level > 0 && (
            <div className="absolute -left-5 top-1/2 w-4 border-t-2 border-purple-500/30 -translate-y-1/2" />
          )}
          
          <div 
            onClick={() => hasChildren && handleToggle(node.id)}
            className={`flex-1 p-3 rounded-xl border flex items-center justify-between transition-all ${
              hasChildren ? 'cursor-pointer hover:border-amber-400/50' : ''
            } ${
              isMatch ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-[#110722] border-purple-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                level === 0 ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 
                node.rank !== 'Member' ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-300' : 'bg-purple-900/50 border-purple-500/30 text-purple-300'
              }`}>
                {level === 0 ? <Target className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-100">{node.name}</h4>
                  <span className={`text-[9px] font-mono-crypto px-1.5 py-0.2 rounded border ${
                    node.rank === 'Gold Director' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    node.rank === 'Silver Leader' ? 'bg-slate-300/20 text-slate-300 border-slate-300/40' :
                    'bg-purple-900/50 text-purple-300 border-purple-500/30'
                  }`}>
                    {node.rank}
                  </span>
                </div>
                <div className="text-[9px] text-purple-300/60 font-mono-crypto flex items-center gap-2 mt-0.5">
                  <span>{node.wallet}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">${node.investment} Inv.</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-purple-300/60 block">Team Size</span>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-end">
                  <Users className="w-3 h-3 text-amber-400" />
                  {node.totalTeam}
                </span>
              </div>
              {hasChildren && (
                <div className="w-6 h-6 rounded-lg bg-purple-900/40 flex items-center justify-center text-purple-300">
                  {node.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children Render with indented lines */}
        {hasChildren && node.isExpanded && (
          <div className="relative ml-5 pl-5 border-l-2 border-purple-500/30 pt-1 pb-1">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06010f]/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#090317] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
                Network Tree Explorer
              </h2>
              <p className="text-[10px] text-purple-300/70 font-mono-crypto">
                Interactive Multi-Level View
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-purple-900/50 text-purple-300 hover:text-white hover:bg-purple-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tools (Search) */}
        <div className="px-4 py-3 border-b border-purple-500/10 bg-[#0e0720]">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by Wallet or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090317] border border-purple-500/30 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono-crypto"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* Scrollable Tree Area */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {renderNode(treeData)}
        </div>
      </div>
    </div>
  );
};
