// src/api/chatService.js
// Centralized API client for the chat backend.
import { getToken, clearToken, clearStoredUser } from "../utils/authStorage";

// Use ?? instead of || so an intentionally empty string (meaning "use the
// Vite dev proxy / same-origin requests") isn't overridden by the fallback.
const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500; // exponential backoff: 500ms, 1000ms, 2000ms

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines whether a failed request is worth retrying.
 * Network errors and 5xx server errors are retried.
 * 4xx client errors (bad request, not found, unauthorized) are not retried.
 */
function isRetryable(error) {
  if (error.isNetworkError) return true;
  if (error.status && error.status >= 500) return true;
  return false;
}

class ApiError extends Error {
  constructor(message, status, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Resolves a backend-relative path (e.g. an uploaded attachment path like
 * "/uploads/xyz.png") to a fetchable URL. Absolute URLs and blob/data URLs
 * (used for local previews before the server responds) pass through as-is.
 */
export function resolveAssetUrl(path) {
  if (!path) return path;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${BASE_URL}${path}`;
}

async function requestWithRetry(path, options = {}, retries = MAX_RETRIES) {
  const { skipAuth, ...fetchOptions } = options;
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
      const headers = { ...(fetchOptions.headers || {}) };
      if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      if (!skipAuth) {
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
      });

      if (response.status === 401 && !skipAuth) {
        // Token is missing/expired/invalid - clear it and let AuthContext
        // react (it listens for this event) so the user is sent to login.
        clearToken();
        clearStoredUser();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      if (!response.ok) {
        let detail = response.statusText;
        try {
          const body = await response.json();
          detail = body.detail || body.message || detail;
        } catch {
          // response body wasn't JSON, ignore
        }
        throw new ApiError(
          `Request failed (${response.status}): ${detail}`,
          response.status
        );
      }

      // Some endpoints could return no content
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      const error =
        err instanceof ApiError
          ? err
          : new ApiError(err.message || "Network error", null, true);

      lastError = error;

      if (attempt < retries && isRetryable(error)) {
        const delay = BASE_DELAY_MS * 2 ** attempt;
        await sleep(delay);
        attempt += 1;
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * Send a message to the AI agent.
 * @param {string} query
 * @param {{chatId?: number|string|null, imageFile?: File|null}} [options]
 * @returns {Promise<{chat_id: number, question_id: number, answer: string, tool_calls: Array, attachment_url: string|null}>}
 */
export function sendMessage(query, { chatId, imageFile } = {}) {
  const formData = new FormData();
  formData.append("query", query);
  if (chatId != null) formData.append("chat_id", chatId);
  if (imageFile) formData.append("image", imageFile);

  return requestWithRetry("/chat", {
    method: "POST",
    body: formData,
  });
}

/**
 * List all chat sessions for the current user.
 * @returns {Promise<Array<{chat_id: number, created_at: string, question_count: number, title: string|null}>>}
 */
export function listChats() {
  return requestWithRetry("/chats", { method: "GET" });
}

/**
 * Get full history for a single chat.
 * @param {number} chatId
 */
export function getChatHistory(chatId) {
  return requestWithRetry(`/chats/${chatId}`, { method: "GET" });
}

/**
 * Register a new account. Returns an access token + user, same shape as login.
 */
export function registerUser(email, password) {
  return requestWithRetry("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

/**
 * Log in with email/password. Returns { access_token, token_type, user }.
 */
export function loginUser(email, password) {
  return requestWithRetry("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

/** Fetch the currently authenticated user, validating the stored token. */
export function fetchMe() {
  return requestWithRetry("/auth/me", { method: "GET" });
}

export { ApiError };
