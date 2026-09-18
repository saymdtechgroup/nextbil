import React from 'react';
import { Bell, Facebook, Menu, Send, UserRound, Youtube } from 'lucide-react';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface NXBCBrandHeaderProps {
  tokenSymbol?: string;
  presalePaused?: boolean;
  walletConnected?: boolean;
  walletAddress?: string;
  onOpenWallet?: () => void;
  onOpenMenu?: () => void;
}

export const NXBCBrandHeader: React.FC<NXBCBrandHeaderProps> = ({
  tokenSymbol = 'NXBC',
  presalePaused = false,
  walletConnected = false,
  walletAddress = '',
  onOpenWallet,
  onOpenMenu,
}) => {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`
    : 'Connect';

  return (
    <header className="nxbc-brand-header">
      <div className="nxbc-brand-lockup">
        <GoldCoinGraphic size="sm" glow animated={false} />
        <div className="min-w-0">
          <div className="nxbc-brand-name">
            {tokenSymbol}
          </div>
          <div className="nxbc-brand-tagline">BUILD TODAY • CHANGE TOMORROW</div>
        </div>
      </div>

      <div className="nxbc-header-actions">
        <button type="button" className="nxbc-social-btn" aria-label="X" title="X">𝕏</button>
        <button type="button" className="nxbc-social-btn youtube" aria-label="YouTube" title="YouTube"><Youtube size={15} /></button>
        <button type="button" className="nxbc-social-btn facebook" aria-label="Facebook" title="Facebook"><Facebook size={15} /></button>
        <button type="button" className="nxbc-social-btn telegram" aria-label="Telegram" title="Telegram"><Send size={15} /></button>
        <button type="button" className="nxbc-icon-btn" aria-label="Notifications" title="Notifications"><Bell size={16} /></button>
        <button type="button" className="nxbc-icon-btn" aria-label="Account" title={shortWallet} onClick={onOpenWallet}><UserRound size={16} /></button>
        {onOpenMenu && (
          <button type="button" className="nxbc-icon-btn mobile-only" aria-label="Menu" title="Menu" onClick={onOpenMenu}><Menu size={17} /></button>
        )}
      </div>

      <div className="nxbc-header-status-row">
        <span className={`nxbc-status-pill ${presalePaused ? 'paused' : ''}`}>
          <span className="nxbc-status-dot" />
          {presalePaused ? 'PRESALE PAUSED' : 'BSC MAINNET LIVE'}
        </span>
        <button type="button" className="nxbc-connect-mini" onClick={onOpenWallet}>
          {walletConnected ? shortWallet : 'CONNECT WALLET'}
        </button>
      </div>
    </header>
  );
};
