import { QueueEntry } from '../types/crypto';

/** Production queue starts empty; entries must come from the database/API. */
export const DEFAULT_DEMO_QUEUE: QueueEntry[] = [];
