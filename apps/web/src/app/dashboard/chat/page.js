"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";
const USER_ID = "9887ed06-d485-48ce-9441-a7ca317d219c"; 

export default function ChatPage() {
  // --- State: Data ---
  const [threads, setThreads] = useState([]); // 侧边栏的对话列表
  const [messages, setMessages] = useState([]); // 当前对话的消息
  const [activeId, setActiveId] = useState(null); // 当前选中的对话 ID (null 代表新对话)
  
  // --- State: UI ---
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 发送中 loading 状态
  
  // “+” menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [attached, setAttached] = useState([]); 
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // ----------------------------------------------------------------------
  // 1. 初始化：加载侧边栏对话列表
  // ----------------------------------------------------------------------
  useEffect(() => {
    fetchThreads();
  }, []);

  async function fetchThreads() {
    try {
      const res = await axios.get(`${API_BASE}/chat/conversations`, {
        headers: { "x-user-id": USER_ID },
      });
      setThreads(res.data);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }

  // ----------------------------------------------------------------------
  // 2. 切换对话：加载历史消息
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!activeId) {
      // 如果是新对话 (New Chat)，清空消息，只留一句欢迎语
      setMessages([{ 
        role: "assistant", 
        content: "What are you studying today?", 
        created_at: new Date().toISOString() 
      }]);
      return;
    }

    async function fetchHistory() {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/chat/conversations/${activeId}`, {
          headers: { "x-user-id": USER_ID },
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [activeId]);

  // 自动滚动到底部
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

  // ----------------------------------------------------------------------
  // 3. 核心功能：发送消息
  // ----------------------------------------------------------------------
  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // 1. UI 乐观更新：先把用户的消息显示出来
    const optimisticMsg = {
      role: "user",
      content: text, // 暂时忽略附件，下一阶段再做 RAG
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setAttached([]);
    setIsLoading(true);

    try {
      // 2. 发送请求给后端
      const payload = {
        message: text,
        conversation_id: activeId, // 如果是 null，后端会创建新对话
      };

      const res = await axios.post(`${API_BASE}/chat/`, payload, {
        headers: { "x-user-id": USER_ID },
      });

      const { conversation_id, message: aiMessage } = res.data;

      // 3. 如果之前是新对话 (activeId 为 null)，现在要更新为真正的 ID
      if (!activeId) {
        setActiveId(conversation_id);
        fetchThreads(); // 刷新侧边栏，因为多了一个新对话
      } else {
        // 如果是老对话，把此对话顶到侧边栏最上面 (可选优化)
        fetchThreads();
      }

      // 4. 把 AI 的回复追加到消息列表
      setMessages((prev) => [...prev, aiMessage]);

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: Could not connect to backend.", created_at: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // ----------------------------------------------------------------------
  // 辅助功能
  // ----------------------------------------------------------------------
  
  function startNewChat() {
    setActiveId(null); // null 触发 useEffect 清空消息
  }

  // 侧边栏搜索过滤
  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, search]);

  // 点击外部关闭菜单
  useEffect(() => {
    function onDocClick(e) {
      const el = e.target;
      if (el?.closest?.("[data-plus-menu]")) return;
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

  // ----------------------------------------------------------------------
  // 渲染 UI (Render)
  // ----------------------------------------------------------------------
  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr] h-[calc(100vh-100px)]">
      {/* Left: Sidebar */}
      <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-extrabold text-slate-900">Chat History</h1>
            <button
              onClick={startNewChat}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              New
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="mt-3 w-full rounded-xl text-blue-700 border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-slate-600 text-sm">No history yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredThreads.map((t) => {
                const isActive = t.id === activeId;
                return (
                  <li key={t.id} className="p-3">
                    <button
                      onClick={() => setActiveId(t.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        isActive ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-bold text-slate-900 truncate text-sm">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(t.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Right: Chat Area */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
        <div className="border-b border-slate-100 p-4 shrink-0">
          <h2 className="text-lg font-extrabold text-slate-900">
            {activeId ? (threads.find(t => t.id === activeId)?.title || "Chat") : "New Conversation"}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {USER_ID === "请在这里粘贴你的_UUID" ? "⚠️ Please set USER_ID in code!" : "Connected to AI"}
          </p>
        </div>

        {/* Message List */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm border leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-900 border-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-500 shadow-sm">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="border-t border-slate-100 p-4 bg-white shrink-0">
          {/* Attachments UI (Visual Only for now) */}
          {attached.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attached.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  <button type="button" onClick={() => setAttached(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-stretch">
             {/* Plus Menu Button */}
             <div className="relative" data-plus-menu>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 font-extrabold hover:bg-slate-50"
              >
                +
              </button>
              {menuOpen && (
                <div className="absolute bottom-[52px] left-0 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden z-10">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 text-left hover:bg-slate-50 text-sm font-semibold">
                    📎 Add files (Coming Soon)
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" multiple onChange={onPickFiles} />
                </div>
              )}
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-xl text-blue-900 border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
