import { useCallback, useState } from "react";
import { api } from "../../../../lib/api";

export default function useQueryModal() {
  const [askDocumentId, setAskDocumentId] = useState(null);
  const [askDocumentName, setAskDocumentName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const open = useCallback(async (doc) => {
    try {
      const data = await api.get(`/api/processing/${doc.id}/status`);
      if (data.status !== "ready") {
        return "This document is not indexed for RAG. Upload TXT or CSV files to enable questions.";
      }
      setAskDocumentId(doc.id);
      setAskDocumentName(doc.original_filename || "Document");
      setQuestion("");
      setResult(null);
      setIsOpen(true);
      return null;
    } catch {
      return "Failed to check document status.";
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setAskDocumentId(null);
    setAskDocumentName("");
    setQuestion("");
    setResult(null);
  }, []);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    if (!askDocumentId || !question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post("/api/processing/rag/query", {
        document_id: askDocumentId,
        question: question.trim(),
        top_k: 5,
      });
      setResult(data);
    } catch (res) {
      try {
        const errData = await res.json();
        const errMsg = Array.isArray(errData.detail)
          ? errData.detail.map((d) => d.msg || d).join(", ")
          : errData.detail || "Query failed.";
        setResult({ error: errMsg });
      } catch {
        setResult({ error: "Query failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  }, [askDocumentId, question]);

  return {
    isOpen,
    askDocumentName,
    question,
    setQuestion,
    loading,
    result,
    open,
    close,
    submit,
  };
}
