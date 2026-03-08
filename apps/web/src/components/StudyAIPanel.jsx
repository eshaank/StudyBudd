"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStudyAIPanel } from "../app/components/StudyAIPanelProvider";

/**
 * Inline AI chat panel that sits alongside the main content.
 * Width animates between 0 and 380px — content area flexes to accommodate.
 */
export default function StudyAIPanel({ accentColor = "#6366f1" }) {
  const {
    isOpen, closePanel,
    studyContext: context,
    messages, isLoading, accessToken,
    sendMessage, saveToChat,
  } = useStudyAIPanel();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setIsDark(html.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [isOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendMessage(text);
  }

  // ── Theme tokens ──
  const c = isDark
    ? {
        panelBg: "rgba(15,17,28,0.95)",
        headerBg: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.08)",
        borderOuter: "rgba(255,255,255,0.06)",
        text: "#f1f5f9",
        textMuted: "#64748b",
        contextBg: "rgba(99,102,241,0.1)",
        contextBorder: "rgba(99,102,241,0.2)",
        contextText: "#818cf8",
        userBubble: accentColor,
        aiBg: "rgba(255,255,255,0.04)",
        aiBorder: "rgba(255,255,255,0.07)",
        aiText: "#e2e8f0",
        inputBg: "rgba(255,255,255,0.05)",
        inputBorder: "rgba(255,255,255,0.1)",
        inputText: "#f1f5f9",
        btnDisabledBg: "rgba(255,255,255,0.06)",
        btnDisabledText: "#334155",
        closeBg: "rgba(255,255,255,0.06)",
        footerText: "#475569",
        emptyText: "#475569",
        codeInlineBg: "rgba(255,255,255,0.1)",
        codeBlockBg: "rgba(255,255,255,0.06)",
      }
    : {
        panelBg: "#ffffff",
        headerBg: `color-mix(in srgb, ${accentColor} 2%, white)`,
        border: "#eef0f4",
        borderOuter: "#e2e8f0",
        text: "#0f172a",
        textMuted: "#94a3b8",
        contextBg: `color-mix(in srgb, ${accentColor} 6%, white)`,
        contextBorder: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
        contextText: accentColor,
        userBubble: accentColor,
        aiBg: "#f8fafc",
        aiBorder: "#eef0f4",
        aiText: "#1e293b",
        inputBg: "#f8fafc",
        inputBorder: "#e2e8f0",
        inputText: "#0f172a",
        btnDisabledBg: "#e2e8f0",
        btnDisabledText: "#94a3b8",
        closeBg: "rgba(0,0,0,0.04)",
        footerText: "#94a3b8",
        emptyText: "#94a3b8",
        codeInlineBg: "rgba(0,0,0,0.05)",
        codeBlockBg: "rgba(0,0,0,0.03)",
      };

  const isDisabled = !input.trim() || isLoading || !accessToken;

  const mdComponents = {
    p: ({ children }) => <p style={{ margin: "0 0 4px", lineHeight: 1.65 }}>{children}</p>,
    pre: ({ children }) => (
      <pre style={{
        margin: "6px 0", background: c.codeBlockBg, borderRadius: 6,
        padding: "6px 9px", overflow: "auto", fontSize: "0.74rem", lineHeight: 1.5,
      }}>
        {children}
      </pre>
    ),
    code: ({ children }) => (
      <code style={{
        fontFamily: "monospace", fontSize: "0.76rem",
        background: c.codeInlineBg, padding: "1px 4px", borderRadius: 4,
      }}>
        {children}
      </code>
    ),
    ul: ({ children }) => <ul style={{ margin: "4px 0 4px 16px", paddingLeft: 0 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: "4px 0 4px 16px", paddingLeft: 0 }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: 2, lineHeight: 1.6 }}>{children}</li>,
    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  };

  const headerSubtitle = context?.type === "flashcard"
    ? "Discussing current card"
    : context?.type === "quiz"
    ? "Discussing current question"
    : "AI study assistant";

  const footerHint = context?.type === "flashcard"
    ? (context?.answer ? "AI sees Q + A" : "AI sees Q only")
    : context?.type === "quiz"
    ? "AI sees question + options"
    : "Context-aware AI";

  const emptyHint = context?.question
    ? `Ask anything about ${context.type === "quiz" ? "this question" : "this card"}.`
    : "Ask anything about your studies.";

  const emptySubHint = context?.question
    ? "The AI already knows what you\u2019re studying."
    : "Navigate to flashcards or quizzes for context-aware help.";

  const placeholder = context?.type === "quiz"
    ? "Ask about this question\u2026"
    : context?.type === "flashcard"
    ? "Ask about this card\u2026"
    : "Ask anything\u2026";

  return (
    <>
      <style>{`
        @keyframes sap-dot {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes sap-spin { to { transform: rotate(360deg); } }
        .sap-scroll::-webkit-scrollbar { width: 4px; }
        .sap-scroll::-webkit-scrollbar-track { background: transparent; }
        .sap-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.25); border-radius: 4px; }
        .sap-close-btn:hover { opacity: 1 !important; background: rgba(239,68,68,0.08) !important; color: #ef4444 !important; }
        .sap-send-btn:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); }
        .sap-textarea:focus {
          outline: none;
          border-color: ${accentColor} !important;
          box-shadow: 0 0 0 3px ${accentColor}1a;
        }
      `}</style>

      {/* Outer wrapper — controls width transition */}
      <div
        style={{
          width: isOpen ? 380 : 0,
          minWidth: 0,
          flexShrink: 0,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {/* Inner panel — always 380px, clipped by outer wrapper */}
        <div
          style={{
            width: 380,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: c.panelBg,
            border: `1px solid ${c.borderOuter}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: isDark
              ? "0 0 0 1px rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.3)"
              : "0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)",
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
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: `linear-gradient(135deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 55%, #8b5cf6) 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
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
                  {headerSubtitle}
                </div>
              </div>
            </div>

            <button
              className="sap-close-btn"
              onClick={closePanel}
              title="Close panel"
              style={{
                width: 26, height: 26, borderRadius: 7, border: "none",
                cursor: "pointer", background: c.closeBg, color: c.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0.7, transition: "all 0.15s",
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
                margin: "10px 12px 0", padding: "7px 10px", borderRadius: 9,
                background: c.contextBg, border: `1px solid ${c.contextBorder}`, flexShrink: 0,
              }}
            >
              <div style={{
                fontSize: "0.63rem", fontWeight: 700, color: c.contextText,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3, opacity: 0.65,
              }}>
                {context.type === "flashcard" ? "Current card" : "Current question"}
              </div>
              <div style={{ fontSize: "0.73rem", color: c.contextText, lineHeight: 1.45, fontWeight: 500 }}>
                {context.question.length > 95 ? context.question.slice(0, 95) + "\u2026" : context.question}
              </div>
              {context.answer && (
                <div style={{
                  fontSize: "0.68rem", color: c.contextText, opacity: 0.6,
                  marginTop: 4, paddingTop: 4, borderTop: `1px solid ${c.contextBorder}`, lineHeight: 1.4,
                }}>
                  <span style={{ fontWeight: 700 }}>A: </span>
                  {context.answer.length > 70 ? context.answer.slice(0, 70) + "\u2026" : context.answer}
                </div>
              )}
            </div>
          )}

          {/* ── Messages ── */}
          <div
            className="sap-scroll"
            style={{
              overflowY: "auto", padding: "12px", display: "flex",
              flexDirection: "column", gap: 8, flex: 1, minHeight: 0,
            }}
          >
            {messages.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 10, height: "100%", minHeight: 160, color: c.emptyText,
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3} opacity={0.45}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <div style={{
                  fontSize: "0.78rem", textAlign: "center", lineHeight: 1.65, maxWidth: 200, opacity: 0.75,
                }}>
                  {emptyHint}
                  <br />
                  <span style={{ opacity: 0.6, fontSize: "0.72rem" }}>
                    {emptySubHint}
                  </span>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={msg._id || i}
                  style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
                >
                  {msg.role === "user" ? (
                    <div style={{
                      maxWidth: "82%", padding: "8px 12px", borderRadius: "14px 14px 3px 14px",
                      background: c.userBubble, color: "#fff", fontSize: "0.81rem",
                      lineHeight: 1.55, fontWeight: 500, wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{
                      maxWidth: "92%",
                      padding: msg._streaming && !msg.content ? "11px 14px" : "8px 12px",
                      borderRadius: "14px 14px 14px 3px", background: c.aiBg,
                      border: `1px solid ${c.aiBorder}`, color: c.aiText,
                      fontSize: "0.81rem", lineHeight: 1.65, wordBreak: "break-word",
                    }}>
                      {msg._streaming && !msg.content ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {[0, 1, 2].map((j) => (
                            <span key={j} style={{
                              width: 6, height: 6, borderRadius: "50%", background: c.textMuted,
                              display: "block", animation: `sap-dot 1.4s ${j * 0.18}s infinite ease-in-out`,
                            }} />
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
          <div style={{ padding: "10px 12px 13px", borderTop: `1px solid ${c.border}`, flexShrink: 0 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
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
                    handleSubmit(e);
                  }
                }}
                placeholder={placeholder}
                disabled={isLoading || !accessToken}
                rows={1}
                style={{
                  flex: 1, resize: "none", border: `1px solid ${c.inputBorder}`,
                  background: c.inputBg, color: c.inputText, borderRadius: 11,
                  padding: "8px 10px", fontSize: "0.81rem", fontFamily: "inherit",
                  lineHeight: 1.5, minHeight: 34, maxHeight: 96, overflowY: "auto",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              />
              <button
                type="submit"
                className="sap-send-btn"
                disabled={isDisabled}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "none",
                  cursor: isDisabled ? "default" : "pointer",
                  background: isDisabled ? c.btnDisabledBg : accentColor,
                  color: isDisabled ? c.btnDisabledText : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.15s",
                }}
              >
                {isLoading ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                    style={{ animation: "sap-spin 0.75s linear infinite" }}>
                    <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" opacity={0.7} />
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </form>

            <div style={{ marginTop: 6, fontSize: "0.63rem", color: c.footerText, textAlign: "center" }}>
              {footerHint} · Enter to send
            </div>

            {messages.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={saveToChat}
                style={{
                  width: "100%", marginTop: 8, padding: "7px 0",
                  borderRadius: 9, border: `1px solid ${c.inputBorder}`,
                  background: "transparent", color: c.textMuted,
                  fontSize: "0.72rem", fontWeight: 600, fontFamily: "inherit",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.color = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = c.inputBorder;
                  e.currentTarget.style.color = c.textMuted;
                }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Continue in Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
