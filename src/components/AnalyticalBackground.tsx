import React from 'react';

export const AnalyticalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070312]">
      {/* Lightweight Radial Ambient Gradients (No heavy CPU blur) */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 20% 15%, rgba(217, 70, 239, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 50%, rgba(245, 158, 11, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 50% 85%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      {/* Cyberpunk Analytical Grid */}
      <div className="absolute inset-0 bg-crypto-grid opacity-25" />

      {/* Subtle Golden Analytical Wave in Background */}
      <div className="absolute inset-0 opacity-15 hidden md:flex flex-col justify-between p-8">
        <svg className="w-full h-48 stroke-amber-500/30 fill-none" viewBox="0 0 1200 200">
          <defs>
            <linearGradient id="goldGraphGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M0,140 Q150,60 300,110 T600,70 T900,130 T1200,40"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M0,140 Q150,60 300,110 T600,70 T900,130 T1200,40 L1200,200 L0,200 Z"
            fill="url(#goldGraphGrad)"
          />
        </svg>
      </div>
    </div>
  );
};
