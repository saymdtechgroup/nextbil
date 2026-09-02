const fs = require('fs');
const path = 'src/components/ScreenMine.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add Copy icon and hooks to imports
if (!code.includes("import { User, ShieldCheck, Key, FileText, Globe, Bell, HelpCircle, ExternalLink, ArrowRightLeft, RefreshCw, Trash2, Copy, Check, Users, Target, Link2 } from 'lucide-react';")) {
  code = code.replace(
    "import { User, ShieldCheck, Key, FileText, Globe, Bell, HelpCircle, ExternalLink, ArrowRightLeft, RefreshCw, Trash2 } from 'lucide-react';",
    "import { User, ShieldCheck, Key, FileText, Globe, Bell, HelpCircle, ExternalLink, ArrowRightLeft, RefreshCw, Trash2, Copy, Check, Users, Target, Link2 } from 'lucide-react';\nimport { useState } from 'react';"
  );
}

if (!code.includes("const [copied, setCopied] = useState(false);")) {
  code = code.replace(
    "const isMlmQualified = totalInvestedUsd >= minMlmQualifyUsd;",
    "const isMlmQualified = totalInvestedUsd >= minMlmQualifyUsd;\n  const [copied, setCopied] = useState(false);\n  const handleCopy = () => {\n    setCopied(true);\n    setTimeout(() => setCopied(false), 2000);\n  };"
  );
}

// Add the Referral Block and Stats under Profile Card
const refBlock = `
      {/* Referral & Networking Hub */}
      <div className="rounded-xl bg-[#110722] border border-fuchsia-500/20 overflow-hidden mt-3">
        <div className="p-2.5 border-b border-fuchsia-500/10 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-fuchsia-400" />
            <h3 className="text-[10px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider">Your Referral Link</h3>
          </div>
          <span className="text-[8px] text-purple-300 font-mono-crypto bg-purple-900/40 px-1.5 py-0.2 rounded border border-purple-500/30">Earn 5% Direct</span>
        </div>
        <div className="p-2 flex gap-2 items-center bg-[#090317]">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-mono-crypto text-purple-300 truncate">https://nxbc.network/ref/{walletAddress ? walletAddress.substring(2, 8) : 'demo123'}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-200 text-[10px] font-bold transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Quick Network Stats */}
      <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
        <div className="p-2.5 rounded-xl bg-[#110722] border border-amber-500/20 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Directs</span>
          </div>
          <p className="text-lg font-black font-mono-crypto text-amber-300">24</p>
        </div>
        <div className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Total Team</span>
          </div>
          <p className="text-lg font-black font-mono-crypto text-fuchsia-300">148</p>
        </div>
      </div>
`;

if (!code.includes("Referral & Networking Hub")) {
  const insertIndex = code.indexOf("{/* Menu Options */}");
  code = code.slice(0, insertIndex) + refBlock + "\n      " + code.slice(insertIndex);
}

fs.writeFileSync(path, code);
