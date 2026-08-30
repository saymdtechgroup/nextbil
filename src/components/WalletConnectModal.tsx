import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Wallet,
  Sparkles,
  Copy,
  Zap,
} from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (name: string, address: string) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
}) => {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'web3' | 'deeplink' | 'manual'>('web3');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [detectedProviderName, setDetectedProviderName] = useState<string | null>(null);
  const [hasInjectedWeb3, setHasInjectedWeb3] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eth = (window as any).ethereum;
      const tw = (window as any).trustwallet;
      const binance = (window as any).binancew3w;
      const okx = (window as any).okxwallet;

      if (tw) {
        setHasInjectedWeb3(true);
        setDetectedProviderName('Trust Wallet');
      } else if (binance) {
        setHasInjectedWeb3(true);
        setDetectedProviderName('Binance Web3 Wallet');
      } else if (okx) {
        setHasInjectedWeb3(true);
        setDetectedProviderName('OKX Wallet');
      } else if (eth) {
        setHasInjectedWeb3(true);
        if (eth.isMetaMask) {
          setDetectedProviderName('MetaMask');
        } else if (eth.isTrust) {
          setDetectedProviderName('Trust Wallet');
        } else {
          setDetectedProviderName('Injected Web3 Browser');
        }
      } else {
        setHasInjectedWeb3(false);
        setDetectedProviderName(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to switch or add BSC network
  const switchToBSC = async (provider: any) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // 56 in hex (BSC Mainnet)
      });
    } catch (switchError: any) {
      // 4902 indicates chain not yet added
      if (switchError.code === 4902 || switchError?.message?.includes('4902')) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x38',
                chainName: 'BNB Smart Chain Mainnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add BSC chain:', addError);
        }
      }
    }
  };

  const handleInjectedConnect = async (customName?: string) => {
    setErrorMessage(null);
    setConnectingId('injected');

    const eth =
      (window as any).trustwallet?.ethereum ||
      (window as any).ethereum ||
      (window as any).binancew3w?.ethereum ||
      (window as any).okxwallet;

    if (!eth) {
      setErrorMessage(
        'Chrome mobile me extension nahi chalti. Kirpya "Mobile App DApp" tab se Trust Wallet ya MetaMask me kholein, ya neeche apna BEP-20 address paste karein.'
      );
      setConnectingId(null);
      setActiveTab('deeplink');
      return;
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        await switchToBSC(eth);

        localStorage.setItem('nxbc_connected_wallet', address);
        localStorage.setItem('nxbc_wallet_provider', customName || detectedProviderName || 'Web3 Wallet');
        onSelectWallet(customName || detectedProviderName || 'Web3 Wallet', address);
        setConnectingId(null);
        onClose();
      } else {
        throw new Error('No accounts selected in wallet');
      }
    } catch (err: any) {
      console.error('Web3 connection error:', err);
      setErrorMessage(err?.message || 'User rejected wallet connection');
      setConnectingId(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualAddress.trim();
    if (!clean.startsWith('0x') || clean.length !== 42) {
      setErrorMessage('Please enter a valid 42-character BEP-20 address starting with 0x.');
      return;
    }
    localStorage.setItem('nxbc_connected_wallet', clean);
    localStorage.setItem('nxbc_wallet_provider', 'BEP-20 Wallet');
    onSelectWallet('BEP-20 Wallet', clean);
    onClose();
  };

  const openDAppDeepLink = (walletType: 'trust' | 'metamask' | 'bitget' | 'okx') => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nxbc.tech';
    const hostWithProtocol = currentUrl.replace(/^https?:\/\//, '');

    if (walletType === 'trust') {
      // Trust wallet universal deep link for dApp browser
      const trustLink = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`;
      window.location.href = trustLink;
    } else if (walletType === 'metamask') {
      // MetaMask deep link
      const mmLink = `https://metamask.app.link/dapp/${hostWithProtocol}`;
      window.location.href = mmLink;
    } else if (walletType === 'okx') {
      const okxLink = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(currentUrl)}`;
      window.location.href = okxLink;
    } else if (walletType === 'bitget') {
      const bitgetLink = `bitkeep://bkconnect?action=dapp&url=${encodeURIComponent(currentUrl)}`;
      window.location.href = bitgetLink;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#120824] border border-purple-500/30 p-5 shadow-[0_0_50px_rgba(217,70,239,0.25)] relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-3">
          <h2 className="text-base font-black text-slate-100 font-rajdhani uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            Connect BEP-20 Wallet
          </h2>
          <p className="text-xs text-purple-300/80 font-mono-crypto">
            BNB Smart Chain (BSC) direct connection for Presale & Commissions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-purple-950/60 p-1 rounded-xl border border-purple-500/20 mb-3.5 text-xs font-rajdhani font-bold">
          <button
            onClick={() => setActiveTab('web3')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'web3'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Web3 / DApp
          </button>
          <button
            onClick={() => setActiveTab('deeplink')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'deeplink'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Mobile App
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Paste Address
          </button>
        </div>

        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="text-[11px] leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: WEB3 INJECTED CONNECT (Metamask / Trust Wallet / Binance Extension or DApp Browser) */}
        {activeTab === 'web3' && (
          <div className="space-y-2.5 mb-4">
            {hasInjectedWeb3 ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/60 animate-pulse mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <span className="text-xs font-black text-emerald-300 font-rajdhani uppercase">
                        {detectedProviderName || 'DApp Browser'} Detected!
                      </span>
                      <span className="text-[10px] text-emerald-200/80 block font-mono-crypto">
                        Ready for 1-Tap Instant Connection
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <button
                  disabled={connectingId === 'injected'}
                  onClick={() => handleInjectedConnect()}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-rajdhani font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  {connectingId === 'injected' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting Wallet...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black" />
                      Connect {detectedProviderName || 'Web3 Wallet'} Now
                    </>
                  )}
                </button>
              </div>
            ) : null}

            {/* MetaMask */}
            <button
              onClick={() => handleInjectedConnect('MetaMask')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🦊</span>
                <div>
                  <span className="text-xs font-bold text-slate-100 font-rajdhani block">
                    MetaMask
                  </span>
                  <span className="text-[9px] font-mono-crypto text-purple-300/80">
                    Chrome Extension / DApp Browser
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Trust Wallet */}
            <button
              onClick={() => handleInjectedConnect('Trust Wallet')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-slate-100 font-rajdhani block">
                    Trust Wallet
                  </span>
                  <span className="text-[9px] font-mono-crypto text-purple-300/80">
                    Web3 & Mobile DApp
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Binance Web3 Wallet */}
            <button
              onClick={() => handleInjectedConnect('Binance Web3 Wallet')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🟡</span>
                <div>
                  <span className="text-xs font-bold text-slate-100 font-rajdhani block">
                    Binance Web3 Wallet
                  </span>
                  <span className="text-[9px] font-mono-crypto text-purple-300/80">
                    EVM / BSC Native
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 group-hover:text-yellow-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        )}

        {/* TAB 2: MOBILE DEEP LINKS (Agar user direct mobile chrome me khola hai) */}
        {activeTab === 'deeplink' && (
          <div className="space-y-2.5 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-[11px] text-purple-200 leading-snug">
              📱 <strong>Mobile Chrome User:</strong> Agar aap mobile browser me hain, to niche diye gaye button par click karke direct Trust Wallet ya MetaMask app me ye website kholein.
            </div>

            {/* Open in Trust Wallet App */}
            <button
              onClick={() => openDAppDeepLink('trust')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-slate-100 font-rajdhani block">
                    Open in Trust Wallet App
                  </span>
                  <span className="text-[9px] font-mono-crypto text-cyan-300">
                    Auto-opens in Trust DApp Browser
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-cyan-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Open in MetaMask App */}
            <button
              onClick={() => openDAppDeepLink('metamask')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🦊</span>
                <div>
                  <span className="text-xs font-bold text-slate-100 font-rajdhani block">
                    Open in MetaMask App
                  </span>
                  <span className="text-[9px] font-mono-crypto text-amber-300">
                    Auto-opens in MetaMask Browser
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Open in OKX App */}
            <button
              onClick={() => openDAppDeepLink('okx')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-slate-700/30 to-purple-800/30 border border-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⬛</span>
                <div>
                  <span className="text-xs font-bold text-slate-100 font-rajdhani block">
                    Open in OKX Wallet App
                  </span>
                  <span className="text-[9px] font-mono-crypto text-purple-300">
                    Auto-opens in OKX DApp
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        )}

        {/* TAB 3: MANUAL BEP-20 ADDRESS (Direct paste) */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-[11px] text-purple-200 leading-snug">
              ✍️ <strong>Instant Address Connection:</strong> Apna Trust Wallet ya MetaMask se BEP-20 (BNB/USDT) deposit address copy karke yahan paste karein.
            </div>

            <div>
              <label className="block text-[10px] font-mono-crypto text-purple-300 mb-1 uppercase tracking-wider">
                Your BEP-20 BSC Address (0x...)
              </label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="0xF1F82363Dfb5a5B52BE94c6C..."
                className="w-full bg-[#0a0414] border border-purple-500/40 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-mono-crypto focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-rajdhani font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Connect With This Address
            </button>
          </form>
        )}

        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center gap-2 text-[10px] text-purple-300">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Non-custodial EVM / BSC protocol audited by CertiK.</span>
        </div>
      </div>
    </div>
  );
};
