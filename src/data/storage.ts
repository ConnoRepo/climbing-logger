import AsyncStorage from "@react-native-async-storage/async-storage";

import { NEW_SYNC_STATE, type SyncState } from "./sync";
import type { AppData } from "./types";

/**
 * Where data lives on the device: the app's data, and how far it has synced with the server
 * (remote.ts). The app always loads from here first, so it opens instantly and works offline.
 *
 * Bump SCHEMA_VERSION whenever AppData changes shape: saved data from another version is dropped
 * and the app starts from the seed. The sync state goes with it, so rows already on the server
 * come back on the next pull and nothing is taken for deleted; edits that never synced are lost.
 */
const KEY = "climbing-app/state";
const SYNC_KEY = "climbing-app/sync";
const SCHEMA_VERSION = 7;

type Stored<T> = { schemaVersion: number; data: T };

async function load<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored<T>;
    return stored.schemaVersion === SCHEMA_VERSION ? stored.data : null;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return null;
  }
}

async function save<T>(key: string, data: T) {
  try {
    const stored: Stored<T> = { schemaVersion: SCHEMA_VERSION, data };
    await AsyncStorage.setItem(key, JSON.stringify(stored));
  } catch (e) {
    console.warn(`Failed to save ${key}`, e);
  }
}

export const loadState = () => load<AppData>(KEY);
export const saveState = (data: AppData) => save(KEY, data);

export async function loadSyncState(): Promise<SyncState> {
  return (await load<SyncState>(SYNC_KEY)) ?? NEW_SYNC_STATE;
}
export const saveSyncState = (sync: SyncState) => save(SYNC_KEY, sync);
