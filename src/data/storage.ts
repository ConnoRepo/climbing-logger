import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppData } from "./types";

/**
 * The only module that knows where data lives. Swap this for backend sync later.
 * Bump SCHEMA_VERSION whenever AppData changes shape: saved data from another
 * version is dropped and the app starts from the seed (there's no real data yet).
 */
const KEY = "climbing-app/state";
const SCHEMA_VERSION = 7;

type Stored = { schemaVersion: number; data: AppData };

export async function loadState(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    return stored.schemaVersion === SCHEMA_VERSION ? stored.data : null;
  } catch (e) {
    console.warn("Failed to load saved data", e);
    return null;
  }
}

export async function saveState(data: AppData) {
  try {
    const stored: Stored = { schemaVersion: SCHEMA_VERSION, data };
    await AsyncStorage.setItem(KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn("Failed to save data", e);
  }
}
