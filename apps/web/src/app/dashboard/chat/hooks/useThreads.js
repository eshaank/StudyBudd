import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

export default function useThreads(accessToken) {
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState("");

  // Delete confirmation
  const [deletePendingId, setDeletePendingId] = useState(null);

  // 3-dot menu
  const [threadMenuId, setThreadMenuId] = useState(null);

  // Rename
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const fetchThreads = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get(`${API_BASE}/chat/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setThreads(res.data);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchThreads();
  }, [accessToken, fetchThreads]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, search]);

  // --- Delete ---
  const openDeleteConfirm = useCallback((e, conversationId) => {
    e.stopPropagation();
    setDeletePendingId(conversationId);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeletePendingId(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!accessToken || !deletePendingId) return;
    const conversationId = deletePendingId;
    setDeletePendingId(null);
    try {
      await axios.delete(`${API_BASE}/chat/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setThreads((prev) => prev.filter((t) => t.id !== conversationId));
      return conversationId;
    } catch (err) {
      console.error("Failed to delete chat:", err);
      return null;
    }
  }, [accessToken, deletePendingId]);

  // --- 3-dot menu ---
  const openThreadMenu = useCallback((e, conversationId) => {
    e.stopPropagation();
    setThreadMenuId((prev) => (prev === conversationId ? null : conversationId));
  }, []);

  const closeThreadMenu = useCallback(() => {
    setThreadMenuId(null);
  }, []);

  // --- Rename ---
  const startRename = useCallback((conversationId, currentTitle) => {
    setRenameId(conversationId);
    setRenameValue(currentTitle || "");
    setThreadMenuId(null);
  }, []);

  const cancelRename = useCallback(() => {
    setRenameId(null);
    setRenameValue("");
  }, []);

  const saveRename = useCallback(async () => {
    if (!accessToken || !renameId || renameValue.trim() === "") return;
    const conversationId = renameId;
    const newTitle = renameValue.trim() || "Untitled";
    setRenameId(null);
    setRenameValue("");
    try {
      await axios.patch(
        `${API_BASE}/chat/conversations/${conversationId}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setThreads((prev) =>
        prev.map((t) => (t.id === conversationId ? { ...t, title: newTitle } : t))
      );
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  }, [accessToken, renameId, renameValue]);

  // --- Outside-click handlers ---
  useEffect(() => {
    function onDocClick(e) {
      if (e.target?.closest?.("[data-thread-menu]")) return;
      setThreadMenuId(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!deletePendingId) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setDeletePendingId(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deletePendingId]);

  return {
    threads,
    filteredThreads,
    search,
    setSearch,
    fetchThreads,
    // Delete
    deletePendingId,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    // Menu
    threadMenuId,
    openThreadMenu,
    closeThreadMenu,
    // Rename
    renameId,
    renameValue,
    setRenameValue,
    startRename,
    cancelRename,
    saveRename,
  };
}
