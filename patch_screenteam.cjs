const fs = require('fs');

const path = 'src/components/ScreenTeam.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add NetworkTreeModal import
if (!code.includes("import { NetworkTreeModal }")) {
  code = code.replace(
    "import { ReferralLevel, RankReward } from '../types/crypto';",
    "import { ReferralLevel, RankReward } from '../types/crypto';\nimport { NetworkTreeModal } from './NetworkTreeModal';"
  );
}

// Add state
if (!code.includes("const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);")) {
  code = code.replace(
    "export const ScreenTeam: React.FC<ScreenTeamProps> = ({",
    "export const ScreenTeam: React.FC<ScreenTeamProps> = ({\n"
  );
  
  const setupIndex = code.indexOf("const totalTierPercent = levels.reduce");
  code = code.slice(0, setupIndex) + 
    "const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);\n  " + 
    code.slice(setupIndex);
}

// Add button to open the Tree modal
if (!code.includes("View Network Tree")) {
  const insertTarget = `<button\n              onClick={onOpenTeamModal}\n              className="flex-1 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-200 text-[10px] font-bold font-mono-crypto transition-colors"`;
  
  const newButton = `<button
              onClick={() => setIsTreeModalOpen(true)}
              className="flex-1 py-1.5 rounded-xl bg-fuchsia-900/40 hover:bg-fuchsia-800 border border-fuchsia-500/30 text-fuchsia-200 text-[10px] font-bold font-mono-crypto transition-colors flex items-center justify-center gap-1"
            >
              <Users className="w-3 h-3" /> View Network Tree
            </button>\n            `;
  code = code.replace(insertTarget, newButton + insertTarget);
}

// Add modal render at the end
if (!code.includes("<NetworkTreeModal")) {
  const returnIndex = code.lastIndexOf("</div>\n  );");
  code = code.slice(0, returnIndex) + 
    "  <NetworkTreeModal isOpen={isTreeModalOpen} onClose={() => setIsTreeModalOpen(false)} />\n    " + 
    code.slice(returnIndex);
}

fs.writeFileSync(path, code);
