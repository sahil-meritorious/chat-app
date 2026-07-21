// src/components/Sidebar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, MessageSquare, X } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { formatTimestamp, truncate } from "../utils/formatDate";
import { SidebarSkeleton } from "./SkeletonLoader";

export default function Sidebar({ open, onClose }) {
  const {
    chatList,
    chatHistory,
    activeChatId,
    loading,
    refreshChatList,
    loadChat,
    startNewChat,
  } = useChat();

  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    refreshChatList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl/Cmd + K focuses search, per the requested keyboard shortcuts.
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const previewFor = (chatId) => {
    const detail = chatHistory[chatId];
    const firstQuestion = detail?.questions?.[0]?.question_text;
    return firstQuestion ? truncate(firstQuestion, 50) : "New conversation";
  };

  const filteredChats = useMemo(() => {
    if (!query.trim()) return chatList;
    const lower = query.toLowerCase();
    return chatList.filter((chat) => {
      const preview = previewFor(chat.chat_id).toLowerCase();
      return preview.includes(lower);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, chatList, chatHistory]);

  const handleSelect = (chatId) => {
    loadChat(chatId);
    onClose?.();
  };

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <nav
        id="app-sidebar"
        className={"sidebar" + (open ? " sidebar--open" : "")}
        aria-label="Chat history"
      >
        <div className="sidebar__header">
          <button
            type="button"
            className="new-chat-button"
            onClick={() => {
              startNewChat();
              onClose?.();
            }}
          >
            <Plus size={16} />
            New chat
          </button>
          <button
            type="button"
            className="icon-button icon-button--mobile-only"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar__search">
          <Search size={15} className="sidebar__search-icon" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search conversations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search conversations"
          />
          <kbd className="sidebar__search-kbd">⌘K</kbd>
        </div>

        <div className="sidebar__list-wrap">
          {loading && chatList.length === 0 && <SidebarSkeleton />}

          {!loading && filteredChats.length === 0 && (
            <p className="sidebar__status">
              {query ? "No matching conversations." : "No conversations yet."}
            </p>
          )}

          <ul className="sidebar__list">
            {filteredChats.map((chat) => (
              <li key={chat.chat_id}>
                <button
                  type="button"
                  className={
                    "sidebar__item" +
                    (chat.chat_id === activeChatId ? " sidebar__item--active" : "")
                  }
                  onClick={() => handleSelect(chat.chat_id)}
                  aria-current={chat.chat_id === activeChatId ? "true" : undefined}
                >
                  <MessageSquare size={15} className="sidebar__item-icon" />
                  <span className="sidebar__item-body">
                    <span className="sidebar__item-row">
                      <span className="sidebar__item-preview">
                        {previewFor(chat.chat_id)}
                      </span>
                      <span className="sidebar__item-date">
                        {formatTimestamp(chat.created_at)}
                      </span>
                    </span>
                    <span className="sidebar__item-count">
                      {chat.question_count}{" "}
                      {chat.question_count === 1 ? "message" : "messages"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
