import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles, Wallet, X, Zap } from 'lucide-react';
import { executeSmartContractBuy } from '../utils/web3Helper';

// ... (Keep existing Type definitions here - p1Percent to directBuyerInfo)
type AllocationInput = { p1Percent?: number; p2Percent?: number; p3Percent?: number; p4Percent?: number; p5Percent?: number; dexPercent?: number; unallocatedPercent?: number; };
type Props = { /* ... (Same props as your original file) ... */ };

const num = (v: any, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const fmt = (v: number) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });

const DEFAULT_ALLOCATION = { p2: 20, p3: 30, p4: 20, p5: 15, dex: 15 };

export const BuyTokenModal: React.FC<Props> = ({ isOpen, onClose, onConfirmPurchase, currentRate, walletConnected, walletAddress, minPurchaseUsd = 0, usdtBalance = 0, activePhaseInfo, initialAllocation, directBuyerInviteToken, directBuyerInfo }) => {
  const [usd, setUsd] = useState('');
  const [a, setA] = useState(DEFAULT_ALLOCATION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ... (Keep your original useEffect)
  useEffect(() => {
    if (!isOpen) return;
    setUsd(''); setError(''); setBusy(false);
    const incoming = { p2: clamp(num(initialAllocation?.p2Percent, 0)), p3: clamp(num(initialAllocation?.p3Percent, 0)), p4: clamp(num(initialAllocation?.p4Percent, 0)), p5: clamp(num(initialAllocation?.p5Percent, 0)), dex: clamp(num(initialAllocation?.dexPercent, 0)) };
    setA(incoming);
  }, [isOpen, initialAllocation]);

  const purchaseUsd = Math.max(0, num(usd));
  const tokens = currentRate > 0 ? purchaseUsd / currentRate : 0;

  // New Logic: Allocation Validation
  const totalAllocPercent = a.p2 + a.p3 + a.p4 + a.p5 + a.dex;
  const isPercentValid = Math.abs(totalAllocPercent - 100) < 0.01;

  // ... (Keep your original parts, totalTokens calculation)
  const parts = useMemo(() => {
    const p2 = tokens * a.p2 / 100;
    const p3 = tokens * a.p3 / 100;
    const p4 = tokens * a.p4 / 100;
    const p5 = tokens * a.p5 / 100;
    const dex = tokens * a.dex / 100;
    return { p2, p3, p4, p5, dex };
  }, [tokens, a]);

  const set = (key: keyof typeof a, value: string | number) => {
    setA(prev => ({ ...prev, [key]: clamp(num(value)) }));
    setError('');
  };

  const confirm = async () => {
    setError('');
    // NEW VALIDATION
    if (!isPercentValid) { setError(`Allocation must be 100%. Current: ${totalAllocPercent.toFixed(2)}%`); return; }
    
    // ... (Keep your original error checks for wallet, minPurchase, balance)
    
    try {
      setBusy(true);
      const buyResult = await executeSmartContractBuy(purchaseUsd, null, parts.p2, parts.p3, parts.p4, parts.p5, parts.dex, (msg) => setError(msg));
      if (!buyResult.success || !buyResult.txHash) throw new Error(buyResult.error || 'NXBC purchase transaction failed.');

      await onConfirmPurchase(
        Number(buyResult.tokenAmount || tokens), Number(buyResult.usdtAmount || purchaseUsd),
        { p2Percent: a.p2, p3Percent: a.p3, p4Percent: a.p4, p5Percent: a.p5, dexPercent: a.dex },
        buyResult.txHash, 'USDT', directBuyerInviteToken
      );
      onClose();
    } catch (e: any) { setError(e?.message || 'Purchase could not be completed.'); } finally { setBusy(false); }
  };

  if (!isOpen) return null;

  // ... (Keep your original UI structure with 'cards' array)
  // FIX: In your input fields, ensure they use `value={a[key]}` and NOT `defaultValue` to remain controlled.
  // ALSO: Remove the `disabled` attribute from your input fields to allow editing.

  return (
    // ... (Paste your original full JSX structure here)
    // IMPORTANT: Make sure the input for USDT amount uses controlled `value={usd}` and `onChange` correctly:
    // onChange={e => setUsd(e.target.value)} 
    // And for allocation inputs, use `onChange={e => set(key, e.target.value)}` and remove `disabled`.
  );
};