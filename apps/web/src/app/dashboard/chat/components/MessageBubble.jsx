"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm border leading-relaxed overflow-hidden ${
          isUser
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap font-medium">{message.content}</p>
        ) : (
          <>
            <div className="chat-markdown [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 [&_h1:first-child]:mt-0 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:bg-slate-100 dark:[&_pre]:bg-slate-900 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-xs [&_code]:bg-slate-100 dark:[&_code]:bg-slate-900 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 dark:[&_blockquote]:border-slate-600 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-400 [&_hr]:my-3 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700 [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline [&_a]:break-all [&_table]:w-full [&_table]:my-2 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-600 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-600 [&_td]:px-2 [&_td]:py-1">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
                <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                </svg>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">From your documents</span>
                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">
                  {[...new Set(message.sources.map((s) => s.document_id))].length} source
                  {[...new Set(message.sources.map((s) => s.document_id))].length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
