import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { pickDirectory } from "../lib/api";
import type { SyncPair } from "../lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SyncPair | null;
  onSubmit: (data: { name: string; source: string; target: string }) => void;
}

export function PairDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSource(initial?.source ?? "");
      setTarget(initial?.target ?? "");
    }
  }, [open, initial]);

  const chooseSource = async () => {
    const dir = await pickDirectory();
    if (dir) setSource(dir);
  };
  const chooseTarget = async () => {
    const dir = await pickDirectory();
    if (dir) setTarget(dir);
  };

  const canSubmit = source.trim() !== "" && target.trim() !== "" && source !== target;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "编辑目录对" : "添加目录对"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">备注名（可选）</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：项目A"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">输入目录</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="选择输入目录"
              />
              <Button variant="outline" size="icon" onClick={chooseSource}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">输出目录</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="选择输出目录"
              />
              <Button variant="outline" size="icon" onClick={chooseTarget}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {source && target && source === target && (
            <p className="text-xs text-red-500">输入目录和输出目录不能相同</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              onSubmit({ name, source, target });
              onOpenChange(false);
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
