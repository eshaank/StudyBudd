"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

const StudyAIPanelContext = createContext(null);

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

export function StudyAIPanelProvider({ children }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [studyContext, setStudyContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ref to always access latest studyContext inside sendMessage without stale closures
  const studyContextRef = useRef(studyContext);
  useEffect(() => { studyContextRef.current = studyContext; }, [studyContext]);

  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);
  const closePanel = useCallback(() => {
    setIsOpen(false);
    setMessages([]);
    setConversationId(null);
  }, []);

  // ── Auth token ──
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

  // ── Send message (SSE streaming) ──
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !accessToken) return;

    const apiPayload = buildContextMessage(trimmed, studyContextRef.current);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, _id: Date.now() },
      { role: "assistant", content: "", _id: Date.now() + 1, _streaming: true },
    ]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: apiPayload, conversation_id: conversationId, ephemeral: true }),
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
                setConversationId((prev) => prev ?? conversation_id);
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
  }, [isLoading, accessToken, conversationId]);

  // ── Save ephemeral chat to main Chat ──
  const saveToChat = useCallback(async () => {
    if (!accessToken || messages.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/chat/conversations/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: messages.find((m) => m.role === "user")?.content?.slice(0, 50) || "Ask AI Chat",
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { conversation_id } = await res.json();

      // Close panel, clear state, navigate to chat
      setIsOpen(false);
      setMessages([]);
      setConversationId(null);
      router.push(`/dashboard/chat?id=${conversation_id}`);
    } catch (err) {
      console.error("saveToChat error:", err);
    }
  }, [accessToken, messages, router]);

  return (
    <StudyAIPanelContext.Provider
      value={{
        isOpen, togglePanel, closePanel,
        studyContext, setStudyContext,
        messages, conversationId,
        accessToken, isLoading,
        sendMessage, saveToChat,
      }}
    >
      {children}
    </StudyAIPanelContext.Provider>
  );
}

const noop = () => {};
const FALLBACK = {
  isOpen: false, togglePanel: noop, closePanel: noop,
  studyContext: null, setStudyContext: noop,
  messages: [], conversationId: null,
  accessToken: null, isLoading: false,
  sendMessage: noop, saveToChat: noop,
};

export function useStudyAIPanel() {
  const ctx = useContext(StudyAIPanelContext);
  return ctx ?? FALLBACK;
}
