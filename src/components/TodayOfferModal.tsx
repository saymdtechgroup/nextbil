import React, { useState, useEffect } from 'react';
import { Flame, Clock, X, Sparkles, Gift, ArrowRight, CheckCircle2, Trophy, ShieldAlert } from 'lucide-react';

interface SpecialOfferData {
  id?: string;
  active: boolean;
  title: string;
  subtitle: string;
  targetDirectVolume: number;
  rewardUsdt: number;
  badgeText?: string;
  expiresAt?: string;
}

interface TodayOfferModalProps {
  walletAddress?: string;
  onAccept?: () => void;
}

export const TodayOfferModal: React.FC<TodayOfferModalProps> = ({ walletAddress, onAccept }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [offer, setOffer] = useState<SpecialOfferData | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isAccepted, setIsAccepted] = useState(false);

  // Fetch live special offer data from server
  useEffect(() => {
    let isMounted = true;

    const fetchOffer = async () => {
      try {
        const res = await fetch('/api/public/special-offer', { cache: 'no-store' });
        const data = await res.json();
        if (!isMounted) return;

        if (data && data.success && data.offer && data.offer.active) {
          const offerData: SpecialOfferData = data.offer;
          
          // Check if user already dismissed or accepted this specific offer in this dashboard session
          const sessionDismissed = sessionStorage.getItem(`nxbc_offer_dashboard_dismissed_${offerData.id || 'current'}`);
          if (sessionDismissed === 'true') {
            return;
          }

          setOffer(offerData);
          // Show with a smooth short delay so dashboard home page is fully visible first
          setTimeout(() => {
            if (isMounted) {
              setIsOpen(true);
            }
          }, 600);
        }
      } catch (err) {
        console.error('Failed to load today offer popup:', err);
      }
    };

    fetchOffer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown Timer Logic
  useEffect(() => {
    if (!offer || !isOpen) return;

    const calculateTimeLeft = () => {
      let targetTime: number;

      if (offer.expiresAt) {
        targetTime = new Date(offer.expiresAt).getTime();
        // If expired timestamp in past, fallback to end of today
        if (isNaN(targetTime) || targetTime <= Date.now()) {
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);
          targetTime = endOfDay.getTime();
        }
      } else {
        // Default: countdown to midnight of current day
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        targetTime = endOfDay.getTime();
      }

      const diff = Math.max(0, targetTime - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [offer, isOpen]);

  const handleClose = () => {
    if (offer) {
      sessionStorage.setItem(`nxbc_offer_dashboard_dismissed_${offer.id || 'current'}`, 'true');
    }
    setIsOpen(false);
  };

  const handleAcceptOffer = () => {
    setIsAccepted(true);
    if (offer) {
      sessionStorage.setItem(`nxbc_offer_dashboard_dismissed_${offer.id || 'current'}`, 'true');
      localStorage.setItem(`nxbc_offer_accepted_${offer.id || 'current'}`, 'true');
    }
    setTimeout(() => {
      setIsOpen(false);
      if (onAccept) onAccept();
    }, 900);
  };

  if (!isOpen || !offer || !offer.active) {
    return null;
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    /* Strict Modal Overlay: blocks all clicks and interactions on the page until accepted or closed */
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      style={{ touchAction: 'none' }}
    >
      {/* Click outside is intentionally blocked so user MUST either Accept or Close explicitly */}
      <div
        className="relative w-full max-w-[390px] rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-[#16072b] via-[#0d041c] to-[#080212] p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden text-slate-100"
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow Flare */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close (X) Icon Button in Top-Right */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Offer"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer z-20 group"
        >
          <X className="w-4 h-4 transition-transform group-hover:rotate-90 group-hover:scale-110" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-black uppercase tracking-wider font-mono-crypto shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{offer.badgeText || "TODAY'S SPECIAL OFFER"}</span>
          </div>
        </div>

        {/* Main Offer Title */}
        <h3 className="text-base sm:text-lg font-black text-white font-rajdhani uppercase tracking-wide leading-tight mb-1 pr-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {offer.title || "DAILY DIRECT SALE CHALLENGE"}
        </h3>

        {/* Subtitle / Description */}
        <p className="text-[11px] sm:text-xs text-purple-200/90 leading-relaxed font-sans mb-3.5">
          {offer.subtitle || "Achieve direct sales target today & unlock an instant USDT cash reward!"}
        </p>

        {/* Live Digital Countdown Timer */}
        <div className="mb-3.5 p-2.5 rounded-2xl bg-[#090317]/90 border border-amber-500/30 shadow-inner flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 font-mono-crypto uppercase tracking-wider mb-1.5">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>OFFER ENDS IN</span>
          </div>
          <div className="flex items-center gap-2 font-mono-crypto text-white">
            <div className="flex flex-col items-center">
              <span className="w-10 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-center text-sm font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">Hours</span>
            </div>
            <span className="text-amber-400 font-black text-sm pb-3">:</span>
            <div className="flex flex-col items-center">
              <span className="w-10 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-center text-sm font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">Mins</span>
            </div>
            <span className="text-amber-400 font-black text-sm pb-3">:</span>
            <div className="flex flex-col items-center">
              <span className="w-10 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-center text-sm font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">Secs</span>
            </div>
          </div>
        </div>

        {/* Reward & Target Highlight Box */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {/* Target */}
          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col items-center text-center">
            <span className="text-[9px] text-purple-300 font-bold uppercase font-mono-crypto">
              Direct Target
            </span>
            <span className="text-sm font-black text-white font-mono-crypto mt-0.5">
              ${(offer.targetDirectVolume || 500).toFixed(0)} <span className="text-[10px] text-slate-400">USD</span>
            </span>
          </div>

          {/* Reward */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col items-center text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="text-[9px] text-emerald-300 font-bold uppercase font-mono-crypto flex items-center gap-1">
              <Gift className="w-2.5 h-2.5 text-emerald-400" /> Cash Bonus
            </span>
            <span className="text-sm font-black text-emerald-300 font-mono-crypto mt-0.5">
              +${(offer.rewardUsdt || 50).toFixed(0)} <span className="text-[10px] text-emerald-400">USDT</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAcceptOffer}
            disabled={isAccepted}
            className={`w-full py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider font-rajdhani flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isAccepted
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-98'
            }`}
          >
            {isAccepted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>OFFER ACCEPTED!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>ACCEPT OFFER & PARTICIPATE</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-1.5 text-center text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer font-mono-crypto"
          >
            No thanks, close this offer
          </button>
        </div>
      </div>
    </div>
  );
};
