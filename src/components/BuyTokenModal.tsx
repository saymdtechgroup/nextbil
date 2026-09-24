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
  const currentPhaseNumber = Number(activePhaseInfo?.phaseNumber || 1);
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
    
    // Reset logic to allow editing
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
        purchaseUsd,
        null,
        parts.p2,
        parts.p3,
        parts.p4,
        parts.p5,
        parts.dex,
        (msg) => setError(msg)
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
            <div>
              <div className="flex items-center gap-2 font-black text-[14px]">
                <Sparkles className="h-5 w-5 text-amber-300" />
                BUY NXBC
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                Allocate 100% to future sell phases and/or DEX / LIVE.
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {directBuyerInfo && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="text-[10px] font-black text-amber-300">DIRECT BUYER MATCH</div>
              <div className="text-[9px] text-slate-300 mt-1">Phase {directBuyerInfo.phaseNumber} · Available {fmt(directBuyerInfo.remainingTokens)} NXBC · Seller {directBuyerInfo.sellerWalletMasked}</div>
            </div>
          )}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] text-cyan-300 uppercase font-bold">Current Presale</div>
                <div className="text-sm font-black mt-1">
                  {activePhaseInfo?.name || `Phase ${activePhaseInfo?.phaseNumber || 1}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase">Current Price</div>
                <div className="text-lg font-black text-amber-300">${currentRate.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">USDT Purchase Amount</label>
            <div className="mt-2 flex items-center rounded-xl border border-purple-500/30 bg-[#0d1020] px-3">
              <Wallet size={17} className="mr-2 text-cyan-300" />
              <input
                value={usd}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setUsd('');
                  } else if (/^\d*\.?\d*$/.test(val)) {
                    setUsd(val);
                  }
                }}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent py-3 outline-none font-black text-white"
              />
              <span className="text-cyan-300 font-bold">USDT</span>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500">
              <span>Wallet: {fmt(usdtBalance)} USDT</span>
              <span>Receive: {fmt(tokens)} NXBC</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a0e18] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-[11px] text-cyan-300">
                <Zap size={16} /> Quick 1-Click Split
              </div>
              <span className="text-[9px] text-slate-500">Every preset = 100%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => preset({p2:20,p3:30,p4:20,p5:15,dex:15})} className="rounded-xl bg-cyan-500/10 px-2 py-2 text-[9px] font-bold text-cyan-200">20/30/20/15/15</button>
              <button onClick={() => preset({p2:50,p3:25,p4:10,p5:5,dex:10})} className="rounded-xl bg-cyan-500/10 px-2 py-2 text-[9px] font-bold text-cyan-200">50/25/10/5/10</button>
              <button onClick={() => preset({p2:0,p3:0,p4:0,p5:0,dex:100})} className="rounded-xl bg-purple-500/10 px-2 py-2 text-[9px] font-bold text-purple-200">100% DEX</button>
              <button onClick={() => preset({p2:0,p3:0,p4:0,p5:100,dex:0})} className="rounded-xl bg-emerald-500/10 px-2 py-2 text-[9px] font-bold text-emerald-200">100% P5</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cards.map(([key, title, rate, tok]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-[#080d18] p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black">{title}</div>
                    <div className="text-[9px] text-slate-500">${rate.toFixed(2)} · {fmt(tok)} NXBC</div>
                  </div>
                  <div className="text-right">
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={a[key]}
                      onChange={e => set(key, e.target.value)}
                      className="w-20 rounded-lg bg-[#101527] px-2 py-2 text-right font-black outline-none border border-white/10"
                    />
                    <span className="ml-1 text-[10px] text-slate-500">%</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3">
              <div className="flex justify-between gap-3 items-center">
                <div>
                  <div className="text-[11px] font-black text-white">DEX / LIVE</div>
                  <div className="text-[9px] text-slate-400">No FIFO order · held in wallet for DEX / LIVE</div>
                </div>
                <div className="text-right">
                  <input
                    type="number" min="0" max="100" step="0.01"
                    value={a.dex}
                    onChange={e => set('dex', e.target.value)}
                    className="w-20 rounded-lg bg-[#101527] px-2 py-2 text-right font-black outline-none border border-purple-500/30"
                  />
                  <span className="ml-1 text-[10px] text-slate-400">%</span>
                  <div className="text-[10px] text-purple-300 font-bold mt-1">{fmt(parts.dex)} NXBC</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${exact100 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
            <div className="flex justify-between">
              <b className="text-[11px]">ALLOCATION CHECK</b>
              <b className={exact100 ? 'text-emerald-300' : 'text-rose-300'}>{parts.total.toFixed(2)}%</b>
            </div>
            <div className="mt-2 space-y-1 text-[10px]">
              <div>Purchase: <b>{fmt(tokens)} NXBC</b></div>
              <div>Allocated: <b>{fmt(totalTokens)} NXBC</b></div>
              <div>DEX / LIVE: <b className="text-purple-300">{fmt(parts.dex)} NXBC</b></div>
              {exact100 && <div className="text-emerald-300 flex items-center gap-1"><CheckCircle2 size={13}/> Allocation complete</div>}
            </div>
          </div>

          {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[10px] text-rose-300">{error}</div>}

          <button
            onClick={confirm}
            disabled={!can}
            className={`w-full rounded-2xl py-4 font-black flex justify-center items-center gap-2 ${can ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-300 text-black' : 'bg-slate-700 text-slate-400'}`}
          >
            {busy ? 'PROCESSING...' : <><Lock size={17}/>{walletConnected ? `CONFIRM & PAY $${purchaseUsd.toFixed(2)}` : 'CONNECT WALLET'}<ArrowRight size={18}/></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTokenModal;