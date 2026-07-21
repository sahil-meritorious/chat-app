// src/App.jsx
import React, { useEffect, useState } from "react";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import ChatHistoryViewer from "./components/ChatHistoryViewer";
import AuthScreen from "./components/AuthScreen";
import { Loader2, Sparkles } from "lucide-react";
import "./App.css";

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Drives the page-level fade-in on first mount.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={"app" + (mounted ? " app--mounted" : "")}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app__main">
        <ChatHeader onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <ChatHistoryViewer />
      </div>
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, checking } = useAuth();

  if (checking) {
    return (
      <div className="app-loading">
        <Sparkles size={22} />
        <Loader2 size={18} className="spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
