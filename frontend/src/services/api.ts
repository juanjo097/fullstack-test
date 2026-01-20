import { notify } from './toaster.service'

const API_BASE = "/api";

type ApiFieldErrors = Record<string, string[]>;

export type ApiResponse<T> = T | { data: T };

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T;
  meta: PaginationMeta;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: ApiFieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function tryRefresh(): Promise<boolean> {
  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!resp.ok) return false;

  const data = (await resp.json()) as {
    token: { accessToken: string; expiresAt: string };
  };
  localStorage.setItem("token", data.token.accessToken);
  return true;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retried: boolean = false,
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.headers) Object.assign(headers, options.headers);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // 204 No Content (logout case)
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Attempt to refresh only once, only if we had a token... and not for auth endpoints
  const shouldAttemptRefresh =
    response.status === 401 &&
    !!token &&
    !retried &&
    !endpoint.startsWith("/auth/");

  if (shouldAttemptRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(endpoint, options, true);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    throw new ApiError(401, "Session expired");
  }

  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || data?.error || "Request failed";
    notify.error(message);
    throw new ApiError(response.status, message, data?.fieldErrors);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

export const normalizeApiResponse = <T>(response: ApiResponse<T>) =>
  typeof response === 'object' && response !== null && 'data' in response ? response.data : response

export { ApiError };
