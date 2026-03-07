"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotifications } from "../../components/NotificationsContext";

// Hooks
import useDocuments from "./hooks/useDocuments";
import useFolders from "./hooks/useFolders";
import useShareModal from "./hooks/useShareModal";
import useQueryModal from "./hooks/useQueryModal";

// Components
import FolderSidebar from "./components/FolderSidebar";
import FilterSortBar from "./components/FilterSortBar";
import DocumentRow from "./components/DocumentRow";
import UploadModal from "./components/UploadModal";
import ShareModal from "./components/ShareModal";
import AskDocumentModal from "./components/AskDocumentModal";

export default function FilesPage() {
  const { addNotification } = useNotifications();

  // --- Hooks ---
  const {
    documents, loading, deleting,
    addDocuments, handleDelete, updateDocument, unfileByFolder,
  } = useDocuments();

  const folderState = useFolders({ documents, updateDocument, unfileByFolder });

  const share = useShareModal({ addNotification });

  const query = useQueryModal();

  // --- Local UI state ---
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadReadyMessage, setUploadReadyMessage] = useState(null);

  // --- Toast auto-dismiss ---
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

  // --- Escape key handler ---
  useEffect(() => {
    const anyOpen = isUploadOpen || query.isOpen || folderState.isNewFolderOpen || folderState.movingDoc || share.shareDoc;
    if (!anyOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsUploadOpen(false);
        query.close();
        folderState.setIsNewFolderOpen(false);
        folderState.setMovingDoc(null);
        share.close();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isUploadOpen, query, folderState, share]);

  // --- Filter + sort ---
  const filtered = useMemo(() => {
    let result = [...documents];

    if (folderState.activeFolderFilter === "unfiled") {
      result = result.filter((d) => !d.folder_id);
    } else if (folderState.activeFolderFilter !== "all") {
      result = result.filter((d) => d.folder_id === folderState.activeFolderFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter((d) => d.original_filename?.toLowerCase().includes(q));

    if (activeFilter !== "all") result = result.filter((d) => d.file_type === activeFilter);

    switch (sortBy) {
      case "newest": result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case "oldest": result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case "name-asc": result.sort((a, b) => (a.original_filename || "").localeCompare(b.original_filename || "")); break;
      case "name-desc": result.sort((a, b) => (b.original_filename || "").localeCompare(a.original_filename || "")); break;
      case "size": result.sort((a, b) => (b.file_size || 0) - (a.file_size || 0)); break;
    }

    return result;
  }, [documents, searchQuery, activeFilter, sortBy, folderState.activeFolderFilter]);

  // --- Handlers ---
  const handleUploadSuccess = useCallback((results) => {
    addDocuments(results.map((r) => r.document));
    setIsUploadOpen(false);
    if (results.some((r) => r.processing_status === "ready")) {
      setUploadReadyMessage("Documents indexed and ready for questions!");
    }
  }, [addDocuments]);

  const handleFolderAction = useCallback(async (action, ...args) => {
    const error = await action(...args);
    if (error) setToastMessage(error);
  }, []);

  const handleAskClick = useCallback(async (doc) => {
    const error = await query.open(doc);
    if (error) setToastMessage(error);
  }, [query]);

  const handleShareAction = useCallback(() => {
    const msg = share.handleShare();
    if (msg) setToastMessage(msg);
  }, [share]);

  // --- Render ---
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
        <h1 className="text-4xl font-bold text-slate-900">Files Library</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:max-w-xl sm:ml-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <FolderSidebar
          folders={folderState.folders}
          activeFolderFilter={folderState.activeFolderFilter}
          setActiveFolderFilter={folderState.setActiveFolderFilter}
          folderDocCount={folderState.folderDocCount}
          unfiledCount={folderState.unfiledCount}
          documentsCount={documents.length}
          isNewFolderOpen={folderState.isNewFolderOpen}
          setIsNewFolderOpen={folderState.setIsNewFolderOpen}
          newFolderName={folderState.newFolderName}
          setNewFolderName={folderState.setNewFolderName}
          creatingFolder={folderState.creatingFolder}
          onCreateFolder={(e) => handleFolderAction(folderState.handleCreateFolder, e)}
          onDeleteFolder={(id) => handleFolderAction(folderState.handleDeleteFolder, id)}
          onOpenNewFolder={folderState.openNewFolder}
        />

        <div className="flex-1 min-w-0 space-y-3">
          {/* Breadcrumb */}
          {folderState.activeFolderName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <button type="button" onClick={() => folderState.setActiveFolderFilter("all")} className="hover:text-indigo-600 transition-colors">
                All Files
              </button>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-semibold text-slate-900">{folderState.activeFolderName}</span>
            </div>
          )}

          <FilterSortBar
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filteredCount={filtered.length}
            totalCount={documents.length}
          />

          {/* Document list */}
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
                {filtered.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    folder={folderState.folders.find((f) => f.id === doc.folder_id)}
                    folders={folderState.folders}
                    deleting={deleting}
                    assigningFolder={folderState.assigningFolder}
                    movingDoc={folderState.movingDoc}
                    setMovingDoc={folderState.setMovingDoc}
                    onShare={share.open}
                    onMoveToFolder={(docId, folderId) => handleFolderAction(folderState.handleMoveToFolder, docId, folderId)}
                    onAsk={handleAskClick}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isUploadOpen && (
        <UploadModal onClose={() => setIsUploadOpen(false)} onUploadSuccess={handleUploadSuccess} />
      )}

      {share.shareDoc && (
        <ShareModal
          shareDoc={share.shareDoc}
          shareEmail={share.shareEmail}
          setShareEmail={share.setShareEmail}
          shareRecipients={share.shareRecipients}
          shareSuggestions={share.shareSuggestions}
          copyLinkDone={share.copyLinkDone}
          shareInputRef={share.shareInputRef}
          onAddRecipient={share.addRecipient}
          onRemoveRecipient={share.removeRecipient}
          onKeyDown={share.handleKeyDown}
          onCopyLink={share.handleCopyLink}
          onShare={handleShareAction}
          onClose={share.close}
        />
      )}

      {query.isOpen && (
        <AskDocumentModal
          documentName={query.askDocumentName}
          question={query.question}
          setQuestion={query.setQuestion}
          loading={query.loading}
          result={query.result}
          onSubmit={query.submit}
          onClose={query.close}
        />
      )}
    </div>
  );
}
