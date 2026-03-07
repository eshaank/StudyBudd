import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_USERS } from "../../../../constants/files";

export default function useShareModal({ addNotification }) {
  const [shareDoc, setShareDoc] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRecipients, setShareRecipients] = useState([]);
  const [shareSuggestions, setShareSuggestions] = useState([]);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
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

  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/dashboard/files/${shareDoc?.id ?? "shared"}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopyLinkDone(true);
    setTimeout(() => setCopyLinkDone(false), 2500);
  }, [shareDoc]);

  const handleShare = useCallback(() => {
    if (shareRecipients.length === 0) return;
    shareRecipients.forEach((r) => {
      const msg = `Hey @${r.name} received the files. "${shareDoc?.original_filename || "file"}" was shared with you.`;
      addNotification(msg);
    });
    const count = shareRecipients.length;
    setShareDoc(null);
    return `Shared with ${count} person${count > 1 ? "s" : ""}.`;
  }, [shareRecipients, shareDoc, addNotification]);

  return {
    shareDoc,
    shareEmail,
    setShareEmail,
    shareRecipients,
    shareSuggestions,
    copyLinkDone,
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
