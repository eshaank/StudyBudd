"use client";

import { useState } from "react";
import "highlight.js/styles/github.min.css";

// Hooks
import useAuth from "./hooks/useAuth";
import useThreads from "./hooks/useThreads";
import useChatMessages from "./hooks/useChatMessages";

// Components
import ChatSidebar from "./components/ChatSidebar";
import ChatInput from "./components/ChatInput";
import MessageBubble from "./components/MessageBubble";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

export default function ChatPage() {
  const accessToken = useAuth();

  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const threadState = useThreads(accessToken);

  const {
    messages,
    isLoading,
    isNewConversation,
    messagesContainerRef,
    sendMessage,
  } = useChatMessages(accessToken, activeId, setActiveId, threadState.fetchThreads);

  function selectThread(id) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  function startNewChat() {
    setActiveId(null);
    setSidebarOpen(false);
  }

  async function handleConfirmDelete() {
    const deletedId = await threadState.confirmDelete();
    if (deletedId && activeId === deletedId) {
      setActiveId(null);
    }
  }

  return (
    <div className="h-full min-h-0 flex relative overflow-hidden">
      {/* Delete confirmation modal */}
      {threadState.deletePendingId && (
        <DeleteConfirmModal
          onCancel={threadState.closeDeleteConfirm}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        search={threadState.search}
        setSearch={threadState.setSearch}
        filteredThreads={threadState.filteredThreads}
        activeId={activeId}
        onSelectThread={selectThread}
        renameId={threadState.renameId}
        renameValue={threadState.renameValue}
        setRenameValue={threadState.setRenameValue}
        onStartRename={threadState.startRename}
        onCancelRename={threadState.cancelRename}
        onSaveRename={threadState.saveRename}
        threadMenuId={threadState.threadMenuId}
        onOpenThreadMenu={threadState.openThreadMenu}
        onOpenDeleteConfirm={threadState.openDeleteConfirm}
        onCloseThreadMenu={threadState.closeThreadMenu}
      />

      {/* Main chat area */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Top bar */}
        <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 shrink-0 flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Open chat history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden lg:inline-flex rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {activeId
                ? threadState.threads.find((t) => t.id === activeId)?.title || "Chat"
                : "New Conversation"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Connected to AI</p>
          </div>
          <button
            onClick={startNewChat}
            className="hidden lg:inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Message area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
          {isNewConversation ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600 dark:text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                What are you studying today?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Ask a question, summarize notes, or start a study session. Your AI study buddy is ready.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {messages
                .filter(
                  (m) =>
                    !(m.role === "assistant" && m.content === "What are you studying today?")
                )
                .map((m, idx) => (
                  <MessageBubble key={m.id || idx} message={m} />
                ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400 shadow-sm flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:150ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
