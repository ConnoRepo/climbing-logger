import * as Network from "expo-network";
import { useEffect, useState, type Dispatch } from "react";
import { AppState } from "react-native";

import { ensureUser, pullSince, push, setAutoRefresh } from "@/data/remote";
import { loadSyncState, saveSyncState } from "@/data/storage";
import {
  NEW_SYNC_STATE,
  hasChanges,
  markSynced,
  pendingChanges,
  unseenChanges,
  type SyncState,
} from "@/data/sync";
import type { AppData } from "@/data/types";

import type { Action } from "./reducer";

/** How long edits settle before they're sent: longer than the local save, so typing a note doesn't send every letter. */
const PUSH_DELAY_MS = 2000;

/**
 * Keeps the server in step with the device: after edits, when the internet comes back and when
 * the app returns to the foreground, pushes what changed and then pulls what changed elsewhere.
 * Never blocks the UI; a failed sync just waits for the next one.
 */
export function useSync(data: AppData, dispatch: Dispatch<Action>, hydrated: boolean) {
  const [{ sync, setData }] = useState(() => createSyncer(dispatch));

  useEffect(() => {
    if (!hydrated) return;
    setData(data);
    const id = setTimeout(sync, PUSH_DELAY_MS);
    return () => clearTimeout(id);
  }, [data, hydrated, sync, setData]);

  useEffect(() => {
    if (!hydrated) return;
    const network = Network.addNetworkStateListener(({ isInternetReachable }) => {
      if (isInternetReachable) sync();
    });
    const app = AppState.addEventListener("change", (state) => {
      setAutoRefresh(state === "active");
      if (state === "active") sync();
    });
    return () => {
      network.remove();
      app.remove();
    };
  }, [hydrated, sync]);
}

/** One sync at a time; a call made while one runs is folded into a second pass once it's done. */
function createSyncer(dispatch: Dispatch<Action>) {
  /** The device's data as of the last render, which is what gets pushed. */
  let data: AppData | null = null;
  let state: SyncState | null = null;
  let running = false;
  let again = false;

  async function syncOnce() {
    if (!data) return;
    const { isInternetReachable } = await Network.getNetworkStateAsync();
    if (isInternetReachable === false) return;

    state ??= await loadSyncState();
    const userId = await ensureUser();
    if (state.userId !== userId) state = { ...NEW_SYNC_STATE, userId };

    const pending = pendingChanges(data, state.synced);
    if (hasChanges(pending)) {
      await push(pending);
      state = { ...state, synced: markSynced(state.synced, pending) };
      await saveSyncState(state);
    }

    const pulled = await pullSince(state.cursor);
    // Only rows new to the device: dispatching the rest would change data and trigger another sync.
    const incoming = unseenChanges(pulled.changes, state.synced);
    if (hasChanges(incoming)) dispatch({ type: "sync/pull", changes: incoming });
    state = { ...state, cursor: pulled.cursor, synced: markSynced(state.synced, incoming) };
    await saveSyncState(state);
  }

  function setData(next: AppData) {
    data = next;
  }

  async function sync() {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } catch (e) {
      console.warn("Sync failed", e);
    } finally {
      running = false;
    }
  }

  return { sync, setData };
}
