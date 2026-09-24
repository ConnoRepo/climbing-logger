import AsyncStorage from "@react-native-async-storage/async-storage";

import { migrate } from "./migrate";
import type { AppData } from "./types";

/**
 * The only module that knows where data lives. Swap this for backend sync
 * later; bump SCHEMA_VERSION and add a step to migrate() when AppData changes shape.
 */
const KEY = "climbing-app/state";
const SCHEMA_VERSION = 3;

type Stored = { schemaVersion: number; data: AppData };

export async function loadState(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (stored.schemaVersion > SCHEMA_VERSION) return null;
    return migrate(stored.data, stored.schemaVersion);
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
