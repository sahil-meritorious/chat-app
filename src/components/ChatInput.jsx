// src/components/ChatInput.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, ArrowUp, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";

const DEBOUNCE_MS = 400;
const MAX_HEIGHT_PX = 200;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB, mirrors the backend limit

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastSentRef = useRef(0);
  const toast = useToast();

  // Auto-expand the textarea as content grows, capped at MAX_HEIGHT_PX.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  // Release the object URL whenever the preview changes or the input unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const submit = useCallback(() => {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed && !imageFile) return;

    const now = Date.now();
    if (now - lastSentRef.current < DEBOUNCE_MS) return;
    lastSentRef.current = now;

    onSend(trimmed || "Describe this image.", imageFile);
    setValue("");
    clearImage();
  }, [value, imageFile, disabled, onSend, clearImage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only image files (PNG, JPEG, GIF, WEBP) can be attached");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5MB");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  return (
    <div className="chat-input-wrap">
      {previewUrl && (
        <div className="chat-input__preview">
          <img src={previewUrl} alt="Attached" />
          <button
            type="button"
            className="chat-input__preview-remove"
            onClick={clearImage}
            aria-label="Remove attached image"
            title="Remove image"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          className={"chat-input__attach" + (imageFile ? " chat-input__attach--active" : "")}
          onClick={handleAttachClick}
          aria-label="Attach an image"
          title="Attach an image"
        >
          {imageFile ? <ImageIcon size={17} /> : <Paperclip size={17} />}
        </button>

        <label htmlFor="chat-message-input" className="sr-only">
          Type your message
        </label>
        <textarea
          id="chat-message-input"
          ref={textareaRef}
          className="chat-input__field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={imageFile ? "Ask something about this image…" : "Message the assistant…"}
          rows={1}
          disabled={disabled}
          aria-disabled={disabled}
        />

        <button
          type="submit"
          className="chat-input__send"
          disabled={disabled || (!value.trim() && !imageFile)}
          aria-label="Send message"
        >
          <ArrowUp size={17} strokeWidth={2.5} />
        </button>
      </form>
      <p className="chat-input__hint">
        Enter to send · Shift+Enter for a new line · Images only for attachments
      </p>
    </div>
  );
}
