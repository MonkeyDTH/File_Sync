import { Check, AlertTriangle, Loader2 } from "lucide-react";
import type { SyncPair, SyncProgress, SyncResult } from "../lib/types";

interface Props {
  syncing: boolean;
  progressByPair: Record<string, SyncProgress>;
  results: SyncResult[];
  pairsById: Record<string, SyncPair>;
}

export function SyncLogPanel({ syncing, progressByPair, results, pairsById }: Props) {
  if (!syncing && results.length === 0) return null;

  return (
    <div className="mt-1 border-t border-line pt-3">
      <h3 className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-ink-3">
        同步日志
      </h3>
      <div className="max-h-64 space-y-3 overflow-y-auto">
        {syncing &&
          Object.values(progressByPair).map((p) => (
            <div key={p.pair_id}>
              <div className="mb-1 flex items-center gap-2 text-[12.5px] text-ink-2">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
                <span className="truncate font-medium text-ink">
                  {pairsById[p.pair_id]?.name || p.pair_id}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-ink-3">
                  {p.done}/{p.total}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-200"
                  style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-1 truncate font-mono text-[11px] text-ink-3">
                {p.current_file}
              </div>
            </div>
          ))}

        {!syncing &&
          results.map((r) => (
            <div key={r.pair_id} className="text-[12.5px]">
              <div className="flex items-center gap-2">
                {r.errors.length === 0 ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger" />
                )}
                <span className="truncate font-medium text-ink">
                  {pairsById[r.pair_id]?.name || r.pair_id}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-ink-3">
                  复制 {r.copied} · 跳过 {r.skipped} · {r.duration_ms}ms
                </span>
              </div>
              {r.errors.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-6 font-mono text-[11px] text-danger">
                  {r.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
