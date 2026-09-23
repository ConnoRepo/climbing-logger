import * as Crypto from "expo-crypto";

/** UUID v4, so records can be synced to a backend without re-keying. */
export function newId() {
  return Crypto.randomUUID();
}

export function now() {
  return new Date().toISOString();
}
