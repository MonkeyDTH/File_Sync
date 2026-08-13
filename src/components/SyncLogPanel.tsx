import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
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
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">同步日志</h3>
      <div className="max-h-64 space-y-3 overflow-y-auto">
        {syncing &&
          Object.values(progressByPair).map((p) => (
            <div key={p.pair_id} className="text-sm">
              <div className="mb-1 flex items-center gap-2 text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                <span className="font-medium">{pairsById[p.pair_id]?.name || p.pair_id}</span>
                <span className="text-xs text-slate-400">
                  {p.done}/{p.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-1 truncate text-xs text-slate-400">{p.current_file}</div>
            </div>
          ))}

        {!syncing &&
          results.map((r) => (
            <div key={r.pair_id} className="text-sm">
              <div className="flex items-center gap-2">
                {r.errors.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span className="font-medium text-slate-700">
                  {pairsById[r.pair_id]?.name || r.pair_id}
                </span>
                <span className="text-xs text-slate-400">
                  复制 {r.copied}・跳过 {r.skipped}・耗时 {r.duration_ms}ms
                </span>
              </div>
              {r.errors.length > 0 && (
                <ul className="mt-1 list-disc pl-6 text-xs text-red-500">
                  {r.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}
