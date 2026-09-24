import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles, Wallet, X, Zap } from 'lucide-react';
import { executeSmartContractBuy } from '../utils/web3Helper';

type AllocationInput = {
  p1Percent?: number;
  p2Percent?: number;
  p3Percent?: number;
  p4Percent?: number;
  p5Percent?: number;
  dexPercent?: number;
  unallocatedPercent?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPurchase: (
    tokenAmount: number,
    usdAmount: number,
    sellAlloc: {
      p1Percent: number;
      p2Percent: number;
      p3Percent: number;
      p4Percent: number;
      p5Percent: number;
      dexPercent: number;
      unallocatedPercent: number;
    },
    txHash?: string,
    currency?: 'USDT'
  ) => Promise<void>;
  currentRate: number;
  walletConnected: boolean;
  walletAddress?: string;
  contractAddress?: string;
  receivingAddress?: string;
  minPurchaseUsd?: number;
  nxbcBalance?: number;
  usdtBalance?: number;
  activePhaseInfo?: {
    phaseNumber: number;
    name: string;
    shortName: string;
    totalSupply: number;
    tokensSold: number;
  };
  initialAllocation?: AllocationInput;
  directBuyerInviteToken?: string;
  directBuyerInfo?: { phaseNumber?: number; remainingTokens?: number; tokenPrice?: number; sellerWalletMasked?: string; expiresAt?: string } | null;
};

const num = (v: any, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const fmt = (v: number) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });

const DEFAULT_ALLOCATION = { p2: 20, p3: 30, p4: 20, p5: 15, dex: 15 };

export const BuyTokenModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmPurchase,
  currentRate,
  walletConnected,
  walletAddress,
  minPurchaseUsd = 0,
  usdtBalance = 0,
  activePhaseInfo,
  initialAllocation,
  directBuyerInviteToken,
  directBuyerInfo,
}) => {
  const [usd, setUsd] = useState('');
  const [a, setA] = useState(DEFAULT_ALLOCATION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setUsd('');
    setError('');
    setBusy(false);

    const incoming = {
      p2: clamp(num(initialAllocation?.p2Percent, 0)),
      p3: clamp(num(initialAllocation?.p3Percent, 0)),
      p4: clamp(num(initialAllocation?.p4Percent, 0)),
      p5: clamp(num(initialAllocation?.p5Percent, 0)),
      dex: clamp(num(initialAllocation?.dexPercent, 0)),
    };
    
    const totalIncoming = incoming.p2 + incoming.p3 + incoming.p4 + incoming.p5 + incoming.dex;
    if (totalIncoming <= 0.000001) {
      incoming.dex = 100;
    } else {
      const futureTotal = incoming.p2 + incoming.p3 + incoming.p4 + incoming.p5;
      incoming.dex = clamp(100 - futureTotal);
    }
    setA(incoming);
  }, [isOpen, initialAllocation]);

  const purchaseUsd = Math.max(0, num(usd));
  const tokens = currentRate > 0 ? purchaseUsd / currentRate : 0;

  const parts = useMemo(() => {
    const p2 = tokens * a.p2 / 100;
    const p3 = tokens * a.p3 / 100;
    const p4 = tokens * a.p4 / 100;
    const p5 = tokens * a.p5 / 100;
    const dex = tokens * a.dex / 100;
    const total = a.p2 + a.p3 + a.p4 + a.p5 + a.dex;
    return { p2, p3, p4, p5, dex, total };
  }, [tokens, a]);

  const totalTokens = parts.p2 + parts.p3 + parts.p4 + parts.p5 + parts.dex;
  const exact100 = Math.abs(parts.total - 100) <= 0.000001;
  const minOk = purchaseUsd >= Math.max(0, minPurchaseUsd);
  const balanceOk = purchaseUsd <= Number(usdtBalance) + 1e-9;
  const can = walletConnected && !!walletAddress && purchaseUsd > 0 && tokens > 0 &&
    exact100 && minOk && balanceOk && !busy;

  const set = (key: keyof typeof a, value: string | number) => {
    setA(prev => ({ ...prev, [key]: clamp(num(value)) }));
    setError('');
  };

  const preset = (next: typeof DEFAULT_ALLOCATION) => {
    setA(next);
    setError('');
  };

  const confirm = async () => {
    setError('');
    if (!walletConnected || !walletAddress) { setError('Please connect your Web3 wallet first.'); return; }
    if (purchaseUsd <= 0) { setError('Enter a valid USDT purchase amount.'); return; }
    if (!minOk) { setError(`Minimum purchase is $${Number(minPurchaseUsd).toFixed(2)} USDT.`); return; }
    if (!balanceOk) { setError('Insufficient USDT balance in the connected wallet.'); return; }
    if (!exact100) { setError(`Please allocate exactly 100%. Current allocation is ${parts.total.toFixed(2)}%.`); return; }

    try {
      setBusy(true);
      const buyResult = await executeSmartContractBuy(
        purchaseUsd, null, parts.p2, parts.p3, parts.p4, parts.p5, parts.dex, (msg) => setError(msg)
      );

      if (!buyResult.success || !buyResult.txHash) {
        throw new Error(buyResult.error || 'NXBC purchase transaction failed.');
      }

      await onConfirmPurchase(
        Number(buyResult.tokenAmount || tokens),
        Number(buyResult.usdtAmount || purchaseUsd),
        {
          p1Percent: 0,
          p2Percent: a.p2,
          p3Percent: a.p3,
          p4Percent: a.p4,
          p5Percent: a.p5,
          dexPercent: a.dex,
          unallocatedPercent: 0,
        },
        buyResult.txHash,
        'USDT',
        directBuyerInviteToken
      );
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Purchase could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const cards = [
    ['p2', 'Phase 2 Sell', 0.10, parts.p2],
    ['p3', 'Phase 3 Sell', 1.00, parts.p3],
    ['p4', 'Phase 4 Sell', 10.00, parts.p4],
    ['p5', 'Phase 5 Sell', 100.00, parts.p5],
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#070b16] text-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#070b16]/95 backdrop-blur-md px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-[14px]">
              <Sparkles className="h-5 w-5 text-amber-300" />
              BUY NXBC
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10"><X size={20} /></button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">USDT Purchase Amount</label>
            <div className="mt-2 flex items-center rounded-xl border border-purple-500/30 bg-[#0d1020] px-3">
              <Wallet size={17} className="mr-2 text-cyan-300" />
              <input
                type="text"
                defaultValue={usd}
                onBlur={e => setUsd(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent py-3 outline-none font-black text-white"
              />
              <span className="text-cyan-300 font-bold">USDT</span>
            </div>
          </div>

          {/* Allocation Inputs - Uncontrolled (onBlur) */}
          {cards.map(([key, title, rate, tok]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-[#080d18] p-3">
              <div className="flex justify-between items-center">
                <div className="text-[11px] font-black">{title}</div>
                <input
                  type="number" defaultValue={a[key]}
                  onBlur={e => set(key, e.target.value)}
                  className="w-20 rounded-lg bg-[#101527] px-2 py-2 text-right font-black outline-none border border-white/10"
                />
              </div>
            </div>
          ))}

          <button
            onClick={confirm}
            disabled={!can}
            className={`w-full rounded-2xl py-4 font-black ${can ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-300 text-black' : 'bg-slate-700 text-slate-400'}`}
          >
            {busy ? 'PROCESSING...' : 'CONFIRM & PAY'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTokenModal;