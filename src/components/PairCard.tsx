import { Folder, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import type { SyncPair } from "../lib/types";

interface Props {
  pair: SyncPair;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PairCard({ pair, onToggle, onEdit, onDelete }: Props) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Checkbox checked={pair.selected} onCheckedChange={(v) => onToggle(v === true)} />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-slate-800">{pair.name || "未命名目录对"}</div>
        <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{pair.source}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{pair.target}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
}
