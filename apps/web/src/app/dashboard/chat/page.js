"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.min.css";
import { createSupabaseBrowser } from "../../../lib/supabase/client";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

export default function ChatPage() {
  // --- State: Data ---
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // --- State: Auth ---
  const [accessToken, setAccessToken] = useState(null);

  // --- State: UI ---
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // "+" menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [attached, setAttached] = useState([]);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Delete confirmation modal
  const [deletePendingId, setDeletePendingId] = useState(null);

  // Thread row menu (3-dot) and rename
  const [threadMenuId, setThreadMenuId] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Whether this is a fresh new conversation (no user messages yet)
  const isNewConversation = !activeId && messages.every((m) => m.role === "assistant" && m.content === "What are you studying today?");

  // ------------------------------------------------------------------
  // 0. Get auth token from Supabase session
  // ------------------------------------------------------------------
  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
      }
    }

    loadSession();

    // Keep token fresh when the session refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAccessToken(session?.access_token ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ------------------------------------------------------------------
  // 1. Load sidebar thread list (once we have a token)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (accessToken) fetchThreads();
  }, [accessToken]);

  async function fetchThreads() {
    if (!accessToken) return;
    try {
      const res = await axios.get(`${API_BASE}/chat/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setThreads(res.data);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }

  function openDeleteConfirm(e, conversationId) {
    e.stopPropagation();
    setDeletePendingId(conversationId);
  }

  function closeDeleteConfirm() {
    setDeletePendingId(null);
  }

  function openThreadMenu(e, conversationId) {
    e.stopPropagation();
    setThreadMenuId((prev) => (prev === conversationId ? null : conversationId));
  }

  function closeThreadMenu() {
    setThreadMenuId(null);
  }

  function startRename(conversationId, currentTitle) {
    setRenameId(conversationId);
    setRenameValue(currentTitle || "");
    setThreadMenuId(null);
  }

  function cancelRename() {
    setRenameId(null);
    setRenameValue("");
  }

  async function saveRename() {
    if (!accessToken || !renameId || renameValue.trim() === "") return;
    const conversationId = renameId;
    const newTitle = renameValue.trim() || "Untitled";
    setRenameId(null);
    setRenameValue("");
    try {
      await axios.patch(
        `${API_BASE}/chat/conversations/${conversationId}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setThreads((prev) =>
        prev.map((t) => (t.id === conversationId ? { ...t, title: newTitle } : t))
      );
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  }

  async function confirmDeleteChat() {
    if (!accessToken || !deletePendingId) return;
    const conversationId = deletePendingId;
    setDeletePendingId(null);
    try {
      await axios.delete(`${API_BASE}/chat/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setThreads((prev) => prev.filter((t) => t.id !== conversationId));
      if (activeId === conversationId) {
        setActiveId(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  }

  // ------------------------------------------------------------------
  // 2. Switch conversation: load history
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!activeId) {
      setMessages([
        {
          role: "assistant",
          content: "What are you studying today?",
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    async function fetchHistory() {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/chat/conversations/${activeId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [activeId, accessToken]);

  // Auto-scroll to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

  // ------------------------------------------------------------------
  // 3. Send message (streaming via SSE)
  // ------------------------------------------------------------------
  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const optimisticMsg = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setAttached([]);
    setIsLoading(true);

    // Add a placeholder assistant message that we'll stream into
    const placeholderMsg = {
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      _streaming: true,
    };
    setMessages((prev) => [...prev, placeholderMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: text,
          conversation_id: activeId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines from the buffer
        const lines = buffer.split("\n");
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() || "";

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            const data = line.slice(6);

            if (currentEvent === "token") {
              // Append token to the last (streaming) assistant message
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data,
                  };
                }
                return updated;
              });
            } else if (currentEvent === "done") {
              try {
                const payload = JSON.parse(data);
                const { conversation_id, message: finalMsg } = payload;

                  // Replace streaming placeholder with final DB-backed message (include sources if RAG was used)
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    id: finalMsg.id,
                    role: "assistant",
                    content: finalMsg.content,
                    created_at: finalMsg.created_at,
                    sources: finalMsg.sources || [],
                  };
                  return updated;
                });

                if (!activeId) {
                  setActiveId(conversation_id);
                }
                fetchThreads();
              } catch (parseErr) {
                console.error("Failed to parse done event:", parseErr);
              }
            }
            currentEvent = null;
          } else if (line === "") {
            // Empty line = end of event block, reset
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      console.error("Chat Error:", err);
      // Replace the streaming placeholder with an error message
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Error: Could not connect to backend.",
            created_at: new Date().toISOString(),
          };
        } else {
          updated.push({
            role: "assistant",
            content: "Error: Could not connect to backend.",
            created_at: new Date().toISOString(),
          });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function startNewChat() {
    setActiveId(null);
    setSidebarOpen(false);
  }

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, search]);

  // Close plus-menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (e.target?.closest?.("[data-plus-menu]")) return;
      setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close thread 3-dot menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (e.target?.closest?.("[data-thread-menu]")) return;
      setThreadMenuId(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close delete modal on Escape
  useEffect(() => {
    if (!deletePendingId) return;
    function onKeyDown(e) {
      if (e.key === "Escape") closeDeleteConfirm();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deletePendingId]);

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setAttached((prev) => [...prev, ...list].slice(0, 4));
    e.target.value = "";
    setMenuOpen(false);
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="h-full min-h-0 flex relative overflow-hidden">
      {/* Delete confirmation modal */}
      {deletePendingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeDeleteConfirm}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200"
          >
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 mb-2">
              Delete this chat?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteConfirm}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapsible sidebar (overlay on mobile, inline on lg) ── */}

      {/* Backdrop for mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          absolute top-0 bottom-0 left-0 z-30 w-72
          flex flex-col bg-white border-r border-slate-200 shadow-xl
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:z-auto lg:shadow-none lg:rounded-l-2xl
          ${sidebarOpen ? "lg:translate-x-0" : "lg:w-0 lg:min-w-0 lg:overflow-hidden lg:-translate-x-full lg:border-r-0"}
        `}
      >
        {/* Sidebar header */}
        <div className="border-b border-slate-100 p-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Chat History
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="mt-3 w-full rounded-lg text-slate-700 border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
          />
        </div>

        {/* Thread list */}
        <div className="overflow-y-auto flex-1">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No history yet.
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filteredThreads.map((t) => {
                const isActive = t.id === activeId;
                const isRenaming = renameId === t.id;
                const isMenuOpen = threadMenuId === t.id;
                return (
                  <li key={t.id}>
                    <div
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                        isActive
                          ? "bg-indigo-50 border border-indigo-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      {isRenaming ? (
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename();
                              if (e.key === "Escape") cancelRename();
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="Chat name"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveRename}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setActiveId(t.id);
                              setSidebarOpen(false);
                            }}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="font-semibold text-slate-900 truncate text-sm">
                              {t.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(
                                t.created_at || Date.now()
                              ).toLocaleDateString()}
                            </p>
                          </button>
                          <div className="relative shrink-0" data-thread-menu>
                            <button
                              onClick={(e) => openThreadMenu(e, t.id)}
                              title="More actions"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-inset"
                              aria-label="More actions"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="6" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="18" r="1.5" />
                              </svg>
                            </button>
                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                                <button
                                  type="button"
                                  onClick={() => startRename(t.id, t.title)}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    openDeleteConfirm(e, t.id);
                                    closeThreadMenu();
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Top bar */}
        <div className="border-b border-slate-100 px-4 py-3 shrink-0 flex items-center gap-3 bg-white/60 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Open chat history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden lg:inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title={sidebarOpen ? "Hide chat history" : "Show chat history"}
            aria-label={sidebarOpen ? "Hide chat history" : "Show chat history"}
          >
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 truncate">
              {activeId
                ? threads.find((t) => t.id === activeId)?.title || "Chat"
                : "New Conversation"}
            </h2>
            <p className="text-xs text-slate-500">Connected to AI</p>
          </div>
          <button
            onClick={startNewChat}
            className="hidden lg:inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Message area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-slate-50/50"
        >
          {isNewConversation ? (
            /* ── Centered welcome for new conversations ── */
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                What are you studying today?
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Ask a question, summarize notes, or start a study session. Your AI study buddy is ready.
              </p>
            </div>
          ) : (
            /* ── Message bubbles ── */
            <div className="p-4 space-y-3">
              {messages
                .filter(
                  (m) =>
                    !(
                      m.role === "assistant" &&
                      m.content === "What are you studying today?"
                    )
                )
                .map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm border leading-relaxed overflow-hidden ${
                          isUser
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-900 border-slate-200"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap font-medium">
                            {m.content}
                          </p>
                        ) : (
                          <>
                            <div className="chat-markdown [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 [&_h1:first-child]:mt-0 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:bg-slate-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-xs [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-slate-600 [&_hr]:my-3 [&_hr]:border-slate-200 [&_a]:text-indigo-600 [&_a]:underline [&_a]:break-all [&_table]:w-full [&_table]:my-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
                            {/* Sources badge — shown when RAG tool was called */}
                            {m.sources && m.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                                <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                </svg>
                                <span className="text-xs text-slate-400 font-medium">From your documents</span>
                                <span className="text-xs text-indigo-500 font-semibold">
                                  {[...new Set(m.sources.map((s) => s.document_id))].length} source{[...new Set(m.sources.map((s) => s.document_id))].length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-500 shadow-sm flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:150ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Input area (always pinned to bottom) ── */}
        <form
          onSubmit={sendMessage}
          className="border-t border-slate-100 p-3 bg-white shrink-0"
        >
          {/* Attachment chips */}
          {attached.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attached.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                >
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttached((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-stretch">
            {/* Plus menu */}
            <div className="relative" data-plus-menu>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 font-extrabold hover:bg-slate-50 transition-colors"
              >
                +
              </button>
              {menuOpen && (
                <div className="absolute bottom-[48px] left-0 w-64 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-10">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                      </svg>
                      Documents auto-search enabled
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Your uploaded files are automatically searched when you ask about your notes or study materials.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={onPickFiles}
                  />
                </div>
              )}
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-xl text-slate-900 border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 transition-shadow"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
