// The Claude API key lives in localStorage only — never hardcoded, never
// committed, never sent anywhere but directly to Anthropic's API from this
// device's browser.
const STORAGE_KEY = "budget_app_anthropic_api_key";

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.length > 0;
}
