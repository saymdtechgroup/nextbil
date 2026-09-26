import React from 'react';
import { ShieldCheck, RotateCw } from 'lucide-react';

interface DeviceFrameProps {
  screenNumber: number;
  screenTitle: string;
  badgeText: string;
  badgeColor?: 'gold' | 'magenta' | 'purple';
  url?: string;
  children: React.ReactNode;
  isHero?: boolean;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  screenNumber,
  screenTitle,
  badgeText,
  badgeColor = 'gold',
  url = 'nxbc.tech',
  children,
  isHero = false,
}) => {
  const badgeStyles = {
    gold: 'border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    magenta: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(217,70,239,0.2)]',
    purple: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto group">
      {/* Screen Header Badge for Multi-Device Mode */}
      <div className="flex items-center justify-between w-full px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-cyan-600 text-[11px] font-black text-black shadow-md font-mono-crypto">
            0{screenNumber}
          </span>
          <span className="text-sm font-bold text-slate-100 tracking-tight font-rajdhani uppercase">
            {screenTitle}
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full border uppercase ${badgeStyles[badgeColor]}`}
        >
          {badgeText}
        </span>
      </div>

      {/* Sleek Modern Card Container */}
      <div
        className={`w-full rounded-[26px] overflow-hidden relative transition-all duration-300 ${
          isHero
            ? 'bg-gradient-to-b from-[#07182a] via-[#04101c] to-[#020811] shadow-[0_15px_40px_rgba(245,158,11,0.12)] border border-amber-400/30'
            : 'bg-gradient-to-b from-[#061322] via-[#040d18] to-[#020811] shadow-[0_12px_30px_rgba(0,0,0,0.5)] border border-cyan-500/25 hover:border-amber-400/30'
        }`}
      >
        {/* Subtle In-App Top Bar */}
        <div className="bg-[#061322]/90 backdrop-blur-md px-3.5 py-2 border-b border-cyan-500/20 flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-[#020811] border border-amber-500/20 rounded-full px-3 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-200/90 font-mono-crypto text-[11px] font-medium tracking-wide truncate">
              {url}
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 ml-auto" />
          </div>
          <button
            title="Verified Node"
            className="p-1 text-cyan-300/70 hover:text-amber-300 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Screen Content */}
        <div className="min-h-[580px] max-h-[750px] overflow-y-auto overflow-x-hidden relative flex flex-col justify-between scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};

