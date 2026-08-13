import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, FolderSync } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { PairCard } from "./components/PairCard";
import { PairDialog } from "./components/PairDialog";
import { SyncLogPanel } from "./components/SyncLogPanel";
import {
  addPair,
  deletePair,
  listPairs,
  onSyncProgress,
  syncPairs,
  updatePair,
} from "./lib/api";
import type { SyncPair, SyncProgress, SyncResult } from "./lib/types";

function App() {
  const [pairs, setPairs] = useState<SyncPair[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<SyncPair | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [progressByPair, setProgressByPair] = useState<Record<string, SyncProgress>>({});
  const [results, setResults] = useState<SyncResult[]>([]);

  useEffect(() => {
    listPairs()
      .then(setPairs)
      .catch((e) => toast.error(`加载配置失败: ${e}`));
  }, []);

  useEffect(() => {
    const unlisten = onSyncProgress((progress) => {
      setProgressByPair((prev) => ({ ...prev, [progress.pair_id]: progress }));
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const pairsById = useMemo(
    () => Object.fromEntries(pairs.map((p) => [p.id, p])),
    [pairs],
  );
  const selectedCount = pairs.filter((p) => p.selected).length;
  const allSelected = pairs.length > 0 && selectedCount === pairs.length;

  const toggleAll = async (checked: boolean) => {
    const updated = pairs.map((p) => ({ ...p, selected: checked }));
    setPairs(updated);
    await Promise.all(updated.map((p) => updatePair(p)));
  };

  const togglePair = async (id: string, checked: boolean) => {
    const updated = pairs.map((p) => (p.id === id ? { ...p, selected: checked } : p));
    setPairs(updated);
    const target = updated.find((p) => p.id === id);
    if (target) await updatePair(target);
  };

  const handleSubmit = async (data: { name: string; source: string; target: string }) => {
    try {
      if (editingPair) {
        const updated = { ...editingPair, ...data };
        await updatePair(updated);
        setPairs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("已保存修改");
      } else {
        const created = await addPair(data.name, data.source, data.target);
        setPairs((prev) => [...prev, created]);
        toast.success("已添加目录对");
      }
    } catch (e) {
      toast.error(`保存失败: ${e}`);
    } finally {
      setEditingPair(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePair(id);
      setPairs((prev) => prev.filter((p) => p.id !== id));
      toast.success("已删除");
    } catch (e) {
      toast.error(`删除失败: ${e}`);
    }
  };

  const handleSync = async () => {
    const ids = pairs.filter((p) => p.selected).map((p) => p.id);
    if (ids.length === 0) return;
    setSyncing(true);
    setProgressByPair({});
    setResults([]);
    try {
      const res = await syncPairs(ids);
      setResults(res);
      const hasError = res.some((r) => r.errors.length > 0);
      if (hasError) {
        toast.warning("同步完成，但部分目录对存在错误，请查看日志");
      } else {
        toast.success("同步完成");
      }
    } catch (e) {
      toast.error(`同步失败: ${e}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-slate-50 p-6">
      <Toaster position="top-center" richColors />

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderSync className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-semibold text-slate-900">目录同步工具</h1>
        </div>
        <Button
          onClick={() => {
            setEditingPair(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          添加目录对
        </Button>
      </header>

      {pairs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
          <FolderSync className="h-10 w-10" />
          <p>还没有目录对，添加你的第一个目录对开始使用</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(v === true)} />
              全选（已选 {selectedCount}/{pairs.length}）
            </label>
            <Button onClick={handleSync} disabled={selectedCount === 0 || syncing}>
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FolderSync className="h-4 w-4" />
              )}
              {syncing ? "同步中..." : "开始同步"}
            </Button>
          </div>

          <div className="space-y-2">
            {pairs.map((pair) => (
              <PairCard
                key={pair.id}
                pair={pair}
                onToggle={(checked) => togglePair(pair.id, checked)}
                onEdit={() => {
                  setEditingPair(pair);
                  setDialogOpen(true);
                }}
                onDelete={() => handleDelete(pair.id)}
              />
            ))}
          </div>

          <SyncLogPanel
            syncing={syncing}
            progressByPair={progressByPair}
            results={results}
            pairsById={pairsById}
          />
        </>
      )}

      <PairDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingPair}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

export default App;
