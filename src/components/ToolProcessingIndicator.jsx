// src/components/ToolProcessingIndicator.jsx
import React, { useEffect, useState } from "react";
import { Globe, Brain, Database, Calculator, FileText, Wrench } from "lucide-react";

const TOOL_STATUS = {
  web_search: { icon: Globe, text: "Searching the web" },
  llm: { icon: Brain, text: "Thinking" },
  database: { icon: Database, text: "Querying database" },
  calculator: { icon: Calculator, text: "Calculating" },
  rag: { icon: FileText, text: "Reading documents" },
};

function statusFor(tool) {
  // Normalize tool name and map common variants to our known statuses
  let key = (tool || "").toLowerCase();

  if (key.includes("web") || key.includes("search")) key = "web_search";
  if (key.includes("llm") || key.includes("assistant")) key = "llm";
  if (key.includes("database") || key.includes("db")) key = "database";
  if (key.includes("calc") || key.includes("calculate") || key.includes("currency")) key = "calculator";
  if (key.includes("rag") || key.includes("read") || key.includes("document")) key = "rag";

  return TOOL_STATUS[key] || { icon: Wrench, text: `${tool}` };
}

// Duration to show the tools-used indicator after a response arrives
const ANIMATION_DURATION_MS = 3000;

/**
 * Shows a sequential "Searching the web…", "Calculating…" etc. indicator,
 * one step per tool that was actually used, before the answer is revealed.
 * If no tools were used, shows a single generic "Thinking…" step so there's
 * still a moment of visible processing.
 * Once the animation completes, the response is shown while keeping tool icons visible below.
 */
export default function ToolProcessingIndicator({ tools, onComplete, responseGenerated }) {
  const steps = tools && tools.length ? tools : [];
  const [showTools, setShowTools] = useState(false);

  // Show tool-specific UI for a short duration once response is available
  useEffect(() => {
    if (!responseGenerated) return undefined;

    // If there are tools, show them; otherwise show LLM briefly.
    setShowTools(true);
    const timer = setTimeout(() => {
      setShowTools(false);
      onComplete();
    }, ANIMATION_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseGenerated]);

  // While waiting for the backend to generate a response, show a Brain "Thinking" state.
  if (!responseGenerated) {
    const { icon: Icon, text } = statusFor("llm");
    return (
      <div className="message-row message-row--assistant">
        <div className="avatar avatar--assistant">
          <Icon size={15} />
        </div>
        <div className="tool-processing" role="status" aria-live="polite">
          <Icon size={14} className="tool-processing__icon" />
          <span className="tool-processing__text">{text}…</span>
          <span className="tool-processing__dots">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        </div>
      </div>
    );
  }

  // When response arrives and we are showing tools, render the first tool's
  // icon and mapped text (no "Using:" prefix) — e.g. "Searching the web…".
  if (showTools) {
    const chosen = steps[0] || "llm";
    const { icon: Icon, text } = statusFor(chosen);
    return (
      <div className="message-row message-row--assistant">
        <div className="avatar avatar--assistant">
          <Icon size={15} />
        </div>
        <div className="tool-processing" role="status" aria-live="polite">
          <Icon size={14} className="tool-processing__icon" />
          <span className="tool-processing__text">{text}…</span>
          <span className="tool-processing__dots">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        </div>
      </div>
    );
  }

  return null;
}