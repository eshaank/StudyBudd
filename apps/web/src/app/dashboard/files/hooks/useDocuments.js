import { useCallback, useEffect, useState } from "react";
import { api } from "../../../../lib/api";

export default function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api.get("/api/documents");
      setDocuments(data.documents || []);
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocuments = useCallback((newDocs) => {
    setDocuments((prev) => [...newDocs, ...prev]);
  }, []);

  const handleDelete = useCallback(async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeleting(documentId);
    try {
      await api.del(`/api/documents/${documentId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch {
      console.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  }, []);

  const updateDocument = useCallback((docId, updates) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...updates } : d))
    );
  }, []);

  const unfileByFolder = useCallback((folderId) => {
    setDocuments((prev) =>
      prev.map((d) => (d.folder_id === folderId ? { ...d, folder_id: null } : d))
    );
  }, []);

  return {
    documents,
    loading,
    deleting,
    addDocuments,
    handleDelete,
    updateDocument,
    unfileByFolder,
  };
}
