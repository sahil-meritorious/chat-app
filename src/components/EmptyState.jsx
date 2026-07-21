// src/components/EmptyState.jsx
import React from "react";
import { Sparkles, Search, Calculator, Database } from "lucide-react";

const SUGGESTIONS = [
  { icon: Search, text: "What were the top AI news stories this week?" },
  { icon: Calculator, text: "Convert 250 USD to EUR at today's rate" },
  { icon: Database, text: "Summarize the records in my customers table" },
  { icon: Sparkles, text: "Explain how transformer attention works" },
];

export default function EmptyState({ onPick }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Sparkles size={26} />
      </div>
      <h2 className="empty-state__title">How can I help you today?</h2>
      <p className="empty-state__subtitle">
        Ask a question, search the web, or pull from your data — I'll pick the
        right tool automatically.
      </p>
      <div className="empty-state__suggestions">
        {SUGGESTIONS.map(({ icon: Icon, text }, idx) => (
          <button
            key={idx}
            type="button"
            className="suggestion-card"
            onClick={() => onPick(text)}
          >
            <Icon size={16} />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
