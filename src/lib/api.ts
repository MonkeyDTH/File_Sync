import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { SyncPair, SyncProgress, SyncResult } from "./types";

export const listPairs = () => invoke<SyncPair[]>("list_pairs");

export const addPair = (name: string, source: string, target: string) =>
  invoke<SyncPair>("add_pair", { name, source, target });

export const updatePair = (pair: SyncPair) => invoke<void>("update_pair", { pair });

export const deletePair = (id: string) => invoke<void>("delete_pair", { id });

export const syncPairs = (pairIds: string[]) =>
  invoke<SyncResult[]>("sync_pairs", { pairIds: pairIds });

export const pickDirectory = async (): Promise<string | null> => {
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === "string" ? selected : null;
};

export const onSyncProgress = (handler: (progress: SyncProgress) => void) =>
  listen<SyncProgress>("sync-progress", (event) => handler(event.payload));
