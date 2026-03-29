/**
 * Test Mode Utility
 * Controls whether the app reads/writes to the test KV namespace (test_ prefix)
 * or the production namespace. Auth and user data are always shared.
 */

const STORAGE_KEY = "andersen_env_mode";

// Module-level variable — read at fetch-call time, not render time
let _testMode: boolean = localStorage.getItem(STORAGE_KEY) === "test";

export function isTestMode(): boolean {
  return _testMode;
}

export function setTestMode(value: boolean): void {
  _testMode = value;
  localStorage.setItem(STORAGE_KEY, value ? "test" : "production");
  // Dispatch custom event so React components can react
  window.dispatchEvent(new CustomEvent("envModeChange", { detail: { testMode: value } }));
}

export function toggleTestMode(): boolean {
  const next = !_testMode;
  setTestMode(next);
  return next;
}

export function getEnvLabel(): "TEST" | "PRODUCTION" {
  return _testMode ? "TEST" : "PRODUCTION";
}
