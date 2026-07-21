// src/components/ChatHistoryViewer.jsx
import React, { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useToast } from "../context/ToastContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
// TypingIndicator (bubble loader) intentionally omitted — we show a
// simplified thinking indicator inside the message bubble while the
// response is being generated.
import EmptyState from "./EmptyState";

// Remembers scroll position per chat so switching conversations doesn't
// always dump you at the bottom of a long thread.
const scrollPositions = new Map();

export default function ChatHistoryViewer() {
  const { activeChatId, chatHistory, loading, ask, error, clearError } = useChat();
  const toast = useToast();
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const prevBucketRef = useRef(null);

  const bucketKey = activeChatId ?? "pending";
  const questions = chatHistory[bucketKey]?.questions || [];

  // Surface API errors as toasts in addition to any inline banner state.
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Save scroll position when leaving a chat, restore (or scroll to bottom
  // for new content) when entering one.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (prevBucketRef.current && prevBucketRef.current !== bucketKey) {
      scrollPositions.set(prevBucketRef.current, container.scrollTop);
    }

    const saved = scrollPositions.get(bucketKey);
    if (saved != null) {
      container.scrollTop = saved;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }

    prevBucketRef.current = bucketKey;
  }, [bucketKey]);

  // Auto-scroll to the latest message as new ones arrive in the active chat.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions.length, loading]);

  const handleSend = (text, imageFile) => {
    ask(text, imageFile).catch(() => {
      /* surfaced via toast above */
    });
  };
  useEffect(() => {
  const container = scrollRef.current;
  if (!container) return undefined;
  const observer = new MutationObserver(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  });
  observer.observe(container, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}, [bucketKey]);

  return (
    <section className="chat-viewer" aria-label="Conversation">
      <div className="chat-viewer__messages" ref={scrollRef}>
        {questions.length === 0 && !loading && (
          <EmptyState onPick={handleSend} />
        )}

        {questions.map((q, idx) => (
          <MessageBubble
            key={q.question_id}
            exchange={q}
            isLast={idx === questions.length - 1 && !loading}
          />
        ))}

        {/* Removed bubble typing indicator; ToolProcessingIndicator inside
          `MessageBubble` will show a simple "Thinking" state while the
          backend generates the response. */}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </section>
  );
}
