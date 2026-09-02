import React, { useEffect, useState } from 'react';
import { ChevronRight, ShieldCheck, Zap, Lock, RefreshCw, BarChart3, Rocket, ArrowRight, Play, Server, Coins, Database, Target, Users } from 'lucide-react';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#06010f] text-slate-200 font-sans selection:bg-fuchsia-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-amber-600/10 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-600/10 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] left-[40%] w-[40vw] h-[40vw] bg-purple-700/10 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <GoldCoinGraphic />
          </div>
          <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-rajdhani uppercase">
            NXBC Network
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-purple-200/80">
          <a href="#vision" className="hover:text-amber-400 transition-colors">Vision</a>
          <a href="#tokenomics" className="hover:text-amber-400 transition-colors">Tokenomics</a>
          <a href="#roadmap" className="hover:text-amber-400 transition-colors">Roadmap</a>
        </div>
        <button
          onClick={onLaunch}
          className="px-5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-2"
        >
          Launch App <ChevronRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="px-6 lg:px-12 pt-24 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="px-4 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono-crypto tracking-widest uppercase mb-6 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Presale Phase 1 is Live
            </span>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white font-rajdhani leading-tight mb-8">
              The Next Evolution of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-fuchsia-500 to-amber-400">
                Decentralized Finance
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-purple-200/80 mb-10 leading-relaxed font-light">
              Experience the world's first 100% decentralized FIFO allocation model. 
              Hold tokens safely in your wallet and execute trustless Atomic Swaps 
              at guaranteed phase price milestones.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onLaunch}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-slate-900 font-black text-lg tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
              >
                Launch Presale App
                <Rocket className="w-5 h-5" />
              </button>
              
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg tracking-wider transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                <Play className="w-5 h-5 text-purple-400" />
                Watch Tutorial
              </button>
            </div>
          </div>

          {/* Key Metric Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
            {[
              { title: "Tokens Minted", value: "100%", desc: "Directly to your Wallet", icon: ShieldCheck },
              { title: "Smart Contract", value: "Audited", desc: "Atomic FIFO Swaps", icon: Lock },
              { title: "Target Price", value: "$0.01 ➔ $100", desc: "5 Multiplier Phases", icon: BarChart3 }
            ].map((metric, i) => (
              <div key={i} className={`p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-left transition-all duration-1000 delay-${(i+1)*200} transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4 border border-white/5">
                  <metric.icon className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-3xl font-black font-mono-crypto text-white mb-1">{metric.value}</h3>
                <p className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">{metric.title}</p>
                <p className="text-xs text-purple-300/60">{metric.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="vision" className="py-24 bg-black/40 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black font-rajdhani uppercase text-white mb-4">Core Technology</h2>
              <p className="text-purple-300/70 max-w-2xl mx-auto">Our revolutionary smart contract architecture eliminates counterparty risk.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-1">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">100% Mint To Wallet</h3>
                    <p className="text-purple-200/70 text-sm leading-relaxed">Unlike traditional presales that hold your tokens, NXBC mints your purchase directly to your Trust Wallet or MetaMask the second the transaction confirms.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 mt-1">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Virtual FIFO Registration</h3>
                    <p className="text-purple-200/70 text-sm leading-relaxed">Plan your multi-phase exit strategy by allocating tokens in our virtual queue. Your tokens never leave your wallet until the sale actually happens.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-1">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Atomic Web3 Swap</h3>
                    <p className="text-purple-200/70 text-sm leading-relaxed">When your target phase completes, claim your USDT earnings with a single click. The smart contract safely swaps your held NXBC for the equivalent USDT atomically.</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 blur-3xl" />
                <div className="relative rounded-3xl border border-white/10 bg-[#0a0415] p-8 shadow-2xl overflow-hidden">
                  {/* Abstract UI representation */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[10px] font-mono-crypto text-purple-400">NXBC_ENGINE.sol</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between px-4">
                      <span className="text-xs text-purple-300 font-mono-crypto">function buyTokens()</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">MINT</span>
                    </div>
                    <div className="h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between px-4">
                      <span className="text-xs text-purple-300 font-mono-crypto">function setVirtualAllocation()</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">QUEUE</span>
                    </div>
                    <div className="h-12 rounded-xl bg-gradient-to-r from-amber-500/10 to-fuchsia-500/10 border border-amber-500/30 flex items-center justify-between px-4">
                      <span className="text-xs text-amber-300 font-mono-crypto">function atomicWithdraw()</span>
                      <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded">SWAP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tokenomics Preview */}
        <section id="tokenomics" className="py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black font-rajdhani uppercase text-white mb-12">Phase Economics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { phase: 1, price: "$0.01", supply: "5 Lakh" },
                { phase: 2, price: "$0.10", supply: "25 Lakh" },
                { phase: 3, price: "$1.00", supply: "70 Lakh" },
                { phase: 4, price: "$10.00", supply: "195 Lakh" },
                { phase: 5, price: "$100.00", supply: "400 Lakh" },
              ].map((p, i) => (
                <div key={i} className={`relative p-6 rounded-2xl border ${i === 0 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-[#0a0415] border-purple-500/20'}`}>
                  {i === 0 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>}
                  <h4 className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">Phase {p.phase}</h4>
                  <p className="text-2xl font-black text-white font-mono-crypto mb-1">{p.price}</p>
                  <p className="text-[10px] text-purple-300/50 uppercase">{p.supply} NXBC</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24 border-t border-white/5 bg-gradient-to-b from-transparent to-[#0a0415]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black font-rajdhani uppercase text-white mb-6">Ready to join the revolution?</h2>
            <button
              onClick={onLaunch}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-900 font-black text-lg tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 mx-auto hover:scale-105"
            >
              Enter Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
