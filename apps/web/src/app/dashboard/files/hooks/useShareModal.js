import { useCallback, useRef, useState } from "react";
import { api } from "../../../../lib/api";

export default function useShareModal({ addNotification }) {
  const [shareDoc, setShareDoc] = useState(null);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const [copyLinkLoading, setCopyLinkLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareError, setShareError] = useState(null);
  const shareInputRef = useRef(null);

  const open = useCallback((doc) => {
    setShareDoc(doc);
    setCopyLinkDone(false);
    setCopyLinkLoading(false);
    setShareLink(null);
    setShareError(null);
  }, []);

  const close = useCallback(() => setShareDoc(null), []);

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

  return {
    shareDoc,
    copyLinkDone,
    copyLinkLoading,
    shareLink,
    shareError,
    shareInputRef,
    open,
    close,
    handleCopyLink,
  };
}
