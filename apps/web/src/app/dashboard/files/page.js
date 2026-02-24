"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import DocumentUpload from "../../components/DocumentUpload";
import { useNotifications } from "../../components/NotificationsContext";

const DEMO_USERS = [
  { id: "u1", name: "User123", email: "user123@studybudd.app" },
  { id: "u2", name: "Alice Chen", email: "alice.chen@studybudd.app" },
  { id: "u3", name: "Bob Smith", email: "bob.smith@studybudd.app" },
  { id: "u4", name: "Carol Davis", email: "carol.davis@studybudd.app" },
  { id: "u5", name: "David Park", email: "david.park@studybudd.app" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(fileType) {
  if (fileType === "pdf") {
    return (
      <svg
        className="w-8 h-8 text-red-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 4.5c1.32 0 2.5-.68 2.5-1.5v-1.5c0-.82-1.18-1.5-2.5-1.5S6 13.68 6 14.5V16c0 .82 1.18 1.5 2.5 1.5z" />
      </svg>
    );
  }
  if (fileType === "image") {
    return (
      <svg
        className="w-8 h-8 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }
  if (fileType === "text") {
    return (
      <svg
        className="w-8 h-8 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }
  if (fileType === "csv") {
    return (
      <svg
        className="w-8 h-8 text-emerald-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l7 7A2 2 0 0119 19z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-8 h-8 text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDFs" },
  { id: "image", label: "Images" },
  { id: "text", label: "TXT" },
  { id: "csv", label: "CSV" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "name-asc", label: "Name A-Z" },
  { id: "name-desc", label: "Name Z-A" },
  { id: "size", label: "Size" },
];

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

export default function FilesPage() {
  const { addNotification } = useNotifications();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");

  // Modal, filter, sort
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // RAG query modal
  const [askDocumentId, setAskDocumentId] = useState(null);
  const [askDocumentName, setAskDocumentName] = useState("");
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryQuestion, setQueryQuestion] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  // Share modal
  const [shareDoc, setShareDoc] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRecipients, setShareRecipients] = useState([]);
  const [shareSuggestions, setShareSuggestions] = useState([]);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const shareInputRef = useRef(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadReadyMessage, setUploadReadyMessage] = useState(null);

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isDev = process.env.NODE_ENV === "development";
      const accessToken = session?.access_token || (isDev ? "dev-token" : null);

      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/documents`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsUploadOpen(false);
        setIsQueryModalOpen(false);
        setShareDoc(null);
      }
    };
    if (isUploadOpen || isQueryModalOpen || shareDoc) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isUploadOpen, isQueryModalOpen, shareDoc]);

  // Share: update suggestions as user types
  useEffect(() => {
    const q = shareEmail.trim().toLowerCase();
    if (!q) { setShareSuggestions([]); return; }
    const already = shareRecipients.map((r) => r.id);
    setShareSuggestions(
      DEMO_USERS.filter(
        (u) =>
          !already.includes(u.id) &&
          (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      )
    );
  }, [shareEmail, shareRecipients]);

  function openShareModal(doc) {
    setShareDoc(doc);
    setShareEmail("");
    setShareRecipients([]);
    setShareSuggestions([]);
    setCopyLinkDone(false);
  }

  function addRecipient(user) {
    setShareRecipients((prev) => [...prev, user]);
    setShareEmail("");
    setShareSuggestions([]);
    setTimeout(() => shareInputRef.current?.focus(), 0);
  }

  function addEmailAsRecipient() {
    const email = shareEmail.trim();
    if (!email) return;
    // check if already added
    if (shareRecipients.some((r) => r.email === email)) {
      setShareEmail(""); return;
    }
    const existing = DEMO_USERS.find((u) => u.email === email);
    if (existing) { addRecipient(existing); return; }
    addRecipient({ id: email, name: email.split("@")[0], email });
  }

  function removeRecipient(id) {
    setShareRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  function handleShareEmailKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); addEmailAsRecipient(); }
    if (e.key === "Backspace" && shareEmail === "" && shareRecipients.length > 0) {
      removeRecipient(shareRecipients[shareRecipients.length - 1].id);
    }
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/dashboard/files/${shareDoc?.id ?? "shared"}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopyLinkDone(true);
    setTimeout(() => setCopyLinkDone(false), 2500);
  }

  function handleShare() {
    if (shareRecipients.length === 0) return;
    shareRecipients.forEach((r) => {
      const msg = `Hey @${r.name} received the files. "${shareDoc?.original_filename || "file"}" was shared with you.`;
      addNotification(msg);
      alert(msg);
    });
    setToastMessage(`Shared with ${shareRecipients.length} person${shareRecipients.length > 1 ? "s" : ""}.`);
    setShareDoc(null);
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Upload ready message auto-dismiss
  useEffect(() => {
    if (!uploadReadyMessage) return;
    const t = setTimeout(() => setUploadReadyMessage(null), 5000);
    return () => clearTimeout(t);
  }, [uploadReadyMessage]);

  // Filter and sort documents
  const filtered = useMemo(() => {
    let result = [...documents];

    // Search filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((d) =>
        d.original_filename?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (activeFilter === "pdf") {
      result = result.filter((d) => d.file_type === "pdf");
    } else if (activeFilter === "image") {
      result = result.filter((d) => d.file_type === "image");
    } else if (activeFilter === "text") {
      result = result.filter((d) => d.file_type === "text");
    } else if (activeFilter === "csv") {
      result = result.filter((d) => d.file_type === "csv");
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "name-asc":
        result.sort((a, b) =>
          (a.original_filename || "").localeCompare(b.original_filename || "")
        );
        break;
      case "name-desc":
        result.sort((a, b) =>
          (b.original_filename || "").localeCompare(a.original_filename || "")
        );
        break;
      case "size":
        result.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
        break;
      default:
        break;
    }

    return result;
  }, [documents, query, activeFilter, sortBy]);

  // Handle successful upload
  const handleUploadSuccess = (results) => {
    const newDocs = results.map((r) => r.document);
    setDocuments((prev) => [...newDocs, ...prev]);
    setIsUploadOpen(false);
    const ready = results.some((r) => r.processing_status === "ready");
    if (ready) {
      setUploadReadyMessage("Documents indexed and ready for questions!");
    }
  };

  // Handle Ask click - check status and open query modal
  const handleAskClick = async (doc) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setToastMessage("You must be logged in to ask questions.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/processing/${doc.id}/status`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        setToastMessage("Could not check document status.");
        return;
      }

      const data = await res.json();
      if (data.status !== "ready") {
        setToastMessage(
          "This document is not indexed for RAG. Upload TXT or CSV files to enable questions."
        );
        return;
      }

      setAskDocumentId(doc.id);
      setAskDocumentName(doc.original_filename || "Document");
      setQueryQuestion("");
      setQueryResult(null);
      setIsQueryModalOpen(true);
    } catch (err) {
      console.error("Ask status check failed:", err);
      setToastMessage("Failed to check document status.");
    }
  };

  // Handle RAG query submit
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!askDocumentId || !queryQuestion.trim()) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setQueryLoading(true);
    setQueryResult(null);

    try {
      const res = await fetch(`${API_URL}/api/processing/rag/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          document_id: askDocumentId,
          question: queryQuestion.trim(),
          top_k: 5,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errData.detail)
          ? errData.detail.map((d) => d.msg || d).join(", ")
          : errData.detail || "Query failed.";
        setQueryResult({ error: errMsg });
        return;
      }

      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
      setQueryResult({ error: "Query failed. Please try again." });
    } finally {
      setQueryLoading(false);
    }
  };

  const closeQueryModal = () => {
    setIsQueryModalOpen(false);
    setAskDocumentId(null);
    setAskDocumentName("");
    setQueryQuestion("");
    setQueryResult(null);
  };

  // Handle document deletion
  const handleDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeleting(documentId);

    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isDev = process.env.NODE_ENV === "development";
      const accessToken = session?.access_token || (isDev ? "dev-token" : null);

      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Upload ready message */}
      {uploadReadyMessage && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl">
          {uploadReadyMessage}
        </div>
      )}

      {/* Consolidated Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Files Library</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:max-w-xl sm:ml-6">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Filter/Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveFilter(option.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeFilter === option.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* File count */}
          <span className="text-sm text-slate-500">
            Showing {filtered.length} of {documents.length} file
            {documents.length !== 1 ? "s" : ""}
          </span>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-10 text-center">
            <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 mt-4">Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl">📁</div>
            <p className="mt-2 font-semibold text-slate-900">
              {documents.length === 0 ? "No files yet" : "No matching files"}
            </p>
            <p className="mt-1 text-slate-600">
              {documents.length === 0
                ? "Upload your notes to build your library."
                : "Try adjusting your search or filters."}
            </p>
            {documents.length === 0 && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload your first file
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((doc) => (
              <li
                key={doc.id}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* File Icon */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg">
                  {getFileIcon(doc.file_type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {doc.original_filename}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.file_type?.toUpperCase()} •{" "}
                    {formatFileSize(doc.file_size)} •{" "}
                    {formatDate(doc.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Share — always visible */}
                  <button
                    type="button"
                    onClick={() => openShareModal(doc)}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>

                  {/* Ask + Delete — hover only */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleAskClick(doc)}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Ask
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleting === doc.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                  </div>{/* end hover-only */}
                </div>{/* end actions */}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsUploadOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2
                id="upload-modal-title"
                className="text-lg font-extrabold text-slate-900"
              >
                Upload Documents
              </h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShareDoc(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 id="share-modal-title" className="text-lg font-extrabold text-slate-900">
                  Share file
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                  {shareDoc.original_filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareDoc(null)}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Add people section */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Add people
                </label>

                {/* Chips + input row */}
                <div
                  className="flex flex-wrap items-center gap-1.5 min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition cursor-text"
                  onClick={() => shareInputRef.current?.focus()}
                >
                  {shareRecipients.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 pl-2 pr-1 py-0.5 text-xs font-semibold text-indigo-700"
                    >
                      {r.email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.id)}
                        className="ml-0.5 rounded p-0.5 hover:bg-indigo-200 text-indigo-500"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <input
                    ref={shareInputRef}
                    type="text"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    onKeyDown={handleShareEmailKeyDown}
                    placeholder={shareRecipients.length === 0 ? "Search by name or email..." : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>

                {/* Suggestions dropdown */}
                {shareSuggestions.length > 0 && (
                  <div className="mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden divide-y divide-slate-50 z-10 relative">
                    {shareSuggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addRecipient(u)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700 shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Press Enter to add. Use Backspace to remove last.
                </p>
              </div>

              {/* Copy link section */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Copy link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 truncate select-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/dashboard/files/${shareDoc.id}`
                      : `https://studybudd.app/files/${shareDoc.id}`}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      copyLinkDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {copyLinkDone ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShareDoc(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={shareRecipients.length === 0}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share{shareRecipients.length > 0 ? ` (${shareRecipients.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAG Query Modal */}
      {isQueryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="query-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeQueryModal}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2
                id="query-modal-title"
                className="text-lg font-extrabold text-slate-900"
              >
                Ask about {askDocumentName}
              </h2>
              <button
                type="button"
                onClick={closeQueryModal}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleQuerySubmit} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="query-question"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Your question
                </label>
                <input
                  id="query-question"
                  type="text"
                  value={queryQuestion}
                  onChange={(e) => setQueryQuestion(e.target.value)}
                  placeholder="e.g. What are the main topics covered?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  disabled={queryLoading}
                />
              </div>

              <button
                type="submit"
                disabled={queryLoading || !queryQuestion.trim()}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {queryLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </form>

            {queryResult && (
              <div className="px-6 pb-6 space-y-4">
                {queryResult.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {queryResult.error}
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        Answer
                      </h3>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap">
                        {queryResult.answer}
                      </div>
                    </div>
                    {queryResult.context_chunks?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">
                          Source chunks
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {queryResult.context_chunks.map((chunk, i) => (
                            <div
                              key={chunk.id}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                            >
                              <span className="text-xs font-medium text-slate-500">
                                Chunk {chunk.chunk_index + 1}
                              </span>
                              <p className="mt-1 line-clamp-3">{chunk.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
