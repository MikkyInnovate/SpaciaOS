import { ApiError, AuthenticationError, ForbiddenError, NotFoundError, NetworkError } from "./errors";

export interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  workspaceId?: string;
  token?: string;
}

const DEFAULT_TIMEOUT_MS = 15000;

class ApiClient {
  private activeWorkspaceId: string | null = null;
  private authToken: string | null = null;
  private tokenProvider: (() => Promise<string | null>) | null = null;

  public setWorkspaceId(workspaceId: string) {
    this.activeWorkspaceId = workspaceId;
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public setTokenProvider(provider: (() => Promise<string | null>) | null) {
    this.tokenProvider = provider;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let resolvedToken = options.token;
    if (!resolvedToken && this.tokenProvider) {
      try {
        const dynamicToken = await this.tokenProvider();
        if (dynamicToken) resolvedToken = dynamicToken;
      } catch {
        // Fall back to stored static token
      }
    }
    if (!resolvedToken && this.authToken) {
      resolvedToken = this.authToken;
    }

    const {
      workspaceId = this.activeWorkspaceId,
      token = resolvedToken,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customHeaders,
    };

    if (workspaceId) {
      headers["X-Workspace-Id"] = workspaceId;
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Response body was not JSON
        }

        const message =
          (typeof errorData.message === "string" ? errorData.message : null) ||
          (typeof errorData.error?.message === "string" ? errorData.error.message : null) ||
          (typeof errorData.error === "string" ? errorData.error : null) ||
          `HTTP request failed (${response.status})`;

        switch (response.status) {
          case 401:
            throw new AuthenticationError(message);
          case 403:
            throw new ForbiddenError(message);
          case 404:
            throw new NotFoundError(message);
          default:
            throw new ApiError(message, response.status, errorData);
        }
      }

      if (response.status === 204) {
        return null as unknown as T;
      }

      const json = await response.json();
      if (
        json &&
        typeof json === "object" &&
        json.success === true &&
        "data" in json
      ) {
        return json.data as T;
      }
      return json as T;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new NetworkError("Request timed out. Please try again.");
      }
      throw new NetworkError(err instanceof Error ? err.message : "Network error occurred");
    }
  }

  public get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  public post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
