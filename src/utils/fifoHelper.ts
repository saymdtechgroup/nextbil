import { QueueEntry } from '../types/crypto';

// Production FIFO data must come from the database/API. No demo or placeholder orders.
export const DEFAULT_DEMO_QUEUE: QueueEntry[] = [];
