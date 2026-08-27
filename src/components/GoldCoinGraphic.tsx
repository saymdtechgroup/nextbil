import React from 'react';
import nxbcCoinImage from '../assets/images/nxbc_gold_coin_1787729779691.jpg';

interface GoldCoinGraphicProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  glow?: boolean;
  animated?: boolean;
  showBadge?: boolean;
}

export const GoldCoinGraphic: React.FC<GoldCoinGraphicProps> = ({
  size = 'md',
  className = '',
  glow = true,
  animated = true,
  showBadge = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    hero: 'w-36 h-36',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none perspective-1000 ${sizeClasses[size]} ${className}`}
    >
      {/* Ambient Pulsing Background Glow */}
      {glow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/40 via-fuchsia-500/30 to-amber-400/40 blur-lg animate-pulse pointer-events-none" />
      )}

      {/* 3D Floating & Spinning Coin Container */}
      <div
        className={`relative w-full h-full rounded-full preserve-3d transition-transform duration-500 ${
          animated ? 'animate-float-levitate' : ''
        }`}
      >
        {/* 3D Coin Body with High-Def NXBC Texture & Edge Lighting */}
        <div
          className={`relative w-full h-full rounded-full p-[2px] bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-900 shadow-[0_8px_25px_rgba(245,158,11,0.4)] flex items-center justify-center overflow-hidden border border-yellow-200/70 group ${
            animated ? 'animate-spin-3d' : 'hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Real 3D Rendered NXBC Coin Texture */}
          <img
            src={nxbcCoinImage}
            alt="NXBC 3D Gold Coin"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full pointer-events-none filter contrast-110 brightness-105"
            onError={(e) => {
              // Fallback to pure CSS 3D coin if image load fails
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* Shimmer Light Reflection Sweep Across the Coin */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none rounded-full" />

          {/* Subtle Outer Milled Rim Bevel */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-amber-200/50 pointer-events-none" />
        </div>
      </div>

      {/* Optional NXBC Token Pill Label */}
      {showBadge && (
        <span className="absolute -bottom-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow border border-amber-300 font-mono-crypto uppercase tracking-wider">
          NXBC
        </span>
      )}
    </div>
  );
};

