import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "What are you studying today?",
  created_at: new Date().toISOString(),
};

export default function useChatMessages(accessToken, activeId, setActiveId, fetchThreads, selectedModel) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef(null);

  const isNewConversation =
    !activeId &&
    messages.every(
      (m) => m.role === "assistant" && m.content === "What are you studying today?"
    );

  // Load conversation history when activeId changes
  useEffect(() => {
    if (!activeId) {
      setMessages([{ ...WELCOME_MESSAGE, created_at: new Date().toISOString() }]);
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

  // Send message with SSE streaming
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return;

      const optimisticMsg = {
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setIsLoading(true);

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
            model: selectedModel,
          }),
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
              currentEvent = null;
            }
          }
        }
      } catch (err) {
        console.error("Chat Error:", err);
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
    },
    [accessToken, activeId, setActiveId, fetchThreads, selectedModel]
  );

  return {
    messages,
    isLoading,
    isNewConversation,
    messagesContainerRef,
    sendMessage,
  };
}
