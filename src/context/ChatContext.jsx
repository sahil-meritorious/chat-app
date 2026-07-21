// src/context/ChatContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { sendMessage, listChats, getChatHistory } from "../api/chatService";
import { loadPersistedState, persistState } from "../utils/storage";

const ChatContext = createContext(null);

const initialState = {
  activeChatId: null,
  // chatHistory[chatId] = { created_at, questions: [...] }
  chatHistory: {},
  // chatList = [{ chat_id, created_at, question_count }]
  chatList: [],
  // reactions[question_id] = "like" | "dislike"
  reactions: {},
  lastAddedId: null,
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload, error: null };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "START_NEW_CHAT":
      return { ...state, activeChatId: null, lastAddedId: null };

    case "SET_CHAT_LIST":
      return { ...state, chatList: action.payload };

    case "SET_ACTIVE_CHAT":
      return { ...state, activeChatId: action.payload };

    case "SET_CHAT_DETAIL": {
      const { chatId, created_at, questions } = action.payload;
      return {
        ...state,
        activeChatId: chatId,
        lastAddedId: null,
        chatHistory: {
          ...state.chatHistory,
          [chatId]: { created_at, questions },
        },
      };
    }

    // Optimistic local append for a brand-new (not-yet-persisted) chat,
    // or appending to an existing one before the server confirms the id.
    case "APPEND_LOCAL_EXCHANGE": {
      const { chatId, question } = action.payload;
      const existing = state.chatHistory[chatId] || {
        created_at: new Date().toISOString(),
        questions: [],
      };
      return {
        ...state,
        activeChatId: chatId,
        lastAddedId: question.question_id,
        chatHistory: {
          ...state.chatHistory,
          [chatId]: {
            ...existing,
            questions: [...existing.questions, question],
          },
        },
      };
    }

    case "UPDATE_EXCHANGE": {
      const { chatId, questionId, updates } = action.payload;
      const bucket = state.chatHistory[chatId];
      if (!bucket) return state;
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          [chatId]: {
            ...bucket,
            questions: bucket.questions.map((q) =>
              q.question_id === questionId ? { ...q, ...updates } : q
            ),
          },
        },
      };
    }

    case "SET_REACTION": {
      const { questionId, reaction } = action.payload;
      const current = state.reactions[questionId];
      const next = { ...state.reactions };
      if (current === reaction) {
        delete next[questionId]; // toggle off
      } else {
        next[questionId] = reaction;
      }
      return { ...state, reactions: next };
    }

    case "REMOVE_LAST_EXCHANGE": {
      const { chatId } = action.payload;
      const existing = state.chatHistory[chatId];
      if (!existing) return state;
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          [chatId]: {
            ...existing,
            questions: existing.questions.slice(0, -1),
          },
        },
      };
    }

    // Once the server confirms the real chat_id for a conversation that
    // started under the "pending" bucket, move its messages over so the
    // sidebar and subsequent questions attach to the same chat.
    case "COMMIT_CHAT_ID": {
      const { tempId, chatId } = action.payload;
      if (tempId === chatId || !state.chatHistory[tempId]) {
        return { ...state, activeChatId: chatId };
      }
      const nextHistory = { ...state.chatHistory };
      nextHistory[chatId] = nextHistory[tempId];
      delete nextHistory[tempId];
      return { ...state, activeChatId: chatId, chatHistory: nextHistory };
    }

    case "HYDRATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const persisted = loadPersistedState();
    return persisted ? { ...init, ...persisted } : init;
  });

  // Persist relevant slices of state whenever they change.
  useEffect(() => {
    persistState(state);
  }, [state.activeChatId, state.chatHistory, state.chatList, state.reactions]);

  const refreshChatList = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const chats = await listChats();
      dispatch({ type: "SET_CHAT_LIST", payload: chats });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const loadChat = useCallback(async (chatId) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const detail = await getChatHistory(chatId);
      dispatch({
        type: "SET_CHAT_DETAIL",
        payload: {
          chatId: detail.chat_id,
          created_at: detail.created_at,
          questions: detail.questions,
        },
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const startNewChat = useCallback(() => {
    dispatch({ type: "START_NEW_CHAT" });
  }, []);

  /**
   * Sends a message, optionally with an image attachment. The first message
   * of a session starts a new chat server-side (chat_id omitted); every
   * later message in the same session passes the known chat_id so the
   * conversation keeps accumulating questions in one chat instead of each
   * question spawning its own. We track the "pending" local conversation
   * under activeChatId === null until the server assigns a real chat_id.
   */
  const ask = useCallback(
    async (queryText, imageFile) => {
      dispatch({ type: "SET_LOADING", payload: true });
      // Create an optimistic local question (no answer yet) so the UI can
      // immediately show the "Thinking" state. We'll update this entry
      // when the backend response arrives.
      const localId = `local-${Date.now()}`;
      const localPreviewUrl = imageFile ? URL.createObjectURL(imageFile) : null;
      const localQuestion = {
        question_id: localId,
        question_text: queryText,
        answer: "",
        created_at: new Date().toISOString(),
        tools_used: [],
        tool_calls: [],
        attachment_url: localPreviewUrl,
      };

      const bucketId = state.activeChatId ?? "pending";
      dispatch({
        type: "APPEND_LOCAL_EXCHANGE",
        payload: { chatId: bucketId, question: localQuestion },
      });

      try {
        const result = await sendMessage(queryText, {
          chatId: state.activeChatId,
          imageFile,
        });

        // Move the pending bucket over to the real chat_id (a no-op once
        // the conversation already has one).
        dispatch({
          type: "COMMIT_CHAT_ID",
          payload: { tempId: bucketId, chatId: result.chat_id },
        });

        // Patch the optimistic entry with the real answer and tool calls.
        dispatch({
          type: "UPDATE_EXCHANGE",
          payload: {
            chatId: result.chat_id,
            questionId: localId,
            updates: {
              answer: result.answer,
              tools_used: (result.tool_calls || []).map((tc) => tc.tool_name),
              tool_calls: result.tool_calls || [],
              attachment_url: result.attachment_url || localPreviewUrl,
            },
          },
        });

        // Sync with backend truth so the sidebar counts/titles are accurate.
        await refreshChatList();

        return result;
      } catch (err) {
        // Remove the optimistic exchange on error
        dispatch({ type: "REMOVE_LAST_EXCHANGE", payload: { chatId: bucketId } });
        dispatch({ type: "SET_ERROR", payload: err.message });
        throw err;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.activeChatId, refreshChatList]
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const react = useCallback((questionId, reaction) => {
    dispatch({ type: "SET_REACTION", payload: { questionId, reaction } });
  }, []);

  /** Re-asks the most recent question in the active conversation. */
  const regenerate = useCallback(async () => {
    const bucketId = state.activeChatId ?? "pending";
    const bucket = state.chatHistory[bucketId];
    const last = bucket?.questions?.[bucket.questions.length - 1];
    if (!last) return;

    dispatch({ type: "REMOVE_LAST_EXCHANGE", payload: { chatId: bucketId } });
    await ask(last.question_text);
  }, [state.activeChatId, state.chatHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    ...state,
    refreshChatList,
    loadChat,
    startNewChat,
    ask,
    clearError,
    react,
    regenerate,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
