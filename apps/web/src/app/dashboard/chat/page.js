"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { createSupabaseBrowser } from "../../../lib/supabase/client";

const API_BASE = "http://localhost:8000/api";

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
  // 3. Send message
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

    try {
      const payload = {
        message: text,
        conversation_id: activeId,
      };

      const res = await axios.post(`${API_BASE}/chat/`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { conversation_id, message: aiMessage } = res.data;

      if (!activeId) {
        setActiveId(conversation_id);
      }
      fetchThreads();

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Could not connect to backend.",
          created_at: new Date().toISOString(),
        },
      ]);
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
    <div className="h-full flex relative overflow-hidden">
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
          lg:translate-x-0 lg:relative lg:z-auto lg:shadow-none lg:rounded-l-2xl
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
                className="lg:hidden rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
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
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => {
                        setActiveId(t.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? "bg-indigo-50 border border-indigo-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
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
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm border leading-relaxed ${
                          isUser
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-900 border-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-medium">
                          {m.content}
                        </p>
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
                    <span className="ml-1">Thinking...</span>
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
                <div className="absolute bottom-[48px] left-0 w-52 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-10">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 text-sm font-semibold text-slate-700"
                  >
                    Add files (Coming Soon)
                  </button>
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
