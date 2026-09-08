const fs = require('fs');
let admin = fs.readFileSync('src/components/SecretAdminPage.tsx', 'utf8');

const targetQueueTab = `<div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? sellQueue.map((entry, idx) => (`;

const updatedQueueTab = `<div className="flex gap-4 mb-6">
                <button 
                  onClick={() => onSimulateExternalBuy && onSimulateExternalBuy(10000)}
                  className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-bold hover:bg-emerald-500/40 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Simulate Global Buy (10,000 Tokens)
                </button>
              </div>
              <div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? sellQueue.map((entry, idx) => (`;

if (admin.includes(targetQueueTab)) {
  admin = admin.replace(targetQueueTab, updatedQueueTab);
  fs.writeFileSync('src/components/SecretAdminPage.tsx', admin);
  console.log('Button added.');
} else {
  console.log('Target not found.');
}
