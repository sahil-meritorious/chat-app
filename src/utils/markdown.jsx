// src/utils/markdown.jsx
// A deliberately small markdown renderer covering the subset that AI
// answers typically use: code fences, inline code, bold/italic, links,
// and lists. Avoids pulling in a full markdown dependency for this.
import React from "react";

function renderInline(text, keyPrefix) {
  // Order matters: code spans first so we don't mangle markup inside them.
  const parts = [];
  let remaining = text;
  let key = 0;

  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/;

  while (remaining.length) {
    const match = remaining.match(pattern);
    if (!match) {
      parts.push(remaining);
      break;
    }
    const idx = match.index;
    if (idx > 0) parts.push(remaining.slice(0, idx));

    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(
        <code key={`${keyPrefix}-${key++}`} className="md-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={`${keyPrefix}-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={`${keyPrefix}-${key++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      parts.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }

    remaining = remaining.slice(idx + token.length);
  }

  return parts;
}

export function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(
        <ul className="md-list" key={`ul-${blocks.length}`}>
          {listBuffer.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3);
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      flushList();
      blocks.push(
        <pre className="md-code-block" key={`code-${blocks.length}`}>
          {lang && <span className="md-code-lang">{lang}</span>}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i += 1;
      continue;
    }

    // Bullet list item
    if (/^[-*]\s+/.test(line.trim())) {
      listBuffer.push(line.trim().replace(/^[-*]\s+/, ""));
      i += 1;
      continue;
    }

    flushList();

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${Math.min(level + 3, 6)}`; // keep visually subordinate
      blocks.push(
        React.createElement(
          Tag,
          { className: "md-heading", key: `h-${blocks.length}` },
          renderInline(headingMatch[2], `h-${blocks.length}`)
        )
      );
      i += 1;
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    blocks.push(
      <p className="md-paragraph" key={`p-${blocks.length}`}>
        {renderInline(line, `p-${blocks.length}`)}
      </p>
    );
    i += 1;
  }

  flushList();
  return blocks;
}
