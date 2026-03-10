import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../../lib/api";
import { DEMO_USERS } from "../../../../constants/files";

export default function useShareModal({ addNotification }) {
  const [shareDoc, setShareDoc] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRecipients, setShareRecipients] = useState([]);
  const [shareSuggestions, setShareSuggestions] = useState([]);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const [copyLinkLoading, setCopyLinkLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(null);
  const shareInputRef = useRef(null);

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

  const open = useCallback((doc) => {
    setShareDoc(doc);
    setShareEmail("");
    setShareRecipients([]);
    setShareSuggestions([]);
    setCopyLinkDone(false);
    setCopyLinkLoading(false);
    setShareLink(null);
    setIsSharing(false);
    setShareError(null);
  }, []);

  const close = useCallback(() => setShareDoc(null), []);

  const addRecipient = useCallback((user) => {
    setShareRecipients((prev) => [...prev, user]);
    setShareEmail("");
    setShareSuggestions([]);
    setTimeout(() => shareInputRef.current?.focus(), 0);
  }, []);

  const addEmailAsRecipient = useCallback(() => {
    const email = shareEmail.trim();
    if (!email) return;
    if (shareRecipients.some((r) => r.email === email)) {
      setShareEmail("");
      return;
    }
    const existing = DEMO_USERS.find((u) => u.email === email);
    if (existing) { addRecipient(existing); return; }
    addRecipient({ id: email, name: email.split("@")[0], email });
  }, [shareEmail, shareRecipients, addRecipient]);

  const removeRecipient = useCallback((id) => {
    setShareRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") { e.preventDefault(); addEmailAsRecipient(); }
    if (e.key === "Backspace" && shareEmail === "" && shareRecipients.length > 0) {
      removeRecipient(shareRecipients[shareRecipients.length - 1].id);
    }
  }, [addEmailAsRecipient, shareEmail, shareRecipients, removeRecipient]);

  const handleCopyLink = useCallback(async () => {
    if (!shareDoc) return;

    // Already generated — just copy again without a new API call.
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).catch(() => {});
      setCopyLinkDone(true);
      setTimeout(() => setCopyLinkDone(false), 2500);
      return;
    }

    setCopyLinkLoading(true);
    setShareError(null);
    try {
      const data = await api.post(`/api/documents/${shareDoc.id}/share-links`, {
        recipient_emails: [],
      });
      setShareLink(data.share_url);
      navigator.clipboard.writeText(data.share_url).catch(() => {});
      setCopyLinkDone(true);
      setTimeout(() => setCopyLinkDone(false), 2500);
    } catch {
      setShareError("Failed to generate share link. Please try again.");
    } finally {
      setCopyLinkLoading(false);
    }
  }, [shareDoc, shareLink]);

  const handleShare = useCallback(async () => {
    if (shareRecipients.length === 0 || !shareDoc) return;

    setIsSharing(true);
    setShareError(null);
    try {
      await api.post(`/api/documents/${shareDoc.id}/share-links`, {
        recipient_emails: shareRecipients.map((r) => r.email),
      });
      shareRecipients.forEach((r) => {
        addNotification(
          `"${shareDoc.original_filename || "file"}" was shared with ${r.name}.`
        );
      });
      const count = shareRecipients.length;
      setShareDoc(null);
      return `Shared with ${count} person${count > 1 ? "s" : ""}.`;
    } catch {
      setShareError("Failed to share document. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }, [shareDoc, shareRecipients, addNotification]);

  return {
    shareDoc,
    shareEmail,
    setShareEmail,
    shareRecipients,
    shareSuggestions,
    copyLinkDone,
    copyLinkLoading,
    shareLink,
    isSharing,
    shareError,
    shareInputRef,
    open,
    close,
    addRecipient,
    removeRecipient,
    handleKeyDown,
    handleCopyLink,
    handleShare,
  };
}
