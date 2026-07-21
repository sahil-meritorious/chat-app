# Chat History Frontend

A modern, ChatGPT/Claude-style chat interface (React + Vite) that talks to a backend exposing:

- `POST /chat` — send a message, get back an answer + tool calls
- `GET /chats` — list all chat sessions
- `GET /chats/{chat_id}` — full history for one chat

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL, or leave empty to use the Vite dev proxy
npm run dev
```

## Structure

```
src/
  api/chatService.js          fetch wrapper, retry w/ exponential backoff
  context/
    ChatContext.jsx           reducer-based global state, persistence, reactions, regenerate
    ThemeContext.jsx          light/dark mode, persisted + respects system preference
    ToastContext.jsx          success/error/info toast notifications
  utils/
    storage.js                localStorage read/write helpers
    formatDate.js              timestamp formatting, text truncation
    markdown.jsx               small markdown -> React renderer (code, bold, links, lists)
  components/
    Sidebar.jsx                search, new chat, skeleton loading, collapsible on mobile
    ChatHeader.jsx              assistant identity, online status, theme toggle, settings
    ChatHistoryViewer.jsx       message list, scroll position memory, auto-scroll
    MessageBubble.jsx           avatars, markdown rendering, copy/regenerate/like/dislike
    ChatInput.jsx                auto-expanding textarea, attach button, gradient send
    ToolBadge.jsx                icon + color-coded pill per tool, hover tooltip
    TypingIndicator.jsx          animated dot indicator while the assistant responds
    EmptyState.jsx               suggested prompts on a fresh conversation
    SkeletonLoader.jsx           shimmering placeholder rows for the sidebar
  App.jsx / App.css             layout shell, theme tokens, responsive styles, animations
```

## Design notes

- **Visual language**: neutral light/dark surfaces with an indigo-to-violet gradient accent,
  used for the send button, user bubbles, avatars, and active states — kept to one accent so
  it reads as a deliberate choice rather than a rainbow of UI chrome.
- **Tool badges** are color-coded per tool family (web search = blue, LLM = violet,
  database = green, calculator = amber, RAG = rose) with an icon and a hover tooltip
  explaining what was used.
- **Markdown** is rendered with a small first-party renderer (code fences, inline code,
  bold/italic, links, bullet lists, headings) rather than pulling in a heavy dependency.
- **Animations**: page fade-in on mount, sidebar slide-in, per-message fade-up, animated
  typing dots, shimmering skeleton rows while chats load, smooth auto-scroll to the latest
  message, and toast slide-ins. All respect `prefers-reduced-motion`.
- **Scroll position** per conversation is remembered in memory so switching chats in the
  sidebar doesn't always dump you back at the top or bottom.
- **Keyboard shortcuts**: `Enter` sends, `Shift+Enter` inserts a newline, `Ctrl/Cmd+K`
  focuses the sidebar search.

## Notes on behavior

- **New chat per session.** The `/chat` API doesn't accept a `chat_id` in
  the request, so the backend is the source of truth for when a new chat_id
  is created. The frontend keeps messages sent before that's confirmed in a
  local `"pending"` bucket, then calls `GET /chats` after every response to
  reconcile real chat ids, counts, and ordering.
- **Retry logic** lives in `chatService.js`: network errors and 5xx
  responses are retried up to 3 times with exponential backoff (500ms,
  1000ms, 2000ms). 4xx errors (bad request, not found) fail immediately
  since retrying won't help.
- **Persistence.** `activeChatId`, `chatHistory`, `chatList`, and message
  reactions are written to `localStorage` on every state change and
  rehydrated on load. Theme preference is stored separately.
- **Debounce.** `ChatInput` blocks resubmission within 400ms of the last
  send to prevent duplicate requests from double-clicks or repeated Enter
  presses; the send button is also disabled while a request is in flight.
- **Regenerate** re-sends the most recent question in the active
  conversation and replaces that exchange with the new response.
- **Like/Dislike** are stored client-side per `question_id`; wire these up
  to a feedback endpoint if your backend adds one.
- **Accessibility.** Inputs have associated labels, tool lists use
  `role="list"`, loading and error states use `aria-live`/`role="status"`,
  toasts use `role="status"`, and the mobile sidebar toggle exposes
  `aria-expanded`/`aria-controls`.

## CORS / direct backend calls

If you set `VITE_API_BASE_URL` to a full backend URL (instead of using the
Vite dev proxy), your FastAPI backend needs CORS middleware enabled, e.g.:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Known assumption

The spec's example flow implies a single chat session is active on the
main page; viewing history for older chats also lets you continue that
conversation, since `ask()` appends to whatever `activeChatId` is set. If
your backend instead expects an explicit `chat_id` in the `POST /chat`
body to continue a specific conversation, add that field in
`chatService.sendMessage` and pass `state.activeChatId` through from
`ChatContext.ask`.

