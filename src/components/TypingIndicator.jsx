// src/components/TypingIndicator.jsx
import React from "react";
import { Sparkles } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="message-row message-row--assistant" aria-hidden="false">
      <div className="avatar avatar--assistant">
        <Sparkles size={15} />
      </div>
      <div className="typing-indicator" role="status" aria-live="polite">
        <span className="sr-only">Assistant is typing</span>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
