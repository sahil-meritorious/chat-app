// src/components/ChatHeader.jsx
import React from "react";
import { Sparkles, Sun, Moon, LogOut, PanelLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function ChatHeader({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="chat-header">
      <div className="chat-header__left">
        <button
          type="button"
          className="icon-button icon-button--mobile-only"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <div className="chat-header__identity">
          <div className="chat-header__avatar">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="chat-header__name">Assistant</p>
            <p className="chat-header__status">
              <span className="status-dot" aria-hidden="true" />
              Online
            </p>
          </div>
        </div>
      </div>

      <div className="chat-header__right">
        {user && (
          <span className="chat-header__user" title={user.email}>
            {user.email}
          </span>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={logout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
