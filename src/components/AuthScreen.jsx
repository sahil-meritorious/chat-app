// src/components/AuthScreen.jsx
import React, { useState } from "react";
import { Sparkles, Mail, Lock, Loader2, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AuthScreen() {
  const { login, register, loading, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isRegister = mode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch {
      // surfaced via `error` from context
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    clearError();
  };

  return (
    <div className="auth-screen">
      <button
        type="button"
        className="icon-button auth-screen__theme"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
      </button>

      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="chat-header__avatar auth-card__avatar">
            <Sparkles size={18} />
          </div>
          <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isRegister
              ? "Sign up to start chatting with the assistant."
              : "Sign in to continue your conversations."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <div className="auth-field__input">
              <Mail size={15} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-field__input">
              <Lock size={15} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </div>
          </label>

          {isRegister && (
            <p className="auth-hint">Must be at least 8 characters.</p>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" onClick={switchMode}>
            {isRegister ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
