// src/utils/storage.js
// Thin wrapper around localStorage so the rest of the app never touches
// window.localStorage directly (easier to test / swap out later).

const STORAGE_KEY = "chat_app_state_v1";

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load persisted chat state:", err);
    return null;
  }
}

export function persistState(state) {
  try {
    const toSave = {
      activeChatId: state.activeChatId,
      chatHistory: state.chatHistory,
      chatList: state.chatList,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn("Failed to persist chat state:", err);
  }
}

export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear persisted chat state:", err);
  }
}
