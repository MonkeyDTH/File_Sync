export interface SyncPair {
  id: string;
  name: string;
  source: string;
  target: string;
  selected: boolean;
  recursive: boolean;
}

export interface SyncProgress {
  pair_id: string;
  current_file: string;
  done: number;
  total: number;
}

export interface SyncResult {
  pair_id: string;
  copied: number;
  skipped: number;
  errors: string[];
  duration_ms: number;
}
