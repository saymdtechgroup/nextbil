import { QueueEntry } from '../types/crypto';

export const DEFAULT_DEMO_QUEUE: QueueEntry[] = [
  // Phase 2 Orders (Users who bought Phase 1 and placed sales for Phase 2, ordered strictly FIFO)
  { id: 'fifo-p2-1', userId: '0x71c8...a89F', phaseNumber: 2, tokensRequested: 10000, tokensSold: 4200 },
  { id: 'fifo-p2-2', userId: '0x94B2...e3C1', phaseNumber: 2, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p2-3', userId: '0x3a9B...74F1', phaseNumber: 2, tokensRequested: 8500, tokensSold: 0 },
  { id: 'fifo-p2-4', userId: '0x88F0...C194', phaseNumber: 2, tokensRequested: 12000, tokensSold: 0 },
  { id: 'fifo-p2-5', userId: '0x5C21...98B2', phaseNumber: 2, tokensRequested: 20000, tokensSold: 0 },
  { id: 'fifo-p2-6', userId: '0x12E4...884A', phaseNumber: 2, tokensRequested: 14500, tokensSold: 0 },
  { id: 'fifo-p2-7', userId: '0x43D9...22A1', phaseNumber: 2, tokensRequested: 9800, tokensSold: 0 },
  { id: 'fifo-p2-8', userId: '0x66B7...5F02', phaseNumber: 2, tokensRequested: 16000, tokensSold: 0 },
  { id: 'fifo-p2-9', userId: '0x81C3...9E10', phaseNumber: 2, tokensRequested: 11200, tokensSold: 0 },
  { id: 'fifo-p2-10', userId: '0x90F4...33D8', phaseNumber: 2, tokensRequested: 25000, tokensSold: 0 },
  { id: 'fifo-p2-11', userId: '0x14A2...BC71', phaseNumber: 2, tokensRequested: 7500, tokensSold: 0 },
  { id: 'fifo-p2-12', userId: '0x78E9...41DA', phaseNumber: 2, tokensRequested: 18000, tokensSold: 0 },

  // Phase 3 Orders (Next Phase after P2)
  { id: 'fifo-p3-1', userId: '0x71c8...a89F', phaseNumber: 3, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p3-2', userId: '0x94B2...e3C1', phaseNumber: 3, tokensRequested: 22500, tokensSold: 0 },
  { id: 'fifo-p3-3', userId: '0x3a9B...74F1', phaseNumber: 3, tokensRequested: 12750, tokensSold: 0 },
  { id: 'fifo-p3-4', userId: '0x88F0...C194', phaseNumber: 3, tokensRequested: 18000, tokensSold: 0 },
  { id: 'fifo-p3-5', userId: '0x5C21...98B2', phaseNumber: 3, tokensRequested: 30000, tokensSold: 0 },
  { id: 'fifo-p3-6', userId: '0x12E4...884A', phaseNumber: 3, tokensRequested: 21750, tokensSold: 0 },
  { id: 'fifo-p3-7', userId: '0x43D9...22A1', phaseNumber: 3, tokensRequested: 14700, tokensSold: 0 },
  { id: 'fifo-p3-8', userId: '0x66B7...5F02', phaseNumber: 3, tokensRequested: 24000, tokensSold: 0 },
  { id: 'fifo-p3-9', userId: '0x81C3...9E10', phaseNumber: 3, tokensRequested: 16800, tokensSold: 0 },
  { id: 'fifo-p3-10', userId: '0x90F4...33D8', phaseNumber: 3, tokensRequested: 37500, tokensSold: 0 },

  // Phase 4 Orders (Target $0.25)
  { id: 'fifo-p4-1', userId: '0x71c8...a89F', phaseNumber: 4, tokensRequested: 10000, tokensSold: 0 },
  { id: 'fifo-p4-2', userId: '0x94B2...e3C1', phaseNumber: 4, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p4-3', userId: '0x3a9B...74F1', phaseNumber: 4, tokensRequested: 8500, tokensSold: 0 },
  { id: 'fifo-p4-4', userId: '0x88F0...C194', phaseNumber: 4, tokensRequested: 12000, tokensSold: 0 },
  { id: 'fifo-p4-5', userId: '0x5C21...98B2', phaseNumber: 4, tokensRequested: 20000, tokensSold: 0 },
  { id: 'fifo-p4-6', userId: '0x12E4...884A', phaseNumber: 4, tokensRequested: 16500, tokensSold: 0 },
  { id: 'fifo-p4-7', userId: '0x43D9...22A1', phaseNumber: 4, tokensRequested: 11000, tokensSold: 0 },
  { id: 'fifo-p4-8', userId: '0x66B7...5F02', phaseNumber: 4, tokensRequested: 18500, tokensSold: 0 },
  { id: 'fifo-p4-9', userId: '0x81C3...9E10', phaseNumber: 4, tokensRequested: 14000, tokensSold: 0 },
  { id: 'fifo-p4-10', userId: '0x90F4...33D8', phaseNumber: 4, tokensRequested: 28000, tokensSold: 0 },

  // Phase 5 Orders (Target $0.30)
  { id: 'fifo-p5-1', userId: '0x71c8...a89F', phaseNumber: 5, tokensRequested: 7500, tokensSold: 0 },
  { id: 'fifo-p5-2', userId: '0x94B2...e3C1', phaseNumber: 5, tokensRequested: 11250, tokensSold: 0 },
  { id: 'fifo-p5-3', userId: '0x3a9B...74F1', phaseNumber: 5, tokensRequested: 6375, tokensSold: 0 },
  { id: 'fifo-p5-4', userId: '0x88F0...C194', phaseNumber: 5, tokensRequested: 9000, tokensSold: 0 },
  { id: 'fifo-p5-5', userId: '0x5C21...98B2', phaseNumber: 5, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p5-6', userId: '0x12E4...884A', phaseNumber: 5, tokensRequested: 13500, tokensSold: 0 },
  { id: 'fifo-p5-7', userId: '0x43D9...22A1', phaseNumber: 5, tokensRequested: 8200, tokensSold: 0 },
  { id: 'fifo-p5-8', userId: '0x66B7...5F02', phaseNumber: 5, tokensRequested: 14000, tokensSold: 0 },
  { id: 'fifo-p5-9', userId: '0x81C3...9E10', phaseNumber: 5, tokensRequested: 10500, tokensSold: 0 },
  { id: 'fifo-p5-10', userId: '0x90F4...33D8', phaseNumber: 5, tokensRequested: 22000, tokensSold: 0 },

  // Phase 6 Orders (DEX Launch Target $1,500+)
  { id: 'fifo-dex-1', userId: '0x71c8...a89F', phaseNumber: 6, tokensRequested: 2500, tokensSold: 0 },
  { id: 'fifo-dex-2', userId: '0x94B2...e3C1', phaseNumber: 6, tokensRequested: 5000, tokensSold: 0 },
  { id: 'fifo-dex-3', userId: '0x3a9B...74F1', phaseNumber: 6, tokensRequested: 3000, tokensSold: 0 },
  { id: 'fifo-dex-4', userId: '0x88F0...C194', phaseNumber: 6, tokensRequested: 4200, tokensSold: 0 },
  { id: 'fifo-dex-5', userId: '0x5C21...98B2', phaseNumber: 6, tokensRequested: 6500, tokensSold: 0 },
  { id: 'fifo-dex-6', userId: '0x12E4...884A', phaseNumber: 6, tokensRequested: 5500, tokensSold: 0 },
  { id: 'fifo-dex-7', userId: '0x43D9...22A1', phaseNumber: 6, tokensRequested: 3800, tokensSold: 0 },
  { id: 'fifo-dex-8', userId: '0x66B7...5F02', phaseNumber: 6, tokensRequested: 7000, tokensSold: 0 },
  { id: 'fifo-dex-9', userId: '0x81C3...9E10', phaseNumber: 6, tokensRequested: 4800, tokensSold: 0 },
  { id: 'fifo-dex-10', userId: '0x90F4...33D8', phaseNumber: 6, tokensRequested: 9500, tokensSold: 0 },
];
