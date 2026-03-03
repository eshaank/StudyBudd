"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import DocumentUpload from "../../components/DocumentUpload";

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
      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 4.5c1.32 0 2.5-.68 2.5-1.5v-1.5c0-.82-1.18-1.5-2.5-1.5S6 13.68 6 14.5V16c0 .82 1.18 1.5 2.5 1.5z" />
      </svg>
    );
  }
  if (fileType === "image") {
    return (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (fileType === "text") {
    return (
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (fileType === "csv") {
    return (
      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l7 7A2 2 0 0119 19z" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

export default function FilesPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");

  // Folders
  const [folders, setFolders] = useState([]);
  const [activeFolderFilter, setActiveFolderFilter] = useState("all"); // "all" | "unfiled" | folder UUID
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [movingDoc, setMovingDoc] = useState(null); // doc id whose move dropdown is open
  const [assigningFolder, setAssigningFolder] = useState(null); // doc id being assigned

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
  const [shareLink, setShareLink] = useState("");
  const [shareTag, setShareTag] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const [copyTagDone, setCopyTagDone] = useState(false);
  const shareInputRef = useRef(null);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadReadyMessage, setUploadReadyMessage] = useState(null);

  const moveDropdownRef = useRef(null);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------
  const fetchDocuments = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setLoading(false); return; }

      const response = await fetch(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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

  const fetchFolders = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const response = await fetch(`${API_URL}/api/folders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, [fetchDocuments, fetchFolders]);

  // -----------------------------------------------------------------------
  // Keyboard / outside-click handlers
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsUploadOpen(false);
        setIsQueryModalOpen(false);
        setIsNewFolderOpen(false);
        setMovingDoc(null);
        setShareDoc(null);
      }
    };
    if (isUploadOpen || isQueryModalOpen || isNewFolderOpen || movingDoc || shareDoc) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isUploadOpen, isQueryModalOpen, isNewFolderOpen, movingDoc, shareDoc]);

  useEffect(() => {
    const handleClick = (e) => {
      if (moveDropdownRef.current && !moveDropdownRef.current.contains(e.target)) {
        setMovingDoc(null);
      }
    };
    if (movingDoc) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [movingDoc]);

  function openShareModal(doc) {
    setShareDoc(doc);
    setShareEmail("");
    setShareRecipients([]);
    setShareLink("");
    setShareTag("");
    setCopyLinkDone(false);
    setCopyTagDone(false);
  }

  function addRecipient(email) {
    setShareRecipients((prev) => [...prev, email]);
    setShareEmail("");
    setShareLink("");
    setShareTag("");
    setCopyLinkDone(false);
    setCopyTagDone(false);
    setTimeout(() => shareInputRef.current?.focus(), 0);
  }

  function addEmailAsRecipient() {
    const email = shareEmail.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToastMessage("Please enter a valid email address.");
      return;
    }

    if (shareRecipients.includes(email)) {
      setShareEmail("");
      return;
    }
    addRecipient(email);
  }

  function removeRecipient(email) {
    setShareRecipients((prev) => prev.filter((r) => r !== email));
    setShareLink("");
    setShareTag("");
    setCopyLinkDone(false);
    setCopyTagDone(false);
  }

  function handleShareEmailKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); addEmailAsRecipient(); }
    if (e.key === "Backspace" && shareEmail === "" && shareRecipients.length > 0) {
      removeRecipient(shareRecipients[shareRecipients.length - 1]);
    }
  }

  async function createShareLink() {
    if (!shareDoc) return null;
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setToastMessage("You must be logged in to share files.");
      return null;
    }

    setShareLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/documents/${shareDoc.id}/share-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient_emails: shareRecipients,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const detail = Array.isArray(errData.detail)
          ? errData.detail.map((x) => x.msg || x).join(", ")
          : errData.detail || "Failed to create share link.";
        setToastMessage(detail);
        return null;
      }

      const data = await res.json();
      const nextShareUrl = data.share_url || "";
      const nextShareTag = data.share_token || "";
      setShareLink(nextShareUrl);
      setShareTag(nextShareTag);
      return { shareUrl: nextShareUrl, shareTag: nextShareTag };
    } catch (err) {
      console.error("Failed to create share link:", err);
      setToastMessage("Failed to create share link.");
      return null;
    } finally {
      setShareLoading(false);
    }
  }

  async function handleCopyLink() {
    let link = shareLink;
    if (!link) {
      const shareData = await createShareLink();
      link = shareData?.shareUrl || "";
    }
    if (!link) return;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopyLinkDone(true);
    setCopyTagDone(false);
    setTimeout(() => setCopyLinkDone(false), 2500);
  }

  async function handleCopyTag() {
    let tag = shareTag;
    if (!tag) {
      const shareData = await createShareLink();
      tag = shareData?.shareTag || "";
    }
    if (!tag) return;
    navigator.clipboard.writeText(tag).catch(() => {});
    setCopyTagDone(true);
    setCopyLinkDone(false);
    setTimeout(() => setCopyTagDone(false), 2500);
  }

  async function handleShare() {
    const shareData = await createShareLink();
    if (!shareData?.shareUrl) return;
    if (shareRecipients.length > 0) {
      setToastMessage(
        `Share link created for ${shareRecipients.length} recipient${shareRecipients.length > 1 ? "s" : ""}.`
      );
      return;
    }
    setToastMessage("Share tag created. Copy and send it to another user.");
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!uploadReadyMessage) return;
    const t = setTimeout(() => setUploadReadyMessage(null), 5000);
    return () => clearTimeout(t);
  }, [uploadReadyMessage]);

  // -----------------------------------------------------------------------
  // Filter + sort
  // -----------------------------------------------------------------------
  const filtered = useMemo(() => {
    let result = [...documents];

    // Folder filter
    if (activeFolderFilter === "unfiled") {
      result = result.filter((d) => !d.folder_id);
    } else if (activeFolderFilter !== "all") {
      result = result.filter((d) => d.folder_id === activeFolderFilter);
    }

    // Search
    const q = query.trim().toLowerCase();
    if (q) result = result.filter((d) => d.original_filename?.toLowerCase().includes(q));

    // Type filter
    if (activeFilter !== "all") result = result.filter((d) => d.file_type === activeFilter);

    // Sort
    switch (sortBy) {
      case "newest": result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case "oldest": result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case "name-asc": result.sort((a, b) => (a.original_filename || "").localeCompare(b.original_filename || "")); break;
      case "name-desc": result.sort((a, b) => (b.original_filename || "").localeCompare(a.original_filename || "")); break;
      case "size": result.sort((a, b) => (b.file_size || 0) - (a.file_size || 0)); break;
    }

    return result;
  }, [documents, query, activeFilter, sortBy, activeFolderFilter]);

  // Doc counts per folder for sidebar badges
  const folderDocCount = useMemo(() => {
    const counts = {};
    documents.forEach((d) => {
      if (d.folder_id) counts[d.folder_id] = (counts[d.folder_id] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const unfiledCount = useMemo(() => documents.filter((d) => !d.folder_id).length, [documents]);

  // -----------------------------------------------------------------------
  // Handlers: upload
  // -----------------------------------------------------------------------
  const handleUploadSuccess = (results) => {
    const newDocs = results.map((r) => r.document);
    setDocuments((prev) => [...newDocs, ...prev]);
    setIsUploadOpen(false);
    if (results.some((r) => r.processing_status === "ready")) {
      setUploadReadyMessage("Documents indexed and ready for questions!");
    }
  };

  // -----------------------------------------------------------------------
  // Handlers: folders
  // -----------------------------------------------------------------------
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`${API_URL}/api/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        setNewFolderName("");
        setIsNewFolderOpen(false);
        setActiveFolderFilter(folder.id);
      } else {
        setToastMessage("Failed to create folder.");
      }
    } catch {
      setToastMessage("Failed to create folder.");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleMoveToFolder = async (docId, folderId) => {
    setAssigningFolder(docId);
    setMovingDoc(null);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`${API_URL}/api/documents/${docId}/folder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, folder_id: updated.folder_id } : d)));
      } else {
        setToastMessage("Failed to move document.");
      }
    } catch {
      setToastMessage("Failed to move document.");
    } finally {
      setAssigningFolder(null);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm("Delete this folder? Documents inside will become unfiled.")) return;
    const accessToken = await getAccessToken();
    const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setDocuments((prev) => prev.map((d) => (d.folder_id === folderId ? { ...d, folder_id: null } : d)));
      if (activeFolderFilter === folderId) setActiveFolderFilter("all");
    }
  };

  // -----------------------------------------------------------------------
  // Handlers: Ask (RAG)
  // -----------------------------------------------------------------------
  const handleAskClick = async (doc) => {
    const accessToken = await getAccessToken();
    if (!accessToken) { setToastMessage("You must be logged in."); return; }
    try {
      const res = await fetch(`${API_URL}/api/processing/${doc.id}/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { setToastMessage("Could not check document status."); return; }
      const data = await res.json();
      if (data.status !== "ready") {
        setToastMessage("This document is not indexed for RAG. Upload TXT or CSV files to enable questions.");
        return;
      }
      setAskDocumentId(doc.id);
      setAskDocumentName(doc.original_filename || "Document");
      setQueryQuestion("");
      setQueryResult(null);
      setIsQueryModalOpen(true);
    } catch {
      setToastMessage("Failed to check document status.");
    }
  };

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ document_id: askDocumentId, question: queryQuestion.trim(), top_k: 5 }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errData.detail)
          ? errData.detail.map((d) => d.msg || d).join(", ")
          : errData.detail || "Query failed.";
        setQueryResult({ error: errMsg });
        return;
      }
      setQueryResult(await res.json());
    } catch {
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

  // -----------------------------------------------------------------------
  // Handlers: delete document
  // -----------------------------------------------------------------------
  const handleDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeleting(documentId);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeleting(null);
    }
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  const activeFolderName = useMemo(() => {
    if (activeFolderFilter === "all") return null;
    if (activeFolderFilter === "unfiled") return "Unfiled";
    return folders.find((f) => f.id === activeFolderFilter)?.name || null;
  }, [activeFolderFilter, folders]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Upload ready banner */}
      {uploadReadyMessage && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl">
          {uploadReadyMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Files Library</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:max-w-xl sm:ml-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Two-column layout: folder sidebar + document list */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ============================================================
            Folder Sidebar
        ============================================================ */}
        <div className="w-full lg:w-56 flex-shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Folders</span>
            <button
              type="button"
              onClick={() => { setIsNewFolderOpen(true); setNewFolderName(""); }}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
              title="New folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <ul className="py-1">
            {/* All Files */}
            <li>
              <button
                type="button"
                onClick={() => setActiveFolderFilter("all")}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeFolderFilter === "all"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="flex-1 text-left">All Files</span>
                <span className="text-xs text-slate-400">{documents.length}</span>
              </button>
            </li>

            {/* Unfiled */}
            <li>
              <button
                type="button"
                onClick={() => setActiveFolderFilter("unfiled")}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeFolderFilter === "unfiled"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="flex-1 text-left">Unfiled</span>
                <span className="text-xs text-slate-400">{unfiledCount}</span>
              </button>
            </li>

            {/* Divider if folders exist */}
            {folders.length > 0 && (
              <li className="mx-4 my-1 border-t border-slate-100" />
            )}

            {/* User folders */}
            {folders.map((folder) => (
              <li key={folder.id} className="group">
                <div className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeFolderFilter === folder.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}>
                  <button
                    type="button"
                    onClick={() => setActiveFolderFilter(folder.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <svg className="w-4 h-4 flex-shrink-0 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                    </svg>
                    <span className="truncate">{folder.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{folderDocCount[folder.id] || 0}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all flex-shrink-0"
                    title="Delete folder"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}

            {/* New folder inline */}
            {isNewFolderOpen && (
              <li className="px-3 py-2">
                <form onSubmit={handleCreateFolder} className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name..."
                    autoFocus
                    className="flex-1 rounded-lg border border-indigo-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={creatingFolder}
                  />
                  <button
                    type="submit"
                    disabled={!newFolderName.trim() || creatingFolder}
                    className="rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creatingFolder ? "..." : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewFolderOpen(false)}
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </form>
              </li>
            )}
          </ul>
        </div>

        {/* ============================================================
            Main document area
        ============================================================ */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Folder breadcrumb */}
          {activeFolderName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <button type="button" onClick={() => setActiveFolderFilter("all")} className="hover:text-indigo-600 transition-colors">
                All Files
              </button>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-semibold text-slate-900">{activeFolderName}</span>
            </div>
          )}

          {/* Filter/Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
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
              <span className="text-sm text-slate-500">
                {filtered.length} of {documents.length} file{documents.length !== 1 ? "s" : ""}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
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
                    : "Try adjusting your search, filters, or folder."}
                </p>
                {documents.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload your first file
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((doc) => {
                  const docFolder = folders.find((f) => f.id === doc.folder_id);
                  return (
                    <li key={doc.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                      {/* File Icon */}
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg">
                        {getFileIcon(doc.file_type)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-slate-900">{doc.original_filename}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-500">
                            {doc.file_type?.toUpperCase()} • {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                          </span>
                          {docFolder && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                              </svg>
                              {docFolder.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 relative">
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

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Move to folder button */}
                        <div className="relative" ref={movingDoc === doc.id ? moveDropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setMovingDoc(movingDoc === doc.id ? null : doc.id)}
                            disabled={assigningFolder === doc.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            title="Move to folder"
                          >
                            {assigningFolder === doc.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                              </svg>
                            )}
                          </button>

                          {movingDoc === doc.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                Move to folder
                              </div>
                              <ul className="py-1 max-h-48 overflow-y-auto">
                                {doc.folder_id && (
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveToFolder(doc.id, null)}
                                      className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                    >
                                      Remove from folder
                                    </button>
                                  </li>
                                )}
                                {folders.length === 0 && (
                                  <li className="px-4 py-2 text-sm text-slate-400 italic">No folders yet</li>
                                )}
                                {folders.map((f) => (
                                  <li key={f.id}>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveToFolder(doc.id, f.id)}
                                      disabled={doc.folder_id === f.id}
                                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                        doc.folder_id === f.id
                                          ? "text-indigo-600 font-semibold bg-indigo-50"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {f.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

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
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          Upload Modal
      ================================================================ */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUploadOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-extrabold text-slate-900">Upload Documents</h2>
              <button type="button" onClick={() => setIsUploadOpen(false)} className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
                  {shareRecipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 pl-2 pr-1 py-0.5 text-xs font-semibold text-indigo-700"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
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
                    placeholder={shareRecipients.length === 0 ? "Enter recipient email..." : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Press Enter to add emails. Use Backspace to remove last.
                </p>
              </div>

              {/* Share tag section */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Share tag
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 truncate select-all font-mono">
                    {shareTag || "Create or copy to generate a share tag"}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTag}
                    disabled={shareLoading}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      copyTagDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {shareLoading ? "Loading..." : copyTagDone ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Copy link section */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Copy link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 truncate select-all">
                    {shareLink || "Create or copy to generate a secure share link"}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={shareLoading}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      copyLinkDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {shareLoading ? "Loading..." : copyLinkDone ? "Copied!" : "Copy"}
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
                disabled={shareLoading}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {shareLoading
                  ? "Creating..."
                  : shareRecipients.length > 0
                  ? `Share (${shareRecipients.length})`
                  : "Create share"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAG Query Modal */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeQueryModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-extrabold text-slate-900">Ask about {askDocumentName}</h2>
              <button type="button" onClick={closeQueryModal} className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleQuerySubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="query-question" className="block text-sm font-semibold text-slate-700 mb-2">
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
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Answer</h3>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap">
                        {queryResult.answer}
                      </div>
                    </div>
                    {queryResult.context_chunks?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Source chunks</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {queryResult.context_chunks.map((chunk) => (
                            <div key={chunk.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                              <span className="text-xs font-medium text-slate-500">Chunk {chunk.chunk_index + 1}</span>
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
