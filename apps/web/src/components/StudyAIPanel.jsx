"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "../lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

/**
 * Builds the API message payload by prepending the current study context
 * to the user's raw message. The user only ever sees their typed text in the UI.
 */
function buildContextMessage(userText, context) {
  if (!context?.question) return userText;

  const parts = ["[Study context"];

  if (context.type === "flashcard") {
    if (context.deckTitle) parts.push(`Deck: "${context.deckTitle}"`);
    parts.push(`Question: "${context.question}"`);
    if (context.answer) parts.push(`Answer: "${context.answer}"`);
  } else if (context.type === "quiz") {
    if (context.quizTitle) parts.push(`Quiz: "${context.quizTitle}"`);
    parts.push(`Question: "${context.question}"`);
    if (context.options?.length) {
      const opts = context.options.map((o) => `${o.label}. ${o.text}`).join(" | ");
      parts.push(`Options: ${opts}`);
    }
  }

  return `${parts.join(" — ")}]\n\n${userText}`;
}

/**
 * Inline AI chat panel for the flashcard and quiz study pages.
 *
 * Props:
 *  - context: { type: "flashcard"|"quiz", question, answer?, options?, deckTitle?, quizTitle? }
 *  - theme: "light" | "dark"
 *  - accentColor: CSS color string
 *  - onClose: () => void
 */
export default function StudyAIPanel({ context, theme = "light", accentColor = "#6366f1", onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isDark = theme === "dark";

  // ── Auth token ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
      } else if (process.env.NODE_ENV === "development") {
        setAccessToken("dev-token");
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAccessToken(
        session?.access_token ?? (process.env.NODE_ENV === "development" ? "dev-token" : null)
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || !accessToken) return;

    const apiPayload = buildContextMessage(text, context);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, _id: Date.now() },
      { role: "assistant", content: "", _id: Date.now() + 1, _streaming: true },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: apiPayload, conversation_id: conversationId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            const data = line.slice(6);

            if (currentEvent === "token") {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: last.content + data };
                }
                return copy;
              });
            } else if (currentEvent === "done") {
              try {
                const payload = JSON.parse(data);
                const { conversation_id, message: finalMsg } = payload;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    role: "assistant",
                    content: finalMsg.content,
                    _id: finalMsg.id,
                  };
                  return copy;
                });
                if (!conversationId) setConversationId(conversation_id);
              } catch {
                // ignore parse errors
              }
            }
            currentEvent = null;
          } else if (line === "") {
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      console.error("StudyAIPanel error:", err);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?._streaming) {
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Something went wrong. Please try again.",
            _id: Date.now(),
          };
        }
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const c = isDark
    ? {
        panelBg: "rgba(13,15,25,0.98)",
        headerBg: "rgba(255,255,255,0.025)",
        border: "rgba(255,255,255,0.09)",
        text: "#f1f5f9",
        textMuted: "#475569",
        contextBg: "rgba(99,102,241,0.1)",
        contextBorder: "rgba(99,102,241,0.22)",
        contextText: "#818cf8",
        userBubble: accentColor,
        aiBg: "rgba(255,255,255,0.05)",
        aiBorder: "rgba(255,255,255,0.08)",
        aiText: "#e2e8f0",
        inputBg: "rgba(255,255,255,0.05)",
        inputBorder: "rgba(255,255,255,0.1)",
        inputText: "#f1f5f9",
        btnDisabledBg: "rgba(255,255,255,0.07)",
        btnDisabledText: "#334155",
        closeBg: "rgba(255,255,255,0.06)",
        footerText: "#1e293b",
        emptyText: "#334155",
        codeInlineBg: "rgba(255,255,255,0.1)",
        codeBlockBg: "rgba(255,255,255,0.06)",
      }
    : {
        panelBg: "#ffffff",
        headerBg: `color-mix(in srgb, ${accentColor} 3%, white)`,
        border: "#e8ecf0",
        text: "#0f172a",
        textMuted: "#94a3b8",
        contextBg: `color-mix(in srgb, ${accentColor} 7%, white)`,
        contextBorder: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
        contextText: accentColor,
        userBubble: accentColor,
        aiBg: "#f8fafc",
        aiBorder: "#e8ecf0",
        aiText: "#1e293b",
        inputBg: "#f8fafc",
        inputBorder: "#e2e8f0",
        inputText: "#0f172a",
        btnDisabledBg: "#e2e8f0",
        btnDisabledText: "#94a3b8",
        closeBg: "rgba(0,0,0,0.05)",
        footerText: "#94a3b8",
        emptyText: "#94a3b8",
        codeInlineBg: "rgba(0,0,0,0.06)",
        codeBlockBg: "rgba(0,0,0,0.04)",
      };

  const isDisabled = !input.trim() || isLoading || !accessToken;

  const mdComponents = {
    p: ({ children }) => <p style={{ margin: "0 0 4px", lineHeight: 1.65 }}>{children}</p>,
    pre: ({ children }) => (
      <pre style={{
        margin: "6px 0",
        background: c.codeBlockBg,
        borderRadius: 6,
        padding: "6px 9px",
        overflow: "auto",
        fontSize: "0.74rem",
        lineHeight: 1.5,
      }}>
        {children}
      </pre>
    ),
    code: ({ children }) => (
      <code style={{
        fontFamily: "monospace",
        fontSize: "0.76rem",
        background: c.codeInlineBg,
        padding: "1px 4px",
        borderRadius: 4,
      }}>
        {children}
      </code>
    ),
    ul: ({ children }) => <ul style={{ margin: "4px 0 4px 16px", paddingLeft: 0 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: "4px 0 4px 16px", paddingLeft: 0 }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: 2, lineHeight: 1.6 }}>{children}</li>,
    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  };

  const footerHint = context?.type === "flashcard"
    ? (context?.answer ? "AI sees Q + A" : "AI sees Q only")
    : context?.type === "quiz"
    ? "AI sees question + options"
    : "Context-aware AI";

  return (
    <>
      <style>{`
        @keyframes sap-dot {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes sap-spin {
          to { transform: rotate(360deg); }
        }
        .sap-scroll::-webkit-scrollbar { width: 4px; }
        .sap-scroll::-webkit-scrollbar-track { background: transparent; }
        .sap-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        .sap-close-btn:hover { opacity: 1 !important; background: rgba(239,68,68,0.1) !important; color: #ef4444 !important; }
        .sap-send-btn:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); }
        .sap-textarea:focus {
          outline: none;
          border-color: ${accentColor} !important;
          box-shadow: 0 0 0 3px ${accentColor}22;
        }
      `}</style>

      <div
        style={{
          width: 360,
          display: "flex",
          flexDirection: "column",
          background: c.panelBg,
          border: `1px solid ${c.border}`,
          borderRadius: 18,
          overflow: "hidden",
          flexShrink: 0,
          alignSelf: "stretch",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.45)"
            : "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: c.headerBg,
            borderBottom: `1px solid ${c.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 55%, #8b5cf6) 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.83rem", fontWeight: 700, color: c.text, lineHeight: 1.2 }}>
                Ask AI
              </div>
              <div style={{ fontSize: "0.67rem", color: c.textMuted, marginTop: 1 }}>
                {context?.type === "quiz" ? "Discussing current question" : "Discussing current card"}
              </div>
            </div>
          </div>

          <button
            className="sap-close-btn"
            onClick={onClose}
            title="Close panel"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: c.closeBg,
              color: c.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              transition: "all 0.15s",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" />
            </svg>
          </button>
        </div>

        {/* ── Context chip ── */}
        {context?.question && (
          <div
            style={{
              margin: "10px 12px 0",
              padding: "7px 10px",
              borderRadius: 9,
              background: c.contextBg,
              border: `1px solid ${c.contextBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "0.63rem",
                fontWeight: 700,
                color: c.contextText,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 3,
                opacity: 0.65,
              }}
            >
              {context.type === "flashcard" ? "Current card" : "Current question"}
            </div>
            <div style={{ fontSize: "0.73rem", color: c.contextText, lineHeight: 1.45, fontWeight: 500 }}>
              {context.question.length > 95
                ? context.question.slice(0, 95) + "…"
                : context.question}
            </div>
            {context.answer && (
              <div
                style={{
                  fontSize: "0.68rem",
                  color: c.contextText,
                  opacity: 0.6,
                  marginTop: 4,
                  paddingTop: 4,
                  borderTop: `1px solid ${c.contextBorder}`,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontWeight: 700 }}>A: </span>
                {context.answer.length > 70
                  ? context.answer.slice(0, 70) + "…"
                  : context.answer}
              </div>
            )}
          </div>
        )}

        {/* ── Messages ── */}
        <div
          className="sap-scroll"
          style={{
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                height: "100%",
                minHeight: 160,
                color: c.emptyText,
              }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3} opacity={0.45}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <div
                style={{
                  fontSize: "0.78rem",
                  textAlign: "center",
                  lineHeight: 1.65,
                  maxWidth: 200,
                  opacity: 0.75,
                }}
              >
                Ask anything about{" "}
                {context?.type === "quiz" ? "this question" : "this card"}.
                <br />
                <span style={{ opacity: 0.6, fontSize: "0.72rem" }}>
                  The AI already knows what you&apos;re studying.
                </span>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg._id || i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "user" ? (
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "8px 12px",
                      borderRadius: "14px 14px 3px 14px",
                      background: c.userBubble,
                      color: "#fff",
                      fontSize: "0.81rem",
                      lineHeight: 1.55,
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div
                    style={{
                      maxWidth: "92%",
                      padding: msg._streaming && !msg.content ? "11px 14px" : "8px 12px",
                      borderRadius: "14px 14px 14px 3px",
                      background: c.aiBg,
                      border: `1px solid ${c.aiBorder}`,
                      color: c.aiText,
                      fontSize: "0.81rem",
                      lineHeight: 1.65,
                      wordBreak: "break-word",
                    }}
                  >
                    {msg._streaming && !msg.content ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: c.textMuted,
                              display: "block",
                              animation: `sap-dot 1.4s ${j * 0.18}s infinite ease-in-out`,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div
          style={{
            padding: "10px 12px 13px",
            borderTop: `1px solid ${c.border}`,
            flexShrink: 0,
          }}
        >
          <form onSubmit={sendMessage} style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              className="sap-textarea"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={
                context?.type === "quiz"
                  ? "Ask about this question…"
                  : context?.type === "flashcard"
                  ? "Ask about this card…"
                  : "Ask anything…"
              }
              disabled={isLoading || !accessToken}
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.inputText,
                borderRadius: 11,
                padding: "8px 10px",
                fontSize: "0.81rem",
                fontFamily: "inherit",
                lineHeight: 1.5,
                minHeight: 34,
                maxHeight: 96,
                overflowY: "auto",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            <button
              type="submit"
              className="sap-send-btn"
              disabled={isDisabled}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "none",
                cursor: isDisabled ? "default" : "pointer",
                background: isDisabled ? c.btnDisabledBg : accentColor,
                color: isDisabled ? c.btnDisabledText : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {isLoading ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  style={{ animation: "sap-spin 0.75s linear infinite" }}
                >
                  <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" opacity={0.7} />
                </svg>
              ) : (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 6,
              fontSize: "0.63rem",
              color: c.footerText,
              textAlign: "center",
            }}
          >
            {footerHint} · Enter to send
          </div>
        </div>
      </div>
    </>
  );
}
