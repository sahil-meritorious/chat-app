// src/components/ToolBadge.jsx
import React from "react";
import { Globe, Brain, Database, Calculator, FileText, Wrench } from "lucide-react";

const TOOL_META = {
  web_search: { label: "Web Search", icon: Globe, className: "tool-badge--web" },
  llm: { label: "LLM", icon: Brain, className: "tool-badge--llm" },
  database: { label: "Database", icon: Database, className: "tool-badge--db" },
  calculator: { label: "Calculator", icon: Calculator, className: "tool-badge--calc" },
  rag: { label: "RAG", icon: FileText, className: "tool-badge--rag" },
};

function metaFor(toolName) {
  const key = (toolName || "").toLowerCase().replace(/\s+/g, "_");
  return (
    TOOL_META[key] || {
      label: toolName,
      icon: Wrench,
      className: "tool-badge--default",
    }
  );
}

export default function ToolBadge({ name }) {
  const { label, icon: Icon, className } = metaFor(name);

  return (
    <span className={`tool-badge ${className}`} role="listitem" title={`Used: ${label}`}>
      <Icon size={12} strokeWidth={2.25} />
      {label}
      <span className="tool-badge__tooltip" role="tooltip">
        Used the {label} tool to help answer
      </span>
    </span>
  );
}
