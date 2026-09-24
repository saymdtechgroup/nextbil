import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles, Wallet, X, Zap } from 'lucide-react';
import { executeSmartContractBuy } from '../utils/web3Helper';

// ... (Keep existing Types)

export const BuyTokenModal: React.FC<Props> = ({ /* ... props ... */ }) => {
  const [usd, setUsd] = useState('');
  const [a, setA] = useState(DEFAULT_ALLOCATION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ... (Keep existing useEffect and helper functions)

  const purchaseUsd = Math.max(0, num(usd));
  const tokens = currentRate > 0 ? purchaseUsd / currentRate : 0;

  // Calculate tokens per allocation bucket
  const parts = useMemo(() => {
    const totalAllocPercent = a.p2 + a.p3 + a.p4 + a.p5 + a.dex;
    // Calculate based on the percentage of total tokens bought
    const p2 = tokens * (a.p2 / totalAllocPercent);
    const p3 = tokens * (a.p3 / totalAllocPercent);
    const p4 = tokens * (a.p4 / totalAllocPercent);
    const p5 = tokens * (a.p5 / totalAllocPercent);
    const dex = tokens * (a.dex / totalAllocPercent);
    return { p2, p3, p4, p5, dex };
  }, [tokens, a]);

  const allocatedTokens = parts.p2 + parts.p3 + parts.p4 + parts.p5 + parts.dex;
  
  // VALIDATION: Button only enabled if tokens match (approx)
  const isAllocationValid = Math.abs(allocatedTokens - tokens) < 0.01;
  const can = walletConnected && !!walletAddress && purchaseUsd > 0 && tokens > 0 && isAllocationValid && !busy;

  // ... (Keep confirm function, modify error check)
  const confirm = async () => {
    if (!isAllocationValid) { setError('Allocation must match total purchased NXBC.'); return; }
    // ... rest of confirm logic
  };

  // ... (In JSX)
  // 1. Update Receive text:
  // <span>Receive: {fmt(tokens)} NXBC</span>
  
  // 2. Update Allocation Check:
  /*
  <div className={`p-3 border rounded-2xl ${isAllocationValid ? 'border-emerald-500/30' : 'border-rose-500/40'}`}>
     <div>Allocated: <b>{fmt(allocatedTokens)} / {fmt(tokens)} NXBC</b></div>
  </div>
  */