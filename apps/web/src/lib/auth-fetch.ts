const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("o3l_access_token");
}

/**
 * Exchange the stored refresh token for a new access token.
 * The API rotates refresh tokens, so both tokens are persisted.
 * Concurrent callers share one in-flight refresh request.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = localStorage.getItem("o3l_refresh_token");
      if (!refresh) return null;
      try {
        const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.access) localStorage.setItem("o3l_access_token", data.access);
        if (data.refresh) localStorage.setItem("o3l_refresh_token", data.refresh);
        return data.access || null;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * fetch() with Bearer auth and one automatic retry after a token refresh on 401.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const send = async () => {
    const headers = new Headers(init.headers);
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body == null && !headers.has("Content-Type") && init.method && init.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...init, headers });
  };

  let res = await send();
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await send();
  }
  return res;
}
