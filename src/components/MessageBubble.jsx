// src/components/MessageBubble.jsx
import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, User, Sparkles } from "lucide-react";
import ToolBadge from "./ToolBadge";
import ToolProcessingIndicator from "./ToolProcessingIndicator";
import { formatTimestamp } from "../utils/formatDate";
import { renderMarkdown } from "../utils/markdown";
import { useChat } from "../context/ChatContext";
import { useToast } from "../context/ToastContext";
import { resolveAssetUrl } from "../api/chatService";

const WORD_DELAY_MS = 35;

export default function MessageBubble({ exchange, isLast }) {
  const {
    question_id,
    question_text,
    answer,
    tools_used = [],
    created_at,
    attachment_url,
  } = exchange;
  const { reactions, react, regenerate, lastAddedId } = useChat();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  // Only the message that was just added gets the tool-processing +
  // typewriter treatment. Anything loaded from history renders instantly.
  const isNew = question_id === lastAddedId;
  const [phase, setPhase] = useState(isNew ? "tools" : "done"); // tools -> typing -> done

  // Split on whitespace but keep the whitespace tokens so spacing/newlines
  // are preserved when we reveal word by word.
  const words = answer ? answer.split(/(\s+)/) : [];
  const [visibleWordCount, setVisibleWordCount] = useState(isNew ? 0 : words.length);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (phase !== "typing") return undefined;
    intervalRef.current = setInterval(() => {
      setVisibleWordCount((count) => {
        if (count >= words.length) {
          clearInterval(intervalRef.current);
          setPhase("done");
          return count;
        }
        return count + 1;
      });
    }, WORD_DELAY_MS);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleToolsComplete = () => setPhase("typing");

  const displayedAnswer =
    phase === "typing" ? words.slice(0, visibleWordCount).join("") : answer;

  const reaction = reactions[question_id];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — try selecting the text manually");
    }
  };

  const handleReact = (type) => react(question_id, type);

  return (
    <div className="exchange">
      <div className="message-row message-row--user">
        <div className="bubble bubble--user">
          {attachment_url && (
            <img
              className="bubble__attachment"
              src={resolveAssetUrl(attachment_url)}
              alt="Attached"
            />
          )}
          {question_text && <p className="bubble__text">{question_text}</p>}
        </div>
        <div className="avatar avatar--user">
          <User size={15} />
        </div>
      </div>

      {phase === "tools" ? (
        <ToolProcessingIndicator
          tools={tools_used}
          onComplete={handleToolsComplete}
          responseGenerated={!!answer}
        />
      ) : (
        <div className="message-row message-row--assistant">
          <div className="avatar avatar--assistant">
            <Sparkles size={15} />
          </div>
          <div className="bubble bubble--assistant">
            <div className="bubble__markdown">
              {phase === "typing" ? (
                <p className="md-paragraph typewriter-text">
                  {displayedAnswer}
                  <span className="typewriter-cursor" />
                </p>
              ) : (
                renderMarkdown(answer)
              )}
            </div>

            {phase === "done" && tools_used.length > 0 && (
              <div className="tool-list" role="list" aria-label="Tools used">
                {tools_used.map((tool, idx) => (
                  <ToolBadge key={`${tool}-${idx}`} name={tool} />
                ))}
              </div>
            )}

            {phase === "done" && (
              <div className="bubble__footer">
                {created_at && (
                  <time className="bubble__time" dateTime={created_at}>
                    {formatTimestamp(created_at)}
                  </time>
                )}
                <div className="bubble__actions" role="group" aria-label="Message actions">
                  <button
                    type="button"
                    className="action-button"
                    onClick={handleCopy}
                    aria-label="Copy response"
                    title="Copy"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  {isLast && (
                    <button
                      type="button"
                      className="action-button"
                      onClick={regenerate}
                      aria-label="Regenerate response"
                      title="Regenerate"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={"action-button" + (reaction === "like" ? " action-button--active" : "")}
                    onClick={() => handleReact("like")}
                    aria-pressed={reaction === "like"}
                    aria-label="Like response"
                    title="Like"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type="button"
                    className={"action-button" + (reaction === "dislike" ? " action-button--active" : "")}
                    onClick={() => handleReact("dislike")}
                    aria-pressed={reaction === "dislike"}
                    aria-label="Dislike response"
                    title="Dislike"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}