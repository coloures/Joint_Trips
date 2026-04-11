const API_BASE = 'http://127.0.0.1:8001';
export const request = async <T>(path: string, init?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
};