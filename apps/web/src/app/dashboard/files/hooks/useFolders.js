import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../../lib/api";

export default function useFolders({ documents, updateDocument, unfileByFolder }) {
  const [folders, setFolders] = useState([]);
  const [activeFolderFilter, setActiveFolderFilter] = useState("all");
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [movingDoc, setMovingDoc] = useState(null);
  const [assigningFolder, setAssigningFolder] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await api.get("/api/folders");
      setFolders(data.folders || []);
    } catch {
      console.error("Failed to fetch folders");
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleCreateFolder = useCallback(async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const folder = await api.post("/api/folders", { name: newFolderName.trim() });
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName("");
      setIsNewFolderOpen(false);
      setActiveFolderFilter(folder.id);
      return null;
    } catch {
      return "Failed to create folder.";
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName]);

  const handleDeleteFolder = useCallback(async (folderId) => {
    if (!confirm("Delete this folder? Documents inside will become unfiled.")) return null;
    try {
      await api.del(`/api/folders/${folderId}`);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      unfileByFolder(folderId);
      if (activeFolderFilter === folderId) setActiveFolderFilter("all");
      return null;
    } catch {
      return "Failed to delete folder.";
    }
  }, [activeFolderFilter, unfileByFolder]);

  const handleMoveToFolder = useCallback(async (docId, folderId) => {
    setAssigningFolder(docId);
    setMovingDoc(null);
    try {
      const updated = await api.patch(`/api/documents/${docId}/folder`, { folder_id: folderId });
      updateDocument(docId, { folder_id: updated.folder_id });
      return null;
    } catch {
      return "Failed to move document.";
    } finally {
      setAssigningFolder(null);
    }
  }, [updateDocument]);

  const folderDocCount = useMemo(() => {
    const counts = {};
    documents.forEach((d) => {
      if (d.folder_id) counts[d.folder_id] = (counts[d.folder_id] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const unfiledCount = useMemo(
    () => documents.filter((d) => !d.folder_id).length,
    [documents]
  );

  const activeFolderName = useMemo(() => {
    if (activeFolderFilter === "all") return null;
    if (activeFolderFilter === "unfiled") return "Unfiled";
    return folders.find((f) => f.id === activeFolderFilter)?.name || null;
  }, [activeFolderFilter, folders]);

  const openNewFolder = useCallback(() => {
    setIsNewFolderOpen(true);
    setNewFolderName("");
  }, []);

  return {
    folders,
    activeFolderFilter,
    setActiveFolderFilter,
    isNewFolderOpen,
    setIsNewFolderOpen,
    newFolderName,
    setNewFolderName,
    creatingFolder,
    movingDoc,
    setMovingDoc,
    assigningFolder,
    handleCreateFolder,
    handleDeleteFolder,
    handleMoveToFolder,
    folderDocCount,
    unfiledCount,
    activeFolderName,
    openNewFolder,
  };
}
