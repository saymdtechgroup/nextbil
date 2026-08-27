import React from 'react';
import { GoldCoinGraphic } from './GoldCoinGraphic';

export const AnalyticalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070312]">
      {/* Dynamic Ambient Gradient Orbs */}
      <div className="absolute top-[-10%] left-[15%] w-[550px] h-[550px] rounded-full bg-fuchsia-900/15 blur-[120px]" />
      <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[140px]" />
      <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] rounded-full bg-purple-950/40 blur-[150px]" />

      {/* Cyberpunk Analytical Grid */}
      <div className="absolute inset-0 bg-crypto-grid opacity-35" />

      {/* Subtle Golden Analytical Graphs / Candlesticks in Background */}
      <div className="absolute inset-0 opacity-20 flex flex-col justify-between p-8">
        {/* Top Wave Chart SVG */}
        <svg className="w-full h-48 stroke-amber-500/30 fill-none" viewBox="0 0 1200 200">
          <defs>
            <linearGradient id="goldGraphGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M0,140 Q150,60 300,110 T600,70 T900,130 T1200,40"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M0,140 Q150,60 300,110 T600,70 T900,130 T1200,40 L1200,200 L0,200 Z"
            fill="url(#goldGraphGrad)"
          />
        </svg>

        {/* Middle Golden Candlestick Series */}
        <div className="hidden lg:flex items-end justify-around w-full h-32 px-12 opacity-30">
          {[
            { high: 80, low: 20, open: 30, close: 70, up: true },
            { high: 90, low: 40, open: 65, close: 45, up: false },
            { high: 110, low: 50, open: 55, close: 95, up: true },
            { high: 120, low: 70, open: 90, close: 115, up: true },
            { high: 100, low: 60, open: 100, close: 75, up: false },
            { high: 130, low: 80, open: 85, close: 125, up: true },
            { high: 140, low: 90, open: 120, close: 135, up: true },
            { high: 155, low: 110, open: 130, close: 150, up: true },
            { high: 145, low: 100, open: 145, close: 115, up: false },
            { high: 165, low: 120, open: 120, close: 160, up: true },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center h-full justify-end">
              <div
                className={`w-[1px] ${bar.up ? 'bg-amber-400' : 'bg-fuchsia-400'}`}
                style={{ height: `${bar.high - bar.low}px` }}
              />
              <div
                className={`w-3 rounded-sm ${
                  bar.up
                    ? 'bg-amber-500/80 border border-amber-300'
                    : 'bg-fuchsia-600/80 border border-fuchsia-300'
                }`}
                style={{ height: `${Math.max(12, Math.abs(bar.close - bar.open))}px` }}
              />
            </div>
          ))}
        </div>

        {/* Bottom Neon Spline */}
        <svg className="w-full h-40 stroke-fuchsia-500/20 fill-none" viewBox="0 0 1200 150">
          <path
            d="M0,100 C200,140 400,20 600,80 C800,130 1000,30 1200,60"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Floating Decorative Gold Coins in Background Frame */}
      <div className="absolute top-12 left-8 opacity-40 transform -rotate-12 animate-bounce duration-1000 hidden xl:block">
        <GoldCoinGraphic size="xl" glow={false} />
      </div>
      <div className="absolute bottom-16 right-10 opacity-35 transform rotate-45 hidden xl:block">
        <GoldCoinGraphic size="lg" glow={false} />
      </div>
      <div className="absolute top-1/3 right-12 opacity-25 transform -rotate-45 hidden 2xl:block">
        <GoldCoinGraphic size="md" glow={false} />
      </div>
      <div className="absolute bottom-1/4 left-12 opacity-20 transform rotate-12 hidden 2xl:block">
        <GoldCoinGraphic size="lg" glow={false} />
      </div>
    </div>
  );
};
